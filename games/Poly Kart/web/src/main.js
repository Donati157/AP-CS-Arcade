// Boot and screen flow: track list -> race -> result -> race again or back to the list.

import { Game } from './game.js';
import { RendererError } from './renderer.js';
import { Hud } from './hud.js';
import { createInput } from './input.js';
import { TRACKS, trackById } from './tracks.js';
import { formatTime, ordinal } from './run.js';
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
            <span class="pk-track-meta">3 laps &middot; ${track.checkpoints.length} checkpoints &middot; 5 karts</span>
          </span>
          <span class="pk-track-best">
            <small>Best</small>
            <b>${best === null ? '--:--.---' : formatTime(best)}</b>
          </span>
        </button>
      </li>`;
  }).join('');
  menu.querySelector('.pk-track-list').innerHTML = rows;
  const preview = menu.querySelector('.pk-kart-slot');
  if (preview && !preview.childElementCount) preview.innerHTML = KART_PREVIEW;
}

// A top-down plan of the track, drawn from the same control points the track is built from, with
// the start marked. Big enough to tell the two circuits apart at a glance, which the old thumbnail
// was not.
function outlineSvg(track) {
  const xs = track.points.map((p) => p.x);
  const zs = track.points.map((p) => p.z);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const span = Math.max(maxX - minX, maxZ - minZ) || 1;
  const pad = 9;
  const size = 100 - pad * 2;
  const place = (p) => [
    ((p.x - minX) / span) * size + pad + (size - ((maxX - minX) / span) * size) / 2,
    (100 - pad) - ((p.z - minZ) / span) * size - (size - ((maxZ - minZ) / span) * size) / 2,
  ];
  const points = track.points.map((p) => place(p).map((n) => n.toFixed(1)).join(',')).join(' ');
  const [sx, sy] = place(track.points[0]);
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <polyline class="pk-map-road" points="${points}" />
    <polyline class="pk-map-line" points="${points}" />
    <circle class="pk-map-start" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5" />
  </svg>`;
}

// A side view of the kart, in the kart's own colours, so the menu shows what you are about to drive.
const KART_PREVIEW = `<svg viewBox="0 0 220 104" class="pk-kart-preview" aria-hidden="true">
  <ellipse cx="112" cy="92" rx="84" ry="7" fill="rgba(0,0,0,0.3)" />
  <!-- rear wing on two stalks, the clearest "this end is the back" signal -->
  <rect x="24" y="30" width="34" height="6" rx="2" fill="#f5f1e6" />
  <rect x="33" y="34" width="4" height="20" fill="#8d97a5" />
  <rect x="48" y="34" width="4" height="20" fill="#8d97a5" />
  <!-- side pod and floor pan -->
  <path d="M40 70 L44 58 L96 54 L130 52 L176 56 L200 66 L198 74 L46 76 Z" fill="#b8451a" />
  <!-- main tub with a wedge nose -->
  <path d="M52 58 L64 46 L104 42 L132 42 L162 50 L196 64 L200 66 L176 56 L96 54 Z" fill="#e8622c" />
  <path d="M60 54 L70 44 L106 41 L134 41 L166 50 L196 63 L60 60 Z" fill="#e8622c" />
  <!-- roll hoop and screen -->
  <path d="M74 44 L78 26 L100 26 L104 42 Z" fill="#8d97a5" />
  <path d="M104 42 L108 32 L134 34 L140 44 Z" fill="#2e3f52" />
  <!-- the stripe down the middle -->
  <rect x="104" y="44" width="86" height="5" rx="2" fill="#f5f1e6" transform="rotate(6 104 44)" />
  <!-- exposed wheels -->
  <circle cx="62" cy="74" r="20" fill="#23262c" /><circle cx="62" cy="74" r="8" fill="#d8dde4" />
  <circle cx="166" cy="74" r="20" fill="#23262c" /><circle cx="166" cy="74" r="8" fill="#d8dde4" />
</svg>`;

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
  const won = outcome.place === 1;
  const kicker = result.querySelector('.pk-result-kicker');
  kicker.textContent = won ? 'Race won' : `Finished ${ordinal(outcome.place)}`;
  kicker.className = `pk-result-kicker ${won ? 'is-best' : ''}`;
  result.querySelector('.pk-result-track').textContent = trackById(currentTrackId).name;
  result.querySelector('.pk-result-time').textContent = formatTime(outcome.time);

  const notes = [];
  notes.push(`Best lap ${formatTime(outcome.bestLap)}`);
  if (outcome.improved && outcome.improvement !== null) notes.push(`${formatTime(outcome.improvement)} faster than your best race`);
  else if (outcome.improved) notes.push('Your first race here');
  else if (outcome.best !== null) notes.push(`Your best race is still ${formatTime(outcome.best)}`);
  const gap = result.querySelector('.pk-result-gap');
  gap.textContent = notes.join(' · ');
  gap.className = `pk-result-gap ${outcome.improved ? 'is-ahead' : ''}`;

  // The full finishing order, which is the part that makes it feel like a race result.
  result.querySelector('.pk-result-order').innerHTML = outcome.order.map((racer, index) => `
    <li class="${racer.isPlayer ? 'is-you' : ''}">
      <span class="pk-result-place">${index + 1}</span>
      <span class="pk-result-name">${racer.name}</span>
      <span class="pk-result-gap-time">${racer.finished ? formatTime(racer.time) : `lap ${racer.lap}`}</span>
    </li>`).join('');
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
      field: game ? game.racers.length : 0,
      lap: game ? game.player.progress.lap : 0,
      running: game ? game.running : false,
      diagnostics: game ? game.renderer.diagnostics() : null,
    };
  },
};
