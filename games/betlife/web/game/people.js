// Everyone in the player's life: family, friends, partners, children, coworkers and pets.
// People have state of their own (age, closeness, occupation, alive) and it changes every year.
import { between, chance, pick } from './rng.js';
import { changeStat, changeMoney } from './stats.js';
import { addJournal, info } from './journal.js';
import { uniqueName, randomGender, PARENT_JOBS, PET_NAMES, withArticle } from './life-generator.js';
import { relativeDies } from './mortality.js';

export const ROLE_LABELS = {
  mother: 'Mother', father: 'Father', sister: 'Sister', brother: 'Brother', friend: 'Friend', bestFriend: 'Best Friend',
  partner: 'Partner', fiance: 'Fiancé(e)', spouse: 'Spouse', son: 'Son', daughter: 'Daughter', coworker: 'Coworker', pet: 'Pet',
};
export const FAMILY_ROLES = ['mother', 'father', 'sister', 'brother'];
export const PARTNER_ROLES = ['partner', 'fiance', 'spouse'];
export const CHILD_ROLES = ['son', 'daughter'];
export const PET_SPECIES = {
  dog: { label: 'Dog', lifespan: 13, cost: 350 }, cat: { label: 'Cat', lifespan: 15, cost: 200 },
  rabbit: { label: 'Rabbit', lifespan: 9, cost: 80 }, hamster: { label: 'Hamster', lifespan: 3, cost: 30 }, fish: { label: 'Goldfish', lifespan: 5, cost: 15 },
};
export const MAX_FRIENDS = 6;

function person(state, fields) {
  const id = `p${state.nextPersonId++}`;
  return { id, closeness: 50, alive: true, interactedThisYear: false, occupation: '', since: state.player.age, ...fields };
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

export function createFriend(state, options = {}) {
  const gender = options.gender || randomGender(state);
  const age = options.age ?? state.player.age + between(state, -2, 2);
  return person(state, { name: uniqueName(state, gender), gender, role: options.role || 'friend', age: Math.max(0, age),
    closeness: between(state, 45, 65), occupation: options.occupation || occupationForAge(state, age) });
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
export const parents = (state) => byRole(state, 'mother', 'father');
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
    ['Partner', byRole(state, ...PARTNER_ROLES)], ['Parents', parents(state)], ['Siblings', siblings(state)],
    ['Children', children(state)], ['Friends', byRole(state, 'bestFriend', 'friend')], ['Coworkers', byRole(state, 'coworker')], ['Pets', pets(state)],
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

export function adoptPet(state, species, name) {
  const pet = createPet(state, species, name);
  state.relationships.push(pet);
  return pet;
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
  if (p.role === 'mother' || p.role === 'father') {
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
    pet.alive = false;
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
    const inheritance = between(state, 40, 600) * 100;
    changeMoney(state, inheritance, 'inheritance');
    addJournal(state, `You inherited $${inheritance.toLocaleString('en-US')} from your ${label}.`);
    info(state, 'In Memory', `Your ${label}, ${name}, passed away at ${p.age}. The family gathered to remember ${p.gender === 'female' ? 'her' : 'him'}, and you received an inheritance of $${inheritance.toLocaleString('en-US')}.`, { band: 'Family', tone: 'green', person: p.id });
  } else {
    info(state, 'In Memory', `Your ${label}, ${name}, passed away at ${p.age}.`, { band: 'Family', tone: 'green', person: p.id });
  }
}

// ---- Interactions (called by the screens; each costs one action, checked by the caller) --------

export function interact(state, p, action) {
  const you = state.player;
  const name = firstName(p);
  p.interactedThisYear = true;
  switch (action) {
    case 'spendTime':
      changeCloseness(p, 6); changeStat(state, 'happiness', 3, `time with ${name}`);
      return `You spent quality time with ${name}.`;
    case 'conversation': {
      const good = chance(state, 0.8);
      changeCloseness(p, good ? 4 : -2); changeStat(state, 'happiness', good ? 1 : -1, `conversation with ${name}`);
      return good ? `You and ${name} had a long, easy conversation.` : `Your conversation with ${name} ended awkwardly.`;
    }
    case 'compliment':
      changeCloseness(p, 3); changeStat(state, 'happiness', 1, `complimented ${name}`);
      return `${name} was touched by your compliment.`;
    case 'gift': {
      const cost = you.age < 13 ? 10 : 60;
      if (you.money < cost) return null;
      changeMoney(state, -cost, `gift for ${name}`); changeCloseness(p, 7); changeStat(state, 'happiness', 2, `gift for ${name}`);
      return `You gave ${name} a thoughtful gift.`;
    }
    case 'advice':
      changeCloseness(p, 2); changeStat(state, 'smarts', 1, `advice from ${name}`); changeStat(state, 'happiness', 1, `advice from ${name}`);
      return `You asked ${name} for advice and came away wiser.`;
    case 'argue':
      changeCloseness(p, -9); changeStat(state, 'happiness', -4, `argued with ${name}`);
      return `You and ${name} had a heated argument.`;
    case 'allowance': {
      if (p.closeness < 40 || !chance(state, 0.6)) { changeCloseness(p, -1); return `${name} said not this time.`; }
      const amount = you.age < 10 ? between(state, 5, 20) : between(state, 20, 80);
      changeMoney(state, amount, `allowance from ${name}`);
      return `${name} gave you $${amount} of pocket money.`;
    }
    case 'homework':
      changeCloseness(p, 5); changeStat(state, 'happiness', 2, `helped ${name}`);
      return `You helped ${name} with homework.`;
    case 'playPet':
      changeCloseness(p, 6); changeStat(state, 'happiness', 3, `played with ${p.name}`);
      return `You played with ${p.name} until you were both worn out.`;
    case 'walkPet':
      changeCloseness(p, 4); changeStat(state, 'happiness', 2, `walked ${p.name}`); changeStat(state, 'health', 2, `walked ${p.name}`);
      return `You took ${p.name} for a long walk.`;
    case 'treatPet': {
      if (you.money < 10) return null;
      changeMoney(state, -10, `treat for ${p.name}`); changeCloseness(p, 5);
      return `${p.name} devoured the treat you bought.`;
    }
    case 'movie': {
      const cost = 30;
      if (you.money < cost) return null;
      changeMoney(state, -cost, `movies with ${name}`); changeCloseness(p, 5); changeStat(state, 'happiness', 3, `movies with ${name}`);
      return `You and ${name} went to the movies and argued about the ending all the way home.`;
    }
    case 'concert': {
      if (you.money < 80) return null;
      changeMoney(state, -80, `concert with ${name}`); changeCloseness(p, 6); changeStat(state, 'happiness', 4, `concert with ${name}`);
      return `You and ${name} went to a concert and sang until you were hoarse.`;
    }
    case 'play':
      changeCloseness(p, 6); changeStat(state, 'happiness', 3, `played with ${name}`);
      return `You spent the afternoon playing with ${name}.`;
    case 'doctorVisit': {
      if (you.money < 60) return null;
      changeMoney(state, -60, `checkup for ${name}`); changeCloseness(p, 4); changeStat(state, 'happiness', 1, `cared for ${name}`);
      return `You took ${name} to the doctor for a checkup and waited with a magazine.`;
    }
    case 'anniversary': {
      if (you.money < 120) return null;
      changeMoney(state, -120, 'anniversary'); changeCloseness(p, 8); changeStat(state, 'happiness', 4, 'anniversary');
      return `You and ${name} celebrated ${p.yearsTogether} years together.`;
    }
    case 'propose': {
      if (p.closeness < 55 || p.yearsTogether < 1) { changeCloseness(p, -6); changeStat(state, 'happiness', -6, 'proposal declined'); return `${name} said it was too soon. The evening was awkward.`; }
      p.role = 'fiance'; changeCloseness(p, 8); changeStat(state, 'happiness', 8, 'engaged');
      return `You proposed to ${name}, and ${name} said yes. You are engaged!`;
    }
    case 'marry': {
      if (you.money < 500) return null;
      changeMoney(state, -500, 'wedding'); p.role = 'spouse'; changeCloseness(p, 8); changeStat(state, 'happiness', 10, 'married');
      return `You and ${name} got married in a small, joyful ceremony.`;
    }
    case 'breakUp':
      p.alive = false; changeStat(state, 'happiness', -10, `broke up with ${name}`);
      return `You ended things with ${name}.`;
    case 'unfriend':
      p.alive = false; changeStat(state, 'happiness', -2, `unfriended ${name}`);
      return `You decided to stop spending time with ${name}.`;
    case 'release':
      p.alive = false; changeStat(state, 'happiness', -5, `rehomed ${p.name}`);
      return `You found ${p.name} a loving new home.`;
    default:
      return null;
  }
}

// Which interactions a person offers at the player's current age.
export function actionsFor(state, p) {
  const age = state.player.age;
  if (p.role === 'pet') {
    const list = [['playPet', 'Play', 'Spend time together'], ['treatPet', 'Treat', '$10 · a special snack']];
    if (p.species === 'dog') list.push(['walkPet', 'Walk', 'Good for you both']);
    list.push(['release', 'Rehome', 'Find a new family']);
    return list;
  }
  const list = [['spendTime', 'Spend Time', 'Hang out together']];
  if (age >= 3) list.push(['conversation', 'Conversation', 'Talk about life']);
  if (age >= 5) list.push(['compliment', 'Compliment', 'Say something kind']);
  if (age >= 8) list.push(['gift', 'Gift', `$${age < 13 ? 10 : 60} · a small present`]);
  if (age >= 10) list.push(['advice', 'Ask for Advice', 'Learn from them']);
  if (age >= 6) list.push(['movie', 'Movie Theater', '$30 · go to the movies together']);
  if (age >= 14) list.push(['concert', 'Concert', '$80 · go to a concert together']);
  if (age >= 4) list.push(['argue', 'Argue', 'Start a fight']);
  if ((p.role === 'mother' || p.role === 'father') && age >= 4 && age < 18) list.push(['allowance', 'Ask for Money', 'Pocket money']);
  if (CHILD_ROLES.includes(p.role) && p.age < 12) list.push(['play', 'Play', 'Games and silliness']);
  if (CHILD_ROLES.includes(p.role) && p.age >= 6 && p.age < 18) list.push(['homework', 'Help with Homework', 'Be there for them']);
  if ((p.role === 'mother' || p.role === 'father') && age >= 25 && p.age >= 60) list.push(['doctorVisit', 'Doctor', '$60 · take them for a checkup']);
  if (PARTNER_ROLES.includes(p.role)) {
    list.push(['anniversary', 'Celebrate Anniversary', '$120 · a night out']);
    if (p.role === 'partner' && age >= 20) list.push(['propose', 'Propose', 'Ask the big question']);
    if (p.role === 'fiance') list.push(['marry', 'Get Married', '$500 · plan the wedding']);
    list.push(['breakUp', 'Break Up', 'End the relationship']);
  }
  if (['friend', 'bestFriend', 'coworker'].includes(p.role)) list.push(['unfriend', 'Drift Apart', 'Stop seeing them']);
  return list;
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

