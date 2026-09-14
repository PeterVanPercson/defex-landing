(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reading progress and the server-rendered, expandable contents list.
    const bar = document.querySelector('.progress__bar');
    const links = Array.from(document.querySelectorAll('.sections__link'));
    const heads = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
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
    }
    function ask() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    paint();

    // The bench: trials per hour = 3600 / (action + check + reset + recovery).
    // The static bar shows each term's share of the complete cycle.
    const bench = document.getElementById('bench');
    if (bench) {
        const ORDER = ['action', 'check', 'reset', 'recovery'];
        const inputs = {};
        bench.querySelectorAll('input[type="range"]').forEach((i) => { inputs[i.name] = i; });
        const outs = {};
        bench.querySelectorAll('[data-out]').forEach((o) => { outs[o.dataset.out] = o; });
        const segs = {};
        bench.querySelectorAll('.bench__seg').forEach((s) => { segs[s.dataset.phase] = s; });
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
            const key = v.join(',');
            presets.forEach((b) => {
                const selected = b.dataset.preset === key;
                b.classList.toggle('is-on', selected);
                b.setAttribute('aria-pressed', String(selected));
            });
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
            const url = document.querySelector('link[rel="canonical"]')?.href || location.origin + location.pathname;
            const was = btn.textContent;
            try {
                await navigator.clipboard.writeText(url);
                btn.textContent = 'Link copied';
            } catch (e) {
                btn.textContent = 'Copy unavailable';
            }
            setTimeout(() => { btn.textContent = was; }, 2200);
        });
    });
})();
