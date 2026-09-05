// defex — language toggle + the demo video. Nothing else moves on this page.

// ===== Language toggle (EN / 中) =====
(() => {
    const root = document.documentElement;
    const buttons = document.querySelectorAll('.lang__btn');
    if (!buttons.length) return;

    function applyPlaceholders(lang) {
        document.querySelectorAll('[data-placeholder-en]').forEach(el => {
            const v = el.getAttribute('data-placeholder-' + lang);
            if (v) el.setAttribute('placeholder', v);
        });
    }
    function setLang(lang) {
        if (lang !== 'en' && lang !== 'zh') lang = 'en';
        root.setAttribute('lang', lang);
        try { localStorage.setItem('defex.lang', lang); } catch (e) {}
        applyPlaceholders(lang);
    }
    applyPlaceholders(root.getAttribute('lang') || 'en');
    buttons.forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
})();

// ===== Demo video — plays like a gif when scrolled into view, sound is opt-in =====
(() => {
    const video = document.getElementById('demoVideo');
    const sound = document.getElementById('demoSound');
    if (!video) return;

    // one rendition per screen: phones get the 720p file, everything else 1080p
    const small = window.matchMedia('(max-width: 700px)').matches;
    // data-src-1080 does not camelCase (a digit follows the hyphen), so read the attribute
    video.src = video.getAttribute(small ? 'data-src-720' : 'data-src-1080');

    let inView = false;
    const play = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); };

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            inView = entries[0].isIntersecting;
            if (inView) play(); else video.pause();
        }, { threshold: 0.45 }).observe(video);
    } else {
        play();
    }

    if (sound) {
        sound.addEventListener('click', () => {
            const on = video.muted;           // about to turn sound on
            video.muted = !on;
            sound.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (on && inView) play();
        });
    }
})();
