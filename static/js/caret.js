(() => {
    // Every text field gets the caret of Skiper UI's Smooth Input (skiper106,
    // Husan's pick, 2026-10-04). The browser's caret is hidden and a 2px bar,
    // 0.9em tall, springs to wherever the caret is now (stiffness 500,
    // damping 30, mass 0.5: about 0.2s to settle), so it glides as you type,
    // click or use the arrows instead of jumping. Like theirs it does not
    // blink and it hides while text is selected. Reduce Motion makes it jump.
    // Without this file, or in forced colours, the browser's own caret stays.
    // Email fields are left out on purpose: browsers do not report where the
    // caret is in one, so the form asks for an email as text instead.
    const FIELDS = 'input[type="text"], input[type="search"], input[type="url"], input[type="tel"], input[type="password"], input:not([type]), textarea';
    const STIFFNESS = 500, DAMPING = 30, MASS = 0.5, STEP = 1 / 240;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const fields = [...document.querySelectorAll(FIELDS)].filter((field) => field.tabIndex !== -1 && !field.closest('[aria-hidden="true"]'));
    if (!fields.length) return;

    // One hidden copy of whichever field is focused, laid out with its font
    // and padding; a mark at the caret's offset in it says where the caret is.
    const mirror = document.createElement('div');
    mirror.className = 'caret-mirror';
    mirror.setAttribute('aria-hidden', 'true');
    const mark = document.createElement('span');
    document.body.appendChild(mirror);
    const COPY = ['fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontFamily', 'fontFeatureSettings',
        'fontVariationSettings', 'fontKerning', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'tabSize',
        'lineHeight', 'paddingLeft', 'paddingRight', 'paddingTop'];

    const state = new Map();
    let active = null, frame = 0, last = 0;

    function locate(field) {
        const start = field.selectionStart, end = field.selectionEnd;
        if (start == null) return null;
        const at = start === end || field.selectionDirection === 'backward' ? start : end;
        const css = getComputedStyle(field);
        const multi = field.tagName === 'TEXTAREA';
        const size = parseFloat(css.fontSize) || 16;
        const line = parseFloat(css.lineHeight) || size * 1.2;
        const padLeft = parseFloat(css.paddingLeft) || 0, padRight = parseFloat(css.paddingRight) || 0;
        for (const key of COPY) mirror.style[key] = css[key];
        mirror.style.whiteSpace = multi ? 'pre-wrap' : 'pre';
        mirror.style.overflowWrap = multi ? 'break-word' : 'normal';
        mirror.style.width = multi ? `${field.clientWidth - padLeft - padRight}px` : 'auto';
        mirror.textContent = field.type === 'password' ? '•'.repeat(at) : field.value.slice(0, at);
        mark.style.height = `${line}px`;
        mirror.appendChild(mark);
        const height = size * 0.9;
        const left = mark.offsetLeft - field.scrollLeft;
        const top = multi ? mark.offsetTop - field.scrollTop + (line - height) / 2 : (field.clientHeight - height) / 2;
        const right = field.clientWidth - padRight;
        const inside = left >= padLeft - 1 && left <= right + 1 && (!multi || (top >= 0 && top + height <= field.clientHeight + 1));
        return {
            x: field.offsetLeft + field.clientLeft + Math.min(left, right),
            y: field.offsetTop + field.clientTop + top,
            height,
            shown: start === end && inside,
        };
    }

    function draw(s) {
        s.caret.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`;
    }

    function tick(now) {
        const s = active && state.get(active);
        if (!s) { frame = 0; return; }
        let left = Math.min(0.05, (now - last) / 1000);
        last = now;
        while (left > 0) {
            const dt = Math.min(STEP, left);
            left -= dt;
            s.vx += ((-STIFFNESS * (s.x - s.tx) - DAMPING * s.vx) / MASS) * dt;
            s.vy += ((-STIFFNESS * (s.y - s.ty) - DAMPING * s.vy) / MASS) * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
        }
        if (Math.abs(s.x - s.tx) < 0.05 && Math.abs(s.y - s.ty) < 0.05 && Math.abs(s.vx) < 1 && Math.abs(s.vy) < 1) {
            s.x = s.tx; s.y = s.ty; s.vx = s.vy = 0;
            draw(s);
            frame = 0;
            return;
        }
        draw(s);
        frame = requestAnimationFrame(tick);
    }

    function place(field, snap) {
        const s = state.get(field);
        const at = locate(field);
        if (!at || document.activeElement !== field) { s.caret.style.opacity = '0'; return; }
        s.caret.style.height = `${at.height.toFixed(2)}px`;
        s.tx = at.x;
        s.ty = at.y;
        if (snap || !s.seen || still.matches) {
            s.x = s.tx; s.y = s.ty; s.vx = s.vy = 0; s.seen = true;
            draw(s);
        } else if (!frame) {
            last = performance.now();
            frame = requestAnimationFrame(tick);
        }
        s.caret.style.opacity = at.shown ? '1' : '0';
    }

    const soon = (field, snap) => requestAnimationFrame(() => { if (document.activeElement === field) place(field, snap); });

    for (const field of fields) {
        const host = field.parentElement;
        const caret = document.createElement('span');
        caret.className = 'caret';
        caret.setAttribute('aria-hidden', 'true');
        host.classList.add('caret-host');
        host.appendChild(caret);
        field.classList.add('has-caret');
        state.set(field, { caret, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, seen: false });
        field.addEventListener('focus', () => { active = field; place(field); soon(field); });
        field.addEventListener('blur', () => {
            state.get(field).caret.style.opacity = '0';
            if (active === field) active = null;
        });
        for (const name of ['input', 'keydown', 'pointerup', 'select', 'scroll']) field.addEventListener(name, () => soon(field));
    }

    // arrows, clicks and drags inside the focused field
    document.addEventListener('selectionchange', () => { if (active) soon(active); });
    // the field moved or changed size under the caret: put it straight there
    const moved = () => { if (active) soon(active, true); };
    if ('ResizeObserver' in window) {
        const watch = new ResizeObserver(moved);
        fields.forEach((field) => watch.observe(field));
    }
    window.addEventListener('resize', moved, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moved);
})();
