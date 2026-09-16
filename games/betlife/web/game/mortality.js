// End of life. Every year the simulation rolls against a probability that depends mostly on age
// and Health. There is no fixed maximum age: a healthy character usually lives into their
// eighties or nineties, an unhealthy one is at risk earlier, and nobody is guaranteed a
// particular year.
import { rand, chance, pick } from './rng.js';

/**
 * Chance (0-1) of the character's life ending during this year.
 * The age curve roughly doubles every seven to eight years after 30 (a classic mortality shape), and
 * Health scales it: 100 Health halves the risk, 50 Health leaves it as is, 0 Health quadruples it.
 */
export function yearlyDeathProbability(age, health) {
  let base;
  if (age < 1) base = 0.003;
  else if (age < 15) base = 0.0002;
  else if (age < 30) base = 0.0006;
  else base = 0.0007 * Math.pow(2, (age - 30) / 7.5);
  const healthFactor = Math.max(0.5, Math.min(4, 1 + (50 - health) / 33));
  return Math.min(0.95, base * healthFactor);
}

// Rolls for the player. Returns a non-graphic cause or null when life goes on.
export function checkMortality(state) {
  const { age, health } = state.player;
  if (!chance(state, yearlyDeathProbability(age, health))) return null;
  if (age >= 75) return pick(state, ['peacefully in your sleep', 'peacefully, surrounded by family', 'after a long and full life']);
  if (health < 35) return 'after a period of poor health';
  if (age < 40 && rand(state) < 0.5) return 'in an accident';
  return 'after a short illness';
}

// Relatives roll against the same curve with an assumed average Health.
export function relativeDies(state, age) {
  return chance(state, yearlyDeathProbability(age, 60));
}
