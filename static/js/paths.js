(() => {
    const NS = 'http://www.w3.org/2000/svg';
    const VB_W = 696;
    const VB_H = 316;

    // Background ribbons, after the "Background Paths" component (kokonutd on
    // 21st.dev): 36 bezier ribbons a side, thin to thick and faint to darker,
    // the component's own curve. Drawn once here as plain SVG; the motion is
    // one CSS keyframe per ribbon (see .paths__line) on its own clock.
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
        svg.setAttribute('preserveAspectRatio', host.clientHeight && host.clientHeight < 320 ? 'xMidYMid slice' : 'xMidYMid meet');
        svg.setAttribute('shape-rendering', 'geometricPrecision');

        const id = `paths-fade-${n}`;
        const defs = document.createElementNS(NS, 'defs');
        const fade = document.createElementNS(NS, 'linearGradient');
        fade.setAttribute('id', id);
        fade.setAttribute('gradientUnits', 'userSpaceOnUse');
        fade.setAttribute('x1', '0'); fade.setAttribute('y1', '0');
        fade.setAttribute('x2', '0'); fade.setAttribute('y2', String(VB_H));
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
                path.style.setProperty('--dur', `${dur}s`);
                path.style.setProperty('--delay', `${(-phase * dur).toFixed(2)}s`);
                lines.push({ path, px: 0.6 + i * 0.037 });
                svg.appendChild(path);
            }
        }
        host.appendChild(svg);

        // Widths follow the render scale; in a short band (the phone layout,
        // no copy under it) the fade starts later.
        const size = () => {
            const w = host.clientWidth;
            const h = host.clientHeight;
            if (!w || !h) return;
            const short = h < 320;
            svg.setAttribute('preserveAspectRatio', short ? 'xMidYMid slice' : 'xMidYMid meet');
            const scale = short ? Math.max(w / VB_W, h / VB_H) : Math.min(w / VB_W, h / VB_H);
            for (const { path, px } of lines) path.setAttribute('stroke-width', (px / scale).toFixed(3));
            stops[1].setAttribute('offset', short ? '0.55' : '0.7');
        };
        size();
        if ('ResizeObserver' in window) new ResizeObserver(size).observe(host);
        else addEventListener('resize', size);
    });
})();
