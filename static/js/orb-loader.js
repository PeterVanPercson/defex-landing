(() => {
    // The prototype opens on the thinking orb from the "AI thinking orb and
    // input" component Husan sent (2026-10-04): only its dotted orb, its four
    // thinking lights and their dots assembling, with "Loading" under it.
    // When the simulation is ready (the page's own script hides #loading, as
    // it also does when the simulation fails) the screen simply fades away:
    // none of the component's green resolve, input pill or answer card.
    // The orb is that component's renderer, ported as it was. With Reduce
    // Motion the orb holds one still frame. Without script there is no screen.
    const CANVAS = 220, ORB_R = 66, RINGS = 16, TAU = Math.PI * 2;
    const MIN_MS = 1600, MAX_MS = 15000, LIGHT_MS = 1150;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    function cubicBezier(x1, y1, x2, y2) {
        const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
        const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        const sx = (t) => ((ax * t + bx) * t + cx) * t;
        const sy = (t) => ((ay * t + by) * t + cy) * t;
        const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
        const solve = (x) => {
            let t = x;
            for (let i = 0; i < 8; i++) {
                const e = sx(t) - x;
                if (Math.abs(e) < 1e-6) return t;
                const d = dx(t);
                if (Math.abs(d) < 1e-6) break;
                t -= e / d;
            }
            let lo = 0, hi = 1;
            t = x;
            for (let i = 0; i < 40; i++) {
                const e = sx(t);
                if (Math.abs(e - x) < 1e-6) break;
                if (x > e) lo = t; else hi = t;
                t = (hi - lo) / 2 + lo;
            }
            return t;
        };
        return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
    }
    const easeOut = cubicBezier(0.22, 1, 0.36, 1);
    const easeInOut = cubicBezier(0.65, 0, 0.35, 1);

    // the sphere of dots, seeded as the component seeds it
    function mulberry32(a) {
        return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    const rand = mulberry32(7);
    const dots = [];
    for (let k = 0; k < RINGS; k++) {
        const y = 1 - ((k + 0.5) / RINGS) * 2;
        const r = Math.sqrt(1 - y * y);
        const m = Math.max(4, Math.round(30 * r));
        for (let j = 0; j < m; j++) {
            const a = (j / m) * TAU + k * 0.35;
            dots.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, u: (1 - y) / 2, seed: rand() * 6.283 });
        }
    }
    const N = dots.length;
    const DX = Float32Array.from(dots, (d) => d.x), DY = Float32Array.from(dots, (d) => d.y);
    const DZ = Float32Array.from(dots, (d) => d.z), DU = Float32Array.from(dots, (d) => d.u);
    const DS = Float32Array.from(dots, (d) => d.seed);
    const A_STEPS = 48;
    const COLORS = Array.from({ length: A_STEPS + 1 }, (_, i) => `rgba(235,235,235,${(i / A_STEPS).toFixed(3)})`);

    // the screen
    const root = document.createElement('div');
    root.className = 'orbload';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-label', 'Loading the simulation');
    const inner = document.createElement('div');
    inner.className = 'orbload__in';
    const canvas = document.createElement('canvas');
    canvas.className = 'orbload__orb';
    canvas.setAttribute('aria-hidden', 'true');
    const label = document.createElement('p');
    label.className = 'orbload__label';
    label.innerHTML = 'Loading<span class="orbload__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
    inner.append(canvas, label);
    root.append(inner);
    document.documentElement.classList.add('is-orbloading');
    (document.body || document.documentElement).appendChild(root);

    const ctx = canvas.getContext && canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(CANVAS * dpr);
    canvas.height = Math.round(CANVAS * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const P = { k: 0, alpha: 0, spin: 0, rot: 0, pop: 1, prog: 0 };
    const lit = new Float32Array(N);
    const SX = new Float32Array(N), SY = new Float32Array(N), SR = new Float32Array(N), SD = new Float32Array(N);
    const SC = new Int16Array(N);
    const pw = [1, 0, 0, 0];
    const S = 0.6, CP = Math.cos(0.35), SP = Math.sin(0.35), C0 = CANVAS / 2;
    let time = still ? 1.2 : 0;

    function draw(dt) {
        ctx.clearRect(0, 0, CANVAS, CANVAS);
        time += dt;
        P.rot += P.spin * dt;
        const cyw = Math.cos(P.rot), syw = Math.sin(P.rot);
        const stepW = dt / 0.35;
        for (let q = 0; q < 4; q++) {
            const d = (q === P.prog ? 1 : 0) - pw[q];
            pw[q] += Math.abs(d) <= stepW ? d : d > 0 ? stepW : -stepW;
        }
        const decay = Math.exp(-dt / 0.5);
        const h0 = (time * 300) % N, h3 = (time * 480) % N;
        const a1 = time * 0.8, b1 = Math.sin(time * 0.5) * 0.9;
        const f1x = Math.cos(b1) * Math.cos(a1), f1y = Math.sin(b1), f1z = Math.cos(b1) * Math.sin(a1);
        const a2 = time * 0.55 + 2.1, b2 = Math.cos(time * 0.42) * 0.9;
        const f2x = Math.cos(b2) * Math.cos(a2), f2y = Math.sin(b2), f2z = Math.cos(b2) * Math.sin(a2);
        const lat = Math.sin(time * 2.2);

        for (let n = 0; n < N; n++) {
            const dx = DX[n], dy = DY[n], dz = DZ[n], u = DU[n];
            // the four thinking lights: dots are lit in turn
            let pulse = 0;
            if (pw[0] > 0.001) {
                let dd = Math.abs(n - h0); if (dd > N - dd) dd = N - dd;
                const v = Math.max(0, 1 - dd / 16);
                pulse = Math.max(pulse, v * v * pw[0]);
            }
            if (pw[1] > 0.001) {
                const v1 = Math.max(0, (dx * f1x + dy * f1y + dz * f1z - 0.72) / 0.28);
                const v2 = Math.max(0, (dx * f2x + dy * f2y + dz * f2z - 0.72) / 0.28);
                const v = Math.max(v1, v2);
                pulse = Math.max(pulse, v * v * pw[1]);
            }
            if (pw[2] > 0.001) {
                const e = dy - lat;
                const v = Math.max(0, 1 - (e * e) / 0.02);
                pulse = Math.max(pulse, v * v * pw[2]);
            }
            if (pw[3] > 0.001) {
                let dd = Math.abs(n - h3); if (dd > N - dd) dd = N - dd;
                const v = Math.max(0, 1 - dd / 22);
                pulse = Math.max(pulse, v * v * pw[3]);
            }
            const l = Math.max(lit[n] * decay, pulse);
            lit[n] = l;

            // top dots arrive first
            const ki = clamp01(P.k * (1 + S) - S * u);
            if (ki <= 0.001) { SC[n] = -1; continue; }
            const eo = easeOut(ki), kk = eo * P.pop;
            const x1 = dx * cyw + dz * syw, z1 = -dx * syw + dz * cyw;
            const y2 = dy * CP - z1 * SP, z2 = dy * SP + z1 * CP;
            const f = 2.8 / (2.8 - z2), depth = (z2 + 1) / 2;
            let a = 0.1 + 0.035 * Math.sin(DS[n] + time * 1.6) + 0.32 * depth * depth + 0.75 * l;
            if (a > 1) a = 1;
            a *= eo * P.alpha;
            SX[n] = C0 + x1 * ORB_R * kk * f;
            SY[n] = C0 - y2 * ORB_R * kk * f;
            SD[n] = depth;
            SR[n] = (1.15 * (0.45 + 0.75 * depth) * f + 0.9 * l) * (0.4 + 0.6 * eo);
            const ai = Math.round(a * A_STEPS);
            SC[n] = ai <= 0 ? -1 : ai;
        }
        // back half first, then the front half
        for (let pass = 0; pass < 2; pass++) {
            for (let n = 0; n < N; n++) {
                const c = SC[n];
                if (c < 0 || (SD[n] >= 0.5) !== (pass === 1)) continue;
                ctx.fillStyle = COLORS[c];
                ctx.beginPath();
                ctx.arc(SX[n], SY[n], SR[n], 0, TAU);
                ctx.fill();
            }
        }
    }

    // the dots assembling, as the component's "assemble" step does it
    function assemble(t) {
        const p = clamp01(t / 800), e = easeOut(p);
        P.k = e; P.alpha = e; P.spin = 0.9 * e;
        P.pop = t < 420 ? 1 + 0.05 * easeOut(clamp01(t / 420)) : 1.05 - 0.05 * easeInOut(clamp01((t - 420) / 380));
        const s = easeOut(clamp01((t - 300) / 320));
        label.style.opacity = s.toFixed(3);
        label.style.transform = s >= 1 ? 'none' : `translateY(${(6 * (1 - s)).toFixed(2)}px)`;
    }

    const born = performance.now();
    let last = born, frame = 0, gone = false, lights = 0;
    function tick(now) {
        frame = 0;
        if (gone) return;
        const dt = still ? 0 : Math.max(0, Math.min(0.05, (now - last) / 1000));
        last = now;
        if (still) assemble(800); else assemble(now - born);
        if (ctx) draw(dt);
        if (!still) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    if (!still) lights = setInterval(() => { P.prog = (P.prog + 1) % 4; }, LIGHT_MS);

    // and away, once the simulation is ready (or has failed, which hides
    // #loading too), but never before the orb has had its moment
    function leave() {
        if (gone || root.classList.contains('is-done')) return;
        const wait = Math.max(0, MIN_MS - (performance.now() - born));
        setTimeout(() => {
            root.classList.add('is-done');
            document.documentElement.classList.remove('is-orbloading');
            const end = () => {
                gone = true;
                clearInterval(lights);
                if (frame) cancelAnimationFrame(frame);
                root.remove();
            };
            root.addEventListener('transitionend', end, { once: true });
            setTimeout(end, 900);
        }, wait);
    }
    setTimeout(leave, MAX_MS);
    function watch() {
        const sim = document.getElementById('loading');
        if (!sim || sim.hidden) { leave(); return; }
        new MutationObserver(() => { if (sim.hidden) leave(); }).observe(sim, { attributes: true, attributeFilter: ['hidden'] });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, { once: true });
    else watch();
})();
