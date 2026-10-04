(() => {
    // The four claims under "Robots are cheap." On a screen that can hold one
    // card whole, the card is pinned and the scroll walks through the four:
    // each gets the same stretch of scroll, and its bar fills across it.
    // Anywhere else (phones, short windows, Reduce Motion, no script) the cards
    // simply stack, which is how the markup reads without this file.
    const root = document.getElementById('steps');
    if (!root) return;
    const cards = [...root.querySelectorAll('.feature')];
    const bars = [...root.querySelectorAll('.steps__bar')];
    if (cards.length < 2) return;

    const roomy = matchMedia('(min-width: 901px) and (min-height: 620px)');
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    let pinned = false, current = -1, queued = false;

    // how much scroll one card gets: must match the 62svh in site.css
    const stretch = () => window.innerHeight * 0.62;
    const top = () => root.getBoundingClientRect().top + window.scrollY - navHeight();
    const navHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav')) || 64;

    function show(index) {
        if (index === current) return;
        current = index;
        cards.forEach((card, i) => card.classList.toggle('is-on', i === index));
        bars.forEach((bar, i) => bar.setAttribute('aria-current', i === index ? 'step' : 'false'));
    }

    function update() {
        queued = false;
        if (!pinned) return;
        const at = (window.scrollY - top()) / stretch();
        show(Math.max(0, Math.min(cards.length - 1, Math.floor(at))));
        bars.forEach((bar, i) => bar.style.setProperty('--fill', Math.max(0, Math.min(1, at - i)).toFixed(3)));
    }

    function onScroll() {
        if (queued || !pinned) return;
        queued = true;
        requestAnimationFrame(update);
    }

    function setMode() {
        const want = roomy.matches && !still.matches;
        if (want === pinned) return;
        pinned = want;
        root.classList.toggle('is-pinned', pinned);
        root.style.setProperty('--steps', String(cards.length));
        if (pinned) { current = -1; update(); }
        else cards.forEach((card) => card.classList.remove('is-on'));
    }

    bars.forEach((bar, i) => bar.addEventListener('click', () => {
        window.scrollTo(0, Math.round(top() + i * stretch() + 2));
    }));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    roomy.addEventListener('change', setMode);
    still.addEventListener('change', setMode);
    setMode();
})();
