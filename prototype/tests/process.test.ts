import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { processFrame,CYCLE_STEPS,NEST,TURNOVER,REJECT } from '../src/process.ts';
import type { CycleCase } from '../src/process.ts';
import { solveArm,UPPER,FORE } from '../src/cobot.ts';
import { createCell } from '../src/cell-geometry.ts';
const cases:CycleCase[]=['search','latched','half-seat','open'];
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
test('all four process paths are finite, continuous and within rigid-arm reach',()=>{
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
  for(const kind of ['search','latched'] as const){const f=processFrame(100,kind);assert.equal(f.accepted,true);assert.equal(f.seated,'pass');assert.equal(f.pull,'pass');assert.ok(f.contacts.every(x=>x==='pass'));assert.deepEqual(f.plug,[1.2,.65,15.1]);assert.equal(f.jaw,1);assert.ok(f.tool[2]-f.plug[2]>60);}
});
test('a half-seat or open contact retries once and is never accepted',()=>{
  for(const kind of ['half-seat','open'] as const){for(let i=0;i<=1000;i++)assert.notEqual(processFrame(i/10,kind).accepted,true);const f=processFrame(100,kind);assert.equal(f.accepted,false);assert.equal(f.retry,1);assert.equal(f.rejected,true);assert.equal(f.depth,0);assert.deepEqual(f.plug,[...REJECT]);assert.equal(kind==='half-seat'?f.pull:f.contacts[2],'fail');}
});
test('every recovery shift occurs with the plug above the blocked height',()=>{
  let previous=processFrame(60);
  for(let p=60.01;p<72;p+=.01){const f=processFrame(p);if(Math.hypot(f.tool[0]-previous.tool[0],f.tool[1]-previous.tool[1])>1e-6)assert.ok(f.tool[2]>29.99);previous=f;}
});
test('the actual rendered fingers clear the header when seated, with six connected harness wires',()=>{
  const cell=createCell();cell.tool.root.position.set(1.2,.65,15.1);cell.root.updateMatrixWorld(true);
  const headerTop=new T.Box3().setFromObject(cell.housing).max.z;
  for(const finger of cell.tool.fingers){const bottom=new T.Box3().setFromObject(finger).min.z;assert.ok(bottom>headerTop,`finger ${bottom} versus header ${headerTop}`);}
  assert.equal(cell.wires.length,6);assert.equal(cell.tool.fingers.length,2);
});
