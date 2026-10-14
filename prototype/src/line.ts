// The production line around the robot: units ride on pallets that index through the cell.
// Scene mm, z up, jig plate top at z 0. Shared by the cycle (process.ts) and the scene (cell-geometry.ts).
export const PALLET_PITCH = 232; export const PALLET_Y = 20.5; export const PALLET_SIZE = [224, 113, 8] as const;
export const LINE_X = { unload: -292, work: -60, queue: 172, load: 404 } as const;
// A lowered pallet's deck: deep enough that a pallet and the unit it carries run back under the worktop.
// A tote takes TOTE_SLOTS units on edge: each slot is wide enough for a board, its plug and the harness piled behind it.
export const LIFT_DOWN = -96, TOTE_SLOTS = 4, INDEX_START = 100, CYCLE_END = 108;
// The fingers hold the housing this much further up its body than before, so seated fingertips clear the header.
export const GRIP_RAISE = 1.5;
// The header shroud: clearance per side around the housing, its lead-in chamfer, and so the capture range.
export const SHROUD_CLEARANCE = 0.15, CHAMFER = 0.5, CAPTURE = SHROUD_CLEARANCE + CHAMFER;
export type Shot = 'wide' | 'work' | 'line' | 'reject';
export interface LineState { unit: number; passed: number; rejected: number; prev: 'pass' | 'reject' | 'none' }
export const FIRST_UNIT: LineState = { unit: 1, passed: 0, rejected: 0, prev: 'none' };
export interface LineFrame {
  shift: number;          // 0..PALLET_PITCH mm every top-lane pallet has moved toward -x
  dock: number;           // tester contact head: 0 retracted .. 1 docked
  liveHarness: boolean;   // false: the live plug and wires are hidden (a cleared reject, p > 100)
  unloadZ: number; unloadUnit: 'finished' | 'board' | 'none'; // what the unload pallet arrived with
  loadZ: number;
  // Units packed in the tote on the bench, 0..TOTE_SLOTS, as shown. pack: the picker packs the finished unit on
  // the unload pallet this unit; swap: a full tote goes out first and an empty one comes in.
  tote: number; pack: boolean; swap: boolean;
  shot: Shot; focus: [number, number, number]; // overview shot; close-up target
  unitLabel: string; lineNote: string;
  // The operator side's clock (unload, return lifts, load, tote). It equals the robot's progress, except that a
  // restart of the robot's cycle on the same unit leaves the operator's work where it had got to.
  lineProgress?: number;
  // Kept for the scene's fade, always 0: nothing fades any more; the robot posts a rejected harness into the bin.
  harnessOut?: number;
}
// The first part of a cleared reject's index (s 0..CLEAR_SPAN, s = (p-100)/8): once the person has cleared it, the
// robot posts the rejected harness into the locked bin; then the bare board indexes on over the rest.
export const CLEAR_SPAN = .5;
// How long the post takes, as played (cycle-player pace).
export const CLEAR_SECONDS = 6.1;

// The operator side runs on its own clock in seconds, so its moves keep a steady speed across the robot's step
// boundaries. The ms per percent of steps 0..5, as the player runs them (cycle-player PACE).
export const OP_PACE: readonly (readonly [number, number])[] = [[0, 120], [2, 240], [12, 220], [23, 390], [34, 250], [43, 250]];
export function opSeconds(op: number) {
  let t = 0;
  for (let i = 0; i < OP_PACE.length; i++) {
    const [from, ms] = OP_PACE[i], to = i + 1 < OP_PACE.length ? OP_PACE[i + 1][0] : Infinity;
    if (op <= from) break; t += (Math.min(op, to) - from) * ms / 1000;
  }
  return t;
}
// When the operator side moves, in seconds from the start of a unit. The picker takes the finished unit off the
// unload pallet and packs it; meanwhile the empty pallet goes down and back, and the next loaded one comes up.
// The board is lifted, carried and lowered like a crane load, gently (under half a g, the carry about a tenth, no
// faster than 600 mm/s) so the harness hanging under it never goes slack and has stopped swinging before it goes down
// into the slot. It is lifted,
// over the harness's far end, until only that end still lies on the pallet (free..raised); it holds while the empty
// pallet lowers away under the end (UNLOAD.down), so the harness comes to hang straight without a jerk; then it is
// lifted the rest of the way (..lifted), carried over the slot (carry..over), held while any swing dies away, and
// lowered at a steady 400 mm/s, so the harness piles in the slot as the board goes down (descend..placed); the
// harness rests in the slot before the jaws open.
export const PICK = { down: .05, clamp: .55, closed: .8, free: 1, raised: 2.25, lifted: 3.35, carry: 3.35, over: 4.7, descend: 5.2, placed: 6.75, open: 7.45, clear: 7.9, home: 8.65 };
// A full tote: it rolls off the bench end toward the tote store. Once it is clear, the pop-up transfers under both
// beds rise (in..across), lifting the empty tote waiting in front off its rollers; their belts carry it across onto
// the packing bed (across..down) and lower it onto that bed's rollers (down..done).
export const SWAP = { out: .15, in: .95, across: 1.2, down: 2.05, done: 2.3 };
export const UNLOAD = { down: 2.3, low: 3.2, away: 3.3, gone: 4.5, up: 4.6, back: 5.6 };
export const LOAD = { down: .7, low: 2.1, in: 2.2, under: 3.9, up: 4.4, top: 6.6 };
