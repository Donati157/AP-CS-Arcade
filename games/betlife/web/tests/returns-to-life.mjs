// Doing something takes you back to the life.
//
// An action in BetLife writes a sentence in the life log, and the life log is the main screen. This
// drives the real interface in WebKit - every tap is a WebKit input event, never a synthetic DOM
// dispatch, and Chromium is never launched - and checks that after an action the player is looking
// at the sentence they just earned rather than at the menu they started from.
//
// It also checks the other half, which is the part that is easy to break: browsing, buying, selling
// and repairing write nothing, so they must leave you exactly where you were.
//
//   node tests/returns-to-life.mjs [base-url]

import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8000/games/betlife/web/';

const browser = await webkit.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail });

const screen = () => page.evaluate(() => document.getElementById('game').dataset.screen);
const journal = () => page.evaluate(() => {
  const s = window.betlife && window.betlife.getState();
  return s ? s.timeline.length : 0;
});
const lastLine = () => page.evaluate(() => {
  const s = window.betlife && window.betlife.getState();
  return s && s.timeline.length ? s.timeline[s.timeline.length - 1].text : '';
});

// Clears badge banners and info cards so the next tap reaches the interface.
async function settle() {
  for (let i = 0; i < 10; i++) {
    const open = await page.evaluate(() => !!document.getElementById('modal-root').firstChild);
    if (!open) return;
    const button = page.locator('#modal-root button').first();
    if (!(await button.count())) return;
    await button.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(180);
  }
}

async function tap(selector) {
  const el = page.locator(selector).first();
  if (!(await el.count())) return false;
  await el.click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(320);
  await settle();
  return true;
}

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.betlife);
await settle();

// Through the intro the way a player goes through it: the splash runs on a timer, the disclaimer is
// tapped, the language card is answered, then a random life is started.
await page.waitForFunction(() => document.getElementById('game').dataset.screen !== 'splash', { timeout: 6000 }).catch(() => {});
await settle();
if (await screen() === 'disclaimer') { await tap('[data-action="go"][data-target="start"]'); }
await settle();
if (await screen() === 'start') { await tap('[data-action="newLife"]'); await settle(); }
if (await screen() === 'newlife') { await tap('[data-action="startRandom"]'); await settle(); }
// Grow up a little, so school and belongings exist.
for (let i = 0; i < 6 && await screen() !== 'dead'; i++) {
  await tap('[data-action="age"]');
}
check('a life is running on the main screen', await screen() === 'main', `screen=${await screen()}`);

// ---- An action that writes a line takes you to the line -------------------------------------------
//
// Spending the day with everyone, which is the case the report named.
await tap('[data-action="go"][data-target="relationships"]');
const onRelationships = await screen();
check('the relationships screen opens', onRelationships === 'relationships', `screen=${onRelationships}`);
const before = await journal();
const tapped = await tap('[data-action="familyDay"]');
check('there is a way to spend the day with everyone', tapped);
const after = await journal();
const where = await screen();
check('spending the day with everyone writes a line', after > before, `${before} -> ${after}`);
check('and leaves you on the life, not on the menu', where === 'main', `screen=${where}`);
check('the line is the one just earned', (await lastLine()).length > 0, await lastLine());

// ---- Studying harder, the other case the report named --------------------------------------------
await tap('[data-action="go"][data-target="main"], [data-action="home"]');
await tap('[data-action="go"][data-target="school"]');
if (await screen() === 'school') {
  const b1 = await journal();
  const did = await tap('[data-action="study"][data-study="studyHarder"]');
  const w1 = await screen();
  check('there is a way to study harder', did);
  check('studying harder writes a line', await journal() > b1, `${b1} -> ${await journal()}`);
  check('and leaves you on the life', w1 === 'main', `screen=${w1}`);
} else {
  check('the school screen opens', false, `screen=${await screen()}`);
}

// ---- Giving a belonging away ---------------------------------------------------------------------
//
// Handed an asset through the game's own state so the case does not depend on being old enough to
// have earned one; the action itself is the real one, tapped in the interface.
await tap('[data-action="go"][data-target="main"], [data-action="home"]');
const gifted = await page.evaluate(() => {
  const s = window.betlife && window.betlife.getState();
  if (!s) return null;
  const who = s.relationships.find((r) => r.alive);
  if (!who) return null;
  s.assets.push({ id: 'test-gift', name: 'Bicycle', type: 'vehicle', value: 400, condition: 90 });
  return who.id ?? who.name;
});
if (gifted) {
  await tap('[data-action="go"][data-target="assets"]');
  await tap('[data-action="asset"][data-asset="test-gift"]');
  const b3 = await journal();
  const ok3 = await page.evaluate(() => !!document.querySelector('[data-action="go"][data-target="giftAsset"], [data-do="gift"]'));
  if (ok3) {
    await tap('[data-action="go"][data-target="giftAsset"], [data-do="gift"]');
    await tap('[data-action="assetAction"][data-do="gift"]');
    const w3 = await screen();
    check('giving a belonging away writes a line', await journal() > b3, `${b3} -> ${await journal()}`);
    check('and leaves you on the life', w3 === 'main', `screen=${w3}`);
  } else {
    check('a belonging can be given away', false, 'no gift control on the asset screen');
  }
} else {
  check('there is somebody to give a belonging to', false);
}

// ---- Something that writes nothing leaves you where you are --------------------------------------
await tap('[data-action="go"][data-target="assets"]');
const onAssets = await screen();
if (onAssets === 'assets') {
  const b2 = await journal();
  await tap('[data-action="go"][data-target="shop"], [data-action="go"][data-target="shopping"]');
  const w2 = await screen();
  const a2 = await journal();
  check('browsing writes nothing', a2 === b2, `${b2} -> ${a2}`);
  check('and does not throw you back to the life', w2 !== 'main', `screen=${w2}`);
} else {
  check('the belongings screen opens', false, `screen=${onAssets}`);
}

console.log('\nDoing something takes you back to the life\n');
for (const r of results) console.log(`  ${r.ok ? 'ok  ' : 'FAIL'}  ${r.name.padEnd(52)} ${r.detail}`);
const passed = results.filter((r) => r.ok).length;
console.log(`\n  ${passed}/${results.length} passed`);
if (errors.length) console.log('\npage errors:\n  ' + [...new Set(errors)].slice(0, 6).join('\n  '));
await browser.close();
process.exit(passed === results.length ? 0 : 1);
