// The player record and the life stages that gate content and change the UI.
import { between } from './rng.js';

// A newborn: the facts from the life profile plus seeded starting stats that differ per life.
export function createPlayer(state, profile) {
  return {
    name: `${profile.firstName} ${profile.lastName}`,
    firstName: profile.firstName,
    lastName: profile.lastName,
    gender: profile.gender,
    birthplace: `${profile.city}, ${profile.country}`,
    residence: `${profile.city}, ${profile.country}`,
    birthday: profile.birthday,
    occupation: 'Infant',
    age: 0,
    happiness: between(state, 55, 92),
    health: between(state, 60, 98),
    smarts: between(state, 20, 90),
    looks: between(state, 20, 92),
    money: 0,
    alive: true,
    retired: false,
    livesWithParents: true,
    hasLicence: false,
  };
}

// Life stages used by events, activities and the interface.
export const STAGES = [
  { id: 'infant', label: 'Infant', min: 0, max: 3 },
  { id: 'child', label: 'Child', min: 4, max: 9 },
  { id: 'preteen', label: 'Preteen', min: 10, max: 12 },
  { id: 'teen', label: 'Teenager', min: 13, max: 17 },
  { id: 'youngAdult', label: 'Young Adult', min: 18, max: 29 },
  { id: 'adult', label: 'Adult', min: 30, max: 44 },
  { id: 'middleAge', label: 'Middle-aged', min: 45, max: 64 },
  { id: 'senior', label: 'Senior', min: 65, max: 999 },
];

export function stageOf(age) {
  return STAGES.find((s) => age >= s.min && age <= s.max) || STAGES[STAGES.length - 1];
}

export function stageId(age) {
  return stageOf(age).id;
}

export function stageLabel(age) {
  return stageOf(age).label;
}

export function isAdult(age) {
  return age >= 18;
}

export function pronouns(gender) {
  return gender === 'female'
    ? { they: 'she', them: 'her', their: 'her', theirs: 'hers', child: 'girl', parent: 'mother', sibling: 'sister', spouse: 'wife' }
    : { they: 'he', them: 'him', their: 'his', theirs: 'his', child: 'boy', parent: 'father', sibling: 'brother', spouse: 'husband' };
}
