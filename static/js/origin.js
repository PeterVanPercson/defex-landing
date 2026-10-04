// The origin film as the player he picked, Skiper's "video player 002": the
// film inside an iPhone that waits on its poster until it is pressed, and a
// bar under it to scrub with. A vanilla port (motion/react there, CSS
// transitions and a few custom properties here). The film has a voice, so
// nothing starts it but a press.
(() => {
    const video = document.getElementById('origin-video');
    const surface = document.getElementById('playpause');
    const sound = document.getElementById('sound');
    const scrub = document.getElementById('scrub');
    if (!video || !surface || !sound || !scrub) return;
    const film = video.closest('.origin__film');
    const fill = scrub.querySelector('.scrub__fill');
    const nowText = scrub.querySelector('.scrub__time--now');
    const endText = scrub.querySelector('.scrub__time--end');
    const tag = scrub.querySelector('.scrub__tag');
    if (!film || !fill || !nowText || !endText || !tag) return;

    const icon = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
    const ICONS = {
        muted: '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
        loud: '<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    };
    const STEPS = new Map([['ArrowLeft', -5], ['ArrowDown', -5], ['ArrowRight', 5], ['ArrowUp', 5], ['PageDown', -10], ['PageUp', 10]]);
    // how far the bar can be pulled past either end, in px
    const STRETCH = 50;

    // The length is in the markup, so the bar can say it while the film itself
    // is still unfetched (preload="none").
    let duration = Number(video.dataset.duration) || 0;
    let shown = 0;          // the second the bar shows
    let parked = null;      // a second picked before the film had loaded, applied once it has
    let queued = null;      // the newest second asked for while the last seek is still landing
    let scrubbing = false;
    let resume = false;     // it was playing when the scrub began
    let touch = null;       // a finger that has not yet shown whether it scrubs or scrolls the page
    let pointer = null;     // where the mouse last woke the control
    let frame = 0, idle = 0, dwell = 0;

    const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

    function clock(seconds) {
        const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
        return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
    }

    function paintTime(seconds) {
        shown = seconds;
        fill.style.transform = `scaleX(${duration ? clamp(seconds / duration, 0, 1).toFixed(4) : 0})`;
        const text = clock(seconds);
        if (nowText.textContent === text) return;
        nowText.textContent = text;
        scrub.setAttribute('aria-valuenow', String(Math.floor(seconds)));
        scrub.setAttribute('aria-valuetext', `${text} of ${clock(duration)}`);
    }

    // timeupdate comes four times a second; the bar moves every frame.
    function tick() {
        frame = 0;
        if (video.paused || video.ended || scrubbing) return;
        if (parked === null) paintTime(video.currentTime);
        frame = requestAnimationFrame(tick);
    }

    function paintState() {
        // a scrub pauses the film underneath; the control keeps saying what it will go back to
        const playing = scrubbing ? resume : !video.paused && !video.ended;
        film.classList.toggle('is-playing', playing);
        film.classList.toggle('is-waiting', playing && !scrubbing && video.readyState < 3);
        surface.setAttribute('aria-label', playing ? 'Pause the film' : 'Play the film');
        if (playing && !frame) frame = requestAnimationFrame(tick);
    }

    function paintSound() {
        sound.innerHTML = icon(video.muted ? ICONS.muted : ICONS.loud);
        sound.setAttribute('aria-pressed', String(!video.muted));
        sound.setAttribute('aria-label', video.muted ? 'Turn on sound' : 'Turn off sound');
    }

    // Nothing of the film is fetched until someone shows they want it.
    function warm(much) {
        if (video.readyState === 0 && video.preload !== 'auto') video.preload = much;
    }

    function play() {
        if (video.ended || (duration && shown >= duration - .01)) {
            parked = queued = null;
            video.currentTime = 0;
            paintTime(0);
        }
        const started = video.play();
        if (!started) return;
        // A browser that will not give this press its sound still gets the film.
        started.catch((error) => {
            if (!error || error.name !== 'NotAllowedError' || video.muted) return;
            video.muted = true;
            paintSound();
            video.play().catch(() => {});
        });
    }

    function seek(seconds) {
        paintTime(seconds);
        if (video.readyState === 0) {
            parked = seconds;
            warm('auto');
            return;
        }
        queued = seconds;
        if (!video.seeking) land();
    }
    // One seek at a time: a drag asks for far more frames than can be decoded.
    function land() {
        if (queued === null) return;
        const seconds = queued;
        queued = null;
        video.currentTime = seconds;
    }

    function learn() {
        if (Number.isFinite(video.duration) && video.duration > 0) {
            duration = video.duration;
            endText.textContent = clock(duration);
            scrub.setAttribute('aria-valuemax', String(Math.floor(duration)));
            scrub.setAttribute('aria-valuetext', `${clock(shown)} of ${clock(duration)}`);
        }
        if (parked !== null && video.readyState > 0) {
            const seconds = Math.min(parked, duration);
            parked = null;
            video.currentTime = seconds;
        }
        paintTime(shown);
    }

    // Over a playing film the control shows only while the mouse is moving, so
    // pressing play does not leave a pause sign sitting on the picture.
    function rest() {
        clearTimeout(idle);
        film.classList.remove('is-awake');
    }
    surface.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (pointer && Math.abs(event.clientX - pointer.x) + Math.abs(event.clientY - pointer.y) < 2) return;
        pointer = { x: event.clientX, y: event.clientY };
        film.classList.add('is-awake');
        clearTimeout(idle);
        idle = setTimeout(rest, 1600);
    });
    surface.addEventListener('pointerleave', rest);
    surface.addEventListener('click', () => {
        if (video.paused || video.ended) { rest(); play(); } else video.pause();
    });

    // Sound is a choice made on its own: it never starts or stops the film.
    sound.addEventListener('click', () => {
        video.muted = !video.muted;
        paintSound();
    });

    // The pointer's place on the bar: moves the caret, names the second and
    // says how far past an end it is.
    function aim(event) {
        const box = scrub.getBoundingClientRect();
        const x = event.clientX - box.left;
        const on = clamp(x, 0, box.width);
        // The further past the end, the less the bar gives.
        const give = (px) => 2 * (1 / (1 + Math.exp(-px / STRETCH)) - .5) * STRETCH;
        // ...and never past the edge of its card, which is close on a phone
        const card = film.getBoundingClientRect();
        const room = (side) => Math.max(0, (side < 0 ? box.left - card.left : card.right - box.left - box.width) - 8);
        const past = !scrubbing ? 0 : x < 0 ? -Math.min(give(-x), room(-1)) : x > box.width ? Math.min(give(x - box.width), room(1)) : 0;
        const seconds = box.width ? on / box.width * duration : 0;
        const caret = on + past;
        scrub.style.setProperty('--x', `${caret.toFixed(1)}px`);
        // the tag stays over the bar when the caret is at an end or past it
        scrub.style.setProperty('--tag-shift', `${(clamp(caret, 20, Math.max(20, box.width - 20)) - caret).toFixed(1)}px`);
        tag.textContent = clock(seconds);
        return { seconds, past, width: box.width };
    }

    function stretch(past, width) {
        const by = Math.abs(past);
        scrub.classList.remove('is-settling');
        if (by) scrub.dataset.pull = past < 0 ? 'left' : 'right';
        scrub.style.setProperty('--sx', (1 + (width ? by / width : 0)).toFixed(4));
        scrub.style.setProperty('--sy', (1 - .2 * by / STRETCH).toFixed(4));
    }

    function begin() {
        touch = null;
        scrubbing = true;
        resume = !video.paused && !video.ended;
        rest();
        film.classList.add('is-scrubbing');
        video.pause();
    }

    function drag(event) {
        const { seconds, past, width } = aim(event);
        stretch(past, width);
        seek(seconds);
    }

    function end() {
        scrub.classList.remove('is-held');
        touch = null;
        if (!scrubbing) return;
        scrubbing = false;
        film.classList.remove('is-scrubbing');
        // let go, the stretch springs back (the transition is on .is-settling)
        scrub.classList.add('is-settling');
        scrub.style.setProperty('--sx', '1');
        scrub.style.setProperty('--sy', '1');
        if (resume && !document.hidden) play();
        paintState();
    }

    scrub.addEventListener('pointerdown', (event) => {
        if (event.button) return;
        warm('auto');
        scrub.classList.add('is-held');
        try { scrub.setPointerCapture(event.pointerId); } catch (error) { /* the drag still works while the pointer stays on the bar */ }
        // The bar lets the page scroll up and down through it (touch-action:
        // pan-y), so a finger only counts once it moves sideways or lifts.
        if (event.pointerType === 'touch') { touch = { x: event.clientX }; return; }
        begin();
        drag(event);
    });
    scrub.addEventListener('pointermove', (event) => {
        if (touch) {
            if (Math.abs(event.clientX - touch.x) < 4) return;
            begin();
        }
        if (scrubbing) drag(event); else aim(event);
    });
    scrub.addEventListener('pointerup', (event) => {
        if (touch) { begin(); drag(event); }
        end();
    });
    scrub.addEventListener('pointercancel', end);
    scrub.addEventListener('lostpointercapture', end);
    scrub.addEventListener('pointerenter', (event) => {
        if (event.pointerType === 'mouse') scrub.classList.add('is-aiming');
    });
    scrub.addEventListener('pointerleave', () => scrub.classList.remove('is-aiming'));
    scrub.addEventListener('keydown', (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const step = STEPS.get(event.key);
        const to = step ? shown + step : event.key === 'Home' ? 0 : event.key === 'End' ? duration : null;
        if (to === null) return;
        event.preventDefault();
        seek(clamp(to, 0, duration));
    });

    for (const name of ['play', 'playing', 'waiting', 'canplay', 'seeked']) video.addEventListener(name, paintState);
    video.addEventListener('seeked', land);
    video.addEventListener('pause', () => {
        if (!scrubbing && parked === null) paintTime(video.currentTime);
        paintState();
    });
    video.addEventListener('ended', () => {
        paintTime(duration);
        paintState();
    });
    video.addEventListener('loadedmetadata', learn);
    video.addEventListener('durationchange', learn);
    video.addEventListener('volumechange', paintSound);
    // A mouse that rests on the player is about to use it, so the film's header
    // is fetched then: not on a fly-over, and not for someone saving data.
    film.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse' || (navigator.connection && navigator.connection.saveData)) return;
        dwell = setTimeout(() => warm('metadata'), 150);
    });
    film.addEventListener('pointerleave', () => clearTimeout(dwell));

    // The phone tells the visitor's own time, the way their own phone would.
    const dial = document.getElementById('origin-clock');
    function tell() {
        const parts = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).formatToParts(new Date());
        const part = (type) => (parts.find((item) => item.type === type) || {}).value;
        const text = `${part('hour')}:${part('minute')}`;
        if (part('hour') && part('minute') && dial.textContent !== text) dial.textContent = text;
    }
    if (dial) {
        tell();
        setInterval(tell, 15000);
    }

    paintTime(0);
    paintSound();
    paintState();
    video.controls = false;
    film.classList.add('has-controls');
    video.addEventListener('error', () => {
        video.controls = true;
        film.classList.remove('has-controls');
    });

    // It plays only where it can be seen. Scrolled away or in a hidden tab it
    // stops, and it stays stopped until the next press.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) video.pause();
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting || entry.intersectionRatio < .3) video.pause();
            }
        }, { threshold: [0, .3] }).observe(video);
    }
})();
