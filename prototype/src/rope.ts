import * as T from 'three';

// A deterministic rope: one bundle centreline as a chain of nodes, stepped with small-step position-based dynamics
// (constant segment lengths, a weak bending stiffness, gravity, box contact with friction and self contact). It is
// run once, at build time, over a scripted motion, and stored as a table of frames, so a frame anywhere in the
// motion is a lookup: scrubbing and playing show exactly the same shapes. Scene mm, z up, seconds.
export const GRAVITY = 9810;
// The tightest a harness bundle of six 1 mm wires bends of itself (mm).
export const BEND_RADIUS = 10;
// Sleeping: a node wakes when its length to a moving neighbour is off by WAKE (mm); one lying on something slower than
// REST_SPEED (mm/s) for SLEEP (s) goes to sleep.
const WAKE = .02, REST_SPEED = 2, SLEEP = .25;
// Sine and cosine from + * / alone (their series to the 21st power, for |x| up to about 2): engines differ in the last
// bit of Math.sin and Math.cos, and a simulated rope would carry that difference on.
const SERIES = Array.from({ length: 22 }, (_, k) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return 1 / f; });
export function exactSin(x: number) { let s = 0, p = x, k = 1; const x2 = x * x; while (k < 22) { s += (k % 4 === 1 ? 1 : -1) * p * SERIES[k]; p *= x2; k += 2; } return s; }
export function exactCos(x: number) { let s = 0, p = 1, k = 0; const x2 = x * x; while (k < 22) { s += (k % 4 === 0 ? 1 : -1) * p * SERIES[k]; p *= x2; k += 2; } return s; }
// A turn about y by a, with those.
export function rotationY(a: number, out: T.Matrix4) { const c = exactCos(a), s = exactSin(a); return out.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1); }
export interface RopeCollider {
  name: string;
  // half sizes of a box centred on its local origin
  half: readonly [number, number, number];
  // its local-to-world transform at time t; omitted: `at` for all time
  pose?: (t: number, out: T.Matrix4) => void;
  at?: T.Matrix4;
  friction?: number;
}
// until: from then on the node is free (a held end let go), carrying on with the speed it had.
export interface RopeAttachment { node: number; local: T.Vector3; frame: (t: number, out: T.Matrix4) => void; until?: number }
export interface RopeSpec {
  points: readonly T.Vector3[];
  // nodes carried rigidly: placed at frame(t) * local
  attached: RopeAttachment[];
  // nodes held where they start until `until` (the far end in its clamp) and, given `pulled`, until the next node in
  // has been drawn that far from where it started (a wire end sitting in its grommet until it is pulled out)
  held?: { node: number; until: number; pulled?: number }[];
  colliders: RopeCollider[];
  t0: number; t1: number;
  rate?: number; fps?: number;
  // contact radius of the centreline: lying (vertical contact) and against walls
  radius?: { v: number; h: number };
  friction?: number;
  // per-node mass factor (default 1): a heavy end
  mass?: (node: number) => number;
  // velocity kept per second (air and internal damping)
  damping?: number;
  // internal friction: each node's motion is pulled toward its neighbours' (per substep), which damps the bundle's
  // whip without slowing it as a whole
  internal?: number;
  bend?: number;
  // length passes per substep (each way in turn)
  passes?: number;
  // further rounds of two length passes and the contacts, per substep (a rope pulled hard over edges)
  settle?: number;
  // brush seals, world boxes [x0, y0, z0, x1, y1, z1]: the bristles grip a node inside, taking `hold` (mm/s/s) off its
  // speed, so the rope does not slide through of its own weight; pulled, it goes through at the pace it is pulled
  brush?: { box: readonly number[]; hold: number }[];
}
export interface RopeTrack { n: number; t0: number; t1: number; fps: number; frames: Float32Array; count: number; state?: RopeState }
// The chain's positions and previous positions at a time: a run can go on from one (a shared start, then branches).
export interface RopeState { t: number; pos: Float64Array; prev: Float64Array; asleep: Uint8Array; still: Float64Array }

const local = new T.Vector3(), m4 = new T.Matrix4(), m4b = new T.Matrix4();
// spec.from: go on from that state (spec.t0 must be its time); spec.stateAt: also return the state at that time.
export function simulateRope(spec: RopeSpec & { from?: RopeState; stateAt?: number }): RopeTrack {
  const run = ropeRun(spec);
  while (!run.advance(Infinity));
  return run.track();
}
// The same run, a slice at a time: advance(n) runs up to n substeps and says whether the run is done.
export function ropeRun(spec: RopeSpec & { from?: RopeState; stateAt?: number }) {
  const n = spec.points.length, rate = spec.rate ?? 1200, fps = spec.fps ?? 120, dt = 1 / rate;
  const rV = spec.radius?.v ?? 1, rH = spec.radius?.h ?? 1.95, mu = spec.friction ?? .35, bend = spec.bend ?? .015;
  const keep = Math.pow(spec.damping ?? .35, dt), beta = spec.internal ?? .06, move = new Float64Array(n * 3);
  const pos = new Float64Array(n * 3), prev = new Float64Array(n * 3), w = new Float64Array(n), rest = new Float64Array(n - 1);
  // starting points rounded to a millionth of a mm, so every engine starts from the same numbers
  const q = (v: number) => Math.round(v * 1e6) / 1e6;
  spec.points.forEach((p, i) => { pos[i * 3] = q(p.x); pos[i * 3 + 1] = q(p.y); pos[i * 3 + 2] = q(p.z); });
  for (let i = 0; i < n - 1; i++) rest[i] = Math.hypot(pos[i * 3 + 3] - pos[i * 3], pos[i * 3 + 4] - pos[i * 3 + 1], pos[i * 3 + 5] - pos[i * 3 + 2]);
  // The bundle bends no tighter than BEND_RADIUS, or than it was dressed where it starts tighter: the least span of a
  // node and the one after next, and each node's rope length from the start (for the tethers below).
  const minSpan = new Float64Array(Math.max(0, n - 2)), along = new Float64Array(n);
  for (let i = 0; i < n - 2; i++) {
    const s2 = (rest[i] + rest[i + 1]) / 2, turn = s2 / BEND_RADIUS, span = 2 * s2 * Math.cos(turn / 2);
    const now = Math.hypot(pos[i * 3 + 6] - pos[i * 3], pos[i * 3 + 7] - pos[i * 3 + 1], pos[i * 3 + 8] - pos[i * 3 + 2]);
    minSpan[i] = Math.min(span, now);
  }
  for (let i = 1; i < n; i++) along[i] = along[i - 1] + rest[i - 1];
  const start = new Float64Array(pos);
  if (spec.from) { pos.set(spec.from.pos); prev.set(spec.from.prev); } else prev.set(pos);
  for (let i = 0; i < n; i++) w[i] = 1 / (spec.mass?.(i) ?? 1);
  const kinematic = new Uint8Array(n), until = new Float64Array(n).fill(Infinity);
  for (const a of spec.attached) { kinematic[a.node] = 1; until[a.node] = a.until ?? Infinity; }
  // Every node starts asleep, exactly as dressed: it wakes when something pulls or pushes it, and goes back to sleep
  // once it has lain still for a while, so a harness at rest is still, not creeping.
  const asleep = new Uint8Array(n).fill(1), still = new Float64Array(n);
  if (spec.from) { asleep.set(spec.from.asleep); still.set(spec.from.still); }
  const held = new Float64Array(n).fill(-Infinity), pulled = new Float64Array(n).fill(-1);
  for (const h of spec.held ?? []) { held[h.node] = h.until; pulled[h.node] = h.pulled ?? -1; }
  // Colliders as world-to-local matrices (12 floats) now and one substep ago, their half sizes and world bounds.
  const C = spec.colliders.length, inv = new Float64Array(C * 12), fwdPrev = new Float64Array(C * 12), fwd = new Float64Array(C * 12), half = new Float64Array(C * 3);
  const moving = spec.colliders.map(c => !!c.pose), fr = new Float64Array(C), bounds = new Float64Array(C * 6);
  // a thin part (a board, a divider, a wall): the bundle keeps its half width from it every way, so it wraps an edge
  // whole rather than straddling it
  const thin = spec.colliders.map(c => Math.min(...c.half) < 2);
  const store = (k: number, m: T.Matrix4, into: Float64Array) => { const e = m.elements; into.set([e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10], e[12], e[13], e[14]], k * 12); };
  const bound = (k: number) => {
    const e = fwd, o = k * 12, h = k * 3;
    for (let a = 0; a < 3; a++) {
      const ext = Math.abs(e[o + a]) * half[h] + Math.abs(e[o + 3 + a]) * half[h + 1] + Math.abs(e[o + 6 + a]) * half[h + 2] + rH + 2;
      bounds[k * 6 + a] = e[o + 9 + a] - ext; bounds[k * 6 + 3 + a] = e[o + 9 + a] + ext;
    }
  };
  const same = (k: number, m: T.Matrix4) => { const e = m.elements, o = k * 12; return e[0] === fwd[o] && e[1] === fwd[o + 1] && e[2] === fwd[o + 2] && e[4] === fwd[o + 3] && e[5] === fwd[o + 4] && e[6] === fwd[o + 5] && e[8] === fwd[o + 6] && e[9] === fwd[o + 7] && e[10] === fwd[o + 8] && e[12] === fwd[o + 9] && e[13] === fwd[o + 10] && e[14] === fwd[o + 11]; };
  const poseAt = (k: number, t: number, first = false) => {
    const c = spec.colliders[k]; if (c.pose) c.pose(t, m4); else m4.copy(c.at!);
    if (!first && same(k, m4)) return;
    store(k, m4, fwd); store(k, m4b.copy(m4).invert(), inv); bound(k);
  };
  spec.colliders.forEach((c, k) => { half.set(c.half, k * 3); fr[k] = c.friction ?? mu; poseAt(k, spec.t0, true); });
  fwdPrev.set(fwd);
  // Each node's side radius starts no larger than its clearance as dressed, so nothing is pushed at the start; it grows
  // to the bundle's once the node has moved.
  const side = new Float64Array(n).fill(rH);
  for (let i = 0; i < n; i++) for (let k = 0; k < C; k++) {
    const o = k * 12, e = inv, x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], h = k * 3;
    const lx = e[o] * x + e[o + 3] * y + e[o + 6] * z + e[o + 9], ly = e[o + 1] * x + e[o + 4] * y + e[o + 7] * z + e[o + 10], lz = e[o + 2] * x + e[o + 5] * y + e[o + 8] * z + e[o + 11];
    const d = Math.hypot(lx - Math.max(-half[h], Math.min(half[h], lx)), ly - Math.max(-half[h + 1], Math.min(half[h + 1], ly)), lz - Math.max(-half[h + 2], Math.min(half[h + 2], lz)));
    if (d < side[i]) side[i] = Math.max(rV, d - 1e-4);
  }
  // how much speed (as a move per substep) the brushes take off a node there
  const brushes = spec.brush ?? [];
  const gripped = (x: number, y: number, z: number) => { let k = 0; for (const { box: b, hold } of brushes) if (x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5]) k += hold * dt * dt; return k; };
  const frames: number[][] = [];
  const total = Math.round((spec.t1 - spec.t0) * rate), stateStep = spec.stateAt === undefined ? -1 : Math.round((spec.stateAt - spec.t0) * rate);
  let recorded = 0, state: RopeState | undefined;
  const contact = new Int32Array(n), depth = new Float64Array(n), normal = new Float64Array(n * 3), active = new Int32Array(C), order = new Int32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  const record = () => { const f = new Array(n * 3); for (let i = 0; i < n * 3; i++) f[i] = pos[i]; frames.push(f); };
  record();
  let step = 0;
  const advance = (count: number) => {
  for (let left = count; left > 0 && step < total; left--) {
    step++;
    const t = spec.t0 + step * dt;
    fwdPrev.set(fwd);
    for (let k = 0; k < C; k++) if (moving[k]) poseAt(k, t);
    for (const a of spec.attached) if (t >= until[a.node] && kinematic[a.node]) kinematic[a.node] = 0;
    for (let i = 0; i < n; i++) if (pulled[i] >= 0 && t >= held[i]) {
      const k = i === n - 1 ? i - 1 : i + 1, j = k * 3;
      if (Math.hypot(pos[j] - start[j], pos[j + 1] - start[j + 1], pos[j + 2] - start[j + 2]) > pulled[i]) pulled[i] = -1; else held[i] = t + dt;
    }
    for (const a of spec.attached) { if (!kinematic[a.node]) continue; a.frame(t, m4); local.copy(a.local).applyMatrix4(m4); const i = a.node * 3; prev[i] = pos[i]; prev[i + 1] = pos[i + 1]; prev[i + 2] = pos[i + 2]; pos[i] = local.x; pos[i + 1] = local.y; pos[i + 2] = local.z; }
    for (let i = 0; i < n * 3; i++) move[i] = pos[i] - prev[i];
    for (let i = 0; i < n; i++) {
      if (kinematic[i] || asleep[i]) { if (!kinematic[i]) { const j = i * 3; prev[j] = pos[j]; prev[j + 1] = pos[j + 1]; prev[j + 2] = pos[j + 2]; } continue; }
      const j = i * 3;
      if (t < held[i]) { prev[j] = pos[j] = start[j]; prev[j + 1] = pos[j + 1] = start[j + 1]; prev[j + 2] = pos[j + 2] = start[j + 2]; continue; }
      const a = i > 0 ? j - 3 : j + 3, b = i < n - 1 ? j + 3 : j - 3;
      const vx = (move[j] + beta * ((move[a] + move[b]) / 2 - move[j])) * keep, vy = (move[j + 1] + beta * ((move[a + 1] + move[b + 1]) / 2 - move[j + 1])) * keep, vz = (move[j + 2] + beta * ((move[a + 2] + move[b + 2]) / 2 - move[j + 2])) * keep;
      prev[j] = pos[j]; prev[j + 1] = pos[j + 1]; prev[j + 2] = pos[j + 2];
      pos[j] += vx; pos[j + 1] += vy; pos[j + 2] += vz - GRAVITY * dt * dt;
    }
    // wake a sleeping node whose neighbour is moving, or whose length to it has been disturbed
    for (let i = 0; i < n - 1; i++) if (asleep[i] !== asleep[i + 1] || (asleep[i] && kinematic[i + 1]) || (asleep[i + 1] && kinematic[i])) {
      const a = i * 3, b = a + 3, d = Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]);
      const mover = asleep[i] ? b : a, speed = Math.hypot(move[mover], move[mover + 1], move[mover + 2]);
      if (Math.abs(d - rest[i]) > WAKE || speed > REST_SPEED * dt) { asleep[i] = 0; asleep[i + 1] = 0; }
    }
    for (let i = 0; i < n; i++) if (kinematic[i]) asleep[i] = 0;
    const free = (i: number) => kinematic[i] || asleep[i] || t < held[i] ? 0 : w[i];
    // lengths, both ways, so neither end leads
    const lengths = (passes: number) => { for (let pass = 0; pass < passes; pass++) for (let s = 0; s < n - 1; s++) {
        const i = pass % 2 ? n - 2 - s : s, a = i * 3, b = a + 3, wa = free(i), wb = free(i + 1), ws = wa + wb;
      if (!ws) continue;
      const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2], d = Math.hypot(dx, dy, dz) || 1e-9, c = (d - rest[i]) / d / ws;
      pos[a] += dx * c * wa; pos[a + 1] += dy * c * wa; pos[a + 2] += dz * c * wa;
      pos[b] -= dx * c * wb; pos[b + 1] -= dy * c * wb; pos[b + 2] -= dz * c * wb;
    } };
    lengths(spec.passes ?? 4);
    // The brushes grip what is in them: a node there moves this substep only by what is left after the grip (its own
    // weight and the rope hanging from it do not draw it through; the tethers below, a pull from the held end, do).
    if (brushes.length) for (let i = 0; i < n; i++) {
      if (!free(i)) continue;
      const j = i * 3, k = gripped(prev[j], prev[j + 1], prev[j + 2]); if (!k) continue;
      const dx = pos[j] - prev[j], dy = pos[j + 1] - prev[j + 1], dz = pos[j + 2] - prev[j + 2], m = Math.hypot(dx, dy, dz), s = m > k ? 1 - k / m : 0;
      pos[j] = prev[j] + dx * s; pos[j + 1] = prev[j + 1] + dy * s; pos[j + 2] = prev[j + 2] + dz * s;
    }
    // Tethers: no node is further from a held node than the rope between them (so a hanging harness keeps its length,
    // which a chain of length constraints alone lets stretch).
    let headNode = -1, tailNode = n;
    for (let i = 0; i < n; i++) { if (kinematic[i]) headNode = i; else break; }
    for (let i = n - 1; i >= 0; i--) { if (t < held[i]) tailNode = i; else break; }
    for (const [h, from, to] of [[headNode, headNode + 1, tailNode], [tailNode, headNode + 1, tailNode]] as const) {
      if (h < 0 || h >= n) continue;
      const hx = pos[h * 3], hy = pos[h * 3 + 1], hz = pos[h * 3 + 2];
      for (let i = from; i < to; i++) {
        const j = i * 3, dx = pos[j] - hx, dy = pos[j + 1] - hy, dz = pos[j + 2] - hz, d = Math.sqrt(dx * dx + dy * dy + dz * dz), L = Math.abs(along[i] - along[h]);
        if (d > L && d > 0 && free(i)) { const k = L / d; pos[j] = hx + dx * k; pos[j + 1] = hy + dy * k; pos[j + 2] = hz + dz * k; }
      }
    }
    // bending: a node and the one after next resist coming closer than their straight span
    for (let i = 0; i < n - 2; i++) {
      const a = i * 3, b = a + 6, wa = free(i), wb = free(i + 2), ws = wa + wb;
      if (!ws) continue;
      const dx = pos[b] - pos[a], dy = pos[b + 1] - pos[a + 1], dz = pos[b + 2] - pos[a + 2], d = Math.hypot(dx, dy, dz) || 1e-9, r = rest[i] + rest[i + 1];
      if (d >= r) continue;
      const c = (d < minSpan[i] ? .5 * (d - minSpan[i]) + bend * (minSpan[i] - r) : bend * (d - r)) / d / ws;
      pos[a] += dx * c * wa; pos[a + 1] += dy * c * wa; pos[a + 2] += dz * c * wa;
      pos[b] -= dx * c * wb; pos[b + 1] -= dy * c * wb; pos[b + 2] -= dz * c * wb;
    }
    // self contact between nodes far apart along the rope: nodes kept sorted along x, so only near ones are compared
    if (step % 2 === 0) {
      const min = 2.5, min2 = min * min;
      for (let i = 1; i < n; i++) { const v = order[i], x = pos[v * 3]; let k = i - 1; while (k >= 0 && pos[order[k] * 3] > x) { order[k + 1] = order[k]; k--; } order[k + 1] = v; }
      for (let p = 0; p < n; p++) {
        const i = order[p], a = i * 3, wa = free(i);
        for (let q = p + 1; q < n; q++) {
          const k = order[q], b = k * 3, dx = pos[b] - pos[a];
          if (dx > min) break;
          if (Math.abs(k - i) < 4) continue;
          const dy = pos[b + 1] - pos[a + 1]; if (dy > min || dy < -min) continue;
          const dz = pos[b + 2] - pos[a + 2], d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= min2) continue;
          const wb = free(k), ws = wa + wb; if (!ws) continue;
          const d = Math.sqrt(d2) || 1e-6, c = (d - min) / d / ws * .5;
          pos[a] += dx * c * wa; pos[a + 1] += dy * c * wa; pos[a + 2] += dz * c * wa;
          pos[b] -= dx * c * wb; pos[b + 1] -= dy * c * wb; pos[b + 2] -= dz * c * wb;
        }
      }
    }
    // the colliders near the rope this substep
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i++) { const j = i * 3; if (pos[j] < x0) x0 = pos[j]; if (pos[j] > x1) x1 = pos[j]; if (pos[j + 1] < y0) y0 = pos[j + 1]; if (pos[j + 1] > y1) y1 = pos[j + 1]; if (pos[j + 2] < z0) z0 = pos[j + 2]; if (pos[j + 2] > z1) z1 = pos[j + 2]; }
    let A = 0;
    for (let k = 0; k < C; k++) { const bo = k * 6; if (bounds[bo] <= x1 && bounds[bo + 3] >= x0 && bounds[bo + 1] <= y1 && bounds[bo + 4] >= y0 && bounds[bo + 2] <= z1 && bounds[bo + 5] >= z0) active[A++] = k; }
    // contact with the boxes: out along the shallowest axis, then friction against the box's own motion
    const collide = () => {
    contact.fill(-1);
    for (let i = 0; i < n; i++) {
      const sleeping = asleep[i] && !kinematic[i] && !(t < held[i]);
      if (!free(i) && !sleeping) continue;
      const j = i * 3;
      for (let q = 0; q < A; q++) {
        const k = active[q], bo = k * 6;
        if (sleeping && !moving[k]) continue;
        if (pos[j] < bounds[bo] || pos[j] > bounds[bo + 3] || pos[j + 1] < bounds[bo + 1] || pos[j + 1] > bounds[bo + 4] || pos[j + 2] < bounds[bo + 2] || pos[j + 2] > bounds[bo + 5]) continue;
        const o = k * 12, e = inv, x = pos[j], y = pos[j + 1], z = pos[j + 2];
        const lx = e[o] * x + e[o + 3] * y + e[o + 6] * z + e[o + 9], ly = e[o + 1] * x + e[o + 4] * y + e[o + 7] * z + e[o + 10], lz = e[o + 2] * x + e[o + 5] * y + e[o + 8] * z + e[o + 11];
        // A sphere against the box: out from the box's closest point (round over its edges and corners, so a rope slides
        // over an edge), or, from inside, out through the nearest face. The contact radius is the bundle's: half its
        // height lying on a face, half its width against a wall.
        const h = k * 3, f = fwd;
        const qx = Math.max(-half[h], Math.min(half[h], lx)), qy = Math.max(-half[h + 1], Math.min(half[h + 1], ly)), qz = Math.max(-half[h + 2], Math.min(half[h + 2], lz));
        let dx = lx - qx, dy = ly - qy, dz = lz - qz, dist = Math.hypot(dx, dy, dz), best: number, nx: number, ny: number, nz: number;
        if (dist > 1e-9) {
          dx /= dist; dy /= dist; dz /= dist;
          nx = f[o] * dx + f[o + 3] * dy + f[o + 6] * dz; ny = f[o + 1] * dx + f[o + 4] * dy + f[o + 7] * dz; nz = f[o + 2] * dx + f[o + 5] * dy + f[o + 8] * dz;
          const r = thin[k] ? side[i] : side[i] + (rV - side[i]) * Math.abs(nz);
          if (dist >= r) continue;
          best = r - dist;
        } else {
          let axis = 0, sign = 1;best = Infinity;
          for (let a = 0; a < 3; a++) { const l = a === 0 ? lx : a === 1 ? ly : lz, pen = half[h + a] - Math.abs(l); if (pen < best) { best = pen; axis = a; sign = l >= 0 ? 1 : -1; } }
          nx = f[o + axis * 3] * sign; ny = f[o + axis * 3 + 1] * sign; nz = f[o + axis * 3 + 2] * sign;
          best += thin[k] ? side[i] : side[i] + (rV - side[i]) * Math.abs(nz);
        }
        // a moving part reaching a sleeping node wakes it
        if (sleeping) { if (best > 1e-3) asleep[i] = 0; else continue; }
        pos[j] += nx * best; pos[j + 1] += ny * best; pos[j + 2] += nz * best;
        if (best > depth[i] || contact[i] < 0) { contact[i] = k; depth[i] = best; normal[j] = nx; normal[j + 1] = ny; normal[j + 2] = nz; }
      }
    }
    };
    collide();
    for (let i = 0; i < n; i++) {
      const k = contact[i]; if (k < 0) { depth[i] = 0; continue; }
      const j = i * 3, o = k * 12;
      // where this point of the box was a substep ago: its local coordinates now, through the old pose
      let mx = 0, my = 0, mz = 0;
      if (moving[k]) {
        const e = inv, x = pos[j], y = pos[j + 1], z = pos[j + 2];
        const lx = e[o] * x + e[o + 3] * y + e[o + 6] * z + e[o + 9], ly = e[o + 1] * x + e[o + 4] * y + e[o + 7] * z + e[o + 10], lz = e[o + 2] * x + e[o + 5] * y + e[o + 8] * z + e[o + 11];
        const f = fwdPrev;
        mx = x - (f[o] * lx + f[o + 3] * ly + f[o + 6] * lz + f[o + 9]); my = y - (f[o + 1] * lx + f[o + 4] * ly + f[o + 7] * lz + f[o + 10]); mz = z - (f[o + 2] * lx + f[o + 5] * ly + f[o + 8] * lz + f[o + 11]);
      }
      const dx = pos[j] - prev[j] - mx, dy = pos[j + 1] - prev[j + 1] - my, dz = pos[j + 2] - prev[j + 2] - mz, nx = normal[j], ny = normal[j + 1], nz = normal[j + 2];
      const dn = dx * nx + dy * ny + dz * nz, tx = dx - dn * nx, ty = dy - dn * ny, tz = dz - dn * nz, tl = Math.hypot(tx, ty, tz);
      // Coulomb friction from the node's own weight on a face that carries it
      const limit = fr[k] * GRAVITY * dt * dt * Math.max(0, nz), s = tl <= limit ? 1 : limit / tl;
      pos[j] -= tx * s; pos[j + 1] -= ty * s; pos[j + 2] -= tz * s;
      depth[i] = 0;
    }
    // drawn hard over an edge, the contacts last pushed out undo some of the lengths: lengths and contacts again
    for (let k = 0; k < (spec.settle ?? 0); k++) { lengths(2); collide(); depth.fill(0); }
    for (let i = 0; i < n; i++) {
      if (!free(i)) continue;
      const j = i * 3, v = Math.hypot(pos[j] - prev[j], pos[j + 1] - prev[j + 1], pos[j + 2] - prev[j + 2]);
      if (contact[i] >= 0 && v < REST_SPEED * dt) { still[i] += dt; if (still[i] >= SLEEP) { asleep[i] = 1; still[i] = 0; } } else still[i] = 0;
    }
    for (let i = 0; i < n; i++) if (side[i] < rH && Math.hypot(pos[i * 3] - start[i * 3], pos[i * 3 + 1] - start[i * 3 + 1], pos[i * 3 + 2] - start[i * 3 + 2]) > .5) side[i] = Math.min(rH, side[i] + (rH - rV) * dt / .2);
    if (Math.floor(step * fps / rate + 1e-9) > recorded) { recorded++; record(); }
    if (step === stateStep) state = { t, pos: new Float64Array(pos), prev: new Float64Array(prev), asleep: new Uint8Array(asleep), still: new Float64Array(still) };
  }
  return step >= total;
  };
  const track = (): RopeTrack => {
    const frames32 = new Float32Array(frames.length * n * 3);
    frames.forEach((f, k) => frames32.set(f, k * n * 3));
    return { n, t0: spec.t0, t1: spec.t0 + (frames.length - 1) / fps, fps, frames: frames32, count: frames.length, state };
  };
  return { advance, track };
}

// The centreline at time t, linearly between the stored frames; before t0 the first frame, after t1 the last.
export function sampleRope(track: RopeTrack, t: number, out: Float64Array) {
  const u = Math.max(0, Math.min(track.count - 1, (t - track.t0) * track.fps)), k = Math.min(track.count - 2, Math.floor(u)), f = u - k, n3 = track.n * 3;
  const a = k * n3, b = a + n3, F = track.frames;
  if (track.count < 2) { for (let i = 0; i < n3; i++) out[i] = F[i]; return out; }
  for (let i = 0; i < n3; i++) out[i] = F[a + i] + (F[b + i] - F[a + i]) * f;
  return out;
}

// The six wires drawn round the simulated centreline. Each wire point keeps the offset it had from the centreline at
// the start, in a frame carried along the rope from the housing without turning about it (so the wires never twist or
// fold over each other where the rope hangs and curls): its tangent, a normal and the binormal. Where the rope lies
// level the normal is drawn round toward the level, so a lying bundle keeps its two rows one above the other, as
// dressed. The first `rigid` points of every wire
// (the pigtail out of the housing) move rigidly with the housing instead.
export interface Bundle {
  wires: number; points: number; rigid: number;
  // per wire point: the centreline node it follows and its offset in that node's frame (n, b, t)
  node: Int32Array; offset: Float64Array;
  // the pigtail points in the housing's frame at the start
  pigtail: T.Vector3[][];
  // per wire point, the offset its far end gathers to once free (bundled, no fan); null: keeps its offset
  gather: Float64Array | null;
  // per wire point, how far along its wire it was at the start: each wire is drawn at its own length (the wires of a
  // loose bundle slide along each other round a coil rather than stretch)
  along: Float64Array;
  // the first point that gathers
  fan: number;
  // the frames' first normal, in the housing's frame: it turns with the housing
  seed: T.Vector3;
  // the far end's normal as dressed (where it is held)
  tail: T.Vector3;
}
const tn = new T.Vector3(), nn = new T.Vector3(), bn = new T.Vector3(), Zv = new T.Vector3(0, 0, 1), pn = new T.Vector3();
// how far a node turns the normal toward the level, where the rope lies level
const LEVEL = .5;
// One way along the rope (from the housing, or back from the far end), each node's frame carried from the one before.
function carry(c: ArrayLike<number>, n: number, out: Float64Array, seed: T.Vector3, back: boolean) {
  pn.copy(seed);
  for (let s = 0; s < n; s++) {
    const k = back ? n - 1 - s : s, a = Math.max(0, k - 1) * 3, b = Math.min(n - 1, k + 1) * 3;
    tn.set(c[b] - c[a], c[b + 1] - c[a + 1], c[b + 2] - c[a + 2]).normalize();
    nn.crossVectors(Zv, tn); const h = nn.length();
    // previous normal, made perpendicular to this tangent
    pn.addScaledVector(tn, -pn.dot(tn)); if (pn.lengthSq() < 1e-12) pn.set(1, 0, 0).addScaledVector(tn, -tn.x); pn.normalize();
    // where the rope lies nearly level, the carried normal turns toward the level one a little at each node (so it comes
    // round over a few nodes, never at once); elsewhere it is only carried
    if (h > 1e-6) { nn.divideScalar(h); if (nn.dot(pn) < 0) nn.negate(); const x = Math.min(1, Math.max(0, (h - .8) / .15)), w = x * x * (3 - 2 * x) * LEVEL; nn.multiplyScalar(w).addScaledVector(pn, 1 - w).normalize(); }
    else nn.copy(pn);
    bn.crossVectors(tn, nn);
    out.set([nn.x, nn.y, nn.z, bn.x, bn.y, bn.z, tn.x, tn.y, tn.z], k * 9);
    pn.copy(nn);
  }
  return out;
}
// The frames along the rope, carried from the housing; while the far end is held as dressed (tail given, weight up to
// 1), carried back from it too, and each node's normal turned between the two by how far along it is: the twist of a
// bundle held at both ends spreads along it, and the held end stays exactly as dressed.
const backScratch = { f: new Float64Array(0) }, na = new T.Vector3(), nb = new T.Vector3(), ta = new T.Vector3(), cx = new T.Vector3();
export function ropeFrames(c: ArrayLike<number>, n: number, out: Float64Array, seed?: T.Vector3, tail?: T.Vector3, weight = 0) {
  carry(c, n, out, seed ?? new T.Vector3(1, 0, 0), false);
  if (!tail || weight <= 0) return out;
  if (backScratch.f.length < n * 9) backScratch.f = new Float64Array(n * 9);
  const B = carry(c, n, backScratch.f, tail, true);
  for (let k = 0; k < n; k++) {
    const o = k * 9, x = k / (n - 1), w = x * x * (3 - 2 * x) * weight;
    na.set(out[o], out[o + 1], out[o + 2]); nb.set(B[o], B[o + 1], B[o + 2]); ta.set(out[o + 6], out[o + 7], out[o + 8]);
    nb.addScaledVector(ta, -nb.dot(ta)).normalize();
    const angle = Math.atan2(cx.crossVectors(na, nb).dot(ta), na.dot(nb)) * w, cs = Math.cos(angle), sn = Math.sin(angle);
    cx.crossVectors(ta, na); na.multiplyScalar(cs).addScaledVector(cx, sn).normalize(); bn.crossVectors(ta, na);
    out[o] = na.x; out[o + 1] = na.y; out[o + 2] = na.z; out[o + 3] = bn.x; out[o + 4] = bn.y; out[o + 5] = bn.z;
  }
  return out;
}
export function makeBundle(wires: T.Vector3[][], centre: ArrayLike<number>, n: number, nodeOf: (j: number) => number, rigid: number, housing: T.Matrix4, gather?: (wire: number, j: number) => [number, number] | null, seed = new T.Vector3(1, 0, 0)): Bundle {
  const points = wires[0].length, node = new Int32Array(points), offset = new Float64Array(wires.length * points * 3), forward = ropeFrames(centre, n, new Float64Array(n * 9), seed);
  // the far end's dressed normal, the frame carried back from it while it is held
  const tail = new T.Vector3(forward[(n - 1) * 9], forward[(n - 1) * 9 + 1], forward[(n - 1) * 9 + 2]), frames = ropeFrames(centre, n, new Float64Array(n * 9), seed, tail, 1);
  const toHousing = housing.clone().invert();
  for (let j = 0; j < points; j++) node[j] = nodeOf(j);
  let gathered: Float64Array | null = null;
  if (gather) gathered = new Float64Array(wires.length * points * 3).fill(NaN);
  wires.forEach((wire, i) => wire.forEach((p, j) => {
    const k = node[j], f = k * 9, dx = p.x - centre[k * 3], dy = p.y - centre[k * 3 + 1], dz = p.z - centre[k * 3 + 2], o = (i * points + j) * 3;
    offset[o] = dx * frames[f] + dy * frames[f + 1] + dz * frames[f + 2];
    offset[o + 1] = dx * frames[f + 3] + dy * frames[f + 4] + dz * frames[f + 5];
    offset[o + 2] = dx * frames[f + 6] + dy * frames[f + 7] + dz * frames[f + 8];
    const g = gather?.(i, j); if (g && gathered) { gathered[o] = g[0]; gathered[o + 1] = g[1]; gathered[o + 2] = 0; }
  }));
  const along = new Float64Array(wires.length * points);
  wires.forEach((wire, i) => { for (let j = 1; j < points; j++) along[i * points + j] = along[i * points + j - 1] + wire[j].distanceTo(wire[j - 1]); });
  let fan = points;
  if (gathered) for (let j = 0; j < points; j++) if (!Number.isNaN(gathered[j * 3])) { fan = j; break; }
  // gathered, each wire goes back to the place it has in the bundle before the fan, so none crosses another
  // (from a little before the fan, where the bundle is still whole, eased in over FAN_BACK points)
  if (gathered && fan < points) { const from = Math.max(rigid, fan - FAN_BACK); wires.forEach((_, i) => { const o = (i * points + from) * 3; for (let j = from; j < points; j++) { const g = (i * points + j) * 3; gathered![g] = offset[o]; gathered![g + 1] = offset[o + 1]; gathered![g + 2] = 0; } }); fan = from; }
  return { wires: wires.length, points, rigid, node, offset, pigtail: wires.map(w => w.slice(0, rigid).map(p => p.clone().applyMatrix4(toHousing))), gather: gathered, along, fan, seed: seed.clone().transformDirection(toHousing), tail };
}
const frameScratch = { f: new Float64Array(0) }, seedNow = new T.Vector3();
// how far before the fan the bundle is still whole (points)
const FAN_BACK = 8;
// Wire points for the centreline c. housing: the housing's transform now; gathered: 0..1 how far the far ends have
// gathered into the bundle.
export function bundleWires(b: Bundle, c: ArrayLike<number>, n: number, housing: T.Matrix4, out: T.Vector3[][], gathered = 0, normals?: ArrayLike<number>) {
  if (frameScratch.f.length < n * 9) frameScratch.f = new Float64Array(n * 9);
  // a track's own frames (twistTrack) where it has them; else held, the far end keeps its own frame, and let go (as
  // its wires gather) the frame is carried from the housing alone
  const F = normals ? framesOf(c, n, normals, frameScratch.f) : ropeFrames(c, n, frameScratch.f, seedNow.copy(b.seed).transformDirection(housing), b.tail, 1 - gathered);
  for (let i = 0; i < b.wires; i++) for (let j = 0; j < b.points; j++) {
    const p = out[i][j];
    if (j < b.rigid) { p.copy(b.pigtail[i][j]).applyMatrix4(housing); continue; }
    const k = b.node[j], f = k * 9, o = (i * b.points + j) * 3;
    let x = b.offset[o], y = b.offset[o + 1], z = b.offset[o + 2];
    if (gathered > 0 && b.gather && !Number.isNaN(b.gather[o])) { const e = Math.min(1, (j - b.fan) / FAN_BACK), g = gathered * e * e * (3 - 2 * e); x += (b.gather[o] - x) * g; y += (b.gather[o + 1] - y) * g; z += (b.gather[o + 2] - z) * g; }
    p.set(c[k * 3] + x * F[f] + y * F[f + 3] + z * F[f + 6], c[k * 3 + 1] + x * F[f + 1] + y * F[f + 4] + z * F[f + 7], c[k * 3 + 2] + x * F[f + 2] + y * F[f + 5] + z * F[f + 8]);
  }
  // each wire at its own length: its points read back at the lengths along it they started at (a wire drawn shorter
  // round the inside of a bend ends at its own last point); toward the far end, where the wires gather, not: there they
  // end together, flush, as the bundle's end
  for (let i = 0; i < b.wires; i++) {
    const w = out[i], cum = cumScratch, P = b.points;
    while (cum.length < P) cum.push(0);
    for (let j = 1; j < P; j++) cum[j] = cum[j - 1] + w[j].distanceTo(w[j - 1]);
    for (let j = 0; j < P; j++) tmp[j] = (tmp[j] ?? new T.Vector3()).copy(w[j]);
    let k = 1;
    for (let j = b.rigid; j < P; j++) {
      // (by no more than SLIDE along it from its own place, so round a sharp bend a point never slides off the bend)
      const want = Math.min(Math.max(b.along[i * P + j], cum[j] - SLIDE), cum[j] + SLIDE, cum[P - 1]);
      while (k < P - 1 && cum[k] < want) k++;
      const seg = cum[k] - cum[k - 1] || 1, u = Math.min(1, (want - cum[k - 1]) / seg);
      w[j].lerpVectors(tmp[k - 1], tmp[k], u);
      const e = Math.min(1, Math.max(0, (j - b.fan + FLUSH) / FLUSH));
      if (e > 0) w[j].lerp(tmp[j], e * e * (3 - 2 * e));
    }
  }
  return out;
}
const cumScratch: number[] = [], tmp: T.Vector3[] = [];
// Frames from given normals: each node's tangent, its normal made square to it, and the binormal.
function framesOf(c: ArrayLike<number>, n: number, normals: ArrayLike<number>, out: Float64Array) {
  for (let k = 0; k < n; k++) {
    const a = Math.max(0, k - 1) * 3, b = Math.min(n - 1, k + 1) * 3;
    tn.set(c[b] - c[a], c[b + 1] - c[a + 1], c[b + 2] - c[a + 2]).normalize();
    nn.set(normals[k * 3], normals[k * 3 + 1], normals[k * 3 + 2]).addScaledVector(tn, -nn.dot(tn)).normalize();
    bn.crossVectors(tn, nn);
    out.set([nn.x, nn.y, nn.z, bn.x, bn.y, bn.z, tn.x, tn.y, tn.z], k * 9);
  }
  return out;
}
// A bundle's frames through a whole track, frame by frame: each node keeps the normal it had the frame before, turned
// only as far as its tangent turned (the bundle does not spin about itself of its own accord), and is drawn round
// toward its neighbour nearer the housing, freely where the bundle hangs and hardly where it lies on something level
// (held there by its own weight), and not at all where it is still: so a twist the housing gives it runs down the hanging part, and a lying stretch and a
// held end keep their rows as dressed. The housing end turns with the housing. Normals, n x 3 per frame.
export function twistTrack(track: RopeTrack, b: Bundle, centre0: ArrayLike<number>, housing: (t: number, out: T.Matrix4) => void) {
  const n = track.n, out = new Float32Array(track.count * n * 3), m = new T.Matrix4();
  housing(track.t0, m);
  const F = ropeFrames(centre0, n, new Float64Array(n * 9), b.seed.clone().transformDirection(m), b.tail, 1);
  const prev = new Float64Array(n * 3), t = new T.Vector3(), q = new T.Vector3(), v = new T.Vector3();
  for (let i = 0; i < n; i++) { prev[i * 3] = F[i * 9]; prev[i * 3 + 1] = F[i * 9 + 1]; prev[i * 3 + 2] = F[i * 9 + 2]; }
  out.set(prev);
  const fr = track.frames;
  for (let k = 1; k < track.count; k++) {
    const o = k * n * 3;
    housing(track.t0 + k / track.fps, m);
    for (let i = 0; i < n; i++) {
      const a = o + Math.max(0, i - 1) * 3, c = o + Math.min(n - 1, i + 1) * 3;
      t.set(fr[c] - fr[a], fr[c + 1] - fr[a + 1], fr[c + 2] - fr[a + 2]).normalize();
      v.set(prev[i * 3], prev[i * 3 + 1], prev[i * 3 + 2]);
      if (i === 0) v.copy(b.seed).transformDirection(m);
      v.addScaledVector(t, -v.dot(t));
      if (v.lengthSq() < 1e-12) v.set(1, 0, 0).addScaledVector(t, -t.x);
      v.normalize();
      if (i > 0) {
        // the neighbour's normal carried onto this tangent
        q.set(prev[i * 3 - 3], prev[i * 3 - 2], prev[i * 3 - 1]).addScaledVector(t, -q.dot(t)).normalize();
        // (a part lying still, or held, is not turned at all)
        const p = o + i * 3, moved = Math.hypot(fr[p] - fr[p - n * 3], fr[p + 1] - fr[p - n * 3 + 1], fr[p + 2] - fr[p - n * 3 + 2]);
        const h = Math.hypot(t.x, t.y), x = Math.min(1, Math.max(0, (h - .8) / .15)), w = (TWIST * (1 - x * x * (3 - 2 * x)) + TWIST_LYING) * Math.min(1, moved / STILL);
        v.multiplyScalar(1 - w).addScaledVector(q, w).normalize();
      }
      // lying or drawn over an edge, a flat bundle settles flat: its normal is drawn round toward the level one, on its
      // own side (where it hangs nearly straight down it is left as carried)
      const hz = Math.hypot(t.x, t.y);
      if (hz > .3) { q.set(-t.y, t.x, 0).divideScalar(hz); if (q.dot(v) < 0) q.negate(); const x = Math.min(1, (hz - .3) / .4), w = x * x * (3 - 2 * x) * LEVEL; v.multiplyScalar(1 - w).addScaledVector(q, w).normalize(); }
      prev[i * 3] = v.x; prev[i * 3 + 1] = v.y; prev[i * 3 + 2] = v.z;
    }
    out.set(prev, o);
  }
  return out;
}
// how far, each frame, a node's normal is drawn toward its neighbour's: hanging, and lying level
const TWIST = .5, TWIST_LYING = .02;
// a node that moves less than this in a frame (mm) is still
const STILL = .05;
// over how many points before the fan the wires go over from their own lengths to ending flush
const FLUSH = 12;
// how far a wire point may be read back along its wire (mm)
const SLIDE = 2;
