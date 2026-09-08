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
    // Exponential approach toward the scroll position. The page itself scrolls
    // natively, so the film has to follow it closely: a soft ease looks smooth in
    // isolation but leaves the film trailing, and when the pin releases the rest
    // of the animation plays off screen. Measured at 2922px of scrub on a 893px
    // viewport, EASE 8 ran 3.8s behind a hard flick and lost 833ms off screen;
    // 28 lands under 450ms behind and loses nothing. It is still enough easing to
    // hide the 24fps quantisation. Higher is more literal, lower is more floaty.
    const EASE = 28;

    // Safety clamp only, set far above anything scrolling asks for so it never
    // introduces lag of its own. An earlier version capped this at 2.5x realtime
    // and that cap, not the ease, was what made a fast scroll outrun the film.
    // This only stops a single frame from trying to jump the entire film after
    // an anchor jump or a Home keypress.
    const MAX_RATE = 40;
    let refresh = 60;

    function measureRefresh() {
        const deltas = [];
        let previous = 0, seen = 0;
        const sample = (now) => {
            if (previous) deltas.push(now - previous);
            previous = now;
            if (++seen < 24) { requestAnimationFrame(sample); return; }
            deltas.sort((a, b) => a - b);
            const median = deltas[deltas.length >> 1];
            if (median > 1 && median < 60) refresh = Math.round(1000 / median);
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
        shown += clamp(gap * (1 - Math.exp(-EASE * dt)), -MAX_RATE * dt, MAX_RATE * dt);
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

    if (!reduced.matches) {
        document.documentElement.classList.add('has-scroll-film');
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
