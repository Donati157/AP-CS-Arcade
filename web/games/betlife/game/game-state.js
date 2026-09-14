// The whole game: state creation, every player action, and what happens when a year passes.
// State is plain data so it can be saved as JSON. Functions here are the only things that change it.
import { createRng, randomIndex } from './rng.js';
import { createPlayer, changeStat, canAfford, lifeStage, stageIndex } from './player.js';
import * as Education from './education.js';
import * as Career from './career.js';
import { pickEvent, findEvent } from './events.js';

export const ACTIONS_PER_YEAR = 6;
export const READ_BOOK_SMARTS = 3;
export const CHECKUP_COST = 50;
export const MAX_RELATIONSHIPS = 8;
// Simplified finances: a flat share of salary kept and a flat yearly living cost for adults
// who are out of school (students are supported by their family).
const NET_INCOME_SHARE = 0.8;
const LIVING_COST_ADULT = 9000;
const ASSET_UPKEEP_PERCENT = 5;
const FRIEND_NAMES = ['Liam Parker', 'Ava Nguyen', 'Mateo Rivera', 'Zoe Bennett', 'Ethan Brooks', 'Maya Patel'];

export const SHOP_ITEMS = [
  { name: 'Used Bicycle', type: 'Vehicle', cost: 200, minimumStage: 'Child' },
  { name: 'Used Car', type: 'Vehicle', cost: 3000, minimumStage: 'Young Adult' },
];

export function createNewGame(seed) {
  const state = {
    player: createPlayer(),
    education: Education.createEducation(),
    career: Career.createCareer(),
    timeline: [],
    relationships: [
      { name: 'Emma Carter', type: 'Mother', level: 90, interactedThisYear: false },
      { name: 'Daniel Carter', type: 'Father', level: 85, interactedThisYear: false },
      { name: 'Noah Williams', type: 'Friend', level: 70, interactedThisYear: false },
      { name: 'Sophia Lee', type: 'Friend', level: 65, interactedThisYear: false },
    ],
    assets: [],
    actionsRemaining: ACTIONS_PER_YEAR,
    nextFriendName: 0,
    lastEventId: null,
    pendingDecision: null, // { kind: 'event', eventId } or { kind: 'afterHighSchool' }
  };
  attachRng(state, seed);
  // Alex's childhood, so the journal reads like a real life from the start.
  const history = [
    [0, 'You were born in a small town on a rainy morning.', 'milestone'],
    [3, 'You said your first full sentence, and it was about cookies.', 'normal'],
    [5, 'You started elementary school.', 'milestone'],
    [6, 'You learned to ride a bike without training wheels.', 'normal'],
    [8, 'You made a new best friend at school.', 'positive'],
    [9, 'Your family adopted a dog named Pepper.', 'normal'],
    [11, 'You discovered a love for drawing.', 'normal'],
    [12, 'You won second place at the science fair.', 'positive'],
    [13, 'You started middle school and joined the band.', 'normal'],
    [14, 'You started high school.', 'milestone'],
    [15, 'You joined a school club.', 'normal'],
    [16, 'Your friend invited you to a party.', 'normal'],
  ];
  for (const [age, description, kind] of history) state.timeline.push({ age, description, kind });
  return state;
}

// The random generator is not part of the saved data.
export function attachRng(state, seed) {
  Object.defineProperty(state, 'rng', { value: createRng(seed), enumerable: false, writable: true });
}

// ---- Derived values -------------------------------------------------------------

export function netWorth(state) {
  return state.player.money + state.assets.reduce((sum, asset) => sum + asset.value, 0);
}

export function ownsAsset(state, name) {
  return state.assets.some((asset) => asset.name === name);
}

export function yearlyExpenses(state) {
  const stage = lifeStage(state.player.age);
  const adult = stageIndex(stage) >= stageIndex('Young Adult');
  let cost = 0;
  if (adult && !Education.isEnrolled(state.education)) cost += LIVING_COST_ADULT;
  for (const asset of state.assets) cost += Math.floor(asset.value * ASSET_UPKEEP_PERCENT / 100);
  return cost;
}

export function hasActionsLeft(state) {
  return state.actionsRemaining > 0;
}

export function isFamily(relationship) {
  return relationship.type === 'Mother' || relationship.type === 'Father';
}

export function firstName(relationship) {
  return relationship.name.split(' ')[0];
}

export function currentDecision(state) {
  const pending = state.pendingDecision;
  if (!pending) return null;
  if (pending.kind === 'afterHighSchool') return afterHighSchoolDecision();
  return findEvent(pending.eventId).decision;
}

// ---- Journal ------------------------------------------------------------------

function addEvent(state, description, kind = 'normal') {
  const event = { age: state.player.age, description, kind };
  state.timeline.push(event);
  return event;
}

// ---- Aging: the engine of the simulation ----------------------------------------

export function ageUp(state) {
  state.player.age += 1;
  state.actionsRemaining = ACTIONS_PER_YEAR;
  // Living costs depend on how the year started: a graduating student is not charged yet.
  const expenses = yearlyExpenses(state);
  const graduated = processEducation(state);
  processCareerAndMoney(state, expenses);
  processRelationships(state);
  processHealth(state);
  const education = state.education;
  if (graduated && education.highSchoolGraduate && !education.degree) {
    state.pendingDecision = { kind: 'afterHighSchool' };
  } else {
    processRandomEvent(state);
  }
}

function processEducation(state) {
  const education = state.education;
  if (!Education.isEnrolled(education)) return false;
  const wasHighSchool = education.stage === 'highSchool';
  const graduated = Education.advanceYear(education);
  if (graduated && wasHighSchool) {
    addEvent(state, `You graduated from ${Education.HIGH_SCHOOL_NAME}.`, 'milestone');
    state.player.occupation = 'High School Graduate';
  } else if (graduated) {
    addEvent(state, `You graduated from ${Education.UNIVERSITY_NAME} with a degree in ${education.degree}.`, 'milestone');
    state.player.occupation = 'Unemployed';
  }
  return graduated;
}

function processCareerAndMoney(state, expenses) {
  const { player, career } = state;
  if (Career.isEmployed(career)) {
    const netIncome = Math.round(Career.currentJob(career).salary * NET_INCOME_SHARE);
    changeStat(player, 'money', netIncome);
    if (!career.workedHardThisYear) Career.changeCareerPerformance(career, -3);
    Career.completeCareerYear(career);
  }
  if (expenses === 0) return;
  if (canAfford(player, expenses)) {
    changeStat(player, 'money', -expenses);
  } else if (player.money > 0) {
    // Simplification: the player cannot go into debt; a hard year just empties the account.
    changeStat(player, 'money', -player.money);
    changeStat(player, 'happiness', -3);
    addEvent(state, 'Money was tight this year and you had to cut back on everything.');
  }
}

function processRelationships(state) {
  for (const relationship of state.relationships) {
    if (relationship.interactedThisYear) {
      changeLevel(relationship, 1);
    } else {
      changeLevel(relationship, isFamily(relationship) ? -1 : -3);
    }
    relationship.interactedThisYear = false;
  }
}

function processHealth(state) {
  if (state.player.age >= 45) changeStat(state.player, 'health', -1);
}

function processRandomEvent(state) {
  const event = pickEvent(state.rng, state.player.age, state.education.stage, Career.isEmployed(state.career), state.lastEventId);
  if (!event) return;
  state.lastEventId = event.id;
  if (event.decision) {
    state.pendingDecision = { kind: 'event', eventId: event.id };
  } else {
    applyEffect(state, event.effect);
    addEvent(state, event.text, event.kind);
  }
}

function afterHighSchoolDecision() {
  return {
    title: "What's Next?",
    description: 'High school is behind you. What do you want to do now?',
    choices: [
      { label: 'Go to university', resultText: 'You decided to continue your education at university.', effect: {}, followUp: 'university' },
      { label: 'Find a job', resultText: 'You decided to start working right away.', effect: {}, followUp: 'jobs' },
      { label: 'Take some time off', resultText: 'You decided to take some time off to figure things out.', effect: { happiness: 3 }, followUp: null },
    ],
  };
}

// Applies the chosen option of the pending decision. Returns the follow-up screen or null.
export function resolveDecision(state, choiceIndex) {
  const decision = currentDecision(state);
  if (!decision) return null;
  const choice = decision.choices[choiceIndex];
  state.pendingDecision = null;
  applyEffect(state, choice.effect);
  addEvent(state, choice.resultText, choice.followUp ? 'milestone' : 'normal');
  if (!choice.followUp && state.player.occupation === 'High School Graduate') {
    state.player.occupation = 'Taking Time Off';
  }
  return choice.followUp;
}

function applyEffect(state, effect) {
  const player = state.player;
  changeStat(player, 'happiness', effect.happiness || 0);
  changeStat(player, 'health', effect.health || 0);
  changeStat(player, 'smarts', effect.smarts || 0);
  changeStat(player, 'money', effect.money || 0);
  if (effect.performance && Education.isEnrolled(state.education)) {
    Education.changePerformance(state.education, effect.performance);
  }
  if (effect.friend) {
    const friends = state.relationships.filter((r) => !isFamily(r));
    if (friends.length > 0) changeLevel(friends[randomIndex(state.rng, friends.length)], effect.friend);
  }
  if (effect.family) {
    for (const relationship of state.relationships) if (isFamily(relationship)) changeLevel(relationship, effect.family);
  }
  if (effect.newFriend) meetNewFriend(state);
}

function meetNewFriend(state) {
  if (state.relationships.length >= MAX_RELATIONSHIPS || state.nextFriendName >= FRIEND_NAMES.length) return;
  state.relationships.push({ name: FRIEND_NAMES[state.nextFriendName], type: 'Friend', level: 55, interactedThisYear: false });
  state.nextFriendName += 1;
}

function changeLevel(relationship, amount) {
  relationship.level = Math.max(0, Math.min(100, relationship.level + amount));
}

// ---- Actions that use one of the year's actions ----------------------------------
// Each returns the journal event, or null when no actions are left (nothing changes then).

function useAction(state) {
  if (state.actionsRemaining <= 0) return false;
  state.actionsRemaining -= 1;
  return true;
}

function action(state, apply, description) {
  if (!useAction(state)) return null;
  apply();
  return addEvent(state, description);
}

export function readBook(state) {
  return action(state, () => changeStat(state.player, 'smarts', READ_BOOK_SMARTS), 'You spent some time reading at the library.');
}
export function meditate(state) {
  return action(state, () => { changeStat(state.player, 'happiness', 4); changeStat(state.player, 'health', 1); }, 'You took some time to meditate.');
}
export function goForWalk(state) {
  return action(state, () => { changeStat(state.player, 'health', 3); changeStat(state.player, 'happiness', 2); }, 'You went for a long walk around the neighborhood.');
}
export function playGame(state) {
  return action(state, () => changeStat(state.player, 'happiness', 4), 'You spent the afternoon playing games.');
}
export function spendTimeOutside(state) {
  return action(state, () => { changeStat(state.player, 'happiness', 2); changeStat(state.player, 'health', 2); }, 'You spent some time outside in the fresh air.');
}
export function studyHarder(state) {
  return action(state, () => { Education.changePerformance(state.education, 5); changeStat(state.player, 'smarts', 2); }, 'You spent extra time studying for your exams.');
}
export function skipStudying(state) {
  return action(state, () => { Education.changePerformance(state.education, -5); changeStat(state.player, 'happiness', 2); }, 'You decided to take it easy instead of studying.');
}
export function visitSchoolLibrary(state) {
  return action(state, () => { changeStat(state.player, 'smarts', 2); Education.changePerformance(state.education, 2); }, 'You studied in the school library after class.');
}
export function attendClass(state) {
  return action(state, () => { Education.changePerformance(state.education, 4); changeStat(state.player, 'smarts', 1); }, 'You attended every lecture this semester.');
}
export function skipClass(state) {
  return action(state, () => { Education.changePerformance(state.education, -6); changeStat(state.player, 'happiness', 3); }, 'You skipped a few classes to enjoy campus life.');
}
export function workHarder(state) {
  return action(state, () => { Career.changeCareerPerformance(state.career, 6); changeStat(state.player, 'happiness', -1); }, 'You put in long hours at work and it showed.');
}
export function takeItEasyAtWork(state) {
  return action(state, () => { Career.changeCareerPerformance(state.career, -4); changeStat(state.player, 'happiness', 3); }, 'You took it easy at work this year.');
}
export function spendTime(state, relationship) {
  return action(state, () => { changeLevel(relationship, 5); relationship.interactedThisYear = true; changeStat(state.player, 'happiness', 2); },
    `You spent some quality time with ${firstName(relationship)}.`);
}
export function compliment(state, relationship) {
  return action(state, () => { changeLevel(relationship, 3); relationship.interactedThisYear = true; changeStat(state.player, 'happiness', 1); },
    `You gave ${firstName(relationship)} a heartfelt compliment.`);
}
export function argue(state, relationship) {
  return action(state, () => { changeLevel(relationship, -8); relationship.interactedThisYear = true; changeStat(state.player, 'happiness', -3); },
    `You had an argument with ${firstName(relationship)}.`);
}

// Doctor visit: costs money and one action. Returns 'success' | 'noActions' | 'noMoney'.
export function visitDoctor(state) {
  if (!hasActionsLeft(state)) return 'noActions';
  if (!canAfford(state.player, CHECKUP_COST)) return 'noMoney';
  useAction(state);
  changeStat(state.player, 'money', -CHECKUP_COST);
  changeStat(state.player, 'health', 3);
  addEvent(state, 'You went to the doctor for a general checkup.');
  return 'success';
}

// ---- Education, career and shopping (no action cost) ----------------------------

export function enrollInUniversity(state, major) {
  Education.enrollInUniversity(state.education, major);
  state.player.occupation = 'University Student';
  addEvent(state, `You enrolled at ${Education.UNIVERSITY_NAME} to study ${major}.`, 'milestone');
}

export function isEligibleFor(state, job) {
  return Career.meetsRequirements(job, state.player, state.education);
}

export function applyForJob(state, job) {
  if (!isEligibleFor(state, job)) return false;
  Career.startJob(state.career, job);
  state.player.occupation = job.title;
  addEvent(state, `You were hired as a ${job.title} at ${job.company}.`, 'milestone');
  return true;
}

export function quitJob(state) {
  const title = Career.currentJob(state.career).title;
  Career.quitJob(state.career);
  state.player.occupation = 'Unemployed';
  addEvent(state, `You quit your job as a ${title}.`);
}

export function itemAvailable(state, item) {
  return stageIndex(lifeStage(state.player.age)) >= stageIndex(item.minimumStage);
}

// Returns 'success' | 'alreadyOwned' | 'noMoney' | 'tooYoung'.
export function buy(state, item) {
  if (!itemAvailable(state, item)) return 'tooYoung';
  if (ownsAsset(state, item.name)) return 'alreadyOwned';
  if (!canAfford(state.player, item.cost)) return 'noMoney';
  changeStat(state.player, 'money', -item.cost);
  state.assets.push({ name: item.name, type: item.type, value: item.cost });
  addEvent(state, `You bought a ${item.name.toLowerCase()}.`, 'positive');
  return 'success';
}

// ---- Saving --------------------------------------------------------------------

const STORAGE_KEY = 'betlife.web.save';

export function saveGame(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Storage may be unavailable (private mode); the game simply stays in memory.
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || !state.player || !Array.isArray(state.timeline)) return null;
    attachRng(state);
    return state;
  } catch (error) {
    return null;
  }
}

export function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Nothing to clear.
  }
}
