// Shared helpers for the BetLife test suite.
import { simulateLife } from '../game/simulate.js';

export function runLives(count, start = 1, options = {}) {
  const lives = [];
  for (let i = 0; i < count; i++) lives.push(simulateLife(start + i * 7919, options));
  return lives;
}

export function average(list) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : NaN;
}

export function atAge(life, age) {
  return life.snapshots.find((s) => s.age === age) || null;
}

export function percent(part, whole) {
  return whole === 0 ? '0%' : `${Math.round((part / whole) * 100)}%`;
}
