// The production line around the robot: units ride on pallets that index through the cell.
// Scene mm, z up, jig plate top at z 0. Shared by the cycle (process.ts) and the scene (cell-geometry.ts).
export const PALLET_PITCH = 232; export const PALLET_Y = 20.5; export const PALLET_SIZE = [224, 113, 8] as const;
export const LINE_X = { unload: -292, work: -60, queue: 172, load: 404 } as const;
// A lowered pallet's deck: deep enough that the pallet and its hardware run back under the worktop.
export const LIFT_DOWN = -64, TOTE_SLOTS = 8, INDEX_START = 100, CYCLE_END = 108;
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
  unloadZ: number; unloadUnit: 'finished' | 'board' | 'none'; unloadFade: number; // 1: product shown
  loadZ: number; loadBoard: number; loadHarness: number;                          // 0..1
  tote: number; toteIn: number;   // solid units 0..TOTE_SLOTS; fade-in of slot `tote`
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
