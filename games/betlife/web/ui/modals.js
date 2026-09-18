// Dialog cards: decisions, info, confirmations and the end-of-life summary.
import { pic, avatarFor } from '../game/icons.js';
import * as People from '../game/people.js';
import { esc } from './render.js';

const BAND_ICONS = { Family: 'people', Friends: 'people', Friend: 'people', School: 'school', University: 'cap', 'Trade School': 'tools', Work: 'briefcase', Career: 'briefcase', Money: 'money', Personal: 'person',
  Hobbies: 'palette', Belongings: 'bag', Health: 'stethoscope', Healthcare: 'stethoscope', Love: 'heart', Partner: 'heart', Life: 'sparkle', Surprise: 'dice', Childhood: 'toy', License: 'car', News: 'list', Activities: 'star', Shopping: 'shopping' };
const titleIcon = (modal) => pic(modal.icon || BAND_ICONS[modal.band] || 'sparkle');

function band(modal, state) {
  const person = modal.person ? People.findPerson(state, modal.person) : null;
  if (person) return `<div class="bl-band bl-band-person"><span class="bl-band-avatar bl-pic">${avatarFor(person)}</span><span class="bl-band-name">${esc(person.name)}</span><span class="bl-band-role">${esc(People.roleLabel(person))}</span></div>`;
  if (modal.band) return `<div class="bl-band"><span class="bl-band-role">${esc(modal.band)}</span></div>`;
  return '';
}

const facts = (list) => (list && list.length ? `<div class="bl-facts">${list.map(([k, v]) => `<div class="bl-fact"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div>` : '');
// Trait bars on people cards (new friend, love interest…), like the reference's Looks/Smarts/Craziness block.
function traitBars(modal, state) {
  const person = modal.person ? People.findPerson(state, modal.person) : null;
  const t = modal.traits || (person && person.traits);
  if (!t || !modal.facts || !modal.facts.length) return '';
  return `<div class="bl-modal-traits">${[['Looks', t.looks], ['Smarts', t.smarts], ['Kindness', t.kindness]].map(([k, v]) => `<div class="bl-modal-trait"><span>${k}</span><span class="bl-track"><span class="bl-fill" style="width:${Math.round(v)}%"></span></span></div>`).join('')}</div>`;
}

export function decision(modal, state) {
  const buttons = modal.choices.map((c) => `<button class="bl-btn bl-btn-blue" data-choice="${c.index}">${esc(c.label)}</button>`).join('');
  const coin = modal.choices.length > 1 ? `<button class="bl-coin" data-choice="random">${pic('dice')}<span>Flip a coin</span></button>` : '';
  return card('decision', `${band(modal, state)}
    <h2 class="bl-modal-title">${titleIcon(modal)}<span>${esc(modal.title)}</span></h2>
    <p class="bl-modal-text">${esc(modal.text)}</p>${facts(modal.facts)}${traitBars(modal, state)}
    <p class="bl-modal-question">What will you do?</p>
    <div class="bl-modal-buttons">${buttons}</div>${coin}`);
}

export function info(modal, state) {
  const small = !modal.band && !modal.person && !(modal.facts && modal.facts.length) && String(modal.text || '').length < 140;
  if (small) return card('blue', `<h2 class="bl-modal-title">${esc(modal.title)}</h2><p class="bl-modal-text">${esc(modal.text)}</p>`, 'is-small', true);
  return card(modal.tone || 'blue', `${band(modal, state)}
    <h2 class="bl-modal-title">${titleIcon(modal)}<span>${esc(modal.title)}</span></h2>
    <p class="bl-modal-text">${esc(modal.text)}</p>${facts(modal.facts)}${traitBars(modal, state)}
    <div class="bl-modal-buttons"><button class="bl-btn bl-btn-green" data-choice="ok">OK</button></div>`);
}

// A small confirmation asked by the interface itself (resign, sell, buy, new life…).
export function confirm(opts) {
  const buttons = opts.choices.map((label, i) => `<button class="bl-btn ${i === 0 ? (opts.danger ? 'bl-btn-red' : 'bl-btn-blue') : 'bl-btn-grey'}" data-choice="${i}">${esc(label)}</button>`).join('');
  return card(opts.tone || 'blue', `${opts.band ? `<div class="bl-band"><span class="bl-band-role">${esc(opts.band)}</span></div>` : ''}
    <h2 class="bl-modal-title">${pic(opts.icon || 'info')}<span>${esc(opts.title)}</span></h2>
    <p class="bl-modal-text">${esc(opts.text)}</p>${facts(opts.facts)}
    <div class="bl-modal-buttons">${buttons}</div>`);
}

export function death(summary) {
  const facts = summary.facts.filter(([k]) => ['Net worth', 'Career', 'Education', 'Children', 'Spouse', 'Birthplace'].includes(k)).slice(0, 5);
  return `<div class="bl-overlay"><div class="bl-stone-wrap" role="dialog" aria-modal="true">
    <div class="bl-stone"><div class="bl-stone-skull bl-pic" aria-hidden="true">☠️</div><h2 class="bl-stone-name">${esc(summary.name)}</h2><p class="bl-stone-age">Aged ${summary.age} years</p>
      <p class="bl-stone-epitaph">${esc(summary.epitaph)}</p></div>
    <button class="bl-btn bl-btn-green" data-choice="continue">Continue</button></div></div>`;
}

// After the summary: start again, like the reference's post-life menu.
export function postLife(name, hasProfile, children = []) {
  return `<div class="bl-overlay"><div class="bl-postlife" role="dialog" aria-modal="true">
    <h2>${pic('tombstone')}<span>${esc(name)}</span></h2>
    <p>Start an all-new life or try again as ${esc(name.split(' ')[0])}!</p>
    ${children.map((k) => `<button class="bl-btn bl-btn-blue bl-btn-big" data-choice="child:${esc(k.id)}">Continue as ${esc(k.name.split(' ')[0])} (${k.age})</button>`).join('')}
    <button class="bl-btn bl-btn-green bl-btn-big" data-choice="random">Start a new random life!</button>
    <button class="bl-btn bl-btn-yellow bl-btn-big" data-choice="custom">Start a custom life!</button>
    ${hasProfile ? `<button class="bl-text-btn bl-text-light" data-choice="retry">try again as ${esc(name.split(' ')[0])}</button>` : ''}</div></div>`;
}

// Road-sign quiz for the driving license (original signs, three answers).
const SIGNS = [
  { sign: 'A red octagon with white letters', answers: ['Stop completely', 'Slow down', 'No parking'], correct: 0 },
  { sign: 'A yellow diamond with a black zigzag arrow', answers: ['Winding road ahead', 'Lane ends', 'Railway crossing'], correct: 0 },
  { sign: 'A white circle with a red border and "40"', answers: ['Speed limit 40', 'Minimum speed 40', 'Route 40'], correct: 0 },
  { sign: 'A blue square with a white "P"', answers: ['Parking allowed', 'Pedestrians only', 'Police station'], correct: 0 },
  { sign: 'A red triangle pointing down', answers: ['Give way', 'Roadworks', 'One way'], correct: 0 },
];

export function minigame(modal, state) {
  if (modal.game === 'drivingQuiz') {
    const q = SIGNS[state.player.age % SIGNS.length];
    const order = [0, 1, 2].sort((a, b) => ((a * 7 + state.seed) % 5) - ((b * 7 + state.seed) % 5));
    return card('decision', `<div class="bl-band"><span class="bl-band-role">${esc(modal.band)}</span></div>
      <h2 class="bl-modal-title">${pic('car')}<span>${esc(modal.title)}</span></h2>
      <p class="bl-modal-text">${esc(modal.text)}</p>
      <div class="bl-facts"><div class="bl-fact"><b>Sign:</b> ${esc(q.sign)}</div></div>
      <p class="bl-modal-question">What does it mean?</p>
      <div class="bl-modal-buttons">${order.map((i) => `<button class="bl-btn bl-btn-blue" data-choice="${i === q.correct ? 'pass' : 'fail'}">${esc(q.answers[i])}</button>`).join('')}</div>`);
  }
  if (modal.game === 'eyeExam') {
    const letters = 'EFHLTZ';
    const base = letters[state.seed % letters.length];
    const odd = letters[(state.seed + 3) % letters.length];
    const cells = 48; const oddIndex = (state.seed * 7 + state.player.age * 13) % cells;
    const grid = Array.from({ length: cells }, (_, i) => `<button class="bl-eye-cell" data-choice="${i === oddIndex ? 'pass' : 'fail'}">${i === oddIndex ? odd : base}</button>`).join('');
    return card('decision', `<div class="bl-band"><span class="bl-band-role">${esc(modal.band)}</span></div>
      <h2 class="bl-modal-title">${pic('eye')}<span>${esc(modal.title)}</span></h2>
      <p class="bl-modal-text">${esc(modal.text)}</p>
      <div class="bl-eye-grid" id="bl-eye-grid">${grid}</div>
      <p class="bl-modal-question bl-eye-timer" id="bl-eye-timer">Time remaining: 8 seconds</p>
      <button class="bl-text-btn" data-choice="fail">I need glasses</button>`);
  }
  return card('blue', `<h2 class="bl-modal-title">${esc(modal.title)}</h2><div class="bl-modal-buttons"><button class="bl-btn bl-btn-green" data-choice="pass">OK</button></div>`);
}

// Badge banner: a top strip that slides in and dismisses itself.
export function badgeBanner(modal) {
  return `<div class="bl-banner" data-choice="ok"><span class="bl-banner-icon">${pic('medal')}</span><span class="bl-banner-text"><strong>${esc(modal.name)}</strong><span>${esc(modal.desc)}</span></span><span class="bl-banner-kicker">Badge earned</span></div>`;
}

function card(tone, body, extra = '', dismissable = false) {
  const noBand = !body.includes('class="bl-band');
  return `<div class="bl-overlay"${dismissable ? ' data-choice="ok"' : ''}><div class="bl-modal tone-${esc(tone)}${noBand ? ' no-band' : ''}${extra ? ` ${extra}` : ''}" role="dialog" aria-modal="true">${body}</div></div>`;
}
