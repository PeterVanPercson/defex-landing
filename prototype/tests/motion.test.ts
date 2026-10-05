import test from 'node:test';
import assert from 'node:assert/strict';
import { PoseStream, damping, settleSpring } from '../src/motion.ts';

test('interpolates computed motion at either display refresh rate',()=>{
  for(const hz of [60,120]){
    const stream=new PoseStream();
    for(let i=0;i<4;i++)stream.push([i,0,42-i,0],i*33,0);
    let previous=-1;
    for(let t=stream.delay;t<=stream.delay+99;t+=1000/hz){
      const p=stream.sample(t)!;
      assert.ok(p[0]>=previous);assert.ok(p[0]<=3);
      assert.ok(Math.abs(p[0]-(t-stream.delay)/33)<1e-9);
      previous=p[0];
    }
  }
});

test('holds the last computed pose when a worker update arrives late',()=>{
  const stream=new PoseStream();
  stream.push([0,0,42,0],0,0);stream.push([1,0,25,0],33,0);
  assert.deepEqual(stream.sample(500),[1,0,25,0]);
  assert.equal(stream.pending(500),false);
  stream.push([1,0,23,0],510,0);
  assert.ok(stream.sample(530)![2]>=23);
});

test('reset starts a new pose history without animating across trials',()=>{
  const stream=new PoseStream();
  stream.push([2,1,18,0],0,1);stream.push([2,1,18,0],33,1);
  stream.push([0,0,42,0],34,2);
  assert.deepEqual(stream.sample(35),[0,0,42,0]);
});

test('camera damping covers the same distance at 60 and 120 Hz',()=>{
  const move=(hz:number)=>{let p=0;for(let i=0;i<hz;i++)p+=(1-p)*damping(1000/hz,140);return p;};
  assert.ok(Math.abs(move(60)-move(120))<1e-12);
});

test('dock springs have the same trajectory at 30, 60 and 120 Hz without overshoot',()=>{
  const end = [30,60,120].map(hz=>{
    let position=46, velocity=0;
    for(let i=0;i<hz/2;i++){
      ({position,velocity}=settleSpring(position,velocity,60,1/hz));
      assert.ok(position>=46&&position<=60);
    }
    return position;
  });
  assert.ok(Math.max(...end)-Math.min(...end)<1e-10);
});

test('dock spring settles after a long frame and a changed target',()=>{
  let {position,velocity}=settleSpring(46,0,60,.1);
  for(let i=0;i<60;i++)({position,velocity}=settleSpring(position,velocity,46,1/60));
  assert.ok(Math.abs(position-46)<.001);
  assert.ok(Number.isFinite(velocity));
});
