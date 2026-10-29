// Dialog cards: decisions, info, confirmations and the end-of-life summary.
import { LANGUAGES, LANGUAGES_READY, t, tg } from '../game/i18n/index.js';
import { pic, avatarFor } from '../game/icons.js';
import * as People from '../game/people.js';
import { esc } from './render.js';

const BAND_ICONS = { Family: 'people', Friends: 'people', Friend: 'people', School: 'school', University: 'cap', 'Trade School': 'tools', Work: 'briefcase', Career: 'briefcase', Money: 'money', Personal: 'person',
  Hobbies: 'palette', Belongings: 'bag', Health: 'stethoscope', Healthcare: 'stethoscope', Love: 'heart', Partner: 'heart', Life: 'sparkle', Surprise: 'dice', Childhood: 'toy', License: 'car', News: 'list', Activities: 'star', Shopping: 'shopping' };
const titleIcon = (modal) => pic(modal.icon || BAND_ICONS[modal.band] || 'sparkle');

function band(modal, state) {
  const person = modal.person ? People.findPerson(state, modal.person) : null;
  if (person) return `<div class="bl-band bl-band-person"><span class="bl-band-avatar">${avatarFor(person)}</span><span class="bl-band-name">${esc(person.name)}</span><span class="bl-band-role">${esc(tg(modal.bandRole || People.roleLabel(person), person.gender))}</span></div>`;
  if (modal.band) return `<div class="bl-band"><span class="bl-band-role">${esc(t(modal.band))}</span></div>`;
  return '';
}

const facts = (list, g = null) => (list && list.length ? `<div class="bl-facts">${list.map(([k, v]) => `<div class="bl-fact"><b>${esc(t(String(k), g))}:</b> ${esc(t(String(v), g))}</div>`).join('')}</div>` : '');
// Trait bars on people cards (new friend, love interest…), like the reference's Looks/Smarts/Craziness block.
function traitBars(modal, state) {
  const person = modal.person ? People.findPerson(state, modal.person) : null;
  const t = modal.traits || (person && person.traits);
  if (!t || !modal.facts || !modal.facts.length) return '';
  // Same visible trait structure as the reference: classmates show Looks / Grades / Popularity, everyone else Looks / Smarts / Craziness.
  const rows = modal.traitSet === 'school' ? [['Looks', t.looks], ['Grades', t.smarts], ['Popularity', t.popularity ?? t.kindness]] : [['Looks', t.looks], ['Smarts', t.smarts], ['Craziness', t.craziness ?? 100 - t.kindness]];
  return `<div class="bl-modal-traits">${rows.map(([k, v]) => `<div class="bl-modal-trait"><span>${k}</span><span class="bl-track"><span class="bl-fill" style="width:${Math.round(v)}%"></span></span></div>`).join('')}</div>`;
}

export function decision(modal, state) {
  const buttons = modal.choices.map((c) => `<button class="bl-btn bl-btn-blue" data-choice="${c.index}">${esc(c.label)}</button>`).join('');
  // O link diz o que vai acontecer: com duas opções é a moeda, com três ou mais é o sorteio.
  // Prometer uma moeda e mostrar outra coisa seria o jogo mentindo sobre o próprio acaso.
  const coin = modal.choices.length > 1
    ? `<button class="bl-coin" data-choice="random">${pic('dice')}<span>${esc(t(modal.choices.length === 2 ? 'Flip a coin' : 'Draw at random'))}</span></button>`
    : '';
  return card('decision', `${band(modal, state)}
    <h2 class="bl-modal-title">${titleIcon(modal)}<span>${esc(modal.title)}</span></h2>
    <p class="bl-modal-text">${esc(modal.text)}</p>${facts(modal.facts)}${traitBars(modal, state)}
    ${modal.noQuestion ? '' : `<p class="bl-modal-question">${esc(t('What will you do?'))}</p>`}
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
//
// A TRADUÇÃO ENTRA AQUI, pelo mesmo motivo de `pushModal`: este cartão recebe texto cru de quem
// pergunta (`ask({ title: 'Adopt this pet?' })`), e quem pergunta é a interface, espalhada por 30
// lugares de `betlife.js`. Traduzir no lugar de origem exigiria `t()` em cada um deles — e foi
// justamente o que faltou: as frases estavam no catálogo, o cartão não as pedia, e toda
// confirmação do jogo aparecia em inglês dentro de um jogo em português.
export function confirm(opts, state = null) {
  const g = { _g: state && state.player ? state.player.gender : undefined };
  // `opts.secondary` marca uma escolha que NÃO deve competir com a principal: ela sai como um link
  // discreto embaixo, não como um botão de igual peso. Serve para coisas opcionais — guardar uma
  // cópia de uma vida antiga, por exemplo — que não podem parecer o caminho esperado.
  const buttons = opts.choices.map((label, i) => (i === opts.secondary
    ? `<button class="bl-text-btn bl-text-quiet" data-choice="${i}">${esc(t(String(label), g))}</button>`
    : `<button class="bl-btn ${i === 0 ? (opts.danger ? 'bl-btn-red' : 'bl-btn-blue') : 'bl-btn-grey'}" data-choice="${i}"${i === 0 && opts.field && !String(opts.field.value || '').trim() ? ' disabled' : ''}>${esc(t(String(label), g))}</button>`)).join('');
  return card(opts.tone || 'blue', `${opts.band ? `<div class="bl-band"><span class="bl-band-role">${esc(t(opts.band))}</span></div>` : ''}
    <h2 class="bl-modal-title">${pic(opts.icon || 'info')}<span>${esc(t(String(opts.title), g))}</span></h2>
    ${portrait(opts.pet)}
    <p class="bl-modal-text">${esc(t(String(opts.text), g))}</p>${facts(opts.facts, g)}
    ${field(opts.field, g)}
    <div class="bl-modal-buttons">${buttons}</div>`);
}

// O retrato do animal no cartão de adoção: a mesma ilustração que a lista usa, grande, porque
// aqui ela é o assunto do cartão e não um ícone de linha.
function portrait(pet) {
  if (!pet || !pet.species) return '';
  return `<div class="bl-portrait" aria-hidden="true"><span class="bl-portrait-pic">${avatarFor({ role: 'pet', species: pet.species })}</span></div>`;
}

/** Um campo de texto dentro do cartão: `{ label, value, placeholder, maxLength, error, hint }`.
 *  O botão de confirmar nasce desabilitado quando o campo chega vazio (ver `confirm`), e
 *  `betlife.js` mantém isso em dia a cada tecla. */
function field(f, g) {
  if (!f) return '';
  // `data-full` e `data-empty` são as duas versões do recado embaixo do campo. Quem troca entre elas
  // é `betlife.js`, a cada tecla: assim o jogador lê POR QUE o botão está desligado, em vez de ver
  // um botão apagado sem explicação. Ficam aqui, já traduzidas, para a escuta não ter de saber de
  // que cartão veio o campo.
  const recados = ` data-full="${esc(f.hint ? t(String(f.hint), g) : '')}" data-empty="${esc(f.whenEmpty ? t(String(f.whenEmpty), g) : '')}"`;
  const nota = f.error
    ? `<p class="bl-field-note is-error" role="alert"${recados}>${esc(t(String(f.error), g))}</p>`
    : f.hint || f.whenEmpty ? `<p class="bl-field-note"${recados}>${esc(f.hint ? t(String(f.hint), g) : '')}</p>` : '';
  return `<label class="bl-field-label" for="bl-field">${esc(t(String(f.label), g))}</label>
    <input class="bl-field-input" id="bl-field" type="text" value="${esc(f.value || '')}" maxlength="${Number(f.maxLength) || 24}"
      placeholder="${esc(f.placeholder ? t(String(f.placeholder), g) : '')}" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done">${nota}`;
}

// Tombstone: original vector artwork. Ragged stone with texture, corner ribbon, skull and crossbones,
// grass, rocks and a flower; the name, age and epitaph are HTML laid over the stone so they wrap.
const STONE_PATH = 'M12 44l10-9 8 6 9-12 11 8 10-6 13 9 9-7 12 10 11-5 12 9 8-6 11 9 12-5 9 8 10-6 9 10 8-4 6 9v520H12z';
function stoneSvg() {
  const blades = Array.from({ length: 22 }, (_, i) => { const x = 8 + i * 15.5 + (i % 3) * 3; const h = 26 + (i * 7) % 22; const lean = ((i % 5) - 2) * 6; return `<path d="M${x} 594c${lean / 3} -${h / 2} ${lean} -${h} ${lean + 2} -${h + 4}c${2 - lean / 2} ${h / 2} ${2 - lean} ${h - 4} 6 ${h + 4}z" fill="${i % 2 ? '#59b04c' : '#3f8f36'}"/>`; }).join('');
  return `<svg viewBox="0 0 340 600" class="bl-stone-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3bec0"/><stop offset="0.6" stop-color="#9aa6a8"/><stop offset="1" stop-color="#8d999b"/></linearGradient>
      <filter id="sttex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n"/><feColorMatrix type="saturate" values="0" in="n" result="g"/><feComponentTransfer in="g" result="t"><feFuncA type="table" tableValues="0 0.22"/></feComponentTransfer><feBlend in="SourceGraphic" in2="t" mode="multiply"/></filter>
      <filter id="stsh"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity="0.45"/></filter>
      <clipPath id="stclip"><path d="${STONE_PATH}"/></clipPath>
      <linearGradient id="ribg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f04a3a"/><stop offset="1" stop-color="#c4231a"/></linearGradient>
    </defs>
    <g filter="url(#stsh)"><path d="${STONE_PATH}" fill="url(#stg)"/></g>
    <g clip-path="url(#stclip)" filter="url(#sttex)"><rect width="340" height="600" fill="#a9b4b6"/>
      <path d="M40 120c30 10 60-10 90 5s60 20 90 0 60-10 80 10" stroke="#8e9a9c" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M20 300c40-6 70 14 110 4s70-22 110-8 60 18 90 4" stroke="#8e9a9c" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M270 40l-8 30 6 22-10 26" stroke="#7d898b" stroke-width="2.5" fill="none" opacity="0.7"/>
      <path d="M60 470l10 22-6 24" stroke="#7d898b" stroke-width="2" fill="none" opacity="0.6"/>
      <ellipse cx="90" cy="200" rx="40" ry="26" fill="#fff" opacity="0.08"/><ellipse cx="250" cy="420" rx="60" ry="34" fill="#000" opacity="0.06"/></g>
    <g transform="translate(170 118) scale(1.35)" opacity="0.72" fill="#c7d0d2">
      <path d="M-44 26l88-52M-44-26l88 52" stroke="#c7d0d2" stroke-width="9" stroke-linecap="round" fill="none"/>
      <circle cx="-44" cy="26" r="7"/><circle cx="44" cy="-26" r="7"/><circle cx="-44" cy="-26" r="7"/><circle cx="44" cy="26" r="7"/>
      <ellipse cx="0" cy="-8" rx="30" ry="28"/><rect x="-18" y="8" width="36" height="24" rx="6"/>
      <ellipse cx="-11" cy="-8" rx="8.5" ry="9.5" fill="#5f6d70"/><ellipse cx="11" cy="-8" rx="8.5" ry="9.5" fill="#5f6d70"/><path d="M-4 6l4-8 4 8z" fill="#5f6d70"/>
      <path d="M-11 18v10M-4 18v12M4 18v12M11 18v10" stroke="#5f6d70" stroke-width="3" stroke-linecap="round"/></g>
    <g transform="translate(0 0)"><path d="M-40 150L150 -40l38 38L-2 188z" fill="url(#ribg)"/><path d="M-40 150l6 12L156 10l-6-12z" fill="#8d1a12" opacity="0.5"/></g>
    <rect x="0" y="560" width="340" height="40" fill="#2f7a2b"/><rect x="0" y="556" width="340" height="12" fill="#4c9c3e"/>
    ${blades}
    <ellipse cx="96" cy="588" rx="16" ry="8" fill="#7d7f78"/><ellipse cx="92" cy="585" rx="10" ry="5" fill="#a3a59d"/>
    <ellipse cx="230" cy="590" rx="11" ry="6" fill="#7d7f78"/><ellipse cx="292" cy="586" rx="18" ry="8" fill="#7d7f78"/><ellipse cx="288" cy="583" rx="11" ry="5" fill="#a3a59d"/>
    <g transform="translate(22 548)"><path d="M0 22v-14" stroke="#3f8f36" stroke-width="3"/><circle cx="0" cy="-8" r="4" fill="#f5c623"/><circle cx="-6" cy="-3" r="4" fill="#f5c623"/><circle cx="6" cy="-3" r="4" fill="#f5c623"/><circle cx="-4" cy="4" r="4" fill="#f5c623"/><circle cx="4" cy="4" r="4" fill="#f5c623"/><circle cx="0" cy="-1" r="3" fill="#e0872a"/></g>
  </svg>`;
}

export function death(summary) {
  const ribbon = summary.ribbon || { label: 'Ordinary', icon: 'leaf' };
  return `<div class="bl-overlay bl-overlay-dark">
    <div class="bl-capsule" role="status" style="top: 62px"><span class="bl-capsule-icon">${pic('party')}</span><span class="bl-capsule-text"><span>${esc(t('Complete a Life'))}</span><strong>${esc(t('Completed a full life'))}</strong></span></div>
    <div class="bl-stone-wrap" role="dialog" aria-modal="true">
    <div class="bl-stone">${stoneSvg()}
      <div class="bl-ribbon"><span class="bl-ribbon-icon">${pic(ribbon.icon)}</span><span>${esc(t(ribbon.label))}</span></div>
      <div class="bl-stone-text"><h2 class="bl-stone-name">${esc(summary.name)}</h2><p class="bl-stone-age">${esc(t(summary.age === 1 ? 'Aged {n} year' : 'Aged {n} years', { n: summary.age }))}</p>
      <p class="bl-stone-epitaph">${esc(summary.epitaph)}</p></div>
    </div>
    <button class="bl-btn bl-btn-green bl-btn-pill" data-choice="continue">${esc(t('Continue'))}</button>
    <button class="bl-text-btn bl-text-yellow" data-choice="undoDeath">${esc(t('Undo this death with a Rewind!'))}</button></div></div>`;
}

// After the summary: start again, like the reference's post-life menu.
export function postLife(name, hasProfile, children = []) {
  return `<div class="bl-overlay"><div class="bl-postlife" role="dialog" aria-modal="true">
    <h2>${pic('skull')}<span>${esc(name)}</span></h2>
    <p>${esc(t('Start an all-new life or try again as {name}!', { name: name.split(' ')[0] }))}</p>
    ${children.map((k) => `<button class="bl-btn bl-btn-blue bl-btn-big" data-choice="child:${esc(k.id)}">${esc(t('Continue as {name}', { name: k.name.split(' ')[0] }))} <span class="bl-light">(${k.age})</span></button>`).join('')}
    <button class="bl-btn bl-btn-green bl-btn-big" data-choice="random">${esc(t('Start a new random life!'))}</button>
    <button class="bl-btn bl-btn-yellow bl-btn-big" data-choice="custom">${esc(t('Start a custom life!'))}</button>
    <button class="bl-btn bl-btn-blue bl-btn-big" data-choice="summary">${esc(t('See the whole life'))}</button>
    ${hasProfile ? `<button class="bl-text-btn bl-text-light" data-choice="retry">${esc(t('try again as {name}', { name: name.split(' ')[0] }))}</button>` : ''}
    <button class="bl-text-btn bl-text-light" data-choice="arcade">← ${esc(t('back to the Arcade'))}</button></div></div>`;
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
    return card('decision', `<div class="bl-band"><span class="bl-band-role">${esc(t(modal.band))}</span></div>
      <h2 class="bl-modal-title">${pic('car')}<span>${esc(modal.title)}</span></h2>
      <p class="bl-modal-text">${esc(modal.text)}</p>
      <div class="bl-facts"><div class="bl-fact"><b>${esc(t('Sign:'))}</b> ${esc(t(q.sign))}</div></div>
      <p class="bl-modal-question">${esc(t('What does it mean?'))}</p>
      <div class="bl-modal-buttons">${order.map((i) => `<button class="bl-btn bl-btn-blue" data-choice="${i === q.correct ? 'pass' : 'fail'}">${esc(t(q.answers[i]))}</button>`).join('')}</div>`);
  }
  if (modal.game === 'eyeExam') {
    const letters = 'EFHLTZ';
    const base = letters[state.seed % letters.length];
    const odd = letters[(state.seed + 3) % letters.length];
    const cells = 48; const oddIndex = (state.seed * 7 + state.player.age * 13) % cells;
    const grid = Array.from({ length: cells }, (_, i) => `<button class="bl-eye-cell" data-choice="${i === oddIndex ? 'pass' : 'fail'}">${i === oddIndex ? odd : base}</button>`).join('');
    return card('decision', `<div class="bl-band"><span class="bl-band-role">${esc(t(modal.band))}</span></div>
      <h2 class="bl-modal-title">${pic('eye')}<span>${esc(modal.title)}</span></h2>
      <p class="bl-modal-text">${esc(modal.text)}</p>
      <div class="bl-eye-grid" id="bl-eye-grid">${grid}</div>
      <p class="bl-modal-question bl-eye-timer" id="bl-eye-timer">${esc(t('Time remaining: {n} seconds', { n: 8 }))}</p>
      <button class="bl-text-btn" data-choice="fail">${esc(t('I need glasses'))}</button>`);
  }
  return card('blue', `<h2 class="bl-modal-title">${esc(modal.title)}</h2><div class="bl-modal-buttons"><button class="bl-btn bl-btn-green" data-choice="pass">OK</button></div>`);
}

// Badge banner: a top strip that slides in and dismisses itself.
// Achievement banner: a full-width strip that slides in over the header, trophy pattern behind a trophy, uppercase title and subtitle.
export function badgeBanner(modal) {
  const pattern = Array.from({ length: 40 }, () => pic('trophy')).join('');
  return `<div class="bl-banner" data-choice="ok"><span class="bl-banner-pattern" aria-hidden="true">${pattern}</span><span class="bl-banner-icon">${pic('trophy')}</span><span class="bl-banner-text"><strong>${esc(modal.name)}</strong><span>${esc(modal.desc)}</span></span></div>`;
}

// Language picker shown once, on the very first start (the game text is English; the choice is remembered).
export function languageCard(current = 'en') {
  const prontos = LANGUAGES_READY;
  const faltando = LANGUAGES.filter((l) => !l.completo);
  const seletor = prontos.length > 1
    ? `<label class="bl-lang-label" for="bl-lang">${esc(t('Choose a language:'))}</label>
       <select id="bl-lang" class="bl-lang-select">${prontos.map((l) => `<option value="${l.id}"${l.id === current ? ' selected' : ''}>${l.nome}</option>`).join('')}</select>`
    : `<input type="hidden" id="bl-lang" value="${prontos[0] ? prontos[0].id : 'en'}">
       <p class="bl-lang-label">${esc(t('BetLife is written in {lang}.', { lang: prontos[0] ? prontos[0].nome : 'English' }))}</p>`;
  const emBreve = faltando.length
    ? `<p class="bl-lang-soon">${esc(t('{langs}: not translated yet.', { langs: faltando.map((l) => l.nome).join(', ') }))}</p>`
    : '';
  return `<div class="bl-overlay"><div class="bl-modal bl-lang" role="dialog" aria-modal="true">
    <div class="bl-band bl-band-lang"><span class="bl-band-avatar">${pic('globe')}</span><span class="bl-band-role">Hello! Hola! Olá! Hallo!</span></div>
    <p class="bl-lang-prompt">${esc(t(prontos.length > 1 ? 'Please select your preferred language!' : 'Welcome to BetLife!'))}</p>
    <div class="bl-lang-icon" aria-hidden="true">${pic('lang')}</div>
    ${seletor}${emBreve}
    <button class="bl-btn bl-btn-blue" data-choice="language">${esc(t("I'm ready!"))}</button></div></div>`;
}

function card(tone, body, extra = '', dismissable = false) {
  const noBand = !body.includes('class="bl-band');
  return `<div class="bl-overlay"${dismissable ? ' data-choice="ok"' : ''}><div class="bl-modal tone-${esc(tone)}${noBand ? ' no-band' : ''}${extra ? ` ${extra}` : ''}" role="dialog" aria-modal="true">${body}</div></div>`;
}
