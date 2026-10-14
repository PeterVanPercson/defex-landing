import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PoseStream, damping, settleSpring, isClick, isDrag, lensShift } from '../src/motion.ts';

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

test('only a real drag takes the camera: past 6 px, and on touch only sideways', () => {
  assert.equal(isDrag(4, 3, false), false);
  assert.equal(isDrag(0, 9, false), true);
  assert.equal(isDrag(3, 9, true), false, 'a vertical swipe is the page scrolling');
  assert.equal(isDrag(9, 3, true), true);
});

test('a part is picked only by a short, still press of the main button', () => {
  assert.equal(isClick(0, 120, 2, 1), true);
  assert.equal(isClick(2, 120, 0, 0), false, 'right button');
  assert.equal(isClick(0, 320, 0, 0), false, 'long press');
  assert.equal(isClick(0, 120, 4, 4), false, 'moved');
});

test('a camera move eases in from rest, keeps its speed continuous and settles below 0.02 mm', () => {
  // the guided camera's spring at 60 fps over a 1500 mm move, at the overview stiffness and a long move into the
  // close-up (the close-up's follow stiffness, 7, only ever closes a few millimetres)
  for (const k of [3, 3.4]) {
    let x = 0, v = 0, last = 0, settled = -1;
    const steps: number[] = [];
    for (let i = 1; i < 600 && settled < 0; i++) {
      const s = settleSpring(x, v, 1500, 1 / 60, k); x = s.position; v = s.velocity;
      steps.push(x - last); last = x;
      if (Math.abs(x - 1500) < .02 && Math.abs(v) < .05) settled = i;
    }
    const peak = Math.max(...steps);
    assert.ok(steps[0] < peak * .2, `first frame moves ${steps[0].toFixed(2)} mm of a ${peak.toFixed(1)} mm/frame peak`);
    for (let i = 1; i < steps.length; i++) assert.ok(Math.abs(steps[i] - steps[i - 1]) < peak * .2, `no jerk at frame ${i}`);
    assert.ok(steps.every(d => d >= -1e-9), 'never overshoots');
    assert.ok(settled > 0 && settled < 420, `settles in ${settled} frames`);
  }
});

test('the lens shift brings the look point to the centre of the frame', () => {
  const camera = new THREE.PerspectiveCamera(30, 1.6, 1, 10000); camera.up.set(0, 0, 1); camera.filmGauge = 36; camera.setFocalLength(35);
  const position = new THREE.Vector3(1219, -235, 234), target = new THREE.Vector3(-30, 40, 60), look = new THREE.Vector3(-30, 40, 190);
  const shift = lensShift(position, target, look, camera.getFilmWidth(), camera.getFilmHeight(), 35);
  camera.position.copy(position); camera.lookAt(target);
  camera.setViewOffset(1600, 1000, 1600 * shift.x, 1000 * shift.y, 1600, 1000); camera.updateMatrixWorld();
  const p = look.clone().project(camera);
  assert.ok(Math.hypot(p.x, p.y) < 1e-3, `look point at ${p.x.toFixed(4)}, ${p.y.toFixed(4)}`);
  assert.ok(Math.abs(target.clone().project(camera).y) > .1, 'the camera turns about a point below it');
});
