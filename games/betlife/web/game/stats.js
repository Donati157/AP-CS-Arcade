// The one and only way to change a player stat or the bank balance.
//
// Every change goes through changeStat/changeMoney: the value is clamped to 0-100 (stats) and a
// short history entry is kept so a developer can see why a number moved
// (open the browser console and call betlife.statLog()).

export const STATS = ['happiness', 'health', 'smarts', 'looks'];
export const MIN_STAT = 0;
export const MAX_STAT = 100;
const LOG_LIMIT = 80;

export function clampStat(value) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, Math.round(value)));
}

/**
 * Changes one of the four stats by `amount` (positive or negative) and returns the change that
 * really happened after clamping. `reason` is free text for the history.
 */
export const SOFT_CAP = 80; // gains above this are halved, and above 90 they crawl: the last stretch to 100 is the hardest

export function changeStat(state, stat, amount, reason = '') {
  if (!STATS.includes(stat)) throw new Error(`Unknown stat: ${stat}`);
  amount = Math.round(amount);
  if (amount === 0) return 0;
  const from = state.player[stat];
  if (amount > 0 && from >= 90) amount = 1;
  else if (amount > 0 && from >= SOFT_CAP) amount = Math.max(1, Math.round(amount / 2));
  const to = clampStat(from + amount);
  state.player[stat] = to;
  log(state, { stat, from, to, change: to - from, reason });
  return to - from;
}

// Money is whole dollars and may go below zero (debt) only when `allowDebt` is true, which the
// yearly bills use; purchases and actions never push the balance negative.
export function changeMoney(state, amount, reason = '', allowDebt = false) {
  amount = Math.round(amount);
  if (amount === 0) return 0;
  const from = state.player.money;
  let to = from + amount;
  if (!allowDebt && to < 0 && from >= 0) to = 0;
  state.player.money = to;
  log(state, { stat: 'money', from, to, change: to - from, reason });
  return to - from;
}

function log(state, entry) {
  if (!state.statLog) state.statLog = [];
  state.statLog.push({ age: state.player.age, ...entry });
  if (state.statLog.length > LOG_LIMIT) state.statLog.splice(0, state.statLog.length - LOG_LIMIT);
}

// Applies an effects object such as { happiness: 4, health: -1, money: -50 } in one go.
export function applyEffects(state, effects, reason) {
  if (!effects) return;
  for (const stat of STATS) if (effects[stat]) changeStat(state, stat, effects[stat], reason);
  if (effects.money) changeMoney(state, effects.money, reason);
}

// Repeating the same activity in one year pays less each time: 100%, 50%, 25%, then nothing.
export function diminished(amount, timesAlreadyDone) {
  if (timesAlreadyDone <= 0) return amount;
  if (timesAlreadyDone === 1) return Math.round(amount / 2);
  if (timesAlreadyDone === 2) return Math.round(amount / 4) || (amount > 0 ? 1 : amount < 0 ? -1 : 0);
  return 0;
}
