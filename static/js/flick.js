// The hero's partners, one logo at a time. A port of 21st.dev's CardFlick:
// every card flicks back over its top edge while its twin, tucked underneath,
// flicks up into its place, staggered left to right. The "Partners" label does
// it per letter; a logo is cut into strips and each strip is a card. The motion
// is a damped spring integrated once and baked into the keyframes, so the
// overshoot is in the frames, not in an easing curve.
(() => {
    const root = document.querySelector('.flick');
    const stage = root && root.querySelector('.flick__stage');
    if (!stage || !stage.animate) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const STRIPS = 6, STAGGER = 25, HOLD = 1400, SAMPLES = 26;

    const spring = ((stiffness, damping) => {
        const dt = 1 / 240;
        let x = 0, v = 0, t = 0;
        const raw = [0];
        while (t < 1.6) {
            v += (-stiffness * (x - 1) - damping * v) * dt;
            x += v * dt;
            t += dt;
            raw.push(x);
            if (Math.abs(x - 1) < 0.004 && Math.abs(v) < 0.02) break;
        }
        const values = [];
        for (let i = 0; i < SAMPLES; i++) values.push(raw[Math.round(i / (SAMPLES - 1) * (raw.length - 1))]);
        return { values, ms: Math.max(180, Math.round(t * 1000)) };
    })(340, 20);

    const last = spring.values.length - 1;
    const OUT = spring.values.map((p, i) => ({
        offset: i / last,
        transform: `rotateX(${(-100 * p).toFixed(2)}deg) translateY(${(-6 * p).toFixed(2)}px)`,
        opacity: Math.max(0, 1 - p).toFixed(3),
        filter: `blur(${Math.max(0, 4 * p).toFixed(2)}px)`,
    }));
    const IN = spring.values.map((p, i) => ({
        offset: i / last,
        transform: `rotateX(${(80 * (1 - p)).toFixed(2)}deg) translateY(${(6 * (1 - p)).toFixed(2)}px) scale(${(0.85 + 0.15 * p).toFixed(3)})`,
        opacity: Math.max(0, Math.min(1, p)).toFixed(3),
        filter: `blur(${Math.max(0, 4 * (1 - p)).toFixed(2)}px)`,
    }));
    const TUCKED = 'transform-origin: 50% 0; transform: rotateX(80deg) translateY(6px) scale(.85); opacity: 0; filter: blur(4px);';

    const flip = (el, frames, i) => el.animate(frames, { duration: spring.ms, delay: i * STAGGER, fill: 'forwards', easing: 'linear' }).finished;

    // the label: a face and a tucked twin per letter
    const label = root.querySelector('.flick__k');
    const pairs = [...label.textContent].map((c) => {
        const slot = document.createElement('span');
        slot.className = 'flick__slot';
        slot.innerHTML = '<span class="flick__face"></span><span class="flick__twin"></span>';
        slot.firstChild.textContent = slot.lastChild.textContent = c;
        slot.lastChild.style.cssText = TUCKED;
        return slot;
    });
    label.setAttribute('aria-label', label.textContent);
    label.replaceChildren(...pairs);
    let labelBusy = false;
    const flickLabel = () => {
        if (labelBusy) return;
        labelBusy = true;
        Promise.allSettled(pairs.flatMap((slot, i) => [flip(slot.firstChild, OUT, i), flip(slot.lastChild, IN, i)])).then(() => {
            for (const slot of pairs) {
                slot.firstChild.getAnimations().forEach((a) => a.cancel());
                slot.lastChild.getAnimations().forEach((a) => a.cancel());
            }
            labelBusy = false;
        });
    };

    // the logos
    const logos = [...stage.querySelectorAll('.flick__logo')].map((img) => ({
        src: img.getAttribute('src') || img.dataset.src,
        ratio: img.width / img.height,
        // a mark that reads large for its box is drawn smaller (discovery.PARTNERS "scale")
        scale: parseFloat(img.dataset.scale) || 1,
    }));
    if (logos.length < 2) return;
    const loaded = new Map();
    const load = (k) => {
        if (!loaded.has(k)) {
            const img = new Image();
            img.decoding = 'async';
            img.src = logos[k].src;
            loaded.set(k, img.decode().catch(() => {}));
        }
        return loaded.get(k);
    };

    // Optical size: every mark gets the same area, so a square AWS and a long
    // Michigan weigh the same, within the stage's box.
    const card = (k) => {
        const box = stage.getBoundingClientRect();
        const ratio = logos[k].ratio;
        let w = Math.sqrt(box.width * box.height * 0.42 * ratio) * logos[k].scale, h = w / ratio;
        if (h > box.height) { h = box.height; w = h * ratio; }
        if (w > box.width) { w = box.width; h = w / ratio; }
        const el = document.createElement('span');
        el.className = 'flick__card';
        el.style.cssText = `width: ${w.toFixed(1)}px; height: ${h.toFixed(1)}px;`;
        // Strips only while it moves: at rest their clipped edges leave hairline seams.
        const whole = document.createElement('img');
        whole.className = 'flick__whole';
        whole.alt = '';
        whole.src = logos[k].src;
        el.append(whole);
        const strips = [];
        for (let i = 0; i < STRIPS; i++) {
            const lens = document.createElement('span');
            lens.className = 'flick__lens';
            lens.style.perspectiveOrigin = `${((i + 0.5) / STRIPS * 100).toFixed(1)}% 50%`;
            const strip = document.createElement('img');
            strip.className = 'flick__strip';
            strip.alt = '';
            strip.src = logos[k].src;
            strip.style.clipPath = `inset(0 ${((STRIPS - 1 - i) / STRIPS * 100).toFixed(3)}% 0 ${(i / STRIPS * 100).toFixed(3)}%)`;
            lens.append(strip);
            el.append(lens);
            strips.push(strip);
        }
        return { el, strips };
    };

    let at = 0, busy = false, timer = 0, seen = true;
    let current = card(0);
    current.el.classList.add('is-rest');
    stage.append(current.el);
    stage.classList.add('is-live');

    const next = () => {
        if (busy) return;
        busy = true;
        clearTimeout(timer);
        const k = (at + 1) % logos.length;
        load(k).then(() => {
            const incoming = card(k);
            for (const s of incoming.strips) s.style.cssText += TUCKED;
            stage.append(incoming.el);
            const outgoing = current;
            outgoing.el.classList.remove('is-rest');
            return Promise.allSettled([
                ...outgoing.strips.map((s, i) => { s.style.transformOrigin = '50% 100%'; return flip(s, OUT, i); }),
                ...incoming.strips.map((s, i) => flip(s, IN, i)),
            ]).then(() => {
                outgoing.el.remove();
                for (const s of incoming.strips) {
                    s.style.transform = s.style.opacity = s.style.filter = '';
                    s.getAnimations().forEach((a) => a.cancel());
                }
                incoming.el.classList.add('is-rest');
                current = incoming;
                at = k;
                load((k + 1) % logos.length);
            });
        }).finally(() => {
            busy = false;
            schedule();
        });
    };
    const schedule = () => {
        clearTimeout(timer);
        if (seen && !document.hidden) timer = setTimeout(next, HOLD);
    };

    root.addEventListener('pointerenter', () => { flickLabel(); next(); });
    document.addEventListener('visibilitychange', schedule);
    new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; schedule(); }).observe(stage);
    const start = () => { load(1); schedule(); };
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
})();
