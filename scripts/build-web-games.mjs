#!/usr/bin/env node
// Builds the public web arcade from the games registered in games/<game>/game.json.
//
//   node scripts/build-web-games.mjs          validate + copy web files + write web/games.json
//   node scripts/build-web-games.mjs --check  validate only (no files written)
//
// A game is published only when its manifest says "status": "playable" AND its web entry file exists.
// Everything under web/games/ and web/games.json is generated; do not edit those by hand.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GAMES_DIR = join(ROOT, 'games');
const OUT_DIR = join(ROOT, 'web', 'games');
const REGISTRY_FILE = join(ROOT, 'web', 'games.json');
const SLOT_COUNT = 4;
const STATUSES = ['planning', 'development', 'playable'];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKIP_FILES = new Set(['game.json', 'README.md', '.DS_Store']);
const checkOnly = process.argv.includes('--check');

const errors = [];
const games = [];

// ---- 1. Read every games/<dir>/game.json --------------------------------------------------
for (const dir of readdirSync(GAMES_DIR)) {
  const gameDir = join(GAMES_DIR, dir);
  const manifestPath = join(gameDir, 'game.json');
  if (!statSync(gameDir).isDirectory() || !existsSync(manifestPath)) continue;
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    errors.push(`${rel(manifestPath)}: not valid JSON (${error.message}). Fix the syntax; https://jsonlint.com helps.`);
    continue;
  }
  games.push({ dir: gameDir, manifestPath, manifest });
}

// ---- 2. Validate each manifest -------------------------------------------------------------
for (const game of games) {
  const m = game.manifest;
  const where = rel(game.manifestPath);
  if (typeof m.id !== 'string' || !ID_PATTERN.test(m.id)) {
    errors.push(`${where}: "id" must be a lowercase slug like "flappy-bruh" (letters, digits, dashes). It becomes the URL /games/<id>/.`);
  }
  if (typeof m.name !== 'string' || m.name.trim() === '') {
    errors.push(`${where}: "name" is required (the title shown on the arcade card).`);
  }
  if (!Number.isInteger(m.slot) || m.slot < 1 || m.slot > SLOT_COUNT) {
    errors.push(`${where}: "slot" must be a whole number from 1 to ${SLOT_COUNT} (the card position on the home page).`);
  }
  if (!STATUSES.includes(m.status)) {
    errors.push(`${where}: "status" must be one of ${STATUSES.join(', ')}. Only "playable" publishes the game.`);
  }
  if (m.status === 'playable') {
    const web = m.web || {};
    if (web.enabled !== true) {
      errors.push(`${where}: a playable game needs "web": { "enabled": true, ... }. Java-only games stay "development".`);
    } else {
      const entryPath = join(game.dir, web.dir || '.', web.entry || 'index.html');
      if (!existsSync(entryPath)) {
        errors.push(`${where}: web entry file not found: ${rel(entryPath)}. Put your browser game there or fix "web.dir" / "web.entry".`);
      }
    }
  }
}

// ---- 3. Cross-checks: duplicate ids and slots ------------------------------------------------
const seenIds = new Map();
const seenSlots = new Map();
for (const game of games) {
  const { id, slot } = game.manifest;
  const where = rel(game.manifestPath);
  if (seenIds.has(id)) errors.push(`${where}: duplicate id "${id}" (also used by ${seenIds.get(id)}). Pick a unique id.`);
  else seenIds.set(id, where);
  if (Number.isInteger(slot)) {
    if (seenSlots.has(slot)) errors.push(`${where}: duplicate slot ${slot} (also used by ${seenSlots.get(slot)}). Each game needs its own slot.`);
    else seenSlots.set(slot, where);
  }
}

if (errors.length > 0) {
  console.error(`\n✖ ${errors.length} problem(s) found in game manifests:\n`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error('\nSee docs/GAME_INTEGRATION.md for the manifest format.\n');
  process.exit(1);
}

// ---- 4. Build the registry (one entry per slot) ---------------------------------------------
const registry = [];
for (let slot = 1; slot <= SLOT_COUNT; slot++) {
  const game = games.find((g) => g.manifest.slot === slot);
  if (!game) {
    registry.push({ slot, id: `game-${slot}`, name: `Game ${slot}`, status: 'planning', playable: false });
    continue;
  }
  const m = game.manifest;
  const playable = m.status === 'playable';
  registry.push({
    slot,
    id: m.id,
    name: m.name,
    developer: m.developer || '',
    description: playable ? (m.description || '') : 'Coming Soon',
    status: m.status,
    playable,
    route: playable ? `games/${m.id}/` : null,
  });
}

if (checkOnly) {
  console.log('✔ Manifests are valid.');
  for (const entry of registry) console.log(`  slot ${entry.slot}: ${entry.name} — ${entry.playable ? 'PLAYABLE' : 'coming soon'}`);
  process.exit(0);
}

// ---- 5. Copy web files into web/games/<id>/ ------------------------------------------------
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
for (const game of games) {
  const m = game.manifest;
  if (m.status !== 'playable') continue;
  const source = join(game.dir, m.web.dir || '.');
  const target = join(OUT_DIR, m.id);
  const filter = (path) => !SKIP_FILES.has(path.split('/').pop());
  if (m.web.embed) {
    // The student's page is copied untouched into game/ and shown inside an arcade shell page.
    cpSync(source, join(target, 'game'), { recursive: true, filter });
    writeFileSync(join(target, 'index.html'), shellPage(m));
  } else {
    // The game already includes the arcade bar and Back link itself (BetLife).
    cpSync(source, target, { recursive: true, filter });
  }
  console.log(`  published ${m.name} -> web/games/${m.id}/`);
}
writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2) + '\n');
console.log(`✔ Wrote web/games.json with ${registry.filter((g) => g.playable).length} playable game(s).`);

// ---- helpers ----------------------------------------------------------------------------------
function rel(path) {
  return path.replace(ROOT + '/', '');
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Arcade shell around an embedded game: top bar with Back to Arcade, the game in an iframe below.
function shellPage(m) {
  const name = escapeHtml(m.name);
  const entry = escapeHtml(m.web.entry || 'index.html');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${name} · AP CS Arcade</title>
  <meta name="description" content="${escapeHtml(m.description || m.name)}">
  <link rel="stylesheet" href="../../styles/arcade.css">
  <style>
    .embed-stage { flex: 1; display: flex; }
    .embed-stage iframe { flex: 1; width: 100%; height: calc(100vh - 52px); height: calc(100dvh - 52px); border: 0; background: #000; }
  </style>
</head>
<body class="shell-body">
  <header class="shell-bar">
    <a class="shell-brand" href="../../">AP CS ARCADE</a>
    <a class="shell-back" href="../../">← Back to Arcade</a>
  </header>
  <main class="embed-stage">
    <iframe id="game-frame" src="game/${entry}" title="${name}" allow="autoplay; fullscreen"></iframe>
  </main>
  <script>
    // Keyboard input belongs to the game: keep the frame focused so Space/arrows reach it.
    const frame = document.getElementById('game-frame');
    const focusGame = () => { try { frame.contentWindow.focus(); } catch (error) { /* cross-origin guard */ } };
    frame.addEventListener('load', focusGame);
    window.addEventListener('focus', focusGame);
    document.addEventListener('keydown', focusGame);
  </script>
</body>
</html>
`;
}
