// The logo rows roll on their own and cannot be dragged (his call,
// 2026-10-04). A pointer on a row pauses it and shows the logo under it in
// its own colours (site.css, :hover). A finger leaves no hover behind on
// every phone, so a tap does the same here: the tapped logo shows its colours
// and its row holds still until the next tap somewhere else.
(() => {
    let held = null;
    const letGo = () => {
        if (!held) return;
        held.classList.remove('is-touched');
        const roll = held.closest('.roll');
        if (roll) roll.classList.remove('is-paused');
        held = null;
    };
    document.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        const item = e.target && e.target.closest ? e.target.closest('.roll__i') : null;
        if (item === held) return;
        letGo();
        if (!item) return;
        held = item;
        item.classList.add('is-touched');
        item.closest('.roll').classList.add('is-paused');
    }, { passive: true });
    for (const roll of document.querySelectorAll('.roll')) roll.addEventListener('dragstart', (e) => e.preventDefault());
})();
