// The origin film inside the iPhone drawn on the home page, with the controls
// an iPhone's own player has: the dimmed film, back 10 / play / forward 10 in
// the middle, a glass button for the sound, and the capsule bar with the time
// gone and the time left under it. They are up while the film waits; while it
// plays they go away, and a move or a tap brings them back. The film has a
// voice, so nothing starts it but a press, and it starts with its sound on.
(() => {
    const video = document.getElementById('origin-video');
    const surface = document.getElementById('origin-surface');
    const button = document.getElementById('playpause');
    const sound = document.getElementById('sound');
    const scrub = document.getElementById('scrub');
    if (!video || !surface || !button || !sound || !scrub) return;
    const back = document.getElementById('skip-back');
    const forward = document.getElementById('skip-forward');
    const film = video.closest('.origin__film');
    const screen = video.closest('.origin__screen');
    const fill = scrub.querySelector('.scrub__fill');
    const nowText = scrub.querySelector('.scrub__time--now');
    const endText = scrub.querySelector('.scrub__time--end');
    if (!film || !screen || !fill || !nowText || !endText) return;

    // the speaker the way the phone draws it: filled, with its two waves, and struck through when it is off
    const SPEAKER = '<path d="M3 9.6v4.8a1 1 0 0 0 1 1h2.9l4.2 3.5a.9.9 0 0 0 1.5-.7V5.8a.9.9 0 0 0-1.5-.7L6.9 8.6H4a1 1 0 0 0-1 1z"/><path d="M15.6 9.2a4 4 0 0 1 0 5.6M18.3 6.6a7.7 7.7 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    const ICONS = {
        loud: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${SPEAKER}</svg>`,
        muted: `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><mask id="origin-slash"><rect width="24" height="24" fill="#fff"/><path d="M4.3 3.4 20.7 19.8" stroke="#000" stroke-width="4.4" stroke-linecap="round"/></mask><g mask="url(#origin-slash)">${SPEAKER}</g><path d="M4.6 3.9 20.2 19.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    };
    const STEPS = new Map([['ArrowLeft', -5], ['ArrowDown', -5], ['ArrowRight', 5], ['ArrowUp', 5], ['PageDown', -10], ['PageUp', 10]]);
    // how far the bar can be pulled past either end, in px
    const STRETCH = 50;
    // what the two buttons beside play move by, in seconds
    const SKIP = 10;

    // The length is in the markup, so the bar can say it while the film itself
    // is still unfetched (preload="none").
    let duration = Number(video.dataset.duration) || 0;
    let shown = 0;          // the second the bar shows
    let parked = null;      // a second picked before the film had loaded, applied once it has
    let queued = null;      // the newest second asked for while the last seek is still landing
    let scrubbing = false;
    let resume = false;     // it was playing when the scrub began
    let touch = null;       // a finger on the bar that has not yet shown whether it scrubs or scrolls the page
    let grip = null;        // a finger that is scrubbing: where it started, and the second the bar was on
    let finger = false;     // the last press on the film itself came from a finger
    let pointer = null;     // where the mouse last woke the controls
    let frame = 0, idle = 0, dwell = 0;

    const clamp = (value, low, high) => Math.min(Math.max(value, low), high);

    // 0:07, not 00:07: the way the phone writes it
    function clock(seconds) {
        const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
        return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    }

    // the time left, on the right, counted in whole seconds like the time gone
    function left(seconds) {
        return `-${clock(Math.floor(duration) - Math.floor(clamp(seconds, 0, duration)))}`;
    }

    function paintTime(seconds) {
        shown = seconds;
        fill.style.transform = `scaleX(${duration ? clamp(seconds / duration, 0, 1).toFixed(4) : 0})`;
        const text = clock(seconds);
        if (nowText.textContent === text) return;
        nowText.textContent = text;
        endText.textContent = left(seconds);
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
        button.setAttribute('aria-label', playing ? 'Pause the film' : 'Play the film');
        if (playing && !frame) frame = requestAnimationFrame(tick);
    }

    function paintSound() {
        sound.innerHTML = video.muted ? ICONS.muted : ICONS.loud;
        sound.setAttribute('aria-pressed', String(!video.muted));
        sound.setAttribute('aria-label', video.muted ? 'Turn on sound' : 'Turn off sound');
    }

    // The controls over a playing film: up for a while, then gone again.
    function rest() {
        clearTimeout(idle);
        film.classList.remove('is-awake');
    }
    function wake(ms) {
        film.classList.add('is-awake');
        clearTimeout(idle);
        idle = setTimeout(rest, ms);
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
        // the pause button stays a moment, as the phone's does, then leaves the film alone
        wake(900);
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
            endText.textContent = left(shown);
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

    // A mouse brings the controls up by moving; they leave when it stops or goes.
    screen.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        if (pointer && Math.abs(event.clientX - pointer.x) + Math.abs(event.clientY - pointer.y) < 2) return;
        pointer = { x: event.clientX, y: event.clientY };
        if (!scrubbing) wake(2200);
    });
    screen.addEventListener('pointerleave', (event) => {
        if (event.pointerType === 'mouse' && !scrubbing) rest();
    });
    // someone working it from the keyboard has to see what they are on
    film.addEventListener('focusin', () => wake(4000));
    film.addEventListener('keydown', () => wake(4000));

    // The film itself. Waiting, any press starts it. Playing, a finger's tap
    // shows or hides the controls, as on the phone (it is the button that
    // pauses), and a mouse click pauses, as it does everywhere else.
    surface.addEventListener('pointerdown', (event) => {
        finger = event.pointerType === 'touch';
    });
    surface.addEventListener('click', () => {
        if (video.paused || video.ended) play();
        else if (!finger) video.pause();
        else if (film.classList.contains('is-awake')) rest();
        else wake(3200);
    });
    button.addEventListener('click', () => {
        if (video.paused || video.ended) play(); else video.pause();
    });
    function skip(by) {
        seek(clamp(shown + by, 0, duration));
        wake(3200);
    }
    if (back) back.addEventListener('click', () => skip(-SKIP));
    if (forward) forward.addEventListener('click', () => skip(SKIP));

    // Sound is a choice made on its own: it never starts or stops the film.
    sound.addEventListener('click', () => {
        video.muted = !video.muted;
        paintSound();
        wake(3200);
    });

    // Where the bar is being taken. A mouse is on the second it picks. A finger
    // moves the bar by as much as it has moved, from where the bar was: an
    // iPhone's does not jump to the touch. Past an end the bar gives, less the
    // further it is pulled, and never past the edge of the screen it sits in.
    function aim(event) {
        const box = scrub.getBoundingClientRect();
        const edge = screen.getBoundingClientRect();
        const x = grip ? (duration ? grip.from / duration : 0) * box.width + event.clientX - grip.x : event.clientX - box.left;
        const give = (px) => 2 * (1 / (1 + Math.exp(-px / STRETCH)) - .5) * STRETCH;
        const room = (side) => Math.max(0, (side < 0 ? box.left - edge.left : edge.right - box.left - box.width) - 6);
        const past = x < 0 ? -Math.min(give(-x), room(-1)) : x > box.width ? Math.min(give(x - box.width), room(1)) : 0;
        return { seconds: box.width ? clamp(x, 0, box.width) / box.width * duration : 0, past, width: box.width };
    }

    function stretch(past, width) {
        const by = Math.abs(past);
        scrub.classList.remove('is-settling');
        if (by) scrub.dataset.pull = past < 0 ? 'left' : 'right';
        scrub.style.setProperty('--sx', (1 + (width ? by / width : 0)).toFixed(4));
        scrub.style.setProperty('--sy', (1 - .2 * by / STRETCH).toFixed(4));
    }

    function begin() {
        scrubbing = true;
        resume = !video.paused && !video.ended;
        // the bar stays while it is held; everything else gets out of the picture's way
        clearTimeout(idle);
        film.classList.add('is-awake');
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
        touch = grip = null;
        if (!scrubbing) return;
        scrubbing = false;
        film.classList.remove('is-scrubbing');
        // let go, the stretch springs back (the transition is on .is-settling)
        scrub.classList.add('is-settling');
        scrub.style.setProperty('--sx', '1');
        scrub.style.setProperty('--sy', '1');
        if (resume && !document.hidden) play();
        wake(2600);
        paintState();
    }

    // a drag on the bar is never the start of a text selection
    scrub.addEventListener('mousedown', (event) => event.preventDefault());
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
            grip = { x: touch.x, from: shown };
            touch = null;
            begin();
        }
        if (scrubbing) drag(event);
    });
    scrub.addEventListener('pointerup', (event) => {
        // a tap, with no drag, goes to the second it landed on
        if (touch) { touch = null; begin(); drag(event); }
        end();
    });
    scrub.addEventListener('pointercancel', end);
    scrub.addEventListener('lostpointercapture', end);
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
