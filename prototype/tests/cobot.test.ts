import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCobot, solveArm, BASE, SHOULDER_Z, UPPER, FORE, WRIST_DROP, FLANGE_Z } from '../src/cobot.ts';
import { createTooling } from '../src/tooling.ts';
import { finishes } from '../src/finishes.ts';
import { SEATED_Z, START_Z } from '../src/model.ts';

// every tool pose the physics can produce: the search's widest ring, both yaw limits, the whole stroke
function* stroke() {
  for (const x of [-2.8, 0, 2.8]) for (const y of [-2.8, 0, 2.8]) for (const yaw of [-.09, 0, .09]) for (let step = 0; step <= 28; step++)
    yield { x, y, yaw, z: (SEATED_Z + (START_Z - SEATED_Z) * step / 28) * 1000 };
}

test('the arm reaches every tool pose with rigid links and the elbow up', () => {
  let poses = 0;
  for (const p of stroke()) {
    const flange = new THREE.Vector3(p.x, p.y, p.z + FLANGE_Z), pose = solveArm(flange);
    assert.ok(Math.abs(pose.shoulder.distanceTo(pose.elbow) - UPPER) < 1e-6, 'upper arm length');
    assert.ok(Math.abs(pose.elbow.distanceTo(pose.wrist) - FORE) < 1e-6, 'forearm length');
    assert.ok(pose.wrist.distanceTo(flange.clone().setZ(flange.z + WRIST_DROP)) < 1e-9, 'wrist straight above the flange');
    assert.ok(pose.reach < 0.97, `nearly straight at ${JSON.stringify(p)}`);
    assert.ok(pose.elbow.z > pose.shoulder.z && pose.elbow.z > pose.wrist.z - 1e-6, 'elbow up');
    // the arm plane runs through the base
    const u = new THREE.Vector2(Math.cos(pose.yaw), Math.sin(pose.yaw));
    const e = new THREE.Vector2(pose.elbow.x - BASE.x, pose.elbow.y - BASE.y);
    assert.ok(Math.abs(u.cross(e)) < 1e-6);
    poses++;
  }
  assert.equal(poses, 783);
});

// the shortest distance from a link's axis to a vertical column (the gripper's, the socket's)
function gap(a: THREE.Vector3, b: THREE.Vector3, x: number, y: number, z0: number, z1: number) {
  const column = new THREE.Line3(new THREE.Vector3(x, y, z0), new THREE.Vector3(x, y, z1)), q = new THREE.Vector3(), c = new THREE.Vector3();
  let best = Infinity;
  for (let i = 0; i <= 60; i++) { q.lerpVectors(a, b, i / 60); column.closestPointToPoint(q, true, c); best = Math.min(best, q.distanceTo(c)); }
  return best;
}

test('the links never come down onto the gripper, the socket or the table', () => {
  const rig = createCobot(finishes);
  // the gripper body is 17 x 10 mm (half-diagonal 9.9); the socket housing about 20 x 16
  for (const p of stroke()) {
    rig.set(new THREE.Vector3(p.x, p.y, p.z + FLANGE_Z), p.yaw);
    const { shoulder, elbow, wrist } = rig.pose;
    for (const [name, a, b, radius] of [['upper arm', shoulder, elbow, 4.8], ['forearm', elbow, wrist, 3.9]] as const) {
      const toGripper = gap(a, b, p.x, p.y, p.z + 3, p.z + FLANGE_Z) - radius - 9.9;
      assert.ok(toGripper > 1, `${name} ${toGripper.toFixed(2)} mm from the gripper at ${JSON.stringify(p)}`);
      assert.ok(gap(a, b, 0, 0, 0, 22) - radius - 13 > 1, `${name} meets the socket`);
      assert.ok(Math.min(a.z, b.z) - radius > BASE.z + 10, `${name} meets the table`);
    }
    // the wrist housing sits above the gripper, never in it
    assert.ok(wrist.z - 4.7 > p.z + FLANGE_Z + 6);
  }
  assert.ok(Math.abs(rig.pose.shoulder.z - BASE.z - SHOULDER_Z) < 1e-9);
});

test('the arm cable stays finite, reuses its buffers and ends in the gripper gland', () => {
  const rig = createCobot(finishes), positions = rig.cable.geometry.attributes.position.array;
  const gland = createTooling(finishes).spindle.getObjectByName('Moving cable gland')!;
  for (const p of stroke()) {
    if (p.x || p.y) continue;
    rig.set(new THREE.Vector3(p.x, p.y, p.z + FLANGE_Z), p.yaw);
    assert.equal(rig.cable.geometry.attributes.position.array, positions);
    assert.ok(positions.every(Number.isFinite));
    assert.ok(rig.cable.geometry.attributes.normal.array.every(Number.isFinite));
    const end = rig.cable.curve.points.at(-1)!;
    const expected = gland.position.clone().add(new THREE.Vector3(1, 0, 0)).applyAxisAngle(new THREE.Vector3(0, 0, 1), p.yaw).add(new THREE.Vector3(p.x, p.y, p.z));
    assert.ok(end.distanceTo(expected) < 1e-9, `cable end ${end.toArray()} vs gland ${expected.toArray()}`);
  }
});
