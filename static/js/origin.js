(() => {
    const video = document.getElementById('origin-video');
    const sound = document.getElementById('sound');
    const surface = document.getElementById('playpause');
    const flash = document.getElementById('flash');
    if (!video || !sound || !surface || !flash) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    const icon = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    const ICONS = {
        muted: '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
        loud: '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
        play: '<path d="m9 5 10 7-10 7Z"/>',
        pause: '<path d="M8 5h3v14H8zM15 5h3v14h-3z"/>',
    };

    function paintSound() {
        sound.innerHTML = icon(video.muted ? ICONS.muted : ICONS.loud);
        sound.setAttribute('aria-pressed', String(!video.muted));
        sound.setAttribute('aria-label', video.muted ? 'Turn on sound' : 'Turn off sound');
    }
    function paintSurface() {
        surface.setAttribute('aria-label', video.paused ? 'Play the film' : 'Pause the film');
    }

    // A half-second badge so a tap on the film reads as deliberate.
    function pulse(kind) {
        flash.innerHTML = icon(ICONS[kind]);
        flash.classList.remove('is-on');
        void flash.offsetWidth;
        flash.classList.add('is-on');
    }
    flash.addEventListener('animationend', () => flash.classList.remove('is-on'));

    let userPaused = false;

    function toggle() {
        if (video.paused) {
            userPaused = false;
            video.play().catch(() => {});
            pulse('play');
        } else {
            userPaused = true;
            video.pause();
            pulse('pause');
        }
        paintSurface();
    }

    surface.addEventListener('click', toggle);
    video.addEventListener('play', paintSurface);
    video.addEventListener('pause', paintSurface);

    // The sound control sits on top of the play surface and must not toggle it.
    sound.addEventListener('click', (event) => {
        event.stopPropagation();
        video.muted = !video.muted;
        if (!video.muted && video.paused) { userPaused = false; video.play().catch(() => {}); }
        paintSound();
        paintSurface();
    });

    paintSound();
    paintSurface();

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    if (!reduced.matches && !userPaused) video.play().catch(() => {});
                } else if (!video.paused) {
                    video.pause();
                }
            }
        }, { threshold: .3 }).observe(video);
    } else if (!reduced.matches) {
        video.play().catch(() => {});
    }
})();
