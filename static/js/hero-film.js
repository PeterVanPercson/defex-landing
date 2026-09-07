(() => {
    const hero = document.querySelector('.hero');
    const film = document.getElementById('film');
    if (!hero || !film) return;
    const sticky = hero.querySelector('.hero__sticky');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const FPS = 24;
    const FRAME = 1 / FPS;
    // The film finishes a little before the pin releases, so the last frame holds.
    const SCRUB_END = 0.9;
    // Exponential approach. Higher is snappier, lower is heavier.
    const EASE = 4.2;

    // Cadence lock. While the film is catching up it advances at a fixed ceiling,
    // and that ceiling has to divide the display refresh or frames get held for an
    // uneven number of refreshes (2, 1, 2, 2, 1) and stutter even though every
    // frame is present. Pick the ceiling so FPS * rate divides the refresh exactly:
    // 60Hz and 120Hz both land on 1.25 (30 film-fps, 2 and 4 refreshes a frame),
    // 144Hz lands on 1.2. Nothing about the image changes, only frame timing.
    const TARGET_RATE = 1.3;
    const COMMON_HZ = [60, 75, 90, 100, 120, 144, 165, 240];
    let refresh = 60;
    let rate = 1.25;

    function lockCadence(hz) {
        refresh = hz;
        const held = Math.max(1, Math.round(hz / (FPS * TARGET_RATE)));
        rate = hz / (FPS * held);
    }

    function measureRefresh() {
        const deltas = [];
        let previous = 0, seen = 0;
        const sample = (now) => {
            if (previous) deltas.push(now - previous);
            previous = now;
            if (++seen < 24) { requestAnimationFrame(sample); return; }
            deltas.sort((a, b) => a - b);
            const median = deltas[deltas.length >> 1];
            if (!(median > 1 && median < 60)) return;
            const hz = 1000 / median;
            lockCadence(COMMON_HZ.find((c) => Math.abs(c - hz) < 4) || Math.round(hz));
        };
        requestAnimationFrame(sample);
    }

    let ready = false, seeking = false, running = false, unlocked = false;
    let target = 0, shown = 0, lastFrame = -1, lastTick = 0;

    function scrollProgress() {
        const distance = hero.offsetHeight - sticky.offsetHeight;
        return clamp((scrollY - hero.offsetTop) / Math.max(1, distance), 0, 1);
    }

    // One seek in flight at a time, quantised to real frames. Assigning
    // currentTime every animation frame queues seeks the decoder never clears.
    function paint() {
        if (seeking || !ready) return;
        const frame = Math.round(shown / FRAME);
        if (frame === lastFrame) return;
        lastFrame = frame;
        seeking = true;
        film.currentTime = frame * FRAME;
    }
    film.addEventListener('seeked', () => { seeking = false; paint(); });

    function tick(now) {
        const dt = lastTick ? Math.min(.05, (now - lastTick) / 1000) : 1 / refresh;
        lastTick = now;
        const gap = target - shown;
        const eased = gap * (1 - Math.exp(-EASE * dt));
        const ceiling = rate * dt;
        if (Math.abs(eased) > ceiling) {
            // Rate limited. Step in whole refresh intervals rather than by the
            // measured delta, so a jittery or dropped frame cannot break cadence.
            const intervals = clamp(Math.round(dt * refresh), 1, 4);
            shown += Math.sign(gap) * rate * intervals / refresh;
        } else {
            shown += eased;
        }
        if (Math.abs(target - shown) < FRAME / 3) shown = target;
        paint();
        if (shown !== target) requestAnimationFrame(tick);
        else { running = false; lastTick = 0; }
    }

    function start() {
        if (running || !ready) return;
        running = true;
        lastTick = 0;
        requestAnimationFrame(tick);
    }

    function onScroll() {
        if (!ready || !isFinite(film.duration) || film.duration <= 0) return;
        const p = scrollProgress();
        hero.style.setProperty('--cue-opacity', String(1 - clamp(p * 7, 0, 1)));
        target = clamp(p / SCRUB_END, 0, 1) * (film.duration - FRAME);
        start();
    }

    function hold() { shown = target = film.duration - FRAME; lastFrame = -1; paint(); }

    film.addEventListener('loadedmetadata', () => {
        ready = true;
        if (reduced.matches) hold();
        else onScroll();
    });

    // iOS will not paint a seek until the element has been allowed to decode once.
    function unlock() {
        if (unlocked) return;
        unlocked = true;
        const played = film.play();
        if (played && played.then) played.then(() => film.pause()).catch(() => {});
        else film.pause();
    }

    if (!reduced.matches) {
        document.documentElement.classList.add('has-scroll-film');
        measureRefresh();
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', onScroll, { passive: true });
        addEventListener('pageshow', onScroll);
        addEventListener('touchstart', unlock, { once: true, passive: true });
        addEventListener('pointerdown', unlock, { once: true });
        onScroll();
    }
    reduced.addEventListener('change', (event) => {
        if (!event.matches) return;
        document.documentElement.classList.remove('has-scroll-film');
        if (ready) hold();
    });
})();
