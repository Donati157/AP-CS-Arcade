// The in-race overlay.
//
// The recordings keep the racing view almost completely clear: a thin strip along the bottom with
// the checkpoint counter, the clock against the record, and the speed, plus a small menu in the top
// corner. Poly Kart does the same, with its own wording and artwork.

import { formatTime, formatDelta } from './run.js';
import { speedKmh } from './physics.js';

export class Hud {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="pk-corner">
        <button type="button" class="pk-chip" data-action="exit">Exit</button>
        <button type="button" class="pk-chip" data-action="restart">Restart</button>
        <span class="pk-track-name"></span>
        <span class="pk-software" hidden>software mode</span>
      </div>
      <p class="pk-message" hidden></p>
      <p class="pk-flash" hidden></p>
      <div class="pk-bar">
        <span class="pk-checkpoints"><b>0</b>/<i>0</i></span>
        <span class="pk-times">
          <span><small>Best</small><b class="pk-best">--:--.---</b></span>
          <span><small>Time</small><b class="pk-current">00:00.000</b></span>
          <span><small>Gap</small><b class="pk-delta"></b></span>
        </span>
        <span class="pk-speed"><b>0</b><small>km/h</small></span>
      </div>
      <div class="pk-touch" hidden>
        <button type="button" class="pk-pad pk-pad-left" data-touch="left" aria-label="Steer left"></button>
        <button type="button" class="pk-pad pk-pad-right" data-touch="right" aria-label="Steer right"></button>
        <button type="button" class="pk-pad pk-pad-brake" data-touch="brake" aria-label="Brake">B</button>
        <button type="button" class="pk-pad pk-pad-throttle" data-touch="throttle" aria-label="Accelerate">A</button>
      </div>`;
    this.elements = {
      trackName: root.querySelector('.pk-track-name'),
      message: root.querySelector('.pk-message'),
      flash: root.querySelector('.pk-flash'),
      passed: root.querySelector('.pk-checkpoints b'),
      total: root.querySelector('.pk-checkpoints i'),
      best: root.querySelector('.pk-best'),
      current: root.querySelector('.pk-current'),
      delta: root.querySelector('.pk-delta'),
      speed: root.querySelector('.pk-speed b'),
      touch: root.querySelector('.pk-touch'),
      software: root.querySelector('.pk-software'),
    };
    this.flashTimer = 0;
    this.shown = { current: '', delta: '', speed: -1, passed: -1, message: '' };
  }

  // Shown only when the game had to fall back, so nobody wonders why it looks coarser.
  setSoftwareNotice(on) {
    this.elements.software.hidden = !on;
    if (on) this.elements.software.title = 'This browser has no WebGL, so Poly Kart is drawing the same 3D scene in software.';
  }

  setTrack(track, best) {
    this.elements.trackName.textContent = track.name;
    this.elements.total.textContent = String(track.checkpointCount);
    this.elements.best.textContent = best === null ? '--:--.---' : formatTime(best);
  }

  // Touch controls only appear on a device that actually has a touch screen.
  enableTouch(enabled) {
    this.elements.touch.hidden = !enabled;
  }

  setMessage(lines) {
    const text = lines ? lines.join('\n') : '';
    if (text === this.shown.message) return;
    this.shown.message = text;
    this.elements.message.hidden = !lines;
    this.elements.message.textContent = text;
  }

  flash(text) {
    this.elements.flash.textContent = text;
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
