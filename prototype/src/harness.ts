import * as T from 'three';

// Geometric cable dressing, not a cable dynamics model. The six wires leave the housing's wire face,
// gather into a bundle (two rows, touching), hang from the housing to a touchdown point on the plate,
// then lie on the plate: round the comb's far side in a tight S that takes up the slack, and back into
// a short breakout that fans the wires into the comb and on into the pallet's test adapter. Each wire keeps its length; only the S's
// amplitude (capped) and, past the cap, the hanging span's sag change as the housing moves.
export const HARNESS_LENGTH = 429;
// Control points per wire; dressHarness grows the caller's array to this length.
export const HARNESS_POINTS = 72;
export const WIRE_RADIUS = .48;
export const SLACK_LIMIT = 22;
const PITCH = .98, ROW = .86;
// The bundle's centre height where it rests on the plate: its lower row touches the plate.
const REST = WIRE_RADIUS + ROW / 2 + .1;
const Y = new T.Vector3(0, 1, 0), Z = new T.Vector3(0, 0, 1);
// Where the hanging span lands, and the route on the plate from there to the comb breakout (scene mm).
// It shifts with the housing: west of the fixture's corner when the housing is over the board, east of
// the nest when it is over the reject tray, so the hanging span clears both.
const TOUCH_EAST = new T.Vector3(-63, 40, REST), TOUCH_WEST = new T.Vector3(-55, 30, REST);
const ROUTE_IN = [[-74, 50], [-90, 58], [-118, 60]];
const S_TOP = [-145, 60], S_BOTTOM = [-145, 12], S_WAVES = 2;
const ROUTE_OUT = [[-124, 12.5], [-114, 12], [-106, 15], [-104, 18.5]];

// Top surfaces the hanging span may come to rest on, as a 1 mm height map draped at 45 degrees, so the
// span lies over the nest or the tray rim instead of passing through them. createCell registers the cell.
const FIELD = { x0: -230, y0: -160, nx: 320, ny: 270, h: new Float32Array(0) };
export function setHarnessObstacles(boxes: T.Box3[]) {
  const { x0, y0, nx, ny } = FIELD, h = new Float32Array(nx * ny), pad = 2.2;
  for (const b of boxes) {
    const i0 = Math.max(0, Math.floor(b.min.x - pad - x0)), i1 = Math.min(nx - 1, Math.ceil(b.max.x + pad - x0));
    const j0 = Math.max(0, Math.floor(b.min.y - pad - y0)), j1 = Math.min(ny - 1, Math.ceil(b.max.y + pad - y0));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) h[j * nx + i] = Math.max(h[j * nx + i], b.max.z);
  }
  const d = Math.SQRT2;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (i) h[k] = Math.max(h[k], h[k - 1] - 1);
    if (j) { h[k] = Math.max(h[k], h[k - nx] - 1); if (i) h[k] = Math.max(h[k], h[k - nx - 1] - d); if (i < nx - 1) h[k] = Math.max(h[k], h[k - nx + 1] - d); }
  }
  for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = j * nx + i;
    if (i < nx - 1) h[k] = Math.max(h[k], h[k + 1] - 1);
    if (j < ny - 1) { h[k] = Math.max(h[k], h[k + nx] - 1); if (i < nx - 1) h[k] = Math.max(h[k], h[k + nx + 1] - d); if (i) h[k] = Math.max(h[k], h[k + nx - 1] - d); }
  }
  FIELD.h = h;
}
function restingHeight(x: number, y: number) {
  const i = Math.round(x - FIELD.x0), j = Math.round(y - FIELD.y0);
  return FIELD.h.length && i >= 0 && j >= 0 && i < FIELD.nx && j < FIELD.ny ? FIELD.h[j * FIELD.nx + i] : 0;
}

// The bundle position of a wire: columns across the bundle ordered like the comb channels, two rows.
export function bundleSlot(index: number, pins = 6): [number, number] {
  const cols = pins / 2;
  return [(Math.floor(index / 2) - (cols - 1) / 2) * PITCH, (index % 2 - .5) * ROW];
}

const scratch = {
  poly: [] as T.Vector3[], centre: [] as T.Vector3[], tangent: new T.Vector3(), n: new T.Vector3(), b: new T.Vector3(),
  v: new T.Vector3(), w: new T.Vector3(), curve: new T.CatmullRomCurve3([], false, 'centripetal'),
};
function vec(i: number, list: T.Vector3[]) { while (list.length <= i) list.push(new T.Vector3()); return list[i]; }

function bezier(out: T.Vector3, p0: T.Vector3, p1: T.Vector3, p2: T.Vector3, p3: T.Vector3, t: number) {
  const u = 1 - t;
  return out.set(0, 0, 0).addScaledVector(p0, u * u * u).addScaledVector(p1, 3 * u * u * t).addScaledVector(p2, 3 * u * t * t).addScaledVector(p3, t * t * t);
}

// Append the bundle centreline from `from` to the comb breakout, offsetting this wire into its slot.
// `twist` turns the slot about the centreline at the housing end (the bundle untwists along the hanging span).
function bundle(poly: T.Vector3[], count: number, centre: T.Vector3[], spanEnd: number, slot: [number, number], twist: number) {
  const { tangent, n, b, v } = scratch;
  n.set(-1, 0, 0);
  for (let k = 0; k < centre.length; k++) {
    tangent.subVectors(centre[Math.min(k + 1, centre.length - 1)], centre[Math.max(k - 1, 0)]).normalize();
    v.crossVectors(Z, tangent);
    if (v.lengthSq() > 1e-6) n.copy(v).normalize();
    b.crossVectors(tangent, n);
    v.copy(n).multiplyScalar(-slot[0]).addScaledVector(b, slot[1]);
    if (k < spanEnd) v.applyAxisAngle(tangent, twist * (1 - k / spanEnd));
    vec(count++, poly).copy(centre[k]).add(v);
  }
  return count;
}

function route(centre: T.Vector3[], start: number, amplitude: number) {
  let k = start;
  for (const [x, y] of ROUTE_IN) vec(k++, centre).set(x, y, REST);
  const steps = 40;
  for (let j = 0; j <= steps; j++) {
    const u = j / steps;
    vec(k++, centre).set(S_TOP[0] - amplitude * Math.sin(2 * Math.PI * S_WAVES * u), S_TOP[1] + (S_BOTTOM[1] - S_TOP[1]) * u, REST);
  }
  for (const [x, y] of ROUTE_OUT) vec(k++, centre).set(x, y, REST);
  return k;
}

function polyLength(list: T.Vector3[], count: number) {
  let length = 0;
  for (let k = 1; k < count; k++) length += list[k].distanceTo(list[k - 1]);
  return length;
}

// Evenly respace the polyline into the caller's control points.
function resample(points: T.Vector3[], poly: T.Vector3[], count: number) {
  const total = polyLength(poly, count);
  let k = 1, done = 0;
  points[0].copy(poly[0]);
  for (let j = 1; j < HARNESS_POINTS - 1; j++) {
    const target = total * j / (HARNESS_POINTS - 1);
    while (k < count - 1 && done + poly[k].distanceTo(poly[k - 1]) < target) { done += poly[k].distanceTo(poly[k - 1]); k++; }
    const seg = poly[k].distanceTo(poly[k - 1]) || 1;
    points[j].lerpVectors(poly[k - 1], poly[k], (target - done) / seg);
  }
  points[HARNESS_POINTS - 1].copy(poly[count - 1]);
}

// The S is shared by the whole bundle: fit it once per pose on the bundle's centre line, then fit each wire's
// length with its own small change of sag in the hanging span (a loose harness splays a little there).
const shared = { key: '', amplitude: 0, sag: 1, points: [] as T.Vector3[] };
export function dressHarness(points: T.Vector3[], plug: T.Vector3, turn: number, yaw: number, contact: number[], index: number, pins = 6, length = HARNESS_LENGTH) {
  const key = [plug.x, plug.y, plug.z, turn, yaw, length].join();
  if (shared.key !== key) {
    const fit = dressWire(shared.points, plug, turn, yaw, [0, 0], [0, 0], -104, length, null);
    Object.assign(shared, { key, amplitude: fit.amplitude, sag: fit.sag });
  }
  return dressWire(points, plug, turn, yaw, contact, bundleSlot(index, pins), -104 + (index - (pins - 1) / 2) * 3, length, shared);
}

// The bundle's own S amplitude and hanging-span sag from the last dressHarness call (each wire varies a little round them).
export function bundleFit() { return { amplitude: shared.amplitude, sag: shared.sag }; }

function dressWire(points: T.Vector3[], plug: T.Vector3, turn: number, yaw: number, contact: number[], slot: [number, number], terminalX: number, length: number, fixed: { amplitude: number; sag: number } | null) {
  while (points.length < HARNESS_POINTS) points.push(new T.Vector3());
  const { poly, centre, v, w } = scratch;
  const local = (x: number, y: number, z: number, out: T.Vector3) => out.set(x, y, z).applyAxisAngle(Y, turn).applyAxisAngle(Z, yaw).add(plug);
  // Wire face up (1) or hanging face down (0).
  const up = (1 + Math.cos(turn)) / 2;
  // The bundle leaves the wire face square and runs towards +y just past it: face up, under the fingertips
  // and clear of the jaws. Hanging face down it stands further off the face (down to z 30 at most, under the
  // cradle jaws, and clear of the nest plate); the extra stand-off shrinks as the housing turns face up.
  const hang = Math.max(7.5, Math.min(plug.z - 8.3 - 10.5, 30)), drop = (1 - up) * Math.max(0, plug.z - 10.4 - hang);
  let count = 0;
  local(contact[0], contact[1], 8.3, vec(count++, poly));
  local((contact[0] + slot[0]) / 2, contact[1] * .5 + 1, 9.5, vec(count++, poly));
  local(0, 4.5, 10.4 + drop, vec(0, centre));local(0, 12, 10.4 + drop, vec(1, centre));
  // The hanging span: a sagging curve from the end of the pigtail down to the touchdown on the plate.
  const across = Math.min(1, Math.max(0, (plug.x + 100) / 80)), TOUCHDOWN = new T.Vector3().lerpVectors(TOUCH_WEST, TOUCH_EAST, across * across * (3 - 2 * across));
  const end = centre[1], distance = end.distanceTo(TOUCHDOWN);
  const p1 = new T.Vector3(), p2 = new T.Vector3(), towards = new T.Vector3(ROUTE_IN[0][0], ROUTE_IN[0][1], REST).sub(TOUCHDOWN).normalize();
  const span = 24, first = 2;
  const build = (amplitude: number, sag: number) => {
    p1.copy(end).addScaledVector(local(0, 1, 0, new T.Vector3()).sub(plug), Math.min(45, Math.max(5, .35 * distance)) * sag);
    p2.copy(TOUCHDOWN).addScaledVector(towards, -Math.min(14 - 6 * across, Math.max(4, .2 * distance)) * sag);
    for (let j = 1; j <= span; j++) { const c = bezier(vec(first + j - 1, centre), end, p1, p2, TOUCHDOWN, j / span); c.z = Math.max(c.z, restingHeight(c.x, c.y) + REST + .4); }
    const last = route(centre, first + span, amplitude);
    centre.length = last;
    let k = bundle(poly, count, centre, first + span, slot, turn);
    // The breakout: the wires part from the bundle and climb into their own comb channels.
    vec(k, poly).set((poly[k - 1].x + terminalX) / 2, 22, poly[k - 1].z + .3); k++;
    // Out of the comb and down into its ferrule on the front face of the pallet's test adapter.
    for (const [y, z] of [[25.5, 3.4], [29, 8.6], [38, 10.5], [50, 10.5], [63.5, 9]]) vec(k++, poly).set(terminalX, y, z);
    poly.length = k;
    // Nothing sinks into the plate where the bundle rests on it.
    for (let j = 0; j < k; j++) poly[j].z = Math.max(poly[j].z, WIRE_RADIUS + .12);
    resample(points, poly, k);
    scratch.curve.points = points;
    return curveLength(scratch.curve, 400);
  };
  // The S takes up the slack between its limits; beyond them the hanging span sags or straightens.
  const solve = (f: (x: number) => number, low: number, high: number) => {
    for (let j = 0; j < 16; j++) { const mid = (low + high) / 2; if (f(mid) < length) low = mid; else high = mid; }
    return (low + high) / 2;
  };
  if (fixed !== null) {
    // Outer wires of the bundle's bends need a little more length: let each wire's S swing up to 3 mm wider
    // or narrower than the bundle's, then make up any rest in the hanging span.
    const low = Math.max(0, fixed.amplitude - 3), high = fixed.amplitude + 3;
    let amplitude = solve(a => build(a, fixed.sag), low, high), sag = fixed.sag;
    const got = build(amplitude, sag);
    if (Math.abs(got - length) > .05) { amplitude = got < length ? high : low; sag = solve(s => build(amplitude, s), .5, 2); }
    build(amplitude, sag);
    return { amplitude, sag, shortest: 0, longest: 0 };
  }
  const longest = build(SLACK_LIMIT, 1), shortest = build(0, 1);
  let amplitude = SLACK_LIMIT, sag = 1;
  if (longest < length) sag = solve(s => build(SLACK_LIMIT, s), 1, 2);
  else if (shortest > length) { amplitude = 0; sag = solve(s => build(0, s), .5, 1); }
  else amplitude = solve(a => build(a, 1), 0, SLACK_LIMIT);
  build(amplitude, sag);
  return { amplitude, sag, shortest, longest };
}

export function curveLength(curve: T.CatmullRomCurve3, samples = 128) {
  const a = new T.Vector3(), b = new T.Vector3(); curve.getPoint(0, a); let length = 0;
  for (let j = 1; j <= samples; j++) { curve.getPoint(j / samples, b); length += a.distanceTo(b); a.copy(b); }
  return length;
}
