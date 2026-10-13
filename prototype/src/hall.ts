import * as T from 'three';
import { batchStaticMeshes } from './batching.ts';

// The hall from the home page's photo: a deep, empty, bright factory with rows of
// white columns, a steel roof with square LED panels and a polished concrete floor
// that mirrors them. Scene millimetres, z up; the floor's top is at FLOOR.
export const FLOOR = -735;
const SPAN = 120000, ROOF = 10500, PANEL = 900;
// White in the middle, feathered to nothing over the card's outer edge (the lit panel is PANEL wide).
let panelEdge: T.DataTexture | null = null;
function panelAlpha() {
  if (panelEdge) return panelEdge;
  const n = 128, data = new Uint8Array(n * n * 4), lit = 1 / 1.1, edge = (1 - lit) / 2;
  const ramp = (u: number) => { const d = Math.min(u, 1 - u); const t = Math.max(0, Math.min(1, (d - edge * .15) / (edge * 1.7))); return t * t * (3 - 2 * t); };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = (j * n + i) * 4, v = Math.round(255 * ramp((i + .5) / n) * ramp((j + .5) / n)); data[k] = data[k + 1] = data[k + 2] = v; data[k + 3] = 255; }
  panelEdge = new T.DataTexture(data, n, n);
  panelEdge.generateMipmaps = true; panelEdge.minFilter = T.LinearMipmapLinearFilter; panelEdge.magFilter = T.LinearFilter; panelEdge.anisotropy = 8; panelEdge.needsUpdate = true;
  return panelEdge;
}

function slab(parent: T.Object3D, size: number[], pos: number[], mat: T.Material) {
  const o = new T.Mesh(new T.BoxGeometry(size[0], size[1], size[2]), mat);
  o.position.set(pos[0], pos[1], pos[2]); parent.add(o); return o;
}

function structure(m: Record<'deck' | 'paint' | 'wall' | 'steel' | 'panel' | 'glass' | 'door' | 'pallet' | 'wrap', T.Material>) {
  const g = new T.Group(); g.name = 'Hall structure';
  const half = SPAN / 2;
  // columns on a 9 m by 8 m grid, kept off the cell itself
  for (let x = -half + 6000; x <= half - 6000; x += 12000) for (let y = -half + 5000; y <= half - 5000; y += 10000) {
    if (Math.abs(x) < 2500 && Math.abs(y) < 2500) continue;
    slab(g, [520, 520, ROOF - FLOOR], [x, y, (ROOF + FLOOR) / 2], m.paint);
    slab(g, [700, 700, 140], [x, y, FLOOR + 70], m.paint);
  }
  // roof: girders both ways, purlins, deck, a field of square LED panels
  for (let y = -half + 5000; y <= half - 5000; y += 10000) slab(g, [SPAN, 200, 900], [0, y, ROOF - 450], m.steel);
  for (let x = -half + 6000; x <= half - 6000; x += 12000) slab(g, [200, SPAN, 700], [x, 0, ROOF - 350], m.steel);
  for (let x = -half; x <= half; x += 2250) slab(g, [90, SPAN, 140], [x, 0, ROOF + 80], m.steel);
  slab(g, [SPAN, SPAN, 60], [0, 0, ROOF + 400], m.deck);
  // The LED panels are flat, soft-edged cards: their light falls off over the last few centimetres and the
  // texture is mipmapped, so far rows average out instead of twinkling along hard box edges as the camera moves.
  const card = new T.PlaneGeometry(PANEL * 1.1, PANEL * 1.1);
  for (let x = -half + 2250; x < half; x += 4500) for (let y = -half + 2000; y < half; y += 4000) {
    const o = new T.Mesh(card, m.panel); o.position.set(x, y, ROOF - 770); o.rotation.x = Math.PI; g.add(o);
  }
  // walls with a band of windows and loading doors, pallets parked along them
  for (const s of [-1, 1]) {
    slab(g, [SPAN, 200, ROOF - FLOOR + 600], [0, s * half, (ROOF + FLOOR) / 2 + 300], m.wall);
    slab(g, [200, SPAN, ROOF - FLOOR + 600], [s * half, 0, (ROOF + FLOOR) / 2 + 300], m.wall);
    // The window band runs above the loading doors (their tops are at z 3465), so no glass shares a door's face.
    for (let t = -half + 3000; t < half - 2000; t += 6000) {
      slab(g, [1800, 60, 1000], [t, s * (half - 400), 4400], m.glass);
      slab(g, [60, 1800, 1000], [s * (half - 400), t, 4400], m.glass);
    }
    for (let t = -half + 7500; t < half - 6000; t += 18000) {
      slab(g, [3600, 60, 4200], [t, s * (half - 400), FLOOR + 2100], m.door);
      slab(g, [60, 3600, 4200], [s * (half - 400), t, FLOOR + 2100], m.door);
    }
    for (let t = -half + 5000; t < half - 4000; t += 7000) {
      const k = (t / 1000 + s * 7) % 3;
      slab(g, [1200, 1000, 150], [t, s * (half - 1600), FLOOR + 75], m.pallet);
      slab(g, [1100, 950, k > 1 ? 1300 : 800], [t, s * (half - 1600), FLOOR + 150 + (k > 1 ? 650 : 400)], m.wrap);
      slab(g, [1000, 1200, 150], [s * (half - 1600), t, FLOOR + 75], m.pallet);
      slab(g, [950, 1100, k > 1 ? 900 : 1300], [s * (half - 1600), t, FLOOR + 150 + (k > 1 ? 450 : 650)], m.wrap);
    }
  }
  return g;
}

export function createHall() {
  const hall = new T.Group(); hall.name = 'Empty factory hall';
  const make = (side: T.Side, dim = 1) => ({
    deck: new T.MeshStandardMaterial({ color: new T.Color(0x5d6163).multiplyScalar(dim), roughness: .85, envMapIntensity: .5, side }),
    paint: new T.MeshStandardMaterial({ color: new T.Color(0xffffff).multiplyScalar(dim), roughness: .6, envMapIntensity: 1.4, emissive: new T.Color(0x2c2d2d).multiplyScalar(dim), side }),
    wall: new T.MeshStandardMaterial({ color: new T.Color(0xc2c3c3).multiplyScalar(dim), roughness: .9, envMapIntensity: .5, side }),
    steel: new T.MeshStandardMaterial({ color: new T.Color(0x8f9395).multiplyScalar(dim), roughness: .55, metalness: .2, envMapIntensity: .5, side }),
    panel: new T.MeshBasicMaterial({ color: new T.Color(0xffffff).multiplyScalar(dim), toneMapped: false, side: T.DoubleSide, alphaMap: panelAlpha(), transparent: true, depthWrite: false }),
    glass: new T.MeshBasicMaterial({ color: new T.Color(0xf2f6f8).multiplyScalar(dim), toneMapped: false, side }),
    door: new T.MeshStandardMaterial({ color: new T.Color(0xb4b5b5).multiplyScalar(dim), roughness: .6, envMapIntensity: .5, side }),
    pallet: new T.MeshStandardMaterial({ color: new T.Color(0x9a7f5e).multiplyScalar(dim), roughness: .9, envMapIntensity: .4, side }),
    wrap: new T.MeshStandardMaterial({ color: new T.Color(0xd9d6cf).multiplyScalar(dim), roughness: .5, envMapIntensity: .5, side }),
  });
  const up = structure(make(T.FrontSide));
  // the polished floor's reflection: the hall mirrored under a translucent floor
  const down = structure(make(T.BackSide, .78)); down.name = 'Hall reflection';
  down.scale.z = -1; down.position.z = 2 * FLOOR;
  const floorMaterial = new T.MeshPhysicalMaterial({
    color: 0x8e9193, roughness: .2, clearcoat: .8, clearcoatRoughness: .12, transparent: true, opacity: .6, envMapIntensity: .6,
  });
  // Polished concrete mirrors strongly only at grazing angles: looking down at the bench the floor is nearly
  // opaque, and the low hero shot keeps its reflection of the hall.
  floorMaterial.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float grazing = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 4.0);
      gl_FragColor.a = mix(.93, .5, grazing);`);
  };
  floorMaterial.customProgramCacheKey = () => 'fresnel-floor';
  const floor = new T.Mesh(new T.PlaneGeometry(SPAN, SPAN), floorMaterial);
  floor.name = 'Polished concrete floor'; floor.position.z = FLOOR; floor.receiveShadow = true;
  hall.add(up, down, floor);
  batchStaticMeshes(up); batchStaticMeshes(down);
  return hall;
}
