// Poly Kart start-up smoke test across engines.
//
// HTTP 200 plus a "cannot start" screen is a failed game, so this asserts the things that actually
// matter: a canvas exists, the renderer got a context, the failure screen is NOT showing, at least
// one frame was drawn, and the car moves when the throttle is held.
//
//   node tests/cross-browser.mjs <url> [chromium,webkit,firefox] [headed]
import { chromium, webkit, firefox } from 'playwright';

const ENGINES = { chromium, webkit, firefox };
const url = process.argv[2] || 'http://localhost:8080/games/poly-kart/';
const wanted = (process.argv[3] || 'chromium,webkit').split(',').map((s) => s.trim()).filter(Boolean);
const headed = process.argv[4] === 'headed';
const SIZES = [
  { w: 1536, h: 1024 },   // the size the bug was reported at
  { w: 1440, h: 900 },
  { w: 1366, h: 768 },
  { w: 430, h: 932 },
  { w: 390, h: 844 },
];

let failed = false;

for (const name of wanted) {
  const engine = ENGINES[name];
  if (!engine) { console.log(`\n== ${name}: not a known engine, skipped`); continue; }
  let browser;
  try {
    browser = await engine.launch({ headless: !headed });
  } catch (error) {
    console.log(`\n== ${name}: could not launch (${error.message.split('\n')[0]}), skipped`);
    continue;
  }
  console.log(`\n===== ${name.toUpperCase()} =====`);
  for (const size of SIZES) {
    const context = await browser.newContext({ viewport: { width: size.w, height: size.h } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    const frame = page.frames().find((f) => f.url().includes('/game/')) || page.mainFrame();

    // What a player does: click the first track.
    await frame.evaluate(() => { const b = document.querySelector('.pk-track'); if (b) b.click(); });
    await page.waitForTimeout(3400);          // the countdown has to finish first
    // Hold the throttle briefly so "gameplay started" means the car actually moved.
    await frame.evaluate(() => { if (window.polyKart.input) window.polyKart.input.setTouch('throttle', true); });
    await page.waitForTimeout(1500);

    const status = await frame.evaluate(() => {
      const s = window.polyKart.status();
      const canvas = document.getElementById('pk-canvas');
      // What the player SEES, not what an attribute claims. A panel marked hidden can still be
      // painted if a class sets its display, which is exactly the bug this test exists to catch.
      const failure = document.getElementById('pk-fatal');
      const failureBox = failure.getBoundingClientRect();
      const centre = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return {
        ...s,
        failurePainted: getComputedStyle(failure).display !== 'none' && failureBox.width * failureBox.height > 0,
        topmostAtCentre: centre ? (centre.id || String(centre.className) || centre.tagName) : 'none',
        canvasPresent: !!canvas,
        canvasBuffer: canvas ? [canvas.width, canvas.height] : null,
        speed: window.polyKart.game ? Math.round(window.polyKart.game.car.speed * 3.6) : 0,
        failureText: document.querySelector('.pk-fatal-title')?.textContent || '',
      };
    });
    await frame.evaluate(() => { if (window.polyKart.input) window.polyKart.input.setTouch('throttle', false); });

    const checks = {
      'canvas exists': status.canvasPresent,
      'renderer initialised': status.rendererReady,
      'failure screen not painted': !status.failurePainted,
      'canvas is what you see': status.topmostAtCentre === 'pk-canvas',
      'a frame was drawn': status.framesDrawn > 0,
      'loop running': status.running,
      'car moves': status.speed > 20,
      'context not lost': status.contextLost === false,
      'no page errors': errors.length === 0,
    };
    const bad = Object.entries(checks).filter(([, ok]) => !ok).map(([label]) => label);
    const d = status.diagnostics || {};
    console.log(`  ${size.w}x${size.h}  context=${status.contextId || 'none'}  frames=${status.framesDrawn}  speed=${status.speed}km/h  centre=${status.topmostAtCentre}  ${bad.length ? 'FAIL: ' + bad.join(', ') : 'PASS'}`);
    if (size.w === 1536) {
      console.log(`     WebGL:     ${d.version || 'none'}`);
      console.log(`     GLSL:      ${d.glsl || 'none'}`);
      console.log(`     renderer:  ${d.renderer || 'none'}`);
      console.log(`     software:  ${d.softwareRendering}`);
      console.log(`     linked:    ${d.programLinked}`);
    }
    if (bad.length) {
      failed = true;
      console.log(`     failure screen said: ${status.failureText}`);
      if (errors.length) console.log(`     errors: ${errors.slice(0, 2).join(' | ')}`);
    }
    await context.close();
  }
  await browser.close();
}
console.log(failed ? '\nCROSS-BROWSER: FAIL' : '\nCROSS-BROWSER: PASS');
process.exit(failed ? 1 : 0);
