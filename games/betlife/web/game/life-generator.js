// Creates the starting facts of a new life: name, gender, birthplace, birthday and parents.
// All names and places are original BetLife content.
import { randomIndex } from './rng.js';

const FIRST_NAMES = {
  female: ['Sofia', 'Emma', 'Olivia', 'Ava', 'Mia', 'Isabela', 'Chloe', 'Zoe', 'Lily', 'Hana', 'Amara', 'Nora', 'Luna', 'Maya', 'Elena'],
  male: ['Liam', 'Noah', 'Lucas', 'Mateo', 'Ethan', 'Leo', 'Kai', 'Daniel', 'Oliver', 'Theo', 'Rafael', 'Samuel', 'Aiden', 'Jonas', 'Alex'],
};
const LAST_NAMES = ['Carter', 'Nguyen', 'Silva', 'Okafor', 'Rivera', 'Bennett', 'Tanaka', 'Schmidt', 'Rossi', 'Patel', 'Kim', 'Dubois', 'Haddad', 'Novak', 'Brooks'];
export const PLACES = [
  { city: 'Austin', country: 'United States' }, { city: 'Toronto', country: 'Canada' }, { city: 'São Paulo', country: 'Brazil' },
  { city: 'Lisbon', country: 'Portugal' }, { city: 'Dublin', country: 'Ireland' }, { city: 'Tokyo', country: 'Japan' },
  { city: 'Sydney', country: 'Australia' }, { city: 'Cape Town', country: 'South Africa' }, { city: 'Berlin', country: 'Germany' },
  { city: 'Mexico City', country: 'Mexico' }, { city: 'Seoul', country: 'South Korea' }, { city: 'Madrid', country: 'Spain' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PARENT_JOBS = ['teacher', 'nurse', 'carpenter', 'software developer', 'chef', 'accountant', 'bus driver', 'pharmacist',
  'graphic designer', 'electrician', 'librarian', 'police officer', 'farmer', 'dentist', 'journalist', 'mechanic'];

function pick(rng, list) {
  return list[randomIndex(rng, list.length)];
}

function between(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Builds a life profile. `custom` may supply firstName, lastName, gender ('female' | 'male')
 * and placeIndex; anything missing is generated.
 */
export function generateProfile(rng, custom = {}) {
  const gender = custom.gender === 'female' || custom.gender === 'male' ? custom.gender : pick(rng, ['female', 'male']);
  const lastName = (custom.lastName || '').trim() || pick(rng, LAST_NAMES);
  const firstName = (custom.firstName || '').trim() || pick(rng, FIRST_NAMES[gender]);
  const place = PLACES[custom.placeIndex >= 0 && custom.placeIndex < PLACES.length ? custom.placeIndex : randomIndex(rng, PLACES.length)];
  const month = pick(rng, MONTHS);
  const day = between(rng, 1, 28);
  return {
    firstName,
    lastName,
    gender,
    city: place.city,
    country: place.country,
    birthday: `${month} ${day}`,
    mother: { name: `${pick(rng, FIRST_NAMES.female)} ${lastName}`, job: pick(rng, PARENT_JOBS), age: between(rng, 24, 40) },
    father: { name: `${pick(rng, FIRST_NAMES.male)} ${lastName}`, job: pick(rng, PARENT_JOBS), age: between(rng, 25, 43) },
  };
}
