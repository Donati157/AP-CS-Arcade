// The life summary shown when a life ends, built only from what actually happened.
import * as People from './people.js';
import * as Career from './career.js';
import * as Education from './education.js';
import { netWorth } from './economy.js';

export function lifeSummary(state) {
  const p = state.player;
  const career = Career.careerSummary(state.career);
  const spouse = state.relationships.find((r) => r.role === 'spouse');
  const kids = state.relationships.filter((r) => People.CHILD_ROLES.includes(r.role));
  const friendsMade = state.relationships.filter((r) => ['friend', 'bestFriend', 'coworker'].includes(r.role)).length;
  const milestones = state.timeline.filter((e) => e.kind === 'milestone' && !e.text.startsWith('You were born')).map((e) => e.text);
  const facts = [
    ['Age', `${p.age} years`],
    ['Birthplace', p.birthplace],
    ['Education', Education.educationSummary(state.education)],
    ['Career', career ? `${career.best.title}${career.best.employer ? ` at ${career.best.employer}` : ''}` : 'Never worked'],
  ];
  if (career) facts.push(['Years worked', String(career.yearsWorked)]);
  facts.push(['Net worth', money(netWorth(state))]);
  if (spouse) facts.push(['Spouse', spouse.name]);
  if (kids.length) facts.push(['Children', kids.map(People.firstName).join(', ')]);
  facts.push(['Friends made', String(friendsMade)]);
  if (state.assets.length) facts.push(['Belongings', state.assets.map((a) => a.name).join(', ')]);
  return { name: p.name, age: p.age, cause: p.deathCause, facts, milestones: milestones.slice(-8), epitaph: epitaph(state, career, spouse, kids) };
}

function epitaph(state, career, spouse, kids) {
  const p = state.player;
  const parts = [`${p.firstName} lived to the age of ${p.age}`];
  if (career) parts.push(`worked ${career.yearsWorked} ${career.yearsWorked === 1 ? 'year' : 'years'}, rising to ${career.best.title}`);
  if (spouse) parts.push(`shared life with ${People.firstName(spouse)}`);
  if (kids.length) parts.push(`raised ${kids.length === 1 ? 'a child' : `${kids.length} children`}`);
  return parts.join(', ') + '.';
}

export function money(n) {
  return (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
}
