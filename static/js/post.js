(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reading progress and the section strip. The strip is rendered by the
    // template; this only fills the line, marks the section on screen and
    // keeps its label in view when the strip is scrolling sideways.
    const bar = document.querySelector('.progress__bar');
    const links = Array.from(document.querySelectorAll('.sections__link'));
    const heads = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
    const track = links.length ? links[0].parentElement : null;
    let queued = false;
    let active = -1;

    function paint() {
        queued = false;
        // all reads first, then the writes: a style write followed by a
        // getBoundingClientRect forces a layout on every scroll frame
        const room = document.documentElement.scrollHeight - innerHeight;
        const line = innerHeight * 0.34;
        let now = -1;
        heads.forEach((h, i) => { if (h && h.getBoundingClientRect().top <= line) now = i; });
        if (bar) bar.style.setProperty('--progress', room > 0 ? Math.min(1, scrollY / room) : 0);
        if (now === active) return;
        active = now;
        links.forEach((a, i) => {
            if (i === now) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
        });
        if (now >= 0 && track && track.scrollWidth > track.clientWidth) {
            const a = links[now];
            track.scrollTo({ left: a.offsetLeft - (track.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
        }
    }
    function ask() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    paint();

    // The figures' CSS animations (the ring's bead, the plug, the playhead)
    // pause while their figure is off screen. Left to CSS they run for the
    // whole read, repainting three figures on every frame of a nine-minute
    // article the reader is nowhere near.
    const figs = document.querySelectorAll('#latch, #bench');
    if (figs.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) e.target.classList.toggle('is-off', !e.isIntersecting);
        }, { rootMargin: '120px 0px' });
        figs.forEach((f) => io.observe(f));
    }

    // The bench: trials per hour = 3600 / (action + check + reset + recovery).
    // The bar is one trial with each term to scale, and the playhead crosses
    // it once per trial at 20x, the speed the ring at the top runs at.
    const bench = document.getElementById('bench');
    if (bench) {
        const ORDER = ['action', 'check', 'reset', 'recovery'];
        const inputs = {};
        bench.querySelectorAll('input[type="range"]').forEach((i) => { inputs[i.name] = i; });
        const outs = {};
        bench.querySelectorAll('[data-out]').forEach((o) => { outs[o.dataset.out] = o; });
        const segs = {};
        bench.querySelectorAll('.bench__seg').forEach((s) => { segs[s.dataset.phase] = s; });
        const panel = bench.querySelector('.bench__panel');
        const presets = Array.from(bench.querySelectorAll('[data-preset]'));
        let shown = Number(outs.rate.textContent) || 0;
        let raf = 0;

        // The number eases to its new value rather than jumping, so a slider
        // drag reads as one motion. Reduce Motion gets the value at once.
        function settle(target) {
            cancelAnimationFrame(raf);
            if (reduce) { shown = target; outs.rate.textContent = Math.round(target); return; }
            const from = shown;
            const t0 = performance.now();
            const step = (now) => {
                const k = Math.min(1, (now - t0) / 420);
                const e = 1 - Math.pow(1 - k, 3);
                shown = from + (target - from) * e;
                outs.rate.textContent = Math.round(shown);
                if (k < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        }

        function render() {
            const v = ORDER.map((k) => Number(inputs[k].value));
            const cycle = v.reduce((a, b) => a + b, 0) || 1;
            ORDER.forEach((k, i) => {
                segs[k].style.flexGrow = v[i];
                segs[k].hidden = v[i] === 0;
                inputs[k].nextElementSibling.textContent = `${v[i]} s`;
            });
            outs.share.textContent = `${Math.round((100 * v[0]) / cycle)}%`;
            outs.cycle.textContent = `${cycle} s`;
            // one lap per trial at 20x, kept between 1.6 s and 14 s so it stays watchable
            panel.style.setProperty('--lap', `${Math.min(14, Math.max(1.6, cycle / 20))}s`);
            const key = v.join(',');
            presets.forEach((b) => b.classList.toggle('is-on', b.dataset.preset === key));
            settle(3600 / cycle);
        }

        ORDER.forEach((k) => inputs[k].addEventListener('input', render));
        presets.forEach((b) => b.addEventListener('click', () => {
            b.dataset.preset.split(',').forEach((n, i) => { inputs[ORDER[i]].value = n; });
            render();
        }));
        render();
    }

    // Copy link. The canonical URL, not location.href, so a link copied from a
    // page carrying ?utm= or a cache-buster stays clean.
    document.querySelectorAll('[data-copy-link]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const url = location.origin + location.pathname;
            try { await navigator.clipboard.writeText(url); } catch (e) { return; }
            const was = btn.textContent;
            btn.textContent = 'Link copied';
            setTimeout(() => { btn.textContent = was; }, 1600);
        });
    });
})();
