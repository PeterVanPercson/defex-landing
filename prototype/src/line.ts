// The production line around the robot: units ride on pallets that index through the cell.
// Scene mm, z up, jig plate top at z 0. Shared by the cycle (process.ts) and the scene (cell-geometry.ts).
export const PALLET_PITCH = 232; export const PALLET_Y = 20.5; export const PALLET_SIZE = [224, 113, 8] as const;
export const LINE_X = { unload: -292, work: -60, queue: 172, load: 404 } as const;
// A lowered pallet's deck: deep enough that a pallet and the unit it carries run back under the worktop.
export const LIFT_DOWN = -96, TOTE_SLOTS = 8, INDEX_START = 100, CYCLE_END = 108;
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
  // A cleared reject: 0 the harness lies in the tray .. 1 the person has taken it to the locked bin.
  harnessOut?: number;
}
// The first part of a cleared reject's index (s 0..CLEAR_SPAN, s = (p-100)/8) is the person taking the harness
// out of the tray to the bin while the tester lets go of the pallet.
export const CLEAR_SPAN = .1;

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
export const PICK = { down: .05, clamp: .55, closed: .8, free: 1, lifted: 1.55, over: 2.45, placed: 2.85, open: 3.05, clear: 3.35, home: 4.2 };
// A full tote: it rolls off the bench end toward the tote store, and the empty waiting in front rolls in behind it.
export const SWAP = { out: .15, in: .85, done: 1.5 };
export const UNLOAD = { down: 1.7, low: 2.6, away: 2.7, gone: 3.9, up: 4, back: 5 };
export const LOAD = { down: .7, low: 2.1, in: 2.2, under: 3.9, up: 4.4, top: 6.6 };
