import loadMujoco from '@mujoco/mujoco';
import wasmUrl from '@mujoco/mujoco/mujoco.wasm?url';
import { ConnectorEngine } from './engine.ts';
import { MODEL_VERSION, modelXML } from './model.ts';

let engine: ConnectorEngine | null = null;
let playing = false;
let speed = 2;
let last = performance.now();
let remainder = 0;
let lastCompleted = 0;
let sentSamples = 0;
let epoch = 0;
let sampleBuffer: ConnectorEngine['samples'] | null = null;

function publish() {
  if (!engine) return;
  if (sampleBuffer !== engine.samples) { sampleBuffer=engine.samples;sentSamples=0;epoch++; }
  postMessage({type:'state',state:engine.snapshot(),samples:engine.samples.slice(sentSamples),epoch,playing,speed});
  sentSamples=engine.samples.length;
}

function failure(error: unknown) {
  playing=false;
  postMessage({type:'error',message:error instanceof Error ? error.message : String(error)});
}

self.onmessage = async ({data}) => {
  try {
    if (data.type === 'init') {
      if (engine) return;
      const mj = await loadMujoco({locateFile:(path:string) => path.endsWith('.wasm') ? wasmUrl : path});
      engine = new ConnectorEngine(mj,data.config);
      postMessage({type:'ready',version:MODEL_VERSION}); publish(); return;
    }
    if (!engine) return;
    if (data.type === 'config') { playing=false; engine.configure(data.config); }
    if (data.type === 'run') { engine.start(data.controller); playing=true; remainder=0; last=performance.now(); }
    if (data.type === 'pause') playing=false;
    if (data.type === 'resume') { playing=true; last=performance.now(); }
    if (data.type === 'reset') { playing=false; engine.resetState(); }
    if (data.type === 'speed') speed=data.speed===2?2:data.speed===4?4:1;
    if (data.type === 'forget') { engine.calibration=null; }
    if (data.type === 'export') postMessage({
      type:'export', report:{
        title:'Defex connector lab — simulation records', exportedAt:new Date().toISOString(),
        engine:'MuJoCo 3.14.0 WASM', modelVersion:MODEL_VERSION,
        limits:'Illustrative rigid connector and cartesian tool. Electrical continuity is a depth/fault model. Retention is an ideal constraint activated at seating. No real robot, sensor data, material deformation, damage, wear or manufacturing validation. Search calibrates an XY correction; it is not a trained neural policy.',
        currentModelXML:modelXML(engine.config), calibration:engine.calibration, trials:engine.trials,
      },
    });
    publish();
  } catch(error) { failure(error); }
};

setInterval(() => {
  if (!engine || !playing) return;
  try {
    const now=performance.now();
    remainder+=Math.min((now-last)/1000,0.06)*speed;
    last=now;
    const steps=Math.floor(remainder/0.0005);
    remainder-=steps*0.0005;
    engine.advance(steps);
    if (engine.phase==='complete') {
      playing=false;
      if (engine.trials.length>lastCompleted) {
        lastCompleted=engine.trials.length;
        postMessage({type:'trial',trial:engine.completedTrial});
      }
    }
    publish();
  } catch(error) { failure(error); }
},1000/30);
