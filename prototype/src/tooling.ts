import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Materials = Record<'body' | 'edge' | 'silver' | 'dark' | 'rubber', THREE.MeshStandardMaterial>;

// The gripper on the arm's tool flange: a parallel gripper that turns with the
// tool's yaw. (The gantry's slides, saddle and lead screw went with the gantry.)

export function createTooling(m: Materials) {
  const spindle = new THREE.Group();
  spindle.name = 'Rotary gripper';
  const boxes = new Map<string, THREE.Mesh>();
  const box = (parent: THREE.Object3D, name: string, size: number[], position: number[], material: THREE.Material, radius = .2) => {
    const r = Math.min(radius, ...size.map(v => v / 3));
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, r), material);
    mesh.name = name; mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); boxes.set(name, mesh); return mesh;
  };
  const cylinder = (parent: THREE.Object3D, name: string, radius: number, height: number, position: number[], material: THREE.Material, axis: 'z' | 'x' | 'y' = 'z', sides = 32) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sides), material);
    mesh.name = name;
    if (axis === 'z') mesh.rotation.x = Math.PI / 2;
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const frontBolt = (parent: THREE.Object3D, x: number, y: number, z: number, r = .6) => {
    cylinder(parent, 'Socket head fastener', r, .24, [x, y, z], m.edge, 'y', 20);
    cylinder(parent, 'Hex recess', r * .43, .04, [x, y - .14, z], m.dark, 'y', 6);
  };

  cylinder(spindle, 'Rotary neck', 2.8, 1.5, [0, 0, 17.25], m.silver);
  box(spindle, 'Parallel gripper', [17, 10, 6], [0, 0, 13.5], m.body, .4);
  box(spindle, 'Gripper front guide', [14.5, .2, .9], [0, -5.06, 13.9], m.dark, .06);
  for (const x of [-7.25, 7.25]) {
    box(spindle, `Gripper jaw ${x}`, [1.9, 4.8, 5.2], [x, 0, 7.9], m.silver, .2);
    box(spindle, `Jaw pad ${x}`, [.7, 4.4, 3.6], [Math.sign(x) * 5.95, 0, 8.7], m.rubber, .09);
    frontBolt(spindle, x, -2.54, 8.4, .48);
  }
  for (const sign of [-1, 1]) box(spindle, `Harness strain relief ${sign}`, [5.5, 1.2, 2.6], [0, sign * 5.6, 13.4], m.rubber);
  cylinder(spindle, 'Moving cable gland', .95, 2.4, [9, 3.6, 14.6], m.edge, 'x');
  return {spindle, boxes};
}
