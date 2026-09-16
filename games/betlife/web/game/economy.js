// Money over a year: income, taxes, living costs, tuition and debt. Simple on purpose.
import { changeMoney, changeStat } from './stats.js';
import { addJournal } from './journal.js';
import * as Career from './career.js';
import * as Education from './education.js';
import * as People from './people.js';

export const RENT = 9000;             // a year of renting when the player does not own a home
export const LIFESTYLE_SHARE = 0.35;   // living costs grow with income: nicer places, nicer things
export const HOME_BILLS = 3600;       // bills and taxes for an owned home
export const CHILD_COST = 3000;       // per child under 18
export const DEBT_INTEREST = 0.05;

export function taxRate(salary) {
  if (salary < 30000) return 0.1;
  if (salary < 60000) return 0.18;
  if (salary < 120000) return 0.26;
  if (salary < 180000) return 0.34;
  return 0.4;
}

export function yearlyIncome(state) {
  const c = state.career;
  if (Career.isEmployed(c)) return Math.round(c.salary * (1 - taxRate(c.salary)));
  if (c.retired) return c.pension;
  return 0;
}

export function livingCost(state) {
  const p = state.player;
  if (p.livesWithParents || p.age < 18) return 0;
  const base = state.assets.some((a) => a.type === 'home') ? HOME_BILLS : RENT;
  return base + Math.round(yearlyIncome(state) * LIFESTYLE_SHARE);
}

export function yearlyExpenses(state) {
  let cost = livingCost(state);
  cost += People.children(state).filter((c) => c.age < 18).length * CHILD_COST;
  for (const a of state.assets) cost += Math.round(a.value * a.upkeep);
  if (Education.isUniversity(state.education)) cost += Education.UNIVERSITY_TUITION;
  if (Education.isTradeSchool(state.education)) cost += Education.TRADE_TUITION;
  return cost;
}

export function netWorth(state) {
  return state.player.money + state.assets.reduce((sum, a) => sum + a.value, 0);
}

// Applies the year's money flow. `upkeep` comes from the assets module (already computed).
export function processFinances(state, upkeep) {
  const p = state.player;
  const income = yearlyIncome(state);
  if (income > 0) changeMoney(state, income, state.career.retired ? 'pension' : 'salary');

  let bills = livingCost(state) + People.children(state).filter((c) => c.age < 18).length * CHILD_COST + upkeep;
  const tuition = Education.isUniversity(state.education) ? Education.UNIVERSITY_TUITION : Education.isTradeSchool(state.education) ? Education.TRADE_TUITION : 0;
  if (tuition > 0) {
    if (p.money >= tuition) changeMoney(state, -tuition, 'tuition');
    else { changeMoney(state, -tuition, 'student loan', true); state.flags.studentLoan = true; }
  }
  if (bills > 0) {
    if (p.money >= bills) {
      changeMoney(state, -bills, 'living costs');
    } else {
      changeMoney(state, -bills, 'living costs (debt)', true);
      changeStat(state, 'happiness', -4, 'money trouble');
      addJournal(state, 'Money was tight this year and the bills pushed you into debt.', 'negative');
    }
  }
  if (p.money < 0) {
    const interest = Math.round(-p.money * DEBT_INTEREST);
    if (interest > 0) changeMoney(state, -interest, 'interest on debt', true);
    if (state.flags.studentLoan && income > 0 && p.money > -income) {
      // nothing special: the balance simply climbs back as income arrives
    }
  } else if (state.flags.studentLoan) {
    state.flags.studentLoan = false;
    addJournal(state, 'You paid off the last of your student loan.', 'positive');
    changeStat(state, 'happiness', 3, 'paid off loan');
  }
  return { income, bills, tuition };
}
