// Boot and screen flow: track list -> race -> result -> race again or back to the list.

import { Game } from './game.js';
import { Hud } from './hud.js';
import { createInput } from './input.js';
import { TRACKS, trackById } from './tracks.js';
import { formatTime } from './run.js';
import { bestTime } from './storage.js';

const canvas = document.getElementById('pk-canvas');
const hudRoot = document.getElementById('pk-hud');
const menu = document.getElementById('pk-menu');
const result = document.getElementById('pk-result');
const fatal = document.getElementById('pk-fatal');

let game = null;
let hud = null;
let input = null;
let currentTrackId = TRACKS[0].id;

const show = (element, visible) => { element.hidden = !visible; };

function renderMenu() {
  const rows = TRACKS.map((track) => {
    const best = bestTime(track.id);
    return `
      <li>
        <button type="button" class="pk-track" data-track="${track.id}">
          <span class="pk-track-outline">${outlineSvg(track)}</span>
          <span class="pk-track-text">
            <strong>${track.name}</strong>
            <small>${track.blurb}</small>
          </span>
          <span class="pk-track-best">
            <small>Best</small>
            <b>${best === null ? 'No time yet' : formatTime(best)}</b>
          </span>
        </button>
      </li>`;
  }).join('');
  menu.querySelector('.pk-track-list').innerHTML = rows;
}

// A small top-down sketch of the track, drawn from the same control points the track is built from.
function outlineSvg(track) {
  const xs = track.points.map((p) => p.x);
  const zs = track.points.map((p) => p.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const span = Math.max(maxX - minX, maxZ - minZ) || 1;
  const points = track.points
    .map((p) => `${(((p.x - minX) / span) * 52 + 4).toFixed(1)},${(52 - ((p.z - minZ) / span) * 52 + 4).toFixed(1)}`)
    .join(' ');
  return `<svg viewBox="0 0 60 60" aria-hidden="true"><polyline points="${points}" /></svg>`;
}

function startTrack(id) {
  currentTrackId = id;
  show(menu, false);
  show(result, false);
  if (!game) {
    // The 3D context is asked for here rather than probed at boot. A probe can fail for a moment on
    // a page that has just been restored or is still waking its GPU up, and a game that hides
    // itself behind a "no WebGL" wall in that case is simply broken.
    try {
      hud = new Hud(hudRoot);
      input = createInput(window);
      game = new Game(canvas, hud, input);
    } catch (error) {
      game = null;
      if (hud) { hud.dispose(); hud = null; }
      if (input) { input.dispose(); input = null; }
      show(fatal, true);
      show(menu, false);
      console.error('Poly Kart could not start:', error);
      return;
    }
    game.onFinish = showResult;
    hud.enableTouch(matchMedia('(pointer: coarse)').matches);
    wireHud();
  }
  game.load(trackById(id));
  game.start();
  canvas.focus();
}

function showResult(outcome) {
  const improved = outcome.improved;
  result.querySelector('.pk-result-kicker').textContent = improved ? 'New personal best' : 'Run complete';
  result.querySelector('.pk-result-kicker').className = `pk-result-kicker ${improved ? 'is-best' : ''}`;
  result.querySelector('.pk-result-track').textContent = trackById(currentTrackId).name;
  result.querySelector('.pk-result-time').textContent = formatTime(outcome.time);
  const gap = result.querySelector('.pk-result-gap');
  if (improved && outcome.improvement !== null) {
    gap.textContent = `${formatTime(outcome.improvement)} faster than before`;
    gap.className = 'pk-result-gap is-ahead';
  } else if (!improved && outcome.best !== null) {
    gap.textContent = `Your best is still ${formatTime(outcome.best)}`;
    gap.className = 'pk-result-gap is-behind';
  } else {
    gap.textContent = 'Your first time on this track';
    gap.className = 'pk-result-gap';
  }
  show(result, true);
}

function wireHud() {
  hudRoot.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'exit') backToMenu();
    if (action === 'restart') startTrack(currentTrackId);
  });
  // Touch pads: press and release, including when the finger slides off the button.
  for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'pointerleave']) {
    hudRoot.addEventListener(type, (event) => {
      const control = event.target.closest('[data-touch]')?.dataset.touch;
      if (!control) return;
      event.preventDefault();
      input.setTouch(control, type === 'pointerdown');
    });
  }
}

function backToMenu() {
  if (game) game.stop();
  if (input) input.releaseAll();
  show(result, false);
  renderMenu();
  show(menu, true);
}

menu.addEventListener('click', (event) => {
  const id = event.target.closest('[data-track]')?.dataset.track;
  if (id) startTrack(id);
});

result.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'again') startTrack(currentTrackId);
  if (action === 'menu') backToMenu();
});

renderMenu();
show(menu, true);

// Useful for the automated browser tests, and harmless otherwise.
window.polyKart = {
  start: startTrack,
  menu: backToMenu,
  get game() { return game; },
  get input() { return input; },
  tracks: TRACKS,
};
