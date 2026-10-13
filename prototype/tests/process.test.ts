import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,processRecord,recoveryStart,CYCLE_STEPS,NEST,TURNOVER,REJECT,HEADER,FIT,EXAMPLE_LIMITS } from '../src/process.ts';
import type { CycleCase } from '../src/process.ts';
import { solveArm,UPPER,FORE } from '../src/cobot.ts';
import { createCell } from '../src/cell-geometry.ts';
const cases:CycleCase[]=['search','latched','half-seat','open','short'];
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((x,i)=>x-b[i]));

test('the guideline sequence puts the pull before continuity and release',()=>{
  assert.deepEqual(CYCLE_STEPS.map(s=>s[1]),[0,10,20,30,40,50,60,75,85,95]);
  assert.equal(processFrame(80).step,7);assert.equal(processFrame(90).step,8);assert.equal(processFrame(99).step,9);
});
test('the face-up load turns over only while supported by the cradle and clear of the open gripper',()=>{
  assert.equal(processFrame(0).rotation,Math.PI);assert.deepEqual(processFrame(0).plug,[...NEST]);
  for(let p=34;p<=36;p+=.025){const f=processFrame(p);assert.deepEqual(f.plug,[...TURNOVER]);assert.equal(f.jaw,1);assert.ok(f.tool[2]-f.plug[2]>=61);}
  assert.equal(processFrame(40).rotation,0);assert.equal(processFrame(38).jaw,0);
});
test('all process paths are finite, continuous and within rigid-arm reach',()=>{
  for(const kind of cases){
    let previous=processFrame(0,kind);
    for(let i=1;i<=10000;i++){
      const f=processFrame(i/100,kind);
      assert.ok([...f.tool,...f.plug,f.rotation,f.jaw].every(Number.isFinite));
      assert.ok(distance(f.tool,previous.tool)<3,`${kind} tool jump at ${i/100}`);
      assert.ok(distance(f.plug,previous.plug)<3,`${kind} plug jump at ${i/100}`);
      const pose=solveArm(new T.Vector3(...f.tool).add(new T.Vector3(0,0,80)).divideScalar(5));
      assert.ok(pose.reach<.98,`${kind} unreachable at ${i/100}`);
      assert.ok(Math.abs(pose.shoulder.distanceTo(pose.elbow)-UPPER)<1e-6);
      assert.ok(Math.abs(pose.elbow.distanceTo(pose.wrist)-FORE)<1e-6);
      previous=f;
    }
  }
});
test('a passing cycle leaves the connector seated while the open tool retracts',()=>{
  for(const kind of ['search','latched'] as const){const f=processFrame(100,kind);assert.equal(f.accepted,true);assert.equal(f.seated,'pass');assert.equal(f.pull,'pass');assert.ok(f.contacts.every(x=>x==='pass'));assert.deepEqual(f.plug,[...FIT,15.1]);assert.ok(Math.hypot(f.plug[0]-HEADER[0],f.plug[1]-HEADER[1])<.1);assert.equal(f.jaw,1);assert.ok(f.tool[2]-f.plug[2]>60);}
});
test('a half-seat, open contact or short retries once and is never accepted',()=>{
  for(const kind of ['half-seat','open','short'] as const){for(let i=0;i<=1000;i++)assert.notEqual(processFrame(i/10,kind).accepted,true);const f=processFrame(100,kind);assert.equal(f.accepted,false);assert.equal(f.retry,1);assert.equal(f.rejected,true);assert.equal(f.depth,0);assert.deepEqual(f.plug,[...REJECT]);assert.equal(kind==='half-seat'?f.pull:f.contacts[kind==='open'?2:1],'fail');}
});
test('every recovery shift occurs with the plug above the blocked height',()=>{
  let previous=processFrame(60);
  for(let p=60.01;p<74;p+=.01){const f=processFrame(p);if(Math.hypot(f.tool[0]-previous.tool[0],f.tool[1]-previous.tool[1])>1e-6)assert.ok(f.tool[2]>29.99);previous=f;}
});
test('search visits twelve equally spaced points on its first ring, then expands and seats',()=>{
  const points=Array.from({length:14},(_,i)=>processFrame(60+i+.99));
  assert.equal(points.at(-1)!.tries,15);
  for(let i=0;i<12;i++){
    const [x,y]=points[i].tool;assert.ok(Math.abs(Math.hypot(x,y)-.7)<1e-9);
    if(i>0){const [px,py]=points[i-1].tool;assert.ok(Math.abs((px*x+py*y)/(.7*.7)-Math.cos(Math.PI/6))<1e-9);}
  }
  assert.ok(Math.abs(Math.hypot(...points[12].tool.slice(0,2))-1.4)<1e-9);
  assert.equal(points.at(-1)!.seated,'pass');
});
test('each retry clears previous outcomes and runs seating, pull, then electrical checks',()=>{
  for(const kind of ['half-seat','open','short'] as const){
    const start=recoveryStart(kind)!;
    const frame=(u:number)=>processFrame(start+(100-start)*u,kind);
    const before=processFrame(start-.01,kind);assert.ok(before.pull==='fail'||before.contacts.includes('fail'));
    for(const u of [0,.1,.23,.4]){
      const f=frame(u);assert.equal(f.seated,'pending');assert.equal(f.pull,'pending');assert.ok(f.contacts.every(c=>c==='pending'));assert.equal(f.accepted,null);
    }
    const seated=frame(.42);assert.equal(seated.seated,'pass');assert.equal(seated.pull,'pending');assert.ok(seated.contacts.every(c=>c==='pending'));
    const pulled=frame(.581);assert.equal(pulled.pull,kind==='half-seat'?'fail':'pass');assert.ok(pulled.contacts.every(c=>c==='pending'));
    if(kind==='half-seat')assert.ok(frame(.67).contacts.every(c=>c==='pending'));
    else {assert.equal(frame(.589).contacts[0],'pass');assert.ok(frame(.67).contacts.includes('fail'));}
  }
});
test('an electrical fault stops further testing and identifies the affected contacts',()=>{
  const open=processFrame(89,'open');assert.deepEqual(open.contacts,['pass','pass','fail','pending','pending','pending']);assert.equal(open.contactFaults[2],'open');
  const short=processFrame(87.5,'short');assert.deepEqual(short.contacts,['pass','fail','pending','pending','fail','pending']);assert.equal(short.contactFaults[1],'short to 5');assert.equal(short.contactFaults[4],'short to 2');
});
test('example force limits bound every attempt and extraction, with no pull before seating',()=>{
  for(const kind of cases)for(let p=0;p<=100;p+=.05){
    const f=processFrame(p,kind);
    assert.ok(f.force>=0&&f.force<=EXAMPLE_LIMITS.press);assert.ok(f.pullForce>=0&&f.pullForce<=EXAMPLE_LIMITS.pull);assert.ok(f.extractionForce>=0&&f.extractionForce<=EXAMPLE_LIMITS.extraction);
    if(f.pullForce>0)assert.equal(f.seated,'pass');
  }
});
test('a release opens the fingers before moving away, on both pass and reject',()=>{
  for(const kind of ['search','latched'] as const){const start=processFrame(95,kind),open=processFrame(96.5,kind),lifted=processFrame(99,kind);assert.equal(start.jaw,0);assert.equal(open.jaw,1);assert.deepEqual(open.tool,start.tool);assert.ok(lifted.tool[2]>open.tool[2]);assert.deepEqual(lifted.plug,start.plug);}
  for(const kind of ['half-seat','open','short'] as const){const start=recoveryStart(kind)!;const open=processFrame(start+(100-start)*.976,kind);assert.equal(open.jaw,1);assert.deepEqual(open.plug,[...REJECT]);}
});
test('unit records retain both failed attempts and complete force traces without saving a rejected offset',()=>{
  for(const kind of cases){
    const record=processRecord(3,kind,'2026-10-12T00:00:00.000Z');assert.equal(record.source,'scripted illustration');assert.equal(record.id,3);assert.equal(record.trace.length,1001);
    const failed=['half-seat','open','short'].includes(kind);assert.equal(record.attempts.length,failed?2:1);assert.equal(record.accepted,!failed);assert.equal(record.correction===null,failed);
    for(const attempt of record.attempts){assert.equal(attempt.seated,'pass');assert.equal(attempt.result,failed?'failed':'accepted');if(kind==='half-seat'){assert.equal(attempt.pull,'fail');assert.ok(attempt.contacts.every(c=>c==='pending'));}else {assert.equal(attempt.pull,'pass');assert.equal(attempt.contacts.includes('fail'),failed);}}
  }
});
test('the actual rendered fingers clear the header when seated, with six connected harness wires',()=>{
  const cell=createCell();cell.tool.root.position.set(1.2,.65,15.1);cell.root.updateMatrixWorld(true);
  const headerTop=new T.Box3().setFromObject(cell.housing).max.z;
  for(const finger of cell.tool.fingers){const bottom=new T.Box3().setFromObject(finger).min.z;assert.ok(bottom>headerTop,`finger ${bottom} versus header ${headerTop}`);}
  assert.equal(cell.wires.length,6);assert.equal(cell.tool.fingers.length,2);
});
test('the blocked connector visibly reaches the header edge rather than hovering above it',()=>{
  const cell=createCell(),f=processFrame(59);cell.plug.position.set(...f.plug);cell.header.position.set(...HEADER,0);cell.root.updateMatrixWorld(true);
  const header=new T.Box3().setFromObject(cell.housing),plug=new T.Box3().setFromObject(cell.plug);
  assert.ok(Math.abs(header.max.z-22)<1e-5);assert.ok(plug.min.z<=header.max.z);assert.ok(plug.min.z>header.max.z-.3);assert.ok(plug.intersectsBox(header));assert.equal(f.seated,'pending');
});
