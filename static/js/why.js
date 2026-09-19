(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
    const lerp = (a, b, t) => a + (b - a) * t;
    // where t sits between a and b, as 0 to 1
    const seg = (t, a, b) => clamp((t - a) / (b - a));
    const E = {
        inOut3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
        inOut5: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2),
        out3: (t) => 1 - (1 - t) ** 3,
        in2: (t) => t * t,
        smoother: (t) => t * t * t * (t * (6 * t - 15) + 10),
        outBack: (t, s = 1.70158) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
    };

    // ------------------------------------------------------------------
    // One clock for every drawing on the page. Each keeps its own time, and
    // that time only runs while the drawing is on screen, so nothing jumps
    // when you scroll back to it and nothing is drawn that nobody can see.
    const jobs = new Map();
    let raf = 0, last = 0;
    const frame = (now) => {
        raf = 0;
        if (document.hidden) { last = 0; return; }
        const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        let any = false;
        for (const job of jobs.values()) {
            if (!job.on) continue;
            job.t += dt;
            job.draw(job.t, dt);
            any = true;
        }
        if (any) raf = requestAnimationFrame(frame);
        else last = 0;
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
        for (const e of entries) {
            const job = jobs.get(e.target);
            if (job) job.on = e.isIntersecting;
        }
        wake();
    }, { rootMargin: '100px 0px' }) : null;
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
    const run = (el, draw, start = 0) => {
        if (!el || reduced || !io) return false;
        jobs.set(el, { draw, t: start, on: false });
        io.observe(el);
        return true;
    };

    // ------------------------------------------------------------------
    // The parts world inside WHY US. Every part drifts on two slow sines
    // that never line up, leans toward the pointer by its depth, lags a
    // little behind a fast scroll and settles back, and after the dive
    // rises at its own depth as the words scroll over it. The gear is
    // driven by the scroll.
    const portal = document.querySelector('[data-portal]');
    const field = document.querySelector('.portal__field');
    const cover = document.querySelector('.parts');
    const partEls = [...document.querySelectorAll('.part')];
    if (portal && field && cover && partEls.length) {
        const rand = (i, n) => { const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
        const parts = partEls.map((el, i) => ({
            el,
            depth: Number(el.dataset.depth) || 1,
            spin: el.hasAttribute('data-spin'),
            ax: 5 + 8 * rand(i, 1), wx: 0.3 + 0.35 * rand(i, 2), px: 6.28 * rand(i, 3),
            bx: 2 + 4 * rand(i, 4), vx: 0.7 + 0.5 * rand(i, 5), qx: 6.28 * rand(i, 6),
            ay: 6 + 9 * rand(i, 7), wy: 0.25 + 0.3 * rand(i, 8), py: 6.28 * rand(i, 9),
            ar: 2 + 4 * rand(i, 10), wr: 0.2 + 0.3 * rand(i, 11), pr: 6.28 * rand(i, 12),
            angle: 0,
        }));
        let unit = cover.clientWidth / 1600;
        new ResizeObserver(() => { unit = cover.clientWidth / 1600; }).observe(cover);
        let aimX = 0, aimY = 0, lookX = 0, lookY = 0, lastY = scrollY, speed = 0, lag = 0;
        addEventListener('pointermove', (e) => {
            aimX = (e.clientX / innerWidth) * 2 - 1;
            aimY = (e.clientY / innerHeight) * 2 - 1;
        }, { passive: true });
        run(field, (t, dt) => {
            const follow = 1 - Math.exp(-4 * dt);
            lookX += (aimX - lookX) * follow;
            lookY += (aimY - lookY) * follow;
            const y = scrollY;
            speed += ((y - lastY) / dt - speed) * (1 - Math.exp(-10 * dt));
            lastY = y;
            lag += (clamp(-speed * 0.03, -44, 44) - lag) * (1 - Math.exp(-6 * dt));
            const after = parseFloat(portal.style.getPropertyValue('--gp-after')) || 0;
            for (const p of parts) {
                const d = p.depth;
                const x = (p.ax * Math.sin(p.wx * t + p.px) + p.bx * Math.sin(p.vx * t + p.qx)) * unit + lookX * d * 16;
                const yy = p.ay * Math.sin(p.wy * t + p.py) * unit + lookY * d * 11 + lag * d - after * d * 300 * unit;
                let r = p.ar * Math.sin(p.wr * t + p.pr) + lookX * d * 2.5;
                if (p.spin) { p.angle += (9 + Math.min(Math.abs(speed) * 0.08, 260)) * dt; r = p.angle; }
                p.el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${yy.toFixed(2)}px, 0) rotate(${r.toFixed(2)}deg)`;
            }
        });
    }

    // ------------------------------------------------------------------
    // The arm, moved the way a real one moves: straight down onto the part,
    // a fast traverse that eases in and out, a slow last approach that
    // arrives a few millimetres off, a small search until the part finds
    // the slot, a click as it seats, then away while the tester runs and
    // the next part slides onto the tray. Joint angles are solved every
    // frame (two-link inverse kinematics, elbow up), so the tool follows
    // a true path instead of swinging between poses. Every arm on the page
    // runs this: the one in the turn, and the three in the fleet at the end,
    // which start at their own point in the cycle (data-phase, seconds) and
    // run at their own speed (data-rate), so they never line up for long.
    for (const arm of document.querySelectorAll('.arm')) {
        const q = (s) => arm.querySelector(s);
        const shoulder = q('.arm__shoulder'), elbow = q('.arm__elbow'), wrist = q('.arm__wrist');
        const fingerL = q('.arm__finger--l'), fingerR = q('.arm__finger--r');
        const held = q('.arm__held'), tray = q('.arm__traypart'), seated = q('.arm__seated');
        const ring = q('.arm__ring'), lamp = q('.arm__lamp'), badge = q('.arm__badge');
        const J0 = [190, 296], L1 = 170, L2 = 150, DEG = 180 / Math.PI;
        const HOME = [330, 236], PICK = [330, 286], ABOVE = [470, 216], CONTACT = [475, 262], SEAT = [470, 266], VIA = [405, 150];
        const LOOP = 8;
        const line = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
        const curve = (a, c, b, t) => { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; };
        const ik = ([x, y]) => {
            const dx = x - J0[0], dy = y - J0[1];
            const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01);
            const a1 = Math.atan2(dy, dx) - Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
            const ex = J0[0] + L1 * Math.cos(a1), ey = J0[1] + L1 * Math.sin(a1);
            const a2 = Math.atan2(y - ey, x - ex);
            return [a1 * DEG, (a2 - a1) * DEG, -a2 * DEG];
        };
        const tool = (t) => {
            if (t < 0.6) return line(HOME, PICK, E.inOut3(t / 0.6));
            if (t < 0.95) return PICK;
            if (t < 1.45) return line(PICK, HOME, E.inOut3(seg(t, 0.95, 1.45)));
            if (t < 2.65) return curve(HOME, VIA, ABOVE, E.inOut5(seg(t, 1.45, 2.65)));
            if (t < 3.25) return line(ABOVE, CONTACT, E.out3(seg(t, 2.65, 3.25)));
            if (t < 3.95) {
                const u = seg(t, 3.25, 3.95);
                return [470 + 5 * Math.cos(u * Math.PI * 5) * (1 - u) ** 1.5, 262 + 1.2 * Math.sin(u * Math.PI * 10) * (1 - u)];
            }
            if (t < 4.15) return line([470, 262], SEAT, E.outBack(seg(t, 3.95, 4.15), 3));
            if (t < 4.45) return SEAT;
            if (t < 4.95) return line(SEAT, ABOVE, E.inOut3(seg(t, 4.45, 4.95)));
            if (t < 6.15) return curve(ABOVE, VIA, HOME, E.inOut5(seg(t, 4.95, 6.15)));
            return HOME;
        };
        const rate = Number(arm.dataset.rate) || 1;
        run(arm, (time) => {
            const t = (time * rate) % LOOP;
            const [s, e, w] = ik(tool(t));
            shoulder.style.transform = `rotate(${s.toFixed(3)}deg)`;
            elbow.style.transform = `rotate(${e.toFixed(3)}deg)`;
            wrist.style.transform = `rotate(${w.toFixed(3)}deg)`;
            const grip = t < 0.6 ? 0 : t < 0.85 ? E.out3(seg(t, 0.6, 0.85)) : t < 4.15 ? 1 : t < 4.35 ? 1 - E.out3(seg(t, 4.15, 4.35)) : 0;
            fingerL.style.transform = `translateX(${lerp(-3, 2, grip).toFixed(2)}px)`;
            fingerR.style.transform = `translateX(${lerp(3, -2, grip).toFixed(2)}px)`;
            held.style.opacity = t >= 0.8 && t < 4.2 ? '1' : '0';
            const arrive = E.out3(seg(t, 6.3, 6.9));
            tray.style.opacity = t < 0.8 ? '1' : t < 6.3 ? '0' : String(arrive);
            tray.style.transform = t < 0.8 ? 'none' : `translateX(${lerp(-56, 0, arrive).toFixed(2)}px)`;
            const gone = seg(t, 7.3, 7.7);
            seated.style.opacity = t < 4.2 ? '0' : String(1 - gone);
            ring.style.strokeDashoffset = String(1 - E.inOut3(seg(t, 4.6, 5.5)));
            ring.style.opacity = String(1 - gone);
            lamp.style.fill = t >= 5.45 && t < 7.3 ? '#FFD42A' : '#2A2A2A';
            const pop = t < 5.5 ? 0 : t < 7.2 ? E.outBack(seg(t, 5.5, 5.85)) : 1 - E.in2(seg(t, 7.2, 7.5));
            badge.style.transform = `scale(${pop.toFixed(3)})`;
        }, Number(arm.dataset.phase) || 0);
    }

    // ------------------------------------------------------------------
    // Watch it work: the concept render scrubbed by the scroll, with the
    // step beside it that matches the frame and a thin line that follows
    // the clip. Each step owns a stretch of the clip: putting it together,
    // the test, letting go.
    const story = document.querySelector('[data-story]');
    if (story) {
        const video = story.querySelector('.story__video');
        const steps = [...story.querySelectorAll('[data-step]')];
        const list = story.querySelector('.story__steps');
        const media = story.querySelector('.story__media');
        const CUTS = [0, 0.328, 0.776, 1];
        const narrow = matchMedia('(max-width: 900px)');
        const FRAME = 1 / 30;
        let ready = false, seeking = false, running = false, lastTick = 0;
        let want = 0, shown = 0, lastFrame = -1, watchdog = 0, active = -1, queued = false;

        const show = () => {
            if (seeking || !ready) return;
            const f = Math.round(shown / FRAME);
            if (f === lastFrame) return;
            lastFrame = f;
            seeking = true;
            clearTimeout(watchdog);
            watchdog = setTimeout(() => { seeking = false; lastFrame = -1; show(); }, 400);
            video.currentTime = Math.min((f + 0.5) * FRAME, video.duration - 0.001);
        };
        const tick = (now) => {
            if (!ready) { running = false; return; }
            const dt = lastTick ? Math.min(0.05, (now - lastTick) / 1000) : 1 / 60;
            lastTick = now;
            shown += (want - shown) * (1 - Math.exp(-22 * dt));
            if (Math.abs(want - shown) < FRAME / 3) shown = want;
            show();
            if (shown !== want) requestAnimationFrame(tick);
            else { running = false; lastTick = 0; }
        };
        const scrub = (fraction) => {
            media.style.setProperty('--p', fraction.toFixed(4));
            if (!ready || !isFinite(video.duration)) return;
            want = fraction * (video.duration - FRAME);
            if (!running) { running = true; lastTick = 0; requestAnimationFrame(tick); }
        };
        const sync = () => {
            queued = false;
            const box = list.getBoundingClientRect();
            // the line the eye reads at: mid-screen beside the window, or the
            // middle of what is left under it on a phone
            const under = narrow.matches ? media.getBoundingClientRect().bottom : 0;
            const at = under + (innerHeight - under) / 2;
            const p = clamp((at - box.top) / box.height);
            const n = Math.min(steps.length - 1, Math.floor(p * steps.length));
            if (n !== active) {
                active = n;
                steps.forEach((s, i) => s.classList.toggle('is-on', i === n));
            }
            scrub(CUTS[n] + (CUTS[n + 1] - CUTS[n]) * clamp(p * steps.length - n));
        };
        const ask = () => { if (!queued) { queued = true; requestAnimationFrame(sync); } };

        if (reduced) {
            steps.forEach((s) => s.classList.add('is-on'));
            if (video.dataset.still) video.poster = video.dataset.still;
        } else if (video.dataset.src && video.canPlayType('video/mp4')) {
            video.addEventListener('seeked', () => { clearTimeout(watchdog); seeking = false; show(); });
            const markReady = () => {
                if (ready || video.readyState < 2) return;
                ready = true;
                sync();
            };
            ['loadeddata', 'canplay', 'loadedmetadata'].forEach((e) => video.addEventListener(e, markReady));
            video.addEventListener('error', () => { clearTimeout(watchdog); seeking = false; ready = false; });
            // fetched once the section is near, not with the page
            const near = new IntersectionObserver(([entry]) => {
                if (!entry.isIntersecting) return;
                near.disconnect();
                video.src = video.dataset.src;
                video.load();
            }, { rootMargin: '800px 0px' });
            near.observe(story);
            const unlock = () => {
                const played = video.play();
                if (played && played.then) played.then(() => video.pause()).catch(() => {});
            };
            addEventListener('touchstart', unlock, { once: true, passive: true });
            addEventListener('pointerdown', unlock, { once: true });
            addEventListener('scroll', ask, { passive: true });
            addEventListener('resize', ask);
            sync();
        }
    }

    // ------------------------------------------------------------------
    // The test gauge, as a test runs: the plug travels down, slows for the
    // last stretch, clicks home (or stops short and shakes), Connected
    // ticks, the ring sweeps, Locked ticks or fails, the result lands, and
    // the part is taken away. One test in four fails.
    const gauge = document.getElementById('gauge');
    if (gauge) {
        const RESULTS = [true, true, false, true];
        const CYCLE = 5.6;
        let current = '';
        const classes = (time) => {
            const t = time % CYCLE;
            const ok = RESULTS[Math.floor(time / CYCLE) % RESULTS.length];
            const on = ['gauge'];
            if (t < 0.1) on.push('is-reset');
            if (t >= 0.1) on.push('is-near');
            if (t >= 0.75) on.push('is-in', ...(ok ? [] : ['is-bad']));
            if (t >= 1.25) on.push(ok ? 'is-click' : 'is-shake');
            if (t >= 1.45) on.push('is-c1', 'is-run');
            if (t >= 1.95) on.push('is-c2');
            if (t >= 3.05) on.push(ok ? 'is-pass' : 'is-fail');
            if (t >= 4.4) on.push('is-out');
            return on.join(' ');
        };
        const draw = (time) => {
            const next = classes(time);
            if (next !== current) { current = next; gauge.className = next; }
        };
        if (!run(gauge, draw)) draw(3.5);
    }

    // ------------------------------------------------------------------
    // Every miss makes it better: each try is drawn at the speed of a real
    // move, fast in the middle and slow at both ends, with a head riding
    // the curve and its handles shown while it is planned. Where a try
    // lands, a ripple. The last one hits and the target lights.
    const tries = document.querySelector('.tries');
    if (tries) {
        const items = [...tries.querySelectorAll('.tries__try')].map((g) => ({
            path: g.querySelector('.tries__path'),
            tools: [...g.querySelectorAll('.tries__handles, .tries__a')],
            end: g.querySelector('.tries__end'),
            label: g.querySelector('.tries__label'),
        }));
        items.forEach((it) => { it.len = it.path.getTotalLength(); });
        const ripples = [...tries.querySelectorAll('.tries__ripple')];
        const head = tries.querySelector('.tries__head');
        const ring = tries.querySelector('.tries__ring'), bull = tries.querySelector('.tries__bull');
        const LOOP = 9.2, START = [0.3, 2.2, 4.1, 6.0], DRAW = 1.15;
        run(tries, (time) => {
            const t = time % LOOP;
            const out = 1 - seg(t, 8.5, 9.0);
            let at = null;
            items.forEach((it, i) => {
                const s = START[i], hit = i === 3;
                const f = E.inOut3(seg(t, s, s + DRAW));
                it.path.style.strokeDashoffset = String(1 - f);
                const settled = t > s + DRAW + 0.5;
                it.path.style.opacity = String((hit || !settled ? 1 : lerp(1, 0.22, seg(t, s + DRAW + 0.5, s + DRAW + 1))) * out);
                const planned = Math.min(seg(t, s - 0.3, s), 1 - seg(t, s + DRAW, s + DRAW + 0.4));
                it.tools.forEach((n) => { n.style.opacity = String(planned); });
                const landed = t >= s + DRAW ? out : 0;
                if (it.end) it.end.style.transform = `scale(${t >= s + DRAW ? E.outBack(seg(t, s + DRAW, s + DRAW + 0.3), 2.2).toFixed(3) : 0})`;
                if (it.end) it.end.style.opacity = String(landed);
                if (it.label) it.label.style.opacity = String(landed * seg(t, s + DRAW + 0.1, s + DRAW + 0.4));
                if (t >= s && t < s + DRAW) at = it.path.getPointAtLength(f * it.len);
                const r = seg(t, s + DRAW, s + DRAW + 0.7);
                const rp = ripples[i];
                if (r > 0 && r < 1) {
                    rp.setAttribute('r', ((hit ? 12 : 9) + E.out3(r) * (hit ? 38 : 24)).toFixed(2));
                    rp.style.opacity = String((1 - r) * 0.9);
                } else {
                    rp.style.opacity = '0';
                }
            });
            if (at) {
                head.setAttribute('cx', at.x.toFixed(2));
                head.setAttribute('cy', at.y.toFixed(2));
                head.style.opacity = '1';
            } else {
                head.style.opacity = '0';
            }
            const lit = t >= START[3] + DRAW && t < 8.8;
            bull.style.fill = lit ? '#FFD42A' : 'transparent';
            ring.style.stroke = lit ? '#FFD42A' : '#F4F4F0';
        });
    }

    // ------------------------------------------------------------------
    // The loop, indexed the way real carrier lines run: every carrier moves
    // one stop at once, stops, and the stations work while it stands. At In
    // a pair drops onto an empty carrier; at Build the press comes down and
    // joins it; at Test the lamp gives the verdict; at Out a good part is
    // lifted off into the bin, and at Aside a bad one drops into its own.
    // The belt only moves when the carriers do.
    const loop = document.getElementById('loop');
    const track = document.getElementById('loop-track');
    if (loop && track) {
        const NS = 'http://www.w3.org/2000/svg';
        const layer = document.getElementById('loop-carriers');
        const flying = document.getElementById('loop-flying');
        const press = document.getElementById('loop-tool');
        const lamp = document.getElementById('loop-lamp');
        const L = track.getTotalLength();
        const N = 12, PITCH = L / N, S0 = 40;
        const MOVE = 0.75, DWELL = 1.05, CYCLE = MOVE + DWELL;
        const IN = 0, BUILD = 2, TEST = 4, OUT = 6, ASIDE = 8;
        const BINS = { out: [400, 338], aside: [210, 338] };
        const point = (stop) => track.getPointAtLength((((S0 + stop * PITCH) % L) + L) % L);
        const make = (tag, attrs, parent) => {
            const el = document.createElementNS(NS, tag);
            for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
            parent.appendChild(el);
            return el;
        };
        const carriers = [0, 1, 2, 4, 5, 6, 8, 9, 10].map((pos) => {
            const g = make('g', { class: 'loop__carrier' }, layer);
            make('rect', { class: 'loop__plate', x: -27, y: -6, width: 54, height: 12, rx: 4 }, g);
            const a = make('rect', { class: 'loop__half loop__half--a', x: -12, y: -28, width: 18, height: 22, rx: 4 }, g);
            const b = make('rect', { class: 'loop__half loop__half--b', x: -6, y: -28, width: 18, height: 22, rx: 4 }, g);
            const fly = make('rect', { class: 'loop__fly', x: -12, y: -11, width: 24, height: 22, rx: 4 }, flying);
            return { g, a, b, fly, pos, state: 'empty', bad: false, evt: null };
        });
        let made = 0;
        const advance = () => {
            for (const k of carriers) {
                k.pos = (k.pos + 1) % N;
                k.evt = null;
                if (k.pos === IN && k.state === 'empty') { k.state = 'pair'; k.bad = made++ % 5 === 3; k.evt = 'load'; }
                else if (k.pos === BUILD && k.state === 'pair') { k.state = 'joined'; k.evt = 'join'; }
                else if (k.pos === TEST && k.state === 'joined') { k.state = k.bad ? 'fail' : 'pass'; k.evt = 'test'; }
                else if (k.pos === OUT && k.state === 'pass') { k.state = 'empty'; k.evt = 'out'; }
                else if (k.pos === ASIDE && k.state === 'fail') { k.state = 'empty'; k.evt = 'aside'; }
            }
        };
        // run the line for two laps before anyone sees it, so it arrives busy
        for (let i = 0; i < 24; i++) advance();
        let arrived = 0;

        const draw = (t) => {
            // cycle c moves every carrier one stop in its first MOVE seconds,
            // then stands for DWELL while the stations work
            const c = Math.floor(t / CYCLE), u = t - c * CYCLE;
            while (arrived < Math.floor((t - MOVE) / CYCLE) + 1) { advance(); arrived++; }
            const moving = u < MOVE;
            const m = moving ? E.smoother(u / MOVE) : 0;
            const d = moving ? -1 : u - MOVE;
            track.style.strokeDashoffset = String((-(arrived + m) * PITCH).toFixed(2));
            let dip = 0, lit = '';
            for (const k of carriers) {
                const p = point(moving ? k.pos + m : k.pos);
                k.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
                const leaving = !moving && (k.evt === 'out' || k.evt === 'aside');
                const has = k.state !== 'empty' || (leaving && d < 0.15);
                k.a.style.display = k.b.style.display = has ? '' : 'none';
                // the pair drops onto the carrier and settles
                const drop = !moving && k.evt === 'load' ? -48 * (1 - E.outBack(seg(d, 0, 0.42), 1.2)) : 0;
                // the halves close up as the press reaches the bottom
                const gap = k.state === 'pair' ? 1 : !moving && k.evt === 'join' ? 1 - E.inOut3(seg(d, 0.28, 0.4)) : 0;
                k.a.setAttribute('transform', `translate(${(-8 * gap).toFixed(2)} ${drop.toFixed(2)})`);
                k.b.setAttribute('transform', `translate(${(8 * gap).toFixed(2)} ${drop.toFixed(2)})`);
                const judged = (k.state === 'pass' || k.state === 'fail' || leaving) && !(!moving && k.evt === 'test' && d < 0.3);
                const verdict = judged ? (k.bad ? 'is-fail' : 'is-pass') : '';
                const joined = gap === 0 && k.state !== 'pair';
                for (const half of [k.a, k.b]) {
                    half.classList.toggle('is-joined', joined && !verdict);
                    half.classList.toggle('is-pass', verdict === 'is-pass');
                    half.classList.toggle('is-fail', verdict === 'is-fail');
                }
                // off the carrier: a good part is lifted and set in Out; a
                // bad one drops straight into Aside
                if (leaving && d >= 0.15 && d < 0.85) {
                    const f = seg(d, 0.15, 0.8);
                    const [bx, by] = k.evt === 'out' ? BINS.out : BINS.aside;
                    const x0 = p.x, y0 = p.y - 17;
                    const x = k.evt === 'out' ? lerp(x0, bx, E.inOut3(f)) : lerp(x0, bx, f);
                    const y = k.evt === 'out' ? lerp(y0, by, E.inOut3(f)) - 70 * 4 * f * (1 - f) : lerp(y0, by, E.in2(f));
                    const spin = k.evt === 'aside' ? 40 * f : 0;
                    k.fly.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${spin.toFixed(1)})`);
                    k.fly.setAttribute('class', `loop__fly ${k.evt === 'out' ? 'is-pass' : 'is-fail'}`);
                    k.fly.style.opacity = String(1 - seg(d, 0.72, 0.85));
                } else {
                    k.fly.style.opacity = '0';
                }
                if (!moving && k.pos === BUILD && k.evt === 'join') {
                    dip = seg(d, 0.08, 0.3) < 1 ? E.in2(seg(d, 0.08, 0.3)) : 1 - E.out3(seg(d, 0.5, 0.75));
                }
                if (!moving && k.pos === TEST && k.evt === 'test' && d >= 0.3) lit = k.bad ? 'is-fail' : 'is-pass';
            }
            press.setAttribute('transform', `translate(0 ${(dip * 14).toFixed(2)})`);
            lamp.classList.toggle('is-pass', lit === 'is-pass');
            lamp.classList.toggle('is-fail', lit === 'is-fail');
        };
        if (!run(loop, draw)) draw(MOVE + DWELL * 0.6);
    }

    // ------------------------------------------------------------------
    // A new part is not a new project: one housing that widens into the
    // next part, the pins sliding to their new places and two new ones
    // arriving once there is room, a dimension line that follows the width,
    // and the skill above it holding still, flashing once as it takes hold
    // of the new part.
    const morph = document.querySelector('.morph');
    if (morph) {
        const body = morph.querySelector('.morph__body');
        const pins = [...morph.querySelectorAll('.morph__pin')];
        const dim = morph.querySelector('.morph__dim');
        const skill = morph.querySelector('.morph__skill');
        const nameA = morph.querySelector('.morph__name--a'), nameB = morph.querySelector('.morph__name--b');
        const A = { x: 190, w: 220, pins: [222, 266, 308, 350] };
        const B = { x: 150, w: 300, pins: [176, 220, 264, 308] };
        run(morph, (time) => {
            const t = time % 8;
            const m = t < 2.4 ? 0 : t < 3.4 ? E.inOut3(seg(t, 2.4, 3.4)) : t < 6.4 ? 1 : t < 7.4 ? 1 - E.inOut3(seg(t, 6.4, 7.4)) : 0;
            const x = lerp(A.x, B.x, m), w = lerp(A.w, B.w, m);
            body.setAttribute('x', x.toFixed(2));
            body.setAttribute('width', w.toFixed(2));
            for (let i = 0; i < 4; i++) pins[i].setAttribute('x', lerp(A.pins[i], B.pins[i], m).toFixed(2));
            const room = seg(m, 0.55, 1);
            for (const pin of pins.slice(4)) {
                pin.style.opacity = String(clamp(room * 2));
                pin.style.transform = `scale(${Math.max(0, E.outBack(room, 2)).toFixed(3)})`;
            }
            dim.setAttribute('d', `M${x.toFixed(1)} 356 H${(x + w).toFixed(1)} M${x.toFixed(1)} 348 v16 M${(x + w).toFixed(1)} 348 v16`);
            nameA.style.opacity = String(1 - clamp(m * 2));
            nameB.style.opacity = String(clamp(m * 2 - 1));
            const flash = Math.max(0, 1 - Math.abs(t - 3.55) / 0.35) + Math.max(0, 1 - Math.abs(t - 7.55) / 0.35);
            skill.style.strokeWidth = String(5 + 3 * flash);
        }, 0.6);
    }

    // ------------------------------------------------------------------
    // The one number that is already true counts up as it arrives.
    const count = document.querySelector('[data-count]');
    if (count && !reduced && 'IntersectionObserver' in window) {
        const to = Number(count.dataset.count) || 0;
        count.textContent = '0';
        const seen = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            seen.disconnect();
            const start = performance.now();
            const step = (now) => {
                const t = clamp((now - start) / 1300);
                count.textContent = String(Math.round(to * E.out3(t)));
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, { rootMargin: '0px 0px -20% 0px' });
        seen.observe(count);
    }

    // ------------------------------------------------------------------
    // The offices keep their own time: each city shows the clock where it
    // is, set now and then on the half minute, and never while the tab is
    // in the background. A time zone the browser does not know is left
    // blank rather than shown wrong.
    const clocks = [...document.querySelectorAll('.city__t[data-tz]')];
    if (clocks.length) {
        const show = () => {
            if (document.hidden) return;
            const now = new Date();
            for (const el of clocks) {
                try {
                    el.textContent = new Intl.DateTimeFormat('en-US', { timeZone: el.dataset.tz, hour: 'numeric', minute: '2-digit' }).format(now);
                } catch {
                    el.textContent = '';
                }
            }
        };
        show();
        setInterval(show, 30000);
        document.addEventListener('visibilitychange', show);
    }
})();
