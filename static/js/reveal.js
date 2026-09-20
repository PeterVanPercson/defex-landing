(() => {
    // Section headings and rows arrive as they reach the viewport, the way
    // origami-robotics.com's sections do. The hidden state is keyed on
    // html.reveal, which only this script sets, so without JS, or with Reduce
    // Motion on, everything is simply there.
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length || !('IntersectionObserver' in window)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (event) => {
        if (!event.matches) return;
        io.disconnect();
        document.documentElement.classList.remove('reveal');
        items.forEach((item) => item.classList.remove('is-scanning'));
    });

    document.documentElement.classList.add('reveal');
    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-in');
            // the scan-text mark plays once as its carrier arrives; the class
            // comes off after the last line has redrawn (.8s + .2s stagger)
            if (entry.target.hasAttribute('data-scan')) {
                entry.target.classList.add('is-scanning');
                setTimeout(() => entry.target.classList.remove('is-scanning'), 1200);
            }
            io.unobserve(entry.target);
        }
    }, { rootMargin: '0px 0px -12% 0px' });
    items.forEach((item) => io.observe(item));
})();
