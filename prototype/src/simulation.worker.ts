import loadMujoco from '@mujoco/mujoco';
import wasmUrl from '@mujoco/mujoco/mujoco.wasm?url';
import { ConnectorEngine } from './engine.ts';
import { MODEL_VERSION, modelXML } from './model.ts';

// Fetch and compile the physics engine as soon as the worker starts, while the
// page is still building its 3D scene; 'init' only waits for it.
const mujoco = loadMujoco({locateFile:(path:string) => path.endsWith('.wasm') ? wasmUrl : path});
mujoco.catch(() => {});

let engine: ConnectorEngine | null = null;
let playing = false;
let timer: ReturnType<typeof setInterval> | null = null;
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

// The clock only ticks while something is moving.
function setPlaying(on: boolean) {
  playing=on;
  if (on) { last=performance.now(); timer??=setInterval(tick,1000/30); }
  else if (timer) { clearInterval(timer); timer=null; }
}

function failure(error: unknown) {
  setPlaying(false);
  postMessage({type:'error',message:error instanceof Error ? error.message : String(error)});
}

self.onmessage = async ({data}) => {
  try {
    if (data.type === 'init') {
      if (engine) return;
      engine = new ConnectorEngine(await mujoco,data.config);
      postMessage({type:'ready',version:MODEL_VERSION}); publish(); return;
    }
    if (!engine) return;
    if (data.type === 'config') { setPlaying(false); engine.configure(data.config); }
    if (data.type === 'run') {
      // The demo sends each step's setup with its run, so no idle frame shows in between.
      if (data.config) engine.configure(data.config);
      engine.start(data.controller); remainder=0; setPlaying(true);
    }
    if (data.type === 'pause') setPlaying(false);
    if (data.type === 'resume') setPlaying(true);
    if (data.type === 'reset') { engine.stop(); setPlaying(engine.phase!=='ready'); }
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

function tick() {
  if (!engine || !playing) return;
  try {
    const now=performance.now();
    remainder+=Math.min((now-last)/1000,0.06)*speed;
    last=now;
    const steps=Math.floor(remainder/0.0005);
    remainder-=steps*0.0005;
    engine.advance(steps);
    if (engine.phase==='complete') {
      setPlaying(false);
      if (engine.trials.length>lastCompleted) {
        lastCompleted=engine.trials.length;
        postMessage({type:'trial',trial:engine.completedTrial});
      }
    }
    if (engine.phase==='ready') setPlaying(false);
    publish();
  } catch(error) { failure(error); }
}
