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
  opening.lineTo(halfX, halfY); opening.lineTo(halfX, -halfY);
  opening.lineTo(1.6, -halfY); opening.lineTo(1.6, -halfY - .95);
  opening.lineTo(-1.6, -halfY - .95); opening.lineTo(-1.6, -halfY); opening.closePath();
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
