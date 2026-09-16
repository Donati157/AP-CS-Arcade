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
    <div class="bl-modal-buttons"><button class="bl-btn bl-btn-green" data-choice="newLife">NEW LIFE</button><button class="bl-btn bl-btn-blue" data-choice="menu">MAIN MENU</button><button class="bl-text-btn" data-choice="close">Read the journal</button></div>`);
}

function card(tone, body) {
  return `<div class="bl-overlay"><div class="bl-modal tone-${esc(tone)}" role="dialog" aria-modal="true">${body}</div></div>`;
}
