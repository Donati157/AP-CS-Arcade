// One press of Age: exactly one year passes, processed in this fixed order.
//
//   1. age +1, reset the yearly counters
//   2. education (start school, next grade, graduations)
//   3. career (tenure, performance, raises, promotions, warnings, job loss, retirement)
//   4. belongings wear and money (income, bills, tuition, debt)
//   5. everyone else ages (closeness fades, milestones, losses)
//   6. stat settlement (age, lifestyle and circumstances move the four stats)
//   7. random life events and decisions
//   8. end-of-life check
//   9. occupation label refresh
// The interface saves and re-renders afterwards. Nothing here runs twice for the same year.
import { between } from './rng.js';
import { changeStat } from './stats.js';
import { addJournal, info, pushModal } from './journal.js';
import * as Education from './education.js';
import * as Career from './career.js';
import * as People from './people.js';
import * as Assets from './assets.js';
import * as Economy from './economy.js';
import { ACTIONS_PER_YEAR, pocketMoney } from './activities.js';
import { runYearlyEvents, personRequest } from './events/engine.js';
import { checkMortality } from './mortality.js';
import { stageId } from './player.js';
import { checkBadges } from './badges.js';

export function ageUp(state) {
  const p = state.player;
  if (!p.alive) return false;

  // 1. new year
  p.age += 1;
  state.actionsRemaining = ACTIONS_PER_YEAR;
  state.yearly = { activities: {}, milestones: 0 };
  const journalStart = state.timeline.length;

  // 2. education
  processEducation(state);

  // 3. career
  if (state.pendingQuit) { state.pendingQuit = false; if (Career.isEmployed(state.career)) Career.quit(state); }
  Career.processCareerYear(state);

  // 4. belongings and money
  const upkeep = Assets.processAssetsYear(state);
  Economy.processFinances(state, upkeep);
  pocketMoney(state);
  if (p.age === 18 && p.livesWithParents && !Education.isEnrolled(state.education) && !Career.isEmployed(state.career)) {
    // Adults without school or work eventually move out at 22 (handled below); until then they stay home.
  }
  if (p.age >= 22 && p.livesWithParents && !Education.isEnrolled(state.education)) {
    p.livesWithParents = false;
    addJournal(state, 'You moved out of your parents’ home and started paying your own way.', 'milestone');
  }

  // 5. everyone else
  People.ageRelationships(state);

  // 6. stats
  settleStats(state);

  // 7. events
  const milestones = state.timeline.slice(journalStart).filter((e) => e.kind === 'milestone').length;
  runYearlyEvents(state, milestones);

  // 8. end of life
  const cause = checkMortality(state);
  if (cause) endLife(state, cause);

  // 9. labels and badges
  updateOccupation(state);
  socialYear(state);
  awardBadges(state);
  return true;
}

// Badges are feedback only; new ones are queued as banners for the interface.
export function awardBadges(state) {
  const earned = checkBadges(state);
  for (const b of earned) state.pending.push({ kind: 'badge', id: b.id, name: b.name, desc: b.desc });
  return earned;
}

function processEducation(state) {
  const e = state.education;
  const p = state.player;
  if (!Education.isEnrolled(e)) {
    if (p.age === Education.SCHOOL_START_AGE && !e.highSchoolGraduate && !e.droppedOut) {
      Education.startSchool(e);
      addJournal(state, `You started kindergarten at ${Education.ELEMENTARY_NAME}.`, 'milestone');
      info(state, 'School Begins', `You are starting school at ${Education.ELEMENTARY_NAME}.`, { band: 'School', tone: 'blue',
        facts: [['School', Education.ELEMENTARY_NAME], ['Level', 'Elementary School'], ['Years', '6']] });
      classmateFriend(state, 'kindergarten');
    }
    return;
  }
  const wasSchool = e.stage === 'school';
  const completed = Education.advanceYear(e);
  if (wasSchool && !completed && e.year === Education.FIRST_MIDDLE_GRADE) {
    addJournal(state, `You started middle school at ${Education.MIDDLE_SCHOOL_NAME}.`, 'milestone');
    info(state, 'Middle School', `You are moving up to ${Education.MIDDLE_SCHOOL_NAME}.`, { band: 'School', facts: [['School', Education.MIDDLE_SCHOOL_NAME], ['Level', 'Middle School'], ['Years', '3']] });
    classmateFriend(state, 'middle school');
  } else if (wasSchool && !completed && e.year === Education.FIRST_HIGH_GRADE) {
    addJournal(state, `You started high school at ${Education.HIGH_SCHOOL_NAME}.`, 'milestone');
    info(state, 'High School', `Welcome to ${Education.HIGH_SCHOOL_NAME}.`, { band: 'School', facts: [['School', Education.HIGH_SCHOOL_NAME], ['Level', 'High School'], ['Years', '4']] });
  }
  if (completed === 'highSchool') {
    const grade = Education.gradeLetter(Education.averageGrade(e));
    addJournal(state, `You graduated from ${Education.HIGH_SCHOOL_NAME} with a ${grade} average.`, 'milestone');
    p.occupation = 'High School Graduate';
    changeStat(state, 'happiness', 4, 'graduated high school');
    pushModal(state, { kind: 'decision', eventId: 'afterHighSchool', band: 'School', title: "What's Next?",
      text: 'High school is behind you. What do you want to do now?', facts: [['Average grade', grade], ['Smarts', `${p.smarts}%`]],
      choices: [{ label: 'Apply to university', index: 0 }, { label: 'Go to trade school', index: 1 }, { label: 'Look for a job', index: 2 }, { label: 'Take a year off', index: 3 }] });
  } else if (completed === 'university') {
    addJournal(state, `You graduated from ${Education.UNIVERSITY_NAME} with a degree in ${e.degree}.`, 'milestone');
    p.occupation = 'Unemployed';
    changeStat(state, 'happiness', 6, 'university degree');
    changeStat(state, 'smarts', 3, 'university degree');
    info(state, 'Graduation Day', `You earned your degree in ${e.degree} from ${Education.UNIVERSITY_NAME}. Time to find work on the Occupation screen.`, { band: 'University', tone: 'green' });
  } else if (completed === 'program') {
    const credential = e.credentials[e.credentials.length - 1];
    addJournal(state, `You completed ${credential === 'MBA' ? 'business school with an MBA' : credential === "Master's" ? `graduate school with a master's degree` : `${credential.toLowerCase()} school`}.`, 'milestone');
    p.occupation = 'Unemployed';
    changeStat(state, 'happiness', 6, 'program completed');
    changeStat(state, 'smarts', 3, 'program completed');
    info(state, 'Graduation Day', `You finished ${Education.schoolName({ stage: 'program', program: Object.values(Education.PROGRAMS).find((pr) => pr.credential === credential).id })}. New careers are open on the Occupation screen.`, { band: 'University', tone: 'green' });
  } else if (completed === 'trade') {
    addJournal(state, `You earned your ${e.trade} certificate from ${Education.TRADE_SCHOOL_NAME}.`, 'milestone');
    p.occupation = 'Unemployed';
    changeStat(state, 'happiness', 5, 'trade certificate');
    changeStat(state, 'smarts', 2, 'trade certificate');
    info(state, 'Certified', `You finished trade school with a ${e.trade} certificate. Jobs in your trade are waiting on the Occupation screen.`, { band: 'Trade School', tone: 'green' });
  }
}

// The choice from the "What's next?" dialog after high school.
export function resolveAfterHighSchool(state, choiceIndex) {
  const p = state.player;
  switch (choiceIndex) {
    case 0: addJournal(state, 'You decided to apply to university.'); return 'university';
    case 1: addJournal(state, 'You decided to learn a trade.'); return 'tradeSchool';
    case 2: addJournal(state, 'You decided to start working right away.'); p.occupation = 'Unemployed'; return 'jobs';
    default: addJournal(state, 'You took a year off to figure things out.'); p.occupation = 'Taking Time Off'; changeStat(state, 'happiness', 3, 'year off'); return null;
  }
}

// A classmate becomes a friend when school starts, so childhood is not spent alone.
function socialYear(state) {
  const accounts = state.social || {};
  for (const account of Object.values(accounts)) account.followers = Math.max(0, Math.round(account.followers * (0.97 + state.player.looks / 1000)));
}

function classmateFriend(state, where) {
  const friend = People.addFriend(state, { age: state.player.age + between(state, -1, 1), occupation: 'student' });
  if (!friend) return;
  personRequest(state, friend, 'friendRequest');
}

// ---- Stat settlement: how age and circumstances move the four stats each year ------------------

export function happinessBaseline(state) {
  const p = state.player;
  let base = 50;
  if (p.age < 13) base += 10;       // childhood is carefree by default
  else if (p.age < 18) base += 5;
  const love = People.partner(state);
  if (love) base += love.closeness >= 50 ? 8 : 2;
  base += Math.min(3, People.friends(state).length) * 3;
  const family = People.parents(state).concat(People.siblings(state), People.children(state));
  if (family.length && family.reduce((s, r) => s + r.closeness, 0) / family.length >= 60) base += 4;
  if (People.pets(state).length) base += 2;
  if (Career.isEmployed(state.career)) base += Career.currentCareer(state.career).partTime ? 2 : 6;
  else if (p.age >= 20 && !Education.isEnrolled(state.education) && !state.career.retired) base -= 10;
  if (state.career.retired) base += 4;
  if (p.money < 0) base -= 8;
  else if (p.money >= 20000) base += 4;
  if (p.health < 40) base -= 8;
  else if (p.health >= 75) base += 3;
  if (Education.isEnrolled(state.education) && state.education.performance >= 75) base += 3;
  return Math.max(20, Math.min(90, base));
}

export function settleStats(state) {
  const p = state.player;
  const age = p.age;
  const acts = state.yearly.activities;
  const count = (...ids) => ids.reduce((n, id) => n + (acts[id] || 0), 0);

  // Health: children grow toward good health; adults slowly lose it, faster with age; habits help.
  let health;
  if (age < 20) health = Math.round((85 - p.health) * 0.12) + between(state, -1, 1);
  else if (age < 35) health = between(state, -1, 1);
  else if (age < 50) health = between(state, -2, 0);
  else if (age < 65) health = between(state, -3, 0);
  else if (age < 80) health = between(state, -3, -1);
  else health = between(state, -5, -2);
  health += Math.min(3, count('walk', 'gym', 'sports', 'martialArts', 'diet', 'checkup', 'meditate', 'walkPet'));
  if (p.health < 30) health += age < 60 ? 2 : 1;
  changeStat(state, 'health', health, 'yearly settlement');

  // Happiness: drifts toward what life currently looks like, with some noise.
  const base = happinessBaseline(state);
  changeStat(state, 'happiness', Math.round((base - p.happiness) * 0.3) + between(state, -3, 3), 'yearly settlement');

  // Looks: rise in the teens, hold in the twenties, ease down later; self-care slows it.
  let looks;
  if (age >= 13 && age <= 17) looks = between(state, 0, 2);
  else if (age >= 18 && age <= 34) looks = between(state, -1, 1);
  else if (age >= 35 && age <= 55) looks = between(state, -1, 0);
  else if (age > 55 && age <= 75) looks = between(state, -2, 0);
  else if (age > 75) looks = between(state, -3, 0);
  else looks = 0;
  looks += Math.min(1, count('selfCare', 'gym'));
  changeStat(state, 'looks', looks, 'yearly settlement');

  // Smarts: school builds it, good grades build it faster, very late life eases it.
  let smarts = 0;
  const learning = count('readBook', 'memory', 'library', 'studyHarder', 'askTeacher');
  if (Education.isEnrolled(state.education)) smarts += state.education.performance >= 75 ? 1 : 0;
  else if (p.smarts >= 80 && learning === 0) smarts -= 1; // skills fade when unused
  if (age >= 60) smarts -= between(state, 0, 1);
  if (age >= 80) smarts -= 1;
  if (age >= 60 && learning > 0) smarts += 1;
  changeStat(state, 'smarts', smarts, 'yearly settlement');
}

// ---- End of life -----------------------------------------------------------------------------------

export function endLife(state, cause) {
  const p = state.player;
  p.alive = false;
  p.deathAge = p.age;
  p.deathCause = cause;
  p.occupation = 'Deceased';
  addJournal(state, `You passed away at the age of ${p.age}, ${cause}. Your net worth at the end was $${Economy.netWorth(state).toLocaleString('en-US')}.`, 'milestone');
  state.ended = { age: p.age, cause };
  state.pending = state.pending.filter((m) => m.kind !== 'decision');
  pushModal(state, { kind: 'death' });
}

export function updateOccupation(state) {
  const { player, education, career } = state;
  if (!player.alive) { player.occupation = 'Deceased'; return; }
  if (Career.isEmployed(career)) { player.occupation = Career.jobTitle(career); return; }
  if (career.retired) { player.occupation = 'Retired'; return; }
  if (education.stage === 'university') player.occupation = 'University Student';
  else if (education.stage === 'trade') player.occupation = 'Trade School Student';
  else if (education.stage === 'program') player.occupation = `${Education.currentProgram(education).name} Student`;
  else if (education.stage === 'school') player.occupation = `${Education.schoolLevel(education)} Student`;
  else if (player.age <= 3) player.occupation = 'Infant';
  else if (player.age < Education.SCHOOL_START_AGE) player.occupation = 'Child';
  else if (player.age < 18) player.occupation = 'Teenager';
  else if (!['High School Graduate', 'Taking Time Off', 'Unemployed'].includes(player.occupation)) player.occupation = 'Unemployed';
}

export const stageOfState = (state) => stageId(state.player.age);
