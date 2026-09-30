import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createTooling, SERVICE_FIXED, SERVICE_MOVING } from '../src/tooling.ts';
import { ServiceLoop } from '../src/mechanism.ts';
import { finishes } from '../src/finishes.ts';
import { SEATED_Z, START_Z } from '../src/model.ts';

test('moving tooling clears the housing, motor and Y slide throughout the insertion stroke', () => {
  const rig = createTooling(finishes), world = new THREE.Group(), tool = new THREE.Group();
  const ySlide = new THREE.Group(), xSlide = new THREE.Group();
  world.add(xSlide, tool); xSlide.add(rig.carriage, ySlide); ySlide.add(rig.axis); tool.add(rig.saddle, rig.spindle);
  const fixed = ['Z axis housing', 'Y slide deck', 'X bearing block', 'Y bearing -4', 'Y bearing 4', 'Lower screw bearing'].map(name => rig.boxes.get(name)!);
  fixed.push(rig.axis.getObjectByName('Z motor') as THREE.Mesh);
  const moving: THREE.Mesh[] = [];
  tool.traverse(o => { if (o instanceof THREE.Mesh) moving.push(o); });
  let poses = 0;
  for (const x of [-2.8, 0, 2.8]) for (const y of [-2.8, 0, 2.8]) for (const yaw of [-.09, 0, .09]) for (let step = 0; step <= 28; step++) {
    const z = (SEATED_Z + (START_Z - SEATED_Z) * step / 28) * 1000;
    tool.position.set(x, y, z); rig.spindle.rotation.z = yaw;
    xSlide.position.x = x; ySlide.position.y = y; world.updateMatrixWorld(true);
    for (const object of moving) {
      const bounds = new THREE.Box3().setFromObject(object, true).expandByScalar(-.005);
      for (const obstacle of fixed) assert.equal(bounds.intersectsBox(new THREE.Box3().setFromObject(obstacle, true)), false, `${object.name} clips ${obstacle.name} at z=${z}`);
    }
    poses++;
  }
  assert.equal(poses, 783);
});

test('linear bearings have actual clearance around the rail instead of solid intersecting blocks', () => {
  const rig = createTooling(finishes);
  rig.saddle.updateMatrixWorld(true);
  for (const x of [-3.4, 3.4]) {
    const shoe = rig.saddle.getObjectByName(`Open-backed linear bearing ${x}`)!;
    for (const dx of [-.7, 0, .7]) for (const dy of [-.7, 0, .7]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(x + dx, 10.2 + dy, 30), new THREE.Vector3(0, 0, -1));
      assert.equal(ray.intersectObject(shoe).length, 0);
    }
  }
});

test('service loop endpoints stay attached to the two cable glands through yaw and travel', () => {
  const loop = new ServiceLoop(finishes.rubber);
  for (const z of [SEATED_Z * 1000, 27, START_Z * 1000]) for (const yaw of [-.09, 0, .09]) {
    loop.update(2.8, -2.8, z, yaw);
    const fixed = SERVICE_FIXED.clone().add(new THREE.Vector3(2.8, -2.8, 0));
    const moving = SERVICE_MOVING.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), yaw).add(new THREE.Vector3(2.8, -2.8, z));
    assert.ok(loop.curve.v0.distanceTo(fixed) < 1e-10);
    assert.ok(loop.curve.v3.distanceTo(moving) < 1e-10);
  }
});
