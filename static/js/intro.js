(() => {
    const intro = document.getElementById('intro');
    if (!intro) return;
    const root = document.documentElement;
    // The head script decides whether this visit gets the intro. Without the
    // class the overlay is display:none already; drop it from the tree too.
    if (!root.classList.contains('is-intro')) { intro.remove(); return; }
    // JS owns the exit from here. The CSS failsafe is for when it never runs.
    intro.style.animation = 'none';

    // Hold on black just long enough to register the orbits, then dissolve
    // into the hero, which sits on the same black. The dissolve is what makes
    // the hand-off feel smooth, so shorten the hold, never the fade.
    const HOLD = 1300;
    const FADE = 900;   // must match .intro.is-leaving in site.css

    let leaving = false;
    function finish() {
        if (!intro.isConnected) return;
        intro.remove();
        root.classList.remove('is-intro');
    }
    function leave() {
        if (leaving) return;
        leaving = true;
        try { sessionStorage.setItem('defex-intro', '1'); } catch (e) {}
        intro.classList.add('is-leaving');
        // the stage's transform transition bubbles up too; wait for the
        // overlay's own fade, whatever the two durations are set to
        intro.addEventListener('transitionend', (event) => { if (event.target === intro) finish(); });
        // transitionend is not delivered while a tab is in the background
        setTimeout(finish, FADE + 200);
    }

    // The page must not scroll under the overlay: the hero film is driven by
    // the scroll position, and a wheel flick here would reveal it mid-way.
    // Blocking the events keeps the layout as it is, where overflow:hidden on
    // <html> would drop the scrollbar and shift the page as the intro lifts.
    const block = (event) => event.preventDefault();
    intro.addEventListener('wheel', block, { passive: false });
    intro.addEventListener('touchmove', block, { passive: false });
    // Tab would move focus to a control under the overlay, and Enter would
    // then activate it as the intro lifts. Escape, Enter and Space skip.
    const HELD_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'Tab', 'Escape', 'Enter']);
    const SKIP_KEYS = new Set(['Escape', 'Enter', ' ']);
    function onKey(event) {
        if (!intro.isConnected) { removeEventListener('keydown', onKey); return; }
        if (HELD_KEYS.has(event.key)) event.preventDefault();
        if (SKIP_KEYS.has(event.key)) leave();
    }
    addEventListener('keydown', onKey);
    intro.addEventListener('click', leave);

    // Reduce Motion switched on mid-intro: the CSS hides the overlay at once,
    // so release the page at once too.
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    reduced.addEventListener('change', (event) => { if (event.matches) { leave(); finish(); } });

    // A tab opened in the background must not spend its intro unseen.
    const arm = () => setTimeout(leave, HOLD);
    if (document.visibilityState === 'hidden') {
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') arm(); }, { once: true });
    } else arm();
})();
