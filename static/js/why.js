(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
    const ease = (t) => t * t * (3 - 2 * t);

    // Every drawing pauses while it is off screen (see the .is-off rule at the
    // end of site.css), and the JS ones below stop their clocks too.
    const seen = new WeakMap();
    const figs = document.querySelectorAll('[data-anim]');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                e.target.classList.toggle('is-off', !e.isIntersecting);
                seen.set(e.target, e.isIntersecting);
                const wake = e.target.__wake;
                if (e.isIntersecting && wake) wake();
            }
        }, { rootMargin: '120px 0px' });
        figs.forEach((f) => io.observe(f));
    }
    const onScreen = (el) => seen.get(el) !== false && !document.hidden;

    // ------------------------------------------------------------------
    // Watch it work: the concept render scrubbed by the scroll, with the
    // step beside it that matches the frame. Each step owns a stretch of
    // the clip: putting it together, the test, letting go.
    const story = document.querySelector('[data-story]');
    if (story) {
        const video = story.querySelector('.story__video');
        const steps = [...story.querySelectorAll('[data-step]')];
        const list = story.querySelector('.story__steps');
        const media = story.querySelector('.story__media');
        const CUTS = [0, 0.328, 0.776, 1];
        const narrow = matchMedia('(max-width: 900px)');
        const FRAME = 1 / 30;
        let ready = false, seeking = false, running = false, last = 0;
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
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
            last = now;
            shown += (want - shown) * (1 - Math.exp(-22 * dt));
            if (Math.abs(want - shown) < FRAME / 3) shown = want;
            show();
            if (shown !== want) requestAnimationFrame(tick);
            else { running = false; last = 0; }
        };
        const scrub = (fraction) => {
            if (!ready || !isFinite(video.duration)) return;
            want = fraction * (video.duration - FRAME);
            if (!running) { running = true; last = 0; requestAnimationFrame(tick); }
        };

        const sync = () => {
            queued = false;
            const box = list.getBoundingClientRect();
            const stacked = narrow.matches;
            // the line the eye reads at: mid-screen beside the window, or the
            // middle of what is left under it on a phone
            const under = stacked ? media.getBoundingClientRect().bottom : 0;
            const line = under + (innerHeight - under) / 2;
            const p = clamp((line - box.top) / box.height);
            const seg = Math.min(steps.length - 1, Math.floor(p * steps.length));
            if (seg !== active) {
                active = seg;
                steps.forEach((s, i) => s.classList.toggle('is-on', i === seg));
            }
            const within = p * steps.length - seg;
            scrub(CUTS[seg] + (CUTS[seg + 1] - CUTS[seg]) * clamp(within));
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
    // The test gauge: the plug goes in, "Connected" ticks, "Locked" ticks or
    // fails, the ring fills and the result lands. One test in four fails:
    // the latch never clicks and the part is pulled.
    const gauge = document.getElementById('gauge');
    if (gauge) {
        const RESULTS = [true, true, false, true];
        const STATES = ['is-run', 'is-c1', 'is-c2', 'is-bad', 'is-pass', 'is-fail'];
        let n = 0, timer = 0;
        const set = (...on) => { gauge.classList.remove(...STATES); gauge.classList.add(...on); };
        const cycle = () => {
            clearTimeout(timer);
            if (!onScreen(gauge)) { timer = 0; return; }
            const ok = RESULTS[n++ % RESULTS.length];
            const steps = [
                [0, []],
                [500, ['is-run']],
                [1300, ['is-run', 'is-c1']],
                [2100, ['is-run', 'is-c1', 'is-c2', ...(ok ? [] : ['is-bad'])]],
                [2600, ['is-run', 'is-c1', 'is-c2', ...(ok ? ['is-pass'] : ['is-bad', 'is-fail'])]],
            ];
            const start = performance.now();
            steps.forEach(([at, cls]) => setTimeout(() => {
                if (performance.now() - start < 6000) set(...cls);
            }, at));
            timer = setTimeout(cycle, 5000);
        };
        if (reduced) set('is-run', 'is-c1', 'is-c2', 'is-pass');
        else { gauge.__wake = () => { if (!timer) cycle(); }; cycle(); }
    }

    // ------------------------------------------------------------------
    // The reset loop. Carriers ride round the track on one clock. A pair is
    // loaded at In, joined at Build, tested at Test, and the part leaves at
    // Out, or at Aside if it failed; the empty carrier goes round for the
    // next pair. Everything is placed from the clock, so the tool dips and
    // the lamp lights exactly as a carrier passes.
    const loop = document.getElementById('loop');
    const track = document.getElementById('loop-track');
    if (loop && track) {
        const NS = 'http://www.w3.org/2000/svg';
        const layer = document.getElementById('loop-carriers');
        const flying = document.getElementById('loop-flying');
        const tool = document.getElementById('loop-tool');
        const lamp = document.getElementById('loop-lamp');
        const L = track.getTotalLength();
        const COUNT = 6;
        const LAP = 15000;
        // arc lengths of the stations, along the path from its start
        const S_IN = 30, S_BUILD = 170, S_TEST = 320 + Math.PI * 40, S_OUT = 320 + Math.PI * 80 + 50, S_ASIDE = 320 + Math.PI * 80 + 190;
        const BIN_OUT = { x: 390, y: 338 }, BIN_ASIDE = { x: 250, y: 338 };
        const make = (tag, attrs, parent) => {
            const el = document.createElementNS(NS, tag);
            for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
            parent.appendChild(el);
            return el;
        };
        const carriers = Array.from({ length: COUNT }, (_, i) => {
            const g = make('g', { class: 'loop__carrier' }, layer);
            make('rect', { class: 'loop__plate', x: -27, y: -6, width: 54, height: 12, rx: 4 }, g);
            const a = make('rect', { class: 'loop__half loop__half--a', x: -12, y: -28, width: 18, height: 22, rx: 4 }, g);
            const b = make('rect', { class: 'loop__half loop__half--b', x: -6, y: -28, width: 18, height: 22, rx: 4 }, g);
            const fly = make('rect', { class: 'loop__fly', x: -12, y: -11, width: 24, height: 22, rx: 4 }, flying);
            return { g, a, b, fly, offset: i / COUNT };
        });

        function place(now) {
            let dip = 0, lit = null;
            for (const [i, c] of carriers.entries()) {
                const turns = now / LAP + c.offset;
                const lap = Math.floor(turns);
                const s = (turns - lap) * L;
                const fails = (lap + i) % 5 === 0;
                const p = track.getPointAtLength(s);
                c.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
                const loaded = s >= S_IN && s < (fails ? S_ASIDE : S_OUT);
                const join = ease(clamp((s - S_BUILD + 8) / 16));
                c.a.style.display = c.b.style.display = loaded ? '' : 'none';
                c.a.setAttribute('transform', `translate(${(-8 * (1 - join)).toFixed(2)} 0)`);
                c.b.setAttribute('transform', `translate(${(8 * (1 - join)).toFixed(2)} 0)`);
                const tested = s > S_TEST + 4;
                const state = !tested ? '' : fails ? 'is-fail' : 'is-pass';
                for (const half of [c.a, c.b]) {
                    half.classList.toggle('is-joined', join > 0.98);
                    half.classList.toggle('is-pass', state === 'is-pass');
                    half.classList.toggle('is-fail', state === 'is-fail');
                }
                // the part leaving for its bin
                const exitAt = fails ? S_ASIDE : S_OUT;
                const bin = fails ? BIN_ASIDE : BIN_OUT;
                const since = s - exitAt;
                if (since >= 0 && since < 70) {
                    const t = ease(since / 70);
                    const x = p.x + (bin.x - p.x) * t, y = p.y - 14 + (bin.y - (p.y - 14)) * t;
                    c.fly.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
                    c.fly.setAttribute('class', `loop__fly ${fails ? 'is-fail' : 'is-pass'}`);
                    c.fly.style.opacity = String(1 - Math.max(0, (t - 0.75) / 0.25));
                } else {
                    c.fly.style.opacity = '0';
                }
                dip = Math.max(dip, ease(1 - clamp(Math.abs(s - S_BUILD) / 16)));
                if (loaded && s > S_TEST - 6 && s < S_TEST + 46) lit = fails ? 'is-fail' : 'is-pass';
            }
            tool.setAttribute('transform', `translate(0 ${(dip * 15).toFixed(1)})`);
            lamp.classList.toggle('is-pass', lit === 'is-pass');
            lamp.classList.toggle('is-fail', lit === 'is-fail');
        }

        let clock = LAP * 0.12, prev = 0, drawn = 0, raf = 0;
        const frame = (now) => {
            raf = 0;
            if (!onScreen(loop)) { prev = 0; return; }
            if (prev) clock += Math.min(100, now - prev);
            prev = now;
            if (now - drawn >= 1000 / 30) { place(clock); drawn = now; }
            raf = requestAnimationFrame(frame);
        };
        place(clock);
        if (!reduced) {
            loop.__wake = () => { if (!raf) { prev = 0; raf = requestAnimationFrame(frame); } };
            document.addEventListener('visibilitychange', () => { if (!document.hidden && loop.__wake) loop.__wake(); });
        }
    }

    // ------------------------------------------------------------------
    // The one number that is already true counts up as it arrives.
    const count = document.querySelector('[data-count]');
    if (count && !reduced && 'IntersectionObserver' in window) {
        const to = Number(count.dataset.count) || 0;
        count.textContent = '0';
        const io = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            io.disconnect();
            const start = performance.now();
            const step = (now) => {
                const t = clamp((now - start) / 1300);
                count.textContent = String(Math.round(to * (1 - (1 - t) ** 3)));
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, { rootMargin: '0px 0px -20% 0px' });
        io.observe(count);
    }
})();
