// BetLife interaction / smoke test driven by WebKit through Playwright. Chromium is never launched.
// Setup once:  npm i playwright && npx playwright install webkit
// Run:         node tests/webkit-flow.mjs [base-url]
//
// Every tap below is a real WebKit input event (page.mouse), not a synthetic DOM dispatch.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:8080/games/betlife/';
const log = [];
const step = (text) => { log.push(text); console.log(text); };

const browser = await webkit.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const screen = () => page.evaluate(() => document.getElementById('game').dataset.screen);
const state = () => page.evaluate(() => { const s = window.betlife && window.betlife.getState(); return s ? { name: s.player.name, age: s.player.age, money: s.player.money, rng: s.rngState, occupation: s.player.occupation, friends: s.relationships.filter((r) => r.role === 'friend' && r.alive).map((r) => r.name), last: s.timeline.length ? s.timeline[s.timeline.length - 1].text : '' } : null; });
const toast = () => page.evaluate(() => { const t = document.querySelector('.bl-toast'); return t ? t.innerText.replace(/\s+/g, ' ') : null; });
// Clears anything queued on top of the screen (badge banners, info cards) so the next tap reaches the UI.
const settle = async () => {
  for (let i = 0; i < 8; i++) {
    const open = await page.evaluate(() => {
      const root = document.getElementById('modal-root');
      if (!root.firstChild) return 'clear';
      if (root.querySelector('.bl-banner')) { root.querySelector('.bl-banner').click(); return 'banner'; }
      const button = root.querySelector('button');
      if (button) { button.click(); return 'card'; }
      return 'stuck';
    });
    if (open === 'clear') return;
    await page.waitForTimeout(350);
  }
};
// A tap can be swallowed while a banner is still animating out, so each tap gets a few attempts.
const tapText = async (text, expect) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    await settle();
    const target = page.locator('button, .bl-row, .bl-nav-item, [data-choice], [data-action]').filter({ hasText: text }).first();
    try {
      await target.scrollIntoViewIfNeeded({ timeout: 4000 });
      const box = await target.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(650);
        if (!expect || (await screen()) === expect) return;
      }
    } catch { /* retried below */ }
    await page.waitForTimeout(500);
  }
  throw new Error(`not found: ${text}`);
};
const tapSel = async (selector, keepModal = false) => {
  if (!keepModal) await settle();
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`not found: ${selector}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(650);
};
// Ages the life forward through the automatic dialogs, stopping on the first person card.
const ageUntilPersonCard = () => page.evaluate(() => {
  const B = window.betlife;
  for (let guard = 0; guard < 120; guard++) {
    const s = B.getState();
    if (s.pending.length) {
      const m = s.pending[0];
      if (m.eventId === 'friendRequest' || m.eventId === 'loveRequest') break;
      if (m.kind === 'minigame') B.answer('pass');
      else if (m.kind === 'decision') B.answer('0');
      else B.answer('ok');
    } else if (document.querySelector('#modal-root button')) B.answer('ok');
    else B.handle('age');
  }
  return B.getState().player.age;
});

await page.goto(BASE, { waitUntil: 'load' });
await page.evaluate(() => { try { localStorage.clear(); } catch { /* private mode */ } });
await page.goto(`${BASE}?flow=1`, { waitUntil: 'load' });

step(`1. cold start shows: ${await screen()}`);
await page.waitForTimeout(7000);
step(`2. after splash and disclaimer: ${await screen()}, language card open: ${await page.locator('.bl-lang').count() > 0}`);

await tapSel('.bl-lang button', true);
step(`3. language accepted, card closed: ${await page.locator('.bl-lang').count() === 0}`);

await tapSel('.bl-age', true);
const born = await state();
step(`4. New Life -> ${born ? `${born.name}, age ${born.age}` : 'FAILED'}`);

await ageUntilPersonCard();
const cardText = await page.evaluate(() => document.getElementById('modal-root').innerText.replace(/\s+/g, ' ').slice(0, 52));
step(`5. aged up, person card: ${cardText}`);
await page.screenshot({ path: `${process.env.SHOTS || '/tmp'}/flow_card.png` });

await tapSel('#modal-root button', true);
const afterFriend = await state();
step(`6. accepted -> friends: ${afterFriend.friends.join(', ')} | journal: ${afterFriend.last.slice(0, 44)}`);

await tapText('Activities', 'activities');
step(`7. nav Activities -> ${await screen()}`);
await tapText('Mind & Body', 'activity');
step(`8. submenu -> ${await screen()} (${await page.locator('.bl-screen-title').innerText()})`);
const beforeActivity = (await state()).last;
await tapText('Walk');
const activityResult = (await toast()) || (await page.evaluate(() => { const r = document.getElementById('modal-root'); return r.firstChild ? r.innerText.replace(/\s+/g, ' ').slice(0, 60) : null; })) || `journal: ${(await state()).last.slice(0, 50)}`;
const activityChanged = (await state()).last !== beforeActivity || /walk/i.test(String(activityResult));
step(`9. activity result: ${activityChanged ? activityResult : `MISMATCH no effect (${activityResult})`}`);

await tapSel('.bl-round-btn');
await tapSel('.bl-round-btn');
await tapText('Relationships', 'relationships');
step(`10. Relationships -> ${await screen()}, rows: ${await page.locator('.bl-row').count()}`);
await tapSel('.bl-row[data-action="person"]');
step(`11. person -> ${await page.locator('.bl-screen-title').innerText()}`);
await tapText('Compliment');
const interaction = (await toast()) || `journal: ${(await state()).last.slice(0, 50)}`;
step(`12. interaction: ${interaction}`);

await tapSel('.bl-round-btn');
await tapSel('.bl-round-btn');
await tapText('Assets', 'assets');
step(`13. Assets -> ${await screen()}`);
await tapText('Go Shopping', 'shopping');
step(`14. Shopping -> ${await screen()}, stores: ${await page.locator('.bl-row').count()}`);

const before = await state();
await page.goto(`${BASE}?flow=2`, { waitUntil: 'load' });
await page.waitForTimeout(1200);
const after = await state();
const persisted = before && after && before.name === after.name && before.age === after.age && before.money === after.money && before.rng === after.rng;
step(`15. save/load across reload: ${persisted ? 'identical' : 'MISMATCH'} (${after && after.name}, age ${after && after.age}, rng ${after && after.rng})`);

step(`16. page errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
const failed = log.some((l) => /FAILED|MISMATCH|not found/i.test(l)) || errors.length > 0;
console.log(failed ? '\nFLOW RESULT: FAIL' : '\nFLOW RESULT: PASS');
process.exit(failed ? 1 : 0);
