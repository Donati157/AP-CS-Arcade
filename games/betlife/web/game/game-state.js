// The public face of the simulation: create a life, take actions, answer dialogs, age up, save.
// The interface only talks to this module (and reads state); it never edits state directly.
import { initRng, seedFromClock, pick } from './rng.js';
import { createPlayer, stageLabel } from './player.js';
import { generateProfile, withArticle, PLACES } from './life-generator.js';
import { addJournal } from './journal.js';
import * as People from './people.js';
import * as Education from './education.js';
import * as Career from './career.js';
import * as Careers from './careers.js';
import * as Assets from './assets.js';
import * as Activities from './activities.js';
import * as Economy from './economy.js';
import { createEventMemory, resolveDecision as resolveEventDecision } from './events/engine.js';
import * as Pets from './pets.js';
import { awardBadges } from './year.js';
import { info } from './journal.js';
import { chance, between } from './rng.js';
import { findEvent } from './events/catalog.js';
import { ageUp as processYear, resolveAfterHighSchool, updateOccupation } from './year.js';
import { changeStat, changeMoney } from './stats.js';
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
  if (modal.kind === 'minigame') { finishMinigame(state, modal, choiceIndex === true); return null; }
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
  const result = Activities.perform(state, activity);
  awardBadges(state);
  return result;
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
  addJournal(state, text, ['propose', 'marry', 'startFamily'].includes(action) ? 'milestone' : 'normal');
  awardBadges(state);
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

export function freelanceGig(state) {
  const blocked = guard(state);
  if (blocked) return blocked;
  if (state.player.age < 16) return { ok: false, title: 'Too Young', text: 'Freelance work opens up at 16.' };
  state.actionsRemaining -= 1;
  const done = state.yearly.activities.freelance || 0;
  state.yearly.activities.freelance = done + 1;
  const pay = Math.round((200 + state.player.smarts * 8) / (done + 1) / 10) * 10;
  changeMoney(state, pay, 'freelance gig');
  changeStat(state, 'smarts', done === 0 ? 1 : 0, 'freelance gig');
  const text = `You took a freelance gig and earned $${pay.toLocaleString('en-US')}.`;
  addJournal(state, text);
  return { ok: true, title: 'Freelance Gig', text };
}

// The recruiter finds the best-paying job you qualify for, for a fee.
export function jobRecruiter(state) {
  if (!state.player.alive) return { ok: false, title: 'Life Complete', text: 'This life has ended.' };
  const fee = 1000;
  if (state.player.money < fee) return { ok: false, title: 'Not Enough Money', text: `The recruiter charges $${fee.toLocaleString('en-US')}.` };
  const options = Careers.CAREERS.filter((c) => !c.partTime && Career.isEligible(state, c) && c.id !== state.career.careerId)
    .sort((a, b) => b.ladder[0].salary - a.ladder[0].salary);
  if (options.length === 0) return { ok: false, title: 'No Matches', text: 'The recruiter could not find anything you qualify for right now.' };
  changeMoney(state, -fee, 'job recruiter');
  return applyForCareer(state, options[0].id);
}

export function changeName(state, firstName, lastName) {
  const first = String(firstName || '').trim().slice(0, 20);
  const last = String(lastName || '').trim().slice(0, 20);
  if (!first || !last) return { ok: false, title: 'Name Change', text: 'Please enter both a first and a last name.' };
  const blocked = guard(state);
  if (blocked) return blocked;
  if (state.player.money < 120) return { ok: false, title: 'Not Enough Money', text: 'A legal name change costs $120.' };
  state.actionsRemaining -= 1;
  changeMoney(state, -120, 'name change');
  const old = state.player.name;
  state.player.firstName = first; state.player.lastName = last; state.player.name = `${first} ${last}`;
  const text = `You legally changed your name from ${old} to ${state.player.name}.`;
  addJournal(state, text, 'milestone');
  return { ok: true, title: 'Name Change', text };
}

// The facts needed to try the same profile again after a life ends.
export function retryProfile(state) {
  const p = state.profile;
  const placeIndex = PLACES.findIndex((pl) => pl.city === p.city && pl.country === p.country);
  return { firstName: p.firstName, lastName: p.lastName, gender: p.gender, placeIndex };
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
  awardBadges(state);
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

export function enrollProgram(state, programId) {
  const program = Education.PROGRAMS[programId];
  if (!program || !Education.canEnrollProgram(state.education, program)) return false;
  Education.enrollInProgram(state.education, programId);
  updateOccupation(state);
  addJournal(state, `You enrolled at ${program.school}.`, 'milestone');
  return true;
}

export function humanResources(state, option) {
  const blocked = guard(state);
  if (blocked) return blocked;
  if (!Career.isEmployed(state.career)) return { ok: false, title: 'No Job', text: 'You do not have a job right now.' };
  if (state.career.hrThisYear) return { ok: false, title: 'Human Resources', text: 'HR already handled a request from you this year.' };
  const coworker = People.byRole(state, 'coworker').sort((a, b) => a.closeness - b.closeness)[0] || null;
  const text = Career.humanResources(state, option, option === 'complaint' ? coworker : null);
  if (!text) return { ok: false, title: 'Human Resources', text: 'Unknown request.' };
  state.actionsRemaining -= 1;
  addJournal(state, text);
  return { ok: true, title: 'Human Resources', text };
}

export function assetAction(state, assetId, action, personId = null) {
  const blocked = guard(state);
  if (blocked) return blocked;
  const asset = Assets.findAsset(state, assetId);
  if (!asset) return { ok: false, title: 'Gone', text: 'You no longer own that.' };
  let text = null;
  if (action === 'drive') text = Assets.drive(state, asset);
  else if (action === 'maintenance') text = Assets.maintenance(state, asset);
  else if (action === 'scrap') text = Assets.scrap(state, asset);
  else if (action === 'abandon') text = Assets.abandon(state, asset);
  else if (action === 'renovate') text = Assets.renovate(state, asset);
  else if (action === 'gift') { const who = People.findPerson(state, personId); if (!who) return { ok: false, title: 'Gift', text: 'Choose someone to give it to.' }; text = Assets.gift(state, asset, who); }
  else return { ok: false, title: 'Unknown', text: 'Unknown action.' };
  if (text === null) return { ok: false, title: 'Not Enough Money', text: 'You cannot afford that right now.' };
  state.actionsRemaining -= 1;
  addJournal(state, text);
  return { ok: true, title: asset.name, text };
}

export function adoptFromSource(state, sourceId, animalId) {
  const blocked = guard(state);
  if (blocked) return blocked;
  const source = Pets.SOURCES.find((s) => s.id === sourceId);
  if (!source) return { ok: false, title: 'Unknown', text: 'That place does not exist.' };
  if (state.player.age < source.minAge) return { ok: false, title: 'Too Young', text: `You can visit from age ${source.minAge}.` };
  if (People.pets(state).length >= 3) return { ok: false, title: 'Full House', text: 'Three pets is plenty for now.' };
  const animal = Pets.inventory(state, source).find((a) => a.id === animalId);
  if (!animal) return { ok: false, title: 'Gone', text: 'That animal already found a home.' };
  const result = Pets.adopt(state, source, animal);
  if (!result) return { ok: false, title: 'Not Enough Money', text: `The fee is $${animal.fee}.` };
  changeMoney(state, -animal.fee, `adopted ${animal.name}`);
  state.actionsRemaining -= 1;
  changeStat(state, 'happiness', 4, `adopted ${animal.name}`);
  state.flags.adoptedFrom = [...(state.flags.adoptedFrom || []), animal.id];
  const text = `You adopted ${animal.name}, a ${animal.age === 0 ? 'baby' : `${animal.age}-year-old`} ${animal.breed.toLowerCase()}, from ${source.name}.`;
  addJournal(state, text, 'positive');
  return { ok: true, title: 'New Pet', text };
}

// Mini-games queued by events. `passed` comes from the interface.
export function finishMinigame(state, modal, passed) {
  if (modal.game === 'drivingQuiz') {
    if (passed) { state.player.hasLicence = true; changeStat(state, 'happiness', 4, 'driving licence'); addJournal(state, 'You passed your driving test and got your license.', 'milestone'); }
    else { changeStat(state, 'happiness', -2, 'failed driving test'); addJournal(state, 'You failed your driving test. Better luck next year.', 'negative'); }
  } else if (modal.game === 'eyeExam') {
    if (passed) { changeStat(state, 'health', 1, 'eye exam'); addJournal(state, 'You passed your eye exam.'); }
    else { state.flags.glasses = true; changeStat(state, 'smarts', 1, 'new glasses'); changeStat(state, 'looks', -1, 'new glasses'); addJournal(state, 'You failed the eye exam and got glasses. The board at school suddenly made sense.'); }
  }
}

// Continue the story as one of the character's children after a life ends.
export function continueAsChild(state, childId) {
  const child = People.findPerson(state, childId);
  if (!child || !state.player.alive === false && !child.alive) return null;
  const inheritance = Economy.netWorth(state);
  const next = createNewGame({ firstName: People.firstName(child), lastName: child.name.split(' ').slice(1).join(' ') || state.player.lastName, gender: child.gender, placeIndex: PLACES.findIndex((p) => `${p.city}, ${p.country}` === state.player.residence) });
  const p = next.player;
  p.age = child.age; p.happiness = child.traits ? Math.round((child.traits.kindness + 60) / 2) : 65; p.smarts = child.traits ? child.traits.smarts : between(next, 30, 80); p.looks = child.traits ? child.traits.looks : between(next, 30, 80);
  p.money = Math.max(0, Math.round(inheritance)); p.livesWithParents = child.age < 22; p.hasLicence = child.age >= 18; p.residence = state.player.residence;
  next.timeline = [];
  next.relationships = [];
  const spouse = state.relationships.find((r) => r.role === 'spouse' && r.alive);
  if (spouse) next.relationships.push({ ...spouse, id: `p${next.nextPersonId++}`, role: spouse.gender === 'female' ? 'mother' : 'father', closeness: 80, since: 0, interactedThisYear: false });
  for (const sib of People.children(state).filter((k) => k.id !== child.id)) next.relationships.push({ ...sib, id: `p${next.nextPersonId++}`, role: sib.gender === 'female' ? 'sister' : 'brother', closeness: 65, since: 0, interactedThisYear: false });
  for (const pet of People.pets(state)) next.relationships.push({ ...pet, id: `p${next.nextPersonId++}`, closeness: 60, since: 0, interactedThisYear: false });
  if (child.age >= 18) { next.education.highSchoolGraduate = true; }
  else if (child.age >= 5) { Education.startSchool(next.education); next.education.year = child.age - 5; }
  addJournal(next, `Your ${state.player.gender === 'female' ? 'mother' : 'father'}, ${state.player.name}, passed away at ${state.player.age}. You inherited $${p.money.toLocaleString('en-US')} and carry the story on.`, 'milestone');
  updateOccupation(next);
  awardBadges(next);
  return next;
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

// ---- Social media (original platforms) --------------------------------------------------------------
export const SOCIAL_PLATFORMS = [
  { id: 'chirper', name: 'Chirper', icon: '🐦', sub: 'Sign up for Chirper' },
  { id: 'streamly', name: 'Streamly', icon: '📺', sub: 'Sign up for Streamly' },
  { id: 'soundwave', name: 'SoundWave', icon: '☁️', sub: 'Sign up for SoundWave' },
  { id: 'snapshot', name: 'Snapshot', icon: '📸', sub: 'Sign up for Snapshot' },
];
export const SOCIAL_MIN_AGE = 13;
export function socialAccounts(state) { return state.social || (state.social = {}); }
export function socialSignUp(state, platformId) {
  const blocked = guard(state);
  if (blocked) return blocked;
  if (state.player.age < SOCIAL_MIN_AGE) return { ok: false, title: 'Too Young', text: `You can sign up at ${SOCIAL_MIN_AGE}.` };
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
  if (!platform) return { ok: false, title: 'Unknown', text: 'That platform does not exist.' };
  const accounts = socialAccounts(state);
  if (accounts[platformId]) return { ok: false, title: 'Already Signed Up', text: `You already have a ${platform.name} account.` };
  state.actionsRemaining -= 1;
  accounts[platformId] = { followers: between(state, 3, 40), since: state.player.age, posts: 0 };
  const text = `You signed up for ${platform.name}.`;
  addJournal(state, text);
  return { ok: true, title: platform.name, text };
}
export function socialPost(state, platformId) {
  const blocked = guard(state);
  if (blocked) return blocked;
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
  const account = socialAccounts(state)[platformId];
  if (!platform || !account) return { ok: false, title: 'No Account', text: 'Sign up first.' };
  state.actionsRemaining -= 1;
  account.posts += 1;
  const gain = Math.round(between(state, 1, 12) * (1 + state.player.looks / 100 + Math.max(0, account.followers) / 400));
  account.followers += gain;
  changeStat(state, 'happiness', 1, `posted on ${platform.name}`);
  const text = `You posted on ${platform.name} and picked up ${gain.toLocaleString('en-US')} new followers.`;
  addJournal(state, text);
  return { ok: true, title: platform.name, text };
}
export function socialDelete(state, platformId) {
  const accounts = socialAccounts(state);
  const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
  if (!accounts[platformId] || !platform) return { ok: false, title: 'No Account', text: 'Nothing to delete.' };
  delete accounts[platformId];
  addJournal(state, `You deleted your ${platform.name} account.`);
  return { ok: true, title: platform.name, text: 'Account deleted.' };
}
