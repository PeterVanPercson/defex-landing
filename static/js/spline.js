(() => {
    // The robot on the blog index: a Spline scene, played by Spline's own
    // runtime, which is vendored under static/vendor so the page depends on
    // nothing but Spline's scene host. The runtime is 560 KB over the wire
    // and the scene 1.3 MB, so neither is fetched until the figure is near
    // the viewport; the mark's three dots hold the space meanwhile. If WebGL
    // or the network fails, the figure is simply paper.
    const host = document.querySelector('[data-spline]');
    if (!host) return;
    const canvas = host.querySelector('canvas');
    let started = false;
    const start = async () => {
        if (started) return;
        started = true;
        host.classList.add('is-loading');
        try {
            const { Application } = await import(host.dataset.runtime);
            const app = new Application(canvas);
            await app.load(host.dataset.spline);
            host.classList.add('is-ready');
        } catch (e) {
            host.classList.add('is-failed');
        }
        host.classList.remove('is-loading');
    };
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) { io.disconnect(); start(); }
        }, { rootMargin: '240px 0px' });
        io.observe(host);
    } else {
        start();
    }
})();
