(() => {
    // The blog button's light travels the button's own border, so the motion
    // path has to be the button's rectangle in pixels. Measured here and
    // re-measured when the button changes size (the label wraps, the font
    // loads, the viewport turns).
    const trace = (el) => {
        el.style.setProperty('--path', `path('M 0 0 H ${el.offsetWidth} V ${el.offsetHeight} H 0 V 0')`);
    };
    document.querySelectorAll('[data-starbtn]').forEach((el) => {
        trace(el);
        if ('ResizeObserver' in window) new ResizeObserver(() => trace(el)).observe(el);
        else addEventListener('resize', () => trace(el));
    });
})();
