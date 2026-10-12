(() => {
    // The four claims under "Robots are cheap." as a stack of cards (his
    // call, 2026-10-12, after Skiper's sticky cards). The pinning itself is
    // CSS (position: sticky on each card, .steps.is-stacked); this file only
    // shrinks each card back and dims it as the cards after it arrive. On a
    // window too short to hold a card, or under Reduce Motion, the cards
    // simply sit one under another, which is how the markup reads without
    // this file.
    const root = document.getElementById('steps');
    if (!root) return;
    const cards = [...root.querySelectorAll('.feature')];
    if (cards.length < 2) return;
    const list = root.querySelector('.features') || root;

    const tall = matchMedia('(min-height: 600px)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    // how far back the bottom card ends up; each card above it a step less
    const STEP = 0.05, DIM = 0.42;
    let stacked = false, queued = false, start = 0, span = 1;

    const clamp = (v) => Math.max(0, Math.min(1, v));
    function measure() {
        const box = list.getBoundingClientRect();
        start = box.top + window.scrollY - window.innerHeight * 0.15;
        span = Math.max(1, box.height - window.innerHeight * 0.6);
    }

    function update() {
        queued = false;
        if (!stacked) return;
        const p = clamp((window.scrollY - start) / span);
        const n = cards.length;
        cards.forEach((card, i) => {
            const depth = (n - 1 - i) * STEP;
            const from = i / n;
            const t = i === n - 1 ? 0 : clamp((p - from) / (1 - from));
            card.style.setProperty('--s', (1 - depth * t).toFixed(4));
            card.style.setProperty('--dim', (depth ? DIM * t * (depth / ((n - 1) * STEP)) : 0).toFixed(3));
        });
    }

    function onScroll() {
        if (queued || !stacked) return;
        queued = true;
        requestAnimationFrame(update);
    }

    function setMode() {
        const want = tall.matches && !still.matches;
        if (want !== stacked) {
            stacked = want;
            root.classList.toggle('is-stacked', stacked);
            if (!stacked) cards.forEach((card) => { card.style.removeProperty('--s'); card.style.removeProperty('--dim'); });
        }
        if (stacked) { measure(); update(); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setMode, { passive: true });
    window.addEventListener('load', setMode);
    tall.addEventListener('change', setMode);
    still.addEventListener('change', setMode);
    setMode();
})();
