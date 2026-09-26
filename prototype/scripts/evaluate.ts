import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import loadMujoco from '@mujoco/mujoco';
import {ConnectorEngine} from '../src/engine.ts';
import {DEFAULT_CONFIG,MODEL_VERSION,modelXML} from '../src/model.ts';
import type {Controller,Configuration} from '../src/model.ts';

const mj=await loadMujoco();
const target=resolve(process.argv[2]??'evaluation');
await mkdir(target,{recursive:true});
function run(engine:ConnectorEngine,controller:Controller){engine.start(controller);for(let i=0;i<4000&&engine.phase!=='complete';i++)engine.advance(100);if(engine.phase!=='complete')throw new Error('Trial failed to terminate');return engine.trials.at(-1)!;}
const demo=new ConnectorEngine(mj);
const traces=[run(demo,'fixed'),run(demo,'search'),run(demo,'reuse')];
for(const fault of ['open','latch'] as const){demo.configure({...DEFAULT_CONFIG,offsetX:0,offsetY:0,yaw:0,fault});traces.push(run(demo,'fixed'));}
const evidence={createdAt:new Date().toISOString(),engine:'MuJoCo 3.14.0',model:MODEL_VERSION,status:'Illustrative simulation. No physical measurements. Deterministic ring search, not neural learning.',trials:traces};
await writeFile(resolve(target,'demo-traces.json'),JSON.stringify(evidence,null,2));
await writeFile(resolve(target,'connector.xml'),modelXML(DEFAULT_CONFIG));
demo.dispose();
let seed=29092026;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const cases:Configuration[]=[];
for(const variant of ['six','eight'] as const)for(let i=0;i<16;i++)cases.push({...DEFAULT_CONFIG,variant,offsetX:(random()*4-2),offsetY:(random()*4-2),yaw:random()*10-5,friction:.1+random()*.7});
const results=[];
for(const config of cases){const e=new ConnectorEngine(mj,config);for(const controller of ['fixed','search'] as const){const {samples,...result}=run(e,controller);results.push(result);}e.dispose();}
const summary={seed:29092026,caseCount:cases.length,ranges:{xy_mm:[-2,2],yaw_deg:[-5,5],friction:[.1,.8]},limitations:'Uniform synthetic perturbations, illustrative geometry, ideal electrical and latch tests. This small deterministic check is not a manufacturing reliability benchmark or evidence of cross-part policy transfer.',fixedAccepted:results.filter(r=>r.controller==='fixed'&&r.accepted).length,searchAccepted:results.filter(r=>r.controller==='search'&&r.accepted).length,results};
await writeFile(resolve(target,'perturbation-check.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({target,demo:traces.map(({controller,accepted,probes,duration,reason})=>({controller,accepted,probes,duration,reason})),cases:cases.length,fixed:summary.fixedAccepted,search:summary.searchAccepted},null,2));
