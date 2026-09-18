// The event engine: builds the life context, finds every event the player is eligible for,
// respects cooldowns and repeat limits, picks by category and weight, and applies the result.
// There is no filler event: a year with nothing eligible simply has no random event.
import { chance, pick, pickWeighted, rand } from '../rng.js';
import { applyEffects, changeStat } from '../stats.js';
import { addJournal, pushModal, info } from '../journal.js';
import { stageId } from '../player.js';
import * as People from '../people.js';
import * as Education from '../education.js';
import * as Career from '../career.js';
import { ownsCar, ownsHome } from '../assets.js';
import { EVENTS, findEvent } from './catalog.js';
import { CATEGORY_LABELS } from './define.js';

export const CATEGORY_MEMORY = 3;   // categories used in the last N picks are less likely

export function createEventMemory() {
  return { last: {}, count: {}, families: {}, recentCategories: [], log: [] };
}

// ---- Life context: the facts events look at -----------------------------------------------------

export function buildContext(state) {
  const p = state.player;
  const edu = state.education;
  const career = state.career;
  const partner = People.partner(state);
  const parents = People.parents(state);
  const mother = parents.find((r) => r.role === 'mother') || null;
  const father = parents.find((r) => r.role === 'father') || null;
  return {
    state, p, age: p.age, stage: stageId(p.age), edu, career, first: p.firstName, name: p.name,
    employed: Career.isEmployed(career), job: Career.jobTitle(career), employer: Career.employer(career), retired: career.retired,
    partner, spouse: partner && partner.role === 'spouse' ? partner : null, children: People.children(state), friends: People.friends(state),
    parents, mother, father, siblings: People.siblings(state), pets: People.pets(state),
    hasCar: ownsCar(state), hasHome: ownsHome(state), hasLicence: p.hasLicence, money: p.money,
    inSchool: Education.isInSchool(edu), elementary: Education.isElementary(edu), middleSchool: Education.isMiddleSchool(edu),
    highSchool: Education.isHighSchool(edu), university: Education.isUniversity(edu), trade: Education.isTradeSchool(edu),
    student: Education.isEnrolled(edu), graduate: edu.highSchoolGraduate, degree: edu.degree,
    unemployedAdult: p.age >= 18 && !Career.isEmployed(career) && !Education.isEnrolled(edu) && !career.retired,
    who: null, whoName: '', school: Education.schoolName(edu), glasses: !!state.flags.glasses,
  };
}

const NEEDS = {
  school: (c) => c.inSchool, elementary: (c) => c.elementary, middleSchool: (c) => c.middleSchool, highSchool: (c) => c.highSchool,
  university: (c) => c.university, trade: (c) => c.trade, student: (c) => c.student, notStudent: (c) => !c.student,
  graduate: (c) => c.graduate, degree: (c) => !!c.degree,
  employed: (c) => c.employed, fullTime: (c) => c.employed && !Career.currentCareer(c.career).partTime, unemployedAdult: (c) => c.unemployedAdult,
  retired: (c) => c.retired, notRetired: (c) => !c.retired, working: (c) => c.employed && !c.retired,
  partner: (c) => !!c.partner, noPartner: (c) => !c.partner, spouse: (c) => !!c.spouse, notMarried: (c) => !c.spouse,
  children: (c) => c.children.length > 0, noChildren: (c) => c.children.length === 0, youngChild: (c) => c.children.some((k) => k.age < 12),
  friends: (c) => c.friends.length > 0, parents: (c) => c.parents.length > 0, mother: (c) => !!c.mother, father: (c) => !!c.father,
  siblings: (c) => c.siblings.length > 0, pets: (c) => c.pets.length > 0, noPets: (c) => c.pets.length === 0,
  car: (c) => c.hasCar, noCar: (c) => !c.hasCar, home: (c) => c.hasHome, noHome: (c) => !c.hasHome, licence: (c) => c.hasLicence, noLicence: (c) => !c.hasLicence,
  money: (c) => c.money >= 500, broke: (c) => c.money < 200, debt: (c) => c.money < 0, rich: (c) => c.money >= 50000,
  smart: (c) => c.p.smarts >= 70, notSmart: (c) => c.p.smarts < 45, fit: (c) => c.p.health >= 70, unfit: (c) => c.p.health < 45,
  happy: (c) => c.p.happiness >= 65, unhappy: (c) => c.p.happiness < 40, goodLooks: (c) => c.p.looks >= 65,
  goodGrades: (c) => c.student && c.edu.performance >= 75, badGrades: (c) => c.student && c.edu.performance < 50,
  goodWork: (c) => c.employed && c.career.performance >= 75, badWork: (c) => c.employed && c.career.performance < 45,
  adult: (c) => c.age >= 18, minor: (c) => c.age < 18, withParents: (c) => c.p.livesWithParents, ownPlace: (c) => !c.p.livesWithParents,
};

const PERSON_GROUPS = {
  friend: (c) => c.friends, parent: (c) => c.parents, mother: (c) => (c.mother ? [c.mother] : []), father: (c) => (c.father ? [c.father] : []),
  sibling: (c) => c.siblings, partner: (c) => (c.partner ? [c.partner] : []), child: (c) => c.children, pet: (c) => c.pets,
  coworker: (c) => c.friends.filter((f) => f.role === 'coworker'), family: (c) => c.parents.concat(c.siblings),
};

export function isEligible(event, c, memory, ignoreCooldown = false) {
  if (c.age < event.minAge || c.age > event.maxAge) return false;
  if (event.stages && !event.stages.includes(c.stage)) return false;
  for (const need of event.needs) if (!NEEDS[need] || !NEEDS[need](c)) return false;
  if (event.person && personGroup(event, c).length === 0) return false;
  if (event.when && !event.when(c)) return false;
  const times = memory.count[event.id] || 0;
  if (event.once && times >= 1) return false;
  if (times >= event.max) return false;
  if (!ignoreCooldown) {
    const lastAge = memory.last[event.id];
    if (lastAge !== undefined && c.age - lastAge < event.cooldown) return false;
    if (event.family) {
      const familyAge = memory.families[event.family];
      if (familyAge !== undefined && c.age - familyAge < Math.min(event.cooldown, 4)) return false;
    }
  }
  return true;
}

// `person` is a group name or a function (c) => people; both give the candidates for c.who.
function personGroup(event, c) {
  return typeof event.person === 'function' ? event.person(c) : PERSON_GROUPS[event.person](c);
}

export function eligibleEvents(state, ignoreCooldown = false) {
  const c = buildContext(state);
  return EVENTS.filter((e) => isEligible(e, c, state.events, ignoreCooldown));
}

// Picks one event from the pool, preferring categories that have not come up recently.
function pickFromPool(state, pool, excludeCategory) {
  const memory = state.events;
  const categories = [...new Set(pool.map((e) => e.category))].filter((cat) => cat !== excludeCategory);
  if (categories.length === 0) return null;
  const category = pickWeighted(state, categories, (cat) => {
    const recentIndex = memory.recentCategories.indexOf(cat);
    const size = pool.filter((e) => e.category === cat).length;
    const sizeWeight = Math.min(size, 6) * (cat === 'rare' ? 0.3 : cat === 'news' ? 0.35 : 1); // surprises and news stay rare
    return recentIndex === -1 ? sizeWeight : sizeWeight * (0.25 + 0.25 * recentIndex);
  });
  const candidates = pool.filter((e) => e.category === category);
  return pickWeighted(state, candidates, (e) => e.weight);
}

/**
 * Runs the random events for the year: usually one, sometimes two, occasionally none when the
 * year was already full of milestones. Returns the events that fired.
 */
export function runYearlyEvents(state, milestoneCount = 0) {
  const fired = [];
  let wanted = 1;
  if (state.player.age >= 5 && chance(state, 0.3)) wanted = 2;
  if (milestoneCount >= 2 && chance(state, 0.5)) wanted -= 1;
  if (milestoneCount === 0 && state.player.age >= 8 && chance(state, 0.08)) wanted = 0;
  let lastCategory = null;
  for (let i = 0; i < wanted; i++) {
    let pool = eligibleEvents(state).filter((e) => !fired.includes(e));
    let event = pickFromPool(state, pool, lastCategory);
    if (!event) {
      pool = eligibleEvents(state, true).filter((e) => !fired.includes(e));
      event = pickFromPool(state, pool, lastCategory);
    }
    if (!event) break;
    fireEvent(state, event);
    fired.push(event);
    lastCategory = event.category;
  }
  return fired;
}

// Records the event and either applies it (plain event) or queues a decision for the player.
export function fireEvent(state, event) {
  const memory = state.events;
  const c = buildContext(state);
  if (event.person) {
    c.who = pick(state, personGroup(event, c));
    c.whoName = People.firstName(c.who);
  }
  memory.last[event.id] = c.age;
  memory.count[event.id] = (memory.count[event.id] || 0) + 1;
  if (event.family) memory.families[event.family] = c.age;
  memory.recentCategories.unshift(event.category);
  memory.recentCategories.splice(CATEGORY_MEMORY);
  memory.log.push({ age: c.age, id: event.id });

  if (event.minigame) {
    pushModal(state, { kind: 'minigame', game: event.minigame, eventId: event.id, band: event.band || CATEGORY_LABELS[event.category], title: event.title || 'Test', text: render(event.text, c) });
    return;
  }
  if (event.choices) {
    const choices = event.choices.filter((ch) => !ch.when || ch.when(c)).map((ch) => ({ label: ch.label, index: event.choices.indexOf(ch) }));
    pushModal(state, { kind: 'decision', eventId: event.id, band: event.band || CATEGORY_LABELS[event.category], title: event.title || 'Decision',
      text: render(event.text, c), facts: event.facts ? event.facts(c) : null, choices, person: c.who ? c.who.id : null });
    return;
  }
  applyEventEffects(state, event.effects, c, event.id);
  const text = render(event.text, c);
  if (text) addJournal(state, text, event.kind);
  if (event.then) event.then(state, c);
}

export function render(text, c) {
  return typeof text === 'function' ? text(c) : text;
}

// Applies the pending decision's chosen option. Returns the follow-up screen name or null.
export function resolveDecision(state, modal, choiceIndex) {
  const event = findEvent(modal.eventId);
  if (!event) return null;
  const choice = event.choices[choiceIndex];
  const c = buildContext(state);
  if (modal.person) { c.who = People.findPerson(state, modal.person); c.whoName = c.who ? People.firstName(c.who) : ''; }
  applyEventEffects(state, choice.effects, c, `${event.id}:${choiceIndex}`);
  const text = render(choice.text, c);
  if (text) addJournal(state, text, choice.kind || (choice.followUp ? 'milestone' : 'normal'));
  if (choice.then) choice.then(state, c);
  return choice.followUp || null;
}

export function applyEventEffects(state, effects, c, reason) {
  if (!effects) return;
  applyEffects(state, effects, reason);
  if (effects.performance) {
    if (Education.isEnrolled(state.education)) Education.changePerformance(state.education, effects.performance);
    else if (Career.isEmployed(state.career)) Career.changePerformance(state.career, effects.performance);
  }
  if (effects.closeness && c.who) { People.changeCloseness(c.who, effects.closeness); c.who.interactedThisYear = true; }
  if (effects.family) for (const r of c.parents.concat(c.siblings)) People.changeCloseness(r, effects.family);
  if (effects.friends) for (const f of c.friends) People.changeCloseness(f, effects.friends);
  if (effects.partnerCloseness && c.partner) People.changeCloseness(c.partner, effects.partnerCloseness);
  if (effects.newFriend) {
    const friend = People.addFriend(state, effects.newFriend === true ? {} : effects.newFriend);
    if (friend) {
      addJournal(state, `You became friends with ${friend.name}.`, 'positive');
      info(state, 'New Friend', `You are now friends with ${friend.name}.`, { band: 'Friends', tone: 'blue', person: friend.id, facts: [['Name', friend.name], ['Age', String(friend.age)], ['Occupation', friend.occupation || 'none yet']] });
    }
  }
  if (effects.newCoworker) {
    const mate = People.addFriend(state, { role: 'coworker', age: state.player.age + Math.round((rand(state) - 0.5) * 20), occupation: c.job ? `${c.job} colleague` : 'coworker' });
    if (mate) addJournal(state, `You and your coworker ${mate.name} became friends.`, 'positive');
  }
  if (effects.newSibling) {
    const gender = rand(state) < 0.5 ? 'female' : 'male';
    const baby = People.createSibling(state, gender, 0);
    baby.closeness = 70;
    state.relationships.push(baby);
    addJournal(state, `Your parents had a baby ${gender === 'female' ? 'girl' : 'boy'} named ${People.firstName(baby)}, your new ${gender === 'female' ? 'sister' : 'brother'}.`, 'milestone');
  }
  if (effects.newPartner && !c.partner) {
    const love = People.startDating(state);
    addJournal(state, `You started going out with ${love.name}.`, 'positive');
    info(state, 'Love Interest', `${love.name} asked you out, and you said yes. You are now going out together.`, { band: 'Love', tone: 'blue', person: love.id, facts: [['Name', love.name], ['Age', String(love.age)], ['Occupation', love.occupation || 'student']] });
  }
  if (effects.newChild) {
    const baby = People.haveChild(state);
    addJournal(state, `You welcomed a baby ${baby.gender === 'female' ? 'girl' : 'boy'} named ${People.firstName(baby)} into the world.`, 'milestone');
    changeStat(state, 'happiness', 8, 'new baby');
    info(state, 'A New Baby', `You are the proud parent of a baby ${baby.gender === 'female' ? 'girl' : 'boy'} named ${People.firstName(baby)}.`, { band: 'Family', tone: 'green', person: baby.id, facts: [['Name', baby.name], ['Relationship', baby.role === 'daughter' ? 'Daughter' : 'Son']] });
  }
  if (effects.newPet) {
    const species = effects.newPet === true ? pick(state, ['dog', 'cat']) : effects.newPet;
    const pet = People.adoptPet(state, species);
    addJournal(state, `A ${People.PET_SPECIES[species].label.toLowerCase()} named ${pet.name} joined the family.`, 'positive');
  }
  if (effects.breakUp && c.partner) {
    c.partner.alive = false;
    addJournal(state, `You and ${People.firstName(c.partner)} broke up.`, 'negative');
  }
  if (effects.bestFriend && c.who && c.who.role === 'friend') c.who.role = 'bestFriend';
  if (effects.loseFriend && c.who) c.who.alive = false;
}

// ---- Reports for tests and balancing ---------------------------------------------------------

export function eligibleIds(state) {
  return eligibleEvents(state, true).map((e) => e.id);
}
