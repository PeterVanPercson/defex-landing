(() => {
    const hero = document.querySelector('.hero');
    const film = document.getElementById('film');
    if (!hero || !film) return;
    const sticky = hero.querySelector('.hero__sticky');
    if (!sticky) return;
    // The canvas the frames are drawn on. Absent in the tests and in old markup,
    // in which case the film scrubs the <video> as it always did.
    const frames = document.getElementById('frames');
    const cue = hero.querySelector('.scroll-cue');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    const initialPoster = film.poster;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    // The film finishes a little before the pin releases, so the last frame holds.
    const SCRUB_END = 0.9;

    // ------------------------------------------------------------------
    // Geometry and the nav flip. This runs for EVERY visitor, film or no film.
    //
    // Geometry is cached. Reading offsetHeight or getBoundingClientRect inside
    // the scroll handler forces a synchronous layout on every event, and a
    // trackpad fires around a hundred a second. Measure on resize instead.
    let heroTop = 0, scrubSpan = 0, navFlipAt = 0, navDarkAgainAt = Infinity;
    function measureGeometry() {
        heroTop = hero.offsetTop;
        scrubSpan = hero.offsetHeight - sticky.offsetHeight;
        // The nav is dark while it sits on the hero and paper once past it.
        // Flip three quarters of the way down the dissolve band, where the
        // ground behind the bar has already become paper. --hero-fade is a
        // clamp() expression and a custom property reports its raw text, so
        // the band's own computed height is read instead.
        const nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 64;
        const fade = parseFloat(getComputedStyle(hero, '::after').height) || 0;
        navFlipAt = heroTop + hero.offsetHeight + fade * .75 - nav;
        // The page ends on the dark again, so the bar flips back before the
        // closing block, measured from the top of that block's own dissolve.
        const close = document.querySelector('.contact.dark');
        if (!close) { navDarkAgainAt = Infinity; return; }
        const closeFade = parseFloat(getComputedStyle(close, '::before').height) || 0;
        navDarkAgainAt = close.offsetTop - closeFade * .25 - nav;
    }
    let navPast = null;
    function syncNav() {
        const past = scrollY > navFlipAt && scrollY < navDarkAgainAt;
        if (past === navPast) return;
        navPast = past;
        document.documentElement.classList.toggle('past-hero', past);
    }
    // Progress is the travel through .hero's extra height above the pinned box.
    // The second branch is the no-CSS fallback, where .hero has no extra height.
    function scrollProgress() {
        if (scrubSpan > 40) return clamp((scrollY - heroTop) / scrubSpan, 0, 1);
        return clamp(scrollY / Math.max(1, innerHeight * 1.4), 0, 1);
    }
    // The "Scroll" cue fades over the first seventh of the scrub. Written on
    // the cue itself, not on .hero, so the change invalidates one element.
    let cueOpacity = null;
    function syncCue(p) {
        const opacity = 1 - clamp(p * 7, 0, 1);
        if (opacity === cueOpacity) return;
        cueOpacity = opacity;
        (cue || hero).style.setProperty('--cue-opacity', String(opacity));
    }

    // ------------------------------------------------------------------
    // Every mouse is a different speed. A trackpad or Magic Mouse moves the
    // page in a dense stream of small steps; a notched wheel moves it 53,
    // 100 or 120 px per click, which most browsers spread over ~150 ms of
    // small steps too, but not all of them and not on every setting; touch
    // has its own momentum; keys and anchors jump. The wheel events
    // themselves are no guide (their deltas depend on the OS, the browser
    // and the mouse's own driver), so the follow reads the scroll position
    // instead: a change that arrives as one isolated step of many frames
    // is a click that nobody animated, and the frame glides across it over
    // ~110 ms rather than jumping; a change that is part of a stream, or a
    // small one, is followed near-literally, so an animated click or a
    // trackpad is never smoothed twice and a flick never trails.
    const TAU_FOLLOW = .045, TAU_GLIDE = .11;
    // a step of this many frames or more, on its own, is a click to glide
    const STEP = 8;
    // scroll events closer together than this are one stream
    const STREAM_MS = 80;

    // ------------------------------------------------------------------
    // Engine one: the frames. One still per scroll position, drawn on the
    // canvas. Nothing is decoded on the main thread at draw time when the
    // window ahead has been decoded, and nothing waits on a seek: the frame
    // shown is a function of where the page is, at whatever rate the page
    // moves. The set streams in coarse to fine, so a fast first scroll finds
    // a frame every few hundred pixels within a second and the gaps fill as
    // it goes; until a frame has arrived, its nearest loaded neighbour stands
    // in. Fails over to the video below if the browser cannot decode the
    // format or nothing arrives.
    function framesEngine() {
        const base = film.dataset.frames, baseSm = film.dataset.framesSm;
        const N = Number(film.dataset.frameCount) || 0;
        if (!frames || !base || N < 2 || typeof Image !== 'function' || typeof frames.getContext !== 'function') return null;
        const ctx = frames.getContext('2d', { alpha: false });
        if (!ctx) return null;
        const small = Boolean(baseSm) && Math.min(innerWidth, innerHeight) <= 820;
        const dir = small ? baseSm : base;
        const [W, H] = ((small && film.dataset.frameSizeSm) || film.dataset.frameSize || '1920x1080').split('x').map(Number);
        const ext = film.dataset.frameExt || 'avif';
        const v = film.dataset.frameV ? '?v=' + film.dataset.frameV : '';
        const MAX_INFLIGHT = 6;
        const AHEAD = 24, BEHIND = 6;
        // A jump this big is an anchor, a Home key or a scrollbar drag:
        // snap, rather than glide through two seconds of film.
        const JUMP = 60;
        const FIRST_FRAME_TIMEOUT = 10000;

        const imgs = new Array(N).fill(null);
        const state = new Uint8Array(N); // 0 idle, 1 loading, 2 ready, 3 failed
        const decoded = new Uint8Array(N);
        let inflight = 0, ready = 0, failed = 0, live = false, on = false;
        let target = 0, shown = 0, drawn = -1, direction = 1;
        let tau = TAU_FOLLOW, lastMove = 0;
        let frameId = 0, running = false, lastTick = 0, firstTimer = 0;
        let ctxW = 0, ctxH = 0;

        // Coarse to fine: every 32nd frame first, then the 16ths, and so on.
        const order = [];
        const queued = new Uint8Array(N);
        for (const stride of [32, 16, 8, 4, 2, 1]) {
            for (let i = 0; i < N; i += stride) if (!queued[i]) { queued[i] = 1; order.push(i); }
        }
        let cursor = 0;

        const url = (i) => `${dir}f${String(i).padStart(4, '0')}.${ext}${v}`;

        function request(i, priority) {
            if (state[i]) return false;
            state[i] = 1;
            inflight++;
            const img = new Image();
            img.decoding = 'async';
            if ('fetchPriority' in img) img.fetchPriority = priority;
            img.onload = () => {
                inflight--;
                state[i] = 2;
                ready++;
                imgs[i] = img;
                if (Math.abs(i - Math.round(shown)) <= AHEAD) predecode(i);
                if (!live || Math.abs(i - Math.round(shown)) < Math.abs(drawn - Math.round(shown))) paint();
                pump();
            };
            img.onerror = () => {
                inflight--;
                state[i] = 3;
                failed++;
                // the format is not decodable here, or the set is missing
                if (!live && (failed >= 3 || i === 0)) { fail(); return; }
                pump();
            };
            img.src = url(i);
            return true;
        }
        // Fill the pipe: the frames under and just ahead of where the scroll
        // is heading first (those may run a little over the cap, so a pipe
        // full of far-off stills never holds them up), a few behind, then the
        // coarse-to-fine order for the rest of the film.
        function pump() {
            if (!on) return;
            const f = clamp(Math.round(target), 0, N - 1);
            for (let d = 0; d <= AHEAD; d++) {
                if (inflight >= MAX_INFLIGHT + (d < 4 ? 4 : 0)) break;
                const i = f + d * direction;
                if (i >= 0 && i < N) request(i, d < 8 ? 'high' : 'auto');
            }
            for (let d = 1; d <= BEHIND && inflight < MAX_INFLIGHT; d++) {
                const i = f - d * direction;
                if (i >= 0 && i < N) request(i, 'auto');
            }
            while (inflight < MAX_INFLIGHT && cursor < N) request(order[cursor++], 'low');
        }
        // Decoding a 1920x1080 still takes a few milliseconds; asked for
        // ahead of time it happens off the main thread, and drawImage then
        // costs nothing. Only the window around the shown frame is decoded,
        // so a full set never sits decoded in memory at once.
        function predecode(i) {
            if (decoded[i] || state[i] !== 2 || !imgs[i].decode) return;
            decoded[i] = 1;
            imgs[i].decode().catch(() => { decoded[i] = 0; });
        }
        function warm() {
            const f = Math.round(shown);
            for (let d = 1; d <= 8; d++) { const i = f + d * direction; if (i >= 0 && i < N) predecode(i); }
            for (let d = 1; d <= 2; d++) { const i = f - d * direction; if (i >= 0 && i < N) predecode(i); }
        }
        function nearest(f) {
            if (state[f] === 2) return f;
            for (let d = 1; d < N; d++) {
                if (f - d >= 0 && state[f - d] === 2) return f - d;
                if (f + d < N && state[f + d] === 2) return f + d;
            }
            return -1;
        }
        function paint() {
            if (!on) return;
            const f = clamp(Math.round(shown), 0, N - 1);
            const use = nearest(f);
            if (use < 0 || use === drawn) return;
            drawn = use;
            if (ctxW !== W || ctxH !== H) { frames.width = ctxW = W; frames.height = ctxH = H; }
            ctx.drawImage(imgs[use], 0, 0, W, H);
            if (!live) {
                live = true;
                clearTimeout(firstTimer);
                frames.hidden = false;
                film.hidden = true;
            }
            warm();
        }
        function tick(now) {
            if (!on || reduced.matches || document.hidden) { running = false; lastTick = 0; return; }
            const dt = lastTick ? Math.min(.05, (now - lastTick) / 1000) : 1 / 60;
            lastTick = now;
            const gap = target - shown;
            if (Math.abs(gap) > JUMP) shown = target;
            else shown += gap * (1 - Math.exp(-dt / tau));
            if (Math.abs(target - shown) < .35) shown = target;
            paint();
            if (shown !== target) frameId = requestAnimationFrame(tick);
            else { running = false; lastTick = 0; pump(); }
        }
        function start() {
            if (running || !on || reduced.matches || document.hidden) return;
            running = true;
            lastTick = 0;
            frameId = requestAnimationFrame(tick);
        }
        function onScroll(p) {
            const next = clamp(p / SCRUB_END, 0, 1) * (N - 1);
            if (next !== target) {
                const now = performance.now();
                const isolated = now - lastMove > STREAM_MS;
                lastMove = now;
                direction = next > target ? 1 : -1;
                // one lone step of a click's worth glides; anything in a
                // stream, or small, is followed
                tau = isolated && Math.abs(next - target) >= STEP ? TAU_GLIDE : TAU_FOLLOW;
                target = next;
            }
            pump();
            start();
        }
        // Back from a hidden tab or the bfcache: the canvas may have been
        // purged (iOS does), so the frame is drawn again whatever changed.
        function resume() {
            drawn = -1;
            paint();
            start();
        }
        function fail() {
            if (!on) return;
            stop();
            fallback();
        }
        function stop() {
            on = false;
            clearTimeout(firstTimer);
            cancelAnimationFrame(frameId);
            running = false;
            lastTick = 0;
            frames.hidden = true;
            film.hidden = false;
            live = false;
            drawn = -1;
        }
        function pause() {
            cancelAnimationFrame(frameId);
            running = false;
            lastTick = 0;
        }
        function begin() {
            on = true;
            frames.width = ctxW = W;
            frames.height = ctxH = H;
            shown = target = 0;
            firstTimer = setTimeout(() => { if (!live) fail(); }, FIRST_FRAME_TIMEOUT);
            request(0, 'high');
            pump();
        }
        return { begin, stop, pause, onScroll, resume, kind: 'frames' };
    }

    // ------------------------------------------------------------------
    // Engine two: the <video>, scrubbed by seeking. What every visitor got
    // before the frames, and still what a browser gets that cannot decode
    // them. One seek in flight at a time, quantised to real frames: assigning
    // currentTime every animation frame queues seeks the decoder never
    // clears. A watchdog frees a seek the browser swallowed.
    function videoEngine() {
        const FPS = Number(film.dataset.fps) || 60;
        const FRAME = 1 / FPS;
        // Exponential approach toward the scroll position; see docs/hero.md
        // for the measurements behind 28.
        const EASE = 28;
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
        let on = false, ready = false, seeking = false, running = false, unlocked = false;
        let target = 0, shown = 0, lastFrame = -1, lastTick = 0;
        let frameId = 0, loadTimer = 0, seekWatchdog = 0;
        function releaseSeek() {
            clearTimeout(seekWatchdog);
            seeking = false;
        }
        function paint() {
            if (seeking || !ready || !on || reduced.matches || document.hidden) return;
            const frame = Math.round(shown / FRAME);
            if (frame === lastFrame) return;
            lastFrame = frame;
            seeking = true;
            clearTimeout(seekWatchdog);
            seekWatchdog = setTimeout(() => { seeking = false; lastFrame = -1; paint(); }, 400);
            // Seek inside the frame: container timestamps round to
            // milliseconds, so an exact boundary can land on the frame before.
            film.currentTime = Math.min((frame + .5) * FRAME, film.duration - .001);
        }
        film.addEventListener('seeked', () => { releaseSeek(); paint(); });
        function tick(now) {
            if (!ready || !on || reduced.matches || document.hidden) { running = false; lastTick = 0; return; }
            const dt = lastTick ? Math.min(.05, (now - lastTick) / 1000) : 1 / refresh;
            lastTick = now;
            const gap = target - shown;
            shown += clamp(gap * (1 - Math.exp(-EASE * dt)), -MAX_RATE * dt, MAX_RATE * dt);
            if (Math.abs(target - shown) < FRAME / 3) shown = target;
            paint();
            if (shown !== target) frameId = requestAnimationFrame(tick);
            else { running = false; lastTick = 0; }
        }
        function start() {
            if (running || !ready || !on || reduced.matches || document.hidden) return;
            if (shown === target && lastFrame >= 0) return;
            running = true;
            lastTick = 0;
            frameId = requestAnimationFrame(tick);
        }
        let lastP = 0;
        function onScroll(p) {
            lastP = p;
            if (!ready || !isFinite(film.duration) || film.duration <= 0) return;
            target = clamp(p / SCRUB_END, 0, 1) * (film.duration - FRAME);
            start();
        }
        function markReady() {
            if (ready || !on || reduced.matches || saveData || !film.hasAttribute('src') || film.readyState < 2) return;
            clearTimeout(loadTimer);
            ready = true;
            onScroll(lastP);
        }
        // readyState 2 is the first point a seek is guaranteed to have a frame
        // to land on. loadedmetadata (readyState 1) only knows the duration.
        for (const name of ['loadeddata', 'canplay', 'canplaythrough', 'loadedmetadata']) film.addEventListener(name, markReady);
        // iOS will not paint a seek until the element has been allowed to decode once.
        function unlock() {
            if (unlocked || !on || reduced.matches || saveData || !film.hasAttribute('src')) return;
            unlocked = true;
            const played = film.play();
            if (played && played.then) played.then(() => film.pause()).catch(() => {});
            else film.pause();
        }
        addEventListener('touchstart', unlock, { passive: true });
        addEventListener('pointerdown', unlock);
        film.addEventListener('error', () => { if (on) still(); });
        function begin() {
            // An optional smaller source must be the same film, duration and frame rate.
            const small = film.dataset.srcSm;
            const wide = film.dataset.src;
            if (!wide || (film.dataset.type && !film.canPlayType(film.dataset.type))) { still(); return; }
            on = true;
            unlocked = false;
            ready = false;
            shown = target = 0;
            lastFrame = -1;
            film.poster = initialPoster;
            // the markup says preload="none" so the poster-only path costs
            // nothing; the scrub needs the whole file buffered
            film.preload = 'auto';
            film.src = (small && Math.min(innerWidth, innerHeight) <= 820) ? small : wide;
            clearTimeout(loadTimer);
            loadTimer = setTimeout(still, 12000);
            measureRefresh();
            markReady();
        }
        function stop() {
            on = false;
            clearTimeout(loadTimer);
            cancelAnimationFrame(frameId);
            releaseSeek();
            ready = false;
            running = false;
            lastTick = 0;
            lastFrame = -1;
            film.pause();
            film.removeAttribute('src');
            film.load();
        }
        function pause() {
            cancelAnimationFrame(frameId);
            running = false;
            lastTick = 0;
            releaseSeek();
        }
        return { begin, stop, pause, onScroll, resume: start, kind: 'video' };
    }

    // ------------------------------------------------------------------
    const video = videoEngine();
    let engine = null;

    // No film at all: the final-frame still, the pin released, and the nav
    // still flipping where the hero ends.
    function still() {
        if (engine) engine.stop();
        engine = null;
        video.stop();
        if (film.dataset.posterFinal) film.poster = film.dataset.posterFinal;
        document.documentElement.classList.remove('has-scroll-film');
        measureGeometry();
        syncNav();
    }
    function fallback() {
        engine = video;
        video.begin();
        if (engine === video) onScroll();
    }
    function onScroll() {
        const p = scrollProgress();
        syncCue(p);
        if (engine) engine.onScroll(p);
    }
    function configureMotion() {
        if (engine) engine.stop();
        engine = null;
        video.stop();
        if (reduced.matches || saveData) { still(); return; }
        film.poster = initialPoster;
        film.hidden = false;
        // The head script has usually added this already, so the hero is
        // already 280svh before first paint and nothing shifts here.
        document.documentElement.classList.add('has-scroll-film');
        measureGeometry();
        const next = framesEngine();
        if (next) { engine = next; next.begin(); } else fallback();
        onScroll();
        syncNav();
    }

    // The topbar is dark while it sits on the hero and paper once past it.
    // That is true for EVERY visitor, so it is wired up before the film is.
    // pageshow and load as well as resize: Chrome restores the scroll position
    // on a reload and on back/forward without firing a scroll event.
    const resync = () => { measureGeometry(); onScroll(); if (engine) engine.resume(); syncNav(); };
    measureGeometry();
    syncNav();
    addEventListener('scroll', syncNav, { passive: true });
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', resync, { passive: true });
    addEventListener('pageshow', resync);
    addEventListener('load', resync);
    if ('ResizeObserver' in window) new ResizeObserver(resync).observe(document.body);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { if (engine) engine.pause(); }
        else resync();
    });
    reduced.addEventListener('change', configureMotion);
    configureMotion();
})();
