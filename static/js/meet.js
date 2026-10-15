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
    // long swings: a gentler ease, so the arm never whips (peak speed 1.6x its average, not 3x)
    const swing = (t) => (1 - Math.cos(Math.PI * t)) / 2;
    const f = (n) => n.toFixed(2);

    // ------------------------------------------------------------------
    // The drawing: the same cell as /prototype/. Scene units are the
    // 1000 x 640 of the markup; the svg's own viewBox is the stage in CSS
    // pixels, so the camera is one translate and one scale on the scene.
    const el = {
        upper: q('.rb__upper'), fore: q('.rb__fore'), elbow: q('.rb__elbow'), wrist: q('.rb__wrist'),
        fl: q('.rb__finger--l'), fr: q('.rb__finger--r'), part: q('.rb__part'), harness: q('.rb__harness'),
        ring: q('.rb__ring'), puck: q('.rb__puck'), scan: q('.rb__scan'), lock: q('.rb__lock'),
        coneUp: q('.rb__cone--up'), coneDown: q('.rb__cone--down'), wring: q('.rb__wring'),
        tread: q('.rb__tread'), pulse: q('.rb__pulse'), cable: q('#rb-cable'), led: q('.rb__led'),
        run: q('.rb__lamp--run'), pass: q('.rb__lamp--pass'), fail: q('.rb__lamp--fail'), dock: q('.rb__dock'),
        checks: qa('.rb__check'), wires: qa('.rb__wire'), bars: qa('.rb__bar'),
        pallets: qa('.rb__pallet'), tote: q('.rb__tote'), carriage: q('.rb__carriage'), rod: q('.rb__rod'), clamp: q('.rb__clamp'),
        jl: q('.rb__jaw--l'), jr: q('.rb__jaw--r'), lifted: q('.rb__lifted'), slots: qa('.rb__slotunit'),
        uses: qa('.rb__part, .rb__nestplug, .rb__seatplug, .rb__liftplug, .rb__packplug'),
    };
    const SHAPES = { three: 22, six: 30, round: 16 };
    let shape = 'three', half = SHAPES.three;

    // the line: unload, work and queue stations, one pallet pitch apart
    const X = [250, 470, 690, 910], LINE = 452;
    const J = [600, 352], L = 140, DEG = 180 / Math.PI, HOLD = 78, T = 10;
    const HOME = [505, 250];
    const LOOK = [397, 300];                      // the wrist camera over the header
    const NEST = [X[1] + 36, LINE - 16 - HOLD];  // the plug waiting in its nest
    const ABOVE_NEST = [NEST[0], 300];
    const UPCAM = [536, 322];                    // the plug over the grip camera
    const ABOVE_SEAT = [X[1] - 22, 290], TOUCH = [X[1] - 22, 340], SEAT = [X[1] - 22, LINE - 26 - HOLD];
    const ABOVE_BIN = [852, 290], IN_BIN = [852, 330], OVER = [J[0], J[1] - 2 * L + 2];
    const ik = ([x, y]) => {
        const dx = x - J[0], dy = y - J[1];
        const d = clamp(Math.hypot(dx, dy), 1, 2 * L - 0.01);
        // the elbow stays up: on the bin's side of the shoulder it bends the other way, and the two meet
        // with the arm straight up, where the swing crosses over
        const a1 = Math.atan2(dy, dx) + (x > J[0] ? -1 : 1) * Math.acos(d / (2 * L));
        const ex = J[0] + L * Math.cos(a1), ey = J[1] + L * Math.sin(a1);
        return { a1, ex, ey, a2: Math.atan2(y - ey, x - ex) };
    };
    const line = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    const curve = (a, c, b, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; };
    const failedAt = (n) => ((n % 4) + 4) % 4 === 2;

    // where the wrist is at time t of the cycle
    const wristAt = (t, failed) => {
        if (t < 1.0) return HOME;
        if (t < 1.6) return line(HOME, LOOK, swing(seg(t, 1.0, 1.6)));
        if (t < 2.3) return LOOK;
        if (t < 2.75) return curve(LOOK, [470, 270], ABOVE_NEST, swing(seg(t, 2.3, 2.75)));
        if (t < 3.0) return line(ABOVE_NEST, NEST, inOut(seg(t, 2.75, 3.0)));
        if (t < 3.2) return NEST;
        if (t < 3.55) return line(NEST, ABOVE_NEST, inOut(seg(t, 3.2, 3.55)));
        if (t < 4.0) return line(ABOVE_NEST, UPCAM, inOut(seg(t, 3.55, 4.0)));
        if (t < 4.6) return UPCAM;
        if (t < 5.15) return curve(UPCAM, [470, 280], ABOVE_SEAT, swing(seg(t, 4.6, 5.15)));
        if (t < 5.55) return line(ABOVE_SEAT, TOUCH, out3(seg(t, 5.15, 5.55)));
        if (t < 5.75) return line(TOUCH, SEAT, inOut(seg(t, 5.55, 5.75)));
        if (t < 5.85) return SEAT;
        // the pull check: a short tug up, and back
        if (t < 6.1) return [SEAT[0], SEAT[1] - 3 * Math.sin(Math.PI * seg(t, 5.85, 6.1))];
        if (t < 7.0) return SEAT;
        if (!failed) {
            if (t < 7.25) return SEAT;
            return curve(SEAT, [SEAT[0], 240], HOME, swing(seg(t, 7.25, 8.2)));
        }
        // a reject: lift it off, swing over the shoulder to the locked bin, post it, swing back
        if (t < 7.25) return line(SEAT, ABOVE_SEAT, inOut(seg(t, 7.0, 7.25)));
        if (t < 7.85) return line(ABOVE_SEAT, OVER, swing(seg(t, 7.25, 7.85)));
        if (t < 8.45) return line(OVER, ABOVE_BIN, swing(seg(t, 7.85, 8.45)));
        if (t < 8.65) return line(ABOVE_BIN, IN_BIN, inOut(seg(t, 8.45, 8.65)));
        if (t < 8.8) return IN_BIN;
        if (t < 9.4) return line(IN_BIN, OVER, swing(seg(t, 8.8, 9.4)));
        return line(OVER, HOME, swing(seg(t, 9.4, 10)));
    };
    const closedAt = (t, failed) => (t < 3.0 ? 0 : t < 3.2 ? seg(t, 3.0, 3.2)
        : !failed ? (t < 7.0 ? 1 : 1 - seg(t, 7.0, 7.2)) : (t < 8.65 ? 1 : 1 - seg(t, 8.65, 8.8)));
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
        if (!cablePts) return [600, 470];
        const x = clamp(u) * (cablePts.length - 1), i = Math.floor(x), k = Math.min(i + 1, cablePts.length - 1);
        return line(cablePts[i], cablePts[k], x - i);
    };

    const setT = (node, v) => { if (node) node.setAttribute('transform', v); };
    const setOn = (node, on) => { if (node) node.classList.toggle('is-on', on); };
    const show = (node, v) => { if (node) node.style.opacity = v; };
    const brackets = (node, cx, cy, hw, hh, g) => {
        if (!node) return;
        const m = 8 + 12 * (1 - g), x0 = cx - hw - m, x1 = cx + hw + m, y0 = cy - hh - m, y1 = cy + hh + m, c = 9;
        node.setAttribute('d', `M${f(x0)} ${f(y0 + c)}V${f(y0)}H${f(x0 + c)}M${f(x1 - c)} ${f(y0)}H${f(x1)}V${f(y0 + c)}M${f(x1)} ${f(y1 - c)}V${f(y1)}H${f(x1 - c)}M${f(x0 + c)} ${f(y1)}H${f(x0)}V${f(y1 - c)}`);
    };
    // passed units packed before cycle n (unit n-1 is the one the gantry picks in cycle n)
    const packedBefore = (n) => { let p = 0; for (let k = 0; k < n - 1; k++) if (!failedAt(k)) p++; return p; };

    const draw = (time) => {
        const n = Math.floor(time / T), t = time - n * T;
        const failed = failedAt(n), prevFailed = failedAt(n - 1);

        // the arm
        const w = wristAt(t, failed);
        const { a1, ex, ey, a2 } = ik(w);
        setT(el.upper, `translate(${J[0]} ${J[1]}) rotate(${f(a1 * DEG)})`);
        setT(el.fore, `translate(${f(ex)} ${f(ey)}) rotate(${f(a2 * DEG)})`);
        setT(el.elbow, `translate(${f(ex)} ${f(ey)})`);
        setT(el.wrist, `translate(${f(w[0])} ${f(w[1])})`);
        const grip = lerp(half + 14, half + 5, closedAt(t, failed));
        setT(el.fl, `translate(${f(-grip)} 0)`);
        setT(el.fr, `translate(${f(grip)} 0)`);

        // the line: every pallet moves one station left at the start of the cycle
        const idx = inOut(seg(t, 0, 1));
        if (el.tread) el.tread.style.strokeDashoffset = f(-lerp(0, 220, idx) - n * 220);
        el.pallets.forEach((pg, id) => {
            const j = ((id - n) % 4 + 4) % 4;          // the station this pallet indexes into this cycle
            const from = X[j + 1] ?? X[3], x = j === 3 ? X[3] : lerp(from, X[j], idx);
            let y = LINE, op = 1;
            const board = pg.querySelector('.rb__unitboard'), nest = pg.querySelector('.rb__nestplug'), seat = pg.querySelector('.rb__seatplug');
            let bOp = 1, nOp = 1, sOp = 0;
            if (j === 3) { op = 0; }                                       // down the return lift, out of sight
            else if (j === 2) { op = t < 1 ? seg(t, 0, 0.6) : 1; }         // the next pallet comes up loaded
            else if (j === 1) { nOp = t < 3.2 ? 1 : 0; sOp = !failed && t >= 7.0 ? 1 : 0; }   // its plug leaves the nest with the arm, and comes back seated
            else {                                                          // unload: the last unit leaves the line
                nOp = 0; sOp = prevFailed ? 0 : 1;
                if (!prevFailed) {
                    if (t > 2.05) { bOp = 0; sOp = 0; }                    // in the gantry's clamp now
                    const d = seg(t, 4.0, 4.6); y = LINE + 40 * inOut(d); op = 1 - d;
                } else { const d = seg(t, 2.0, 2.8); y = LINE + 40 * inOut(d); op = 1 - d; }
            }
            setT(pg, `translate(${f(x)} ${f(y)})`);
            pg.style.opacity = f(op);
            show(board, bOp); show(nest, nOp); show(seat, sOp);
        });

        // the gantry packs the last passed unit into the tote
        const slot = packedBefore(n) % 2, slotX = [128, 174][slot];
        let cx = 227, rod = 60, open = 1, carried = 0, lx = 227, ly = 440, rot = 0;
        if (!prevFailed) {
            if (t < 1.2) cx = 227;
            const down1 = seg(t, 1.4, 1.85), up1 = seg(t, 2.1, 2.5), across = seg(t, 2.5, 3.2), down2 = seg(t, 3.2, 3.55), up2 = seg(t, 3.7, 4.0);
            cx = across > 0 ? lerp(227, slotX, inOut(across)) : 227;
            if (t >= 4.0) cx = lerp(slotX, 227, inOut(seg(t, 4.0, 4.8)));
            rod = 60 + 182 * inOut(down1) - 182 * inOut(up1) + 173 * inOut(down2) - 173 * inOut(up2);
            open = t < 1.85 ? 1 : t < 2.05 ? 1 - seg(t, 1.85, 2.05) : t < 3.55 ? 0 : seg(t, 3.55, 3.7);
            carried = t > 2.05 && t < 3.6 ? 1 : 0;
            rot = -90 * inOut(across);
            lx = cx; ly = 168 + rod + 30;
        }
        setT(el.carriage, `translate(${f(cx)} 0)`);
        if (el.rod) el.rod.setAttribute('height', f(rod));
        setT(el.clamp, `translate(0 ${f(168 + rod)})`);
        const jaw = lerp(37, 44, open);
        setT(el.jl, `translate(${f(-jaw)} 0)`);
        setT(el.jr, `translate(${f(jaw)} 0)`);
        if (el.lifted) {
            // the board hangs in the clamp by its ends; on edge for the tote
            setT(el.lifted, `translate(${f(lx)} ${f(ly)}) rotate(${f(rot)})`);
            el.lifted.style.opacity = carried;
        }
        // a full tote slides off the bench end and an empty one slides in before the next pack
        let filled = slot + (!prevFailed && t >= 3.6 ? 1 : 0), toteX = 0, toteOp = 1;
        if (slot === 0 && packedBefore(n) > 0 && t < 1.2) {
            if (t < 0.6) { filled = 2; toteX = -150 * inOut(seg(t, 0, 0.6)); toteOp = 1 - seg(t, 0.3, 0.6); }
            else { toteX = -150 * (1 - inOut(seg(t, 0.6, 1.2))); toteOp = seg(t, 0.6, 0.9); }
        }
        el.slots.forEach((s, i) => { s.style.opacity = i < filled ? 1 : 0; });
        setT(el.tote, `translate(${f(toteX)} 0)`);
        if (el.tote) el.tote.style.opacity = f(toteOp);

        // the plug: in its nest, in the fingers, seated, or posted into the bin
        let p = [X[1] + 36, LINE - 16], pOp = 0;
        if (t >= 3.0 && t < 3.2) pOp = 0;
        if (t >= 3.2) { p = [w[0], w[1] + HOLD]; pOp = 1; }
        // a passed plug stays seated on its pallet and rides out with it
        if (!failed && t >= 7.0) { p = [SEAT[0], SEAT[1] + HOLD]; pOp = 0; }
        if (failed && t >= 8.65) { p = [IN_BIN[0], lerp(IN_BIN[1] + HOLD, 470, seg(t, 8.65, 8.85) ** 2)]; pOp = 1 - seg(t, 8.73, 8.85); }
        if (t < 1 && n > 0 && !failedAt(n - 1)) pOp = 0;
        setT(el.part, `translate(${f(p[0])} ${f(p[1])})`);
        show(el.part, pOp);
        // the harness runs from the plug to the pallet's adapter, until the plug is posted
        if (el.harness) {
            const a = t < 3.2 ? [X[1] + 36, LINE - 22] : [p[0], p[1] - 8], b = [X[1] + 69, LINE - 19];
            const sag = Math.max(16, 60 - Math.abs(b[0] - a[0]) * 0.1);
            el.harness.setAttribute('d', `M${f(a[0])} ${f(a[1])} C ${f(a[0] + 18)} ${f(a[1] + sag)}, ${f(b[0] - 8)} ${f(b[1] + sag * 0.6)}, ${f(b[0])} ${f(b[1])}`);
            el.harness.style.opacity = t < 1 ? seg(t, 0.2, 1) : failed && t > 7.25 ? 1 - seg(t, 7.25, 7.5) : 1;
        }

        // vision: the wrist camera measures the header, then the grip camera measures the plug in the fingers
        const look = seg(t, 1.6, 2.3), lit = look > 0 && look < 1;
        setOn(el.wring, lit);
        if (el.coneDown) {
            const cxw = w[0] + 51, top = w[1] + 30;
            el.coneDown.setAttribute('d', `M${f(cxw - 10)} ${f(top)} L${f(cxw - 40)} 428 H${f(cxw + 40)} L${f(cxw + 10)} ${f(top)} Z`);
            el.coneDown.style.opacity = lit ? f(0.08 * Math.sin(look * Math.PI)) : 0;
        }
        const up = seg(t, 4.0, 4.6), upLit = up > 0 && up < 1;
        if (el.coneUp) {
            el.coneUp.setAttribute('d', `M528 432 L${f(UPCAM[0] - 34)} ${f(UPCAM[1] + HOLD)} H${f(UPCAM[0] + 34)} L544 432 Z`);
            el.coneUp.style.opacity = upLit ? 0.07 : 0;
        }
        if (el.scan) {
            if (lit) { const y = lerp(300, 422, look); el.scan.setAttribute('d', `M${f(X[1] - 64)} ${f(y)} H${f(X[1] + 20)}`); el.scan.style.opacity = Math.sin(look * Math.PI); }
            else if (upLit) { const y = lerp(430, UPCAM[1] + HOLD - 30, up); el.scan.setAttribute('d', `M${f(UPCAM[0] - 30)} ${f(y)} H${f(UPCAM[0] + 30)}`); el.scan.style.opacity = Math.sin(up * Math.PI); }
            else el.scan.style.opacity = 0;
        }
        if (el.lock) {
            if (t > 2.0 && t < 2.5) { brackets(el.lock, X[1] - 22, 423, 24, 6, out3(seg(t, 2.0, 2.2))); el.lock.style.opacity = out3(seg(t, 2.0, 2.2)) * (1 - seg(t, 2.35, 2.5)); }
            else if (t > 4.3 && t < 4.7) { brackets(el.lock, UPCAM[0], UPCAM[1] + HOLD - 15, half, 15, out3(seg(t, 4.3, 4.5))); el.lock.style.opacity = out3(seg(t, 4.3, 4.5)) * (1 - seg(t, 4.55, 4.7)); }
            else el.lock.style.opacity = 0;
        }

        // touch: a ring off the wrist when the plug meets the header, as it latches, and at the pull
        if (el.ring) {
            const u = Math.max(pulse(t, 5.52), pulse(t, 5.74), pulse(t, 5.92));
            el.ring.setAttribute('r', u < 0 ? 14 : f(14 + 40 * out3(u)));
            el.ring.style.opacity = u < 0 ? 0 : f(1 - u);
        }
        setOn(el.puck, t > 5.5 && t < 6.1);

        // the tester docks to the pallet's adapter: seated, held, then every wire
        const docked = t > 6.1 && t < 7.0 ? 1 : 0, dock = inOut(seg(t, 6.1, 6.3)) * (1 - inOut(seg(t, 7.0, 7.2)));
        setT(el.dock, `translate(${f(-6 * dock)} 0)`);
        setOn(el.run, docked && Math.sin(t * 22) > -0.2);
        const on = [t > 6.3, t > 6.45, t > 6.95].map((v) => v && t < 8.8);
        el.checks.forEach((c, i) => {
            const bad = i === 2 && failed;
            c.classList.toggle('is-ok', on[i] && !bad);
            c.classList.toggle('is-bad', on[i] && bad);
        });
        el.wires.forEach((wv, i) => {
            const at = t > 6.5 + i * 0.07 && t < 8.8, bad = failed && i === 2;
            wv.classList.toggle('is-ok', at && !bad);
            wv.classList.toggle('is-bad', at && bad);
        });
        setOn(el.pass, t > 6.95 && t < 8.8 && !failed);
        setOn(el.fail, t > 6.95 && t < 8.8 && failed);

        // the brain: the unit's record runs down the wire and one more bar lights
        if (el.pulse) {
            const u = seg(t, 7.0, 7.9), at = onCable(u);
            el.pulse.setAttribute('cx', f(at[0]));
            el.pulse.setAttribute('cy', f(at[1]));
            el.pulse.style.opacity = u > 0 && u < 1 ? 1 : 0;
        }
        const lit2 = 2 + (n % (el.bars.length - 2)) + (t > 7.9 ? 1 : 0);
        el.bars.forEach((b, i) => b.classList.toggle('is-lit', i < Math.max(1, lit2)));
        setOn(el.led, t > 7.85 && t < 8.2);
    };

    // ------------------------------------------------------------------
    // The camera. Each part has the patch of the scene it lives in. They
    // stay put while the robot works inside them: a camera chasing the
    // hand read as seasick.
    const FOCUS = {
        part: () => ({ x: 350, y: 330, w: 310, h: 150 }),
        vision: () => ({ x: 360, y: 220, w: 240, h: 260 }),
        touch: () => ({ x: 360, y: 240, w: 230, h: 230 }),
        tester: () => ({ x: 440, y: 70, w: 500, h: 400 }),
        brain: () => ({ x: 120, y: 470, w: 280, h: 140 }),
        reset: () => ({ x: 50, y: 120, w: 900, h: 370 }),
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
        const left = root.getBoundingClientRect().left;
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
        // layout size, not the drawn rect: the stage may be mid-rise (scaled) on home
        W = Math.max(1, stage.clientWidth); H = Math.max(1, stage.clientHeight);
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
    const still = () => { draw(6.6); snap(); };
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
