import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { batchStaticMeshes } from '../src/batching.ts';

test('batching preserves geometry, part picking and independent slide motion', () => {
  const root = new THREE.Group(), slide = new THREE.Group(), material = new THREE.MeshStandardMaterial();
  slide.position.set(8, 5, 12); slide.rotation.z = .35; root.add(slide);
  for (const x of [-2, 2]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
    mesh.position.set(x, 0, 0); mesh.userData.part = 'carriage'; slide.add(mesh);
  }
  root.updateMatrixWorld(true);
  const before = new THREE.Box3().setFromObject(root);
  const origin = slide.localToWorld(new THREE.Vector3(-2, 0, 20));
  batchStaticMeshes(root); root.updateMatrixWorld(true);
  const after = new THREE.Box3().setFromObject(root);
  assert.equal(slide.children.length, 1);
  assert.ok(before.min.distanceTo(after.min) < 1e-5 && before.max.distanceTo(after.max) < 1e-5);
  const hit = new THREE.Raycaster(origin, new THREE.Vector3(0, 0, -1)).intersectObject(root, true)[0];
  assert.equal(hit.object.userData.part, 'carriage');
  slide.position.z += 10; root.updateMatrixWorld(true);
  const moved = new THREE.Box3().setFromObject(root);
  assert.ok(Math.abs(moved.min.z - after.min.z - 10) < 1e-5);
});

test('an excluded moving latch and transparent shell retain separate materials and transforms', () => {
  const root = new THREE.Group(), material = new THREE.MeshStandardMaterial();
  const parts = Array.from({ length: 4 }, () => new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
  parts.forEach((part, i) => { part.position.x = i * 3; root.add(part); });
  const latch = parts[0], shell = parts[1]; shell.material = material.clone();
  batchStaticMeshes(root, new Set([latch, shell]));
  assert.equal(root.children.length, 3);
  latch.position.y = .3; shell.material.opacity = .16;
  assert.equal(latch.parent, root); assert.equal(shell.parent, root);
  assert.equal(material.opacity, 1);
  assert.ok(root.children.includes(latch) && root.children.includes(shell));
});
