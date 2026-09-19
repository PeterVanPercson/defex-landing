(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The figures' CSS animations pause while their figure is off screen, the
    // way the article's do (see the .is-off rule at the end of site.css).
    const figs = document.querySelectorAll('[data-anim]');
    if (figs.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) e.target.classList.toggle('is-off', !e.isIntersecting);
        }, { rootMargin: '120px 0px' });
        figs.forEach((f) => io.observe(f));
    }

    // ------------------------------------------------------------------
    // The carrier line. Five carriers ride one clock round two tracks that
    // share everything up to the fork. A prepared pair enters on the left as
    // two parts, is joined at the insert station, lights the lamp at the test
    // station (orange for a pass, ink for a fail) and leaves for acceptance or
    // quarantine. One in five fails. Everything is placed from the same clock,
    // so the tool dips and the lamp lights exactly as a carrier passes.
    const line = document.getElementById('line');
    if (!line) return;
    const NS = 'http://www.w3.org/2000/svg';
    const accept = document.getElementById('line-accept');
    const quarantine = document.getElementById('line-quarantine');
    const layer = document.getElementById('line-carriers');
    const tool = document.getElementById('line-tool');
    const lamp = document.getElementById('line-lamp');
    if (!accept || !quarantine || !layer || !tool || !lamp) return;

    const COUNT = 5;
    const PERIOD = 11000;
    const INSERT_X = 190;
    const TEST_X = 345;
    const length = accept.getTotalLength();
    // arc length along the shared straight, where x maps directly
    const at = (x) => x - 16;
    const sInsert = at(INSERT_X);
    const sTest = at(TEST_X);

    const make = (tag, attrs, parent) => {
        const el = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        parent.appendChild(el);
        return el;
    };
    const carriers = Array.from({ length: COUNT }, (_, i) => {
        const g = make('g', { class: 'line__carrier' }, layer);
        make('rect', { class: 'line__plate', x: -27, y: -5, width: 54, height: 10, rx: 2 }, g);
        make('rect', { class: 'line__housing', x: -20, y: -27, width: 22, height: 22, rx: 2 }, g);
        const plug = make('rect', { class: 'line__plug', x: -17.5, y: -24.5, width: 17, height: 17, rx: 2 }, g);
        return { g, plug, fails: i === COUNT - 1, offset: i / COUNT };
    });

    const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
    const ease = (t) => t * t * (3 - 2 * t);

    function place(now) {
        let dip = 0, lit = null;
        for (const c of carriers) {
            const phase = ((now / PERIOD) + c.offset) % 1;
            const s = phase * length;
            const path = c.fails ? quarantine : accept;
            const p = path.getPointAtLength(s);
            // the pair travels apart until the insert station and joined after it
            const joined = ease(clamp((s - sInsert + 10) / 20));
            c.plug.setAttribute('transform', `translate(${((1 - joined) * 26).toFixed(2)} ${((1 - joined) * 2.5).toFixed(2)})`);
            const tested = s > sTest + 6;
            c.plug.classList.toggle('is-pass', tested && !c.fails);
            c.plug.classList.toggle('is-fail', tested && c.fails);
            const fade = Math.min(clamp(s / 24), clamp((length - s) / 30));
            c.g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
            c.g.style.opacity = fade.toFixed(3);
            // the tool presses while a carrier is under it
            const under = 1 - clamp(Math.abs(s - sInsert) / 16);
            dip = Math.max(dip, ease(under));
            if (s > sTest - 4 && s < sTest + 34) lit = c.fails ? 'fail' : 'pass';
        }
        tool.setAttribute('transform', `translate(0 ${(dip * 24).toFixed(2)})`);
        lamp.classList.toggle('is-pass', lit === 'pass');
        lamp.classList.toggle('is-fail', lit === 'fail');
    }

    // A still frame with three carriers on the line: one arriving, one under
    // the tool, one at the lamp.
    if (reduced) { place(PERIOD * 0.24); return; }

    // 30 frames a second is plenty for parts on a conveyor, and it halves the
    // work of a display-rate loop. Runs only while the figure is on screen.
    const STEP = 1000 / 30;
    let raf = 0, prev = 0, drawn = 0, clock = PERIOD * 0.24, visible = false;
    function frame(now) {
        raf = 0;
        if (!visible || document.hidden) { prev = 0; return; }
        if (prev) clock += Math.min(100, now - prev);
        prev = now;
        if (now - drawn >= STEP) { place(clock); drawn = now; }
        raf = requestAnimationFrame(frame);
    }
    place(clock);
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) { prev = 0; raf = requestAnimationFrame(frame); }
    }, { rootMargin: '60px 0px' }).observe(line);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && visible && !raf) { prev = 0; raf = requestAnimationFrame(frame); }
    });
})();
