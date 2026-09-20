(() => {
    // The founders' backdrop: 21st.dev's "grid pulse", which Husan picked,
    // ported from its React source to plain JS so the site keeps zero
    // dependencies. A fine grid that takes ink where the pointer passes and
    // lets it go a moment later, with a few cells lighting on their own so it
    // is alive on arrival and on a phone. The component runs a rainbow down
    // the field; here every cell is one of the site's own three colours:
    // mostly ink, some paper white, a little orange.
    //
    // Decoration only: hidden from assistive tech, transparent to the
    // pointer, one canvas that sleeps whenever nothing is lit, paused off
    // screen, and still for readers who ask for reduced motion.
    const fields = document.querySelectorAll('[data-gridpulse]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    if (!fields.length || motion.matches) return;

    // How far from the pointer a cell can still catch ink, in cells.
    const REACH = 5.5;
    // How many cells light on their own each beat, so the grid is never dead.
    const AMBIENT = 5;
    // A lid, so a fast sweep cannot ink the whole field at once.
    const MAX_LIT = 900;
    // Ink strengths, light to dark, so a sweep reads as a field of greys
    // rather than one flat stamp. Cells nearer the pointer take the dark end.
    const INK = [.1, .17, .26, .38, .52, .7, .9];
    // Out of every hundred cells: this many paper white, this many orange.
    // Orange gathers at the heart of the trail, white out at its edge.
    const WHITE = .14;
    const ORANGE = .06;
    // How faint a cell goes right behind a line of text, and how far from
    // it, in px, the cell takes to come back to full strength.
    const FAINT = .13;
    const FADE = 36;
    // Clearing kept around each line of text, in px.
    const PAD = 5;
    // The share of the field's height over which it fades out at the top and
    // at the bottom, matching the mask on the hairlines in site.css.
    const EDGE = .16;
    const FADE_IN = 160;
    const FADE_OUT = 750;

    const easeOut = (t) => 1 - (1 - t) ** 2;
    const easeIn = (t) => t * t;

    fields.forEach(mount);

    function mount(el) {
        const paper = el.querySelector('canvas');
        const ctx = paper && paper.getContext('2d');
        if (!ctx) return;
        const scope = el.parentElement || document.body;
        const look = getComputedStyle(el);
        const cell = parseFloat(look.getPropertyValue('--gp-cell')) || 10;
        const ink = look.color;
        const accent = look.getPropertyValue('--accent').trim() || '#FF5A1F';

        let cols = 1;
        let rows = 1;
        let width = 0;
        let height = 0;
        let clear = [];
        const cells = new Map();

        // Hold back from the lines of text, not the boxes that hold them: a
        // paragraph set to a measure keeps that width on its short last line
        // too, and the box would keep a band of cells dark where there is
        // nothing to read. A photo has no lines, so its box is used.
        function measureText() {
            const bounds = el.getBoundingClientRect();
            clear = [...scope.querySelectorAll('[data-grid-avoid]')].flatMap((node) => {
                const range = document.createRange();
                range.selectNodeContents(node);
                const lines = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
                const boxes = lines.length ? lines : [node.getBoundingClientRect()];
                return boxes.map((r) => ({
                    left: r.left - bounds.left - PAD,
                    top: r.top - bounds.top - PAD,
                    right: r.right - bounds.left + PAD,
                    bottom: r.bottom - bounds.top + PAD,
                }));
            });
        }

        function measure() {
            width = el.clientWidth;
            height = el.clientHeight;
            cols = Math.max(1, Math.ceil(width / cell));
            rows = Math.max(1, Math.ceil(height / cell));
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            paper.width = Math.round(width * dpr);
            paper.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // resizing wiped the canvas, so every lit cell is drawn again
            for (const c of cells.values()) c.shown = -1;
            measureText();
            wake();
        }

        // How strong a cell may be, by its distance from the nearest line of
        // text. Cells behind the words go faint rather than blank: a hole cut
        // in the grid reads as a fault, a dip reads as depth. Near the top and
        // bottom of the field it fades with the hairlines.
        function allowance(col, row) {
            const x = col * cell + cell / 2;
            const y = row * cell + cell / 2;
            const edge = Math.max(0, Math.min(1, y / (height * EDGE), (height - y) / (height * EDGE)));
            let nearest = Infinity;
            for (const r of clear) {
                const dx = Math.max(r.left - x, 0, x - r.right);
                const dy = Math.max(r.top - y, 0, y - r.bottom);
                nearest = Math.min(nearest, Math.hypot(dx, dy));
                if (nearest === 0) break;
            }
            if (nearest === Infinity) return edge;
            return edge * (FAINT + (1 - FAINT) * Math.min(1, nearest / FADE));
        }

        // near: 1 under the pointer, falling towards 0 at the edge of its reach
        function pick(near) {
            const roll = Math.random();
            if (roll < ORANGE * 2 * near) return { colour: accent, tint: .7 + .3 * Math.random() };
            if (roll > 1 - WHITE * 2 * (1 - near)) return { colour: '#FFFFFF', tint: 1 };
            const t = Math.min(1, Math.max(0, near * (.45 + .55 * Math.random()) + (Math.random() - .5) * .3));
            return { colour: ink, tint: INK[Math.round(t * (INK.length - 1))] };
        }

        // One loop draws every cell; it runs only while something is lit. It
        // touches only the cells whose strength changed since the last frame,
        // never the whole canvas: the field is the size of the section, and
        // wiping it every frame cost more than everything drawn on it.
        let frame = 0;
        function draw(now) {
            frame = 0;
            if (motion.matches || document.hidden) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cells.clear();
                return;
            }
            for (const [key, c] of cells) {
                const x = c.col * cell;
                const y = c.row * cell;
                let alpha;
                if (now < c.until) {
                    alpha = easeOut(Math.min(1, (now - c.born) / FADE_IN));
                } else {
                    const t = (now - c.until) / FADE_OUT;
                    if (t >= 1) {
                        ctx.clearRect(x, y, cell, cell);
                        cells.delete(key);
                        continue;
                    }
                    alpha = 1 - easeIn(t);
                }
                alpha *= c.tint * c.dim;
                if (alpha === c.shown) continue;
                c.shown = alpha;
                ctx.clearRect(x, y, cell, cell);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = c.colour;
                // inset by the hairline, so the grid still shows between lit cells
                ctx.fillRect(x + 1, y + 1, cell - 1, cell - 1);
            }
            ctx.globalAlpha = 1;
            if (cells.size) frame = requestAnimationFrame(draw);
        }
        function wake() {
            if (!frame) frame = requestAnimationFrame(draw);
        }

        // Lights one cell, unless it is off the grid or already lit.
        function light(col, row, hold, near) {
            if (col < 0 || row < 0 || col >= cols || row >= rows) return;
            if (cells.size >= MAX_LIT) return;
            const key = col + ',' + row;
            const now = performance.now();
            const lit = cells.get(key);
            if (lit && now < lit.until) return;
            // A cell caught again while fading picks up from where it had got
            // to, instead of blinking out and back in.
            let born = now;
            if (lit) {
                const faded = 1 - easeIn(Math.min(1, (now - lit.until) / FADE_OUT));
                born = now - (1 - Math.sqrt(1 - faded)) * FADE_IN;
            }
            const tone = lit || pick(near);
            cells.set(key, { col, row, colour: tone.colour, tint: tone.tint, dim: allowance(col, row), born, until: now + hold, shown: lit ? lit.shown : -1 });
            wake();
        }

        // The pointer paints. Cells further from it catch ink less often, so
        // the edge of the trail breaks up instead of moving as a block.
        let pending = 0;
        let at = null;
        let visible = false;
        function paint() {
            pending = 0;
            if (!at || motion.matches || document.hidden) return;
            const cx = Math.floor(at.x / cell);
            const cy = Math.floor(at.y / cell);
            const span = Math.ceil(REACH);
            if (cx < -span || cy < -span || cx > cols + span || cy > rows + span) return;
            for (let dy = -span; dy <= span; dy++) {
                for (let dx = -span; dx <= span; dx++) {
                    const away = Math.hypot(dx, dy);
                    if (away > REACH) continue;
                    if (Math.random() > 1 - away / (REACH + .6)) continue;
                    light(cx + dx, cy + dy, 260 + Math.random() * 900, 1 - away / (REACH + 1));
                }
            }
        }
        // Listened for on the window: the grid sits under the content and
        // never receives the pointer itself.
        window.addEventListener('pointermove', (event) => {
            if (!visible || motion.matches || document.hidden) return;
            const bounds = el.getBoundingClientRect();
            at = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
            if (!pending) pending = requestAnimationFrame(paint);
        }, { passive: true });

        // A few cells find their own way on. Paused while out of sight.
        function drift() {
            setTimeout(drift, 1400 + Math.random() * 1800);
            if (motion.matches || document.hidden) return;
            if (!visible) return;
            for (let i = 0; i < AMBIENT; i++) {
                light(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows), 900 + Math.random() * 1600, .2 + .5 * Math.random());
            }
        }
        setTimeout(drift, 500);
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(el);

        new ResizeObserver(measure).observe(el);
        // The copy rises into place as it is revealed, and moves again once
        // the web fonts arrive: measure the lines where they settle.
        let recheck = 0;
        scope.addEventListener('transitionend', () => {
            if (!recheck) recheck = requestAnimationFrame(() => { recheck = 0; measureText(); });
        });
        if (document.fonts) document.fonts.ready.then(measureText).catch(() => {});
    }
})();
