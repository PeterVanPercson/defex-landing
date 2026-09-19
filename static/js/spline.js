(() => {
    // The robot on the blog index: a Spline scene, played by Spline's own
    // runtime, which is vendored under static/vendor so the page depends on
    // nothing but Spline's scene host. The runtime is 560 KB over the wire
    // and the scene 1.3 MB, so neither is fetched until the figure is near
    // the viewport; the mark's three dots hold the space meanwhile. If WebGL
    // or the network fails, the figure is simply paper.
    const host = document.querySelector('[data-spline]');
    if (!host) return;
    // No WebGL (switched off, blocklisted, a locked-down office machine):
    // show the still of the robot rather than start a scene that cannot draw.
    const webgl = (() => {
        try {
            const probe = document.createElement('canvas');
            const gl = probe.getContext('webgl2') || probe.getContext('webgl');
            const lose = gl && gl.getExtension('WEBGL_lose_context');
            if (lose) lose.loseContext();
            return Boolean(gl);
        } catch (e) {
            return false;
        }
    })();
    if (!webgl) { host.classList.add('is-failed'); return; }
    // Resolves in the tail of the camera's move: once it has travelled and
    // its per-frame step has fallen under half a percent of that travel for
    // three frames (the ease-out's last stretch, where the framing is already
    // right), or once it has held still for eight frames. Sampled per
    // rendered frame, not per millisecond: the camera only moves when a
    // frame renders, so on a slow machine a timer would call it still
    // between two frames. Capped at five seconds.
    const settled = (obj) => new Promise((done) => {
        if (!obj || !obj.position) { setTimeout(done, 300); return; }
        const t0 = performance.now();
        const p0 = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
        let prev = p0;
        let far = 0;
        let slow = 0;
        let still = 0;
        let frames = 0;
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        const tick = () => {
            const p = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
            const step = dist(p, prev);
            far = Math.max(far, dist(p, p0));
            still = step < 0.05 ? still + 1 : 0;
            slow = far > 1 && step < far * 0.005 ? slow + 1 : 0;
            prev = p;
            frames++;
            if ((frames >= 10 && (slow >= 3 || still >= 8)) || performance.now() - t0 > 5000) done();
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
