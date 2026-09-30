(() => {
    const root = document.querySelector('[data-meet]');
    if (!root) return;
    const q = (s) => root.querySelector(s);
    const qa = (s) => [...root.querySelectorAll(s)];
    const stage = q('.meet__stage'), svg = q('.rb'), scene = q('.rb__scene'), list = q('.meet__list');
    const items = qa('.meet__item');
    if (!stage || !svg || !scene || !list || !items.length) return;

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width: 899px)');
    let reduced = motion.matches;
    const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
    const lerp = (a, b, t) => a + (b - a) * t;
    const seg = (t, a, b) => clamp((t - a) / (b - a));
    const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const out3 = (t) => 1 - (1 - t) ** 3;
    const f = (n) => n.toFixed(2);

    // ------------------------------------------------------------------
    // The drawing. Scene units are the 1000 x 640 of the markup; the svg's
    // own viewBox is the stage in CSS pixels, so the camera is one
    // translate and one scale on the scene.
    const el = {
        upper: q('.rb__upper'), fore: q('.rb__fore'), elbow: q('.rb__elbow'), wrist: q('.rb__wrist'),
        fl: q('.rb__finger--l'), fr: q('.rb__finger--r'), part: q('.rb__part'), next: q('.rb__next'),
        ring: q('.rb__ring'), puck: q('.rb__puck'), scan: q('.rb__scan'), lock: q('.rb__lock'),
        tread: q('.rb__tread'), pulse: q('.rb__pulse'), cable: q('#rb-cable'), led: q('.rb__led'),
        run: q('.rb__lamp--run'), pass: q('.rb__lamp--pass'), fail: q('.rb__lamp--fail'),
        checks: qa('.rb__check'), bars: qa('.rb__bar'), uses: qa('.rb__part, .rb__next, .rb__binpart'),
    };
    const SHAPES = { three: 22, six: 30, round: 16 };
    let shape = 'three', half = SHAPES.three;

    const J = [470, 150], L = 165, DEG = 180 / Math.PI;
    const HOME = [490, 290], ABOVE_PICK = [330, 310], PICK = [330, 374], VIA = [485, 215];
    const ABOVE_SEAT = [650, 290], TOUCH = [657, 352], CENTRED = [650, 352], SEAT = [650, 366];
    const HOLD = 78, T = 7.6;
    const ik = ([x, y]) => {
        const dx = x - J[0], dy = y - J[1];
        const d = clamp(Math.hypot(dx, dy), 1, 2 * L - 0.01);
        const a1 = Math.atan2(dy, dx) + Math.acos(d / (2 * L));
        const ex = J[0] + L * Math.cos(a1), ey = J[1] + L * Math.sin(a1);
        return { a1, ex, ey, a2: Math.atan2(y - ey, x - ex) };
    };
    const line = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    const curve = (a, c, b, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; };

    // where the wrist is at time t of the cycle
    const wristAt = (t) => {
        if (t < 1.3) return HOME;
        if (t < 2.1) return line(HOME, ABOVE_PICK, inOut(seg(t, 1.3, 2.1)));
        if (t < 2.5) return line(ABOVE_PICK, PICK, inOut(seg(t, 2.1, 2.5)));
        if (t < 2.8) return PICK;
        if (t < 3.15) return line(PICK, ABOVE_PICK, inOut(seg(t, 2.8, 3.15)));
        if (t < 4.2) return curve(ABOVE_PICK, VIA, ABOVE_SEAT, inOut(seg(t, 3.15, 4.2)));
        if (t < 4.75) return line(ABOVE_SEAT, TOUCH, out3(seg(t, 4.2, 4.75)));
        if (t < 5.05) return line(TOUCH, CENTRED, inOut(seg(t, 4.85, 5.05)));
        if (t < 5.25) return line(CENTRED, SEAT, inOut(seg(t, 5.05, 5.25)));
        if (t < 5.55) return SEAT;
        if (t < 5.95) return line(SEAT, ABOVE_SEAT, inOut(seg(t, 5.55, 5.95)));
        return line(ABOVE_SEAT, HOME, inOut(seg(t, 5.95, 6.9)));
    };
    const closedAt = (t) => (t < 2.5 ? 0 : t < 2.75 ? seg(t, 2.5, 2.75) : t < 5.3 ? 1 : 1 - seg(t, 5.3, 5.5));
    const pulse = (t, at) => { const u = seg(t, at, at + 0.55); return u > 0 && u < 1 ? u : -1; };

    // the path the brain's pulse rides, sampled once so no frame asks
    // the browser where a point on it is
    let cablePts = null;
    const onCable = (u) => {
        if (!cablePts && el.cable && el.cable.getTotalLength) {
            const len = el.cable.getTotalLength(), n = 96;
            cablePts = [];
            for (let i = 0; i <= n; i++) { const p = el.cable.getPointAtLength(len * i / n); cablePts.push([p.x, p.y]); }
        }
        if (!cablePts) return [440, 96];
        const x = clamp(u) * (cablePts.length - 1), i = Math.floor(x), k = Math.min(i + 1, cablePts.length - 1);
        return line(cablePts[i], cablePts[k], x - i);
    };

    const setT = (node, v) => { if (node) node.setAttribute('transform', v); };
    const setOn = (node, on) => { if (node) node.classList.toggle('is-on', on); };

    const draw = (time) => {
        const n = Math.floor(time / T), t = time - n * T;
        const failed = n % 4 === 2;

        const w = wristAt(t);
        const { a1, ex, ey, a2 } = ik(w);
        setT(el.upper, `translate(${J[0]} ${J[1]}) rotate(${f(a1 * DEG)})`);
        setT(el.fore, `translate(${f(ex)} ${f(ey)}) rotate(${f(a2 * DEG)})`);
        setT(el.elbow, `translate(${f(ex)} ${f(ey)})`);
        setT(el.wrist, `translate(${f(w[0])} ${f(w[1])})`);
        const grip = lerp(half + 14, half + 5, closedAt(t));
        setT(el.fl, `translate(${f(-grip)} 0)`);
        setT(el.fr, `translate(${f(grip)} 0)`);

        // the part: rides the belt in, is carried, seats, then leaves
        let p, show = 1;
        if (t < 1.1) p = [lerp(220, 330, inOut(seg(t, 0, 1.1))), 452];
        else if (t < 2.75) p = [330, 452];
        else if (t < 5.3) p = [w[0], w[1] + HOLD];
        else if (t < 6.3) p = [650, 444];
        else if (!failed) {
            const u = seg(t, 6.3, 6.95);
            p = curve([650, 444], [740, 360], [822, 468], inOut(u));
            show = u < 0.92 ? 1 : 1 - seg(u, 0.92, 1);
        } else {
            const u = seg(t, 6.3, 6.95);
            p = [650, lerp(444, 592, u * u)];
            show = 1 - seg(u, 0.85, 1);
        }
        if (t >= 6.95) show = 0;
        setT(el.part, `translate(${f(p[0])} ${f(p[1])})`);
        if (el.part) el.part.style.opacity = show;
        const nx = lerp(150, 220, inOut(seg(t, 0, 1.1))), nOp = t < 1.1 ? seg(t, 0, 0.8) : 1;
        setT(el.next, `translate(${f(nx)} 452)`);
        if (el.next) el.next.style.opacity = nOp;
        if (el.tread) el.tread.style.strokeDashoffset = f(-lerp(0, 110, inOut(seg(t, 0, 1.1))) - n * 110);

        // vision: the scan sweeps the belt, then the part is locked
        const s = seg(t, 0.7, 1.5);
        if (el.scan) {
            const y = lerp(300, 452, s), k = (y - 266) / (452 - 266);
            el.scan.setAttribute('d', `M${f(lerp(186, 262, k))} ${f(y)} H${f(lerp(196, 408, k))}`);
            el.scan.style.opacity = s > 0 && s < 1 ? Math.sin(s * Math.PI) : 0;
        }
        if (el.lock) {
            const on = t > 1.35 && t < 2.8, g = out3(seg(t, 1.35, 1.6)), m = 10 + 14 * (1 - g);
            const x0 = 330 - half - m, x1 = 330 + half + m, y0 = 452 - 30 - m, y1 = 452 + m * 0.4, c = 10;
            el.lock.setAttribute('d', `M${x0} ${y0 + c}V${y0}H${x0 + c}M${x1 - c} ${y0}H${x1}V${y0 + c}M${x1} ${y1 - c}V${y1}H${x1 - c}M${x0 + c} ${y1}H${x0}V${y1 - c}`);
            el.lock.style.opacity = on ? g : 0;
        }

        // touch: a ring off the wrist when the part meets the socket, and again as it seats
        if (el.ring) {
            const u = Math.max(pulse(t, 4.72), pulse(t, 5.22));
            el.ring.setAttribute('r', u < 0 ? 14 : f(14 + 40 * out3(u)));
            el.ring.style.opacity = u < 0 ? 0 : f(1 - u);
        }
        setOn(el.puck, t > 4.72 && t < 5.3);

        // the tester: blue while it runs, two checks, then pass or fail
        const testing = t > 5.35 && t < 6.2;
        setOn(el.run, testing && Math.sin(t * 22) > -0.2);
        const c1 = t > 5.65 && t < 7.3, c2 = t > 5.95 && t < 7.3;
        el.checks.forEach((c, i) => {
            const on = i === 0 ? c1 : c2, bad = i === 1 && failed;
            c.classList.toggle('is-ok', on && !bad);
            c.classList.toggle('is-bad', on && bad);
        });
        setOn(el.pass, t > 6.2 && t < 7.3 && !failed);
        setOn(el.fail, t > 6.2 && t < 7.3 && failed);

        // the brain: the result runs down the wire and one more bar lights
        if (el.pulse) {
            const u = seg(t, 6.25, 7.1);
            const at = onCable(u);
            el.pulse.setAttribute('cx', f(at[0]));
            el.pulse.setAttribute('cy', f(at[1]));
            el.pulse.style.opacity = u > 0 && u < 1 ? 1 : 0;
        }
        const lit = 2 + (n % (el.bars.length - 2)) + (t > 7.1 ? 1 : 0);
        el.bars.forEach((b, i) => b.classList.toggle('is-lit', i < Math.max(1, lit)));
        setOn(el.led, t > 7.05 && t < 7.4);
    };

    // ------------------------------------------------------------------
    // The camera. Each part has the patch of the scene it lives in. They
    // stay put while the robot works inside them: a camera chasing the
    // hand read as seasick.
    const FOCUS = {
        part: () => ({ x: 150, y: 200, w: 580, h: 300 }),
        vision: () => ({ x: 96, y: 206, w: 340, h: 280 }),
        touch: () => ({ x: 500, y: 250, w: 300, h: 250 }),
        tester: () => ({ x: 580, y: 0, w: 330, h: 486 }),
        brain: () => ({ x: 100, y: 460, w: 250, h: 150 }),
        reset: () => ({ x: 110, y: 380, w: 790, h: 230 }),
    };
    const WHOLE = { x: 40, y: 0, w: 930, h: 612 }, WHOLE_NARROW = { x: 90, y: 60, w: 830, h: 560 };
    let W = 1, H = 1, focus = null;
    const cam = { x: 0, y: 0, s: 1, vx: 0, vy: 0, vs: 0 };
    const region = () => {
        const pad = narrow.matches ? 18 : 36;
        let left = pad;
        if (!narrow.matches) left = Math.max(pad, Math.min(listRight + 28, W * 0.5));
        return { x: left, y: pad, w: Math.max(80, W - left - pad), h: Math.max(80, H - 2 * pad) };
    };
    let area = { x: 0, y: 0, w: 1, h: 1 }, listRight = 0;
    // how far right the list reaches once it has settled, read before
    // any size animation starts
    const reach = (rects) => {
        const left = stage.getBoundingClientRect().left;
        listRight = 0;
        for (const r of rects) listRight = Math.max(listRight, r.right - left);
    };
    const aim = () => {
        const r = focus ? FOCUS[focus]() : narrow.matches ? WHOLE_NARROW : WHOLE;
        const s = Math.min(area.w / r.w, area.h / r.h, focus ? 2.1 : 1.6);
        return { s, x: area.x + area.w / 2 - (r.x + r.w / 2) * s, y: area.y + area.h / 2 - (r.y + r.h / 2) * s };
    };
    const place = () => setT(scene, `translate(${f(cam.x)} ${f(cam.y)}) scale(${cam.s.toFixed(4)})`);
    const snap = () => { const a = aim(); cam.x = a.x; cam.y = a.y; cam.s = a.s; cam.vx = cam.vy = cam.vs = 0; place(); };
    // a spring with a little give, the way the cards move
    const follow = (dt) => {
        const a = aim(), k = 90, d = 17;
        for (const [p, v] of [['x', 'vx'], ['y', 'vy'], ['s', 'vs']]) {
            cam[v] += ((a[p] - cam[p]) * k - cam[v] * d) * dt;
            cam[p] += cam[v] * dt;
        }
        place();
    };
    const measure = () => {
        const r = stage.getBoundingClientRect();
        W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        // mid-spring the items are between sizes; read them once they land
        const running = items.flatMap((li) => (li.getAnimations ? li.getAnimations() : []));
        if (running.length) { Promise.all(running.map((a) => a.finished)).then(() => { measure(); snap(); }, () => {}); return; }
        reach(items.map((li) => li.getBoundingClientRect()));
        area = region();
    };

    // ------------------------------------------------------------------
    // One clock, only while the robot is on screen.
    let raf = 0, last = 0, clock = 1.4, seen = false;
    const frame = (now) => {
        raf = 0;
        if (document.hidden || reduced || !seen) { last = 0; return; }
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        clock += dt;
        draw(clock);
        follow(dt);
        raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduced && seen && !document.hidden) raf = requestAnimationFrame(frame); };
    const still = () => { draw(5.4); snap(); };
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            for (const e of entries) seen = e.isIntersecting;
            wake();
        }, { rootMargin: '80px 0px' }).observe(stage);
    } else seen = true;
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
    motion.addEventListener('change', () => {
        reduced = motion.matches;
        cancelAnimationFrame(raf); raf = last = 0;
        if (reduced) still(); else wake();
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); snap(); }).observe(stage);

    // ------------------------------------------------------------------
    // The list. A pill opens into its card; the others stay pills. The
    // item's box is sprung from its old size to its new one, so the rest
    // of the list moves out of the way instead of jumping.
    const spring = (() => {
        const pts = [];
        const k = 200, c = 30;
        let x = 0, v = 0;
        for (let i = 0; i <= 60; i++) {
            pts.push(x.toFixed(4));
            for (let j = 0; j < 12; j++) { const dt = 0.7 / 720; v += (k * (1 - x) - c * v) * dt; x += v * dt; }
        }
        pts[pts.length - 1] = '1';
        const e = `linear(${pts.join(', ')})`;
        return window.CSS && CSS.supports && CSS.supports('transition-timing-function', e) ? e : 'cubic-bezier(.2, .9, .25, 1.02)';
    })();
    const pills = items.map((li) => li.querySelector('.meet__pill'));
    const cards = items.map((li) => li.querySelector('.meet__card'));
    const prev = q('.meet__prev'), next = q('.meet__next'), close = q('.meet__close');
    let active = -1, steering = 0;

    const morph = (change) => {
        // read the sizes on screen first, so a quick second click springs
        // on from where the first one got to
        const before = items.map((li) => li.getBoundingClientRect());
        items.forEach((li) => li.getAnimations && li.getAnimations().forEach((x) => x.cancel()));
        change();
        const after = items.map((li) => li.getBoundingClientRect());
        reach(after);
        if (reduced || narrow.matches || !items[0].animate) return;
        items.forEach((li, i) => {
            const a = before[i], b = after[i];
            if (Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1) return;
            li.animate([{ width: `${a.width}px`, height: `${a.height}px` }, { width: `${b.width}px`, height: `${b.height}px` }],
                { duration: 700, easing: spring });
        });
    };
    const centre = (i, smooth = true) => {
        const li = items[i];
        if (!li || !narrow.matches) return;
        steering = performance.now() + 700;
        const at = li.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
        list.scrollTo({ left: at - (list.clientWidth - li.offsetWidth) / 2, behavior: smooth && !reduced ? 'smooth' : 'auto' });
    };
    const select = (i, { moveFocus = false, scroll = true } = {}) => {
        i = i < 0 ? -1 : clamp(i, 0, items.length - 1);
        if (i === active) return;
        morph(() => {
            active = i;
            items.forEach((li, k) => {
                li.classList.toggle('is-on', k === i);
                if (pills[k]) pills[k].setAttribute('aria-expanded', String(k === i));
            });
            if (i < 0) { delete root.dataset.open; delete root.dataset.focus; }
            else { root.dataset.open = ''; root.dataset.focus = items[i].dataset.key; }
        });
        focus = i < 0 ? null : items[i].dataset.key;
        area = region();
        if (prev) prev.disabled = i <= 0;
        if (next) next.disabled = i < 0 || i >= items.length - 1;
        if (reduced || !seen) snap(); else wake();
        if (i >= 0 && scroll) requestAnimationFrame(() => centre(i));
        if (moveFocus && i >= 0 && cards[i]) cards[i].focus({ preventScroll: true });
        // on a phone the card opens under the drawing; bring all of it into view
        if (moveFocus && i >= 0 && narrow.matches) {
            const low = list.getBoundingClientRect().bottom - innerHeight + 16;
            if (low > 0) scrollBy({ top: low, behavior: reduced ? 'auto' : 'smooth' });
        }
    };
    // a nav button that switches itself off must not take the focus with it
    const step = (d, btn) => {
        select(active + d);
        if (btn && btn.disabled && cards[active]) cards[active].focus({ preventScroll: true });
    };
    pills.forEach((b, i) => b && b.addEventListener('click', () => select(i, { moveFocus: true })));
    if (prev) prev.addEventListener('click', () => step(-1, prev));
    if (next) next.addEventListener('click', () => step(1, next));
    if (close) close.addEventListener('click', () => {
        const was = active;
        select(-1);
        if (pills[was]) pills[was].focus({ preventScroll: true });
    });
    root.addEventListener('keydown', (e) => {
        if (active < 0) return;
        if (e.key === 'Escape') { const was = active; select(-1); if (pills[was]) pills[was].focus({ preventScroll: true }); e.preventDefault(); }
        else if (e.target.closest('.meet__swatches')) return;
        else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { if (active < items.length - 1) select(active + 1, { moveFocus: true }); e.preventDefault(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { if (active > 0) select(active - 1, { moveFocus: true }); e.preventDefault(); }
    });
    // on a phone the open cards are a row you swipe; the one in the
    // middle is the one the camera shows
    let scrollRaf = 0;
    list.addEventListener('scroll', () => {
        if (!narrow.matches || active < 0 || scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
            scrollRaf = 0;
            if (performance.now() < steering) return;
            const mid = list.scrollLeft + list.clientWidth / 2;
            let best = active, dist = Infinity;
            const base = list.getBoundingClientRect().left - list.scrollLeft;
            items.forEach((li, k) => { const r = li.getBoundingClientRect(), d = Math.abs(r.left - base + r.width / 2 - mid); if (d < dist) { dist = d; best = k; } });
            if (best !== active) select(best, { scroll: false });
        });
    }, { passive: true });

    // swatches: a different part, the same moves
    const swatches = qa('.meet__swatch');
    const swname = q('.meet__swname');
    const pick = (b) => {
        shape = b.dataset.shape in SHAPES ? b.dataset.shape : 'three';
        half = SHAPES[shape];
        swatches.forEach((s) => { s.setAttribute('aria-checked', String(s === b)); s.tabIndex = s === b ? 0 : -1; });
        root.style.setProperty('--dot', b.style.getPropertyValue('--c'));
        if (swname) swname.textContent = b.dataset.name || '';
        for (const u of el.uses) { u.setAttribute('href', `#rb-p-${shape}`); }
        if (reduced || !seen) still();
    };
    swatches.forEach((b, i) => {
        b.tabIndex = i === 0 ? 0 : -1;
        b.addEventListener('click', () => pick(b));
        b.addEventListener('keydown', (e) => {
            const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
            if (!d) return;
            const to = swatches[(i + d + swatches.length) % swatches.length];
            pick(to); to.focus(); e.preventDefault();
        });
    });

    narrow.addEventListener('change', () => { items.forEach((li) => li.getAnimations && li.getAnimations().forEach((x) => x.cancel())); measure(); snap(); if (active >= 0) centre(active, false); });

    root.classList.add('is-live');
    if (prev) prev.disabled = true;
    if (next) next.disabled = true;
    measure();
    if (reduced) still(); else { draw(clock); snap(); }
})();
