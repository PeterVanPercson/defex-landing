import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

type Materials = Record<'body' | 'edge' | 'silver' | 'dark' | 'rubber', THREE.MeshStandardMaterial>;
export const GANTRY_REAR_OFFSET = 14;
export const SERVICE_FIXED = new THREE.Vector3(8.3, 15, 66);
export const SERVICE_MOVING = new THREE.Vector3(10.2, 3.6, 14.6);

export function createTooling(m: Materials) {
  const carriage = new THREE.Group(), axis = new THREE.Group(), saddle = new THREE.Group(), spindle = new THREE.Group(), screw = new THREE.Group();
  carriage.name = 'X carriage and stationary Y rails'; axis.name = 'Z guide assembly';
  saddle.name = 'Non-rotating Z saddle'; spindle.name = 'Rotary gripper'; screw.name = 'Z lead screw';
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

  box(carriage, 'X bearing block', [14, 4.6, 8], [0, 23, 69.1], m.body, .35);
  box(carriage, 'X carriage face', [14.6, .8, 8.6], [0, 20.3, 69.1], m.edge);
  for (const x of [-5.3, 5.3]) for (const z of [66.3, 71.9]) frontBolt(carriage, x, 19.75, z);
  box(carriage, 'Y slide deck', [13, 25, 4], [0, 15, 75.1], m.silver, .3);
  for (const x of [-4, 4]) {
    box(carriage, `Y guide ${x}`, [1.6, 20, .9], [x, 14, 72.65], m.dark, .08);
    box(axis, `Y bearing ${x}`, [3.4, 8, 1.7], [x, 14, 71.35], m.body, .16);
    box(axis, `Z crown lug ${x}`, [2.2, 5, 1.4], [x, 15, 69.8], m.silver, .16);
  }
  const housing = box(axis, 'Z axis housing', [11, 5, 43], [0, 15, 48.4], m.body.clone(), .35);
  const guideProfile = new THREE.Shape();
  // The bearing wraps around the rail, with an open back for the rail's mounting strip.
  guideProfile.moveTo(-1.75, -1.7); guideProfile.lineTo(1.75, -1.7);
  guideProfile.lineTo(1.75, .95); guideProfile.lineTo(.85, .95);
  guideProfile.lineTo(.85, -.8); guideProfile.lineTo(-.85, -.8);
  guideProfile.lineTo(-.85, .95); guideProfile.lineTo(-1.75, .95); guideProfile.closePath();
  for (const x of [-3.4, 3.4]) {
    box(axis, `Rail mounting strip ${x}`, [1.4, 2, 39], [x, 11.9, 48.5], m.edge, .06);
    box(axis, `Z guide ${x}`, [1.4, 1.4, 39], [x, 10.2, 48.5], m.silver, .08);
    for (const z of [31, 43, 55, 66]) frontBolt(axis, x, 9.47, z, .4);
    const shoe = new THREE.Mesh(new THREE.ExtrudeGeometry(guideProfile, {depth:6, bevelEnabled:false}), m.dark);
    shoe.name = `Open-backed linear bearing ${x}`; shoe.position.set(x, 10.2, 16.5);
    shoe.castShadow = shoe.receiveShadow = true; saddle.add(shoe);
    box(saddle, `Bearing end seal ${x}`, [3.6, .3, 6.4], [x, 8.48, 19.5], m.rubber, .08);
  }
  axis.add(screw); screw.position.set(0, 12, 47.8);
  cylinder(screw, 'Lead screw core', .72, 36, [0, 0, 0], m.silver);
  const helix = Array.from({length:481}, (_, i) => {
    const a = i / 20 * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * .84, Math.sin(a) * .84, -18 + i / 480 * 36);
  });
  const thread = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 480, .1, 4, false), m.edge);
  thread.name = 'Lead screw thread'; screw.add(thread);
  cylinder(axis, 'Z motor', 3.1, 5.2, [0, 12, 68.7], m.dark);
  cylinder(axis, 'Motor end cap', 3.2, .5, [0, 12, 71.55], m.edge);
  box(axis, 'Lower screw bearing', [10.5, 4.2, 2.2], [0, 12.6, 27.7], m.silver);
  cylinder(axis, 'Fixed cable gland', .95, 2.8, [6.9, 15, 66], m.edge, 'x');

  box(saddle, 'Z saddle plate', [11, 1, 8], [0, 8, 19.5], m.edge);
  box(saddle, 'Tool support bracket', [11, 12.8, 1.8], [0, 2.1, 22.5], m.silver);
  for (const x of [-3.4, 3.4]) for (const z of [17.3, 21.7]) frontBolt(saddle, x, 7.37, z, .5);
  cylinder(saddle, 'Rotary flange', 3.8, 3.6, [0, 0, 19.8], m.edge);
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
  return {carriage, axis, saddle, spindle, screw, housing, boxes};
}
