import * as THREE from 'three';

function surface(grain: boolean) {
  const size = 128, data = new Uint8Array(size * size * 4);
  let seed = 41;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let y = 0; y < size; y++) {
    const band = random();
    for (let x = 0; x < size; x++) {
      const value = Math.round(160 + (grain ? band * 58 + random() * 14 : random() * 60));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value; data[i + 3] = 255;
    }
  }
  const map = new THREE.DataTexture(data, size, size);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.magFilter = THREE.LinearFilter; map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true; map.anisotropy = 4; map.repeat.set(grain ? 2 : 5, grain ? 5 : 5); map.needsUpdate = true;
  return map;
}

const brushed = surface(true), cast = surface(false);
const finish = (name: string, color: number, metalness: number, roughness: number, bumpMap?: THREE.Texture, bumpScale = .012) => {
  const material = new THREE.MeshStandardMaterial({ color, metalness, roughness, ...(bumpMap ? { bumpMap, bumpScale } : {}) });
  material.name = name; return material;
};

export const finishes = {
  base: finish('Anodized graphite', 0x3a3e41, 1, .5, cast, .024),
  body: finish('Powder coated aluminium', 0x282c2e, 0, .62, cast, .027),
  edge: finish('Machined edge', 0xd4d8db, 1, .24, brushed),
  silver: finish('Brushed aluminium', 0xc8cdd0, 1, .4, brushed, .018),
  dark: finish('Black oxide steel', 0x2c3033, 1, .42),
  polymer: finish('Glass-filled PBT', 0x1b1d1f, 0, .5),
  bore: finish('Tapped bore', 0x070808, 0, 1),
  rubber: finish('Elastomer', 0x161818, 0, .82, cast, .01),
  ivory: finish('Molded nylon', 0xdedcd3, 0, .45, cast, .008),
  gold: finish('Contact plating', 0xe9c47e, 1, .2),
  amber: finish('Safety marking', 0xd47a36, 0, .58),
};
