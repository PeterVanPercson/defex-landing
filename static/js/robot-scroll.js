(() => {
    const hero = document.querySelector('.hero');
    const robot = document.getElementById('robot');
    if (!hero || !robot) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let pending = false;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    function update() {
        pending = false;
        const sticky = hero.querySelector('.hero__sticky');
        const distance = hero.offsetHeight - sticky.offsetHeight;
        const progress = motion.matches ? 1 : clamp((scrollY - hero.offsetTop) / Math.max(1, distance));
        hero.style.setProperty('--copy-opacity', motion.matches ? 1 : clamp((progress - .48) / .28));
        hero.style.setProperty('--cue-opacity', 1 - clamp(progress * 6));
        if (typeof robot.setScrollProgress === 'function') robot.setScrollProgress(clamp(progress / .87));
    }
    function schedule() {
        if (!pending) { pending = true; requestAnimationFrame(update); }
    }
    document.documentElement.classList.add('has-scroll');
    robot.addEventListener('defex-statechange', (event) => {
        hero.classList.toggle('is-interactive', event.detail.phase === 'interactive');
    });
    robot.addEventListener('defex-ready', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('pageshow', schedule);
    motion.addEventListener('change', schedule);
    customElements.whenDefined('defex-robot').then(schedule);
    update();
})();
