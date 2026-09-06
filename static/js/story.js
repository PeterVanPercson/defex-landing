(() => {
    const intro = document.getElementById('introVideo');
    if (!intro) return;

    const toggle = document.getElementById('introToggle');
    const replay = document.getElementById('introReplay');
    const expand = document.getElementById('introExpand');
    const progress = document.getElementById('introProgress');
    const time = document.getElementById('introTime');
    const error = document.getElementById('introError');
    const factory = document.getElementById('factoryVideo');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const small = window.matchMedia('(max-width: 800px)').matches;
    const saveData = Boolean(navigator.connection && navigator.connection.saveData);
    let userPaused = false;
    let userStarted = false;
    let introVisible = false;

    function selectSource(video) {
        // Keep the source element as a functional fallback without JavaScript.
        const src = video.getAttribute(small || saveData ? 'data-src-small' : 'data-src-large');
        if (src && !video.hasAttribute('src')) video.src = src;
    }

    function playIntro() {
        selectSource(intro);
        intro.play().catch(() => sync());
    }

    function format(seconds) {
        return '00:' + String(Math.floor(seconds || 0)).padStart(2, '0');
    }

    function sync() {
        const playing = !intro.paused && !intro.ended;
        toggle.querySelector('.play-label').hidden = playing;
        toggle.querySelector('.pause-label').hidden = !playing;
        toggle.querySelector('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
        const duration = Number.isFinite(intro.duration) ? intro.duration : 26;
        time.textContent = format(intro.currentTime) + ' / ' + format(duration);
        progress.style.transform = 'scaleX(' + Math.min(1, intro.currentTime / (duration || 26)) + ')';
    }

    function updatePlayback() {
        const allowed = userStarted || (!reduceMotion.matches && !saveData);
        if (introVisible && !document.hidden && !userPaused && allowed) playIntro();
        else intro.pause();
    }

    toggle.addEventListener('click', () => {
        if (intro.paused) {
            userPaused = false;
            userStarted = true;
            playIntro();
        } else {
            userPaused = true;
            intro.pause();
        }
    });
    replay.addEventListener('click', () => {
        intro.currentTime = 0;
        userPaused = false;
        userStarted = true;
        playIntro();
    });

    const screen = intro.closest('.story-film__screen');
    if (document.fullscreenEnabled && screen.requestFullscreen) {
        expand.hidden = false;
        expand.addEventListener('click', () => {
            screen.requestFullscreen().catch(() => {});
        });
        document.addEventListener('fullscreenchange', () => {
            intro.controls = document.fullscreenElement === screen;
        });
    } else if (typeof intro.webkitEnterFullscreen === 'function') {
        expand.hidden = false;
        expand.addEventListener('click', () => intro.webkitEnterFullscreen());
    }

    for (const event of ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata']) {
        intro.addEventListener(event, sync);
    }
    intro.addEventListener('error', () => { error.hidden = false; });
    intro.addEventListener('loadeddata', () => { error.hidden = true; });

    // A manual pause persists across scrolling. Reduced motion never auto-starts.
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) {
                if (entry.target === intro) {
                    introVisible = entry.isIntersecting;
                    updatePlayback();
                } else if (!entry.isIntersecting) factory.pause();
            }
        }, { threshold: 0.2 });
        observer.observe(intro);
        if (factory) observer.observe(factory);
    } else {
        introVisible = true;
        updatePlayback();
    }
    document.addEventListener('visibilitychange', () => {
        updatePlayback();
        if (document.hidden && factory) factory.pause();
    });
    reduceMotion.addEventListener('change', () => {
        if (reduceMotion.matches) userStarted = false;
        updatePlayback();
    });
    if (factory) {
        selectSource(factory);
        factory.addEventListener('play', () => intro.pause());
    }

    document.getElementById('filmControls').hidden = false;
    intro.controls = false;
    sync();
})();
