import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,processRecord,recoveryStart,seatPoints,CYCLE_STEPS,NEST,TURNOVER,REJECT,HEADER,HOME,FIT,VISION,SEARCH_POINTS,SEATED,HALF_SEATED,CLEAR,EXAMPLE_LIMITS } from '../src/process.ts';
import type { CycleCase } from '../src/process.ts';
import { solveArm,UPPER,FORE } from '../src/cobot.ts';
import { createCell } from '../src/cell-geometry.ts';
const cases:CycleCase[]=['search','latched','half-seat','open','short'];
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((x,i)=>x-b[i]));

test('the guideline sequence puts the pull before continuity and release',()=>{
  assert.deepEqual(CYCLE_STEPS.map(s=>s[1]),[0,10,20,30,40,50,56,66,76,90]);
  assert.equal(processFrame(70).step,7);assert.equal(processFrame(80).step,8);assert.equal(processFrame(99).step,9);
});
test('the face-up load turns over only while supported by the cradle and clear of the open gripper',()=>{
  assert.equal(processFrame(0).rotation,Math.PI);assert.deepEqual(processFrame(0).plug,[...NEST]);
  for(let p=34;p<=36;p+=.025){const f=processFrame(p);assert.deepEqual(f.plug,[...TURNOVER]);assert.equal(f.jaw,1);assert.equal(f.cradleGrip,0);assert.ok(f.tool[2]-f.plug[2]>=61);}
  assert.equal(processFrame(40).rotation,0);assert.equal(processFrame(38).jaw,0);
  // the cradle clamps only after the housing has arrived, and lets go only after the fingers close
  assert.ok(processFrame(31.99).cradleGrip>0);assert.equal(processFrame(31.99).jaw,0);
  assert.equal(processFrame(32.3).cradleGrip,0);assert.equal(processFrame(32.3).jaw,0);
  assert.equal(processFrame(38).jaw,0);assert.ok(processFrame(38.2).cradleGrip>0);
});
test('the pick and the cradle are approached straight down from a hover point',()=>{
  for(const [from,to] of [[23,25],[31.4,32]] as const){
    const a=processFrame(from),b=processFrame(to);
    for(let p=from;p<=to;p+=.01){const f=processFrame(p);assert.ok(Math.hypot(f.tool[0]-b.tool[0],f.tool[1]-b.tool[1])<1e-9,`not vertical at ${p}`);}
    assert.ok(a.tool[2]-b.tool[2]>40);
  }
});
test('all process paths are finite, continuous and within rigid-arm reach',()=>{
  for(const kind of cases){
    let previous=processFrame(0,kind),pose=solveArm(new T.Vector3(...previous.tool).add(new T.Vector3(0,0,80)).divideScalar(5));
    for(let i=1;i<=10000;i++){
      const f=processFrame(i/100,kind);
      assert.ok([...f.tool,...f.plug,f.rotation,f.jaw,f.latch].every(Number.isFinite));
      assert.ok(distance(f.tool,previous.tool)<3,`${kind} tool jump at ${i/100}`);
      assert.ok(distance(f.plug,previous.plug)<3,`${kind} plug jump at ${i/100}`);
      const yaw=pose.yaw;solveArm(new T.Vector3(...f.tool).add(new T.Vector3(0,0,80)).divideScalar(5),pose);
      assert.ok(Math.abs(pose.yaw-yaw)<.01,`${kind} base turns ${pose.yaw-yaw} at ${i/100}`);
      assert.ok(pose.reach<.9,`${kind} unreachable at ${i/100}`);
      assert.ok(Math.abs(pose.shoulder.distanceTo(pose.elbow)-UPPER)<1e-6);
      assert.ok(Math.abs(pose.elbow.distanceTo(pose.wrist)-FORE)<1e-6);
      previous=f;
    }
  }
});
test('the plug moves only in a closed hand and the hand starts and ends at home',()=>{
  for(const kind of cases){
    let previous=processFrame(0,kind);
    for(let i=1;i<=10000;i++){
      const f=processFrame(i/100,kind);
      if(distance(f.plug,previous.plug)>1e-9)assert.ok(f.jaw<1e-6&&previous.jaw<1e-6,`${kind} plug moves with open fingers at ${i/100}`);
      if(f.jaw<1e-6&&(f.rotation===0||f.rotation===Math.PI)){const offset=f.rotation?4.3:0;assert.ok(distance(f.plug,[f.tool[0],f.tool[1],f.tool[2]+offset])<1e-6,`${kind} closed hand without the plug at ${i/100}`);}
      previous=f;
    }
    assert.deepEqual(processFrame(0,kind).tool,[...HOME]);assert.ok(distance(processFrame(100,kind).tool,HOME)<1e-9);
  }
});
test('a passing cycle leaves the connector seated while the open tool retracts and returns home',()=>{
  for(const kind of ['search','latched'] as const){const f=processFrame(100,kind);assert.equal(f.accepted,true);assert.equal(f.seated,'pass');assert.equal(f.pull,'pass');assert.ok(f.contacts.every(x=>x==='pass'));assert.deepEqual(f.plug,[...FIT,SEATED]);assert.ok(Math.hypot(f.plug[0]-HEADER[0],f.plug[1]-HEADER[1])<.1);assert.equal(f.jaw,1);assert.ok(f.tool[2]-f.plug[2]>60);}
});
test('a half-seat, open contact or short retries once and is never accepted',()=>{
  for(const kind of ['half-seat','open','short'] as const){for(let i=0;i<=1000;i++)assert.notEqual(processFrame(i/10,kind).accepted,true);const f=processFrame(100,kind);assert.equal(f.accepted,false);assert.equal(f.retry,1);assert.equal(f.rejected,true);assert.equal(f.depth,0);assert.deepEqual(f.plug,[...REJECT]);assert.equal(kind==='half-seat'?f.pull:f.contacts[kind==='open'?2:1],'fail');}
});
test('the approach aims at the camera estimate and every lateral shift happens clear of the header',()=>{
  assert.ok(distance(SEARCH_POINTS[0],VISION)<1e-9);assert.ok(distance(FIT,HEADER)<.06);
  for(const kind of ['search','half-seat','open','short'] as const){
    const blocked=processFrame(55,kind);assert.ok(distance(blocked.tool.slice(0,2),VISION)<1e-9);assert.equal(blocked.seated,'pending');
    let previous=processFrame(50,kind);
    for(let p=50.01;p<66;p+=.01){const f=processFrame(p,kind);if(Math.hypot(f.tool[0]-previous.tool[0],f.tool[1]-previous.tool[1])>1e-6)assert.ok(f.tool[2]>CLEAR-.01);previous=f;}
    assert.equal(processFrame(65,kind).tries,2);
  }
  assert.ok(distance(processFrame(52,'latched').tool.slice(0,2),FIT)<1e-9);
});
test('the saved correction seats on the first press and the latched case skips the search step',()=>{
  const steps=new Set(Array.from({length:1001},(_,i)=>processFrame(i/10,'latched').step));
  assert.ok(!steps.has(6));assert.equal(processFrame(56,'latched').seated,'pass');assert.equal(processFrame(56,'latched').tries,1);
  assert.deepEqual(seatPoints('latched'),[56]);
  for(let p=56;p<=100;p+=.5){const f=processFrame(p,'latched');assert.ok(f.force>0||f.pullForce>0||f.contacts.some(c=>c!=='pass')||f.progress>=83,`idle at ${p}`);}
});
test('a half-seat stops short with no latch drop, then moves under the pull',()=>{
  const press=Array.from({length:401},(_,i)=>processFrame(60+i/100,'half-seat'));
  const peak=Math.max(...press.map(f=>f.force)),after=press.findIndex(f=>f.force===peak);
  assert.ok(press.slice(0,after).every((f,i)=>i===0||f.force>=press[i-1].force-1e-9),'force rises without a drop');
  assert.ok(Math.abs(processFrame(65.9,'half-seat').tool[2]-HALF_SEATED)<1e-9);assert.equal(processFrame(65.9,'half-seat').seated,'pending');
  const pulled=processFrame(73.5,'half-seat');assert.equal(pulled.pull,'fail');assert.equal(pulled.seated,'fail');assert.ok(pulled.plug[2]-HALF_SEATED>1.7);
  // a full seat shows the latch drop
  const seat=Array.from({length:401},(_,i)=>processFrame(60+i/100,'search').force),top=Math.max(...seat);
  assert.ok(seat.slice(seat.indexOf(top)).some(v=>v<top-2));
});
test('each retry clears previous outcomes and runs seating, pull, then electrical checks',()=>{
  for(const kind of ['half-seat','open','short'] as const){
    const start=recoveryStart(kind)!,half=kind==='half-seat';
    const frame=(u:number)=>processFrame(start+(100-start)*u,kind);
    const before=processFrame(start-.01,kind);assert.ok(before.pull==='fail'||before.contacts.includes('fail'));
    for(const u of [0,.1,.18,.3]){
      const f=frame(u);assert.equal(f.seated,'pending');assert.equal(f.pull,'pending');assert.ok(f.contacts.every(c=>c==='pending'));assert.equal(f.accepted,null);
    }
    const seated=frame(.33);assert.equal(seated.seated,half?'pending':'pass');assert.equal(seated.pull,'pending');assert.ok(seated.contacts.every(c=>c==='pending'));
    const pulled=frame(.441);assert.equal(pulled.pull,half?'fail':'pass');assert.ok(pulled.contacts.every(c=>c==='pending'));
    if(half)assert.ok(frame(.55).contacts.every(c=>c==='pending'));
    else {assert.equal(frame(.475).contacts[0],'pass');assert.ok(frame(.55).contacts.includes('fail'));}
  }
});
test('an electrical fault stops further testing and identifies the affected contacts',()=>{
  const open=processFrame(81.5,'open');assert.deepEqual(open.contacts,['pass','pass','fail','pending','pending','pending']);assert.equal(open.contactFaults[2],'open');
  const short=processFrame(79.5,'short');assert.deepEqual(short.contacts,['pass','fail','pending','pending','fail','pending']);assert.equal(short.contactFaults[1],'short to 5');assert.equal(short.contactFaults[4],'short to 2');
});
test('example force limits bound every attempt and extraction, with no pull before a completed press',()=>{
  for(const kind of cases)for(let p=0;p<=100;p+=.05){
    const f=processFrame(p,kind);
    assert.ok(f.force>=0&&f.force<=EXAMPLE_LIMITS.press);assert.ok(f.pullForce>=0&&f.pullForce<=EXAMPLE_LIMITS.pull);assert.ok(f.extractionForce>=0&&f.extractionForce<=EXAMPLE_LIMITS.extraction);
    if(f.pullForce>0)assert.ok(f.seated==='pass'||kind==='half-seat',`${kind} pull before seating at ${p}`);
  }
});
test('a latched plug is only lifted out with its latch held released, above the pull-test force',()=>{
  for(const kind of ['open','short'] as const){
    let peak=0,previous=processFrame(0,kind);
    for(let i=1;i<=10000;i++){
      const p=i/100,f=processFrame(p,kind);
      if(f.plug[2]>previous.plug[2]+1e-9&&f.plug[2]<22&&distance(f.plug.slice(0,2),FIT)<1e-6)assert.equal(f.latch,1,`${kind} pulled out latched at ${p}`);
      peak=Math.max(peak,f.extractionForce);previous=f;
    }
    assert.ok(peak>EXAMPLE_LIMITS.pull,`${kind} extraction ${peak} N`);
  }
  for(let p=0;p<=100;p+=.1)assert.equal(processFrame(p,'half-seat').latch,0);
});
test('a release opens the fingers before moving away, on both pass and reject',()=>{
  for(const kind of ['search','latched'] as const){const start=processFrame(kind==='search'?90:87,kind),open=processFrame(kind==='search'?91.5:89,kind),lifted=processFrame(99,kind);assert.equal(start.jaw,0);assert.ok(open.jaw>.999);assert.ok(distance(open.tool,start.tool)<1e-6);assert.ok(lifted.tool[2]>open.tool[2]);assert.deepEqual(lifted.plug,start.plug);}
  for(const kind of ['half-seat','open','short'] as const){const start=recoveryStart(kind)!;const open=processFrame(start+(100-start)*.83,kind);assert.equal(open.jaw,1);assert.deepEqual(open.tool,[...REJECT]);assert.deepEqual(open.plug,[...REJECT]);}
});
test('unit records retain both failed attempts and complete force traces without saving a rejected offset',()=>{
  for(const kind of cases){
    const record=processRecord(3,kind,'2026-10-12T00:00:00.000Z');assert.equal(record.source,'scripted illustration');assert.equal(record.id,3);assert.equal(record.trace.length,1001);
    const failed=['half-seat','open','short'].includes(kind);assert.equal(record.attempts.length,failed?2:1);assert.equal(record.accepted,!failed);assert.equal(record.correction===null,failed);
    for(const attempt of record.attempts){assert.equal(attempt.seated,kind==='half-seat'?'fail':'pass');assert.equal(attempt.result,failed?'failed':'accepted');if(kind==='half-seat'){assert.equal(attempt.pull,'fail');assert.ok(attempt.contacts.every(c=>c==='pending'));}else {assert.equal(attempt.pull,'pass');assert.equal(attempt.contacts.includes('fail'),failed);}}
  }
});
test('the fingers grip 5 mm of the housing and still clear the header when seated',()=>{
  const cell=createCell();cell.tool.root.position.set(...FIT,SEATED);cell.plug.position.set(...FIT,SEATED);cell.root.updateMatrixWorld(true);
  const headerTop=new T.Box3().setFromObject(cell.housing).max.z,plugTop=new T.Box3().setFromObject(cell.plug.children[0]).max.z;
  for(const finger of cell.tool.fingers){
    const bottom=new T.Box3().setFromObject(finger).min.z;assert.ok(bottom>headerTop,`finger ${bottom} versus header ${headerTop}`);
    const face=new T.Box3().setFromObject(finger.getObjectByName('Housing contact face')!);assert.ok(Math.min(face.max.z,plugTop)-face.min.z>5);
  }
  assert.equal(cell.wires.length,6);assert.equal(cell.tool.fingers.length,2);
});
test('the blocked connector visibly reaches the header edge rather than hovering above it',()=>{
  const cell=createCell(),f=processFrame(55);cell.plug.position.set(...f.plug);cell.header.position.set(...HEADER,0);cell.root.updateMatrixWorld(true);
  const header=new T.Box3().setFromObject(cell.housing),plug=new T.Box3().setFromObject(cell.plug);
  assert.ok(Math.abs(header.max.z-18)<1e-5);assert.ok(plug.min.z<=header.max.z);assert.ok(plug.min.z>header.max.z-.3);assert.ok(plug.intersectsBox(header));assert.equal(f.seated,'pending');
});
