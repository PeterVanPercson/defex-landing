import { settleSpring } from './motion.ts';
const BASE = 46, PEAK = 60, REACH = 120;

// The macOS dock: icons near the pointer swell on a spring, the rest settle back.
export function magnify(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.dock-item').forEach(item => item.addEventListener('click', () => {
    if (matchMedia('(hover: hover)').matches) return;
    root.querySelectorAll('.show-tip').forEach(other => other.classList.remove('show-tip'));
    item.classList.add('show-tip');
    setTimeout(() => item.classList.remove('show-tip'), 1400);
  }));
  const enabled = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px) and (prefers-reduced-motion: no-preference)');
  const items = Array.from(root.querySelectorAll<HTMLElement>('.dock-item'));
  const springs = items.map(() => ({ size: BASE, velocity: 0 }));
  let pointer = Infinity, frame = 0, last = 0;
  const tick = (now: number) => {
    frame = 0;
    const dt = Math.min(.05, Math.max(0, now - last) / 1000); last = now;
    let moving = false;
    items.forEach((item, i) => {
      const box = item.getBoundingClientRect(), distance = Math.abs(pointer - (box.left + box.width / 2));
      const goal = distance < REACH ? BASE + (PEAK - BASE) * (1 - distance / REACH) : BASE, s = springs[i];
      const next = settleSpring(s.size, s.velocity, goal, dt);
      s.size = next.position; s.velocity = next.velocity;
      if (Math.abs(goal - s.size) > 0.05 || Math.abs(s.velocity) > 0.05) moving = true; else { s.size = goal; s.velocity = 0; }
      item.style.setProperty('--size', `${s.size.toFixed(2)}px`);
    });
    if (moving) frame = requestAnimationFrame(tick);
  };
  const kick = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); } };
  root.addEventListener('pointermove', e => { if(enabled.matches){pointer = e.clientX; kick();} });
  root.addEventListener('pointerleave', () => { if(enabled.matches){pointer = Infinity; kick();} });
  enabled.addEventListener('change',()=>{
    if(enabled.matches)return;
    cancelAnimationFrame(frame);frame=0;pointer=Infinity;
    items.forEach((item,i)=>{item.style.removeProperty('--size');springs[i]={size:BASE,velocity:0};});
  });
}
