(() => {
    // Section headings and rows arrive as they reach the viewport, the way
    // dexterity.ai/about's do (timing in site.css). The hidden state is keyed on
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
    // Blocks that arrive together follow each other in, 0.15s apart, the way
    // dexterity.ai's do; a block that arrives alone goes at once.
    const io = new IntersectionObserver((entries) => {
        const order = new Map();
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const n = order.get(entry.target.parentElement) || 0;
            order.set(entry.target.parentElement, n + 1);
            if (n) entry.target.style.setProperty('--reveal-delay', `${Math.min(n, 4) * 0.15}s`);
            entry.target.classList.add('is-in');
            // the scan-text mark plays once as its carrier arrives; the class
            // comes off after the last line has redrawn (.8s + .2s stagger)
            if (entry.target.hasAttribute('data-scan')) {
                entry.target.classList.add('is-scanning');
                setTimeout(() => entry.target.classList.remove('is-scanning'), 1200);
            }
            io.unobserve(entry.target);
        }
    }, { threshold: 0.1 });
    items.forEach((item) => io.observe(item));
})();
