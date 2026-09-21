// Reproduces the reported "Busy Year" screenshot: a teenager, a friend, many actions in one year.
// Driven by WebKit through Playwright. Chromium is never launched.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8080/games/betlife/';
const SIZES = [{ w: 390, h: 844 }, { w: 430, h: 932 }];
const browser = await webkit.launch();
let failed = false;

for (const size of SIZES) {
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1.5 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  console.log(`\n== ${size.w}x${size.h} ==`);

  // Deterministic teenager with a friend on screen, exactly like the screenshot.
  await page.goto(`${BASE}?seed=7&age=17&person=first#person`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const title = await page.locator('.bl-screen-title').innerText();
  console.log(`1. person screen: ${title}`);

  const rows = page.locator('.bl-row[data-action="interact"]');
  const rowCount = await rows.count();
  const groups = await page.locator('.bl-section').allInnerTexts();
  console.log(`2. ${rowCount} interactions in groups: ${groups.join(', ')}`);

  // Hammer the first interaction well past the old six-action budget.
  const first = rows.first();
  const box = await first.boundingBox();
  const label = (await first.innerText()).split('\n')[0];
  for (let i = 0; i < 12; i++) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(600);
  const toastText = await page.evaluate(() => { const t = document.querySelector('.bl-toast'); return t ? t.innerText.replace(/\s+/g, ' ') : '(none)'; });
  console.log(`3. tapped "${label}" 12 times -> last toast: ${toastText.slice(0, 64)}`);
  if (/busy year/i.test(toastText)) { console.log('   FAIL: Busy Year is still shown'); failed = true; }

  // Nothing may be stuck on top of the screen, and navigation must still work.
  const stuck = await page.evaluate(() => document.getElementById('modal-root').innerHTML.length);
  const toastBlocks = await page.evaluate(() => {
    const root = document.getElementById('toast-root');
    return root ? getComputedStyle(root).pointerEvents : 'missing';
  });
  console.log(`4. modal-root content: ${stuck} chars, toast pointer-events: ${toastBlocks}`);
  if (toastBlocks !== 'none') { console.log('   FAIL: toasts can intercept taps'); failed = true; }

  // Toasts must not pile up.
  const toastCount = await page.locator('.bl-toast').count();
  console.log(`5. toasts on screen after 12 rapid results: ${toastCount}`);
  if (toastCount > 1) { console.log('   FAIL: toasts stacked'); failed = true; }

  // Back out and navigate: the screen must still respond.
  const back = await page.locator('.bl-round-btn').first().boundingBox();
  await page.mouse.click(back.x + back.width / 2, back.y + back.height / 2);
  await page.waitForTimeout(700);
  const screen = await page.evaluate(() => document.getElementById('game').dataset.screen);
  console.log(`6. back button -> ${screen}`);
  if (screen !== 'relationships') { console.log('   FAIL: navigation blocked'); failed = true; }

  // No horizontal overflow at this width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`7. horizontal overflow: ${overflow}px`);
  if (overflow > 0) { console.log('   FAIL: page overflows sideways'); failed = true; }

  console.log(`8. page errors: ${errors.length ? errors.join(' | ') : 'none'}`);
  if (errors.length) failed = true;
  await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/busy_${size.w}.png` });
  await context.close();
}
await browser.close();
console.log(failed ? '\nBUSY YEAR SCENARIO: FAIL' : '\nBUSY YEAR SCENARIO: PASS');
process.exit(failed ? 1 : 0);
