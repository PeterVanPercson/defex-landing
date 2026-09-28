export type Pose = [number, number, number, number];

interface Frame { at: number; pose: Pose }

// Display between computed poses. Never extrapolate through a contact surface.
export class PoseStream {
  frames: Frame[] = [];
  epoch = -1;
  delay = 45;

  push(pose: Pose, at: number, epoch: number) {
    if (epoch !== this.epoch) {
      this.frames = [];
      this.epoch = epoch;
    }
    const frame = {at, pose: [...pose] as Pose};
    if (this.frames.at(-1)?.at === at) this.frames[this.frames.length - 1] = frame;
    else this.frames.push(frame);
    if (this.frames.length > 12) this.frames.shift();
  }

  sample(now: number): Pose | null {
    if (!this.frames.length) return null;
    const at = now - this.delay;
    while (this.frames.length > 2 && this.frames[1].at <= at) this.frames.shift();
    const a = this.frames[0], b = this.frames[1];
    if (!b || at <= a.at) return a.pose;
    const t = Math.max(0, Math.min(1, (at - a.at) / (b.at - a.at)));
    return a.pose.map((value, i) => value + (b.pose[i] - value) * t) as Pose;
  }

  pending(now: number) {
    return this.frames.length > 1 && now < this.frames.at(-1)!.at + this.delay;
  }
}

export const damping = (elapsed: number, timeConstant: number) => 1 - Math.exp(-elapsed / timeConstant);
