(() => {
    const NS = 'http://www.w3.org/2000/svg';
    const VB_W = 696;
    const VB_H = 316;

    // Background ribbons, after the "Background Paths" component (kokonutd on
    // 21st.dev): 36 bezier ribbons a side, thin to thick and faint to darker,
    // the component's own curve. Drawn once here as plain SVG and moved by
    // the clock at the bottom of this file.
    //
    // Four things are deliberately not the component's way, each for a
    // reason that showed on screen:
    // - The curve is mirrored in the geometry (x -> 696 - x), not with a CSS
    //   transform on the <svg>. The ribbons then come in from the right and
    //   fall away down-left, off the left-aligned copy; and a transformed
    //   sibling made Chrome re-rasterise the copy while the lines moved.
    // - Phases and periods are spread evenly, not Math.random(): random
    //   phases clump, and the hero was empty one moment and piled the next.
    // - The fade to paper is a gradient on the stroke, not a mask-image on
    //   the container, which is repainted every frame under animation.
    // - Stroke widths are CSS pixels over the render scale, so a phone gets
    //   the same lines as a desktop instead of sub-pixel shimmer.
    document.querySelectorAll('[data-paths]').forEach((host, n) => {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'paths__svg');
        svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
        // a short band (the phone layout) is filled edge to edge instead, so
        // the lines run its full height and the fade has room to work
        svg.setAttribute('shape-rendering', 'geometricPrecision');

        const id = `paths-fade-${n}`;
        const defs = document.createElementNS(NS, 'defs');
        const fade = document.createElementNS(NS, 'linearGradient');
        fade.setAttribute('id', id);
        fade.setAttribute('gradientUnits', 'userSpaceOnUse');
        fade.setAttribute('x1', '0'); fade.setAttribute('y1', '0');
        fade.setAttribute('x2', '0'); fade.setAttribute('y2', String(VB_H));
        // behind the article head the strands run at about 35 degrees, so the
        // fade runs along them; top to bottom would end them all on one line
        if (host.classList.contains('paths--post')) { fade.setAttribute('x1', String(VB_W)); fade.setAttribute('x2', String(Math.round(VB_W * 0.4))); }
        const stops = [[0, 1], [0.7, 1], [1, 0]].map(([offset, alpha]) => {
            const stop = document.createElementNS(NS, 'stop');
            stop.setAttribute('offset', String(offset));
            stop.setAttribute('stop-color', 'currentColor');
            stop.setAttribute('stop-opacity', String(alpha));
            fade.appendChild(stop);
            return stop;
        });
        defs.appendChild(fade);
        svg.appendChild(defs);

        const lines = [];
        let k = 0;
        for (const side of [1, -1]) {
            // The second family fans about 350 units further left than the first
            // and its tails ran under the copy; moved right, both sit in the
            // right half and weave, which is the look.
            const mx = (x) => VB_W - x + (side < 0 ? 300 : 0);
            for (let i = 0; i < 36; i++, k++) {
                const s = i * 5 * side;
                const r = i * 6;
                const path = document.createElementNS(NS, 'path');
                path.setAttribute('class', 'paths__line');
                path.setAttribute('d',
                    `M${mx(-380 + s)} ${-189 - r}C${mx(-380 + s)} ${-189 - r} ${mx(-312 + s)} ${216 - r} ${mx(152 - s)} ${343 - r}` +
                    `C${mx(616 - s)} ${470 - r} ${mx(684 - s)} ${875 - r} ${mx(684 - s)} ${875 - r}`);
                path.setAttribute('pathLength', '1');
                path.setAttribute('stroke', `url(#${id})`);
                path.setAttribute('stroke-opacity', (0.12 + i * 0.024).toFixed(3));
                // 22-30 s, five distinct periods; phase strides by 7 of 36 so
                // neighbours are never in step and the whole cycle is covered
                const dur = 22 + (k % 5) * 2;
                const phase = ((i * 7) % 36) / 36 + (side < 0 ? 0.5 / 36 : 0);
                lines.push({ path, px: 0.6 + i * 0.037, dur, phase });
                svg.appendChild(path);
            }
        }
        host.appendChild(svg);

        // Widths follow the render scale. A short band (the phone layout, with
        // nothing written under it) is filled edge to edge, panned so the bundle
        // spans it, and fades IN from its top edge and runs full into the rule
        // below; a tall box fades OUT before the copy under it.
        const size = () => {
            const w = host.clientWidth;
            const h = host.clientHeight;
            if (!w || !h) return;
            const short = h < 320;
            svg.setAttribute('viewBox', short ? `120 0 ${VB_W} ${VB_H}` : `0 0 ${VB_W} ${VB_H}`);
            svg.setAttribute('preserveAspectRatio', short ? 'xMidYMid slice' : 'xMidYMid meet');
            stops[0].setAttribute('stop-opacity', short ? '0' : '1');
            stops[1].setAttribute('offset', short ? '0.3' : '0.55');
            stops[2].setAttribute('stop-opacity', short ? '1' : '0');
            const scale = short ? Math.max(w / VB_W, h / VB_H) : Math.min(w / VB_W, h / VB_H);
            for (const { path, px } of lines) path.setAttribute('stroke-width', (px / scale).toFixed(3));
        };
        size();
        if ('ResizeObserver' in window) new ResizeObserver(size).observe(host);
        else addEventListener('resize', size);

        // The motion. One frame writes every ribbon's dash, offset and
        // opacity: the dash grows from .3 of the path to all of it and back
        // while it slides two path-lengths along, and the ribbon breathes
        // between .3 and .6. The pattern always sums to one path length, so
        // the loop is seamless. Driven from here rather than CSS for two
        // reasons that both showed in a trace: CSS animations repaint at the
        // display's rate, 120 times a second on a ProMotion Mac, and ribbons
        // this slow look the same at 25; and CSS keeps animating, and
        // repainting, while the hero is scrolled off the top of a long read.
        // Reduce Motion gets a single still frame.
        const STEP = 40;   // ms between frames, 25 fps
        let last = 0;
        let raf = 0;
        let seen = true;
        const draw = (now) => {
            for (const l of lines) {
                const p = ((now / 1000) / l.dur + l.phase) % 1;
                const tri = p < 0.5 ? p * 2 : (1 - p) * 2;
                const dash = 0.3 + 0.7 * tri;
                l.path.setAttribute('stroke-dasharray', `${dash.toFixed(4)} ${(1 - dash).toFixed(4)}`);
                l.path.setAttribute('stroke-dashoffset', (-2 * p).toFixed(4));
                l.path.style.opacity = (0.3 + 0.3 * tri).toFixed(3);
            }
        };
        const frame = (now) => {
            raf = 0;
            if (!seen || document.hidden) return;
            if (now - last >= STEP) { last = now; draw(now); }
            raf = requestAnimationFrame(frame);
        };
        const run = () => { if (!raf && seen && !document.hidden) raf = requestAnimationFrame(frame); };
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
            draw(0);
        } else {
            if ('IntersectionObserver' in window) {
                new IntersectionObserver((entries) => { seen = entries[0].isIntersecting; run(); }).observe(host);
            }
            document.addEventListener('visibilitychange', run);
            run();
        }
    });
})();
