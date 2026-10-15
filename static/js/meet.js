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
    const swing = (t) => (1 - Math.cos(Math.PI * t)) / 2;
    const el = {
        upper: q('.rb__upper'), fore: q('.rb__fore'), elbow: q('.rb__elbow'), wrist: q('.rb__wrist'),
        fl: q('.rb__finger--l'), fr: q('.rb__finger--r'), part: q('.rb__part'),
        ring: q('.rb__ring'), puck: q('.rb__puck'), scan: q('.rb__scan'), lock: q('.rb__lock'),
        coneUp: q('.rb__cone--up'), coneDown: q('.rb__cone--down'),
        tread: q('.rb__tread'), pulse: q('.rb__pulse'), cable: q('#rb-cable'), led: q('.rb__led'),
        run: q('.rb__lamp--run'), pass: q('.rb__lamp--pass'), fail: q('.rb__lamp--fail'),
        dock: q('.rb__dock'), dockCable: q('#rb-dockcable'), lid: q('.rb__lid'), padlock: q('.rb__padlock'),
        checks: qa('.rb__check').map((c) => ({ c, y: +c.querySelector('circle').getAttribute('cy') })), mark: q('.rb__mark'),
        bars: qa('.rb__bar'), packed: qa('.rb__packed'), cap: q('.rb__cap'),
        car: q('.rb__car'), rod: q('.rb__rod'), clamp: q('.rb__clamp'),
        pallets: qa('.rb__pallet').map((g) => ({ g, plate: g.querySelector('.rb__plate'), board: g.querySelector('.rb__board'), header: g.querySelector('.rb__header'), plug: g.querySelector('.rb__plug') })),
        uses: qa('.rb__part, .rb__plug'),
    };
    const SHAPES = { three: 22, six: 30, round: 16 }, TALL = { three: 30, six: 30, round: 32 };
    let shape = 'three', half = SHAPES.three, tall = TALL.three;

    // the line: in, work and out stations; on a pallet the header sits left
    // of centre and the plug waits on the raised end
    const T = 8, LINE = 452, ST = [210, 450, 680], HX = -28, NX = 53;
    const J = [470, 150], L = 165, DEG = 180 / Math.PI, HOLD = 80;
    const HOME = [490, 290], LOOK = [ST[1] + HX + 51, 300], NEST = [ST[1] + NX, LINE - 34 - HOLD], ABOVE_NEST = [ST[1] + NX, 300];
    const PRESENT = [322, 300], ABOVE_SEAT = [ST[1] + HX, 290], CONTACT = [ST[1] + HX, 324], SEAT = [ST[1] + HX, 329];
    const VIA = [484, 149], SLOT = [650, 330];
    const ik = ([x, y]) => {
        const dx = x - J[0], dy = y - J[1];
        const d = clamp(Math.hypot(dx, dy), 1, 2 * L - 0.01);
        const a1 = Math.atan2(dy, dx) + Math.acos(d / (2 * L));
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
        if (t < 1.7) return LOOK;
        if (t < 2.05) return line(LOOK, NEST, inOut(seg(t, 1.7, 2.05)));
        if (t < 2.35) return NEST;
        if (t < 2.52) return line(NEST, ABOVE_NEST, inOut(seg(t, 2.35, 2.52)));
        if (t < 3.0) return line(ABOVE_NEST, PRESENT, swing(seg(t, 2.5, 3.0)));
        if (t < 3.3) return PRESENT;
        if (t < 4.2) return curve(PRESENT, [372, 272], ABOVE_SEAT, swing(seg(t, 3.3, 4.2)));
        if (t < 4.6) return line(ABOVE_SEAT, CONTACT, out3(seg(t, 4.2, 4.6)));
        if (t < 4.8) return line(CONTACT, SEAT, inOut(seg(t, 4.6, 4.8)));
        // the pull: a short tug up, and back
        if (t < 5.1) return [SEAT[0], SEAT[1] - 6 * Math.sin(Math.PI * seg(t, 4.9, 5.1))];
        if (!failed) {
            if (t < 6.2) return SEAT;
            if (t < 7.0) return curve(SEAT, VIA, HOME, swing(seg(t, 6.2, 7.0)));
            return HOME;
        }
        // a reject: pull the plug off, post it through the slot, go home
        if (t < 6.25) return SEAT;
        if (t < 6.45) return line(SEAT, ABOVE_SEAT, inOut(seg(t, 6.25, 6.45)));
        if (t < 7.0) return curve(ABOVE_SEAT, [540, 270], SLOT, swing(seg(t, 6.45, 7.0)));
        if (t < 7.4) return SLOT;
        return line(SLOT, HOME, swing(seg(t, 7.4, 8.0)));
    };
    const closedAt = (t, failed) => {
        if (t < 2.1) return 0;
        if (t < 2.3) return seg(t, 2.1, 2.3);
        if (t < 6.1) return 1;
        if (!failed) return 1 - seg(t, 6.1, 6.2);
        if (t < 6.25) return 1 - 0.5 * Math.sin(Math.PI * seg(t, 6.1, 6.25));
        return t < 7.0 ? 1 : 1 - seg(t, 7.0, 7.12);
    };
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
    // a shape at opacity 0 leaves the drawing altogether
    const show = (node, v) => { if (!node) return; node.style.opacity = f(v); node.style.display = v > 0.001 ? '' : 'none'; };
    const box = (node, x, y, w, h, rx) => {
        if (!node) return;
        node.setAttribute('x', f(x)); node.setAttribute('y', f(y)); node.setAttribute('width', f(w)); node.setAttribute('height', f(Math.max(0, h)));
        if (rx !== undefined) node.setAttribute('rx', f(rx));
    };
    const brackets = (node, cx, cy, hw, hh, g) => {
        if (!node) return;
        const m = 8 + 14 * (1 - g), x0 = cx - hw - m, x1 = cx + hw + m, y0 = cy - hh - m, y1 = cy + hh + m, c = 9;
        node.setAttribute('d', `M${f(x0)} ${f(y0 + c)}V${f(y0)}H${f(x0 + c)}M${f(x1 - c)} ${f(y0)}H${f(x1)}V${f(y0 + c)}M${f(x1)} ${f(y1 - c)}V${f(y1)}H${f(x1 - c)}M${f(x0 + c)} ${f(y1)}H${f(x0)}V${f(y1 - c)}`);
    };
    const TICK = (y) => `M722 ${y} l4 4 l8 -8`, CROSS = (y) => `M724 ${y - 4} l8 8 M732 ${y - 4} l-8 8`;

    // the packer's stops: parked over the out station's header, and the three places in the tote
    const PARK = ST[2] + HX, UP = 166, CARRY = 371, DROP = 405, TOTE = [796, 822, 848], FLOOR = 467.5;

    // Which cycles reject is settled once per cycle, so opening Touch in
    // the middle of one never makes the arm jump. While Touch or Vision is
    // open the line runs good units, so the arm stays in their frames.
    const line$ = { n: null, fail: false, prev: false, count: 0 };
    const decide = (n) => failedAt(n) && focus !== 'touch' && focus !== 'vision';
    const settle = (n) => {
        if (line$.n === n) return;
        if (line$.n !== null && n === line$.n + 1) {
            line$.count = (line$.count + (line$.prev ? 0 : 1)) % 3;
            line$.prev = line$.fail;
        } else {
            let c = 0;
            for (let k = -1; k <= n - 2; k++) if (!failedAt(k)) c = (c + 1) % 3;
            line$.count = c;
            line$.prev = failedAt(n - 1);
        }
        line$.fail = decide(n);
        line$.n = n;
    };

    const draw = (time) => {
        const n = Math.floor(time / T), t = time - n * T;
        settle(n);
        const failed = line$.fail, prevFailed = line$.prev, count = line$.count;

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

        // the line indexes one station at the start of every cycle
        const idx = out3(seg(t, 0, 1));
        if (el.tread) el.tread.style.strokeDashoffset = f(-lerp(0, 240, idx) - n * 240);

        // the packer: down onto the unit at the out station, turn it on edge, into the tote
        const packing = !prevFailed, slotX = TOTE[count];
        let px = PARK, cb = UP;
        if (packing) {
            const top = LINE - 43 - tall;
            if (t < 1.3) cb = lerp(UP, top, inOut(seg(t, 0.1, 1.3)));
            else if (t < 1.45) cb = top;
            else if (t < 2.2) cb = lerp(top, CARRY, inOut(seg(t, 1.45, 2.2)));
            else if (t < 2.9) { cb = CARRY; px = lerp(PARK, slotX, inOut(seg(t, 2.2, 2.9))); }
            else if (t < 3.25) { px = slotX; cb = lerp(CARRY, DROP, inOut(seg(t, 2.9, 3.2))); }
            else if (t < 3.9) { px = slotX; cb = lerp(DROP, UP, swing(seg(t, 3.25, 3.9))); }
            else px = lerp(slotX, PARK, swing(seg(t, 3.9, 4.7)));
        }
        setT(el.car, `translate(${f(px - PARK)} 0)`);
        setT(el.rod, `translate(${f(px - PARK)} 0)`);
        if (el.rod) el.rod.setAttribute('height', f(cb - 16 - 124));
        setT(el.clamp, `translate(${f(px - PARK)} ${f(cb - UP)})`);

        // the pallets: each one in, worked, then out, and round again
        let capOn = 0;
        el.pallets.forEach((p, id) => {
            const s = (id + n) % 3;
            const x = s === 0 ? ST[0] : lerp(ST[s - 1], ST[s], idx);
            setT(p.g, `translate(${f(x)} ${LINE})`);
            let op = 1, plateOp = 1, plugOp = 1, plugAt = `translate(${NX} -34)`;
            let bx = -80, by = -34, bw = 104, bh = 20, brx = 4, hx = HX - 30, hy = -46, hw = 60, hh = 12;
            if (s === 0) op = seg(t, 0, 0.8);
            else if (s === 1) {
                if (t >= 2.3) plugOp = 0;
                if (!failed && t >= 4.8) { plugOp = 1; plugAt = `translate(${HX} -43)`; }
            } else if (!packing) {
                plugOp = 0; op = 1 - seg(t, 1.2, 2.0);
            } else {
                // the unit hangs under the clamp and turns on edge on the way up
                plugAt = `translate(${HX} -43)`;
                plateOp = 1 - seg(t, 1.6, 2.2);
                if (t >= 1.45) {
                    const u = inOut(seg(t, 1.45, 2.2));
                    const ax = px - ST[2];
                    let top = cb - LINE;
                    if (t >= 3.2) top = DROP - LINE + (FLOOR - 40 - DROP) * seg(t, 3.2, 3.4) ** 2;
                    const cw = lerp(2 * half, 14, u), ch = lerp(tall, 12, u);
                    plugAt = `translate(${f(ax)} ${f(top + ch)}) scale(${(cw / (2 * half)).toFixed(4)} ${(ch / tall).toFixed(4)})`;
                    plugOp = 1 - u;
                    hw = lerp(60, 14, u); hh = lerp(12, 0, u); hx = ax - hw / 2; hy = top + ch - lerp(3, 0, u);
                    bw = lerp(104, 14, u); bh = lerp(20, 28, u); bx = ax - bw / 2; by = hy + hh; brx = lerp(4, 0, u);
                    if (t < 3.4) {
                        box(el.cap, ST[2] + ax - cw / 2, LINE + top, cw, ch, lerp(6, 0, u));
                        capOn = u;
                    } else { op = 0; }
                }
            }
            show(p.g, op);
            show(p.plate, plateOp);
            box(p.board, bx, by, bw, bh, brx);
            box(p.header, hx, hy, hw, hh);
            show(p.header, hh > 0.05 ? 1 : 0);
            setT(p.plug, plugAt);
            show(p.plug, plugOp);
        });
        show(el.cap, capOn);

        // the tote: one more unit standing in it, and when it is full they go
        const landed = packing && t >= 3.4 ? 1 : 0, inTote = count + landed;
        const clear = inTote === 3 ? 1 - seg(t, 5.0, 6.0) : 1;
        el.packed.forEach((b, i) => show(b, i < inTote ? clear : 0));

        // the plug: in the fingers from the pick until it latches, or until a reject is posted
        let pOp = 0, pAt = [w[0], w[1] + HOLD];
        if (t >= 2.3 && t < 4.8) pOp = 1;
        if (failed && t >= 4.8) {
            if (t < 7.0) pOp = 1;
            else if (t < 7.4) { pOp = 1; pAt = [SLOT[0], SLOT[1] + HOLD + 160 * seg(t, 7.0, 7.4) ** 2]; }
        }
        setT(el.part, `translate(${f(pAt[0])} ${f(pAt[1])})`);
        show(el.part, pOp);

        // vision 1: the wrist camera finds the header
        const lens = [w[0] - 51, w[1] + 34];
        const look = seg(t, 1.1, 1.8), lookOn = look > 0 && look < 1;
        if (el.coneDown) {
            if (lookOn) el.coneDown.setAttribute('d', `M${f(lens[0] - 5)} ${f(lens[1])} L${f(lens[0] - 44)} 418 H${f(lens[0] + 44)} L${f(lens[0] + 5)} ${f(lens[1])} Z`);
            show(el.coneDown, lookOn ? 0.12 * Math.min(1, look * 8, (1 - look) * 8) : 0);
        }
        // vision 2: the camera on the post checks the plug in the fingers
        const up = seg(t, 2.95, 3.4), upOn = up > 0 && up < 1;
        if (el.coneUp) {
            if (upOn) el.coneUp.setAttribute('d', 'M177 367 L360 330 L360 388 L177 380 Z');
            show(el.coneUp, upOn ? 0.12 * Math.min(1, up * 8, (1 - up) * 8) : 0);
        }
        if (el.scan) {
            const s1 = seg(t, 1.12, 1.42), s2 = seg(t, 2.97, 3.14);
            if (s1 > 0 && s1 < 1) {
                const y = lerp(386, 414, s1), k = (y - lens[1]) / (418 - lens[1]), hw = 5 + 39 * k;
                el.scan.setAttribute('d', `M${f(lens[0] - hw + 3)} ${f(y)} H${f(lens[0] + hw - 3)}`);
                show(el.scan, Math.sin(s1 * Math.PI));
            } else if (s2 > 0 && s2 < 1) {
                const x = lerp(232, 352, s2), k = (x - 177) / 183;
                el.scan.setAttribute('d', `M${f(x)} ${f(367 - 37 * k + 3)} V${f(380 + 8 * k - 3)}`);
                show(el.scan, Math.sin(s2 * Math.PI));
            } else show(el.scan, 0);
        }
        if (el.lock) {
            if (t > 1.42 && t < 1.8) { const g = out3(seg(t, 1.42, 1.62)); brackets(el.lock, ST[1] + HX, 412, 30, 6, g); show(el.lock, g * (1 - seg(t, 1.7, 1.8))); }
            else if (t > 3.14 && t < 3.4) { const g = out3(seg(t, 3.14, 3.3)); brackets(el.lock, PRESENT[0], PRESENT[1] + HOLD - tall / 2, half, tall / 2, g); show(el.lock, g * (1 - seg(t, 3.32, 3.4))); }
            else show(el.lock, 0);
        }

        // touch: a ring as the plug meets the header, as it latches, and at the pull
        if (el.ring) {
            const u = Math.max(pulse(t, 4.6), pulse(t, 4.8), pulse(t, 5.0));
            el.ring.setAttribute('r', u < 0 ? 14 : f(14 + 40 * out3(u)));
            show(el.ring, u < 0 ? 0 : 1 - u);
        }
        setOn(el.puck, t > 4.8 && t < 5.1);

        // the tester: the dock slides in, three checks, then pass or fail
        const dx = lerp(570, 530, inOut(seg(t, 5.1, 5.3)) * (1 - inOut(seg(t, 7.4, 7.8))));
        setT(el.dock, `translate(${f(dx)} 0)`);
        if (el.dockCable) el.dockCable.setAttribute('d', `M740 352 C 740 400, ${f(dx + 90)} 435, ${f(dx + 70)} 435`);
        setOn(el.run, t > 5.3 && t < 6.0 && Math.sin(t * 22) > -0.2);
        const at = [5.4, 5.65, 5.9];
        let marks = '';
        el.checks.forEach(({ c, y }, i) => {
            const on = t > at[i] && t < 7.6, bad = on && failed && i === 1;
            c.classList.toggle('is-ok', on && !bad);
            c.classList.toggle('is-bad', bad);
            if (on) marks += bad ? CROSS(y) : TICK(y);
        });
        if (el.mark) el.mark.setAttribute('d', marks || 'M0 0');
        const verdict = t > 6.0 && t < 7.6;
        setOn(el.pass, verdict && !failed);
        setOn(el.fail, verdict && failed);
        setOn(el.lid, verdict && failed);
        setOn(el.padlock, failed && t > 7.3 && t < 7.5);

        // the brain: the result runs down the wire and one more bar lights
        if (el.pulse) {
            const u = seg(t, 6.2, 7.0);
            const p = onCable(u);
            el.pulse.setAttribute('cx', f(p[0]));
            el.pulse.setAttribute('cy', f(p[1]));
            show(el.pulse, u > 0 && u < 1 ? 1 : 0);
        }
        const lit = 2 + (((n % (el.bars.length - 2)) + el.bars.length - 2) % (el.bars.length - 2)) + (t > 7.0 ? 1 : 0);
        el.bars.forEach((b, i) => b.classList.toggle('is-lit', i < Math.max(1, lit)));
        setOn(el.led, t > 7.0 && t < 7.3);
    };

    // ------------------------------------------------------------------
    // The camera. Each part has the patch of the scene it lives in. They
    // stay put while the robot works inside them: a camera chasing the
    // hand read as seasick.
    const FOCUS = {
        // the part's view stops at 1.6x so the arm, swinging out to the
        // camera, never meets the close button
        // on a phone the view is narrower than the arm's reach, so its box
        // takes in the swing out to the camera on the post
        part: () => (narrow.matches ? { x: 250, y: 240, w: 480, h: 250 } : { x: 330, y: 240, w: 400, h: 250, cap: 1.6 }),
        vision: () => ({ x: 96, y: 220, w: 480, h: 270 }),
        touch: () => (narrow.matches ? { x: 248, y: 230, w: 310, h: 250 } : { x: 340, y: 230, w: 260, h: 250 }),
        tester: () => ({ x: 560, y: 0, w: 340, h: 490 }),
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
        const left = root.getBoundingClientRect().left;
        listRight = 0;
        for (const r of rects) listRight = Math.max(listRight, r.right - left);
    };
    const aim = () => {
        const r = focus ? FOCUS[focus]() : narrow.matches ? WHOLE_NARROW : WHOLE;
        const s = Math.min(area.w / r.w, area.h / r.h, r.cap || (focus ? 2.1 : 1.6));
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
    // at rest: a good unit seated and passed, two more in the tote
    const still = () => { draw(T + 6.05); snap(); };
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
        half = SHAPES[shape]; tall = TALL[shape];
        root.dataset.shape = shape;
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
