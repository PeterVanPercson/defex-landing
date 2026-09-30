import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Merge only siblings: a slide, latch or exploded assembly keeps its own transform.
export function batchStaticMeshes(root: THREE.Object3D, excluded = new Set<THREE.Object3D>()) {
  for (const child of [...root.children]) if (!(child instanceof THREE.Mesh)) batchStaticMeshes(child, excluded);
  const batches = new Map<string, THREE.Mesh[]>();
  for (const child of root.children) {
    if (!(child instanceof THREE.Mesh) || Array.isArray(child.material) || excluded.has(child) || !child.visible) continue;
    const key = `${child.material.uuid}:${child.castShadow}:${child.receiveShadow}:${child.userData.part ?? ''}`;
    const group = batches.get(key) ?? []; group.push(child); batches.set(key, group);
  }
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const copies = meshes.map(mesh => {
      mesh.updateMatrix();
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      return geometry.applyMatrix4(mesh.matrix);
    });
    const geometry = mergeGeometries(copies, false);
    copies.forEach(copy => copy.dispose());
    if (!geometry) continue;
    const merged = new THREE.Mesh(geometry, meshes[0].material);
    merged.name = `${root.name || 'Workcell'} / ${(meshes[0].material as THREE.Material).name || meshes[0].name}`;
    merged.castShadow = meshes[0].castShadow; merged.receiveShadow = meshes[0].receiveShadow;
    merged.userData = { ...meshes[0].userData };
    root.add(merged); meshes.forEach(mesh => root.remove(mesh));
  }
}
