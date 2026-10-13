export function setupDock(root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLButtonElement>('.dock-item'));
  let timeout: ReturnType<typeof setTimeout>;
  items.forEach(item => {
    item.addEventListener('pointerleave', () => item.classList.remove('tip-off'));
    item.addEventListener('pointerdown', () => { if (matchMedia('(hover: hover)').matches) item.classList.add('tip-off'); });
  });
  items.forEach(item => item.addEventListener('click', () => {
    if (matchMedia('(hover: hover)').matches) { item.classList.add('tip-off'); return; }
    clearTimeout(timeout);
    items.forEach(other => other.classList.remove('show-tip'));
    item.classList.add('show-tip');
    timeout = setTimeout(() => item.classList.remove('show-tip'), 1200);
  }));
}
