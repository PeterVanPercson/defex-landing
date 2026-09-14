(() => {
    // The robot as ink dots on paper. static/models/robot-cloud.bin holds
    // 30,000 points sampled over the surface of the Defex robot model with
    // their normals ("DFXC", uint32 count, int16 xyz * count, int8 nxyz *
    // count). Each frame projects them orthographically into a pixel buffer
    // and paints one dot per point: the lit side sparse and pale, the shadow
    // side dense and dark, the far side faint, which is how stippling shows
    // form. Drag turns it, and it turns by itself when left alone. Reduce
    // Motion gets a still robot that still turns by hand. One canvas per
    // [data-cloud]; data-yaw sets the angle it opens on.
    const INK = [26, 24, 21];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cloud = null;   // the points, fetched once and shared by every canvas on the page

    const mount = (canvas) => {
        const ctx = canvas.getContext('2d');
        let pts = null;
        let nrm = null;
        let n = 0;
        let W = 0;
        let H = 0;
        let DPR = 1;
        let img = null;
        let buf = null;
        let yaw = parseFloat(canvas.dataset.yaw || '0.55');
        let pitch = 0.16;
        let dirty = true;
        let dragging = false;
        let lastX = 0;
        let lastY = 0;
        let idleAt = 0;
        let seen = true;
        let raf = 0;
        let lastFrame = 0;

        const size = () => {
            const r = canvas.getBoundingClientRect();
            DPR = Math.min(2, devicePixelRatio || 1);
            W = Math.max(1, Math.round(r.width * DPR));
            H = Math.max(1, Math.round(r.height * DPR));
            if (canvas.width !== W || canvas.height !== H) {
                canvas.width = W;
                canvas.height = H;
                img = ctx.createImageData(W, H);
                buf = new Uint32Array(img.data.buffer);
            }
            dirty = true;
        };

        const draw = () => {
            if (!pts || !img) return;
            buf.fill(0);
            const cy = Math.cos(yaw), sy = Math.sin(yaw);
            const cp = Math.cos(pitch), sp = Math.sin(pitch);
            const scale = (Math.min(W, H) * 0.44) / 32000;
            const ox = W / 2, oy = H / 2;
            const lx = -0.45, ly = 0.75, lz = 0.5;   // lit from the upper left, in front
            const dot = DPR >= 2 ? 2 : 1;            // one CSS pixel on a 2x screen
            const lim = W - dot, limy = H - dot;
            for (let i = 0; i < n; i++) {
                const j = i * 3;
                const x = pts[j], y = pts[j + 1], z = pts[j + 2];
                const x1 = x * cy + z * sy, z1 = z * cy - x * sy;
                const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
                const nx = nrm[j] / 127, ny = nrm[j + 1] / 127, nz = nrm[j + 2] / 127;
                const nx1 = nx * cy + nz * sy, nz1 = nz * cy - nx * sy;
                const ny2 = ny * cp - nz1 * sp, nz2 = ny * sp + nz1 * cp;
                const px = (ox + x1 * scale) | 0;
                const py = (oy - y2 * scale) | 0;
                if (px < 0 || py < 0 || px >= lim || py >= limy) continue;
                // one-pixel dots on a 1x screen carry less ink than the 2x2 blocks
                // a 2x screen gets, so they are drawn darker to match
                let a;
                if (nz2 > 0) {
                    const lit = Math.max(0, nx1 * lx + ny2 * ly + nz2 * lz);
                    a = (DPR >= 2 ? 0.24 : 0.34) + 0.6 * (1 - lit);
                } else {
                    a = DPR >= 2 ? 0.14 : 0.2;      // the far side, seen through
                }
                const v = (((a * 255) | 0) << 24) | (INK[2] << 16) | (INK[1] << 8) | INK[0];
                const k = py * W + px;
                buf[k] = v;
                if (dot === 2) { buf[k + 1] = v; buf[k + W] = v; buf[k + W + 1] = v; }
            }
            ctx.putImageData(img, 0, 0);
        };

        const frame = (now) => {
            raf = 0;
            if (!seen || document.hidden) return;
            const idle = !dragging && now - idleAt > 1800;
            if (idle && !reduce && now - lastFrame >= 33) { yaw += 0.0035 * ((now - lastFrame) / 16.7); dirty = true; }
            if (dirty && now - lastFrame >= 16) { lastFrame = now; dirty = false; draw(); }
            raf = requestAnimationFrame(frame);
        };
        const run = () => { if (!raf && seen && !document.hidden) raf = requestAnimationFrame(frame); };

        canvas.addEventListener('pointerdown', (e) => {
            dragging = true; lastX = e.clientX; lastY = e.clientY;
            canvas.setPointerCapture(e.pointerId);
            canvas.classList.add('is-dragging');
        });
        canvas.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            yaw += (e.clientX - lastX) * 0.008;
            pitch = Math.max(-1.1, Math.min(1.1, pitch + (e.clientY - lastY) * 0.006));
            lastX = e.clientX; lastY = e.clientY;
            dirty = true; run();
        });
        const release = () => { if (!dragging) return; dragging = false; idleAt = performance.now(); canvas.classList.remove('is-dragging'); };
        canvas.addEventListener('pointerup', release);
        canvas.addEventListener('pointercancel', release);

        size();
        if ('ResizeObserver' in window) new ResizeObserver(() => { size(); run(); }).observe(canvas);
        else addEventListener('resize', () => { size(); run(); });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => { seen = entries[0].isIntersecting; run(); }).observe(canvas);
        }
        document.addEventListener('visibilitychange', run);

        (cloud || (cloud = fetch(canvas.dataset.cloud).then((r) => r.arrayBuffer()))).then((ab) => {
            const dv = new DataView(ab);
            n = dv.getUint32(4, true);
            pts = new Int16Array(ab, 8, n * 3);
            nrm = new Int8Array(ab, 8 + n * 6, n * 3);
            canvas.classList.add('is-ready');
            dirty = true;
            run();
        }).catch(() => {});
    };

    document.querySelectorAll('[data-cloud]').forEach(mount);
})();
