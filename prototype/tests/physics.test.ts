import test from 'node:test';
import assert from 'node:assert/strict';
import loadMujoco from '@mujoco/mujoco';
import { ConnectorEngine } from '../src/engine.ts';
import { DEFAULT_CONFIG, SEATED_Z, START_Z } from '../src/model.ts';
import type { Controller } from '../src/model.ts';

const mj = await loadMujoco();
function run(e: ConnectorEngine, controller: Controller) {
  e.start(controller);
  for (let i = 0; i < 4000 && e.phase !== 'complete'; i++) e.advance(100);
  assert.equal(e.phase, 'complete');
  return e.trials.at(-1)!;
}

test('aligned physical model seats and passes the idealized test models', () => {
  const e = new ConnectorEngine(mj, {...DEFAULT_CONFIG, offsetX: 0, offsetY: 0, yaw: 0});
  const t = run(e, 'fixed');
  assert.equal(t.accepted,true);
  assert.equal(t.continuity,true); assert.equal(t.retention,true);
  e.dispose();
});

test('hidden fixture displacement blocks a fixed path and produces contact force', () => {
  const e = new ConnectorEngine(mj);
  const t = run(e,'fixed');
  assert.equal(t.accepted,false); assert.ok(t.peakForce > 3);
  e.dispose();
});

test('search backs off and tries the next spot until the plug seats', () => {
  const e = new ConnectorEngine(mj);
  const t = run(e,'search');
  assert.equal(t.accepted,true); assert.ok(t.probes > 1);
  assert.ok(t.samples.some(s => s.phase === 'backoff') && t.samples.some(s => s.phase === 'move'));
  e.dispose();
});

test('reset lifts clear before returning XY home, and the next run starts where the last one ended', () => {
  const e = new ConnectorEngine(mj, {...DEFAULT_CONFIG, fault: 'open'});
  const trial = run(e, 'search');
  assert.equal(trial.accepted,false);
  const reset = trial.samples.filter(s => s.phase === 'reset'), first = reset[0];
  for (const sample of reset.filter(s => s.z < .0268)) assert.ok(Math.hypot(sample.x - first.x, sample.y - first.y) < .00008);
  const completed = e.snapshot().pose;
  e.start('fixed');
  assert.ok(Math.hypot(...completed.slice(0, 3).map((v, i) => v - e.snapshot().pose[i])) < .00003, 'next run must not jump sideways');
  e.dispose();
});

for (const fault of ['open','latch'] as const) test(`${fault} fault is rejected after insertion`, () => {
  const e = new ConnectorEngine(mj,{...DEFAULT_CONFIG,offsetX:0,offsetY:0,yaw:0,fault});
  const t=run(e,'fixed');
  assert.equal(t.accepted,false);
  assert.equal(fault==='open'?t.continuity:t.retention,false);
  assert.equal(fault==='open'?t.retention:t.continuity,fault==='open'?true:null);
  const phases=t.samples.map(s=>s.phase);
  if(fault==='open') assert.ok(phases.indexOf('retention')<phases.indexOf('electrical'));
  else assert.ok(!phases.includes('electrical'));
  e.dispose();
});

test('both illustrative variants can seat, and a passed plug stays seated', () => {
  for (const variant of ['six','eight'] as const) {
    const e=new ConnectorEngine(mj,{...DEFAULT_CONFIG,variant,offsetX:0,offsetY:0,yaw:0});
    const t=run(e,'fixed');
    assert.equal(t.accepted,true); assert.ok(Math.abs(e.data.qpos[2]-SEATED_Z)<.0003); assert.equal(e.snapshot().released,true);
    assert.ok(t.samples.length>100);assert.ok(t.samples.every(p=>Number.isFinite(p.force)&&Number.isFinite(p.z)));
    e.dispose();
  }
});

test('records and snapshots carry no saved fit: every run is measured and tested on its own', () => {
  const e=new ConnectorEngine(mj);
  run(e,'search');
  for (const key of ['correction','calibration']) { assert.ok(!(key in e.trials[0]),key); assert.ok(!(key in e.snapshot()),key); }
  e.dispose();
});

test('a new setup after a pass waits until the plug is lifted out and home, then rebuilds the model', () => {
  const e=new ConnectorEngine(mj,{...DEFAULT_CONFIG,offsetX:0,offsetY:0,yaw:0});
  assert.equal(run(e,'fixed').accepted,true);
  e.setup({...DEFAULT_CONFIG,offsetX:.3,offsetY:0,yaw:0});
  assert.equal(e.config.offsetX,0,'the model is not rebuilt under a seated plug');assert.equal(e.phase,'reset');
  e.setup({...DEFAULT_CONFIG,offsetX:.5,offsetY:0,yaw:0});e.start('fixed');
  let previous=e.data.qpos[2];
  while(e.phase==='reset'){e.advance(10);assert.ok(Math.abs(e.data.qpos[2]-previous)<.002,'no jump while lifting out');previous=e.data.qpos[2];}
  assert.equal(e.config.offsetX,.5);assert.equal(e.phase,'approach');
  assert.ok(Math.abs(e.data.qpos[2]-START_Z)<.0005,'the run starts from home');
  e.dispose();
});

test('search terminates and stays finite across displacement and rotation limits', () => {
  const configs=[{offsetX:2,offsetY:2,yaw:5},{offsetX:-2,offsetY:-2,yaw:-5},{offsetX:-1.2,offsetY:.65,yaw:0},{offsetX:0,offsetY:0,yaw:5}];
  for(const config of configs){
    const e=new ConnectorEngine(mj,{...DEFAULT_CONFIG,...config,variant:'eight'});
    const t=run(e,'search');assert.ok(t.probes<=48);assert.ok(t.duration<125);
    assert.ok(Number.isFinite(t.peakForce));
    if(t.accepted){assert.equal(t.continuity,true);assert.equal(t.retention,true);}
    e.dispose();
  }
});

test('after both tests pass the plug stays latched; the next run or a reset lifts it out along the reset path first', () => {
  const e=new ConnectorEngine(mj,{...DEFAULT_CONFIG,offsetX:0,offsetY:0,yaw:0});
  assert.equal(run(e,'fixed').accepted,true);
  for(let i=0;i<20;i++)e.advance(100);
  assert.equal(e.phase,'complete');assert.ok(Math.abs(e.data.qpos[2]-SEATED_Z)<.0003);
  e.start('fixed');assert.equal(e.phase,'reset');assert.equal(e.snapshot().released,false);
  let previous=e.data.qpos[2],top=previous;
  while(e.phase==='reset'){e.advance(10);assert.ok(Math.abs(e.data.qpos[2]-previous)<.002,'no jump while lifting out');previous=e.data.qpos[2];top=Math.max(top,previous);}
  assert.ok(top>START_Z-.0005);assert.equal(e.phase,'approach');
  const t=run(e,'fixed');assert.equal(t.accepted,true);assert.equal(e.trials.length,2);
  e.stop();assert.equal(e.phase,'reset');for(let i=0;i<400&&e.phase!=='ready';i++)e.advance(100);assert.equal(e.phase,'ready');assert.equal(e.trials.length,2);
  e.dispose();
});
