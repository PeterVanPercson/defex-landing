import test from 'node:test';
import assert from 'node:assert/strict';
import loadMujoco from '@mujoco/mujoco';
import { ConnectorEngine } from '../src/engine.ts';
import { DEFAULT_CONFIG } from '../src/model.ts';
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

test('search uses trial feedback, and its accepted correction is reusable', () => {
  const e = new ConnectorEngine(mj);
  const learned = run(e,'search');
  assert.equal(learned.accepted,true);
  assert.ok(learned.probes > 1); assert.ok(e.calibration);
  const reused = run(e,'reuse');
  assert.equal(reused.accepted,true); assert.equal(reused.probes,1);
  assert.ok(reused.duration < learned.duration);
  e.dispose();
});

test('reset lifts clear before returning XY home and preserves the tested correction', () => {
  const e = new ConnectorEngine(mj);
  const trial = run(e, 'search');
  assert.deepEqual(trial.correction, e.calibration);
  const reset = trial.samples.filter(s => s.phase === 'reset');
  for (const sample of reset.filter(s => s.z < .0268)) {
    assert.ok(Math.hypot(sample.x - trial.correction![0], sample.y - trial.correction![1]) < .00008);
  }
  const completed = e.snapshot().pose;
  e.start('reuse');
  assert.ok(Math.hypot(...completed.slice(0, 3).map((v, i) => v - e.snapshot().pose[i])) < .00003, 'next run must not jump sideways');
  e.dispose();
});

for (const fault of ['open','latch'] as const) test(`${fault} fault is rejected after insertion`, () => {
  const e = new ConnectorEngine(mj,{...DEFAULT_CONFIG,offsetX:0,offsetY:0,yaw:0,fault});
  const t=run(e,'fixed');
  assert.equal(t.accepted,false);
  assert.equal(fault==='open'?t.continuity:t.retention,false);
  assert.equal(fault==='open'?t.retention:t.continuity,true);
  e.dispose();
});

test('both illustrative variants can seat and complete the reset', () => {
  for (const variant of ['six','eight'] as const) {
    const e=new ConnectorEngine(mj,{...DEFAULT_CONFIG,variant,offsetX:0,offsetY:0,yaw:0});
    const t=run(e,'fixed');
    assert.equal(t.accepted,true); assert.ok(e.data.qpos[2]>.0419);
    assert.ok(t.samples.length>100);assert.ok(t.samples.every(p=>Number.isFinite(p.force)&&Number.isFinite(p.z)));
    e.dispose();
  }
});

test('a saved correction is still tested and rejected after the fixture moves', () => {
  const e=new ConnectorEngine(mj);
  assert.equal(run(e,'search').accepted,true);
  const saved=[...e.calibration!];
  e.configure({...DEFAULT_CONFIG,offsetX:-1.2,offsetY:-.65});
  const t=run(e,'reuse');
  assert.equal(t.accepted,false);assert.deepEqual(e.calibration,saved);
  assert.equal(e.trials.length,2);assert.equal(e.trials[0].config.offsetX,1.2);
  e.dispose();
});

test('unsuccessful searches never save a correction', () => {
  const e=new ConnectorEngine(mj,{...DEFAULT_CONFIG,offsetX:0,offsetY:0,yaw:0,fault:'open'});
  assert.equal(run(e,'search').accepted,false);assert.equal(e.calibration,null);
  assert.throws(()=>e.start('reuse'),/accepted search/);
  e.dispose();
});

test('search terminates and stays finite across displacement and rotation limits', () => {
  const configs=[{offsetX:2,offsetY:2,yaw:5},{offsetX:-2,offsetY:-2,yaw:-5},{offsetX:-1.2,offsetY:.65,yaw:0},{offsetX:0,offsetY:0,yaw:5}];
  for(const config of configs){
    const e=new ConnectorEngine(mj,{...DEFAULT_CONFIG,...config,variant:'eight'});
    const t=run(e,'search');assert.ok(t.probes<=49);assert.ok(t.duration<125);
    assert.ok(Number.isFinite(t.peakForce));
    if(t.accepted){assert.equal(t.continuity,true);assert.equal(t.retention,true);}
    e.dispose();
  }
});
