import * as THREE from 'three';

function roundedProfile(halfX: number, halfY: number, radius: number) {
  const s = new THREE.Shape(), x = halfX, y = halfY, r = radius;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
}

export function socketHousing(halfX: number, halfY: number) {
  const shape = roundedProfile(halfX + 3.8, halfY + 3.8, .6);
  const opening = new THREE.Path();
  opening.moveTo(-halfX, -halfY); opening.lineTo(-halfX, halfY);
  opening.lineTo(halfX, halfY); opening.lineTo(halfX, -halfY); opening.closePath();
  shape.holes.push(opening);
  return new THREE.ExtrudeGeometry(shape, { depth: 11.6, bevelEnabled: true, bevelThickness: .2, bevelSize: .18, bevelSegments: 2, curveSegments: 6, steps: 1 });
}

export function plugHousing(halfX: number, halfY: number, pins: number) {
  const shape = roundedProfile(halfX - .1, halfY - .1, .35);
  for (const [x, y] of contactCenters(pins)) {
    const bore = new THREE.Path(); bore.absarc(x, y, .66, 0, Math.PI * 2, true); shape.holes.push(bore);
  }
  return new THREE.ExtrudeGeometry(shape, { depth: 7.8, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 2, curveSegments: 10, steps: 1 });
}

export function contactCenters(pins: number): [number, number][] {
  return Array.from({length: pins}, (_, i) => [(i % (pins / 2) - (pins / 2 - 1) / 2) * 3.1, i < pins / 2 ? -1.55 : 1.55]);
}

// Reuse the tube's buffers as the service loop follows the moving Z slide.
export class ServiceLoop {
  geometry = new THREE.BufferGeometry();
  mesh: THREE.Mesh;
  curve = new THREE.CubicBezierCurve3();
  point = new THREE.Vector3();
  tangent = new THREE.Vector3();
  normal = new THREE.Vector3();
  binormal = new THREE.Vector3();
  segments = 32;
  sides = 8;

  constructor(material: THREE.Material) {
    const indices: number[] = [];
    for (let i = 0; i < this.segments; i++) for (let j = 0; j < this.sides; j++) {
      const a = i * (this.sides + 1) + j, b = a + this.sides + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const count = (this.segments + 1) * (this.sides + 1) * 3;
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count), 3).setUsage(THREE.DynamicDrawUsage));
    this.geometry.setIndex(indices);
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.name = 'Flexible gripper service loop';
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
  }

  update(x: number, y: number, z: number) {
    this.curve.v0.set(x + 6, y + 8, 68);
    this.curve.v1.set(x + 22, y + 8, 70);
    this.curve.v2.set(x + 22, y + 4, z + 18);
    this.curve.v3.set(x + 8, y + 4, z + 17);
    const positions = this.geometry.attributes.position, normals = this.geometry.attributes.normal;
    for (let i = 0; i <= this.segments; i++) {
      this.curve.getPoint(i / this.segments, this.point);
      this.curve.getTangent(i / this.segments, this.tangent);
      this.normal.set(0, 1, 0).cross(this.tangent).normalize();
      this.binormal.crossVectors(this.tangent, this.normal).normalize();
      for (let j = 0; j <= this.sides; j++) {
        const a = j / this.sides * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const nx = this.normal.x * c + this.binormal.x * s;
        const ny = this.normal.y * c + this.binormal.y * s;
        const nz = this.normal.z * c + this.binormal.z * s;
        const index = i * (this.sides + 1) + j;
        positions.setXYZ(index, this.point.x + nx * .52, this.point.y + ny * .52, this.point.z + nz * .52);
        normals.setXYZ(index, nx, ny, nz);
      }
    }
    positions.needsUpdate = true; normals.needsUpdate = true;
  }
}
