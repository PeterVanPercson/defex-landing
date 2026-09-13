(() => {
    // Section headings and rows arrive as they reach the viewport, the way
    // origami-robotics.com's sections do. The hidden state is keyed on
    // html.reveal, which only this script sets, so without JS, or with Reduce
    // Motion on, everything is simply there.
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length || !('IntersectionObserver' in window)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.add('reveal');
    const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
        }
    }, { rootMargin: '0px 0px -12% 0px' });
    items.forEach((item) => io.observe(item));
})();
