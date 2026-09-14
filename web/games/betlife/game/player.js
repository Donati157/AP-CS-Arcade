// The player and their stats. Percentages are clamped to 0-100; money is whole dollars.
export const MIN_STAT = 0;
export const MAX_STAT = 100;

export function clampStat(value) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}

export function createPlayer() {
  // Development character: every life starts as Alex until character creation exists.
  return {
    name: 'Alex Carter',
    occupation: 'Student',
    age: 16,
    happiness: 80,
    health: 90,
    smarts: 70,
    looks: 65,
    money: 1250,
  };
}

const PERCENT_STATS = ['happiness', 'health', 'smarts', 'looks'];

export function changeStat(player, stat, amount) {
  if (PERCENT_STATS.includes(stat)) {
    player[stat] = clampStat(player[stat] + amount);
  } else if (stat === 'money') {
    player.money += amount;
  }
}

export function canAfford(player, cost) {
  return player.money >= cost;
}

export const LIFE_STAGES = ['Baby', 'Child', 'Teen', 'Young Adult', 'Adult', 'Senior'];

export function lifeStage(age) {
  if (age <= 2) return 'Baby';
  if (age <= 12) return 'Child';
  if (age <= 17) return 'Teen';
  if (age <= 25) return 'Young Adult';
  if (age <= 64) return 'Adult';
  return 'Senior';
}

export function stageIndex(stage) {
  return LIFE_STAGES.indexOf(stage);
}
