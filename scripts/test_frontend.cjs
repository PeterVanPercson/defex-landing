const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

class Element {
    constructor() {
        this.listeners = {};
        this.attributes = new Map();
        this.dataset = {};
        this.style = { setProperty(k, v) { this[k] = v; }, getPropertyValue(k) { return this[k] || ''; } };
        const classes = new Set();
        this.classList = {
            add: (...names) => names.forEach(n => classes.add(n)),
            remove: (...names) => names.forEach(n => classes.delete(n)),
            contains: n => classes.has(n),
            toggle: (n, on) => on ? classes.add(n) : classes.delete(n),
        };
        this.offsetTop = 0;
        this.offsetHeight = 700;
        this.paused = true;
        this.muted = true;
        this.duration = 8;
        this.readyState = 0;
        this.currentTime = 0;
        this.poster = '/first.webp';
        this.playCount = 0;
    }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    emit(name, event = {}) { for (const fn of this.listeners[name] || []) fn(event); }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) ?? null; }
    hasAttribute(k) { return this.attributes.has(k); }
    removeAttribute(k) { this.attributes.delete(k); }
    set src(v) { this.setAttribute('src', v); }
    get src() { return this.getAttribute('src') || ''; }
    load() { this.readyState = 0; }
    canPlayType() { return 'probably'; }
    play() { this.playCount++; this.paused = false; this.emit('play'); return Promise.resolve(); }
    pause() { this.paused = true; this.emit('pause'); }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    closest() { return this.parent; }
}

function page({ reduced = false, saveData = false } = {}) {
    const doc = new Element(), root = new Element(), win = new Element(), motion = new Element();
    const ids = {}, selectors = {}, observers = [], frames = new Map(), timers = new Map();
    let seq = 0, now = 0;
    motion.matches = reduced;
    doc.documentElement = root;
    doc.hidden = false;
    doc.getElementById = id => ids[id] || null;
    doc.querySelector = selector => selectors[selector] || null;
    doc.querySelectorAll = selector => selectors[selector] || [];
    doc.head = { appendChild: el => el };
    doc.createElement = () => new Element();
    class Observer {
        constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
        observe(target) { this.targets.push(target); }
        unobserve() {}
        disconnect() {}
        enter(target, visible = true) { this.callback([{ target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]); }
    }
    const context = {
        document: doc, navigator: { connection: { saveData } }, console,
        matchMedia: query => query.includes('reduced-motion') ? motion : { matches: false },
        getComputedStyle: () => ({ height: '0', getPropertyValue: () => '64' }),
        addEventListener: win.addEventListener.bind(win),
        requestAnimationFrame: fn => { const id = ++seq; frames.set(id, fn); return id; },
        cancelAnimationFrame: id => frames.delete(id),
        setTimeout: (fn, ms) => { const id = ++seq; timers.set(id, { fn, at: now + ms }); return id; },
        clearTimeout: id => timers.delete(id), setInterval: () => 0,
        IntersectionObserver: Observer, ResizeObserver: Observer,
        performance: { now: () => now }, innerWidth: 1280, innerHeight: 720, scrollY: 0,
    };
    context.window = context;
    vm.createContext(context);
    return {
        doc, root, ids, selectors, observers, frames, timers, context,
        run: name => vm.runInContext(readFileSync(resolve(__dirname, '../static/js/', name), 'utf8'), context),
        motion: value => { motion.matches = value; motion.emit('change', { matches: value }); },
        event: (name, event) => win.emit(name, event),
        frame: () => { now += 17; const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn(now)); },
        advance: ms => { now += ms; for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); } },
    };
}

function hero(options) {
    const p = page(options), film = new Element(), hero = new Element(), sticky = new Element();
    film.dataset = { fps: '60', src: '/film.mp4', srcSm: '/small.mp4', posterFinal: '/final.webp', type: 'video/mp4' };
    hero.offsetHeight = 2100;
    hero.querySelector = () => sticky;
    p.selectors['.hero'] = hero;
    p.ids.film = film;
    p.run('hero-film.js');
    return { ...p, film };
}

test('reduced motion and data saver load the hero still without a video request', () => {
    for (const options of [{ reduced: true }, { saveData: true }]) {
        const p = hero(options);
        assert.equal(p.film.src, '');
        assert.equal(p.film.poster, '/final.webp');
        assert.equal(p.root.classList.contains('has-scroll-film'), false);
    }
});

test('changing reduced motion stops scrubbing and can restore it', () => {
    const p = hero();
    p.film.readyState = 2;
    p.film.emit('loadeddata');
    p.context.scrollY = 600;
    p.event('scroll'); p.frame();
    p.motion(true);
    const time = p.film.currentTime;
    p.context.scrollY = 1000;
    p.event('scroll'); p.event('pointerdown'); p.frame();
    assert.equal(p.film.currentTime, time);
    assert.equal(p.film.playCount, 0);
    assert.equal(p.film.src, '');
    assert.equal(p.root.classList.contains('has-scroll-film'), false);
    p.motion(false);
    assert.equal(p.film.src, '/small.mp4');
    assert.equal(p.root.classList.contains('has-scroll-film'), true);
});

test('a stalled hero releases its pinned scroll area', () => {
    const p = hero();
    p.advance(12000);
    assert.equal(p.root.classList.contains('has-scroll-film'), false);
    assert.equal(p.film.src, '');
});

test('a loaded hero cancels the loading timeout', () => {
    const p = hero();
    p.film.readyState = 2; p.film.emit('loadeddata'); p.advance(12000);
    assert.equal(p.root.classList.contains('has-scroll-film'), true);
});

test('backgrounding the page stops hero frame updates', () => {
    const p = hero();
    p.film.readyState = 2; p.film.emit('loadeddata'); p.frame();
    p.doc.hidden = true; p.doc.emit('visibilitychange');
    const time = p.film.currentTime;
    p.context.scrollY = 1100; p.event('scroll'); p.frame();
    assert.equal(p.film.currentTime, time);
});

test('origin video pauses in a hidden tab and retains an explicit user pause', () => {
    const p = page(), video = new Element(), surface = new Element();
    video.parent = new Element();
    p.ids['origin-video'] = video; p.ids.playpause = surface;
    p.ids.sound = new Element(); p.ids.flash = new Element();
    p.run('origin.js');
    p.observers[0].enter(video);
    assert.equal(video.paused, false);
    p.doc.hidden = true; p.doc.emit('visibilitychange');
    assert.equal(video.paused, true);
    p.doc.hidden = false; p.doc.emit('visibilitychange');
    assert.equal(video.paused, false);
    surface.emit('click');
    p.observers[0].enter(video, false); p.observers[0].enter(video);
    assert.equal(video.paused, true);
    assert.equal(surface.classList.contains('is-paused'), true);
});

function calendar() {
    const p = page(), mount = new Element(), panel = new Element(), status = new Element();
    mount.parent = panel; mount.dataset.cal = 'defex/test';
    panel.querySelector = () => status; p.ids['cal-inline'] = mount;
    p.run('book.js'); p.observers[0].enter(mount);
    const event = name => p.context.Cal.ns.defex.q.find(([call, data]) => call === 'on' && data.action === name)[1].callback();
    return { ...p, mount, panel, status, calEvent: event };
}

test('calendar timeout exposes recovery instead of an empty booking frame', () => {
    const p = calendar();
    assert.equal(p.panel.dataset.state, 'loading');
    p.advance(12000);
    assert.equal(p.panel.dataset.state, 'failed');
    assert.equal(p.mount.getAttribute('aria-busy'), 'false');
});

test('calendar can recover after a timeout and reports provider failure', () => {
    const p = calendar(); p.advance(12000); p.calEvent('linkReady');
    assert.equal(p.panel.dataset.state, 'ready');
    p.calEvent('linkFailed');
    assert.equal(p.panel.dataset.state, 'failed');
});

test('calendar readiness cancels the failure timeout', () => {
    const p = calendar(); p.calEvent('linkReady'); p.advance(12000);
    assert.equal(p.panel.dataset.state, 'ready');
});

test('Why us stops its animation clock when reduced motion is enabled', () => {
    const p = page(), arm = new Element(), nodes = {};
    arm.querySelector = selector => nodes[selector] ||= new Element();
    p.selectors['.arm'] = [arm]; p.run('why.js');
    p.observers[0].enter(arm); p.frame();
    assert.ok(p.frames.size > 0);
    p.motion(true);
    assert.equal(p.frames.size, 0);
    p.motion(false);
    assert.ok(p.frames.size > 0);
});

test('reduced motion skips the Spline WebGL probe and shows the still', () => {
    const p = page({ reduced: true }), host = new Element();
    let probes = 0;
    p.selectors['[data-spline]'] = host;
    p.doc.createElement = () => { probes++; return { getContext: () => null }; };
    p.run('spline.js');
    assert.equal(probes, 0);
    assert.equal(host.classList.contains('is-failed'), true);
});
