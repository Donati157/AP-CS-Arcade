import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import * as Career from '../game/career.js';
import { CAREERS, findCareer } from '../game/careers.js';
import { runLives } from './helpers.mjs';

const ageTo = (s, target) => { while (s.player.age < target && s.player.alive) { s.pending.length = 0; G.ageUp(s); } };

test('catalog: every career has a ladder with rising salaries', () => {
  assert.ok(CAREERS.filter((c) => !c.partTime).length >= 20);
  for (const c of CAREERS) {
    for (let i = 1; i < c.ladder.length; i++) assert.ok(c.ladder[i].salary > c.ladder[i - 1].salary, `${c.id} ladder not rising`);
  }
});

test('eligibility reads real education and smarts', () => {
  const s = G.createNewGame({}, 50);
  ageTo(s, 18);
  s.education.highSchoolGraduate = true; s.education.stage = 'none';
  s.player.smarts = 40;
  assert.equal(G.applyForCareer(s, 'software').ok, false, 'no degree, low smarts');
  s.player.smarts = 95;
  assert.equal(G.applyForCareer(s, 'software').ok, true, 'high smarts can replace the degree');
  assert.equal(s.player.occupation, 'Junior Developer');
  assert.equal(G.applyForCareer(s, 'software').ok, false, 'already hired');
});

test('tenure, raises, promotions, history and salary cap over a 40-year career', () => {
  const s = G.createNewGame({}, 62);
  ageTo(s, 18);
  assert.ok(s.player.alive, 'seed 62 reaches 18');
  s.education.highSchoolGraduate = true; s.education.stage = 'none';
  assert.ok(G.applyForCareer(s, 'office').ok, 'hired');
  const rows = [];
  let lastTitle = null;
  for (let year = 0; year < 40 && s.player.alive; year++) {
    G.jobAction(s, 'workHarder'); G.jobAction(s, 'workHarder');
    s.pending.length = 0; G.ageUp(s);
    if (!Career.isEmployed(s.career)) break;
    if (Career.jobTitle(s.career) !== lastTitle || year % 5 === 0) {
      rows.push(`Age ${s.player.age} — ${Career.jobTitle(s.career)} — $${s.career.salary.toLocaleString('en-US')} — tenure ${s.career.tenure}`);
      lastTitle = Career.jobTitle(s.career);
    }
  }
  console.log('    ' + rows.join('\n    '));
  const c = s.career;
  if (Career.isEmployed(c)) assert.equal(c.tenure, s.player.age - c.hiredAt, 'tenure advanced exactly once per year');
  assert.ok(c.raises > 0, 'no raise in decades');
  assert.ok(c.promotions > 0 || c.retired, 'no promotion in decades');
  assert.ok(c.yearsWorked >= 20);
  assert.ok(c.salary <= findCareer('office').ladder[findCareer('office').ladder.length - 1].salary * Career.SALARY_CAP + 1, 'salary capped');
});

test('poor performance leads to a warning and losing the job; quitting records history', () => {
  const s = G.createNewGame({}, 61);
  ageTo(s, 18);
  s.education.highSchoolGraduate = true; s.education.stage = 'none';
  G.applyForCareer(s, 'retail');
  let fired = false;
  for (let i = 0; i < 15 && !fired; i++) {
    G.jobAction(s, 'takeItEasy'); G.jobAction(s, 'takeItEasy'); G.jobAction(s, 'takeItEasy');
    s.career.performance = Math.min(s.career.performance, 20);
    s.pending.length = 0; G.ageUp(s);
    if (!Career.isEmployed(s.career)) fired = true;
  }
  assert.ok(fired, 'a consistently poor employee was never let go');
  assert.equal(s.career.history.length, 1);
  assert.equal(s.career.history[0].reason, 'let go');
  assert.equal(s.player.occupation, 'Unemployed');
  assert.ok(s.timeline.some((e) => /let you go/.test(e.text)));
  G.applyForCareer(s, 'retail');
  assert.ok(G.quitJob(s));
  assert.equal(s.career.history.length, 2);
  assert.equal(s.career.history[1].reason, 'resigned');
});

test('nobody works forever: retirement happens, stops salary and keeps history', () => {
  const lives = runLives(40, 500);
  let retiredCount = 0; let workedPast80 = 0; const ages = [];
  for (const life of lives) {
    const c = life.state.career;
    if (c.retired) { retiredCount++; ages.push(c.retiredAt); }
    if (life.snapshots.some((snap) => snap.age > 80 && snap.job && !snap.retired)) workedPast80++;
    for (const snap of life.snapshots) assert.ok(!(snap.age > Career.RETIREMENT_MAX_AGE && snap.job && !snap.retired), `working at ${snap.age}`);
    if (c.retired) {
      assert.ok(!Career.isEmployed(c));
      assert.equal(c.salary, 0);
      assert.ok(c.history.length > 0);
    }
  }
  const spread = ages.length ? `${Math.min(...ages)}-${Math.max(...ages)}` : 'n/a';
  console.log(`    ${retiredCount} of ${lives.length} lives retired (ages ${spread}); ${lives.length - retiredCount} ended before retiring`);
  assert.equal(workedPast80, 0);
  assert.ok(new Set(ages).size >= 3, 'retirement ages should vary');
});

test('different seeds produce different careers', () => {
  const lives = runLives(30, 700);
  const titles = new Set(lives.flatMap((l) => l.state.career.history.map((h) => h.title)).concat(lives.map((l) => Career.jobTitle(l.state.career)).filter(Boolean)));
  assert.ok(titles.size >= 8, `only ${titles.size} distinct job titles across 30 lives`);
});
