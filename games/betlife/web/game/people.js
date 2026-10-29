// Everyone in the player's life: family, friends, partners, children, coworkers and pets.
// People have state of their own (age, closeness, occupation, alive) and it changes every year.
import { between, chance, pick } from './rng.js';
import { changeStat, changeMoney, diminished } from './stats.js';
import { t, tg, dinheiro } from './i18n/index.js';
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
      addJournal(state, t('You and {name} lost touch.', { name: firstName(f) }));
    }
  }
  // A partner who feels ignored may leave.
  const love = partner(state);
  if (love && love.closeness <= 10 && chance(state, 0.5)) {
    love.alive = false;
    addJournal(state, t('{name} ended the relationship. You had grown apart.', { name: firstName(love) }), 'negative');
    changeStat(state, 'happiness', -14, `${firstName(love)} left`);
  }
}

// Milestones in other people's lives, so the world moves even when the player does nothing.
function otherPeopleMoveOn(state, p) {
  const name = firstName(p);
  if (['mother', 'father', 'stepmother', 'stepfather'].includes(p.role)) {
    if (!p.retired && p.age >= 65 && chance(state, 0.45)) {
      p.retired = true;
      addJournal(state, t('Your {role} retired after many years as {job}.', { _g: p.gender, role: tg(p.role, p.gender), job: tg(withArticle(p.occupation), p.gender) }));
      p.occupation = 'retired';
    }
  } else if (['sister', 'brother', 'son', 'daughter'].includes(p.role)) {
    if (p.age === 5) { p.occupation = 'student'; addJournal(state, t('{name} started school.', { name })); }
    if (p.age === 18) { addJournal(state, t('{name} graduated from high school.', { name }), 'positive'); }
    if (p.age === 22) { p.occupation = pick(state, PARENT_JOBS); addJournal(state, t('{name} found work as {job}.', { name, job: tg(withArticle(p.occupation), p.gender), _g: p.gender })); }
    if (p.age === 24 && CHILD_ROLES.includes(p.role)) addJournal(state, t('{name} moved into a place of {their} own.', { name, their: t(p.gender === 'female' ? 'her' : 'his') }));
  } else if (['friend', 'bestFriend', 'partner', 'fiance', 'spouse', 'coworker'].includes(p.role)) {
    if (p.age === 22 && p.occupation === 'student') { p.occupation = pick(state, PARENT_JOBS); addJournal(state, t('{name} started working as {job}.', { name, job: tg(withArticle(p.occupation), p.gender), _g: p.gender })); }
    else if (p.age >= 24 && p.age < 60 && p.occupation && p.occupation !== 'student' && chance(state, 0.06)) addJournal(state, t('{name} was promoted at work.', { name, _g: p.gender }));
    else if (p.age >= 65 && p.occupation !== 'retired' && chance(state, 0.4)) { p.occupation = 'retired'; addJournal(state, t('{name} retired.', { name })); }
  }
}

function petLifeCycle(state, pet) {
  const lifespan = PET_SPECIES[pet.species].lifespan;
  if (pet.age >= lifespan - 2 && chance(state, pet.age >= lifespan + 2 ? 0.6 : 0.25)) {
    pet.alive = false; pet.diedAt = state.player.age;
    addJournal(state, t('Your {species} {petName} passed away peacefully at {age}.', { species: tg(PET_SPECIES[pet.species].label.toLowerCase(), pet.gender), _g: pet.gender, petName: pet.name, age: pet.age }), 'negative');
    changeStat(state, 'happiness', -8, `${pet.name} passed away`);
  }
}

function relativeLifeCycle(state, p) {
  if (p.age < 55 || !relativeDies(state, p.age)) return;
  p.alive = false;
  const name = firstName(p);
  const label = ROLE_LABELS[p.role].toLowerCase();
  addJournal(state, t('Your {role}, {name}, passed away at the age of {age}. You miss {them} very much.', { role: tg(label, p.gender), _g: p.gender, name, age: p.age, them: t(p.gender === 'female' ? 'her' : 'him') }), 'negative');
  changeStat(state, 'happiness', -15, `${name} passed away`);
  if (p.role === 'mother' || p.role === 'father') {
    for (const step of byRole(state, p.role === 'mother' ? 'stepfather' : 'stepmother')) { /* the step-parent stays in the family */ void step; }
    const inheritance = between(state, 40, 600) * 100;
    changeMoney(state, inheritance, 'inheritance');
    addJournal(state, t('You inherited {amount} from your {role}.', { amount: dinheiro(inheritance), role: tg(label, p.gender), _g: p.gender }));
    info(state, 'In Memory', t('Your {role}, {name}, passed away at {age}. The family gathered to remember {them}, and you received an inheritance of {amount}.', { role: tg(label, p.gender), _g: p.gender, name, age: p.age, them: t(p.gender === 'female' ? 'her' : 'him'), amount: dinheiro(inheritance) }), { band: 'Family', tone: 'green', person: p.id });
  } else {
    info(state, 'In Memory', t('Your {role}, {name}, passed away at {age}.', { _g: p.gender, role: tg(label, p.gender), name, age: p.age }), { band: 'Family', tone: 'green', person: p.id });
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
      closer(6); feel('happiness', 3, t('time with {name}', { name }));
      return t('You spent quality time with {name}.', { name });
    case 'conversation': {
      const good = chance(state, 0.8);
      closer(good ? 4 : -2); feel('happiness', good ? 1 : -1, t('conversation with {name}', { name }));
      return good ? t('You and {name} had a long, easy conversation.', { name }) : t('Your conversation with {name} ended awkwardly.', { name });
    }
    case 'compliment':
      closer(3); feel('happiness', 1, t('complimented {name}', { name }));
      return t('{name} was touched by your compliment.', { name });
    case 'gift': {
      const cost = you.age < 13 ? 10 : 60;
      if (you.money < cost) return null;
      changeMoney(state, -cost, t('gift for {name}', { name })); closer(7); feel('happiness', 2, t('gift for {name}', { name }));
      return t('You gave {name} a thoughtful gift.', { name });
    }
    case 'advice':
      closer(2); feel('smarts', 1, t('advice from {name}', { name })); feel('happiness', 1, t('advice from {name}', { name }));
      return t('You asked {name} for advice and came away wiser.', { name });
    case 'argue':
      closer(-9); feel('happiness', -4, t('argued with {name}', { name }));
      return t('You and {name} had a heated argument.', { name });
    case 'allowance': {
      if (p.closeness < 40 || !chance(state, 0.6)) { closer(-1); return t('{name} said not this time.', { name }); }
      const amount = you.age < 10 ? between(state, 5, 20) : between(state, 20, 80);
      changeMoney(state, amount, t('allowance from {name}', { name }));
      return t('{name} gave you {amount} of pocket money.', { name, amount: dinheiro(amount) });
    }
    case 'homework':
      closer(5); feel('happiness', 2, t('helped {name}', { name }));
      return t('You helped {name} with homework.', { name });
    case 'playPet':
      closer(6); feel('happiness', 3, t('played with {name}', { name: p.name }));
      return t('You played with {name} until you were both worn out.', { name: p.name });
    case 'walkPet':
      closer(4); feel('happiness', 2, t('walked {name}', { name: p.name })); feel('health', 2, t('walked {name}', { name: p.name }));
      return t('You took {name} for a long walk.', { name: p.name });
    case 'treatPet': {
      if (you.money < 10) return null;
      changeMoney(state, -10, t('treat for {name}', { name: p.name })); closer(5);
      return t('{name} devoured the treat you bought.', { name: p.name });
    }
    case 'movie': {
      const cost = 30;
      if (you.money < cost) return null;
      changeMoney(state, -cost, t('movies with {name}', { name })); closer(5); feel('happiness', 3, t('movies with {name}', { name }));
      return t('You and {name} went to the movies and argued about the ending all the way home.', { name });
    }
    case 'concert': {
      if (you.money < 80) return null;
      changeMoney(state, -80, t('concert with {name}', { name })); closer(6); feel('happiness', 4, t('concert with {name}', { name }));
      return t('You and {name} went to a concert and sang until you were hoarse.', { name });
    }
    case 'play':
      closer(6); feel('happiness', 3, t('played with {name}', { name }));
      return t('You spent the afternoon playing with {name}.', { name });
    case 'doctorVisit': {
      if (you.money < 60) return null;
      changeMoney(state, -60, t('checkup for {name}', { name })); closer(4); feel('happiness', 1, t('cared for {name}', { name }));
      return t('You took {name} to the doctor for a checkup and waited with a magazine.', { name });
    }
    case 'anniversary': {
      if (you.money < 120) return null;
      changeMoney(state, -120, 'anniversary'); closer(8); feel('happiness', 4, 'anniversary');
      return t('You and {name} celebrated {years} years together.', { name, years: p.yearsTogether });
    }
    case 'propose': {
      if (p.closeness < 55 || p.yearsTogether < 1) { closer(-6); feel('happiness', -6, 'proposal declined'); return t('{name} said it was too soon. The evening was awkward.', { name }); }
      p.role = 'fiance'; closer(8); feel('happiness', 8, 'engaged');
      return t('You proposed to {name}, and {name} said yes. You are engaged!', { name });
    }
    case 'startFamily': {
      if (children(state).length >= 4) return null;
      if (!chance(state, 0.6)) { closer(2); return t('You and {name} talked about starting a family and decided to keep trying.', { name }); }
      const baby = haveChild(state);
      closer(8); feel('happiness', 8, 'new baby');
      return t('You and {name} welcomed a baby {kind} named {baby} into the world.', { name, kind: baby.gender === 'female' ? 'girl' : 'boy', baby: firstName(baby) });
    }
    case 'marry': {
      if (you.money < 500) return null;
      changeMoney(state, -500, 'wedding'); p.role = 'spouse'; closer(8); feel('happiness', 10, 'married');
      return t('You and {name} got married in a small, joyful ceremony.', { name });
    }
    case 'breakUp':
      p.alive = false; feel('happiness', -10, t('broke up with {name}', { name }));
      return t('You ended things with {name}.', { name });
    case 'unfriend':
      p.alive = false; feel('happiness', -2, t('unfriended {name}', { name }));
      return t('You decided to stop spending time with {name}.', { name });
    case 'deepTalk': {
      const open = chance(state, 0.75);
      closer(open ? 8 : -3); feel('happiness', open ? 4 : -2, t('heart to heart with {name}', { name }));
      return open ? t('You and {name} talked about the things you never say out loud.', { name })
        : t('You tried to open up to {name}, and it did not land the way you hoped.', { name });
    }
    case 'walkTogether':
      closer(4); feel('happiness', 2, t('walk with {name}', { name })); feel('health', 1, t('walk with {name}', { name }));
      return t('You and {name} walked until you ran out of pavement.', { name });
    case 'mealOut': {
      if (you.money < 25) return null;
      changeMoney(state, -25, t('meal with {name}', { name })); closer(5); feel('happiness', 3, t('meal with {name}', { name }));
      return t('You took {name} out to eat and stayed until the place emptied.', { name });
    }
    case 'helpAround':
      closer(5); feel('happiness', 1, t('helped {name} at home', { name }));
      return t('You did the chores before {name} could ask.', { name });
    case 'familyStory':
      closer(4); feel('smarts', 1, t('stories from {name}', { name })); feel('happiness', 2, t('stories from {name}', { name }));
      return t('{name} told you about growing up, and you listened to all of it.', { name });
    case 'teamUp':
      closer(6); feel('happiness', 3, t('teamed up with {name}', { name }));
      return t('You and {name} took on the afternoon as a team.', { name });
    case 'readStory':
      closer(6); feel('happiness', 3, t('story with {name}', { name }));
      return t('You read {name} a story and did all the voices.', { name });
    case 'teachSkill':
      closer(5); feel('happiness', 2, t('taught {name}', { name })); feel('smarts', 1, t('taught {name}', { name }));
      return t('You taught {name} something you are good at.', { name });
    case 'studyTogether':
      closer(4); feel('smarts', 3, t('studied with {name}', { name }));
      if (state.education) state.education.performance = Math.min(100, (state.education.performance || 0) + 2);
      return t('You and {name} revised together and actually got through it.', { name });
    case 'lunch':
      closer(4); feel('happiness', 2, t('lunch with {name}', { name }));
      return t('You and {name} spent the whole lunch break complaining about work.', { name });
    case 'coverShift': {
      closer(8); feel('happiness', -2, t('covered for {name}', { name })); feel('health', -1, t('covered for {name}', { name }));
      if (state.career) state.career.performance = Math.min(100, (state.career.performance || 0) + 2);
      return t('You covered {name}\'s shift. It was long, and {name} noticed.', { name });
    }
    case 'checkIn':
      closer(6); feel('happiness', 1, t('checked in on {name}', { name }));
      return t('You checked in on {name} out of the blue, and it meant something.', { name });
    case 'dateNight': {
      if (you.money < 45) return null;
      changeMoney(state, -45, t('date night with {name}', { name })); closer(7); feel('happiness', 4, t('date night with {name}', { name }));
      return t('You and {name} had an evening with no phones and no plans.', { name });
    }
    case 'bestFriend':
      if (p.closeness < 70) { closer(-2); return t('You told {name} how much the friendship means. It landed awkwardly.', { name }); }
      p.role = 'bestFriend'; closer(6); feel('happiness', 6, t('best friends with {name}', { name }));
      return t('You and {name} are best friends now, and both of you know it.', { name });
    case 'apologise': {
      const forgiven = chance(state, 0.5);
      closer(forgiven ? 12 : 2); feel('happiness', forgiven ? 3 : -1, t('apologised to {name}', { name }));
      return forgiven ? t('You apologised to {name}, and the air cleared.', { name }) : t('You apologised to {name}. It was heard, but not accepted.', { name });
    }
    case 'trainPet': {
      const learned = chance(state, 0.6);
      closer(learned ? 6 : 2); feel('happiness', learned ? 3 : 1, t('training {name}', { name: p.name }));
      return learned ? t('{name} learned a new trick and will not stop doing it.', { name: p.name }) : t('{name} watched you closely and learned nothing.', { name: p.name });
    }
    case 'vetVisit': {
      if (you.money < 70) return null;
      changeMoney(state, -70, t('vet for {name}', { name: p.name })); closer(5); feel('happiness', 1, t('cared for {name}', { name: p.name }));
      return t('You took {name} to the vet. Everything checked out.', { name: p.name });
    }
    case 'makePeace':
      if (chance(state, 0.5)) { p.role = 'friend'; p.closeness = 40; feel('happiness', 4, t('made peace with {name}', { name })); return t('You and {name} buried the hatchet. It felt like a weight lifted.', { name }); }
      closer(4); return t('You offered {name} an olive branch. {name} was not ready yet.', { name });
    case 'confront':
      closer(-6); feel('happiness', 2, t('confronted {name}', { name }));
      return t('You told {name} exactly what you thought. Neither of you backed down.', { name });
    case 'ignore':
      feel('happiness', 1, t('ignored {name}', { name }));
      return t('You ignored {name} completely. It bothered {them} more than you.', { name, them: p.gender === 'female' ? 'her' : 'him' });
    case 'release':
      p.alive = false; feel('happiness', -5, t('rehomed {name}', { name: p.name }));
      return t('You found {name} a loving new home.', { name: p.name });
    case 'bathePet':
      closer(3); feel('happiness', 1, t('bathed {name}', { name: p.name }));
      return t('You gave {name} a bath. Most of the water ended up on you.', { name: p.name });
    case 'askOut': {
      if (partner(state)) return t('You are already with someone.');
      const yes = p.closeness >= 45 && chance(state, 0.6);
      if (!yes) { closer(-5); feel('happiness', -3, t('{name} said no', { name })); return t('You asked {name} out. {name} said it was better to stay friends.', { name }); }
      p.role = 'partner'; p.yearsTogether = 0; closer(8); feel('happiness', 6, t('started dating {name}', { name }));
      return t('You asked {name} out, and {name} said yes. You are now a couple.', { name });
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
      ['makePeace', 'Make Peace', t(p.gender === 'female' ? 'Bury the hatchet with her' : 'Bury the hatchet with him'), 'Relationship']];
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
  if (age >= 8) list.push(['gift', 'Gift', t('{price} · a small present', { price: dinheiro(age < 13 ? 10 : 60) }), 'Activities']);
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

