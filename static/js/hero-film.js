(() => {
    const hero = document.querySelector('.hero');
    const film = document.getElementById('film');
    if (!hero || !film) return;
    const sticky = hero.querySelector('.hero__sticky');
    if (!sticky) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    const FPS = Number(film.dataset.fps) || 60;
    const FRAME = 1 / FPS;
    // The film finishes a little before the pin releases, so the last frame holds.
    const SCRUB_END = 0.9;
    // Exponential approach toward the scroll position. The page itself scrolls
    // natively, so the film has to follow it closely: a soft ease looks smooth in
    // isolation but leaves the film trailing, and when the pin releases the rest
    // of the animation plays off screen. Measured at 2922px of scrub on a 893px
    // viewport, EASE 8 ran 3.8s behind a hard flick and lost 833ms off screen;
    // 28 lands under 450ms behind and loses nothing. It is still enough easing to
    // soften scroll steps. Higher is more literal, lower is more floaty.
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
    let heroTop = 0, scrubSpan = 0, navFlipAt = 0;
    function measureGeometry() {
        heroTop = hero.offsetTop;
        scrubSpan = hero.offsetHeight - sticky.offsetHeight;
        // The nav is dark while it sits on the hero and paper once past it.
        // Flip three quarters of the way down the dissolve band, where the
        // ground behind the bar has already become paper. Read here, never in
        // the scroll handler, so this costs no layout while scrolling.
        // --hero-fade is a clamp() expression, and a custom property reports
        // its raw text, not a resolved length. The dissolve band's own computed
        // height is the resolved pixel value.
        const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 64;
        const fade = parseFloat(getComputedStyle(hero, '::after').height) || 0;
        navFlipAt = heroTop + hero.offsetHeight + fade * .75 - nav;
    }

    let navPast = null;
    function syncNav() {
        const past = scrollY > navFlipAt;
        if (past === navPast) return;
        navPast = past;
        document.documentElement.classList.toggle('past-hero', past);
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
        // Seek inside the frame: WebM timestamps round to milliseconds, so
        // an exact n/60 boundary can otherwise land on the preceding frame.
        film.currentTime = Math.min((frame + .5) * FRAME, film.duration - .001);
    }
    film.addEventListener('seeked', () => { releaseSeek(); paint(); });
    film.addEventListener('error', () => {
        releaseSeek();
        ready = false;
        document.documentElement.classList.remove('has-scroll-film');
        measureGeometry();
        syncNav();
    });

    function tick(now) {
        if (!ready) { running = false; lastTick = 0; return; }
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

    // Unsupported browsers get the new poster without a long, frozen pin.
    // Reduced-motion visitors get the final still without downloading a film.
    if (reduced.matches) {
        if (film.dataset.posterFinal) film.poster = film.dataset.posterFinal;
        return;
    }
    if (film.dataset.type && !film.canPlayType(film.dataset.type)) return;

    // An optional smaller source must be the same film, duration and frame rate.
    const small = film.dataset.srcSm;
    const wide = film.dataset.src;
    if (!wide) return;
    film.src = (small && Math.min(innerWidth, innerHeight) <= 820) ? small : wide;

    if (!reduced.matches) {
        document.documentElement.classList.add('has-scroll-film');
        measureGeometry();
        measureRefresh();
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('scroll', syncNav, { passive: true });
        addEventListener('resize', () => { measureGeometry(); onScroll(); syncNav(); }, { passive: true });
        // Also on pageshow and load: Chrome restores the scroll position on a
        // reload and on back/forward without firing a scroll event, so a
        // refresh partway down the page left the nav painted for the top.
        addEventListener('pageshow', () => { measureGeometry(); onScroll(); syncNav(); });
        addEventListener('load', () => { measureGeometry(); onScroll(); syncNav(); });
        addEventListener('touchstart', unlock, { once: true, passive: true });
        addEventListener('pointerdown', unlock, { once: true });
        onScroll();
        syncNav();
    }
    reduced.addEventListener('change', (event) => {
        if (!event.matches) return;
        document.documentElement.classList.remove('has-scroll-film');
        if (ready) hold();
    });
})();
