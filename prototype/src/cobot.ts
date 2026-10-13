import * as THREE from 'three';

// The robot as on the home page (his call, 2026-10-12: "make it like a hand"):
// a six-joint cobot in white satin with black-ringed joint caps, an orange ring
// at the tool flange and an external cable. It is drawn, not simulated: every
// frame it is posed so that its flange sits on the tool the physics moved.

// At the back of the jig plate, centred behind the stations (world -10, 170 at the cell's x5 scale),
// so the stations spread over a wider turn of the base and the arm works mid-reach.
export const BASE = new THREE.Vector3(-2, 34, 0.3);
export const SHOULDER_Z = 38;
export const UPPER = 46;
export const FORE = 40;
// from the wrist joint's axis down to the tool flange
export const WRIST_DROP = 16;
// the tool flange above the tool origin (the top of the gripper's rotary flange)
export const FLANGE_Z = 21.6;

export interface ArmPose {
  yaw: number;
  shoulder: THREE.Vector3;
  elbow: THREE.Vector3;
  wrist: THREE.Vector3;
  flange: THREE.Vector3;
  reach: number;
}

// Elbow-up planar solution in the vertical plane through the base and the wrist.
export function solveArm(flange: THREE.Vector3, out?: ArmPose): ArmPose {
  const pose = out ?? { yaw: 0, shoulder: new THREE.Vector3(), elbow: new THREE.Vector3(), wrist: new THREE.Vector3(), flange: new THREE.Vector3(), reach: 0 };
  pose.flange.copy(flange);
  pose.wrist.set(flange.x, flange.y, flange.z + WRIST_DROP);
  pose.shoulder.set(BASE.x, BASE.y, BASE.z + SHOULDER_Z);
  const dx = pose.wrist.x - pose.shoulder.x, dy = pose.wrist.y - pose.shoulder.y, dz = pose.wrist.z - pose.shoulder.z;
  const r = Math.hypot(dx, dy);
  // Unwrap against the previous pose so the turret never spins a full turn across +-180 degrees.
  const raw = Math.atan2(dy, dx);
  pose.yaw = out ? out.yaw + THREE.MathUtils.euclideanModulo(raw - out.yaw + Math.PI, 2 * Math.PI) - Math.PI : raw;
  const span = Math.min(Math.hypot(r, dz), UPPER + FORE - 1e-3);
  pose.reach = span / (UPPER + FORE);
  const cosBeta = THREE.MathUtils.clamp((span * span - UPPER * UPPER - FORE * FORE) / (2 * UPPER * FORE), -1, 1);
  const beta = Math.acos(cosBeta);
  const alpha = Math.atan2(dz, r) + Math.atan2(FORE * Math.sin(beta), UPPER + FORE * Math.cos(beta));
  const ux = Math.cos(pose.yaw), uy = Math.sin(pose.yaw);
  pose.elbow.set(pose.shoulder.x + ux * UPPER * Math.cos(alpha), pose.shoulder.y + uy * UPPER * Math.cos(alpha), pose.shoulder.z + UPPER * Math.sin(alpha));
  return pose;
}

type Materials = Record<'dark' | 'edge' | 'silver' | 'rubber', THREE.MeshStandardMaterial>;

export function cobotMaterials() {
  const paint = new THREE.MeshPhysicalMaterial({ color: 0xececE8, roughness: 0.34, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.22, envMapIntensity: 1.3 });
  paint.name = 'Cobot satin white';
  const cap = new THREE.MeshPhysicalMaterial({ color: 0x1c1d1f, roughness: 0.58, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5 });
  cap.name = 'Joint cap black';
  const capFace = new THREE.MeshPhysicalMaterial({ color: 0xe6e7e3, roughness: 0.4, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.25 });
  capFace.name = 'Joint cap face';
  const accent = new THREE.MeshStandardMaterial({ color: 0xe0601c, roughness: 0.4, metalness: 0 });
  accent.name = 'Flange ring orange';
  return { paint, cap, capFace, accent };
}

const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);

// A cylinder about local Y from y=a to y=b with filleted rims, so its edges
// catch a highlight the way a cast and painted housing does.
export function roundedCylinder(r: number, a: number, b: number, fillet: number, sides = 64) {
  const f = Math.min(fillet, r * 0.45, (b - a) * 0.45), pts: THREE.Vector2[] = [new THREE.Vector2(0, a)];
  for (let i = 0; i <= 8; i++) { const t = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(r - f + Math.sin(t) * f, a + f - Math.cos(t) * f)); }
  for (let i = 0; i <= 8; i++) { const t = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(r - f + Math.cos(t) * f, b - f + Math.sin(t) * f)); }
  pts.push(new THREE.Vector2(0, b));
  return new THREE.LatheGeometry(pts, sides);
}
// The joint cover as cast: a black bezel with a rounded lip standing proud of the
// housing, a shadow groove, then a slightly domed light cover. Profiles about +Y.
const lathe = (pts: number[][], sides = 72) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), sides);
export function capRing(r: number) {
  const pts: number[][] = [[r * 0.6, -0.05], [r * 0.985, -0.05], [r * 0.985, 0.25]];
  for (let i = 0; i <= 6; i++) { const t = i / 6 * Math.PI / 2; pts.push([r * 0.985 - 0.5 + Math.cos(t) * 0.5, 0.25 + Math.sin(t) * 0.5]); }
  pts.push([r * 0.66, 0.75], [r * 0.64, 0.6], [r * 0.6, 0.45]);
  return lathe(pts);
}
export function capFace(r: number) {
  const pts: number[][] = [[0, 0.95], [r * 0.3, 0.92], [r * 0.5, 0.84], [r * 0.565, 0.74], [r * 0.585, 0.6], [r * 0.6, 0.45], [r * 0.6, 0.3]];
  return lathe(pts.reverse());
}
// A link about local Y, 0..length, that swells into the joint at each end.
export function flaredLink(length: number, start: number, middle: number, end: number, sides = 64) {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  const swell = (u: number) => { const k = THREE.MathUtils.clamp(1 - u / 0.3, 0, 1); return k * k * (3 - 2 * k); };
  for (let i = 0; i <= 48; i++) {
    const u = i / 48;
    pts.push(new THREE.Vector2(middle + (start - middle) * swell(u) + (end - middle) * swell(1 - u), u * length));
  }
  pts.push(new THREE.Vector2(0, length));
  return new THREE.LatheGeometry(pts, sides);
}

// A bent cable that follows the arm, its tube buffers reused every frame.
export class ArmCable {
  geometry = new THREE.BufferGeometry();
  mesh: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
  segments: number;
  sides = 8;
  radius: number;
  private p = new THREE.Vector3(); private t = new THREE.Vector3(); private n = new THREE.Vector3(); private b = new THREE.Vector3(); private ref = new THREE.Vector3();

  constructor(material: THREE.Material, points: number, radius = 0.55, segments = 56) {
    this.radius = radius; this.segments = segments;
    this.curve = new THREE.CatmullRomCurve3(Array.from({ length: points }, () => new THREE.Vector3()), false, 'centripetal');
    const indices: number[] = [];
    for (let i = 0; i < segments; i++) for (let j = 0; j < this.sides; j++) {
      const a = i * (this.sides + 1) + j, c = a + this.sides + 1;
      indices.push(a, c, a + 1, c, c + 1, a + 1);
    }
    const count = (segments + 1) * (this.sides + 1) * 3;
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setIndex(indices);
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.name = 'Arm cable'; this.mesh.castShadow = true; this.mesh.frustumCulled = false;
  }

  update(points: THREE.Vector3[]) {
    points.forEach((v, i) => this.curve.points[i].copy(v));
    const positions = this.geometry.attributes.position, normals = this.geometry.attributes.normal;
    for (let i = 0; i <= this.segments; i++) {
      const u = i / this.segments;
      this.curve.getPoint(u, this.p); this.curve.getTangent(u, this.t);
      this.ref.copy(Math.abs(this.t.z) > 0.9 ? Y : Z);
      this.n.crossVectors(this.ref, this.t).normalize(); this.b.crossVectors(this.t, this.n).normalize();
      for (let j = 0; j <= this.sides; j++) {
        const a = j / this.sides * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const nx = this.n.x * c + this.b.x * s, ny = this.n.y * c + this.b.y * s, nz = this.n.z * c + this.b.z * s;
        const k = i * (this.sides + 1) + j;
        positions.setXYZ(k, this.p.x + nx * this.radius, this.p.y + ny * this.radius, this.p.z + nz * this.radius);
        normals.setXYZ(k, nx, ny, nz);
      }
    }
    positions.needsUpdate = true; normals.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }
}

function wordmark() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const c = canvas.getContext('2d')!;
  c.clearRect(0, 0, 512, 128);
  c.fillStyle = '#3a3c40';
  c.font = "500 92px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('defex', 256, 66);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  return texture;
}

export interface Cobot {
  root: THREE.Group;
  pose: ArmPose;
  cable: ArmCable;
  meshes: THREE.Mesh[];
  links: { upper: THREE.Group; fore: THREE.Group };
  set(flange: THREE.Vector3, toolYaw: number, cableEnd?: THREE.Vector3): void;
}

export function createCobot(m: Materials): Cobot {
  const mats = cobotMaterials();
  const root = new THREE.Group(); root.name = 'Cobot arm';
  const meshes: THREE.Mesh[] = [];
  const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, name: string) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); meshes.push(mesh); return mesh;
  };
  // A cylinder along local +Y between y=a and y=b.
  const tube = (parent: THREE.Object3D, r: number, a: number, b: number, material: THREE.Material, name: string, sides = 48, fillet = Math.min(0.9, r * 0.18)) =>
    add(parent, roundedCylinder(r, a, b, fillet, sides), material, name);
  // A joint housing whose axis is the parent's local Y, capped both ends:
  // a black ring with a light disc in it, as on the home page's robot.
  const joint = (parent: THREE.Object3D, r: number, length: number, name: string) => {
    tube(parent, r, -length / 2, length / 2, mats.paint, `${name} housing`, 72, r * 0.16);
    for (const s of [-1, 1]) {
      const ring = add(parent, capRing(r), mats.cap, `${name} cap`); ring.position.y = s * length / 2; if (s < 0) ring.rotation.x = Math.PI;
      const face = add(parent, capFace(r), mats.capFace, `${name} cap face`); face.position.y = s * length / 2; if (s < 0) face.rotation.x = Math.PI;
    }
  };

  // J1: the base, turning about Z. Its group's +X points along the arm.
  const base = new THREE.Group(); base.position.copy(BASE); root.add(base);
  const flange = add(base, new THREE.CylinderGeometry(9, 9.4, 1.6, 64), m.dark, 'Base flange'); flange.rotation.x = Math.PI / 2; flange.position.z = 0.8;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    const bolt = add(base, new THREE.CylinderGeometry(0.62, 0.62, 0.5, 16), m.edge, 'Base bolt'); bolt.rotation.x = Math.PI / 2; bolt.position.set(Math.cos(a) * 7.7, Math.sin(a) * 7.7, 1.85);
  }
  const turret = new THREE.Group(); base.add(turret);
  const column = new THREE.Group(); column.rotation.x = Math.PI / 2; turret.add(column);
  tube(column, 6.3, 1.6, 2.6, mats.cap, 'Base seam');
  tube(column, 6.2, 2.6, SHOULDER_Z - 4.5, mats.paint, 'Base column', 64);
  tube(column, 6.25, SHOULDER_Z - 13, SHOULDER_Z - 12.4, mats.cap, 'Base joint seam', 64);
  // J2: the shoulder, its housing across the arm (axis = the turret's local Y).
  const shoulder = new THREE.Group(); shoulder.position.set(0, 0, SHOULDER_Z); turret.add(shoulder);
  joint(shoulder, 6.6, 13, 'Shoulder');

  // The links hang from groups whose local +Y runs along the link.
  const upper = new THREE.Group(); root.add(upper);
  add(upper, flaredLink(UPPER, 6.0, 4.3, 5.3), mats.paint, 'Upper arm');
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshStandardMaterial({ map: wordmark(), color: 0xffffff, transparent: true, opacity: typeof document === 'undefined' ? 0 : 1, roughness: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  decal.name = 'Upper arm mark'; upper.add(decal);
  const elbowJoint = new THREE.Group(); elbowJoint.position.y = UPPER; upper.add(elbowJoint);
  joint(elbowJoint, 5.9, 11, 'Elbow');
  const fore = new THREE.Group(); root.add(fore);
  add(fore, flaredLink(FORE, 5.0, 3.6, 4.3), mats.paint, 'Forearm');
  const wrist = new THREE.Group(); root.add(wrist);
  joint(wrist, 4.7, 9.5, 'Wrist');
  // The wrist's last two joints and the tool flange, straight down to the tool.
  const neck = new THREE.Group(); root.add(neck);
  const neckBody = new THREE.Group(); neckBody.rotation.x = Math.PI / 2; neck.add(neckBody);
  tube(neckBody, 3.7, 3.4, WRIST_DROP - 1, mats.paint, 'Wrist 2', 48);
  tube(neckBody, 3.95, 1.9, 3.4, mats.cap, 'Wrist 3 seam', 48);
  tube(neckBody, 3.6, 0.9, 1.9, m.silver, 'Tool flange', 48);
  tube(neckBody, 3.85, 0.25, 0.9, mats.accent, 'Flange ring', 48);
  const clamps = [0.3, 0.72].map(t => { const g = new THREE.Group(); upper.add(g); const c = tube(g, 1.25, -0.9, 0.9, mats.cap, 'Cable clamp', 16); c.rotation.z = 0; g.position.set(4.55, t * UPPER, 0); g.userData.t = t; return g; });
  const foreClamp = new THREE.Group(); fore.add(foreClamp); tube(foreClamp, 1.1, -0.8, 0.8, mats.cap, 'Cable clamp', 16); foreClamp.position.set(3.85, FORE * 0.55, 0);

  const cable = new ArmCable(m.rubber, 7, 0.85);
  root.add(cable.mesh);

  const pose = solveArm(new THREE.Vector3(0, 0, 42 + FLANGE_Z));
  const dir = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(), basis = new THREE.Matrix4();
  const across = new THREE.Vector3(), points = Array.from({ length: 7 }, () => new THREE.Vector3());
  const place = (group: THREE.Group, from: THREE.Vector3, to: THREE.Vector3) => {
    dir.subVectors(to, from).normalize();
    // local Y along the link, local Z across the arm (the joint axis), local X the outside of the bend
    up.crossVectors(dir, across).normalize();
    basis.makeBasis(up, dir, across);
    group.quaternion.setFromRotationMatrix(basis); group.position.copy(from);
  };

  function set(target: THREE.Vector3, toolYaw: number, cableEnd?: THREE.Vector3) {
    solveArm(target, pose);
    base.rotation.z = 0; turret.rotation.z = pose.yaw;
    across.set(-Math.sin(pose.yaw), Math.cos(pose.yaw), 0);
    // the shoulder joint's axis is the turret's local Y, which is `across`
    place(upper, pose.shoulder, pose.elbow);
    place(fore, pose.elbow, pose.wrist);
    wrist.position.copy(pose.wrist); wrist.quaternion.copy(fore.quaternion);
    neck.position.copy(pose.flange); neck.rotation.set(0, 0, toolYaw);
    // the joint housings on the links take their axis from the links' local Z
    for (const g of [elbowJoint]) g.rotation.set(Math.PI / 2, 0, 0);
    wrist.rotateX(Math.PI / 2); wrist.position.copy(pose.wrist);
    decal.position.set(0, UPPER * 0.52, 4.36); decal.rotation.set(0, 0, -Math.PI / 2);
    // the cable: out of the column's back, along the outside of both links, into the gripper's gland
    root.updateMatrixWorld(true);
    points[0].copy(pose.shoulder).addScaledVector(dir.set(Math.cos(pose.yaw), Math.sin(pose.yaw), 0), -7.4).add(up.set(0, 0, -6));
    clamps[0].localToWorld(points[1].set(0, 0, 0)); root.worldToLocal(points[1]);
    clamps[1].localToWorld(points[2].set(0, 0, 0)); root.worldToLocal(points[2]);
    elbowJoint.localToWorld(points[3].set(0, 0, 0)); root.worldToLocal(points[3]); points[3].z += 7.2;
    foreClamp.localToWorld(points[4].set(0, 0, 0)); root.worldToLocal(points[4]);
    // down past the wrist on the gland's side, into the gripper's own cable
    // gland at (9, 3.6, 14.6) on the tool
    const c = Math.cos(toolYaw), s = Math.sin(toolYaw);
    points[5].set(pose.wrist.x + 6.2 * c - 3 * s, pose.wrist.y + 6.2 * s + 3 * c, pose.wrist.z - 3);
    points[6].set(target.x + 10 * c - 3.6 * s, target.y + 10 * s + 3.6 * c, target.z - FLANGE_Z + 14.6);
    if (cableEnd) points[6].copy(cableEnd);
    cable.update(points);
  }
  set(pose.flange, 0);
  return { root, pose, cable, meshes, links: { upper, fore }, set };
}
