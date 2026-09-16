// The player and their stats. Percentages are clamped to 0-100; money is whole dollars.
export const MIN_STAT = 0;
export const MAX_STAT = 100;

export function clampStat(value) {
  return Math.max(MIN_STAT, Math.min(MAX_STAT, value));
}

function between(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// A newborn with the facts from the life profile and randomly rolled starting stats.
export function createPlayer(profile, rng) {
  return {
    name: `${profile.firstName} ${profile.lastName}`,
    gender: profile.gender,
    birthplace: `${profile.city}, ${profile.country}`,
    birthday: profile.birthday,
    occupation: 'Infant',
    age: 0,
    happiness: between(rng, 60, 95),
    health: between(rng, 70, 100),
    smarts: between(rng, 25, 90),
    looks: between(rng, 25, 95),
    money: 0,
  };
}

const PERCENT_STATS = ['happiness', 'health', 'smarts', 'looks'];

export function changeStat(player, stat, amount) {
  if (PERCENT_STATS.includes(stat)) {
    player[stat] = clampStat(player[stat] + amount);
  } else if (stat === 'money') {
    player.money = Math.max(0, player.money + amount); // you cannot lose more than you have
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
