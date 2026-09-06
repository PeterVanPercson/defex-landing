// defex — language toggle + the demo video. Nothing else moves on this page.

// ===== Language toggle (EN / 中) =====
(() => {
    const root = document.documentElement;
    const buttons = document.querySelectorAll('.lang__btn');
    if (!buttons.length) return;

    function applyPlaceholders(lang) {
        document.querySelectorAll('[data-placeholder-en]').forEach(el => {
            const v = el.getAttribute('data-placeholder-' + lang);
            if (v) el.setAttribute('placeholder', v);
        });
    }
    function setLang(lang) {
        if (lang !== 'en' && lang !== 'zh') lang = 'en';
        root.setAttribute('lang', lang);
        try { localStorage.setItem('defex.lang', lang); } catch (e) {}
        applyPlaceholders(lang);
    }
    applyPlaceholders(root.getAttribute('lang') || 'en');
    buttons.forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
})();

// ===== Demo video — plays like a gif when scrolled into view, sound is opt-in =====
(() => {
    const video = document.getElementById('demoVideo');
    const sound = document.getElementById('demoSound');
    if (!video) return;

    // one rendition per device: phones get the 720p file, everything else 1080p.
    // Decided by the physical screen, not the window — a desktop window that
    // happens to be narrow at load should still get the sharp file.
    const small = (window.screen && window.screen.width <= 800);
    // data-src-1080 does not camelCase (a digit follows the hyphen), so read the attribute
    video.src = video.getAttribute(small ? 'data-src-720' : 'data-src-1080');

    let inView = false;
    const play = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            inView = entries[0].isIntersecting;
            if (inView) play(); else video.pause();
        }, { threshold: 0.45 }).observe(video);
    } else {
        play();
    }

    if (sound) {
        sound.addEventListener('click', () => {
            const on = video.muted;           // about to turn sound on
            video.muted = !on;
            sound.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (on && inView) play();
        });
    }
})();

// ===== The line — five plates, one flaw, one full stop =====
// Deterministic, so the loop has no seam: constant-speed belt, a 140 ms linear
// stop when the flawed plate hits the register point, the dot in ONE frame,
// 1.8 s hold, a 600 ms kick out of the row, then the belt resumes. The dot is
// a DOM element on --accent so it is pixel-identical to the period in "bad."
(() => {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const log = document.getElementById('stageLog');
    const SRC = { good: stage.dataset.plate, bad: stage.dataset.plateBad };
    stage.style.setProperty('--plate-bad', `url("${SRC.bad}")`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const state = { plates: [], passed: 0, flagged: 0, mode: 'run', t0: 0, v: 0, held: null, spawned: 0, sinceBad: 0 };
    const PITCH_S = 1.2;             // seconds per pitch (20% of width)
    const EVERY = 5;                 // one flawed plate per five
    const STOP_MS = 140, HOLD_MS = 1800, KICK_MS = 600;

    function W() { return stage.clientWidth; }
    function pitch() { return W() * cssNum('--pitch', 0.2); }
    function cssNum(name, fallback) { const v = parseFloat(getComputedStyle(stage).getPropertyValue(name)); return isNaN(v) ? fallback : v; }
    function plateW() { return cssNum('--plate-w', 12) / 100 * window.innerWidth; }          // visible plate width
    function spriteW() { return plateW() / cssNum('--plate-frac', 0.7); }
    function cxOff() { return spriteW() * cssNum('--plate-cx', 0.5); }                          // plate centre from sprite left
    function registerX() {
        // the plate's dot stops on the same vertical line as the period of "bad."
        const dot = document.querySelector('.hero__title .dot');
        const r = dot && dot.getBoundingClientRect(), s = stage.getBoundingClientRect();
        if (r && r.width) { const x = r.left + r.width / 2 - s.left; if (x > W() * 0.2 && x < W() * 0.8) return x; }
        return W() * 0.56;
    }

    function make(bad) {
        const el = document.createElement('div');
        el.className = 'plate' + (bad ? ' plate--bad' : '');
        if (!bad) el.style.backgroundImage = `url("${SRC.good}")`;
        const dot = document.createElement('span'); dot.className = 'plate__dot'; el.appendChild(dot);
        stage.appendChild(el);
        return { el, bad, x: -spriteW(), y: 0 };
    }
    function paint(p) { p.el.style.transform = `translate3d(${p.x - cxOff()}px, calc(-${(cssNum('--plate-cy', 0.5) * 100).toFixed(2)}% + ${p.y}px), 0)`; }
    function say() {
        if (!log) return;
        log.querySelector('[lang="en"]').textContent = `line 1 · ${state.passed} passed · ${state.flagged} flagged`;
        log.querySelector('[lang="zh"]').textContent = `1 号线 · 通过 ${state.passed} · 标记 ${state.flagged}`;
    }

    // still frame: five plates on the grid, the register plate flagged
    function still() {
        const rx = registerX(), pw = pitch();
        for (let i = -2; i <= 2; i++) {
            const p = make(i === 0); p.x = rx + i * pw; paint(p);
            if (i === 0) { p.el.classList.add('is-flagged'); }
        }
        state.passed = 4; state.flagged = 1; say();
    }
    if (reduce) { still(); return; }

    // running line
    const speed = () => pitch() / PITCH_S;   // px per second
    let last = 0;
    function spawnIfDue() {
        const lastP = state.plates.reduce((m, p) => (!m || p.x < m.x) ? p : m, null);
        if (!lastP || lastP.x >= -spriteW() + pitch()) {
            state.sinceBad++;
            const bad = state.sinceBad >= EVERY;
            if (bad) state.sinceBad = 0;
            state.plates.push(make(bad));
        }
    }
    function frame(now) {
        if (!last) last = now;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        let v = speed();
        if (state.mode === 'stop') {
            const k = Math.min(1, (now - state.t0) / STOP_MS); v = speed() * (1 - k);
            if (k >= 1) { state.mode = 'hold'; state.t0 = now; state.held.el.classList.add('is-flagged'); state.flagged++; say(); }
        } else if (state.mode === 'hold') {
            v = 0;
            if (now - state.t0 >= HOLD_MS) { state.mode = 'kick'; state.t0 = now; }
        } else if (state.mode === 'kick') {
            v = 0;
            const k = Math.min(1, (now - state.t0) / KICK_MS);
            state.held.y = k * k * stage.clientHeight * 0.8; paint(state.held);
            if (k >= 1) { state.held.el.remove(); state.plates = state.plates.filter(p => p !== state.held); state.held = null; state.mode = 'run'; }
        }
        const rx = registerX();
        for (const p of state.plates) {
            if (p === state.held && state.mode !== 'stop') continue;
            const before = p.x; p.x += v * dt; paint(p);
            if (p.bad && state.mode === 'run' && before < rx && p.x >= rx) { p.x = rx; paint(p); state.mode = 'stop'; state.t0 = now; state.held = p; }
        }
        for (const p of [...state.plates]) {
            if (p.x - cxOff() > W()) { p.el.remove(); state.plates = state.plates.filter(q => q !== p); if (!p.bad) { state.passed++; say(); } }
        }
        if (state.mode === 'run' || state.mode === 'stop') spawnIfDue();
        requestAnimationFrame(frame);
    }
    // pre-fill the belt so the first screen is never empty — but only once the
    // stage has a real width (deferred scripts can run before the hero lays out)
    function prefill() {
        const pw = pitch();
        state.plates.forEach(p => p.el.remove()); state.plates = []; state.sinceBad = 2;
        for (let i = 0; i < 6; i++) { state.sinceBad++; const bad = state.sinceBad >= EVERY; if (bad) state.sinceBad = 0; const p = make(bad); p.x = W() - i * pw; paint(p); state.plates.push(p); }
        state.plates.sort((a, b) => a.x - b.x);   // ascending: last = right-most
        state.plates.reverse();                    // engine expects last = newest (left-most)
    }
    let rw = 0;                       // stage width the current positions were laid out for
    function start() {
        if (W() < 200) { setTimeout(start, 50); return; }
        rw = W();
        prefill();
        requestAnimationFrame(frame);
    }
    window.addEventListener('resize', () => { const nw = W(); if (!rw || !nw || nw === rw) return; const k = nw / rw; rw = nw; state.plates.forEach(p => { p.x *= k; paint(p); }); }, { passive: true });
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
    window.__line = { frame, state, W, pitch, registerX };
})();
