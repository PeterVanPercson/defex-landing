export function setupDock(root: HTMLElement) {
  const items = Array.from(root.querySelectorAll<HTMLButtonElement>('.dock-item'));
  let timeout: ReturnType<typeof setTimeout>;
  items.forEach(item => item.addEventListener('click', () => {
    if (matchMedia('(hover: hover)').matches) return;
    clearTimeout(timeout);
    items.forEach(other => other.classList.remove('show-tip'));
    item.classList.add('show-tip');
    timeout = setTimeout(() => item.classList.remove('show-tip'), 1200);
  }));
}
