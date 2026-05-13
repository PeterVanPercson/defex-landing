// defex — intro overlay fade + animated ASCII cup + counters + uptime

// ===== Intro overlay (3-dot pulse, ~2s) =====
(() => {
    const intro = document.getElementById('intro');
    const body = document.body;
    if (!intro) return;

    const reduced = window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
        intro.remove();
        body.classList.remove('is-loading');
        return;
    }

    // Total animation: dot stagger ends at 1.25s, pulse runs 1.45–2.00s.
    // Fade overlay starting at 2.05s, remove at 2.55s.
    setTimeout(() => {
        intro.classList.add('is-done');
        body.classList.remove('is-loading');
    }, 2050);
    setTimeout(() => intro.remove(), 2600);
})();


// ===== Animated factory line — cycles through fabric / pcb / sheet / cup =====
(() => {
    const frame = document.getElementById('scanFrame');
    if (!frame) return;

    const BELT_LINE = `<span class="belt">${'━'.repeat(56)}</span>`;
    const DEFECT = '<span class="defect">╳</span>';

    // Each sample: 8 chars wide × 5 rows tall. `failNote` is shown on FAIL.
    const SAMPLES = [
        {
            name: 'fabric',
            ok: [
                '┌──────┐',
                '│▒▓▒▓▒▓│',
                '│▓▒▓▒▓▒│',
                '│▒▓▒▓▒▓│',
                '└──────┘',
            ],
            bad: [
                '┌──────┐',
                '│▒▓▒▓▒▓│',
                '│▓' + DEFECT + '▓▒▓▒│',
                '│▒▓▒▓▒▓│',
                '└──────┘',
            ],
            failNote: 'stitch defect',
        },
        {
            name: 'pcb',
            ok: [
                '┌──────┐',
                '│ ●━━● │',
                '│ ┃  ┃ │',
                '│ ●━━● │',
                '└──────┘',
            ],
            bad: [
                '┌──────┐',
                '│ ●━━● │',
                '│ ┃  ' + DEFECT + ' │',
                '│ ●━━● │',
                '└──────┘',
            ],
            failNote: 'solder bridge',
        },
        {
            name: 'sheet',
            ok: [
                '┌──────┐',
                '│      │',
                '│      │',
                '│      │',
                '└──────┘',
            ],
            bad: [
                '┌──────┐',
                '│      │',
                '│  ' + DEFECT + '   │',
                '│      │',
                '└──────┘',
            ],
            failNote: 'surface dent',
        },
        {
            name: 'cup',
            ok: [
                '╭─────╮ ',
                '│     │╮',
                '│ ▒▒▒ ││',
                '│     │╯',
                '╰─────╯ ',
            ],
            bad: [
                '╭──' + DEFECT + '──╮ ',
                '│     │╮',
                '│ ▒▒▒ ││',
                '│     │╯',
                '╰─────╯ ',
            ],
            failNote: 'rim chip',
        },
    ];

    function makeFrame(x, glyph, label) {
        const rows = [BELT_LINE];
        for (let r = 0; r < 5; r++) {
            let line = ' '.repeat(x) + glyph[r];
            if (label && r === 2) {
                line += '   ' + label;
            }
            rows.push(line);
        }
        rows.push(BELT_LINE);
        return rows.join('\n');
    }

    function buildCycle(sample, isPass) {
        const finalGlyph = isPass ? sample.ok : sample.bad;
        const result = isPass
            ? '<span class="ok">✓ PASS</span>'
            : `<span class="fail">✕ FAIL · ${sample.failNote}</span>`;
        return [
            makeFrame(2,  sample.ok,  null),
            makeFrame(14, sample.ok,  null),
            makeFrame(24, sample.ok,  '<span class="scan-act">◉ scanning ...</span>'),
            makeFrame(24, finalGlyph, result),
            makeFrame(36, finalGlyph, null),
            makeFrame(48, finalGlyph, null),
        ];
    }

    const $status = document.getElementById('scanStatus');
    const $thru   = document.getElementById('scanThru');
    const $fail   = document.getElementById('scanFail');
    const $up     = document.getElementById('scanUp');

    let sampleIdx = 0;
    let isPass = true;
    let frames = buildCycle(SAMPLES[sampleIdx], isPass);
    let i = 0;

    let thru  = 4127;
    let fails = 38;
    $thru.textContent = thru.toLocaleString();
    $fail.textContent = fails;

    function tick() {
        frame.innerHTML = frames[i];

        if (i === 0) {
            $status.textContent = 'belt';
            $status.style.color = '';
        } else if (i === 2) {
            $status.textContent = 'scanning';
            $status.style.color = '';
        } else if (i === 3) {
            if (isPass) {
                $status.textContent = 'pass';
                $status.style.color = 'var(--ok)';
                thru += 1;
                $thru.textContent = thru.toLocaleString();
            } else {
                $status.textContent = 'fail';
                $status.style.color = 'var(--fail)';
                thru += 1;
                fails += 1;
                $thru.textContent = thru.toLocaleString();
                $fail.textContent = fails;
            }
        }

        i += 1;
        if (i >= frames.length) {
            i = 0;
            // Next product: cycle through samples with slight randomness.
            sampleIdx = (sampleIdx + 1 + Math.floor(Math.random() * 2)) % SAMPLES.length;
            isPass = Math.random() > 0.25;  // ~1 in 4 fails
            frames = buildCycle(SAMPLES[sampleIdx], isPass);
        }
    }

    tick();
    setInterval(tick, 520);

    // shift uptime — looks like the line has been running 2h 17m+ already
    const shiftStart = Date.now() - (2 * 3600 + 17 * 60) * 1000;
    function tickUp() {
        const sec = Math.floor((Date.now() - shiftStart) / 1000);
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        $up.textContent = `${h}:${m}`;
    }
    tickUp();
    setInterval(tickUp, 5000);
})();


// ===== Language toggle (EN / 中) =====
(() => {
    const root = document.documentElement;
    const buttons = document.querySelectorAll('.lang__btn');
    if (!buttons.length) return;

    function applyPlaceholders(lang) {
        document.querySelectorAll('[data-placeholder-en]').forEach(el => {
            const v = el.getAttribute('data-placeholder-' + lang);
            if (v) el.setAttribute('placeholder', v);
        });
    }

    function setLang(lang) {
        if (lang !== 'en' && lang !== 'zh') lang = 'en';
        root.setAttribute('lang', lang);
        try { localStorage.setItem('defex.lang', lang); } catch (e) {}
        applyPlaceholders(lang);
    }

    // Initial placeholder pass (lang was set pre-paint in base.html).
    applyPlaceholders(root.getAttribute('lang') || 'en');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
})();


// ===== Sticky CTA — fade in after scrolling past hero =====
(() => {
    const cta = document.getElementById('stickyCta');
    const hero = document.querySelector('.hero');
    if (!cta || !hero) return;

    function update() {
        const heroBottom = hero.offsetTop + hero.offsetHeight;
        const past = window.scrollY > heroBottom - 80;
        cta.classList.toggle('is-visible', past);
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
})();
