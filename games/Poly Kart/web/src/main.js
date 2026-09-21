// Boot and screen flow: track list -> race -> result -> race again or back to the list.

import { Game } from './game.js';
import { RendererError } from './renderer.js';
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
      showFailure(error);
      return;
    }
    game.onFinish = showResult;
    hud.enableTouch(matchMedia('(pointer: coarse)').matches);
    wireHud();
    if (game.software) {
      console.info('Poly Kart: no WebGL here, so the software renderer is drawing.', game.contextFallbackReason?.detail);
      hud.setSoftwareNotice(true);
    }
  }
  game.load(trackById(id));
  game.start();
  showDiagnostics();
  canvas.focus();
}

// Says what actually went wrong. Only a genuine missing context earns the "your browser" wording;
// a shader that would not compile is our bug and is reported as our bug.
function showFailure(error) {
  const stage = error instanceof RendererError ? error.stage : 'unknown';
  const wording = {
    context: {
      title: 'Poly Kart cannot get a 3D canvas',
      body: 'Every way of asking this browser for a WebGL canvas was refused. That usually means 3D is switched off for this browser or blocked by the graphics driver.',
    },
    shader: {
      title: 'Poly Kart failed to start',
      body: 'The graphics code would not compile on this browser. That is a bug in the game, not a problem with your machine. The details below say exactly what was rejected.',
    },
    link: {
      title: 'Poly Kart failed to start',
      body: 'The graphics program would not link on this browser. That is a bug in the game, not a problem with your machine.',
    },
    unknown: {
      title: 'Poly Kart failed to start',
      body: 'Something went wrong while setting the race up. The details below say what.',
    },
  }[stage];
  fatal.querySelector('.pk-fatal-title').textContent = wording.title;
  fatal.querySelector('.pk-fatal-body').textContent = wording.body;
  const detail = [
    `stage: ${stage}`,
    `message: ${error.message}`,
    error.detail ? `detail: ${Array.isArray(error.detail) ? error.detail.join(' | ') : error.detail}` : null,
    `browser: ${navigator.userAgent}`,
  ].filter(Boolean).join('\n');
  fatal.querySelector('.pk-fatal-detail').textContent = detail;
  show(fatal, true);
  show(menu, false);
  console.error('Poly Kart could not start.', { stage, message: error.message, detail: error.detail });
}

// A development read-out, off unless the address ends in ?debug=1.
function showDiagnostics() {
  if (!game || !new URLSearchParams(location.search).has('debug')) return;
  const box = document.getElementById('pk-debug');
  const lines = Object.entries(game.renderer.diagnostics())
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : value}`);
  box.textContent = [`browser: ${navigator.userAgent}`, ...lines].join('\n');
  box.hidden = false;
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

fatal.addEventListener('click', (event) => {
  if (event.target.closest('[data-action]')?.dataset.action === 'retry') {
    show(fatal, false);
    startTrack(currentTrackId);
  }
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
  // Reports how far start-up got, which is what the cross-browser smoke test checks.
  status() {
    return {
      menuShown: !menu.hidden,
      failureShown: !fatal.hidden,
      rendererReady: !!game,
      contextId: game ? game.renderer.contextId : null,
      contextLost: game ? game.renderer.lost : null,
      framesDrawn: game ? game.framesDrawn : 0,
      running: game ? game.running : false,
      diagnostics: game ? game.renderer.diagnostics() : null,
    };
  },
};
