// Activities the player can choose each year, grouped the way the Activities screen shows them.
// Every activity costs one action; repeating one in the same year pays less each time.
import { chance, between, pick } from './rng.js';
import { changeStat, changeMoney, applyEffects, diminished } from './stats.js';
import { addJournal } from './journal.js';
import * as People from './people.js';
import { ownsKind } from './assets.js';

export const ACTIONS_PER_YEAR = 6;
export const ACTIVITY_MIN_AGE = 3;

function item(id, name, sub, minAge, effects, text, extra = {}) {
  return { id, name, sub, minAge, maxAge: 999, cost: 0, effects, text, ...extra };
}

export const CATEGORIES = [
  { id: 'mindBody', name: 'Mind & Body', sub: 'Work on self-improvement', icon: 'figure', items: [
    item('readBook', 'Read a Book', 'Learn something new', 5, { smarts: 3, happiness: 1 }, 'You read a book from cover to cover.', { icon: 'book' }),
    item('library', 'Library', 'Study in peace', 6, { smarts: 2 }, 'You spent the afternoon studying at the library.', { icon: 'book' }),
    item('memory', 'Memory Games', 'Sharpen your mind', 6, { smarts: 2, happiness: 1 }, 'You played memory games and beat your record.', { icon: 'bulb' }),
    item('walk', 'Go for a Walk', 'Fresh air', 5, { health: 2, happiness: 2 }, 'You went for a long walk around the neighborhood.', { icon: 'footprints' }),
    item('meditate', 'Meditate', 'Calm your thoughts', 10, { happiness: 4, health: 1 }, 'You took quiet time to meditate.', { icon: 'sun' }),
    item('sports', 'Sports Practice', 'Train with a team', 7, { health: 3, happiness: 2 }, 'You trained hard with your sports team.', { icon: 'ball', cost: 30 }),
    item('martialArts', 'Martial Arts', 'Discipline and balance', 8, { health: 3, happiness: 2 }, 'You practiced martial arts and earned a new belt stripe.', { icon: 'figure', cost: 60 }),
    item('gym', 'Gym', 'Build strength', 14, { health: 4, looks: 2, happiness: 1 }, 'You kept up a steady gym routine.', { icon: 'figure', cost: 40 }),
    item('diet', 'Healthy Diet', 'Eat better', 14, { health: 3, looks: 1, happiness: -1 }, 'You stuck to a healthier diet this year.', { icon: 'leaf' }),
    item('selfCare', 'Self-care Routine', 'Look after yourself', 12, { looks: 2, happiness: 1 }, 'You took better care of your skin, hair and sleep.', { icon: 'sparkle', cost: 25 }),
    item('instrument', 'Practice Instrument', 'Needs an instrument', 6, { happiness: 3, smarts: 1 }, 'You practiced your instrument until the neighbors clapped.', { icon: 'music', requires: 'instrument' }),
  ] },
  { id: 'doctor', name: 'Doctor', sub: 'Look after your health', icon: 'cross', items: [
    item('checkup', 'General Checkup', 'Cedar Grove Clinic', 5, { health: 3 }, 'You went to the doctor for a checkup.', { icon: 'cross', cost: 50 }),
    item('dentist', 'Dentist', 'Keep that smile', 5, { health: 1, looks: 1 }, 'You visited the dentist. No cavities!', { icon: 'cross', cost: 80 }),
    item('eyeExam', 'Eye Exam', 'See clearly', 6, { health: 1, smarts: 1 }, 'You had your eyes checked.', { icon: 'eye', cost: 60 }),
    item('counselor', 'Talk to a Counselor', 'Someone to listen', 12, { happiness: 5 }, 'You talked things through with a counselor.', { icon: 'chat', cost: 90 }),
  ] },
  { id: 'leisure', name: 'Leisure', sub: 'Have some fun', icon: 'star', items: [
    item('playOutside', 'Play Outside', 'Run around', 3, { happiness: 3, health: 2 }, 'You played outside until it got dark.', { icon: 'sun', maxAge: 12 }),
    item('videoGames', 'Video Games', 'One more level', 6, { happiness: 3, health: -1 }, 'You spent a rainy weekend playing video games.', { icon: 'game' }),
    item('movies', 'Movie Theater', 'Big screen', 6, { happiness: 3 }, 'You caught a movie at the theater.', { icon: 'film', cost: 15 }),
    item('zoo', 'Zoo Trip', 'Meet the animals', 3, { happiness: 3, smarts: 1 }, 'You spent a day at the zoo.', { icon: 'paw', cost: 30 }),
    item('concert', 'Concert', 'Live music', 15, { happiness: 5 }, 'You went to a concert and sang along to every song.', { icon: 'music', cost: 80 }),
    item('vacation', 'Vacation', 'A week away', 18, { happiness: 8, health: 2 }, 'You took a week-long vacation.', { icon: 'plane', cost: 1200 }),
    item('hobbyCraft', 'Arts & Crafts', 'Make something', 4, { happiness: 2, smarts: 1 }, 'You made something with your own hands.', { icon: 'palette' }),
  ] },
  { id: 'social', name: 'Social', sub: 'People and community', icon: 'people', items: [
    item('familyDinner', 'Family Dinner', 'Everyone at the table', 3, { happiness: 2 }, 'You had a long family dinner full of stories.', { icon: 'house', special: 'family' }),
    item('hangOut', 'Hang Out with Friends', 'Needs friends', 6, { happiness: 4 }, 'You hung out with your friends all weekend.', { icon: 'people', special: 'friends' }),
    item('joinClub', 'Join a Club', 'Meet new people', 10, { happiness: 2 }, 'You joined a club and met someone new.', { icon: 'star', special: 'newFriend', maxAge: 30 }),
    item('volunteer', 'Volunteer', 'Help your community', 13, { happiness: 3, smarts: 1 }, 'You volunteered on weekends.', { icon: 'heart' }),
    item('goOnDate', 'Go on a Date', 'Meet someone special', 18, { happiness: 2 }, 'You went on a date.', { icon: 'heart', cost: 40, special: 'date' }),
  ] },
  { id: 'pets', name: 'Pets', sub: 'Adopt a companion', icon: 'paw', items: Object.entries(People.PET_SPECIES).map(([species, def]) =>
    item(`adopt_${species}`, `Adopt a ${def.label}`, `$${def.cost} · lives about ${def.lifespan} years`, species === 'fish' || species === 'hamster' ? 6 : 8,
      { happiness: 4 }, '', { icon: 'paw', cost: def.cost, special: 'adopt', species })) },
  { id: 'licences', name: 'Licences', sub: 'Official permits', icon: 'car', items: [
    item('drivingTest', 'Driving Test', 'Get your licence', 16, {}, '', { icon: 'car', cost: 40, special: 'driving' }),
  ] },
];

export function findActivity(id) {
  for (const c of CATEGORIES) for (const i of c.items) if (i.id === id) return i;
  return null;
}

// Why an activity row is greyed out, or null when it can be done.
export function unavailableReason(state, activity) {
  const age = state.player.age;
  if (age < activity.minAge) return `Age ${activity.minAge}+`;
  if (age > activity.maxAge) return 'Too old for this now';
  if (activity.requires === 'instrument' && !ownsKind(state, 'instrument')) return 'Buy an instrument first';
  if (activity.special === 'friends' && People.friends(state).length === 0) return 'Make a friend first';
  if (activity.special === 'date' && People.partner(state)) return 'You are already with someone';
  if (activity.special === 'driving' && state.player.hasLicence) return 'You already have a licence';
  if (activity.special === 'adopt' && People.pets(state).length >= 3) return 'Three pets is plenty';
  return null;
}

/**
 * Does the activity. Returns { ok, title, text } for the interface. The caller has already
 * checked there is an action left; money is checked here.
 */
export function perform(state, activity) {
  if (unavailableReason(state, activity)) return { ok: false, title: 'Not Now', text: unavailableReason(state, activity) };
  if (activity.cost > state.player.money) return { ok: false, title: 'Not Enough Money', text: `This costs $${activity.cost} and you cannot afford it right now.` };
  const done = state.yearly.activities[activity.id] || 0;
  state.yearly.activities[activity.id] = done + 1;
  state.actionsRemaining -= 1;
  if (activity.cost) changeMoney(state, -activity.cost, activity.name);
  const effects = {};
  for (const [stat, amount] of Object.entries(activity.effects)) effects[stat] = diminished(amount, done);
  applyEffects(state, effects, activity.name);
  let text = activity.text;
  if (done >= 2) text += ' It felt routine by now.';

  switch (activity.special) {
    case 'family':
      for (const p of People.parents(state).concat(People.siblings(state), People.children(state))) { People.changeCloseness(p, 3); p.interactedThisYear = true; }
      break;
    case 'friends':
      for (const f of People.friends(state)) { People.changeCloseness(f, 3); f.interactedThisYear = true; }
      break;
    case 'newFriend': {
      const friend = People.addFriend(state);
      text = friend ? `You joined a club and became friends with ${friend.name}.` : 'You joined a club, but your circle of friends is already full.';
      break;
    }
    case 'date': {
      if (chance(state, 0.55)) {
        const love = People.startDating(state);
        text = `You went on a date with ${love.name}, and it went well. You are now a couple.`;
        changeStat(state, 'happiness', 4, 'new relationship');
      } else {
        text = pick(state, ['The date was pleasant but there was no spark.', 'Your date talked about themselves the entire evening.', 'You had a nice evening, but neither of you called back.']);
      }
      break;
    }
    case 'adopt': {
      const pet = People.adoptPet(state, activity.species);
      text = `You adopted a ${People.PET_SPECIES[activity.species].label.toLowerCase()} and named it ${pet.name}.`;
      break;
    }
    case 'driving': {
      const passed = chance(state, 0.45 + state.player.smarts / 200);
      if (passed) { state.player.hasLicence = true; text = 'You passed your driving test and got your licence!'; changeStat(state, 'happiness', 4, 'driving licence'); }
      else { text = 'You failed the driving test. You can try again next year.'; changeStat(state, 'happiness', -2, 'failed driving test'); }
      addJournal(state, text, passed ? 'milestone' : 'negative');
      return { ok: true, title: passed ? 'Licensed!' : 'Not This Time', text };
    }
    default: break;
  }
  addJournal(state, text);
  return { ok: true, title: activity.name, text };
}

export function pocketMoney(state) {
  // Children receive a little money over the year from family and odd jobs.
  const age = state.player.age;
  if (age >= 5 && age < 18) changeMoney(state, between(state, 10, 30) + (age >= 13 ? between(state, 40, 120) : 0), 'pocket money');
}
