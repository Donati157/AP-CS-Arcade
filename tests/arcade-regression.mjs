// Arcade regression: all three games open, return to the arcade, and reopen. WebKit only.
import { webkit } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:8080/';
const browser = await webkit.launch();
let failed = false;
for (const size of [{ w: 390, h: 844 }, { w: 430, h: 932 }, { w: 1366, h: 768 }, { w: 1440, h: 900 }]) {
  const context = await browser.newContext({ viewport: { width: size.w, height: size.h } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);
  const cards = await page.locator('a[href*="games/"]').count();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const names = (await page.locator('a[href*="games/"]').allInnerTexts()).join(' ').replace(/\s+/g, ' ').slice(0, 90);
  console.log(`\n== ${size.w}x${size.h} == arcade links: ${cards}, overflow ${overflow}px`);
  console.log(`   ${names}`);
  if (overflow > 0) { console.log('   FAIL: arcade overflows sideways'); failed = true; }

  for (const [slug, label] of [['poly-kart', 'Poly Kart'], ['betlife', 'BetLife'], ['flappy-bruh', 'Flappy Bruh']]) {
    let loaded = false;
    for (let attempt = 1; attempt <= 3 && !loaded; attempt++) {
      try {
        await page.goto(`${BASE}games/${slug}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
        loaded = true;
      } catch {
        if (attempt === 3) throw new Error(`could not load ${slug} after 3 tries`);
        await page.waitForTimeout(1500);
      }
    }
    await page.waitForTimeout(2200);
    const title = await page.title();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const back = await page.locator('a[href*="../../"], a.shell-back, a:has-text("Back to Arcade")').count();
    console.log(`   ${label}: "${title}", overflow ${wide}px, back link ${back > 0}`);
    if (wide > 0) { console.log(`   FAIL: ${label} overflows sideways`); failed = true; }
    if (!title.toLowerCase().includes(label.toLowerCase().split(' ')[0])) { console.log(`   FAIL: ${label} title`); failed = true; }
  }
  // Back to the arcade and into Poly Kart again: no broken state.
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.goto(`${BASE}games/poly-kart/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2200);
  const again = page.frames().find((f) => f.url().includes('/game/'));
  const ok = again ? await again.evaluate(() => document.querySelectorAll('.pk-track').length) : 0;
  console.log(`   reopened Poly Kart, tracks: ${ok}`);
  if (ok !== 2) { console.log('   FAIL: Poly Kart did not reopen cleanly'); failed = true; }
  if (errors.length) { console.log(`   errors: ${errors.slice(0, 2).join(' | ')}`); failed = true; }
  await context.close();
}
await browser.close();
console.log(failed ? '\nARCADE REGRESSION: FAIL' : '\nARCADE REGRESSION: PASS');
process.exit(failed ? 1 : 0);
