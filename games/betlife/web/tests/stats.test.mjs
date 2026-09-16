import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import { changeStat, changeMoney, diminished, STATS } from '../game/stats.js';
import { runLives, average, atAge, percent } from './helpers.mjs';
import { yearlyDeathProbability } from '../game/mortality.js';
import * as Career from '../game/career.js';

test('one stat pipeline: clamp 0-100 and a history entry with a reason', () => {
  const s = G.createNewGame({}, 1);
  s.player.health = 50;
  assert.equal(changeStat(s, 'health', 80, 'test'), 50, 'clamped at 100');
  assert.equal(s.player.health, 100);
  s.player.health = 95;
  assert.equal(changeStat(s, 'health', 4, 'test'), 1, 'gains above 90 crawl');
  changeStat(s, 'health', -500, 'crash');
  assert.equal(s.player.health, 0);
  assert.throws(() => changeStat(s, 'charisma', 1));
  const last = s.statLog[s.statLog.length - 1];
  assert.equal(last.reason, 'crash');
  assert.equal(last.from, 96);
  assert.equal(last.to, 0);
});

test('money: purchases cannot go negative, bills can (debt)', () => {
  const s = G.createNewGame({}, 2);
  s.player.money = 50;
  changeMoney(s, -80, 'toy');
  assert.equal(s.player.money, 0);
  changeMoney(s, -80, 'rent', true);
  assert.equal(s.player.money, -80);
});

test('starting stats vary by seed and stay in range', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const s = G.createNewGame({}, seed);
    for (const stat of STATS) { assert.ok(s.player[stat] >= 0 && s.player[stat] <= 100); }
    seen.add(`${s.player.happiness}-${s.player.health}-${s.player.smarts}-${s.player.looks}`);
  }
  assert.ok(seen.size >= 15, `expected varied starting stats, got ${seen.size} distinct sets`);
  const custom = G.createNewGame({ firstName: 'Ada', lastName: 'Lovelace', gender: 'female', placeIndex: 0 }, 5);
  assert.equal(custom.player.name, 'Ada Lovelace');
  assert.ok(custom.player.smarts >= 20 && custom.player.smarts <= 90, 'custom lives get normal stats, no editor');
});

test('actions have real effects and repeating one pays less', () => {
  assert.deepEqual([diminished(4, 0), diminished(4, 1), diminished(4, 2), diminished(4, 3)], [4, 2, 1, 0]);
  const s = G.createNewGame({}, 3);
  while (s.player.age < 12) { s.pending.length = 0; G.ageUp(s); }
  s.player.happiness = 50;
  const before = s.player.happiness;
  G.doActivity(s, 'meditate');
  assert.equal(s.player.happiness, before + 4);
  G.doActivity(s, 'meditate');
  assert.equal(s.player.happiness, before + 6, 'second time gives half');
  G.doActivity(s, 'meditate');
  G.doActivity(s, 'meditate');
  assert.equal(s.player.happiness, before + 7, 'third time a quarter, fourth nothing');
  assert.equal(s.actionsRemaining, 2, 'each attempt used an action');
  s.player.happiness = 50;
  const parent = s.relationships.find((r) => r.role === 'mother');
  G.interactWith(s, parent.id, 'argue');
  assert.ok(s.player.happiness < 50, 'negative actions lower happiness');
  assert.equal(s.actionsRemaining, 1);
  const blocked = G.doActivity(s, 'walk');
  G.doActivity(s, 'walk');
  assert.ok(blocked.ok);
  assert.equal(G.doActivity(s, 'walk').ok, false, 'no actions left');
});

test('health drives mortality with age', () => {
  assert.ok(yearlyDeathProbability(30, 100) < yearlyDeathProbability(30, 20));
  assert.ok(yearlyDeathProbability(85, 70) > yearlyDeathProbability(40, 70) * 10);
  assert.ok(yearlyDeathProbability(10, 90) < 0.001);
  assert.ok(yearlyDeathProbability(95, 30) > 0.2);
});

test('decision and event effects are applied exactly once', async () => {
  const s = G.createNewGame({}, 9);
  while (s.player.age < 4) { s.pending.length = 0; G.ageUp(s); }
  s.pending.length = 0;
  s.player.happiness = 50;
  s.events.count = {}; s.events.last = {};
  // Force the family pet decision and take the dog: +4 happiness, +1 health, new pet.
  const { fireEvent } = await import('../game/events/engine.js');
  const { findEvent } = await import('../game/events/catalog.js');
  s.relationships = s.relationships.filter((r) => r.role !== 'pet');
  fireEvent(s, findEvent('familyPet'));
  assert.equal(s.pending.length, 1);
  const health = s.player.health;
  G.answerModal(s, 0);
  assert.equal(s.player.happiness, 54);
  assert.equal(s.player.health, Math.min(100, health + 1));
  assert.equal(s.relationships.filter((r) => r.role === 'pet').length, 1);
  assert.equal(s.pending.length, 0);
});

test('50-life balance report: no frozen or broken stats', () => {
  const lives = runLives(50, 11);
  const rows = [];
  for (const age of [0, 10, 18, 40, 70]) {
    const snaps = lives.map((l) => (age === 0 ? { ...l.snapshots[0], age: 0 } : atAge(l, age))).filter(Boolean);
    if (age === 0) for (let i = 0; i < snaps.length; i++) { const p = lives[i].state; void p; }
    rows.push([age, snaps.length, ...STATS.map((st) => Math.round(average(snaps.map((s) => s[st]))))]);
  }
  console.log('    age | lives | happiness health smarts looks');
  for (const r of rows) console.log(`    ${String(r[0]).padStart(3)} | ${String(r[1]).padStart(5)} | ${r.slice(2).map((v) => String(v).padStart(5)).join('  ')}`);
  for (const st of STATS) {
    let hitZero = 0; let hitHundred = 0; let frozen = 0;
    for (const l of lives) {
      const values = l.snapshots.map((s) => s[st]);
      assert.ok(values.every((v) => Number.isFinite(v) && v >= 0 && v <= 100), `${st} out of range`);
      if (values.includes(0)) hitZero++;
      if (values.includes(100)) hitHundred++;
      // frozen: the same value for 25 consecutive years
      let run = 1; let longest = 1;
      for (let i = 1; i < values.length; i++) { run = values[i] === values[i - 1] ? run + 1 : 1; longest = Math.max(longest, run); }
      if (longest >= 25) frozen++;
    }
    console.log(`    ${st}: reached 0 in ${percent(hitZero, lives.length)}, reached 100 in ${percent(hitHundred, lives.length)}, frozen 25+ years in ${frozen}`);
    assert.ok(frozen === 0, `${st} frozen for 25+ years in ${frozen} lives`);
    assert.ok(hitHundred < lives.length * 0.9, `${st} reaches 100 in almost every life`);
  }
  // Happiness must not stay at exactly 100 for a decade in any life.
  for (const l of lives) {
    let run = 0;
    for (const s of l.snapshots) { run = s.happiness === 100 ? run + 1 : 0; assert.ok(run < 10, 'happiness stuck at 100 for 10 years'); }
  }
});

test('stat changes survive a save/load round trip', async () => {
  const { restoreState } = await import('../game/save.js');
  const s = G.createNewGame({}, 21);
  while (s.player.age < 15) { s.pending.length = 0; G.ageUp(s); }
  G.doActivity(s, 'readBook');
  const copy = restoreState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual([copy.player.happiness, copy.player.health, copy.player.smarts, copy.player.looks, copy.player.money],
    [s.player.happiness, s.player.health, s.player.smarts, s.player.looks, s.player.money]);
  assert.equal(copy.career.salary, s.career.salary);
  assert.equal(Career.isEmployed(copy.career), Career.isEmployed(s.career));
});
