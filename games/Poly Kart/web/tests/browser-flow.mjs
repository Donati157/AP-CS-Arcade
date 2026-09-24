// Poly Kart browser test, driven by WebKit through Playwright. Chromium is never launched.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8080/games/poly-kart/';
const browser = await webkit.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const frame = () => page.frameLocator('#game-frame');
const inGame = (fn, arg) => page.frames().find((f) => f.url().includes('game/')) ?.evaluate(fn, arg);

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(2500);

const gameFrame = page.frames().find((f) => f.url().includes('/game/')) || page.mainFrame();
const webgl = await gameFrame.evaluate(() => {
  const c = document.createElement('canvas');
  return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
});
console.log(`1. WebGL available: ${webgl}`);
const fatalShown = await gameFrame.evaluate(() => !document.getElementById('pk-fatal').hidden);
console.log(`2. fatal panel shown: ${fatalShown}`);
const tracks = await gameFrame.evaluate(() => document.querySelectorAll('.pk-track').length);
console.log(`3. tracks on the menu: ${tracks}`);

await gameFrame.evaluate(() => window.polyKart.start('harbour-loop'));
await page.waitForTimeout(1200);
const started = await gameFrame.evaluate(() => ({
  running: window.polyKart.game.running,
  track: document.querySelector('.pk-progress-track').textContent,
    field: document.querySelectorAll('.pk-order li').length,
  lapOf: document.querySelector('.pk-lap i').textContent,
  menuHidden: document.getElementById('pk-menu').hidden,
}));
console.log(`4. race started: ${JSON.stringify(started)}`);
const lights = await gameFrame.evaluate(() => document.querySelector('.pk-countdown').textContent);
console.log(`4b. countdown showing: ${lights}`);

// Drive: hold the throttle for a few seconds and see the car actually move.
// The lights now run before the throttle does anything, so wait them out first.
await page.waitForTimeout(3200);
await gameFrame.evaluate(() => window.polyKart.input.setTouch('throttle', true));
await page.waitForTimeout(3000);
const moving = await gameFrame.evaluate(() => {
  const g = window.polyKart.game;
  return { speed: Math.round(g.player.car.speed * 3.6), distance: Math.round(g.player.car.distanceAlong), onRoad: g.player.car.onRoad };
});
console.log(`5. after 3s of throttle: ${JSON.stringify(moving)}`);

const hudSpeed = await gameFrame.evaluate(() => document.querySelector('.pk-speedo-value').textContent);
const hudTime = await gameFrame.evaluate(() => document.querySelector('.pk-clock-time').textContent);
console.log(`6. HUD reads ${hudSpeed} km/h, clock ${hudTime}`);

// Only one animation frame and one set of listeners, even after several restarts.
await gameFrame.evaluate(() => { for (let i = 0; i < 5; i++) window.polyKart.start('harbour-loop'); });
await page.waitForTimeout(800);
const loops = await gameFrame.evaluate(() => {
  const g = window.polyKart.game;
  return { running: g.running, frame: typeof g.frame === 'number', meshes: g.renderer.meshes.length };
});
console.log(`7. after 5 restarts: ${JSON.stringify(loops)}`);

// Complete a valid race by handing the player's kart to the same policy the rivals use.
const finished = await gameFrame.evaluate(async () => {
  const g = window.polyKart.game;
  const { driveRival } = await import('./src/racers.js');
  const policy = { car: g.player.car, line: 0, pace: 0.99, patience: 0.96 };
  Object.defineProperty(g.input, 'state', { get: () => driveRival(policy, g.track), configurable: true });
  const started = performance.now();
  while (!g.player.progress.finished && performance.now() - started < 200000) await new Promise((r) => setTimeout(r, 100));
  return {
    finished: g.player.progress.finished,
    lap: g.player.progress.lap,
    place: g.race.order.indexOf(g.player) + 1,
    bestLap: Math.round(g.player.progress.bestLap * 1000) / 1000,
    fieldFinished: g.racers.filter((r) => r.progress.finished).length,
  };
});
console.log(`8. complete race: ${JSON.stringify(finished)}`);

const stored = await gameFrame.evaluate(() => JSON.parse(localStorage.getItem('poly-kart.best-times.v1') || '{}'));
console.log(`9. stored best times: ${JSON.stringify(stored)}`);

// Reload: the best time must survive.
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(1800);
const after = page.frames().find((f) => f.url().includes('/game/')) || page.mainFrame();
const persisted = await after.evaluate(() => document.querySelector('.pk-track-best b')?.textContent);
console.log(`10. best time after reload: ${persisted}`);

console.log(`11. page errors: ${errors.length ? errors.slice(0, 3).join(' | ') : 'none'}`);
await browser.close();
const ok = webgl && !fatalShown && tracks === 2 && moving.speed > 20 && finished.finished && errors.length === 0;
console.log(ok ? '\nPOLY KART: PASS' : '\nPOLY KART: FAIL');
process.exit(ok ? 0 : 1);
