// The in-race overlay.
//
// An arcade HUD, not a row of web cards. Three anchored clusters and nothing in the middle:
// the clock top centre where the eye can catch it without leaving the road, the checkpoint
// progress top left, and the speed bottom right where it belongs on a racer. The centre of the
// screen stays clear for driving.

import { formatTime, ordinal, standings } from './run.js';
import { speedKmh } from './physics.js';

export class Hud {
  constructor(root) {
    this.root = root;
    root.innerHTML = `
      <div class="pk-corner">
        <button type="button" class="pk-chip" data-action="exit">Exit</button>
        <button type="button" class="pk-chip" data-action="restart">Restart</button>
      </div>

      <div class="pk-standing">
        <span class="pk-place"><b>1</b><i>st</i></span>
        <span class="pk-standing-meta">
          <span class="pk-place-of">of 5</span>
          <span class="pk-lap">Lap <b>1</b><i>/3</i></span>
          <span class="pk-progress-track"></span>
          <span class="pk-software" hidden>software mode</span>
        </span>
      </div>

      <div class="pk-clock">
        <span class="pk-clock-time">00:00.000</span>
        <span class="pk-clock-row">
          <span class="pk-clock-best">Best lap --:--.---</span>
        </span>
      </div>

      <ol class="pk-order"></ol>

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
      place: root.querySelector('.pk-place b'),
      placeSuffix: root.querySelector('.pk-place i'),
      placeOf: root.querySelector('.pk-place-of'),
      lap: root.querySelector('.pk-lap b'),
      lapOf: root.querySelector('.pk-lap i'),
      best: root.querySelector('.pk-clock-best'),
      current: root.querySelector('.pk-clock-time'),
      order: root.querySelector('.pk-order'),
      speed: root.querySelector('.pk-speedo-value'),
      touch: root.querySelector('.pk-touch'),
      software: root.querySelector('.pk-software'),
    };
    this.flashTimer = 0;
    this.shown = { current: '', speed: -1, place: -1, lap: -1, message: '', countdown: '', order: '' };
  }

  setSoftwareNotice(on) {
    this.elements.software.hidden = !on;
    if (on) this.elements.software.title = 'This browser has no WebGL, so Poly Kart is drawing the same 3D scene in software.';
  }

  setTrack(track, best, totalLaps) {
    this.elements.trackName.textContent = track.name;
    this.elements.lapOf.textContent = `/${totalLaps}`;
    this.elements.best.textContent = `Best lap ${best === null ? '--:--.---' : formatTime(best)}`;
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
  update(race, player, racers, track, best) {
    const current = formatTime(race.elapsed);
    if (current !== this.shown.current) { this.elements.current.textContent = current; this.shown.current = current; }

    const speed = speedKmh(player.car);
    if (speed !== this.shown.speed) { this.elements.speed.textContent = String(speed); this.shown.speed = speed; }

    const order = standings(racers, track);
    const place = order.indexOf(player) + 1;
    if (place !== this.shown.place) {
      this.elements.place.textContent = String(place);
      this.elements.placeSuffix.textContent = ordinal(place).replace(String(place), '');
      this.elements.placeOf.textContent = `of ${racers.length}`;
      this.shown.place = place;
    }

    if (player.progress.lap !== this.shown.lap) {
      this.elements.lap.textContent = String(player.progress.lap);
      this.shown.lap = player.progress.lap;
    }

    const bestLap = player.progress.bestLap ?? best;
    const bestText = `Best lap ${bestLap === null || bestLap === undefined ? '--:--.---' : formatTime(bestLap)}`;
    if (bestText !== this.shown.bestText) { this.elements.best.textContent = bestText; this.shown.bestText = bestText; }

    // The running order down the side, so you can see who you are actually racing.
    const rows = order.map((racer, index) => {
      const gap = racer.progress.finished ? formatTime(racer.progress.finishTime) : `L${racer.progress.lap}`;
      return `<li class="${racer.isPlayer ? 'is-you' : ''}"><span class="pk-order-place">${index + 1}</span><span class="pk-order-dot" style="background:${racer.colour.body}"></span><span class="pk-order-name">${racer.name}</span><span class="pk-order-gap">${gap}</span></li>`;
    }).join('');
    if (rows !== this.shown.order) { this.elements.order.innerHTML = rows; this.shown.order = rows; }
  }

  dispose() {
    clearTimeout(this.flashTimer);
    this.root.innerHTML = '';
  }
}
