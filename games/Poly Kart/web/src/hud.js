// The in-race overlay.
//
// An arcade HUD, not a row of web cards. Three anchored clusters and nothing in the middle:
// the clock top centre where the eye can catch it without leaving the road, the checkpoint
// progress top left, and the speed bottom right where it belongs on a racer. The centre of the
// screen stays clear for driving.

import { formatTime, formatDelta } from './run.js';
import { speedKmh } from './physics.js';

export class Hud {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="pk-corner">
        <button type="button" class="pk-chip" data-action="exit">Exit</button>
        <button type="button" class="pk-chip" data-action="restart">Restart</button>
      </div>

      <div class="pk-progress">
        <span class="pk-progress-label">Checkpoint</span>
        <span class="pk-progress-count"><b>0</b><i>/0</i></span>
        <span class="pk-progress-track"></span>
        <span class="pk-software" hidden>software mode</span>
      </div>

      <div class="pk-clock">
        <span class="pk-clock-time">00:00.000</span>
        <span class="pk-clock-row">
          <span class="pk-clock-best">Best --:--.---</span>
          <span class="pk-delta"></span>
        </span>
      </div>

      <div class="pk-speedo">
        <span class="pk-speedo-value">0</span>
        <span class="pk-speedo-unit">km/h</span>
      </div>

      <p class="pk-countdown" hidden></p>
      <p class="pk-flash" hidden></p>
      <p class="pk-message" hidden></p>

      <div class="pk-touch" hidden>
        <button type="button" class="pk-pad pk-pad-left" data-touch="left" aria-label="Steer left"></button>
        <button type="button" class="pk-pad pk-pad-right" data-touch="right" aria-label="Steer right"></button>
        <button type="button" class="pk-pad pk-pad-brake" data-touch="brake" aria-label="Brake">B</button>
        <button type="button" class="pk-pad pk-pad-throttle" data-touch="throttle" aria-label="Accelerate">A</button>
      </div>`;
    this.elements = {
      trackName: root.querySelector('.pk-progress-track'),
      message: root.querySelector('.pk-message'),
      flash: root.querySelector('.pk-flash'),
      countdown: root.querySelector('.pk-countdown'),
      passed: root.querySelector('.pk-progress-count b'),
      total: root.querySelector('.pk-progress-count i'),
      best: root.querySelector('.pk-clock-best'),
      current: root.querySelector('.pk-clock-time'),
      delta: root.querySelector('.pk-delta'),
      speed: root.querySelector('.pk-speedo-value'),
      touch: root.querySelector('.pk-touch'),
      software: root.querySelector('.pk-software'),
    };
    this.flashTimer = 0;
    this.shown = { current: '', delta: '', speed: -1, passed: -1, message: '', countdown: '' };
  }

  setSoftwareNotice(on) {
    this.elements.software.hidden = !on;
    if (on) this.elements.software.title = 'This browser has no WebGL, so Poly Kart is drawing the same 3D scene in software.';
  }

  setTrack(track, best) {
    this.elements.trackName.textContent = track.name;
    this.elements.total.textContent = `/${track.checkpointCount}`;
    this.elements.best.textContent = `Best ${best === null ? '--:--.---' : formatTime(best)}`;
  }

  enableTouch(enabled) {
    this.elements.touch.hidden = !enabled;
  }

  // "3", "2", "1", then "GO". Passing null clears it.
  setCountdown(text) {
    if (text === this.shown.countdown) return;
    this.shown.countdown = text;
    this.elements.countdown.hidden = text === null;
    if (text === null) return;
    this.elements.countdown.textContent = text;
    this.elements.countdown.className = `pk-countdown ${text === 'GO' ? 'is-go' : ''}`;
    // Restarting the animation needs the element to be reflowed between runs.
    this.elements.countdown.style.animation = 'none';
    void this.elements.countdown.offsetWidth;
    this.elements.countdown.style.animation = '';
  }

  setMessage(lines) {
    const text = lines ? lines.join('\n') : '';
    if (text === this.shown.message) return;
    this.shown.message = text;
    this.elements.message.hidden = !lines;
    this.elements.message.textContent = text;
  }

  flash(text, tone = '') {
    this.elements.flash.textContent = text;
    this.elements.flash.className = `pk-flash ${tone}`;
    this.elements.flash.hidden = false;
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => { this.elements.flash.hidden = true; }, 1400);
  }

  // Called every frame. Each field is compared before writing, so a steady screen does no DOM work.
  update(run, car, best) {
    const current = formatTime(run.elapsed);
    if (current !== this.shown.current) { this.elements.current.textContent = current; this.shown.current = current; }

    const speed = speedKmh(car);
    if (speed !== this.shown.speed) { this.elements.speed.textContent = String(speed); this.shown.speed = speed; }

    if (run.passed !== this.shown.passed) { this.elements.passed.textContent = String(run.passed); this.shown.passed = run.passed; }

    // With no record there is nothing to compare against, which is how the reference shows it too.
    const delta = best === null || !run.started ? '' : formatDelta(run.elapsed - best);
    if (delta !== this.shown.delta) {
      this.elements.delta.textContent = delta;
      this.elements.delta.className = `pk-delta ${delta.startsWith('-') ? 'is-ahead' : delta ? 'is-behind' : ''}`;
      this.shown.delta = delta;
    }
  }

  dispose() {
    clearTimeout(this.flashTimer);
    this.root.innerHTML = '';
  }
}
