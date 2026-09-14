(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NS = 'http://www.w3.org/2000/svg';

    // Background ribbons, after the "Background Paths" component: 36 bezier
    // ribbons a side, thin to thick and faint to darker, each sliding along
    // itself on its own 20-30 s clock. Drawn once here as plain SVG; the
    // motion is one CSS keyframe on .paths__line. The negative delay starts
    // every ribbon mid-flow, so nothing lines up on load.
    document.querySelectorAll('[data-paths]').forEach((host) => {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'paths__svg');
        svg.setAttribute('viewBox', '0 0 696 316');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        for (const side of [1, -1]) {
            for (let i = 0; i < 36; i++) {
                const s = i * 5 * side;
                const r = i * 6;
                const path = document.createElementNS(NS, 'path');
                path.setAttribute('class', 'paths__line');
                path.setAttribute('d',
                    `M${-380 + s} ${-189 - r}C${-380 + s} ${-189 - r} ${-312 + s} ${216 - r} ${152 - s} ${343 - r}` +
                    `C${616 - s} ${470 - r} ${684 - s} ${875 - r} ${684 - s} ${875 - r}`);
                path.setAttribute('pathLength', '1');
                path.setAttribute('stroke-width', (0.5 + i * 0.03).toFixed(2));
                path.setAttribute('stroke-opacity', (0.08 + i * 0.025).toFixed(3));
                const dur = 20 + Math.random() * 10;
                path.style.setProperty('--dur', `${dur.toFixed(1)}s`);
                path.style.setProperty('--delay', `${(-Math.random() * dur).toFixed(1)}s`);
                svg.appendChild(path);
            }
        }
        host.appendChild(svg);
    });

    // The hero title rises a letter at a time, the way the component's does.
    // The text is kept whole for assistive tech in aria-label; the letters
    // are decoration. Reduce Motion gets the title as it is.
    document.querySelectorAll('[data-rise]').forEach((el) => {
        if (reduce) return;
        const text = el.textContent.trim();
        const words = text.split(' ');
        el.setAttribute('aria-label', text);
        el.textContent = '';
        words.forEach((word, w) => {
            const span = document.createElement('span');
            span.className = 'rise__word';
            span.setAttribute('aria-hidden', 'true');
            Array.from(word).forEach((ch, l) => {
                const letter = document.createElement('span');
                letter.className = 'rise__letter';
                letter.textContent = ch;
                letter.style.setProperty('--d', `${w * 100 + l * 30}ms`);
                span.appendChild(letter);
            });
            el.appendChild(span);
            if (w < words.length - 1) el.appendChild(document.createTextNode(' '));
        });
        el.classList.add('is-rising');
    });
})();
