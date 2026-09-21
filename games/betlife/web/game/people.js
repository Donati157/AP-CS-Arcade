// Everyone in the player's life: family, friends, partners, children, coworkers and pets.
// People have state of their own (age, closeness, occupation, alive) and it changes every year.
import { between, chance, pick } from './rng.js';
import { changeStat, changeMoney, diminished } from './stats.js';
import { addJournal, info } from './journal.js';
import { uniqueName, randomGender, PARENT_JOBS, PET_NAMES, withArticle } from './life-generator.js';
import { relativeDies } from './mortality.js';

export const ROLE_LABELS = {
  mother: 'Mother', father: 'Father', stepmother: 'Stepmother', stepfather: 'Stepfather', sister: 'Sister', brother: 'Brother', friend: 'Friend', bestFriend: 'Best Friend',
  partner: 'Partner', fiance: 'Fiancé(e)', spouse: 'Spouse', son: 'Son', daughter: 'Daughter', coworker: 'Coworker', pet: 'Pet', enemy: 'Enemy',
};
export const FAMILY_ROLES = ['mother', 'father', 'stepmother', 'stepfather', 'sister', 'brother'];
export const PARTNER_ROLES = ['partner', 'fiance', 'spouse'];
export const CHILD_ROLES = ['son', 'daughter'];
export const PET_SPECIES = {
  dog: { label: 'Dog', lifespan: 13, cost: 350 }, cat: { label: 'Cat', lifespan: 15, cost: 200 },
  rabbit: { label: 'Rabbit', lifespan: 9, cost: 80 }, hamster: { label: 'Hamster', lifespan: 3, cost: 30 }, fish: { label: 'Goldfish', lifespan: 5, cost: 15 },
};
export const MAX_FRIENDS = 6;

function person(state, fields) {
  const id = `p${state.nextPersonId++}`;
  const traits = { looks: between(state, 20, 95), smarts: between(state, 20, 95), kindness: between(state, 20, 95), craziness: between(state, 5, 90), popularity: between(state, 10, 95) };
  return { id, closeness: 50, alive: true, interactedThisYear: false, occupation: '', since: state.player.age, traits, ...fields };
}

// ---- Creating people --------------------------------------------------------------------

export function createParent(state, parentProfile, role) {
  return person(state, { name: parentProfile.name, gender: role === 'mother' ? 'female' : 'male', role, age: parentProfile.age,
    occupation: parentProfile.job, closeness: between(state, 80, 95), retired: false });
}

export function createSibling(state, gender, age) {
  return person(state, { name: uniqueName(state, gender, state.player.lastName), gender, role: gender === 'female' ? 'sister' : 'brother',
    age, closeness: between(state, 60, 85), occupation: age < 5 ? '' : age < 18 ? 'student' : pick(state, PARENT_JOBS) });
}

const ACTIVITIES = ['Track Team', 'Chess Club', 'Drama Club', 'Robotics', 'Swim Team', 'School Band', 'Art Club', 'Debate Team', 'Soccer', 'Yearbook'];
const CLIQUES = ['Jocks', 'Brains', 'Artists', 'Gamers', 'Skaters', 'Theater Kids', 'Band Kids', 'Floaters'];
export function createFriend(state, options = {}) {
  const gender = options.gender || randomGender(state);
  const age = options.age ?? state.player.age + between(state, -2, 2);
  return person(state, { name: uniqueName(state, gender), gender, role: options.role || 'friend', age: Math.max(0, age),
    closeness: between(state, 45, 65), occupation: options.occupation || occupationForAge(state, age), activity: pick(state, ACTIVITIES), clique: pick(state, CLIQUES) });
}
export const latePets = (state) => state.relationships.filter((r) => r.role === 'pet' && !r.alive && r.diedAt !== undefined);
export function makeEnemy(state, options = {}) {
  const enemy = createFriend(state, options);
  enemy.role = 'enemy'; enemy.closeness = between(state, 5, 20);
  state.relationships.push(enemy);
  return enemy;
}

export function createPartner(state) {
  const gender = state.player.gender === 'female' ? 'male' : 'female';
  const age = Math.max(18, state.player.age + between(state, -3, 3));
  return person(state, { name: uniqueName(state, gender), gender, role: 'partner', age, closeness: between(state, 55, 75),
    occupation: occupationForAge(state, age), yearsTogether: 0 });
}

export function createChild(state, spouse) {
  const gender = randomGender(state);
  return person(state, { name: uniqueName(state, gender, state.player.lastName), gender, role: gender === 'female' ? 'daughter' : 'son',
    age: 0, closeness: between(state, 85, 98), occupation: '' });
}

export function createPet(state, species, name) {
  return person(state, { name: name || pick(state, PET_NAMES), gender: randomGender(state), role: 'pet', species, age: 0,
    closeness: between(state, 60, 80), occupation: PET_SPECIES[species].label });
}

function occupationForAge(state, age) {
  if (age < 5) return '';
  if (age < 18) return 'student';
  if (age >= 66) return 'retired';
  return pick(state, PARENT_JOBS);
}

// ---- Looking people up ------------------------------------------------------------------

export const alive = (state) => state.relationships.filter((r) => r.alive);
export const byRole = (state, ...roles) => alive(state).filter((r) => roles.includes(r.role));
export const parents = (state) => byRole(state, 'mother', 'father', 'stepmother', 'stepfather');
export const bloodParents = (state) => byRole(state, 'mother', 'father');
export const siblings = (state) => byRole(state, 'sister', 'brother');
export const friends = (state) => byRole(state, 'friend', 'bestFriend', 'coworker');
export const children = (state) => byRole(state, 'son', 'daughter');
export const pets = (state) => byRole(state, 'pet');
export const partner = (state) => byRole(state, ...PARTNER_ROLES)[0] || null;
export const findPerson = (state, id) => state.relationships.find((r) => r.id === id) || null;
export const firstName = (p) => p.name.split(' ')[0];
export const isFamily = (p) => FAMILY_ROLES.includes(p.role);
export const roleLabel = (p) => (p.role === 'pet' ? PET_SPECIES[p.species].label : ROLE_LABELS[p.role]);

export function changeCloseness(person, amount) {
  person.closeness = Math.max(0, Math.min(100, person.closeness + amount));
}

// Sections for the Relationships screen, in the order the screen shows them.
export function relationshipSections(state) {
  const groups = [
    ['Love', byRole(state, ...PARTNER_ROLES)], ['Parents', parents(state)], ['Siblings', siblings(state)],
    ['Children', children(state)], ['Friends', byRole(state, 'bestFriend', 'friend')], ['Coworkers', byRole(state, 'coworker')], ['Pets', pets(state)],
    ['Enemies', byRole(state, 'enemy')], ['Late Pets', latePets(state)],
  ];
  return groups.filter(([, people]) => people.length > 0);
}

// ---- Adding people through play --------------------------------------------------------

export function addFriend(state, options = {}) {
  if (friends(state).length >= MAX_FRIENDS) return null;
  const friend = createFriend(state, options);
  state.relationships.push(friend);
  return friend;
}

export function startDating(state) {
  if (partner(state)) return null;
  const p = createPartner(state);
  state.relationships.push(p);
  return p;
}

export function haveChild(state) {
  const child = createChild(state);
  state.relationships.push(child);
  return child;
}

export function adoptPet(state, species, name, breed = null, age = 0) {
  const pet = createPet(state, species, name);
  if (breed) pet.breed = breed;
  pet.age = age;
  state.relationships.push(pet);
  return pet;
}

// A parent remarries: a step-parent joins the family.
export function addStepParent(state, forRole) {
  const role = forRole === 'mother' ? 'stepfather' : 'stepmother';
  const gender = role === 'stepmother' ? 'female' : 'male';
  const p = person(state, { name: uniqueName(state, gender), gender, role, age: between(state, 30, 50) + Math.max(0, state.player.age - 5), closeness: between(state, 25, 45), occupation: pick(state, PARENT_JOBS), retired: false });
  state.relationships.push(p);
  return p;
}

// ---- A year passes for everyone -----------------------------------------------------------

export function ageRelationships(state) {
  for (const p of state.relationships) {
    if (!p.alive) continue;
    p.age += 1;
    if (p.yearsTogether !== undefined) p.yearsTogether += 1;
    // Closeness fades when the year passed without contact; family fades slowest.
    if (!p.interactedThisYear) {
      const decay = isFamily(p) || CHILD_ROLES.includes(p.role) ? -2 : PARTNER_ROLES.includes(p.role) ? -3 : p.role === 'pet' ? -3 : -4;
      changeCloseness(p, decay);
    } else {
      changeCloseness(p, 1);
    }
    p.interactedThisYear = false;
    p.yearActions = {};
    otherPeopleMoveOn(state, p);
    if (p.role === 'pet') petLifeCycle(state, p);
    else if (isFamily(p) || p.role === 'spouse') relativeLifeCycle(state, p);
  }
  // Friends who drift too far simply lose touch; the journal says so once.
  for (const f of friends(state)) {
    if (f.closeness <= 8 && f.role !== 'bestFriend') {
      f.alive = false;
      addJournal(state, `You and ${firstName(f)} lost touch.`);
    }
  }
  // A partner who feels ignored may leave.
  const love = partner(state);
  if (love && love.closeness <= 10 && chance(state, 0.5)) {
    love.alive = false;
    addJournal(state, `${firstName(love)} ended the relationship. You had grown apart.`, 'negative');
    changeStat(state, 'happiness', -14, `${firstName(love)} left`);
  }
}

// Milestones in other people's lives, so the world moves even when the player does nothing.
function otherPeopleMoveOn(state, p) {
  const name = firstName(p);
  if (['mother', 'father', 'stepmother', 'stepfather'].includes(p.role)) {
    if (!p.retired && p.age >= 65 && chance(state, 0.45)) {
      p.retired = true;
      addJournal(state, `Your ${p.role} retired after many years as ${withArticle(p.occupation)}.`);
      p.occupation = 'retired';
    }
  } else if (['sister', 'brother', 'son', 'daughter'].includes(p.role)) {
    if (p.age === 5) { p.occupation = 'student'; addJournal(state, `${name} started school.`); }
    if (p.age === 18) { addJournal(state, `${name} graduated from high school.`, 'positive'); }
    if (p.age === 22) { p.occupation = pick(state, PARENT_JOBS); addJournal(state, `${name} found work as ${withArticle(p.occupation)}.`); }
    if (p.age === 24 && CHILD_ROLES.includes(p.role)) addJournal(state, `${name} moved into a place of ${p.gender === 'female' ? 'her' : 'his'} own.`);
  } else if (['friend', 'bestFriend', 'partner', 'fiance', 'spouse', 'coworker'].includes(p.role)) {
    if (p.age === 22 && p.occupation === 'student') { p.occupation = pick(state, PARENT_JOBS); addJournal(state, `${name} started working as ${withArticle(p.occupation)}.`); }
    else if (p.age >= 24 && p.age < 60 && p.occupation && p.occupation !== 'student' && chance(state, 0.06)) addJournal(state, `${name} was promoted at work.`);
    else if (p.age >= 65 && p.occupation !== 'retired' && chance(state, 0.4)) { p.occupation = 'retired'; addJournal(state, `${name} retired.`); }
  }
}

function petLifeCycle(state, pet) {
  const lifespan = PET_SPECIES[pet.species].lifespan;
  if (pet.age >= lifespan - 2 && chance(state, pet.age >= lifespan + 2 ? 0.6 : 0.25)) {
    pet.alive = false; pet.diedAt = state.player.age;
    addJournal(state, `Your ${PET_SPECIES[pet.species].label.toLowerCase()} ${pet.name} passed away peacefully at ${pet.age}.`, 'negative');
    changeStat(state, 'happiness', -8, `${pet.name} passed away`);
  }
}

function relativeLifeCycle(state, p) {
  if (p.age < 55 || !relativeDies(state, p.age)) return;
  p.alive = false;
  const name = firstName(p);
  const label = ROLE_LABELS[p.role].toLowerCase();
  addJournal(state, `Your ${label}, ${name}, passed away at the age of ${p.age}. You miss ${p.gender === 'female' ? 'her' : 'him'} very much.`, 'negative');
  changeStat(state, 'happiness', -15, `${name} passed away`);
  if (p.role === 'mother' || p.role === 'father') {
    for (const step of byRole(state, p.role === 'mother' ? 'stepfather' : 'stepmother')) { /* the step-parent stays in the family */ void step; }
    const inheritance = between(state, 40, 600) * 100;
    changeMoney(state, inheritance, 'inheritance');
    addJournal(state, `You inherited $${inheritance.toLocaleString('en-US')} from your ${label}.`);
    info(state, 'In Memory', `Your ${label}, ${name}, passed away at ${p.age}. The family gathered to remember ${p.gender === 'female' ? 'her' : 'him'}, and you received an inheritance of $${inheritance.toLocaleString('en-US')}.`, { band: 'Family', tone: 'green', person: p.id });
  } else {
    info(state, 'In Memory', `Your ${label}, ${name}, passed away at ${p.age}.`, { band: 'Family', tone: 'green', person: p.id });
  }
}

// ---- Interactions (called by the screens; each costs one action, checked by the caller) --------

// Milestones happen once by their nature, so they always land at full strength.
const MILESTONE_ACTIONS = ['propose', 'marry', 'startFamily', 'breakUp', 'unfriend', 'makePeace', 'allowance'];

// How many times this exact action was already used on this person this year.
export const repeatsThisYear = (p, action) => (p.yearActions && p.yearActions[action]) || 0;

export function interact(state, p, action) {
  const you = state.player;
  const name = firstName(p);
  p.interactedThisYear = true;
  // Repeating the same thing with the same person in one year gives steadily less back,
  // so exploring the menu stays free while stat farming does not pay.
  if (!p.yearActions) p.yearActions = {};
  const repeats = MILESTONE_ACTIONS.includes(action) ? 0 : repeatsThisYear(p, action);
  p.yearActions[action] = repeatsThisYear(p, action) + 1;
  const fade = (amount) => (amount > 0 ? diminished(amount, repeats) : amount);
  const closer = (amount) => changeCloseness(p, fade(amount));
  const feel = (stat, amount, why) => changeStat(state, stat, fade(amount), why);
  switch (action) {
    case 'spendTime':
      closer(6); feel('happiness', 3, `time with ${name}`);
      return `You spent quality time with ${name}.`;
    case 'conversation': {
      const good = chance(state, 0.8);
      closer(good ? 4 : -2); feel('happiness', good ? 1 : -1, `conversation with ${name}`);
      return good ? `You and ${name} had a long, easy conversation.` : `Your conversation with ${name} ended awkwardly.`;
    }
    case 'compliment':
      closer(3); feel('happiness', 1, `complimented ${name}`);
      return `${name} was touched by your compliment.`;
    case 'gift': {
      const cost = you.age < 13 ? 10 : 60;
      if (you.money < cost) return null;
      changeMoney(state, -cost, `gift for ${name}`); closer(7); feel('happiness', 2, `gift for ${name}`);
      return `You gave ${name} a thoughtful gift.`;
    }
    case 'advice':
      closer(2); feel('smarts', 1, `advice from ${name}`); feel('happiness', 1, `advice from ${name}`);
      return `You asked ${name} for advice and came away wiser.`;
    case 'argue':
      closer(-9); feel('happiness', -4, `argued with ${name}`);
      return `You and ${name} had a heated argument.`;
    case 'allowance': {
      if (p.closeness < 40 || !chance(state, 0.6)) { closer(-1); return `${name} said not this time.`; }
      const amount = you.age < 10 ? between(state, 5, 20) : between(state, 20, 80);
      changeMoney(state, amount, `allowance from ${name}`);
      return `${name} gave you $${amount} of pocket money.`;
    }
    case 'homework':
      closer(5); feel('happiness', 2, `helped ${name}`);
      return `You helped ${name} with homework.`;
    case 'playPet':
      closer(6); feel('happiness', 3, `played with ${p.name}`);
      return `You played with ${p.name} until you were both worn out.`;
    case 'walkPet':
      closer(4); feel('happiness', 2, `walked ${p.name}`); feel('health', 2, `walked ${p.name}`);
      return `You took ${p.name} for a long walk.`;
    case 'treatPet': {
      if (you.money < 10) return null;
      changeMoney(state, -10, `treat for ${p.name}`); closer(5);
      return `${p.name} devoured the treat you bought.`;
    }
    case 'movie': {
      const cost = 30;
      if (you.money < cost) return null;
      changeMoney(state, -cost, `movies with ${name}`); closer(5); feel('happiness', 3, `movies with ${name}`);
      return `You and ${name} went to the movies and argued about the ending all the way home.`;
    }
    case 'concert': {
      if (you.money < 80) return null;
      changeMoney(state, -80, `concert with ${name}`); closer(6); feel('happiness', 4, `concert with ${name}`);
      return `You and ${name} went to a concert and sang until you were hoarse.`;
    }
    case 'play':
      closer(6); feel('happiness', 3, `played with ${name}`);
      return `You spent the afternoon playing with ${name}.`;
    case 'doctorVisit': {
      if (you.money < 60) return null;
      changeMoney(state, -60, `checkup for ${name}`); closer(4); feel('happiness', 1, `cared for ${name}`);
      return `You took ${name} to the doctor for a checkup and waited with a magazine.`;
    }
    case 'anniversary': {
      if (you.money < 120) return null;
      changeMoney(state, -120, 'anniversary'); closer(8); feel('happiness', 4, 'anniversary');
      return `You and ${name} celebrated ${p.yearsTogether} years together.`;
    }
    case 'propose': {
      if (p.closeness < 55 || p.yearsTogether < 1) { closer(-6); feel('happiness', -6, 'proposal declined'); return `${name} said it was too soon. The evening was awkward.`; }
      p.role = 'fiance'; closer(8); feel('happiness', 8, 'engaged');
      return `You proposed to ${name}, and ${name} said yes. You are engaged!`;
    }
    case 'startFamily': {
      if (children(state).length >= 4) return null;
      if (!chance(state, 0.6)) { closer(2); return `You and ${name} talked about starting a family and decided to keep trying.`; }
      const baby = haveChild(state);
      closer(8); feel('happiness', 8, 'new baby');
      return `You and ${name} welcomed a baby ${baby.gender === 'female' ? 'girl' : 'boy'} named ${firstName(baby)} into the world.`;
    }
    case 'marry': {
      if (you.money < 500) return null;
      changeMoney(state, -500, 'wedding'); p.role = 'spouse'; closer(8); feel('happiness', 10, 'married');
      return `You and ${name} got married in a small, joyful ceremony.`;
    }
    case 'breakUp':
      p.alive = false; feel('happiness', -10, `broke up with ${name}`);
      return `You ended things with ${name}.`;
    case 'unfriend':
      p.alive = false; feel('happiness', -2, `unfriended ${name}`);
      return `You decided to stop spending time with ${name}.`;
    case 'deepTalk': {
      const open = chance(state, 0.75);
      closer(open ? 8 : -3); feel('happiness', open ? 4 : -2, `heart to heart with ${name}`);
      return open ? `You and ${name} talked about the things you never say out loud.`
        : `You tried to open up to ${name}, and it did not land the way you hoped.`;
    }
    case 'walkTogether':
      closer(4); feel('happiness', 2, `walk with ${name}`); feel('health', 1, `walk with ${name}`);
      return `You and ${name} walked until you ran out of pavement.`;
    case 'mealOut': {
      if (you.money < 25) return null;
      changeMoney(state, -25, `meal with ${name}`); closer(5); feel('happiness', 3, `meal with ${name}`);
      return `You took ${name} out to eat and stayed until the place emptied.`;
    }
    case 'helpAround':
      closer(5); feel('happiness', 1, `helped ${name} at home`);
      return `You did the chores before ${name} could ask.`;
    case 'familyStory':
      closer(4); feel('smarts', 1, `stories from ${name}`); feel('happiness', 2, `stories from ${name}`);
      return `${name} told you about growing up, and you listened to all of it.`;
    case 'teamUp':
      closer(6); feel('happiness', 3, `teamed up with ${name}`);
      return `You and ${name} took on the afternoon as a team.`;
    case 'readStory':
      closer(6); feel('happiness', 3, `story with ${name}`);
      return `You read ${name} a story and did all the voices.`;
    case 'teachSkill':
      closer(5); feel('happiness', 2, `taught ${name}`); feel('smarts', 1, `taught ${name}`);
      return `You taught ${name} something you are good at.`;
    case 'studyTogether':
      closer(4); feel('smarts', 3, `studied with ${name}`);
      if (state.education) state.education.performance = Math.min(100, (state.education.performance || 0) + 2);
      return `You and ${name} revised together and actually got through it.`;
    case 'lunch':
      closer(4); feel('happiness', 2, `lunch with ${name}`);
      return `You and ${name} spent the whole lunch break complaining about work.`;
    case 'coverShift': {
      closer(8); feel('happiness', -2, `covered for ${name}`); feel('health', -1, `covered for ${name}`);
      if (state.career) state.career.performance = Math.min(100, (state.career.performance || 0) + 2);
      return `You covered ${name}'s shift. It was long, and ${name} noticed.`;
    }
    case 'checkIn':
      closer(6); feel('happiness', 1, `checked in on ${name}`);
      return `You checked in on ${name} out of the blue, and it meant something.`;
    case 'dateNight': {
      if (you.money < 45) return null;
      changeMoney(state, -45, `date night with ${name}`); closer(7); feel('happiness', 4, `date night with ${name}`);
      return `You and ${name} had an evening with no phones and no plans.`;
    }
    case 'bestFriend':
      if (p.closeness < 70) { closer(-2); return `You told ${name} how much the friendship means. It landed awkwardly.`; }
      p.role = 'bestFriend'; closer(6); feel('happiness', 6, `best friends with ${name}`);
      return `You and ${name} are best friends now, and both of you know it.`;
    case 'apologise': {
      const forgiven = chance(state, 0.5);
      closer(forgiven ? 12 : 2); feel('happiness', forgiven ? 3 : -1, `apologised to ${name}`);
      return forgiven ? `You apologised to ${name}, and the air cleared.` : `You apologised to ${name}. It was heard, but not accepted.`;
    }
    case 'trainPet': {
      const learned = chance(state, 0.6);
      closer(learned ? 6 : 2); feel('happiness', learned ? 3 : 1, `training ${p.name}`);
      return learned ? `${p.name} learned a new trick and will not stop doing it.` : `${p.name} watched you closely and learned nothing.`;
    }
    case 'vetVisit': {
      if (you.money < 70) return null;
      changeMoney(state, -70, `vet for ${p.name}`); closer(5); feel('happiness', 1, `cared for ${p.name}`);
      return `You took ${p.name} to the vet. Everything checked out.`;
    }
    case 'makePeace':
      if (chance(state, 0.5)) { p.role = 'friend'; p.closeness = 40; feel('happiness', 4, `made peace with ${name}`); return `You and ${name} buried the hatchet. It felt like a weight lifted.`; }
      closer(4); return `You offered ${name} an olive branch. ${name} was not ready yet.`;
    case 'confront':
      closer(-6); feel('happiness', 2, `confronted ${name}`);
      return `You told ${name} exactly what you thought. Neither of you backed down.`;
    case 'ignore':
      feel('happiness', 1, `ignored ${name}`);
      return `You ignored ${name} completely. It bothered ${p.gender === 'female' ? 'her' : 'him'} more than you.`;
    case 'release':
      p.alive = false; feel('happiness', -5, `rehomed ${p.name}`);
      return `You found ${p.name} a loving new home.`;
    case 'bathePet':
      closer(3); feel('happiness', 1, `bathed ${p.name}`);
      return `You gave ${p.name} a bath. Most of the water ended up on you.`;
    case 'askOut': {
      if (partner(state)) return `You are already with someone.`;
      const yes = p.closeness >= 45 && chance(state, 0.6);
      if (!yes) { closer(-5); feel('happiness', -3, `${name} said no`); return `You asked ${name} out. ${name} said it was better to stay friends.`; }
      p.role = 'partner'; p.yearsTogether = 0; closer(8); feel('happiness', 6, `started dating ${name}`);
      return `You asked ${name} out, and ${name} said yes. You are now a couple.`;
    }
    default:
      return null;
  }
}

// Which interactions a person offers at the player's current age.
// Every entry is [id, title, subtitle, group]. Groups order the person screen the way the
// reference does: a short social block first, then things you do together, then the rest.
export const ACTION_GROUPS = ['Social', 'Activities', 'Support', 'Relationship', 'Conflict'];

export function actionsFor(state, p) {
  const age = state.player.age;
  const money = state.player.money;
  const atSchool = state.education && state.education.stage === 'school';
  if (p.role === 'pet') {
    const list = [['playPet', 'Play', 'Spend time together', 'Activities'], ['bathePet', 'Bathe', 'Give them a bath', 'Support'],
      ['treatPet', 'Treat', '$10 · a special snack', 'Support']];
    if (p.species === 'dog') list.push(['walkPet', 'Walk', 'Good for you both', 'Activities']);
    if (age >= 8) list.push(['trainPet', 'Teach a Trick', 'Patience and snacks', 'Activities']);
    if (p.age >= 7 && age >= 10) list.push(['vetVisit', 'Vet', '$70 · a checkup', 'Support']);
    list.push(['release', 'Rehome', 'Find a new family', 'Conflict']);
    return list;
  }
  if (p.role === 'enemy') {
    const list = [['confront', 'Confront', 'Say what you think', 'Conflict'], ['ignore', 'Ignore', 'Rise above it', 'Conflict'],
      ['makePeace', 'Make Peace', `Bury the hatchet with ${p.gender === 'female' ? 'her' : 'him'}`, 'Relationship']];
    if (age >= 12) list.push(['apologise', 'Apologise', 'Own your part of it', 'Relationship']);
    return list;
  }

  const isParent = p.role === 'mother' || p.role === 'father';
  const isSibling = p.role === 'sister' || p.role === 'brother';
  const isStep = p.role === 'stepmother' || p.role === 'stepfather';
  const isChild = CHILD_ROLES.includes(p.role);
  const isPartner = PARTNER_ROLES.includes(p.role);
  const isFriendly = ['friend', 'bestFriend', 'coworker'].includes(p.role);
  const list = [['spendTime', 'Spend Time', 'Hang out together', 'Social']];

  // ---- Social: talking, small kindnesses. Available to nearly everyone. ----
  if (age >= 3) list.push(['conversation', 'Conversation', 'Talk about life', 'Social']);
  if (age >= 5) list.push(['compliment', 'Compliment', 'Say something kind', 'Social']);
  if (age >= 10) list.push(['advice', 'Ask for Advice', 'Learn from them', 'Social']);
  if (age >= 12 && p.closeness >= 45) list.push(['deepTalk', 'Heart to Heart', 'Say what you really think', 'Social']);

  // ---- Activities: things that cost time or money and need an age to make sense. ----
  if (age >= 6) list.push(['movie', 'Movie Theater', '$30 · go to the movies together', 'Activities']);
  if (age >= 14) list.push(['concert', 'Concert', '$80 · go to a concert together', 'Activities']);
  if (age >= 8) list.push(['gift', 'Gift', `$${age < 13 ? 10 : 60} · a small present`, 'Activities']);
  if (age >= 5 && p.age >= 5 && Math.abs(p.age - age) <= 12) list.push(['walkTogether', 'Go for a Walk', 'Fresh air and talking', 'Activities']);
  if (age >= 16 && money >= 25) list.push(['mealOut', 'Meal Out', '$25 · eat somewhere nice', 'Activities']);

  // ---- Support and family: shaped by who the person actually is. ----
  if ((isParent || isStep) && age >= 4 && age < 18) list.push(['allowance', 'Ask for Money', 'Pocket money', 'Support']);
  if ((isParent || isStep) && age >= 6) list.push(['helpAround', 'Help Out at Home', 'Chores without being asked', 'Support']);
  if (isParent && age >= 8) list.push(['familyStory', 'Ask About the Past', 'Hear how it used to be', 'Social']);
  if ((isParent || isStep) && age >= 25 && p.age >= 60) list.push(['doctorVisit', 'Doctor', '$60 · take them for a checkup', 'Support']);
  if (isSibling && age >= 5) list.push(['teamUp', 'Team Up', 'Take on the world together', 'Activities']);
  if (isChild && p.age < 12) list.push(['play', 'Play', 'Games and silliness', 'Activities']);
  if (isChild && p.age < 8) list.push(['readStory', 'Read a Story', 'Wind down together', 'Support']);
  if (isChild && p.age >= 6 && p.age < 18) list.push(['homework', 'Help with Homework', 'Be there for them', 'Support']);
  if (isChild && p.age >= 10) list.push(['teachSkill', 'Teach Them Something', 'Pass on what you know', 'Support']);
  // "Classmate" is a label the game shows on a friend request, not a role, so school friends of a
  // similar age are the ones you can revise with.
  if (atSchool && age >= 6 && ['friend', 'bestFriend'].includes(p.role) && Math.abs(p.age - age) <= 3) {
    list.push(['studyTogether', 'Study Together', 'Revise for the next test', 'Activities']);
  }
  if (p.role === 'coworker' && state.career && state.career.careerId !== null) {   // checked inline: importing career.js here would be circular
    list.push(['lunch', 'Lunch Break', 'Eat together and complain', 'Activities']);
    list.push(['coverShift', 'Cover Their Shift', 'Do them a favour', 'Support']);
  }
  if (isFriendly && p.closeness < 40 && age >= 10) list.push(['checkIn', 'Check In', 'See how they are doing', 'Support']);

  // ---- Relationship: status changes. ----
  if (isPartner) {
    list.push(['dateNight', 'Date Night', '$45 · an evening for two', 'Activities']);
    list.push(['anniversary', 'Celebrate Anniversary', '$120 · a night out', 'Relationship']);
    if (p.role === 'partner' && age >= 20) list.push(['propose', 'Propose', 'Ask the big question', 'Relationship']);
    if (p.role === 'fiance') list.push(['marry', 'Get Married', '$500 · plan the wedding', 'Relationship']);
    if (p.role === 'spouse' && age >= 20 && age <= 45 && children(state).length < 4) list.push(['startFamily', 'Start a Family', 'Try for a baby', 'Relationship']);
    list.push(['breakUp', 'Break Up', 'End the relationship', 'Conflict']);
  }
  if (isFriendly && age >= 16 && !partner(state) && Math.abs(p.age - age) <= 8 && p.age >= 16) list.push(['askOut', 'Ask Out', 'Ask them on a date', 'Relationship']);
  if (p.role === 'friend' && p.closeness >= 70 && !state.relationships.some((r) => r.alive && r.role === 'bestFriend')) {
    list.push(['bestFriend', 'Make Best Friends', 'Say what they mean to you', 'Relationship']);
  }

  // ---- Conflict: always last, never hidden. ----
  if (age >= 4) list.push(['argue', 'Argue', 'Start a fight', 'Conflict']);
  if (isFriendly) list.push(['unfriend', 'Drift Apart', 'Stop seeing them', 'Conflict']);
  return list;
}

// Groups the action list for the person screen, keeping ACTION_GROUPS order and dropping empties.
export function actionSections(state, p) {
  const all = actionsFor(state, p);
  return ACTION_GROUPS
    .map((group) => [group, all.filter((a) => (a[3] || 'Activities') === group)])
    .filter(([, rows]) => rows.length > 0);
}

// Called at the moment of birth to fill the first relationships.
export function createStartingFamily(state, profile) {
  state.relationships.push(createParent(state, profile.mother, 'mother'));
  state.relationships.push(createParent(state, profile.father, 'father'));
  if (profile.olderSibling) state.relationships.push(createSibling(state, profile.olderSibling.gender, profile.olderSibling.age));
  if (chance(state, 0.3)) {
    const pet = createPet(state, pick(state, ['cat', 'dog']));
    pet.age = between(state, 1, 5);
    state.relationships.push(pet);
  }
}

