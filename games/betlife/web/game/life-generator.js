// Creates the starting facts of a new life and generates the names of everyone the player meets.
// All names, places and jobs are original BetLife content.
import { pick, between, chance } from './rng.js';

export const FIRST_NAMES = {
  female: ['Sofia', 'Emma', 'Olivia', 'Ava', 'Mia', 'Isabela', 'Chloe', 'Zoe', 'Lily', 'Hana', 'Amara', 'Nora', 'Luna', 'Maya',
    'Elena', 'Priya', 'Ines', 'Freya', 'Yara', 'Mei', 'Aisha', 'Clara', 'Julia', 'Rosa', 'Talia', 'Wren', 'Beatriz', 'Ivy', 'Naomi', 'Saoirse'],
  male: ['Liam', 'Noah', 'Lucas', 'Mateo', 'Ethan', 'Leo', 'Kai', 'Daniel', 'Oliver', 'Theo', 'Rafael', 'Samuel', 'Aiden', 'Jonas',
    'Alex', 'Omar', 'Felix', 'Hugo', 'Ravi', 'Tomas', 'Jasper', 'Idris', 'Bruno', 'Elias', 'Caleb', 'Nico', 'Arjun', 'Milo', 'Yusuf', 'Rowan'],
};
export const LAST_NAMES = ['Carter', 'Nguyen', 'Silva', 'Okafor', 'Rivera', 'Bennett', 'Tanaka', 'Schmidt', 'Rossi', 'Patel', 'Kim',
  'Dubois', 'Haddad', 'Novak', 'Brooks', 'Almeida', 'Fischer', 'Moreno', 'Adeyemi', 'Larsen', 'Quinn', 'Sato', 'Mendes', 'Walsh',
  'Ferreira', 'Kowalski', 'Osei', 'Delgado', 'Hart', 'Lindqvist'];

export const PLACES = [
  { city: 'Austin', country: 'United States' }, { city: 'Toronto', country: 'Canada' }, { city: 'São Paulo', country: 'Brazil' },
  { city: 'Lisbon', country: 'Portugal' }, { city: 'Dublin', country: 'Ireland' }, { city: 'Tokyo', country: 'Japan' },
  { city: 'Sydney', country: 'Australia' }, { city: 'Cape Town', country: 'South Africa' }, { city: 'Berlin', country: 'Germany' },
  { city: 'Mexico City', country: 'Mexico' }, { city: 'Seoul', country: 'South Korea' }, { city: 'Madrid', country: 'Spain' },
  { city: 'Lagos', country: 'Nigeria' }, { city: 'Mumbai', country: 'India' }, { city: 'Oslo', country: 'Norway' },
  { city: 'Buenos Aires', country: 'Argentina' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const PARENT_JOBS = ['teacher', 'nurse', 'carpenter', 'software developer', 'chef', 'accountant', 'bus driver', 'pharmacist',
  'graphic designer', 'electrician', 'librarian', 'police officer', 'farmer', 'dentist', 'journalist', 'mechanic', 'baker',
  'architect', 'shop owner', 'firefighter', 'translator', 'veterinarian', 'plumber', 'photographer'];
export const PET_NAMES = ['Biscuit', 'Mochi', 'Pepper', 'Luna', 'Ziggy', 'Waffles', 'Olive', 'Pixel', 'Nori', 'Coco', 'Bean', 'Juniper'];

// A name nobody in the player's life already uses.
export function uniqueName(state, gender, lastName) {
  const taken = new Set(state.relationships.map((r) => r.name));
  for (let tries = 0; tries < 40; tries++) {
    const first = pick(state, FIRST_NAMES[gender]);
    const last = lastName || pick(state, LAST_NAMES);
    const name = `${first} ${last}`;
    if (!taken.has(name) && name !== state.player.name) return name;
  }
  return `${pick(state, FIRST_NAMES[gender])} ${pick(state, LAST_NAMES)}`;
}

export function randomGender(state) {
  return chance(state, 0.5) ? 'female' : 'male';
}

/**
 * Builds a life profile. `custom` may supply firstName, lastName, gender ('female' | 'male')
 * and placeIndex; anything missing is generated from the seeded RNG.
 */
export function generateProfile(state, custom = {}) {
  const gender = custom.gender === 'female' || custom.gender === 'male' ? custom.gender : randomGender(state);
  const lastName = (custom.lastName || '').trim().slice(0, 20) || pick(state, LAST_NAMES);
  const firstName = (custom.firstName || '').trim().slice(0, 20) || pick(state, FIRST_NAMES[gender]);
  const place = PLACES[custom.placeIndex >= 0 && custom.placeIndex < PLACES.length ? custom.placeIndex : Math.floor(between(state, 0, PLACES.length - 1))];
  const month = pick(state, MONTHS);
  const day = between(state, 1, 28);
  return {
    firstName, lastName, gender,
    city: place.city, country: place.country,
    birthday: `${month} ${day}`,
    mother: { name: `${pick(state, FIRST_NAMES.female)} ${lastName}`, job: pick(state, PARENT_JOBS), age: between(state, 23, 40) },
    father: { name: `${pick(state, FIRST_NAMES.male)} ${lastName}`, job: pick(state, PARENT_JOBS), age: between(state, 24, 44) },
    olderSibling: chance(state, 0.35) ? { gender: randomGender(state), age: between(state, 2, 7) } : null,
  };
}

// "a teacher" but "an accountant".
export function withArticle(noun) {
  return (/^[aeiou]/i.test(noun) ? 'an ' : 'a ') + noun;
}
