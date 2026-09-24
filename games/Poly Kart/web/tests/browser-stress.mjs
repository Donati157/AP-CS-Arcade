// 100 start / drive / reset / restart cycles: nothing may accumulate. WebKit only.
import { webkit } from 'playwright';
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(process.argv[2], { waitUntil: 'load' });
await page.waitForTimeout(2000);
const f = page.frames().find((x) => x.url().includes('/game/')) || page.mainFrame();

const sample = () => f.evaluate(() => ({
  nodes: document.getElementsByTagName('*').length,
  meshes: window.polyKart.game ? window.polyKart.game.renderer.meshes.length : 0,
  running: window.polyKart.game ? window.polyKart.game.running : false,
  heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null,
}));

await f.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); window.polyKart.start('harbour-loop'); });
await page.waitForTimeout(500);
const before = await sample();
console.log('after the first start:', JSON.stringify(before));

const result = await f.evaluate(() => {
  const pk = window.polyKart;
  for (let lap = 0; lap < 100; lap++) {
    pk.start(lap % 2 ? 'dune-run' : 'harbour-loop');
    const g = pk.game;
    g.stop();
    g.pausedByVisibility = false;
    g.armed = true;                          // skip the lights; this test is about leaks, not laps
    pk.input.setTouch('throttle', true);
    for (let i = 0; i < 40; i++) g.update(1 / 60);
    g.respawn('checkpoint');
    pk.input.setTouch('throttle', false);
    pk.menu();
  }
  return { laps: 100, kart: pk.game.player.car.position.map((n) => Math.round(n)), speed: Math.round(pk.game.player.car.speed) };
});
console.log('100 cycles done:', JSON.stringify(result));
await page.waitForTimeout(600);
const after = await sample();
console.log('after 100 cycles: ', JSON.stringify(after));

// One more real race to prove it still works.
await f.evaluate(() => window.polyKart.start('harbour-loop'));
await page.waitForTimeout(1500);
const alive = await f.evaluate(() => ({ running: window.polyKart.game.running, karts: window.polyKart.game.racers.length }));
console.log('still playable:', JSON.stringify(alive));
console.log('errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await browser.close();
const grew = after.nodes - before.nodes;
const ok = errors.length === 0 && alive.running && alive.karts === 5 && after.meshes === before.meshes && grew <= 4;
console.log(`node growth over 100 cycles: ${grew}`);
console.log(ok ? '\nSTRESS: PASS' : '\nSTRESS: FAIL');
process.exit(ok ? 0 : 1);
