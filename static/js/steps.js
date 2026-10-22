(() => {
    // The four claims under "Robots are cheap." as ruled rows that stack (his
    // call, 2026-10-22, after roboflow.com's platform list). The pinning is
    // CSS (position: sticky on each row, .steps.is-stacked); this file turns
    // it on where a row fits, marks the open row (.is-on), lets a folded
    // header take you back to its row, and runs each camera feed only while
    // it can be seen (.is-live). Two feeds are drawn here frame by frame
    // (data-scene), the other two are CSS. On a phone, a short window or
    // under Reduce Motion the rows simply sit one under another.
    const root = document.getElementById('steps');
    if (!root) return;
    const rows = [...root.querySelectorAll('.feature')];
    if (!rows.length) return;
    const list = root.querySelector('.features') || root;
    const feeds = rows.map((row) => row.querySelector('.feed'));
    const arts = rows.map((row) => row.querySelector('.feature__ascii'));

    const roomy = matchMedia('(min-width: 901px) and (min-height: 640px)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const ROW = 56;
    let stacked = false, queued = false, nav = 64;

    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const smooth = (x) => x * x * (3 - 2 * x);
    // piecewise between [t, value] stops, eased inside each stretch
    function at(t, stops) {
        if (t <= stops[0][0]) return stops[0][1];
        for (let i = 1; i < stops.length; i++) {
            const [t1, v1] = stops[i], [t0, v0] = stops[i - 1];
            if (t <= t1) return v0 + (v1 - v0) * smooth(clamp((t - t0) / (t1 - t0 || 1)));
        }
        return stops[stops.length - 1][1];
    }

    // Check: a scan sweeps the line, each unit gets its tag as it passes,
    // the one with an open wire drops into the rejects, the log counts.
    function check(svg) {
        const units = [...svg.querySelectorAll('[data-unit]')];
        const marks = [...svg.querySelectorAll('[data-mark]')];
        const scan = svg.querySelector('[data-scan]');
        const log = svg.querySelector('[data-log]');
        const cx = [72, 156, 240, 324, 408], BAD = 2, SWEEP = .72;
        const pass = cx.map((x) => (x - 24) / 432 * SWEEP);
        let last = '';
        return (t) => {
            const out = 1 - clamp((t - .9) / .06);
            if (scan) {
                scan.setAttribute('transform', `translate(${(24 + 432 * Math.min(t / SWEEP, 1)).toFixed(1)} 0)`);
                scan.style.opacity = t < SWEEP ? 1 : clamp(1 - (t - SWEEP) / .06);
            }
            marks.forEach((mark, i) => {
                const on = clamp((t - pass[i]) / .03);
                const s = 1.18 - .18 * on;
                mark.style.opacity = (on * out).toFixed(3);
                mark.setAttribute('transform', `translate(${cx[i]} 188) scale(${s.toFixed(3)}) translate(${-cx[i]} -188)`);
            });
            const unit = units[BAD];
            if (unit) {
                const d = clamp((t - pass[BAD] - .07) / .1);
                unit.setAttribute('transform', `translate(0 ${(92 * d * d).toFixed(1)})`);
                unit.style.opacity = (t < .05 ? t / .05 : out).toFixed(3);
            }
            const passed = cx.filter((_, i) => i !== BAD && t >= pass[i]).length;
            const text = `Passed ${passed} · Rejected ${t >= pass[BAD] + .17 ? 1 : 0}`;
            if (log && text !== last) { log.textContent = text; last = text; }
        };
    }

    // Measure: the board camera finds both marks, then the header, and
    // ties them together; the grip camera boxes the connector in the hand
    // and the wrist turns it square.
    function measure(svg) {
        const ret = svg.querySelector('[data-ret]');
        const [frame, cross] = ret ? [...ret.querySelectorAll('path')] : [];
        const chip = svg.querySelector('[data-chip]');
        const label = chip && chip.querySelector('text');
        const box = chip && chip.querySelector('rect');
        const dims = svg.querySelector('[data-dims]');
        const grip = svg.querySelector('[data-grip]');
        const gripMark = svg.querySelector('[data-grip-mark]');
        const A = [58, 66, 36, 36], B = [288, 266, 36, 36], H = [184, 157, 168, 80], C = [178, 161, 120, 120];
        const path = [[0, C], [.06, C], [.18, A], [.3, A], [.42, B], [.5, B], [.62, H], [1, H]];
        const named = [[.18, .3, 'Mark'], [.42, .5, 'Mark'], [.62, .9, 'Header']];
        let shown = '';
        return (t) => {
            const v = [0, 1, 2, 3].map((k) => at(t, path.map(([s, p]) => [s, p[k]])));
            const [x, y, w, h] = v, l = Math.min(12, w / 3), x0 = x - w / 2, y0 = y - h / 2, x1 = x + w / 2, y1 = y + h / 2;
            const fade = at(t, [[0, 0], [.06, 1], [.88, 1], [.95, 0]]);
            if (frame) frame.setAttribute('d', `M${x0} ${y0 + l}V${y0}H${x0 + l}M${x1 - l} ${y0}H${x1}V${y0 + l}M${x0} ${y1 - l}V${y1}H${x0 + l}M${x1 - l} ${y1}H${x1}V${y1 - l}`);
            if (cross) cross.setAttribute('d', `M${x - 6} ${y}H${x + 6}M${x} ${y - 6}V${y + 6}`);
            if (ret) ret.style.opacity = fade.toFixed(3);
            const now = named.find(([a, b]) => t >= a && t < b);
            if (chip) {
                chip.style.opacity = now ? (fade * clamp((t - now[0]) / .02)).toFixed(3) : 0;
                if (now && now[2] !== shown && label) {
                    label.textContent = now[2]; shown = now[2];
                    if (box) box.setAttribute('width', now[2] === 'Mark' ? 48 : 62);
                }
                chip.setAttribute('transform', `translate(${x0} ${y0 - 28})`);
            }
            if (dims) dims.style.opacity = at(t, [[.64, 0], [.7, 1], [.88, 1], [.95, 0]]).toFixed(3);
            if (grip) grip.setAttribute('transform', `rotate(${at(t, [[0, -7], [.6, -7], [.74, 0], [.92, 0], [1, -7]]).toFixed(2)} 397 262)`);
            if (gripMark) gripMark.style.opacity = at(t, [[.34, 0], [.4, 1], [.9, 1], [.96, 0]]).toFixed(3);
        };
    }

    const SCENES = { check: [check, 7000, .86], measure: [measure, 8000, .8] };
    const players = feeds.map((feed) => {
        const scene = feed && SCENES[feed.dataset.scene];
        const svg = feed && feed.querySelector('svg');
        if (!scene || !svg) return null;
        const [make, ms, rest] = scene;
        const draw = make(svg);
        let id = 0, from = 0, held = 0;
        const tick = (now) => { draw(((now - from) % ms) / ms); id = requestAnimationFrame(tick); };
        draw(rest);
        return {
            play() { if (id || still.matches) return; from = performance.now() - held; id = requestAnimationFrame(tick); },
            pause() { if (!id) return; cancelAnimationFrame(id); id = 0; held = (performance.now() - from) % ms; },
            rest() { this.pause(); held = 0; draw(rest); },
        };
    });

    // Each row's ASCII drawing types itself in, left to right with a short
    // run of noise ahead of the cursor, the first time its row opens or it
    // comes fully into view. Until
    // then it is blank (the same spaces, so nothing moves); without this
    // file or under Reduce Motion it simply shows.
    const NOISE = '#=+-:.*/<>o';
    const art = arts.map((el) => el && el.textContent);
    const typed = new Set();
    if (!still.matches) arts.forEach((el, i) => { if (el) el.textContent = art[i].replace(/[^\s]/g, ' '); });
    function type(i) {
        const el = arts[i], text = art[i];
        if (!el || typed.has(i)) return;
        typed.add(i);
        if (still.matches) { el.textContent = text; return; }
        const start = performance.now(), T = 1100;
        const step = (now) => {
            const p = clamp((now - start) / T);
            let out = '';
            for (let k = 0; k < text.length; k++) {
                const c = text[k], x = k / text.length;
                out += /\s/.test(c) || x < p ? c : x < p + .1 ? NOISE[(k * 7 + Math.floor(now / 45)) % NOISE.length] : ' ';
            }
            el.textContent = p < 1 ? out : text;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function setLive(i, live) {
        const feed = feeds[i];
        if (!feed) return;
        if (feed.classList.contains('is-live') === live) return;
        feed.classList.toggle('is-live', live);
        const player = players[i];
        if (player) live ? player.play() : player.pause();
    }

    function update() {
        queued = false;
        const vh = window.innerHeight;
        let on = -1;
        const tops = rows.map((row) => row.getBoundingClientRect().top);
        tops.forEach((top, i) => {
            if (stacked ? top <= nav + i * ROW + 1 : top < vh * .5) on = i;
        });
        rows.forEach((row, i) => row.classList.toggle('is-on', i === on));
        if (on >= 0) type(on);
        // a drawing also starts once it is on screen and clear of the row after it
        arts.forEach((el, i) => {
            if (!el || typed.has(i) || !el.getBoundingClientRect) return;
            const r = el.getBoundingClientRect();
            const cover = i + 1 < tops.length && stacked ? tops[i + 1] : Infinity;
            if (r.bottom < Math.min(vh, cover) && r.top > nav) type(i);
        });
        feeds.forEach((feed, i) => {
            if (!feed) return;
            const r = feed.getBoundingClientRect();
            const cover = i + 1 < tops.length && stacked ? tops[i + 1] : Infinity;
            const seen = Math.min(r.bottom, cover, vh) - Math.max(r.top, nav);
            setLive(i, !still.matches && seen > 60);
        });
    }

    function onScroll() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
    }

    // a folded header takes you back to where its row pins
    rows.forEach((row, i) => {
        const head = row.querySelector('.feature__row');
        if (!head) return;
        head.addEventListener('click', () => {
            if (!stacked) return;
            const top = list.getBoundingClientRect().top + window.scrollY;
            const before = rows.slice(0, i).reduce((sum, r) => sum + r.offsetHeight, 0);
            window.scrollTo({ top: Math.max(0, top + before - nav - i * ROW), behavior: 'smooth' });
        });
    });

    function setMode() {
        nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 64;
        const want = roomy.matches && !still.matches;
        if (want !== stacked) {
            stacked = want;
            root.classList.toggle('is-stacked', stacked);
        }
        if (still.matches) players.forEach((p) => p && p.rest());
        update();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setMode, { passive: true });
    window.addEventListener('load', setMode);
    roomy.addEventListener('change', setMode);
    still.addEventListener('change', setMode);
    setMode();
})();
