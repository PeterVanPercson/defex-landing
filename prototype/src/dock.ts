// A tip names a dock button on hover. A touch screen shows none after a tap: the button shows pressed, and a tip
// above the dock would land on the slider.
export function setupDock(root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLButtonElement>('.dock-item'));
  const hover = () => matchMedia('(hover: hover)').matches;
  items.forEach(item => {
    item.addEventListener('pointerleave', () => item.classList.remove('tip-off'));
    item.addEventListener('pointerdown', () => { if (hover()) item.classList.add('tip-off'); });
    item.addEventListener('click', () => { if (hover()) item.classList.add('tip-off'); });
  });
}
