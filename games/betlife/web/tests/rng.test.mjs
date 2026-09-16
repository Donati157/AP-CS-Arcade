import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initRng, rand, between, pick } from '../game/rng.js';
import { simulateLife } from '../game/simulate.js';
import * as G from '../game/game-state.js';
import { restoreState } from '../game/save.js';

test('the generator advances instead of resetting, and its state is serializable', () => {
  const s = {}; initRng(s, 123);
  const first = [rand(s), rand(s), rand(s)];
  assert.notEqual(first[0], first[1]);
  const copy = JSON.parse(JSON.stringify(s));
  const fromCopy = [rand(copy), rand(copy)];
  const fromOriginal = [rand(s), rand(s)];
  assert.deepEqual(fromCopy, fromOriginal, 'a saved state continues the same sequence');
  assert.ok(between(s, 3, 5) >= 3 && between(s, 3, 5) <= 5);
  assert.ok(['a', 'b'].includes(pick(s, ['a', 'b'])));
});

test('same seed + same choices = same life', () => {
  const a = simulateLife(777);
  const b = simulateLife(777);
  assert.equal(a.state.player.age, b.state.player.age);
  assert.deepEqual(a.state.timeline.map((e) => e.text), b.state.timeline.map((e) => e.text));
  assert.deepEqual(a.state.events.log, b.state.events.log);
  const c = simulateLife(778);
  assert.notDeepEqual(a.state.timeline.map((e) => e.text), c.state.timeline.map((e) => e.text), 'different seeds differ');
});

test('reloading mid-life continues the sequence: event A then event B, never A again', () => {
  const state = G.createNewGame({}, 4242);
  const ageTo = (s, target) => { while (s.player.age < target) { s.pending.length = 0; G.ageUp(s); } };
  ageTo(state, 12);
  const saved = JSON.parse(JSON.stringify(state));
  state.pending.length = 0; G.ageUp(state);
  const eventsAfterOriginal = state.events.log.filter((e) => e.age === 13).map((e) => e.id);
  const restored = restoreState(JSON.parse(JSON.stringify(saved)));
  restored.pending.length = 0; G.ageUp(restored);
  const eventsAfterRestore = restored.events.log.filter((e) => e.age === 13).map((e) => e.id);
  assert.deepEqual(eventsAfterRestore, eventsAfterOriginal, 'restored save produces the same next year');
  const before = saved.events.log.filter((e) => e.age === 12).map((e) => e.id);
  for (const id of eventsAfterRestore) assert.ok(!before.includes(id), 'the previous year\'s event did not repeat after reload');
});
