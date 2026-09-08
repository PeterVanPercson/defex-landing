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
    const TARGET_RATE = 2.5;
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

    // Geometry is cached. Reading offsetHeight or getBoundingClientRect inside the
    // scroll and wheel handlers forces a synchronous layout on every event, and a
    // trackpad fires around a hundred a second. Measure on resize instead.
    let heroTop = 0, scrubSpan = 0;
    function measureGeometry() {
        heroTop = hero.offsetTop;
        scrubSpan = hero.offsetHeight - sticky.offsetHeight;
    }

    // Progress is the travel through .hero's extra height above the pinned box.
    // Both orientations pin now; the second branch is the no-CSS fallback, where
    // .hero has no extra height and there is nothing to measure against.
    function scrollProgress() {
        if (scrubSpan > 40) return clamp((scrollY - heroTop) / scrubSpan, 0, 1);
        return clamp(scrollY / Math.max(1, innerHeight * 1.4), 0, 1);
    }

    // One seek in flight at a time, quantised to real frames. Assigning
    // currentTime every animation frame queues seeks the decoder never clears.
    // A seek into an unbuffered range, or a backgrounded tab, can swallow the
    // seeked event. Without the watchdog the flag stays set and the film is
    // frozen for the rest of the visit, which looked like the animation
    // "skipping". 400ms is far longer than a real seek on an all-intra file.
    let seekWatchdog = 0;
    function releaseSeek() {
        clearTimeout(seekWatchdog);
        seeking = false;
    }
    function paint() {
        if (seeking || !ready) return;
        const frame = Math.round(shown / FRAME);
        if (frame === lastFrame) return;
        lastFrame = frame;
        seeking = true;
        clearTimeout(seekWatchdog);
        seekWatchdog = setTimeout(() => { seeking = false; lastFrame = -1; paint(); }, 400);
        film.currentTime = frame * FRAME;
    }
    film.addEventListener('seeked', () => { releaseSeek(); paint(); });
    film.addEventListener('error', releaseSeek);

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

    function markReady() {
        if (ready || film.readyState < 2) return;   // 2 = HAVE_CURRENT_DATA
        ready = true;
        measureGeometry();
        if (reduced.matches) hold();
        else onScroll();
    }
    // readyState 2 is the first point a seek is guaranteed to have a frame to
    // land on. loadedmetadata (readyState 1) only knows the duration.
    film.addEventListener('loadeddata', markReady);
    film.addEventListener('canplay', markReady);
    film.addEventListener('canplaythrough', markReady);
    film.addEventListener('loadedmetadata', markReady);

    // iOS will not paint a seek until the element has been allowed to decode once.
    function unlock() {
        if (unlocked) return;
        unlocked = true;
        const played = film.play();
        if (played && played.then) played.then(() => film.pause()).catch(() => {});
        else film.pause();
    }

    // Choose the source before load. A phone does not need the 1440-wide file,
    // and 4.4MB over mobile data is most of why the film was not ready in time.
    const small = film.dataset.srcSm;
    const wide = film.dataset.src;
    if (wide) film.src = (small && Math.min(innerWidth, innerHeight) <= 820) ? small : wide;

    // Scroll damping inside the pinned hero.
    //
    // The rate ceiling keeps the film smooth, but it also means a fast flick asks
    // for more film than the ceiling will deliver: 4000px/s demands about 12x
    // realtime against a 2.5x cap. The film falls behind, the pin releases while
    // it is still mid-way, and the rest plays off screen. That is the animation
    // "being missed".
    //
    // So cap the input instead. Each wheel event is clamped to the distance the
    // locked cadence can actually render in the time since the last one, derived
    // from the geometry so it stays right at any viewport size.
    //
    // The scroll is applied synchronously here on purpose. An earlier version
    // queued the excess and drained it on requestAnimationFrame, which meant a
    // throttled or delayed rAF left the page preventDefault-ed and completely
    // unscrollable. Nothing is deferred now, so there is no state to get stuck in.
    let lastWheel = 0;

    function scrollLimit() {
        if (scrubSpan <= 40 || !isFinite(film.duration) || film.duration <= 0) return 0;
        return (scrubSpan * SCRUB_END / film.duration) * rate;   // px per second
    }

    // pure arithmetic against the cached geometry, no layout read
    function insideScrub() {
        return scrubSpan > 40 && scrollY >= heroTop && scrollY <= heroTop + scrubSpan;
    }

    function onWheel(event) {
        // never fight zoom, an unready film, or a visitor who asked for less motion
        if (event.ctrlKey || !ready || reduced.matches || !insideScrub()) return;
        const limit = scrollLimit();
        if (!limit) return;
        const now = performance.now();
        const dt = lastWheel ? Math.min(.1, (now - lastWheel) / 1000) : 1 / 60;
        lastWheel = now;
        const allowed = limit * dt;
        if (Math.abs(event.deltaY) <= allowed) return;   // already slow enough, leave it native
        event.preventDefault();
        scrollBy(0, clamp(event.deltaY, -allowed, allowed));
    }

    if (!reduced.matches) {
        document.documentElement.classList.add('has-scroll-film');
        // On the hero only. A non-passive wheel listener on window takes the whole
        // site off the compositor fast path and makes every scroll wait for JS.
        hero.addEventListener('wheel', onWheel, { passive: false });
        measureGeometry();
        measureRefresh();
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', () => { measureGeometry(); onScroll(); }, { passive: true });
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
