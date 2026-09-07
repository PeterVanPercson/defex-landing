import test from 'node:test';
import assert from 'node:assert/strict';
import {DefexRobot} from './defex-robot.js';

function fixture() {
    const robot = Object.create(DefexRobot.prototype);
    Object.assign(robot, {
        _scrollDriven: true, _scrollEngaged: false, _reduced: false,
        _phase: 'intro', _modelReady: false, _timers: [],
        _video: {readyState: 4, duration: 5, currentTime: 0, seeking: false, style: {}, pause() {this.paused = true;}},
        _poster: {style: {}}, _start: {hidden: false},
        _phaseTo(phase) {this._phase = phase;},
        _handoff() {this._phase = 'interactive';},
    });
    return robot;
}

test('opening remains automatic until scrolling begins; scroll maps into the film', () => {
    const robot = fixture();
    robot.setScrollProgress(0);
    assert.equal(robot._video.paused, undefined);
    robot.setScrollProgress(.5);
    assert.equal(robot._video.paused, true);
    assert.equal(robot._phase, 'scroll');
    assert.equal(robot._video.currentTime, 3.3);
});

test('reversing scroll exits the live model and restores the matching film frame', () => {
    const robot = fixture();
    robot._modelReady = true;
    robot.setScrollProgress(1);
    assert.equal(robot._phase, 'interactive');
    robot.setScrollProgress(.25);
    assert.equal(robot._phase, 'scroll');
    assert.equal(robot._introFinished, false);
    assert.equal(robot._video.style.opacity, '1');
    assert.equal(robot._video.currentTime, 2.4749999999999996);
});

test('slow seeking takes the latest scroll position; failed 3D keeps film available', () => {
    const robot = fixture();
    robot._video.seeking = true;
    robot.setScrollProgress(.4);
    robot.setScrollProgress(1);
    assert.equal(robot._video.currentTime, 0);
    robot._video.seeking = false;
    robot._seekScrollFrame();
    assert.equal(robot._video.currentTime, 4.949999999999999);
    assert.equal(robot._phase, 'scroll');
});

test('reduced motion does not seek or start the film', () => {
    const robot = fixture();
    robot._reduced = true;
    robot.setScrollProgress(.7);
    assert.equal(robot._video.currentTime, 0);
    assert.equal(robot._scrollEngaged, false);
});

test('hover never rotates; deliberate dragging still rotates', () => {
    const robot = fixture();
    const listeners = {};
    robot._phase = 'interactive';
    robot._targetTheta = 0;
    robot._stage = {addEventListener(name, fn) {listeners[name] = fn;}, classList: {add() {}, remove() {}}, setPointerCapture() {}};
    robot.getAttribute = () => 'false';
    robot.getBoundingClientRect = () => ({width: 600});
    robot._bind(new AbortController().signal);
    const event = {pointerType: 'mouse', clientX: 100, button: 0, pointerId: 1, target: {closest: () => null}};
    listeners.pointerenter(event);
    listeners.pointermove({...event, clientX: 300});
    assert.equal(robot._targetTheta, 0);
    listeners.pointerdown(event);
    listeners.pointermove({...event, clientX: 300});
    assert.notEqual(robot._targetTheta, 0);
});
