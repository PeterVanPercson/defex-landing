/*
 * Glyph Portal © 2026 Christian Katzmann. MIT.
 * Origin: UsefulPortal.astro on https://ktzm.dk → UsefulPortal.tsx → ClarityPortal.tsx.
 * A scroll-driven camera through live type. Keep this notice with copies.
 *
 * Ported from the React component to plain JS for defexrobotics.com, which
 * keeps zero front-end dependencies. The ink scan, the camera, the roll and
 * the letter picker are the component's own. What changed for the Why us
 * page: the pin sits under the site's sticky nav, the field seen through
 * the letters is a world of factory parts drawn in SVG, and once the camera
 * is through, --gp-after tells the parts how far the copy has scrolled past
 * them so they can drift at their own depths.
 */
(() => {
    const section = document.querySelector('[data-portal]');
    if (!section) return;

    const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
    const smooth = (a, b, n) => {
        const t = clamp((n - a) / (b - a));
        return t * t * (3 - 2 * t);
    };
    const FALLBACK = '"Arial Black", Arial, sans-serif';
    const WEIGHT = 900;

    const text = (section.dataset.word || 'TEST').trim().normalize('NFC');
    const length = clamp(Number(section.dataset.length) || 1.9, 1, 8);
    const family = section.dataset.font || '"Source Serif 4"';
    const pin = section.querySelector('.portal__pin');
    const field = section.querySelector('.portal__field');
    const art = section.querySelector('.portal__art');
    const clip = section.querySelector('#portal-clip');
    const glyph = section.querySelector('.portal__glyph');
    const dims = section.querySelector('.portal__dims');
    const cross = section.querySelector('.portal__cross');
    const choices = section.querySelector('.portal__choices');
    const buttons = [...choices.querySelectorAll('button')];
    const probe = section.querySelector('.portal__probe');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');

    /** Largest opaque square, in linear time. Unlike a stem guess, it works in O, S and Ø. */
    function interior(context, char, font) {
        const canvas = context.canvas;
        context.font = font;
        const m = context.measureText(char);
        const pad = 8;
        const left = Math.ceil(m.actualBoundingBoxLeft);
        const ascent = Math.ceil(m.actualBoundingBoxAscent);
        canvas.width = Math.max(1, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2);
        canvas.height = Math.max(1, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2);
        context.font = font;
        context.fontKerning = 'none';
        context.fillText(char, pad + left, pad + ascent);
        const { width, height } = canvas;
        const pixels = context.getImageData(0, 0, width, height).data;
        const rows = new Uint16Array(width + 1);
        let size = 0, bx = 0, by = 0;
        for (let y = 0; y < height; y++) {
            let diagonal = 0;
            for (let x = 0; x < width; x++) {
                const above = rows[x + 1];
                rows[x + 1] = pixels[(y * width + x) * 4 + 3] > 245
                    ? Math.min(above, rows[x], diagonal) + 1 : 0;
                diagonal = above;
                if (rows[x + 1] > size) { size = rows[x + 1]; bx = x; by = y; }
            }
        }
        if (size < 3) return null;
        // Scanned at 3x the SVG size. A disk inscribed in the square, with
        // room for the two rasterisers to disagree.
        return { x: (bx + 1 - size / 2 - pad - left) / 3, y: (by + 1 - size / 2 - pad - ascent) / 3, radius: (size / 2 - 1) / 3 };
    }

    // The face is chosen once, before anything is measured: a late font swap
    // would move the ink out from under the camera.
    const loading = document.fonts && document.fonts.load
        ? Promise.race([
            document.fonts.load(`${WEIGHT} 100px ${family}`, text),
            new Promise((done) => setTimeout(() => done([]), 2500)),
        ])
        : Promise.resolve([]);
    loading
        .then((faces) => mount(faces && faces.length && document.fonts.check(`${WEIGHT} 100px ${family}`, text) ? `${family}, ${FALLBACK}` : FALLBACK))
        .catch(() => mount(FALLBACK));

    function mount(font) {
        glyph.style.fontFamily = font;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        let raf = 0, dirty = true, active = true, ready = false, seen = false;
        let W = 1, H = 1, travel = 1, startScale = 1, endScale = 1;
        let center = { x: 0, y: 0 }, target = null, choosing = false;
        let candidates = [], letters = [];
        let bounds = { x: 0, y: 0, width: 1, height: 1 };

        function readInk() {
            if (!context) return false;
            const scanFont = `${WEIGHT} 300px ${font}`;
            context.font = `${WEIGHT} 100px ${font}`;
            context.fontKerning = 'none';
            const metrics = context.measureText(text);
            const advances = Array.from({ length: text.length }, (_, i) => context.measureText(text.slice(0, i)).width);
            // SVG getBBox includes the font's line box in some engines. Frame the visible ink instead.
            bounds = {
                x: -metrics.actualBoundingBoxLeft, y: -metrics.actualBoundingBoxAscent,
                width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
                height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
            };
            if (!bounds.width || !bounds.height) return false;
            center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
            const focus = section.dataset.focus;
            const requested = focus ? text.indexOf(focus.normalize('NFC')) : -1;
            let offset = 0;
            candidates = [];
            letters = [];
            for (const char of Array.from(text)) {
                context.font = `${WEIGHT} 100px ${font}`;
                const m = context.measureText(char);
                letters.push({
                    index: offset, x: advances[offset] - m.actualBoundingBoxLeft, y: -m.actualBoundingBoxAscent,
                    width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
                    height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
                });
                const found = interior(context, char, scanFont);
                if (found) candidates.push({ ...found, x: found.x + advances[offset], index: offset });
                offset += char.length;
            }
            target = candidates.find((c) => c.index === requested)
                ?? [...candidates].sort((a, b) => b.radius - a.radius || Math.abs(a.x - center.x) - Math.abs(b.x - center.x))[0]
                ?? null;
            return true;
        }

        function select(next) {
            target = next;
            endScale = target ? Math.max(startScale, Math.hypot(W, H) / (target.radius * 1.35)) : startScale;
            section.dataset.focusIndex = String(target ? target.index : -1);
            for (const button of buttons) {
                const index = Number(button.dataset.letter);
                button.disabled = !candidates.some((c) => c.index === index);
                button.setAttribute('aria-checked', String(target ? index === target.index : false));
                button.tabIndex = target && index === target.index ? 0 : -1;
            }
            // A dimension line under the word and a cross on the ink the camera
            // will enter, drawn at one screen pixel whatever the zoom.
            const u = 1 / startScale;
            const y = bounds.y + bounds.height + 26 * u;
            const x = bounds.x, right = x + bounds.width;
            dims.setAttribute('d', `M${x} ${y}H${right}M${x} ${y - 5 * u}v${10 * u}M${right} ${y - 5 * u}v${10 * u}`);
            dims.setAttribute('stroke-width', String(u));
            cross.setAttribute('d', target ? `M${target.x - 9 * u} ${target.y}h${18 * u}M${target.x} ${target.y - 9 * u}v${18 * u}` : '');
            cross.setAttribute('stroke-width', String(1.5 * u));
        }

        function stickyTop() {
            return parseFloat(getComputedStyle(pin).top) || 0;
        }
        function position() {
            return clamp((stickyTop() - section.getBoundingClientRect().top) / travel);
        }

        function paint(progress) {
            const still = motion.matches || !seen || !target;
            const p = still ? 0 : progress;
            const t = clamp(p / 0.78);
            const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
            const scale = Math.exp(Math.log(startScale) + Math.log(endScale / startScale) * eased);
            const blend = endScale === startScale ? 0 : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
            const cx = center.x + ((target ? target.x : center.x) - center.x) * blend;
            const cy = center.y + ((target ? target.y : center.y) - center.y) * blend;
            const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
            const transform = `translate(${W / 2} ${H * 0.46 + H * 0.04 * eased}) scale(${scale}) rotate(${roll}) translate(${-cx} ${-cy})`;
            // Scale stays on the clip to avoid text paint limits. Text-local
            // translation follows page zoom in WebKit; translation on an HTML
            // clip reference does not.
            const radians = roll * Math.PI / 180;
            const dx = W / 2 / scale, dy = (H * 0.46 + H * 0.04 * eased) / scale;
            clip.setAttribute('transform', `scale(${scale}) rotate(${roll})`);
            glyph.setAttribute('transform', `translate(${Math.cos(radians) * dx + Math.sin(radians) * dy - cx} ${-Math.sin(radians) * dx + Math.cos(radians) * dy - cy})`);
            dims.parentNode.setAttribute('transform', transform);
            dims.parentNode.style.opacity = String(1 - smooth(0.015, 0.17, p));
            choosing = !still && p < 0.04;
            choices.inert = !choosing;
            section.dataset.choosing = String(choosing);
            // Drop the clip only once the camera has already filled the view with ink.
            field.style.clipPath = t >= 1 ? 'none' : 'url(#portal-clip)';
            section.style.setProperty('--gp-caption', String(1 - smooth(0.01, 0.16, p)));
            section.style.setProperty('--gp-field-scale', String(1 + 0.12 * smooth(0, 0.82, p)));
            section.dataset.entered = String(p >= 0.9);
            section.style.setProperty('--gp-reveal', String(still ? 1 : smooth(0.78, 0.9, p)));
            // past the dive, how far the copy has scrolled over the parts
            const past = stickyTop() - section.getBoundingClientRect().top - travel;
            section.style.setProperty('--gp-after', still ? '0' : clamp(past / Math.max(1, section.offsetHeight - travel - H)).toFixed(4));
        }

        function layout() {
            if (!section.clientWidth) return;
            const nav = stickyTop() || parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 64;
            const view = Math.max(1, probe.offsetHeight - nav);
            H = motion.matches ? Math.min(view * 0.75, 520) : view;
            section.style.setProperty('--gp-height', `${H}px`);
            section.style.setProperty('--gp-length', String(length));
            W = pin.clientWidth;
            travel = H * length;
            art.setAttribute('viewBox', `0 0 ${W} ${H}`);
            if (!ready) ready = readInk();
            if (!ready) return;
            // Room above for the eyebrow and below for the headline.
            const wordHeight = Math.min(H * 0.34, Math.max(28, H - 300));
            // a phone is narrow enough that the word can take a little more of it
            startScale = Math.min(W * (W < 600 ? 0.9 : 0.84) / bounds.width, wordHeight / bounds.height);
            select(target);
            for (const button of buttons) {
                const letter = letters.find((item) => item.index === Number(button.dataset.letter));
                if (!letter) continue;
                Object.assign(button.style, {
                    left: `${W / 2 + (letter.x - center.x) * startScale}px`,
                    top: `${H * 0.46 + (letter.y - center.y) * startScale - Math.max(0, 44 - letter.height * startScale) / 2}px`,
                    width: `${Math.max(1, letter.width * startScale)}px`,
                    height: `${Math.max(44, letter.height * startScale)}px`,
                });
            }
            section.style.setProperty('--gp-word-top', `${H * 0.46 - bounds.height * startScale / 2}px`);
            section.style.setProperty('--gp-word-bottom', `${H * 0.46 + bounds.height * startScale / 2}px`);
            section.dataset.ready = 'true';
            section.dataset.motion = !motion.matches && seen && target ? 'on' : 'off';
        }

        function frame(time) {
            raf = 0;
            // The first real animation frame proves the browser is rendering;
            // until then the page stays in reading flow.
            if (time !== undefined && !seen) { seen = true; dirty = true; }
            if (dirty) { dirty = false; layout(); }
            if (ready) paint(position());
        }
        const schedule = () => { if (!raf && active) raf = requestAnimationFrame(frame); };
        const resize = () => { cancelAnimationFrame(raf); raf = 0; dirty = true; frame(); };

        function choose(event) {
            if (!choosing || position() >= 0.04) return;
            const button = event.target.closest('[data-letter]');
            const next = button && candidates.find((c) => c.index === Number(button.dataset.letter));
            if (!next || next === target) return;
            select(next);
            paint(position());
        }
        function navigate(event) {
            if (!choosing || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const current = candidates.indexOf(target);
            const index = event.key === 'Home' ? 0 : event.key === 'End' ? candidates.length - 1
                : (current + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + candidates.length) % candidates.length;
            const button = buttons.find((b) => Number(b.dataset.letter) === candidates[index].index);
            if (button) button.focus({ preventScroll: true });
        }
        choices.addEventListener('pointerover', choose);
        choices.addEventListener('click', choose);
        choices.addEventListener('focusin', choose);
        choices.addEventListener('keydown', navigate);

        new ResizeObserver(resize).observe(section);
        new IntersectionObserver(([entry]) => {
            active = entry.isIntersecting;
            if (active) { dirty = true; schedule(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
        }, { rootMargin: '100% 0px' }).observe(section);
        addEventListener('scroll', schedule, { passive: true });
        addEventListener('resize', resize);
        if (window.visualViewport) visualViewport.addEventListener('resize', resize);
        motion.addEventListener('change', resize);
        frame();
        schedule();
    }

})();
