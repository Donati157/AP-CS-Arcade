// Activities: the top-level list mirrors a dense mobile life sim (favorites, then everything in
// alphabetical order). A row either opens a submenu of actions or performs one action directly.
// Every action costs one of the year's actions; repeating one in the same year pays less.
import { chance, between, pick } from './rng.js';
import { changeStat, changeMoney, applyEffects, diminished } from './stats.js';
import { addJournal, info, pushModal } from './journal.js';
import * as People from './people.js';
import { ownsKind } from './assets.js';
import { PLACES } from './life-generator.js';

export const ACTIONS_PER_YEAR = 6;
export const ACTIVITY_MIN_AGE = 3;

function item(id, name, sub, minAge, effects, text, extra = {}) {
  return { id, name, sub, minAge, maxAge: 999, cost: 0, effects, text, ...extra };
}

// ---- Submenus --------------------------------------------------------------------------------------------------

export const SUBMENUS = {
  mindBody: { name: 'Mind & Body', sub: 'Work on self-improvement', icon: 'figure', items: [
    item('readBook', 'Book', 'Read a good book', 5, { smarts: 3, happiness: 1 }, 'You read a book from cover to cover.', { icon: 'book' }),
    item('diet', 'Diet', 'Eat better', 14, { health: 3, looks: 1, happiness: -1 }, 'You stuck to a healthier diet this year.', { icon: 'leaf' }),
    item('garden', 'Garden', 'Grow something', 8, { happiness: 2, health: 1 }, 'You tended a small garden and grew more herbs than you could use.', { icon: 'seedling' }),
    item('gym', 'Gym', 'Build strength', 14, { health: 4, looks: 2, happiness: 1 }, 'You kept up a steady gym routine.', { icon: 'figure', cost: 40 }),
    item('instrument', 'Instrument', 'Practice (needs an instrument)', 6, { happiness: 3, smarts: 1 }, 'You practiced your instrument until the neighbors clapped.', { icon: 'music', requires: 'instrument' }),
    item('library', 'Library', 'Study in peace', 6, { smarts: 2 }, 'You spent the afternoon studying at the library.', { icon: 'book' }),
    item('martialArts', 'Martial Arts', 'Discipline and balance', 8, { health: 3, happiness: 2 }, 'You practiced martial arts and earned a new belt stripe.', { icon: 'figure', cost: 60 }),
    item('meditate', 'Meditate', 'Calm your thoughts', 10, { happiness: 4, health: 1 }, 'You took quiet time to meditate.', { icon: 'sun' }),
    item('memory', 'Memory', 'Sharpen your mind', 6, { smarts: 2, happiness: 1 }, 'You played memory games and beat your record.', { icon: 'bulb' }),
    item('sports', 'Sports', 'Train with a team', 7, { health: 3, happiness: 2 }, 'You trained hard with your sports team.', { icon: 'ball', cost: 30 }),
    item('walk', 'Walk', 'Fresh air', 5, { health: 2, happiness: 2 }, 'You went for a long walk around the neighborhood.', { icon: 'footprints' }),
  ] },
  doctor: { name: 'Doctor', sub: 'Visit the doctor', icon: 'cross', items: [
    item('checkup', 'Checkup', 'Cedar Grove Clinic', 5, { health: 3 }, 'You went to the doctor for a checkup.', { icon: 'cross', cost: 50 }),
    item('dentist', 'Dentist', 'Keep that smile', 5, { health: 1, looks: 1 }, 'You visited the dentist. No cavities!', { icon: 'cross', cost: 80 }),
    item('eyeExam', 'Eye Exam', 'See clearly', 6, { health: 1, smarts: 1 }, 'You had your eyes checked.', { icon: 'eye', cost: 60 }),
    item('counselor', 'Counselor', 'Someone to listen', 12, { happiness: 5 }, 'You talked things through with a counselor.', { icon: 'chat', cost: 90 }),
    item('vaccines', 'Vaccinations', 'Stay protected', 5, { health: 2 }, 'You got your vaccinations up to date.', { icon: 'cross', cost: 30 }),
  ] },
  love: { name: 'Love', sub: 'Find someone to love', icon: 'heart', items: [
    item('goOnDate', 'Date', 'Find a date', 18, { happiness: 2 }, 'You went on a date.', { icon: 'heart', cost: 40, special: 'date' }),
    item('datingApp', 'Dating App', 'Better odds, more swiping', 18, { happiness: 1 }, 'You spent a while on a dating app.', { icon: 'chat', cost: 20, special: 'dateApp' }),
  ] },
  pets: { name: 'Pets', sub: 'Get a pet', icon: 'paw', items: Object.entries(People.PET_SPECIES).map(([species, def]) =>
    item(`adopt_${species}`, `Adopt a ${def.label}`, `$${def.cost} · lives about ${def.lifespan} years`, species === 'fish' || species === 'hamster' ? 6 : 8,
      { happiness: 4 }, '', { icon: 'paw', cost: def.cost, special: 'adopt', species })) },
  salon: { name: 'Salon & Spa', sub: 'Take time for yourself', icon: 'sparkle', items: [
    item('haircut', 'Hair Stylist', 'A fresh cut', 8, { looks: 2, happiness: 1 }, 'You got a fresh haircut and felt like a new person.', { icon: 'sparkle', cost: 30 }),
    item('hairColor', 'Dye Job', 'Try a new color', 14, { looks: 2 }, 'You dyed your hair a color your family had opinions about.', { icon: 'palette', cost: 60 }),
    item('massage', 'Massage', 'Unwind', 16, { health: 2, happiness: 3 }, 'You had a massage and felt the tension melt away.', { icon: 'sun', cost: 80 }),
    item('nails', 'Nail Salon', 'Get your nails done', 12, { looks: 1, happiness: 1 }, 'You got your nails done.', { icon: 'sparkle', cost: 40 }),
    item('spaDay', 'Spa Day', 'The full treatment', 18, { happiness: 4, health: 1, looks: 1 }, 'You spent a whole day at the spa.', { icon: 'sun', cost: 150 }),
  ] },
  licences: { name: 'Licenses', sub: 'Manage your licenses', icon: 'car', items: [
    item('drivingTest', 'Driving Test', 'Get your license', 16, {}, '', { icon: 'car', cost: 40, special: 'driving' }),
  ] },
  leisure: { name: 'Movie Theater', sub: 'Go to the movies', icon: 'film', items: [
    item('movieAction', 'Action Movie', 'Explosions and car chases', 6, { happiness: 3 }, 'You watched an action movie and jumped at every explosion.', { icon: 'film', cost: 15 }),
    item('movieComedy', 'Comedy', 'A good laugh', 6, { happiness: 3 }, 'You laughed through a comedy at the theater.', { icon: 'film', cost: 15 }),
    item('movieDrama', 'Drama', 'Something moving', 10, { happiness: 2, smarts: 1 }, 'You watched a drama that stayed with you for days.', { icon: 'film', cost: 15 }),
    item('movieDocumentary', 'Documentary', 'Learn something', 8, { smarts: 2, happiness: 1 }, 'You watched a documentary and learned a lot.', { icon: 'film', cost: 15 }),
  ] },
  identity: { name: 'Identity', sub: 'Define your identity', icon: 'person', items: [
    item('nameChange', 'Name Change', 'Choose a new name', 18, {}, '', { icon: 'person', cost: 120, special: 'nameForm' }),
  ] },
};

// ---- The top-level Activities list (favorites first, then everything alphabetically) ----------------------------

export const FAVORITES = ['love', 'mindBody', 'pets', 'salon'];

export const ACTIVITY_MENU = [
  { id: 'adoption', name: 'Adoption', sub: 'Adopt a child', icon: 'baby', action: item('adoptChild', 'Adoption', 'Adopt a child', 25, { happiness: 6 }, '', { cost: 500, special: 'adoptChild' }) },
  { id: 'clubs', name: 'Clubs', sub: 'Join a club and meet people', icon: 'people', action: item('joinClub', 'Join a Club', 'Meet new people', 10, { happiness: 2 }, '', { special: 'newFriend', maxAge: 40 }) },
  { id: 'doctor', name: 'Doctor', sub: 'Visit the doctor', icon: 'cross', menu: 'doctor' },
  { id: 'emigrate', name: 'Emigrate', sub: 'Move to another country', icon: 'plane', action: item('emigrate', 'Emigrate', 'Move abroad', 18, { happiness: 3 }, '', { cost: 800, special: 'emigrate' }) },
  { id: 'friends', name: 'Hang Out', sub: 'Spend a weekend with friends', icon: 'people', action: item('hangOut', 'Hang Out with Friends', 'Needs friends', 6, { happiness: 4 }, 'You hung out with your friends all weekend.', { special: 'friends' }) },
  { id: 'identity', name: 'Identity', sub: 'Define your identity', icon: 'person', menu: 'identity' },
  { id: 'licences', name: 'Licenses', sub: 'Manage your licenses', icon: 'car', menu: 'licences' },
  { id: 'loan', name: 'Loan', sub: 'Borrow money', icon: 'dollar', action: item('loan', 'Loan', 'Borrow $5,000', 18, {}, '', { special: 'loan' }) },
  { id: 'love', name: 'Love', sub: 'Find someone to love', icon: 'heart', menu: 'love' },
  { id: 'mindBody', name: 'Mind & Body', sub: 'Work on self-improvement', icon: 'figure', menu: 'mindBody' },
  { id: 'movies', name: 'Movie Theater', sub: 'Go to the movies', icon: 'film', menu: 'leisure' },
  { id: 'pets', name: 'Pets', sub: 'Get a pet', icon: 'paw', screen: 'pets' },
  { id: 'playOutside', name: 'Play Outside', sub: 'Run around until dark', icon: 'sun', action: item('playOutside', 'Play Outside', 'Run around', 3, { happiness: 3, health: 2 }, 'You played outside until it got dark.', { maxAge: 12 }) },
  { id: 'salon', name: 'Salon & Spa', sub: 'Take time for yourself', icon: 'sparkle', menu: 'salon' },
  { id: 'shopping', name: 'Shopping', sub: 'Buy something', icon: 'bag', screen: 'shopping' },
  { id: 'vacation', name: 'Vacation', sub: 'A week away', icon: 'plane', action: item('vacation', 'Vacation', 'A week away', 18, { happiness: 8, health: 2 }, 'You took a week-long vacation.', { cost: 1200 }) },
  { id: 'videoGames', name: 'Video Games', sub: 'One more level', icon: 'game', action: item('videoGames', 'Video Games', 'One more level', 6, { happiness: 3, health: -1 }, 'You spent a rainy weekend playing video games.') },
  { id: 'volunteer', name: 'Volunteer', sub: 'Help your community', icon: 'heart', action: item('volunteer', 'Volunteer', 'Help your community', 13, { happiness: 3, smarts: 1 }, 'You volunteered on weekends.') },
  { id: 'will', name: 'Will & Testament', sub: 'Put your affairs in order', icon: 'list', action: item('will', 'Will & Testament', 'Write your will', 40, { happiness: 2 }, 'You wrote your will and felt a weight lift.', { cost: 200, special: 'will' }) },
  { id: 'zoo', name: 'Zoo Trip', sub: 'Meet the animals', icon: 'paw', action: item('zoo', 'Zoo Trip', 'Meet the animals', 3, { happiness: 3, smarts: 1 }, 'You spent a day at the zoo.', { cost: 30 }) },
];

// Every action, wherever it lives.
const ALL = new Map();
for (const menu of Object.values(SUBMENUS)) for (const i of menu.items) ALL.set(i.id, i);
for (const row of ACTIVITY_MENU) if (row.action) ALL.set(row.action.id, row.action);
// Older ids kept for saved games and tests.
ALL.set('familyDinner', item('familyDinner', 'Family Dinner', 'Everyone at the table', 3, { happiness: 2 }, 'You had a long family dinner full of stories.', { special: 'family' }));
ALL.set('concert', item('concert', 'Concert', 'Live music', 15, { happiness: 5 }, 'You went to a concert and sang along to every song.', { cost: 80 }));
ALL.set('selfCare', ALL.get('haircut'));
ALL.set('movies', ALL.get('movieComedy'));
ALL.set('hobbyCraft', item('hobbyCraft', 'Arts & Crafts', 'Make something', 4, { happiness: 2, smarts: 1 }, 'You made something with your own hands.'));

export const CATEGORIES = Object.entries(SUBMENUS).map(([id, m]) => ({ id, ...m }));

export function findActivity(id) {
  return ALL.get(id) || null;
}

// Why an activity row is greyed out, or null when it can be done.
export function unavailableReason(state, activity) {
  const age = state.player.age;
  if (age < activity.minAge) return `Age ${activity.minAge}+`;
  if (age > activity.maxAge) return 'Too old for this now';
  if (activity.requires === 'instrument' && !ownsKind(state, 'instrument')) return 'Buy an instrument first';
  if (activity.special === 'friends' && People.friends(state).length === 0) return 'Make a friend first';
  if ((activity.special === 'date' || activity.special === 'dateApp') && People.partner(state)) return 'You are already with someone';
  if (activity.special === 'driving' && state.player.hasLicence) return 'You already have a license';
  if (activity.special === 'adopt' && People.pets(state).length >= 3) return 'Three pets is plenty';
  if (activity.special === 'adoptChild' && People.children(state).length >= 3) return 'Your family is complete';
  if (activity.special === 'loan' && state.player.money < -20000) return 'You already owe too much';
  if (activity.special === 'will' && state.flags.will) return 'Your will is already written';
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
  if (done >= 2 && text) text += ' It felt routine by now.';

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
      if (friend) info(state, 'New Friend', `You and ${friend.name} hit it off at the club and became friends.`, { band: 'Friends', tone: 'blue', person: friend.id, facts: [['Name', friend.name], ['Age', String(friend.age)]] });
      break;
    }
    case 'date':
    case 'dateApp': {
      if (chance(state, activity.special === 'dateApp' ? 0.7 : 0.55)) {
        const love = People.startDating(state);
        text = `You went on a date with ${love.name}, and it went well. You are now a couple.`;
        changeStat(state, 'happiness', 4, 'new relationship');
        info(state, 'Love Interest', `${love.name} wants to keep seeing you. You are officially a couple.`, { band: 'Love', tone: 'blue', person: love.id, facts: [['Name', love.name], ['Age', String(love.age)], ['Occupation', love.occupation || 'student']] });
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
    case 'adoptChild': {
      const child = People.haveChild(state);
      child.age = between(state, 0, 4);
      text = `You adopted a ${child.age === 0 ? 'baby' : `${child.age}-year-old`} ${child.gender === 'female' ? 'girl' : 'boy'} named ${People.firstName(child)}.`;
      info(state, 'Adoption', text, { band: 'Family', tone: 'green', person: child.id, facts: [['Name', child.name], ['Age', String(child.age)]] });
      addJournal(state, text, 'milestone');
      return { ok: true, title: 'Adoption', text };
    }
    case 'emigrate': {
      const current = state.player.residence;
      const choices = PLACES.filter((p) => `${p.city}, ${p.country}` !== current);
      const place = pick(state, choices);
      state.player.residence = `${place.city}, ${place.country}`;
      state.player.livesWithParents = false;
      for (const r of People.alive(state)) if (r.role !== 'pet' && !People.PARTNER_ROLES.includes(r.role) && !People.CHILD_ROLES.includes(r.role)) People.changeCloseness(r, -6);
      text = `You emigrated to ${place.city}, ${place.country}, and started over in a new city.`;
      addJournal(state, text, 'milestone');
      return { ok: true, title: 'A Fresh Start', text };
    }
    case 'loan': {
      changeMoney(state, 5000, 'bank loan', true);
      state.flags.loans = (state.flags.loans || 0) + 1;
      text = 'The bank lent you $5,000. Interest starts next year.';
      break;
    }
    case 'will': {
      state.flags.will = true;
      break;
    }
    case 'driving': {
      // The examiner opens with a road-sign question (same mini-game as the teen event).
      pushModal(state, { kind: 'minigame', game: 'drivingQuiz', eventId: 'drivingTestActivity', band: 'License', title: 'Driving Test',
        text: 'The examiner starts with a road-sign question before the road test.' });
      return { ok: true, title: 'Driving Test', text: 'Your test is starting.', silent: true };
    }
    default: break;
  }
  if (text) addJournal(state, text);
  return { ok: true, title: activity.name, text };
}

export function pocketMoney(state) {
  // Children receive a little money over the year from family and odd jobs.
  const age = state.player.age;
  if (age >= 5 && age < 18) changeMoney(state, between(state, 10, 30) + (age >= 13 ? between(state, 40, 120) : 0), 'pocket money');
}
