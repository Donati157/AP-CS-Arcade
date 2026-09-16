// The public face of the simulation: create a life, take actions, answer dialogs, age up, save.
// The interface only talks to this module (and reads state); it never edits state directly.
import { initRng, seedFromClock, pick } from './rng.js';
import { createPlayer, stageLabel } from './player.js';
import { generateProfile, withArticle } from './life-generator.js';
import { addJournal } from './journal.js';
import * as People from './people.js';
import * as Education from './education.js';
import * as Career from './career.js';
import * as Careers from './careers.js';
import * as Assets from './assets.js';
import * as Activities from './activities.js';
import * as Economy from './economy.js';
import { createEventMemory, resolveDecision as resolveEventDecision } from './events/engine.js';
import { findEvent } from './events/catalog.js';
import { ageUp as processYear, resolveAfterHighSchool, updateOccupation } from './year.js';
import { changeStat } from './stats.js';
import { SAVE_VERSION } from './save.js';

export { saveGame, loadGame, clearSavedGame } from './save.js';
export { lifeSummary } from './summary.js';
export { ACTIONS_PER_YEAR, ACTIVITY_MIN_AGE } from './activities.js';
export const SHOPPING_MIN_AGE = 8;
export const JOBS_MIN_AGE = 15;

/**
 * Starts a brand-new life at birth. `custom` may fix the name, gender and birthplace; everything
 * else comes from the seeded RNG. Tests pass a seed for a repeatable life.
 */
export function createNewGame(custom = {}, seed = seedFromClock()) {
  const state = {
    version: SAVE_VERSION, seed: 0, rngState: 0, profile: null, player: null,
    education: Education.createEducation(), career: Career.createCareer(),
    relationships: [], assets: [], timeline: [],
    actionsRemaining: Activities.ACTIONS_PER_YEAR, yearly: { activities: {}, milestones: 0 },
    events: createEventMemory(), pending: [], flags: {}, statLog: [], nextPersonId: 1, nextAssetId: 1, ended: null,
  };
  initRng(state, seed);
  const profile = generateProfile(state, custom);
  state.profile = profile;
  state.player = createPlayer(state, profile);
  People.createStartingFamily(state, profile);
  const child = profile.gender === 'female' ? 'girl' : 'boy';
  addJournal(state, `You were born a ${child} in ${profile.city}, ${profile.country}.`, 'milestone');
  addJournal(state, `Your birthday is ${profile.birthday}.`);
  addJournal(state, `Your name is ${profile.firstName} ${profile.lastName}.`);
  addJournal(state, `Your mother is ${profile.mother.name}, ${withArticle(profile.mother.job)} (age ${profile.mother.age}).`);
  addJournal(state, `Your father is ${profile.father.name}, ${withArticle(profile.father.job)} (age ${profile.father.age}).`);
  const sibling = People.siblings(state)[0];
  if (sibling) addJournal(state, `You have an older ${sibling.role} named ${People.firstName(sibling)} (age ${sibling.age}).`);
  return state;
}

// ---- Reading the state --------------------------------------------------------------------------------

export const isAlive = (state) => state.player.alive;
export const hasActionsLeft = (state) => state.actionsRemaining > 0;
export const canDoActivities = (state) => state.player.age >= Activities.ACTIVITY_MIN_AGE;
export const canShop = (state) => state.player.age >= SHOPPING_MIN_AGE;
export const canLookForJobs = (state) => state.player.age >= JOBS_MIN_AGE;
export const netWorth = Economy.netWorth;
export const yearlyExpenses = Economy.yearlyExpenses;
export const yearlyIncome = Economy.yearlyIncome;
export const currentModal = (state) => state.pending[0] || null;
export const lifeStageLabel = (state) => stageLabel(state.player.age);

// The decision the interface should show for a pending modal, resolved to plain data.
export function decisionFor(modal) {
  if (modal.eventId === 'afterHighSchool') return modal;
  return modal;
}

// ---- The year ------------------------------------------------------------------------------------------

export function ageUp(state) {
  if (!state.player.alive || state.pending.length > 0) return false;
  return processYear(state);
}

// Answers the first pending dialog. For decisions `choiceIndex` picks the option (the index the
// modal lists, not its position). Returns a follow-up screen name or null.
export function answerModal(state, choiceIndex = null) {
  const modal = state.pending.shift();
  if (!modal) return null;
  if (modal.kind !== 'decision') return null;
  let followUp = null;
  if (modal.eventId === 'afterHighSchool') followUp = resolveAfterHighSchool(state, choiceIndex);
  else if (modal.eventId === 'retirePrompt') { if (choiceIndex === 0) followUp = 'retire'; else addJournal(state, 'You decided to keep working for now.'); }
  else followUp = resolveEventDecision(state, modal, choiceIndex);
  if (followUp === 'retire') { Career.retire(state, true); followUp = null; }
  updateOccupation(state);
  return followUp;
}

// A "flip a coin" answer: a random option, using the game's own RNG so replays stay identical.
export function randomChoice(state, modal) {
  return pick(state, modal.choices).index;
}

// ---- Actions (each one uses one of the year's actions) ------------------------------------------------

function guard(state) {
  if (!state.player.alive) return { ok: false, title: 'Life Complete', text: 'This life has ended. Start a new life from the menu.' };
  if (!hasActionsLeft(state)) return { ok: false, title: 'Busy Year', text: 'You have done a lot this year. Press Age to continue.' };
  return null;
}

export function doActivity(state, activityId) {
  const blocked = guard(state);
  if (blocked) return blocked;
  const activity = Activities.findActivity(activityId);
  if (!activity) return { ok: false, title: 'Unknown', text: 'That activity does not exist.' };
  if (!canDoActivities(state)) return { ok: false, title: 'Too Young', text: `You are still too little for that. Activities open up at age ${Activities.ACTIVITY_MIN_AGE}.` };
  return Activities.perform(state, activity);
}

export function interactWith(state, personId, action) {
  const blocked = guard(state);
  if (blocked) return blocked;
  const person = People.findPerson(state, personId);
  if (!person || !person.alive) return { ok: false, title: 'Gone', text: 'That person is no longer part of your life.' };
  const allowed = People.actionsFor(state, person).some(([id]) => id === action);
  if (!allowed) return { ok: false, title: 'Not Yet', text: 'You cannot do that with them right now.' };
  const text = People.interact(state, person, action);
  if (text === null) return { ok: false, title: 'Not Enough Money', text: 'You cannot afford that right now.' };
  state.actionsRemaining -= 1;
  addJournal(state, text, ['propose', 'marry'].includes(action) ? 'milestone' : 'normal');
  return { ok: true, title: person.role === 'pet' ? person.name : People.firstName(person), text };
}

// One action spent on everyone at once: a smaller boost than one-to-one time, for the whole circle.
export function familyDay(state) {
  const blocked = guard(state);
  if (blocked) return blocked;
  const people = People.alive(state);
  if (people.length === 0) return { ok: false, title: 'Nobody Around', text: 'There is nobody in your life to spend the day with.' };
  state.actionsRemaining -= 1;
  for (const p of people) { People.changeCloseness(p, 3); p.interactedThisYear = true; }
  changeStat(state, 'happiness', 3, 'day with everyone');
  const text = `You spent a whole day with everyone in your life (${people.length} ${people.length === 1 ? 'person' : 'people'}).`;
  addJournal(state, text);
  return { ok: true, title: 'A Day Together', text };
}

export function studyAction(state, action) {
  const blocked = guard(state);
  if (blocked) return blocked;
  const e = state.education;
  if (!Education.isEnrolled(e)) return { ok: false, title: 'Not Enrolled', text: 'You are not in school right now.' };
  state.actionsRemaining -= 1;
  const done = state.yearly.activities[action] || 0;
  state.yearly.activities[action] = done + 1;
  const scale = done === 0 ? 1 : done === 1 ? 0.5 : 0.25;
  let text;
  switch (action) {
    case 'studyHarder': Education.changePerformance(e, Math.round(6 * scale)); changeStat(state, 'smarts', done === 0 ? 1 : 0, 'studied'); changeStat(state, 'happiness', -1, 'studied'); text = 'You put in extra study hours this term.'; break;
    case 'askTeacher': Education.changePerformance(e, Math.round(4 * scale)); changeStat(state, 'smarts', Math.round(1 * scale), 'asked for help'); text = 'You asked a teacher for extra help and it paid off.'; break;
    case 'skipClass': Education.changePerformance(e, -6); changeStat(state, 'happiness', 3, 'skipped class'); text = 'You skipped some classes to enjoy yourself.'; break;
    case 'joinClub': {
      const friend = People.addFriend(state);
      changeStat(state, 'happiness', 2, 'joined club');
      text = friend ? `You joined a school club and became friends with ${friend.name}.` : 'You joined a school club, but your circle of friends is already full.';
      break;
    }
    default: return { ok: false, title: 'Unknown', text: 'Unknown school action.' };
  }
  addJournal(state, text);
  return { ok: true, title: 'School', text };
}

export function jobAction(state, action) {
  const blocked = guard(state);
  if (blocked) return blocked;
  if (!Career.isEmployed(state.career)) return { ok: false, title: 'No Job', text: 'You do not have a job right now.' };
  let text;
  if (action === 'workHarder') text = Career.workHarder(state);
  else if (action === 'takeItEasy') text = Career.takeItEasy(state);
  else if (action === 'askForRaise') text = Career.askForRaise(state);
  else return { ok: false, title: 'Unknown', text: 'Unknown job action.' };
  state.actionsRemaining -= 1;
  addJournal(state, text);
  return { ok: true, title: 'Work', text };
}

// ---- Choices that do not cost an action -----------------------------------------------------------------

export function applyForCareer(state, careerId) {
  if (!state.player.alive) return { ok: false, title: 'Life Complete', text: 'This life has ended.' };
  const career = Careers.findCareer(careerId);
  if (!career) return { ok: false, title: 'Unknown', text: 'That job does not exist.' };
  if (!Career.isEligible(state, career)) return { ok: false, title: 'Not Qualified', text: `This position requires: ${Careers.requirementText(career)}.` };
  if (Career.isEmployed(state.career) && state.career.careerId === careerId) return { ok: false, title: 'Already Hired', text: 'You already work there.' };
  Career.hire(state, career);
  Career.resetUnemployment(state.career);
  updateOccupation(state);
  const title = career.ladder[0].title;
  return { ok: true, title: "You're Hired!", text: `You start as ${withArticle(title)} at ${career.employer}, earning $${career.ladder[0].salary.toLocaleString('en-US')} a year.`,
    facts: [['Title', title], ['Career', career.name], ['Employer', career.employer], ['Salary', `$${career.ladder[0].salary.toLocaleString('en-US')} / year`]] };
}

export function quitJob(state) {
  if (!Career.isEmployed(state.career)) return false;
  Career.quit(state);
  updateOccupation(state);
  return true;
}

export function retireNow(state) {
  if (!Career.canRetire(state)) return false;
  Career.retire(state, true);
  updateOccupation(state);
  return true;
}

export function enrollUniversity(state, major) {
  const e = state.education;
  if (!Education.canEnrollHigher(e) || e.degree) return false;
  Education.enrollInUniversity(e, major);
  updateOccupation(state);
  addJournal(state, `You enrolled at ${Education.UNIVERSITY_NAME} to study ${major}.`, 'milestone');
  return true;
}

export function enrollTradeSchool(state, trade) {
  const e = state.education;
  if (!Education.canEnrollHigher(e) || e.trade) return false;
  Education.enrollInTradeSchool(e, trade);
  updateOccupation(state);
  addJournal(state, `You enrolled at ${Education.TRADE_SCHOOL_NAME} to train in ${trade}.`, 'milestone');
  return true;
}

export function dropOut(state) {
  const e = state.education;
  if (!Education.isUniversity(e) && !Education.isTradeSchool(e)) return false;
  Education.dropOut(e);
  state.player.occupation = 'Unemployed';
  addJournal(state, 'You left your studies without finishing.', 'negative');
  changeStat(state, 'happiness', -3, 'dropped out');
  return true;
}

export function buyItem(state, shopId, itemId) {
  const shop = Assets.findShop(shopId);
  const item = Assets.findItem(itemId);
  if (!shop || !item) return 'unknown';
  if (!state.player.alive) return 'ended';
  return Assets.buy(state, shop, item);
}

export function sellAsset(state, assetId) {
  const asset = Assets.findAsset(state, assetId);
  if (!asset) return null;
  return Assets.sell(state, asset);
}

export function repairAsset(state, assetId) {
  const asset = Assets.findAsset(state, assetId);
  if (!asset) return false;
  return Assets.repair(state, asset);
}

export function eventTitle(eventId) {
  const e = findEvent(eventId);
  return e ? e.title : '';
}
