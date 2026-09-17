// Dialog cards: decisions, info, confirmations and the end-of-life summary.
import { icon } from '../game/icons.js';
import * as People from '../game/people.js';
import { esc } from './render.js';

const BAND_ICONS = { Family: 'people', Friends: 'people', School: 'cap', University: 'cap', 'Trade School': 'tools', Work: 'briefcase', Career: 'briefcase', Money: 'dollar', Personal: 'person',
  Hobbies: 'palette', Belongings: 'bag', Health: 'cross', Love: 'heart', Life: 'sparkle', Surprise: 'dice', Childhood: 'baby' };

function band(modal, state) {
  const person = modal.person ? People.findPerson(state, modal.person) : null;
  if (person) return `<div class="bl-band bl-band-person"><span class="bl-band-avatar">${icon(person.role === 'pet' ? 'paw' : 'person')}</span><span class="bl-band-name">${esc(person.name)}</span><span class="bl-band-role">${esc(People.roleLabel(person))}</span></div>`;
  if (modal.band) return `<div class="bl-band"><span class="bl-band-role">${esc(modal.band)}</span></div>`;
  return '';
}

const facts = (list) => (list && list.length ? `<div class="bl-facts">${list.map(([k, v]) => `<div class="bl-fact"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div>` : '');

export function decision(modal, state) {
  const buttons = modal.choices.map((c) => `<button class="bl-btn bl-btn-blue" data-choice="${c.index}">${esc(c.label)}</button>`).join('');
  const coin = modal.choices.length > 1 ? `<button class="bl-coin" data-choice="random">${icon('dice')}<span>Flip a coin</span></button>` : '';
  return card('decision', `${band(modal, state)}
    <h2 class="bl-modal-title">${icon(BAND_ICONS[modal.band] || 'sparkle')}<span>${esc(modal.title)}</span></h2>
    <p class="bl-modal-text">${esc(modal.text)}</p>${facts(modal.facts)}
    <p class="bl-modal-question">What will you do?</p>
    <div class="bl-modal-buttons">${buttons}</div>${coin}`);
}

export function info(modal, state) {
  return card(modal.tone || 'blue', `${band(modal, state)}
    <h2 class="bl-modal-title">${icon(BAND_ICONS[modal.band] || 'info')}<span>${esc(modal.title)}</span></h2>
    <p class="bl-modal-text">${esc(modal.text)}</p>${facts(modal.facts)}
    <div class="bl-modal-buttons"><button class="bl-btn bl-btn-green" data-choice="ok">OK</button></div>`);
}

// A small confirmation asked by the interface itself (resign, sell, buy, new life…).
export function confirm(opts) {
  const buttons = opts.choices.map((label, i) => `<button class="bl-btn ${i === 0 ? (opts.danger ? 'bl-btn-red' : 'bl-btn-blue') : 'bl-btn-grey'}" data-choice="${i}">${esc(label)}</button>`).join('');
  return card(opts.tone || 'blue', `${opts.band ? `<div class="bl-band"><span class="bl-band-role">${esc(opts.band)}</span></div>` : ''}
    <h2 class="bl-modal-title">${icon(opts.icon || 'info')}<span>${esc(opts.title)}</span></h2>
    <p class="bl-modal-text">${esc(opts.text)}</p>${facts(opts.facts)}
    <div class="bl-modal-buttons">${buttons}</div>`);
}

export function death(summary) {
  return card('death', `<div class="bl-death-head"><span class="bl-death-icon">${icon('candle')}</span><span class="bl-death-kicker">BetLife · Life Complete</span>
      <h2 class="bl-death-name">${esc(summary.name)}</h2><p class="bl-death-age">Aged ${summary.age} years</p></div>
    ${facts(summary.facts.slice(0, 7))}
    <p class="bl-modal-text bl-epitaph">${esc(summary.epitaph)}</p>
    ${summary.milestones.length ? `<div class="bl-milestones">${summary.milestones.slice(-5).map((m) => `<p>${esc(m)}</p>`).join('')}</div>` : ''}
    <div class="bl-modal-buttons"><button class="bl-btn bl-btn-green" data-choice="continue">Continue</button></div>`);
}

// After the summary: start again, like the reference's post-life menu.
export function postLife(name, hasProfile, children = []) {
  return `<div class="bl-overlay"><div class="bl-postlife" role="dialog" aria-modal="true">
    <h2>${icon('candle')}<span>${esc(name)}</span></h2>
    <p>Start an all-new life or try again as ${esc(name.split(' ')[0])}!</p>
    ${children.map((k) => `<button class="bl-btn bl-btn-blue bl-btn-big" data-choice="child:${esc(k.id)}">Continue as ${esc(k.name.split(' ')[0])} (${k.age})</button>`).join('')}
    <button class="bl-btn bl-btn-green bl-btn-big" data-choice="random">Start a new random life!</button>
    <button class="bl-btn bl-btn-yellow bl-btn-big" data-choice="custom">Start a custom life!</button>
    ${hasProfile ? `<button class="bl-text-btn bl-text-light" data-choice="retry">try again as ${esc(name.split(' ')[0])}</button>` : ''}
    <button class="bl-text-btn bl-text-light" data-choice="close">read the journal</button></div></div>`;
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
      <h2 class="bl-modal-title">${icon('car')}<span>${esc(modal.title)}</span></h2>
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
      <h2 class="bl-modal-title">${icon('eye')}<span>${esc(modal.title)}</span></h2>
      <p class="bl-modal-text">${esc(modal.text)}</p>
      <div class="bl-eye-grid" id="bl-eye-grid">${grid}</div>
      <p class="bl-modal-question bl-eye-timer" id="bl-eye-timer">Time remaining: 8 seconds</p>
      <button class="bl-text-btn" data-choice="fail">I need glasses</button>`);
  }
  return card('blue', `<h2 class="bl-modal-title">${esc(modal.title)}</h2><div class="bl-modal-buttons"><button class="bl-btn bl-btn-green" data-choice="pass">OK</button></div>`);
}

// Badge banner: a top strip that slides in and dismisses itself.
export function badgeBanner(modal) {
  return `<div class="bl-banner" data-choice="ok"><span class="bl-banner-icon">${icon('medal')}</span><span class="bl-banner-text"><strong>${esc(modal.name)}</strong><span>${esc(modal.desc)}</span></span><span class="bl-banner-kicker">Badge earned</span></div>`;
}

function card(tone, body) {
  return `<div class="bl-overlay"><div class="bl-modal tone-${esc(tone)}" role="dialog" aria-modal="true">${body}</div></div>`;
}
