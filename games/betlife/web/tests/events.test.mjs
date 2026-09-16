import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import { EVENTS, findEvent, isDecision } from '../game/events/catalog.js';
import { eligibleEvents, buildContext, isEligible, fireEvent, runYearlyEvents } from '../game/events/engine.js';
import { runLives } from './helpers.mjs';

const ageTo = (s, target) => { while (s.player.age < target) { s.pending.length = 0; G.ageUp(s); } };

test('catalog: unique ids, required fields, at least 120 events and 40 decisions', () => {
  const ids = new Set(EVENTS.map((e) => e.id));
  assert.equal(ids.size, EVENTS.length, 'duplicate ids');
  for (const e of EVENTS) {
    assert.ok(e.category, `${e.id} has no category`);
    assert.ok(typeof e.text === 'string' || typeof e.text === 'function', `${e.id} has no text`);
    if (isDecision(e)) {
      assert.ok(e.choices.length >= 2, `${e.id} needs at least two choices`);
      const labels = new Set(e.choices.map((c) => c.label));
      assert.equal(labels.size, e.choices.length, `${e.id} has duplicate choice labels`);
    }
  }
  const plain = EVENTS.filter((e) => !isDecision(e)).length;
  const decisions = EVENTS.filter(isDecision).length;
  console.log(`    ${plain} events, ${decisions} decision scenarios`);
  assert.ok(plain >= 120);
  assert.ok(decisions >= 40);
  // Obviously identical text is a duplicate in disguise.
  const texts = EVENTS.filter((e) => typeof e.text === 'string' && e.text).map((e) => e.text);
  assert.equal(new Set(texts).size, texts.length, 'two events share the same text');
});

test('cooldowns, once, max and family cooldowns are enforced', () => {
  const s = G.createNewGame({}, 100);
  ageTo(s, 7);
  const c = buildContext(s);
  const snow = findEvent('snowDay');
  assert.ok(isEligible(snow, c, s.events));
  fireEvent(s, snow);
  assert.ok(!isEligible(snow, buildContext(s), s.events), 'blocked right after firing (cooldown)');
  s.events.last.snowDay = s.player.age - snow.cooldown;
  assert.ok(isEligible(snow, buildContext(s), s.events), 'eligible again after the cooldown');
  s.events.count.snowDay = snow.max;
  assert.ok(!isEligible(snow, buildContext(s), s.events), 'blocked after max occurrences');
  const tooth = findEvent('lostTooth');
  s.events.count.lostTooth = 1;
  assert.ok(!isEligible(tooth, buildContext(s), s.events), 'once events never repeat');
  // Family cooldown: firing one familyFun event blocks its siblings for a few years.
  s.pending.length = 0;
  fireEvent(s, findEvent('familyMovieNight'));
  assert.ok(!isEligible(findEvent('campingTrip'), buildContext(s), s.events), 'family cooldown blocks near-duplicates');
});

test('events depend on state: no university event for a child, no coworker event without a job', () => {
  const s = G.createNewGame({}, 200);
  ageTo(s, 4);
  const ids = eligibleEvents(s, true).map((e) => e.id);
  assert.ok(!ids.includes('dormLife'));
  assert.ok(!ids.includes('coworkerLunch'));
  assert.ok(!ids.includes('carRepair'));
  assert.ok(ids.includes('familyPet') || ids.includes('brokenVase'));
});

test('eligible pools are large at every stage', () => {
  const s = G.createNewGame({}, 300);
  const report = [];
  const check = (label, min) => { const n = eligibleEvents(s, true).length; report.push(`${label}: ${n}`); assert.ok(n >= min, `${label} pool too small: ${n}`); };
  ageTo(s, 2); check('age 2', 8);
  ageTo(s, 7); check('age 7', 15);
  ageTo(s, 12); check('age 12', 15);
  ageTo(s, 16); check('age 16', 15);
  ageTo(s, 18); check('age 18', 12);
  G.enrollUniversity(s, 'Business'); ageTo(s, 20); check('university student', 15);
  ageTo(s, 22); G.applyForCareer(s, 'accounting'); ageTo(s, 25); check('age 25 employed', 20);
  ageTo(s, 35); check('age 35 employed', 20);
  ageTo(s, 50); if (!s.player.alive) return; check('age 50', 15);
  ageTo(s, 70); if (!s.player.alive) return; check('age 70', 12);
  console.log('    ' + report.join(' · '));
});

test('regression: no event repeats in consecutive years and no ordinary event dominates', () => {
  const lives = runLives(100, 1000);
  const totals = new Map(); const families = new Map(); const seen = new Set();
  let totalEvents = 0; let repeats = 0; let uniquePerLife = 0; let perLife = 0;
  for (const life of lives) {
    const log = life.state.events.log;
    perLife += log.length;
    uniquePerLife += new Set(log.map((e) => e.id)).size;
    for (let i = 0; i < log.length; i++) {
      const { id, age } = log[i];
      totalEvents++;
      totals.set(id, (totals.get(id) || 0) + 1);
      seen.add(id);
      const fam = findEvent(id).family; if (fam) families.set(fam, (families.get(fam) || 0) + 1);
      const previous = log.slice(0, i).filter((e) => e.id === id).pop();
      if (previous && age - previous.age < 2) repeats++;
      const def = findEvent(id);
      const count = log.slice(0, i + 1).filter((e) => e.id === id).length;
      assert.ok(count <= def.max, `${id} exceeded max ${def.max}`);
      if (def.once) assert.equal(count, 1, `${id} is once but fired twice`);
    }
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const unreachable = EVENTS.map((e) => e.id).filter((id) => !seen.has(id));
  const topFamily = [...families.entries()].sort((a, b) => b[1] - a[1])[0];
  console.log(`    ${lives.length} lives · ${totalEvents} events · ${(perLife / lives.length).toFixed(1)} per life · ${(uniquePerLife / lives.length).toFixed(1)} unique per life`);
  console.log(`    most common: ${ranked.slice(0, 5).map(([id, n]) => `${id} ${(100 * n / totalEvents).toFixed(1)}%`).join(', ')}`);
  console.log(`    most common family: ${topFamily ? `${topFamily[0]} (${topFamily[1]})` : 'none'} · unreachable in 100 lives: ${unreachable.length}${unreachable.length ? ' -> ' + unreachable.join(', ') : ''}`);
  assert.equal(repeats, 0, 'an event repeated within two years');
  assert.ok(ranked[0][1] / totalEvents < 0.06, `${ranked[0][0]} dominates (${ranked[0][1]} of ${totalEvents})`);
  assert.ok(unreachable.length <= EVENTS.length * 0.1, `too many unreachable events: ${unreachable.join(', ')}`);
});

test('single-life sequence: print one long life and check for stretches of the same event', () => {
  const [life] = runLives(1, 31337);
  const log = life.state.events.log;
  const lines = log.map((e) => `${String(e.age).padStart(3)} -> ${e.id}`);
  console.log('    ' + lines.slice(0, 60).join('\n    ') + (lines.length > 60 ? `\n    ... (${lines.length - 60} more)` : ''));
  for (let i = 2; i < log.length; i++) {
    assert.ok(!(log[i].id === log[i - 1].id && log[i].id === log[i - 2].id), `three ${log[i].id} in a row`);
  }
});

test('new life resets event memory; a continued life keeps it', () => {
  const a = G.createNewGame({}, 5);
  ageTo(a, 10);
  assert.ok(a.events.log.length > 0);
  const b = G.createNewGame({}, 6);
  assert.equal(b.events.log.length, 0);
  assert.deepEqual(b.events.count, {});
  const copy = JSON.parse(JSON.stringify(a));
  assert.deepEqual(copy.events.log, a.events.log);
});

test('the year does not force filler: quiet years are possible and never print a generic line', () => {
  const lives = runLives(20, 9000);
  let quiet = 0; let years = 0;
  for (const life of lives) {
    const byAge = new Map();
    for (const e of life.state.events.log) byAge.set(e.age, (byAge.get(e.age) || 0) + 1);
    for (let age = 8; age <= life.state.player.age; age++) { years++; if (!byAge.has(age)) quiet++; }
    assert.ok(!life.state.timeline.some((e) => /catching up/i.test(e.text)), 'the old filler line is gone');
  }
  assert.ok(quiet > 0, 'some years have no random event');
  assert.ok(quiet / years < 0.35, 'too many quiet years');
});
