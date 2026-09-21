// Hostile-environment checks: browsers with 3D crippled or switched off entirely.
//
// Each case must still end with a playable race, except the last, where there is no canvas of any
// kind and the only correct behaviour is an honest message.
//
//   node tests/hostile-environments.mjs http://localhost:8080/games/poly-kart/
import { chromium } from 'playwright';
const url = process.argv[2];
let failed = false;

async function scenario(label, { args = [], block = null, expectPlayable = true, expectStage = null }) {
  const browser = await chromium.launch({ args });
  const page = await (await browser.newContext({ viewport: { width: 1536, height: 1024 } })).newPage();
  if (block) await page.addInitScript(block);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2200);
  const frame = page.frames().find((f) => f.url().includes('/game/')) || page.mainFrame();
  await frame.evaluate(() => { const b = document.querySelector('.pk-track'); if (b) b.click(); });
  await page.waitForTimeout(1500);
  const s = await frame.evaluate(() => ({
    ...window.polyKart.status(),
    software: window.polyKart.game ? window.polyKart.game.software : null,
    title: document.querySelector('.pk-fatal-title')?.textContent || '',
    detail: (document.querySelector('.pk-fatal-detail')?.textContent || '').split('\n')[0],
  }));
  const playable = s.rendererReady && !s.failureShown && s.framesDrawn > 0;
  const ok = expectPlayable ? playable : (!playable && s.failureShown && (!expectStage || s.detail.includes(expectStage)));
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  console.log(`      context=${s.contextId || 'none'} software=${s.software} frames=${s.framesDrawn} failureShown=${s.failureShown}`);
  if (s.failureShown) console.log(`      screen: "${s.title}" / ${s.detail}`);
  if (!ok) failed = true;
  await browser.close();
}

// 1. A browser with no WebGL 2 at all: must fall back to WebGL 1 and play.
await scenario('WebGL2 blocked, WebGL1 available -> falls back and plays', {
  block: () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (id, ...rest) {
      if (id === 'webgl2') return null;
      return original.call(this, id, ...rest);
    };
  },
});

// 2. A browser that refuses the nicer attribute sets: must relax and play.
await scenario('antialias and webgl2 refused -> relaxes attributes and plays', {
  block: () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (id, options, ...rest) {
      if (id === 'webgl2') return null;
      if (options && options.antialias === true) return null;
      return original.call(this, id, options, ...rest);
    };
  },
});

// 3. No WebGL of any kind: the software renderer takes over and the game still plays.
await scenario('no WebGL at all -> software renderer plays', {
  block: () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (id, ...rest) {
      if (String(id).includes('webgl')) return null;
      return original.call(this, id, ...rest);
    };
  },
  expectPlayable: true,
});

// 3b. Neither 3D nor 2D: nothing can be drawn, so the message must be honest rather than a crash.
await scenario('no canvas of any kind -> honest failure screen', {
  block: () => { HTMLCanvasElement.prototype.getContext = function () { return null; }; },
  expectPlayable: false,
});

// 4. Chrome with the GPU and the software rasteriser both switched off: the reported situation.
await scenario('--disable-gpu --disable-software-rasterizer -> software renderer plays', {
  args: ['--disable-gpu', '--disable-software-rasterizer'],
  expectPlayable: true,
});

// 5. WebGL switched off outright, the strictest case there is.
await scenario('--disable-webgl -> software renderer plays', {
  args: ['--disable-webgl'],
  expectPlayable: true,
});

console.log(failed ? '\nHOSTILE: FAIL' : '\nHOSTILE: PASS');
process.exit(failed ? 1 : 0);
