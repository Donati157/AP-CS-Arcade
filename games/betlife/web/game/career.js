// Employment: getting hired, doing the job year after year, raises, promotions, warnings,
// losing a job, quitting and retiring. Salary history is kept for the life summary.
import { chance, between } from './rng.js';
import { changeStat, clampStat } from './stats.js';
import { addJournal, info, pushModal } from './journal.js';
import { findCareer, meetsRequirements } from './careers.js';

export const RETIREMENT_MIN_AGE = 62;   // may retire voluntarily
export const RETIREMENT_PUSH_AGE = 70;  // employers start suggesting it
export const RETIREMENT_MAX_AGE = 78;   // full-time work ends by then
export const PENSION_SHARE = 0.45;      // of the final salary, scaled by years worked (30 years = full)

export function createCareer() {
  return {
    careerId: null, rung: 0, salary: 0, performance: 0, tenure: 0, rungTenure: 0, hiredAt: null,
    yearsWorked: 0, warnings: 0, workedHardThisYear: false, askedRaiseThisYear: false, lastRaiseAge: null,
    retired: false, retiredAt: null, pension: 0, history: [], earnings: 0, promotions: 0, raises: 0, stress: 0, hrThisYear: false,
  };
}

export const isEmployed = (career) => career.careerId !== null;
export const currentCareer = (career) => (isEmployed(career) ? findCareer(career.careerId) : null);
export function currentPosition(career) {
  const c = currentCareer(career);
  return c ? c.ladder[career.rung] : null;
}
export const jobTitle = (career) => (currentPosition(career) ? currentPosition(career).title : null);
export const employer = (career) => (currentCareer(career) ? currentCareer(career).employer : null);
export const canRetire = (state) => state.player.age >= RETIREMENT_MIN_AGE && !state.career.retired;

export function isEligible(state, careerDef) {
  return meetsRequirements(careerDef, state.player, state.education);
}

export function hire(state, careerDef) {
  const career = state.career;
  if (isEmployed(career)) leaveJob(state, 'moved on');
  career.careerId = careerDef.id;
  career.rung = 0;
  career.salary = careerDef.ladder[0].salary;
  career.performance = between(state, 60, 75);
  career.stress = between(state, 15, 30);
  career.tenure = 0;
  career.rungTenure = 0;
  career.hiredAt = state.player.age;
  career.warnings = 0;
  career.workedHardThisYear = false;
  career.retired = false;
  state.player.occupation = careerDef.ladder[0].title;
  state.player.livesWithParents = state.player.livesWithParents && careerDef.partTime;
  addJournal(state, `You were hired as ${aOrAn(careerDef.ladder[0].title)} at ${careerDef.employer}, earning $${career.salary.toLocaleString('en-US')} a year.`, 'milestone');
}

function aOrAn(title) {
  return (/^[aeiou]/i.test(title) ? 'an ' : 'a ') + title;
}

// Records the job in the history and clears the current position.
function leaveJob(state, reason) {
  const career = state.career;
  const def = currentCareer(career);
  career.history.push({ careerId: career.careerId, title: jobTitle(career), employer: def.employer, from: career.hiredAt,
    to: state.player.age, lastSalary: career.salary, years: career.tenure, reason });
  career.careerId = null;
  career.rung = 0;
  career.salary = 0;
  career.performance = 0;
  career.stress = 0;
  career.tenure = 0;
  career.rungTenure = 0;
  career.warnings = 0;
}

export function quit(state) {
  const title = jobTitle(state.career);
  leaveJob(state, 'resigned');
  state.player.occupation = 'Unemployed';
  addJournal(state, `You resigned from your job as ${aOrAn(title)}.`);
  changeStat(state, 'happiness', 2, 'resigned');
}

export function retire(state, voluntary = true) {
  const career = state.career;
  const years = career.yearsWorked;
  const last = isEmployed(career) ? career.salary : (career.history.length ? career.history[career.history.length - 1].lastSalary : 0);
  if (isEmployed(career)) leaveJob(state, 'retired');
  career.retired = true;
  career.retiredAt = state.player.age;
  career.pension = Math.round(last * PENSION_SHARE * Math.min(1, years / 30) / 100) * 100;
  state.player.occupation = 'Retired';
  state.player.retired = true;
  addJournal(state, voluntary ? `You retired after ${years} years of work.` : `Your company held a farewell party: after ${years} working years, you retired.`, 'milestone');
  changeStat(state, 'happiness', 6, 'retired');
  info(state, 'Retirement', `You retired at ${state.player.age}. ${career.pension > 0 ? `Your pension pays $${career.pension.toLocaleString('en-US')} a year.` : 'You never built up a pension, so money will be tight.'}`,
    { band: 'Career', tone: 'green', facts: [['Years worked', String(years)], ['Pension', career.pension > 0 ? `$${career.pension.toLocaleString('en-US')} / year` : 'None']] });
}

// ---- Job actions (each costs one of the year's actions; checked by the caller) --------------

export function workHarder(state) {
  const career = state.career;
  const done = state.yearly.activities.workHarder || 0;
  state.yearly.activities.workHarder = done + 1;
  changePerformance(career, Math.round(between(state, 6, 9) / (done + 1)));
  career.stress = clampStat(career.stress + (done === 0 ? 8 : 3));
  career.workedHardThisYear = true;
  if (done === 0) { changeStat(state, 'happiness', -2, 'worked harder'); changeStat(state, 'health', -1, 'worked harder'); }
  return 'You put in long hours and your work got noticed.';
}

export function takeItEasy(state) {
  changePerformance(state.career, -between(state, 3, 5));
  state.career.stress = clampStat(state.career.stress - 12);
  changeStat(state, 'happiness', 3, 'took it easy at work');
  return 'You coasted through the year at work.';
}

export function askForRaise(state) {
  const career = state.career;
  if (career.askedRaiseThisYear) return 'You already asked this year. Your manager suggested patience.';
  career.askedRaiseThisYear = true;
  const odds = 0.15 + (career.performance - 60) / 120 + Math.min(career.rungTenure, 4) * 0.05;
  if (chance(state, odds)) {
    const percent = between(state, 3, 7);
    applyRaise(state, percent, 'You asked for a raise and got one.');
    return `Your manager agreed to a ${percent}% raise.`;
  }
  changeStat(state, 'happiness', -2, 'raise refused');
  return 'Your manager said the budget could not stretch this year.';
}

// Human Resources: workplace requests. Each costs one action (checked by the caller).
export const HR_OPTIONS = [
  ['flexHours', 'Ask for flexible hours', 'Less stress, slightly less output'],
  ['training', 'Request training', 'Learn on the company\'s time'],
  ['transfer', 'Ask for a team change', 'A fresh start with new colleagues'],
  ['complaint', 'Report a problem', 'When a coworker makes work miserable'],
];

export function humanResources(state, option, coworker = null) {
  const career = state.career;
  career.hrThisYear = true;
  switch (option) {
    case 'flexHours':
      career.stress = clampStat(career.stress - 15); changePerformance(career, -2); changeStat(state, 'happiness', 3, 'flexible hours');
      return 'HR approved flexible hours. Your mornings got a lot calmer.';
    case 'training':
      changePerformance(career, 4); changeStat(state, 'smarts', 2, 'HR training');
      return 'HR signed you up for a training course, and it paid off at work.';
    case 'transfer':
      career.stress = clampStat(career.stress - 10); changePerformance(career, between(state, -3, 3)); changeStat(state, 'happiness', 2, 'team change');
      return 'HR moved you to a different team. New faces, new coffee machine.';
    case 'complaint':
      if (coworker) { coworker.closeness = Math.min(100, coworker.closeness + 15); coworker.interactedThisYear = true; }
      career.stress = clampStat(career.stress - 8); changeStat(state, 'happiness', 2, 'HR complaint');
      return coworker ? `HR mediated your problem with ${coworker.name.split(' ')[0]}, and things settled down.` : 'HR listened to your complaint and promised to keep an eye on things.';
    default:
      return null;
  }
}

export function changePerformance(career, amount) {
  career.performance = clampStat(career.performance + amount);
}

export const SALARY_CAP = 2.0;      // a position pays at most this multiple of its listed salary
export const COMFORT_ZONE = 1.3;    // above this multiple only small cost-of-living raises remain

function applyRaise(state, percent, journalText) {
  const career = state.career;
  const cap = Math.round(currentPosition(career).salary * SALARY_CAP);
  career.salary = Math.min(cap, Math.round(career.salary * (1 + percent / 100) / 10) * 10);
  career.raises += 1;
  career.lastRaiseAge = state.player.age;
  addJournal(state, `${journalText} Your salary is now $${career.salary.toLocaleString('en-US')}.`, 'positive');
}

// ---- One working year -------------------------------------------------------------------------

export function processCareerYear(state) {
  const career = state.career;
  const age = state.player.age;
  if (career.retired) return;
  if (!isEmployed(career)) {
    if (age >= 22 && age < 62 && state.education.highSchoolGraduate !== undefined) unemploymentPressure(state);
    return;
  }
  const def = currentCareer(career);
  career.tenure += 1;
  career.rungTenure += 1;
  career.yearsWorked += 1;
  career.earnings += career.salary;

  // Performance drifts: hard work holds it up, neglect lets it slide, and a bit of luck.
  let drift = career.workedHardThisYear ? between(state, -3, 1) : between(state, -4, 1);
  if (state.player.smarts >= 75) drift += 1;
  if (state.player.happiness < 30) drift -= 2;
  if (state.player.health < 35) drift -= 2;
  changePerformance(career, drift);
  // Stress builds with responsibility and eases with time off; high stress costs health and happiness.
  career.stress = clampStat(career.stress + between(state, -9, 3) + career.rung - (state.yearly.activities.vacation ? 12 : 0));
  if (career.stress >= 70) { changeStat(state, 'happiness', -2, 'work stress'); changeStat(state, 'health', -1, 'work stress'); }
  career.workedHardThisYear = false;
  career.askedRaiseThisYear = false;
  career.hrThisYear = false;

  if (def.partTime) {
    if (age >= 19 && chance(state, 0.5)) {
      leaveJob(state, 'left');
      state.player.occupation = 'Unemployed';
      addJournal(state, `Your part-time job as ${aOrAn(def.ladder[0].title)} came to an end.`);
    }
    return;
  }

  // Poor performance: a warning first, then the job is at risk.
  if (career.performance < 30) {
    career.warnings += 1;
    if (career.warnings >= 2 && chance(state, 0.6)) {
      const title = jobTitle(career);
      leaveJob(state, 'let go');
      state.player.occupation = 'Unemployed';
      addJournal(state, `${def.employer} let you go from your job as ${aOrAn(title)} after repeated warnings.`, 'negative');
      changeStat(state, 'happiness', -12, 'lost job');
      info(state, 'Let Go', `After repeated warnings about your performance, ${def.employer} ended your employment as ${aOrAn(title)}.`, { band: 'Career', tone: 'red' });
      return;
    }
    addJournal(state, `Your manager gave you a formal warning about your performance.`, 'negative');
    changeStat(state, 'happiness', -4, 'work warning');
    return;
  }
  if (career.performance >= 45) career.warnings = 0;

  // Promotion: needs time at the current rung, good performance and a bit of luck.
  const next = def.ladder[career.rung + 1];
  const pos = def.ladder[career.rung];
  if (next && career.rungTenure >= pos.minYears && career.performance >= 65 && age < RETIREMENT_PUSH_AGE) {
    const odds = 0.2 + (career.performance - 65) / 100 + (career.rungTenure - pos.minYears) * 0.08;
    if (chance(state, odds)) {
      career.rung += 1;
      career.rungTenure = 0;
      career.promotions += 1;
      const old = career.salary;
      career.salary = Math.max(next.salary, Math.round(old * 1.12 / 10) * 10);
      const percent = Math.round((career.salary / old - 1) * 100);
      career.performance = clampStat(career.performance - 8);
      state.player.occupation = next.title;
      addJournal(state, `${def.employer} promoted you to ${next.title} with a salary of $${career.salary.toLocaleString('en-US')}.`, 'milestone');
      changeStat(state, 'happiness', 7, 'promoted');
      info(state, 'Promotion', `You have been promoted to ${next.title}.`, { band: 'Career', tone: 'blue',
        facts: [['New title', next.title], ['New salary', `$${career.salary.toLocaleString('en-US')} (+${percent}%)`], ['Employer', def.employer]] });
      return;
    }
  }

  // Raise: most good years earn one; great performance earns bigger ones.
  const atCap = career.salary >= Math.round(pos.salary * SALARY_CAP);
  const comfortable = career.salary >= Math.round(pos.salary * COMFORT_ZONE);
  const raiseOdds = atCap ? 0 : comfortable ? 0.35 : career.performance >= 80 ? 0.6 : career.performance >= 60 ? 0.4 : career.performance >= 45 ? 0.15 : 0;
  if (chance(state, raiseOdds)) {
    const percent = comfortable ? between(state, 1, 2) : career.performance >= 80 ? between(state, 4, 7) : between(state, 2, 4);
    applyRaise(state, percent, `You received a ${percent}% raise.`);
    changeStat(state, 'happiness', 2, 'raise');
  } else if (career.performance < 45 && chance(state, 0.5)) {
    addJournal(state, 'Your performance review was mixed, and there was no raise this year.');
  }

  // Retirement: the question comes up every other year from 65, employers push from 70, and by 78 it is certain.
  if (age >= RETIREMENT_MAX_AGE || (age >= RETIREMENT_PUSH_AGE && chance(state, 0.4))) {
    retire(state, false);
  } else if (age >= 65 && (age - 65) % 2 === 0) {
    const years = career.yearsWorked;
    const pension = Math.round(career.salary * PENSION_SHARE * Math.min(1, years / 30) / 100) * 100;
    pushModal(state, { kind: 'decision', eventId: 'retirePrompt', band: 'Career', title: 'Time to Retire?',
      text: `You are ${age} and have worked for ${years} years. Colleagues are starting to ask about your plans.`,
      facts: [['Position', jobTitle(career)], ['Salary', `$${career.salary.toLocaleString('en-US')} / year`], ['Pension if you retire', `$${pension.toLocaleString('en-US')} / year`]],
      choices: [{ label: 'Retire this year', index: 0 }, { label: 'Keep working', index: 1 }] });
  }
}

// Being an adult without work for a long time wears on happiness; jobs are on the Occupation screen.
function unemploymentPressure(state) {
  if (state.education.stage !== 'none') return;
  state.career.unemployedYears = (state.career.unemployedYears || 0) + 1;
  if (state.career.unemployedYears >= 2) changeStat(state, 'happiness', -3, 'unemployed');
}

export function resetUnemployment(career) {
  career.unemployedYears = 0;
}

export function careerSummary(career) {
  const held = [...career.history];
  if (isEmployed(career)) held.push({ title: jobTitle(career), employer: employer(career), years: career.tenure, lastSalary: career.salary });
  if (held.length === 0) return null;
  const best = held.reduce((a, b) => (b.lastSalary > a.lastSalary ? b : a));
  return { jobs: held, best, yearsWorked: career.yearsWorked, earnings: career.earnings, promotions: career.promotions, raises: career.raises };
}

