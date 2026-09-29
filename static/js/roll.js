// Press and drag a logo row to move it sideways; let go and it rolls on from
// where it was left. The track is four copies of one set and the animation
// moves it by a quarter, so any offset folds back into (-set, 0].
(() => {
    for (const roll of document.querySelectorAll('.roll')) {
        const track = roll.querySelector('.roll__track');
        if (!track) continue;
        let held = null, from = 0, x = 0, set = 0, seconds = 0;
        const fold = (v) => { v %= set; return v > 0 ? v - set : v; };
        roll.addEventListener('pointerdown', (e) => {
            if (held !== null || e.button !== 0) return;
            const style = getComputedStyle(track);
            if (style.animationName === 'none') return;
            set = track.scrollWidth / 4;
            seconds = parseFloat(style.animationDuration) || 0;
            if (!set || !seconds) return;
            x = new DOMMatrixReadOnly(style.transform).m41;
            from = e.clientX - x;
            held = e.pointerId;
            track.style.animation = 'none';
            track.style.transform = `translateX(${x}px)`;
            roll.classList.add('is-held');
            roll.setPointerCapture(held);
        });
        roll.addEventListener('pointermove', (e) => {
            if (e.pointerId !== held) return;
            x = fold(e.clientX - from);
            track.style.transform = `translateX(${x}px)`;
        });
        const release = (e) => {
            if (e.pointerId !== held) return;
            held = null;
            roll.classList.remove('is-held');
            track.style.transform = '';
            track.style.animation = '';
            track.style.animationDelay = `${(x / set) * seconds}s`;
        };
        roll.addEventListener('pointerup', release);
        roll.addEventListener('pointercancel', release);
        roll.addEventListener('dragstart', (e) => e.preventDefault());
    }
})();
