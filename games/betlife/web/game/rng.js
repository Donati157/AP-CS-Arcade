// Seeded random numbers for the simulation (mulberry32).
//
// The generator's whole state is one 32-bit number stored on the game state as `rngState`,
// so it is saved with the game: reloading the page continues the same sequence instead of
// restarting it, and tests can replay a life exactly from a seed. Never use Math.random()
// inside simulation code; call these helpers with the game state instead.

export function seedFromClock() {
  // Only used when a brand-new life starts without an explicit seed (normal play).
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function initRng(state, seed) {
  state.seed = seed >>> 0;
  state.rngState = seed >>> 0;
}

// Returns a float in [0, 1) and advances the saved state by exactly one step.
export function rand(state) {
  let a = (state.rngState + 0x6D2B79F5) >>> 0;
  state.rngState = a;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(state, probability) {
  return rand(state) < probability;
}

// Whole number from min to max, both included.
export function between(state, min, max) {
  return min + Math.floor(rand(state) * (max - min + 1));
}

export function pick(state, list) {
  return list[Math.floor(rand(state) * list.length)];
}

// Picks one item where `weightOf(item)` gives its relative chance.
export function pickWeighted(state, items, weightOf) {
  let total = 0;
  for (const item of items) total += Math.max(0, weightOf(item));
  if (total <= 0) return items.length ? items[0] : null;
  let roll = rand(state) * total;
  for (const item of items) {
    roll -= Math.max(0, weightOf(item));
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}
