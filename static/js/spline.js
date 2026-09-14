(() => {
    // The robot on the blog index: a Spline scene, played by Spline's own
    // runtime, which is vendored under static/vendor so the page depends on
    // nothing but Spline's scene host. The runtime is 560 KB over the wire
    // and the scene 1.3 MB, so neither is fetched until the figure is near
    // the viewport; the mark's three dots hold the space meanwhile. If WebGL
    // or the network fails, the figure is simply paper.
    const host = document.querySelector('[data-spline]');
    if (!host) return;
    // Resolves once the object has held its position for eight rendered
    // frames. Sampled per frame, not per millisecond: the camera only moves
    // when a frame renders, so on a slow machine a timer would call it still
    // between two frames. Capped at five seconds.
    const settled = (obj) => new Promise((done) => {
        if (!obj || !obj.position) { setTimeout(done, 300); return; }
        const t0 = performance.now();
        let last = '';
        let still = 0;
        let frames = 0;
        const tick = () => {
            const p = obj.position;
            const key = `${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}`;
            still = key === last ? still + 1 : 0;
            last = key;
            frames++;
            if ((still >= 8 && frames >= 14) || performance.now() - t0 > 5000) done();
            else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
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
            // The scene opens on its own entrance: its camera starts pushed
            // in so far that the head fills the frame and the shoulders are
            // cut on every side, then pulls back and holds. The canvas stays
            // hidden, the dots still showing, until the camera has been still
            // for a moment, so the robot arrives whole. Capped at four
            // seconds in case a scene never settles.
            await settled(app.findObjectByName('Camera 2'));
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
