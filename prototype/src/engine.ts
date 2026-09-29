import type loadMujoco from '@mujoco/mujoco';
import { DEFAULT_CONFIG, DT, MODEL_VERSION, PLUG_HALF_Z, SEATED_Z, START_Z, TOP_Z, modelXML, probePoints, validConfig } from './model.ts';
import type { Configuration, Controller } from './model.ts';

const APPROACH_Z = 0.028, CLEAR_Z = 0.0268;

type Module = Awaited<ReturnType<typeof loadMujoco>>;
type Phase = 'ready' | 'approach' | 'insert' | 'backoff' | 'move' | 'electrical' | 'retention' | 'reset' | 'complete';
export interface Sample { t: number; x: number; y: number; z: number; force: number; phase: Phase }
export interface Trial {
  id: number; controller: Controller; config: Configuration; model: string;
  accepted: boolean; reason: string; probes: number; peakForce: number; duration: number;
  continuity: boolean | null; retention: boolean | null; correction: [number, number] | null;
  samples: Sample[];
}
export interface Snapshot {
  phase: Phase; pose: [number, number, number, number]; target: [number, number, number, number];
  time: number; force: number; depth: number; peakForce: number; probes: number;
  continuity: boolean | null; retention: boolean | null; latchEngaged: boolean;
  controller: Controller; accepted: boolean | null; reason: string;
  calibration: [number, number] | null; config: Configuration;
}

export class ConnectorEngine {
  mj: Module;
  model: ReturnType<Module['MjModel']['from_xml_string']>;
  data: InstanceType<Module['MjData']>;
  config: Configuration;
  controller: Controller = 'fixed';
  phase: Phase = 'ready';
  target: [number, number, number, number] = [0, 0, START_Z, 0];
  calibration: [number, number] | null = null;
  trials: Trial[] = [];
  samples: Sample[] = [];
  points: [number, number][] = probePoints();
  probe = 0;
  peakForce = 0;
  clock = 0;
  entered = 0;
  lastSample = -1;
  continuity: boolean | null = null;
  retention: boolean | null = null;
  accepted: boolean | null = null;
  reason = '';
  force = 0;
  latchEngaged = false;
  blockedTime = 0;
  completedTrial: Trial | null = null;
  plan: { from: number[]; to: number[]; start: number; duration: number } | null = null;

  constructor(mj: Module, config = DEFAULT_CONFIG) {
    this.mj = mj;
    this.config = validConfig(config);
    this.model = mj.MjModel.from_xml_string(modelXML(this.config));
    this.data = new mj.MjData(this.model);
    this.resetState();
  }

  configure(config: Configuration) {
    this.data.delete(); this.model.delete();
    this.config = validConfig(config);
    this.model = this.mj.MjModel.from_xml_string(modelXML(this.config));
    this.data = new this.mj.MjData(this.model);
    this.resetState();
  }

  resetState() {
    this.mj.mj_resetData(this.model, this.data);
    this.data.qpos[2] = START_Z;
    this.target = [0, 0, START_Z, 0];
    this.data.ctrl.set(this.target);
    this.mj.mj_forward(this.model, this.data);
    this.phase = 'ready'; this.clock = 0; this.entered = 0; this.probe = 0;
    this.force = 0; this.peakForce = 0; this.continuity = null; this.retention = null;
    this.accepted = null; this.reason = ''; this.latchEngaged = false;
    this.samples = []; this.lastSample = -1; this.blockedTime = 0; this.completedTrial = null;
  }

  start(controller: Controller) {
    if (controller === 'reuse' && !this.calibration) throw new Error('Complete an accepted search trial before reusing its correction.');
    this.resetState();
    this.controller = controller;
    this.points = controller === 'reuse' ? [this.calibration!.slice() as [number, number]] : probePoints();
    this.target[0] = this.data.qpos[0]; this.target[1] = this.data.qpos[1];
    this.enter('approach');
  }

  enter(phase: Phase) {
    this.phase = phase; this.entered = this.clock; this.blockedTime = 0; this.plan = null;
    const [x, y] = this.target, q = this.data.qpos;
    if (phase === 'approach') this.glide([this.points[0][0], this.points[0][1], APPROACH_Z], 1.1);
    if (phase === 'backoff') this.glide([x, y, CLEAR_Z], 0.24);
    if (phase === 'move') this.glide([this.points[this.probe][0], this.points[this.probe][1], CLEAR_Z], 0.3);
    if (phase === 'retention') this.glide([x, y, SEATED_Z + 0.001], 0.2);
    if (phase === 'reset') this.glide([x, y, START_Z], 1.05);
    if (phase === 'insert') this.target[2] = Math.min(this.target[2], q[2] + 0.0002);
  }

  // Minimum-jerk moves: the velocity profile of a relaxed human reach.
  glide(to: number[], duration: number) { this.plan = { from: this.target.slice(0, 3), to, start: this.clock, duration }; }
  follow() {
    if (!this.plan) return true;
    const t = Math.min(1, (this.clock - this.plan.start) / this.plan.duration), s = t * t * t * (10 - 15 * t + 6 * t * t);
    for (let i = 0; i < 3; i++) this.target[i] = this.plan.from[i] + (this.plan.to[i] - this.plan.from[i]) * s;
    return t >= 1;
  }

  setLatch(active: boolean) {
    // The 3.14 WASM bool-array getter is unbound; the state API writes the same field.
    this.mj.mj_setState(this.model, this.data, [active ? 1 : 0], this.mj.mjtState.mjSTATE_EQ_ACTIVE.value);
    this.latchEngaged = active;
  }

  finish(reason: string) {
    this.reason = reason;
    this.accepted = this.continuity === true && this.retention === true;
    if (this.accepted && this.controller === 'search') this.calibration = [this.target[0], this.target[1]];
    this.setLatch(false);
    this.enter('reset');
  }

  advance(steps = 32) {
    for (let i = 0; i < steps; i++) {
      if (this.phase === 'ready' || this.phase === 'complete') break;
      this.step();
    }
    return this.snapshot();
  }

  step() {
    const q = this.data.qpos;
    const elapsed = this.clock - this.entered;
    const toward = (v: number, to: number, speed: number) => v + Math.sign(to - v) * Math.min(Math.abs(to - v), speed * DT);
    switch (this.phase) {
      case 'approach':
        if (this.follow() && elapsed > 1.3) this.enter('insert');
        break;
      case 'insert': {
        const ramp = Math.min(1, elapsed / 0.3), speed = 0.008 * ramp * ramp * (3 - 2 * ramp);
        this.target[2] = toward(this.target[2], SEATED_Z, Math.max(speed, 0.0005));
        this.blockedTime = this.force > 4 ? this.blockedTime + DT : 0;
        if (q[2] < SEATED_Z + 0.00025) {
          this.target[2] = SEATED_Z;
          if (this.config.fault !== 'latch') this.setLatch(true);
          this.enter('electrical');
        } else if (this.blockedTime > 0.015 || elapsed > 3.2) {
          if (this.controller === 'search' && this.probe < this.points.length - 1) {
            this.enter('backoff');
          } else this.finish(this.controller === 'search' ? 'Search range exhausted' : 'Contact stopped insertion');
        }
        break;
      }
      case 'backoff':
        if (this.follow() && q[2] > CLEAR_Z - 0.0003) { this.probe++; this.enter('move'); }
        break;
      case 'move':
        if (this.follow() && Math.abs(q[0] - this.target[0]) < 0.00003 && Math.abs(q[1] - this.target[1]) < 0.00003) this.enter('insert');
        break;
      case 'electrical':
        this.target[2] = elapsed < 0.14 ? SEATED_Z - 0.00025 * Math.sin(Math.PI * elapsed / 0.14) : SEATED_Z;
        if (elapsed > 0.45) {
          this.continuity = this.config.fault !== 'open' && q[2] < SEATED_Z + 0.0003;
          this.enter('retention');
        }
        break;
      case 'retention':
        this.follow();
        if (elapsed > 0.5) {
          this.retention = Math.abs(q[2] - SEATED_Z) < 0.0003;
          this.finish(!this.continuity ? 'Electrical check failed' : !this.retention ? 'Retention check failed' : 'Both checks passed');
        }
        break;
      case 'reset':
        if (this.follow() && q[2] > START_Z - 0.0001) {
          this.enter('complete');
          this.completedTrial = {
            id: this.trials.length + 1, controller: this.controller, config: {...this.config}, model: MODEL_VERSION,
            accepted: this.accepted === true, reason: this.reason, probes: this.probe + 1,
            peakForce: this.peakForce, duration: this.clock, continuity: this.continuity, retention: this.retention,
            correction: this.accepted ? [this.target[0], this.target[1]] : null, samples: this.samples.slice(),
          };
          this.trials.push(this.completedTrial);
        }
        break;
    }
    this.data.ctrl.set(this.target);
    this.mj.mj_step(this.model, this.data);
    this.clock += DT;
    this.force = Math.abs(Number(this.data.qfrc_constraint[2]));
    this.peakForce = Math.max(this.peakForce, this.force);
    if (this.clock - this.lastSample >= 0.02) {
      this.samples.push({ t: this.clock, x: q[0], y: q[1], z: q[2], force: this.force, phase: this.phase });
      this.lastSample = this.clock;
    }
    if (!Number.isFinite(q[2])) throw new Error('The simulation became numerically unstable.');
    if (this.clock > 120 && this.phase !== 'reset' && this.phase !== 'complete') this.finish('Simulation limit reached');
  }

  snapshot(): Snapshot {
    return {
      phase: this.phase, pose: Array.from(this.data.qpos) as Snapshot['pose'], target: [...this.target],
      time: this.clock, force: this.force, depth: Math.max(0, (TOP_Z - this.data.qpos[2] + PLUG_HALF_Z) * 1000),
      peakForce: this.peakForce, probes: this.probe + 1, continuity: this.continuity, retention: this.retention,
      latchEngaged: this.latchEngaged, controller: this.controller, accepted: this.accepted, reason: this.reason,
      calibration: this.calibration, config: this.config,
    };
  }

  dispose() { this.data.delete(); this.model.delete(); }
}
