// Plays whole lives automatically for tests and balance reports. Not used by the interface.
// The "player" follows a simple, deterministic policy driven by its own seeded RNG so that the
// same seed always produces the same life.
import * as G from './game-state.js';
import { createRngLike } from './test-rng.js';
import * as Career from './career.js';
import * as Careers from './careers.js';
import * as Education from './education.js';
import * as People from './people.js';
import { MAJORS, TRADES } from './education.js';
import { SHOPS } from './assets.js';

export const MAX_AGE = 130; // safety cap: a life that reaches this is a bug the tests flag

/**
 * Simulates a full life. Returns { state, snapshots, reachedCap }.
 * snapshots: one record per year with the facts the tests and reports look at.
 */
export function simulateLife(seed, options = {}) {
  const policyRng = createRngLike(seed ^ 0x9e3779b9);
  // Every automatic player has a personality so lives differ: how studious, how driven, how social.
  const traits = { studious: policyRng() < 0.6, driven: policyRng() < 0.6, social: policyRng() < 0.7, spender: policyRng() < 0.5 };
  options = { ...options, traits };
  const state = G.createNewGame(options.custom || {}, seed);
  const snapshots = [];
  const onYear = options.onYear || null;
  let reachedCap = false;
  drain(state, policyRng);
  while (state.player.alive) {
    act(state, policyRng, options);
    drain(state, policyRng); // actions can queue badges or cards
    if (!G.ageUp(state)) break;
    drain(state, policyRng);
    snapshots.push(snapshot(state));
    if (onYear) onYear(state);
    if (state.player.age >= MAX_AGE) { reachedCap = true; break; }
  }
  return { state, snapshots, reachedCap };
}

// Answers every pending dialog: info is dismissed, decisions get a random option, and the
// after-high-school choice follows the policy (university when smart enough, else trade or work).
export function drain(state, policyRng) {
  let guardCount = 0;
  while (state.pending.length > 0 && guardCount++ < 50) {
    const modal = state.pending[0];
    if (modal.kind === 'minigame') { G.answerModal(state, policyRng() < 0.7); continue; }
    if (modal.kind !== 'decision') { G.answerModal(state); continue; }
    let choice;
    if (modal.eventId === 'afterHighSchool') { const r = policyRng(); choice = state.player.smarts >= 60 && r < 0.65 ? 0 : r < 0.85 ? 1 : 2; }
    else choice = modal.choices[Math.floor(policyRng() * modal.choices.length)].index;
    const followUp = G.answerModal(state, choice);
    if (followUp === 'university') G.enrollUniversity(state, MAJORS[Math.floor(policyRng() * MAJORS.length)].id);
    else if (followUp === 'tradeSchool') G.enrollTradeSchool(state, TRADES[Math.floor(policyRng() * TRADES.length)].id);
  }
}

// What the automatic player does with its actions each year.
function act(state, policyRng, options) {
  const p = state.player;
  if (!p.alive) return;
  // Look for work when out of school and unemployed (from 18, or part-time from 16 half the time).
  if (!Career.isEmployed(state.career) && !state.career.retired && !Education.isEnrolled(state.education) && p.age >= 18) {
    const eligible = Careers.CAREERS.filter((c) => !c.partTime && Career.isEligible(state, c)).sort((a, b) => b.ladder[0].salary - a.ladder[0].salary);
    if (eligible.length) G.applyForCareer(state, eligible[0].id);
  } else if (!Career.isEmployed(state.career) && p.age >= 16 && p.age < 18 && policyRng() < 0.4) {
    const eligible = Careers.CAREERS.filter((c) => c.partTime && Career.isEligible(state, c));
    if (eligible.length) G.applyForCareer(state, eligible[Math.floor(policyRng() * eligible.length)].id);
  }
  const t = options.traits || {};
  // Spend the year's actions.
  while (state.actionsRemaining > 0) {
    const roll = policyRng();
    if (Education.isEnrolled(state.education) && roll < (t.studious ? 0.4 : 0.1)) G.studyAction(state, 'studyHarder');
    else if (Career.isEmployed(state.career) && roll < (t.driven ? 0.6 : 0.3)) G.jobAction(state, policyRng() < 0.8 ? 'workHarder' : 'askForRaise');
    else if (roll < (t.social ? 0.8 : 0.6)) {
      const people = People.alive(state);
      if (people.length) {
        const who = people[Math.floor(policyRng() * people.length)];
        const actions = People.actionsFor(state, who).filter(([id]) => !['argue', 'breakUp', 'unfriend', 'release'].includes(id));
        const big = actions.find(([id]) => (id === 'propose' && who.closeness >= 60) || id === 'marry');
        if (big) G.interactWith(state, who.id, big[0]);
        else if (actions.length) G.interactWith(state, who.id, actions[Math.floor(policyRng() * actions.length)][0]);
        else state.actionsRemaining -= 1;
      } else state.actionsRemaining -= 1;
    } else if (p.age >= 3) {
      const ids = ['walk', 'readBook', 'playOutside', 'meditate', 'gym', 'movies', 'hangOut', 'familyDinner', 'checkup', 'volunteer', 'videoGames', 'sports'];
      const result = G.doActivity(state, ids[Math.floor(policyRng() * ids.length)]);
      if (!result.ok) state.actionsRemaining -= 1;
    } else state.actionsRemaining -= 1;
  }
  if (options.buyCar !== false && p.age >= 25 && p.money > 12000 && !state.assets.some((a) => a.kind === 'car') && p.hasLicence) G.buyItem(state, 'usedCars', 'usedSedan');
  if (p.age >= 30 && p.money > 130000 && !state.assets.some((a) => a.type === 'home')) G.buyItem(state, 'homes', 'studio');
  if (t.spender && p.age >= 8 && policyRng() < 0.35) {
    const shop = SHOPS[Math.floor(policyRng() * SHOPS.length)];
    const item = shop.items[Math.floor(policyRng() * shop.items.length)];
    if (item.cost <= p.money * 0.5) G.buyItem(state, shop.id, item.id);
  }
  if (p.age >= 16 && !p.hasLicence && policyRng() < 0.5) { state.actionsRemaining = 1; G.doActivity(state, 'drivingTest'); }
}

export function snapshot(state) {
  const p = state.player;
  const c = state.career;
  return {
    age: p.age, alive: p.alive, happiness: p.happiness, health: p.health, smarts: p.smarts, looks: p.looks, money: p.money,
    job: Career.jobTitle(c), tenure: c.tenure, salary: c.salary, performance: c.performance, retired: c.retired,
    occupation: p.occupation, education: Education.educationSummary(state.education), relationships: People.alive(state).length,
    partner: People.partner(state) ? People.partner(state).role : null, children: People.children(state).length,
  };
}
