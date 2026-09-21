// Relationship depth and the action system that replaced the old per-year budget.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import * as People from '../game/people.js';
import { restoreState } from '../game/save.js';

const ageTo = (s, target) => { while (s.player.age < target && s.player.alive) { s.pending.length = 0; G.ageUp(s); } };

test('there is no per-year action budget: the game never answers "Busy Year"', () => {
  const s = G.createNewGame({}, 7);
  ageTo(s, 17);
  s.player.money = 5000;
  const friend = People.alive(s).find((p) => p.role === 'friend') || People.alive(s)[0];
  for (let i = 0; i < 30; i++) {
    const r = G.interactWith(s, friend.id, 'spendTime');
    assert.equal(r.ok, true, `interaction ${i + 1} was blocked: ${r.title}`);
    assert.notEqual(r.title, 'Busy Year');
  }
  assert.equal(s.actionsRemaining, undefined, 'the action counter is gone from the state');
});

test('every action the person screen offers actually works', () => {
  const failures = [];
  const covered = new Set();
  for (const seed of [2, 5, 13, 19]) {
    const s = G.createNewGame({}, seed);
    while (s.player.age < 40 && s.player.alive) {
      s.pending.length = 0; G.ageUp(s);
      s.player.money = 9000;
      for (const p of People.alive(s)) {
        for (const [id, title, , group] of People.actionsFor(s, p)) {
          if (!p.alive || !People.actionsFor(s, p).some(([x]) => x === id)) continue;
          if (['breakUp', 'unfriend', 'release', 'argue', 'confront'].includes(id)) continue;
          assert.ok(group, `${id} has no group`);
          assert.ok(title, `${id} has no title`);
          const r = G.interactWith(s, p.id, id);
          covered.add(id);
          if (!r.ok) failures.push(`${p.role} ${id} -> ${r.title}`);
        }
      }
    }
  }
  assert.deepEqual([...new Set(failures)], [], 'an action was offered on screen but refused when used');
  assert.ok(covered.size >= 25, `expected broad coverage, exercised ${covered.size}`);
});

test('the person screen groups actions, and the groups are the documented ones', () => {
  const s = G.createNewGame({}, 5);
  ageTo(s, 20);
  const who = People.alive(s)[0];
  const sections = People.actionSections(s, who);
  assert.ok(sections.length >= 2, 'a person has more than one group of actions');
  for (const [group, rows] of sections) {
    assert.ok(People.ACTION_GROUPS.includes(group), `unexpected group ${group}`);
    assert.ok(rows.length > 0, `${group} is empty`);
  }
  const flat = People.actionsFor(s, who).length;
  assert.equal(sections.reduce((n, [, rows]) => n + rows.length, 0), flat, 'grouping loses no action');
});

test('different relationship types offer different things', () => {
  const s = G.createNewGame({}, 11);
  ageTo(s, 30);
  const ids = (p) => People.actionsFor(s, p).map(([id]) => id);
  const parent = People.alive(s).find((p) => p.role === 'mother' || p.role === 'father');
  assert.ok(ids(parent).includes('familyStory'), 'parents can be asked about the past');
  const pet = People.pets(s)[0] || People.alive(s).find((p) => p.role === 'pet');
  if (pet) assert.ok(!ids(pet).includes('conversation'), 'pets do not get the human social menu');
  if (parent) assert.ok(!ids(parent).includes('propose'), 'you cannot propose to a parent');
});

test('paid interactions move money and are refused politely when broke', () => {
  const s = G.createNewGame({}, 3);
  ageTo(s, 20);
  const who = People.alive(s).find((p) => People.actionsFor(s, p).some(([id]) => id === 'movie'));
  s.player.money = 100;
  const before = s.player.money;
  assert.equal(G.interactWith(s, who.id, 'movie').ok, true);
  assert.equal(s.player.money, before - 30, 'the cinema costs $30');
  s.player.money = 5;
  const broke = G.interactWith(s, who.id, 'movie');
  assert.equal(broke.ok, false);
  assert.equal(broke.title, 'Not Enough Money');
});

test('per-person action counters survive a save and reload', () => {
  const s = G.createNewGame({}, 8);
  ageTo(s, 18);
  const who = People.alive(s)[0];
  G.interactWith(s, who.id, 'spendTime');
  G.interactWith(s, who.id, 'spendTime');
  assert.equal(People.repeatsThisYear(who, 'spendTime'), 2);
  const back = restoreState(JSON.parse(JSON.stringify(s)));
  const same = People.findPerson(back, who.id);
  assert.equal(People.repeatsThisYear(same, 'spendTime'), 2, 'the year’s repeats are remembered');
});
