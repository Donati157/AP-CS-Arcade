// The life summary shown when a life ends, built only from what actually happened.
import { t, tg, dinheiro } from './i18n/index.js';
import * as People from './people.js';
import * as Career from './career.js';
import * as Education from './education.js';
import { netWorth } from './economy.js';

// 'Mexico City, Mexico' -> 'Mexico City, México'. A cidade é nome próprio e fica; o país passa pelo
// catálogo, igual a qualquer outro rótulo de dado.
function traduzLocal(local) {
  const i = String(local || '').lastIndexOf(', ');
  if (i < 0) return local;
  return `${local.slice(0, i)}, ${t(local.slice(i + 2))}`;
}

export function lifeSummary(state) {
  const p = state.player;
  const career = Career.careerSummary(state.career);
  const spouse = state.relationships.find((r) => r.role === 'spouse');
  const kids = state.relationships.filter((r) => People.CHILD_ROLES.includes(r.role));
  const friendsMade = state.relationships.filter((r) => ['friend', 'bestFriend', 'coworker'].includes(r.role)).length;
  const milestones = state.timeline.filter((e) => e.kind === 'milestone' && !e.text.startsWith('You were born')).map((e) => e.text);
  const facts = [
    ['Age', t('{n} years', { n: p.age })],
    // `birthplace` é 'Cidade, País' guardado em inglês no estado; só o país se traduz, a cidade é
    // nome próprio.
    ['Birthplace', traduzLocal(p.birthplace)],
    ['Education', Education.educationSummary(state.education)],
    ['Career', career ? (career.best.employer ? t('{title} at {employer}', { title: tg(career.best.title, p.gender), employer: career.best.employer }) : tg(career.best.title, p.gender)) : 'Never worked'],
  ];
  if (career) facts.push(['Years worked', String(career.yearsWorked)]);
  facts.push(['Net worth', money(netWorth(state))]);
  if (spouse) facts.push(['Spouse', spouse.name]);
  if (kids.length) facts.push(['Children', kids.map(People.firstName).join(', ')]);
  facts.push(['Friends made', String(friendsMade)]);
  if (state.assets.length) facts.push(['Belongings', state.assets.map((a) => t(a.name)).join(', ')]);
  return { name: p.name, age: p.age, cause: p.deathCause, facts, milestones: milestones.slice(-8), epitaph: epitaph(state, career, spouse, kids), ribbon: ribbon(state, career, kids) };
}

function epitaph(state, career, spouse, kids) {
  const p = state.player;
  const parts = [t('{firstName2} lived to the age of {age3}', { firstName2: p.firstName, age3: p.age })];
  if (career) parts.push(t('worked {yearsWorked} {yearsWorkedy}, rising to {title4}', { yearsWorked: career.yearsWorked, yearsWorkedy: t(career.yearsWorked === 1 ? 'year' : 'years'), title4: tg(career.best.title) }));
  if (spouse) parts.push(t('shared life with {firstName3}', { firstName3: People.firstName(spouse) }));
  if (kids.length) parts.push(kids.length === 1 ? t('raised a child') : t('raised {n} children', { n: kids.length }));
  return parts.join(', ') + '.';
}

// Mesmo apelido de `ui/render.js`: a formatação é uma só, em `game/i18n/moeda.js`.
export const money = dinheiro;

// A corner ribbon that sums the life up in one word (original set).
function ribbon(state, career, kids) {
  const p = state.player;
  const worth = state.player.money + state.assets.reduce((sum, a) => sum + a.value, 0);
  if (p.age < 30) return { label: 'Unlucky', icon: 'looksLow' };
  if (worth >= 1000000) return { label: 'Wealthy', icon: 'money' };
  if (p.age >= 95) return { label: 'Ancient', icon: 'clock' };
  if (kids.length >= 3) return { label: 'Family', icon: 'people' };
  // careerSummary() devolve null para quem nunca trabalhou — e é por isso que as duas linhas
  // acima, no mesmo arquivo, já testam `career` antes de usar. Aqui faltava, e qualquer vida que
  // terminasse sem emprego quebrava a tela de resumo com TypeError.
  if (career && career.yearsWorked >= 40) return { label: 'Hard Worker', icon: 'tools' };
  if (state.education.degree) return { label: 'Scholar', icon: 'cap' };
  if (p.age >= 80) return { label: 'Long Life', icon: 'leaf' };
  return { label: 'Ordinary', icon: 'leaf' };
}
