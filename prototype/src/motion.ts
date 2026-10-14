import { Matrix4, Vector2, Vector3 } from 'three';
export type Pose = [number, number, number, number];

interface Frame { at: number; pose: Pose }

// Display between computed poses. Never extrapolate through a contact surface.
// Updates arrive every 33 ms but up to 44 ms apart on a fast machine and over
// 80 ms on a slow one; the delay keeps a pose in hand so motion never stalls.
export class PoseStream {
  frames: Frame[] = [];
  epoch = -1;
  delay = 70;

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

export function settleSpring(position: number, velocity: number, target: number, seconds: number, frequency = 20) {
  const offset = position - target, c = velocity + frequency * offset, decay = Math.exp(-frequency * seconds);
  return { position: target + (offset + c * seconds) * decay, velocity: (velocity - frequency * c * seconds) * decay };
}

// A drag only takes the camera once it is a real drag: past 6 px, and on a touch screen only sideways (a vertical
// swipe is the page scrolling).
export function isDrag(dx:number,dy:number,touch:boolean){return Math.hypot(dx,dy)>6&&(!touch||Math.abs(dx)>Math.abs(dy));}
// A click picks a part only if it was a short, still press of the main button.
export function isClick(button:number,ms:number,dx:number,dy:number){return button===0&&ms<300&&Math.hypot(dx,dy)<5;}

// The frame shift (fractions of the frame width and height) that brings `look` to the centre of a camera at
// `position` pointed at `target`.
export function lensShift(position:Vector3,target:Vector3,look:Vector3,filmWidth:number,filmHeight:number,lens:number){
  const m=new Matrix4().lookAt(position,target,new Vector3(0,0,1)),p=look.clone().sub(position).applyMatrix4(m.transpose());
  // camera space: x right, y up, -z forward
  const depth=-p.z;if(depth<=0)return new Vector2();
  return new Vector2(p.x/depth*lens/filmWidth,-p.y/depth*lens/filmHeight);
}

// A free camera goes back to the guided shots once nobody has touched it for `idle` ms and no pointer is down:
// returns 0 when it should go now, otherwise how long to wait before asking again.
export function idleWait(sinceInput:number,pointerDown:boolean,idle=8000){return pointerDown?Math.max(250,idle-sinceInput):sinceInput>=idle-1?0:Math.max(250,idle-sinceInput);}
// How much of the live harness shows while Parts pulls the cell apart: gone by 70 % of the spread, back by its end.
export const spreadSee=(spread:number)=>{const t=Math.max(0,Math.min(1,spread/.7));return 1-t*t*(3-2*t);};
