const BASE = 46, PEAK = 74, REACH = 150;

// The macOS dock: icons near the pointer swell on a spring, the rest settle back.
export function magnify(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.dock-item').forEach(item => item.addEventListener('click', () => {
    if (matchMedia('(hover: hover)').matches) return;
    root.querySelectorAll('.show-tip').forEach(other => other.classList.remove('show-tip'));
    item.classList.add('show-tip');
    setTimeout(() => item.classList.remove('show-tip'), 1400);
  }));
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>('.dock-item'));
  const springs = items.map(() => ({ size: BASE, velocity: 0 }));
  let pointer = Infinity, frame = 0;
  const tick = () => {
    frame = 0;
    let moving = false;
    items.forEach((item, i) => {
      const box = item.getBoundingClientRect(), distance = Math.abs(pointer - (box.left + box.width / 2));
      const goal = distance < REACH ? BASE + (PEAK - BASE) * (1 - distance / REACH) : BASE, s = springs[i];
      for (let k = 0; k < 4; k++) {
        s.velocity += ((goal - s.size) * 150 - s.velocity * 12) / 0.1 * (1 / 240);
        s.size += s.velocity * (1 / 240);
      }
      if (Math.abs(goal - s.size) > 0.05 || Math.abs(s.velocity) > 0.05) moving = true; else { s.size = goal; s.velocity = 0; }
      item.style.setProperty('--size', `${s.size.toFixed(2)}px`);
    });
    if (moving) frame = requestAnimationFrame(tick);
  };
  const kick = () => { if (!frame) frame = requestAnimationFrame(tick); };
  root.addEventListener('pointermove', e => { pointer = e.clientX; kick(); });
  root.addEventListener('pointerleave', () => { pointer = Infinity; kick(); });
}
