// BetLife browser UI: renders the current screen from game state and forwards clicks to the game.
import * as G from './game/game-state.js';
import { MAJORS, UNIVERSITY_NAME, UNIVERSITY_YEARS, yearLabel, schoolName, educationSummary, isEnrolled } from './game/education.js';
import { JOBS, currentJob, isEmployed, requirementText } from './game/career.js';
import { icon } from './game/icons.js';

export const VERSION = '1.0.0-web';

const root = document.getElementById('game');
const modalRoot = document.getElementById('modal-root');

let state = G.loadGame() || G.createNewGame();
let screen = 'main';
let selectedPerson = 0;

// ---- Helpers --------------------------------------------------------------------

const money = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US');
const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const player = () => state.player;

function header(title, backAction) {
  return `<header class="bl-header">
    <button class="bl-icon-btn" data-action="${backAction}" aria-label="Back">${icon('back')}</button>
    <h1 class="bl-title">${esc(title)}</h1><span class="bl-header-spacer"></span></header>`;
}
const infoRow = (label, value) => `<div class="bl-info"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
const section = (text) => `<div class="bl-section">${esc(text)}</div>`;
const meter = (label, value, iconName, color) => `<div class="bl-meter">
    <span class="bl-meter-label">${iconName ? `<i class="bl-stat-icon" style="color:${color}">${icon(iconName)}</i>` : ''}${esc(label)}</span>
    <span class="bl-track"><span class="bl-fill" style="width:${value}%"></span></span><span class="bl-meter-value">${value}%</span></div>`;
const actionsRow = () => infoRow('Actions left this year', `${state.actionsRemaining} of ${G.ACTIONS_PER_YEAR}`);
function row(title, subtitle, iconName, action, extra = '') {
  return `<button class="bl-row" data-action="${action}" ${extra}>
    <span class="bl-badge">${icon(iconName)}</span>
    <span class="bl-row-text"><span class="bl-row-title">${esc(title)}</span>${subtitle ? `<span class="bl-row-sub">${esc(subtitle)}</span>` : ''}</span>
    <span class="bl-chevron" aria-hidden="true">›</span></button>`;
}
function screenShell(title, backAction, body) {
  return `${header(title, backAction)}<div class="bl-scroll">${body}</div>`;
}

// ---- Modals ---------------------------------------------------------------------

function showMessage(title, message, button = 'Continue') {
  return new Promise((resolve) => {
    modalRoot.innerHTML = `<div class="bl-overlay"><div class="bl-modal" role="dialog" aria-modal="true" aria-labelledby="bl-modal-title">
      <h2 id="bl-modal-title">${esc(title)}</h2><p>${esc(message)}</p>
      <button class="bl-primary" data-choice="0">${esc(button)}</button></div></div>`;
    const btn = modalRoot.querySelector('button');
    btn.focus();
    btn.addEventListener('click', () => { modalRoot.innerHTML = ''; resolve(0); });
  });
}

function showDecision(decision) {
  return new Promise((resolve) => {
    const buttons = decision.choices.map((c, i) => `<button class="bl-primary" data-choice="${i}">${esc(c.label)}</button>`).join('');
    modalRoot.innerHTML = `<div class="bl-overlay"><div class="bl-modal" role="dialog" aria-modal="true" aria-labelledby="bl-modal-title">
      <h2 id="bl-modal-title">${esc(decision.title)}</h2><p>${esc(decision.description)}</p>${buttons}</div></div>`;
    modalRoot.querySelector('button').focus();
    modalRoot.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      modalRoot.innerHTML = '';
      resolve(Number(b.dataset.choice));
    }));
  });
}

async function busyYear() {
  await showMessage('Busy Year', "You've done a lot this year. Age up to continue.", 'OK');
}

// ---- Screens --------------------------------------------------------------------

function renderMain() {
  const p = player();
  let journal = '';
  let lastAge = -1;
  for (const event of state.timeline) {
    if (event.age !== lastAge) {
      journal += `<h3 class="bl-year">Age: ${event.age} ${event.age === 1 ? 'year' : 'years'}</h3>`;
      lastAge = event.age;
    }
    journal += `<p class="bl-event bl-${event.kind}">${esc(event.description)}</p>`;
  }
  const first = isEnrolled(state.education) ? ['School', 'cap', 'school'] : isEmployed(state.career) ? ['Career', 'briefcase', 'career'] : ['Jobs', 'briefcase', 'jobs'];
  const nav = (label, iconName, target) => `<button class="bl-nav-item" data-action="go" data-target="${target}"><span class="bl-nav-ring">${icon(iconName)}</span>${label}</button>`;
  return `<header class="bl-header bl-header-main">
      <button class="bl-icon-btn" data-action="go" data-target="menu" aria-label="Menu">${icon('menu')}</button>
      <div class="bl-brand"><span>BET</span><span class="bl-brand-accent">LIFE</span></div><span class="bl-header-spacer"></span></header>
    <div class="bl-strip">
      <div class="bl-avatar" aria-hidden="true"><span class="bl-avatar-hair"></span><span class="bl-avatar-face"><i></i><i></i><b></b></span><span class="bl-avatar-shirt"></span></div>
      <div class="bl-identity"><strong>${esc(p.name)}</strong><span>${esc(p.occupation)}</span></div>
      <div class="bl-money"><strong>${money(p.money)}</strong><span>Bank Balance</span></div></div>
    <div class="bl-journal" id="bl-journal">${journal}</div>
    <nav class="bl-nav" aria-label="Game sections">
      ${nav(first[0], first[1], first[2])}${nav('Assets', 'house', 'assets')}
      <span class="bl-nav-gap" aria-hidden="true"></span>
      ${nav('Relationships', 'people', 'relationships')}${nav('Activities', 'star', 'activities')}
      <button class="bl-age" data-action="age" aria-label="Age one year"><span class="bl-age-plus">+</span><span>Age</span></button></nav>
    <div class="bl-stats">
      ${meter('Happiness', p.happiness, 'smile', '#f3b927')}${meter('Health', p.health, 'heart', '#e0484b')}
      ${meter('Smarts', p.smarts, 'bulb', '#3b82f6')}${meter('Looks', p.looks, 'sparkle', '#e85d9b')}</div>`;
}

function renderMenu() {
  return screenShell('Menu', 'home', `
    ${infoRow('Game', 'BetLife ' + VERSION)}${infoRow('Character', player().name)}${infoRow('Age', player().age + ' years')}
    ${section('Options')}
    ${row('About BetLife', 'How the game works', 'info', 'about')}
    ${row('Reset Life', 'Start over as Alex at 16', 'reset', 'reset')}
    <a class="bl-row bl-row-link" href="../../">${`<span class="bl-badge">${icon('exit')}</span><span class="bl-row-text"><span class="bl-row-title">Back to Arcade</span><span class="bl-row-sub">Leave the game</span></span><span class="bl-chevron" aria-hidden="true">›</span>`}</a>`);
}

function renderSchool() {
  const e = state.education;
  const university = e.stage === 'university';
  let actions = '';
  if (e.stage === 'highSchool') {
    actions = row('Study Harder', '+5 Performance, +2 Smarts', 'arrowUp', 'studyHarder')
      + row('Skip Studying', '-5 Performance, +2 Happiness', 'arrowDown', 'skipStudying')
      + row('Visit School Library', '+2 Smarts, +2 Performance', 'book', 'visitSchoolLibrary');
  } else if (university) {
    actions = row('Study Harder', '+5 Performance, +2 Smarts', 'arrowUp', 'studyHarder')
      + row('Attend Class', '+4 Performance, +1 Smarts', 'cap', 'attendClass')
      + row('Skip Class', '-6 Performance, +3 Happiness', 'arrowDown', 'skipClass')
      + row('Visit Library', '+2 Smarts, +2 Performance', 'book', 'visitSchoolLibrary');
  } else {
    actions = infoRow('Status', 'Not enrolled');
  }
  return screenShell(university ? 'University' : 'School', 'home', `
    ${infoRow('School', schoolName(e))}${isEnrolled(e) ? infoRow(university ? 'Year' : 'Grade', yearLabel(e)) : ''}
    ${e.major ? infoRow('Major', e.major) : ''}
    ${meter('Performance', e.performance)}${meter('Smarts', player().smarts)}${actionsRow()}
    ${section('Actions')}${actions}`);
}

function renderUniversity() {
  const notes = ['Software, algorithms and problem solving', 'Management, marketing and finance', 'Life sciences and laboratory work', 'Drawing, design and creative practice'];
  return screenShell('University', 'home', `
    ${infoRow('University', UNIVERSITY_NAME)}${infoRow('Length', UNIVERSITY_YEARS + ' years')}
    ${section('Choose a major')}
    ${MAJORS.map((m, i) => row(m, notes[i], 'cap', 'enroll', `data-major="${esc(m)}"`)).join('')}`);
}

function renderJobs() {
  const e = state.education;
  const enroll = e.highSchoolGraduate && !e.degree && !isEnrolled(e)
    ? section('Education') + row('Enroll in University', 'Four years, choose a major', 'cap', 'go', 'data-target="university"') : '';
  return screenShell('Jobs', 'home', `
    ${infoRow('Education', educationSummary(e))}${infoRow('Smarts', player().smarts + '%')}${enroll}
    ${section('Open positions')}
    ${JOBS.map((j) => row(j.title, `${j.company} · ${money(j.salary)} · ${requirementText(j)}`, 'briefcase', 'apply', `data-job="${j.id}"`)).join('')}`);
}

function renderCareer() {
  const c = state.career;
  if (!isEmployed(c)) {
    return screenShell('Career', 'home', `${infoRow('Status', 'Not employed')}${section('Actions')}${row('Browse Jobs', 'See open positions', 'briefcase', 'go', 'data-target="jobs"')}`);
  }
  const job = currentJob(c);
  return screenShell('Career', 'home', `
    ${infoRow('Position', job.title)}${infoRow('Company', job.company)}${infoRow('Salary', money(job.salary) + ' / year')}
    ${infoRow('Years employed', String(c.yearsEmployed))}${meter('Performance', c.performance)}${actionsRow()}
    ${section('Actions')}
    ${row('Work Harder', '+6 Performance, -1 Happiness', 'arrowUp', 'workHarder')}
    ${row('Take It Easy', '-4 Performance, +3 Happiness', 'sun', 'takeItEasy')}
    ${row('Quit Job', 'Leave ' + job.company, 'arrowDown', 'quit')}`);
}

function renderAssets() {
  const assets = state.assets.length === 0 ? infoRow('None yet', '')
    : state.assets.map((a) => infoRow(`${a.name} (${a.type})`, money(a.value))).join('');
  const salary = isEmployed(state.career) ? infoRow('Yearly salary', money(currentJob(state.career).salary)) : '';
  return screenShell('Assets', 'home', `
    ${infoRow('Bank Balance', money(player().money))}${infoRow('Net Worth', money(G.netWorth(state)))}
    ${infoRow('Yearly expenses', money(G.yearlyExpenses(state)))}${salary}
    ${section('Owned Assets')}${assets}
    ${section('Actions')}${row('Go Shopping', 'Browse things to buy', 'bag', 'go', 'data-target="shopping"')}`);
}

function personRow(r, index) {
  return `<button class="bl-row bl-person" data-action="person" data-index="${index}">
    <span class="bl-badge">${icon('person')}</span>
    <span class="bl-row-text"><span class="bl-row-title">${esc(r.name)}</span><span class="bl-row-sub">${esc(r.type)}</span>
      <span class="bl-mini-meter"><span class="bl-track"><span class="bl-fill" style="width:${r.level}%"></span></span><span>${r.level}%</span></span></span>
    <span class="bl-chevron" aria-hidden="true">›</span></button>`;
}

function renderRelationships() {
  const rows = (family) => state.relationships.map((r, i) => (G.isFamily(r) === family ? personRow(r, i) : '')).join('');
  return screenShell('Relationships', 'home', `${actionsRow()}${section('Family')}${rows(true)}${section('Friends')}${rows(false)}`);
}

function renderPerson() {
  const r = state.relationships[selectedPerson];
  return screenShell(r.name, 'relationships', `
    ${infoRow('Relationship', r.type)}${meter('Closeness', r.level)}${actionsRow()}
    ${section('Actions')}
    ${row('Spend Time', '+5 Closeness, +2 Happiness', 'sun', 'spendTime')}
    ${row('Compliment', '+3 Closeness, +1 Happiness', 'chat', 'compliment')}
    ${row('Argue', '-8 Closeness, -3 Happiness', 'arrowDown', 'argue')}`);
}

function renderActivities() {
  return screenShell('Activities', 'home', `${actionsRow()}${section('Categories')}
    ${row('Mind & Body', 'Take care of yourself', 'figure', 'go', 'data-target="mindbody"')}
    ${row('Doctor', 'Check on your health', 'cross', 'go', 'data-target="doctor"')}
    ${row('Library', 'Read and learn', 'book', 'go', 'data-target="library"')}
    ${row('Shopping', 'Spend some money', 'bag', 'go', 'data-target="shopping"')}
    ${row('Recreation', 'Have some fun', 'ball', 'go', 'data-target="recreation"')}`);
}

function renderLibrary() {
  return screenShell('Library', 'activities', `<div class="bl-page">
    <div class="bl-big-icon">${icon('book')}</div><h2>Library</h2>
    <p>A quiet place full of books. Reading can improve your Smarts.</p>
    <p class="bl-muted">Smarts: ${player().smarts}% · Actions left: ${state.actionsRemaining} of ${G.ACTIONS_PER_YEAR}</p>
    <button class="bl-primary" data-action="readBook">READ A BOOK</button>
    <button class="bl-text-btn" data-action="go" data-target="activities">Back</button></div>`);
}

function renderMindBody() {
  return screenShell('Mind & Body', 'activities', `${meter('Happiness', player().happiness)}${meter('Health', player().health)}${actionsRow()}
    ${section('Actions')}
    ${row('Meditate', '+4 Happiness, +1 Health', 'figure', 'meditate')}
    ${row('Go for a Walk', '+3 Health, +2 Happiness', 'footprints', 'goForWalk')}`);
}

function renderRecreation() {
  return screenShell('Recreation', 'activities', `${meter('Happiness', player().happiness)}${meter('Health', player().health)}${actionsRow()}
    ${section('Actions')}
    ${row('Play a Game', '+4 Happiness', 'ball', 'playGame')}
    ${row('Spend Time Outside', '+2 Happiness, +2 Health', 'sun', 'spendTimeOutside')}`);
}

function renderDoctor() {
  return screenShell('Doctor', 'activities', `${infoRow('Clinic', 'Cedar Grove Family Clinic')}${infoRow('Bank Balance', money(player().money))}
    ${meter('Health', player().health)}${actionsRow()}
    ${section('Services')}${row('General Checkup', money(G.CHECKUP_COST) + ' · +3 Health', 'cross', 'doctor')}`);
}

function renderShopping() {
  const items = G.SHOP_ITEMS.map((item, i) => {
    let sub = `${money(item.cost)} · ${item.type}`;
    if (G.ownsAsset(state, item.name)) sub = 'Already owned';
    else if (!G.itemAvailable(state, item)) sub += ' · Adults only';
    return row(item.name, sub, item.name.includes('Car') ? 'car' : 'bike', 'buy', `data-item="${i}"`);
  }).join('');
  return screenShell('Shopping', 'activities', `${infoRow('Bank Balance', money(player().money))}${section('For sale')}${items}`);
}

const SCREENS = {
  main: renderMain, menu: renderMenu, school: renderSchool, university: renderUniversity, jobs: renderJobs,
  career: renderCareer, assets: renderAssets, relationships: renderRelationships, person: renderPerson,
  activities: renderActivities, library: renderLibrary, mindbody: renderMindBody, recreation: renderRecreation,
  doctor: renderDoctor, shopping: renderShopping,
};

function render() {
  G.saveGame(state);
  root.innerHTML = SCREENS[screen]();
  root.dataset.screen = screen;
  if (screen === 'main') {
    const journal = document.getElementById('bl-journal');
    journal.scrollTop = journal.scrollHeight;
  } else {
    root.querySelector('.bl-scroll').scrollTop = 0;
  }
}

function go(target) {
  screen = target === 'home' ? 'main' : target;
  render();
}

// ---- Actions --------------------------------------------------------------------

async function doAction(fn, title, message) {
  if (!G.hasActionsLeft(state)) { await busyYear(); return; }
  fn(state);
  render();
  await showMessage(title, message);
}

const FEEDBACK = {
  readBook: [G.readBook, 'Well Read', `You spent some time reading and learned something new. Smarts +${G.READ_BOOK_SMARTS}.`],
  meditate: [G.meditate, 'Calm Mind', 'You took some quiet time to meditate. Happiness +4, Health +1.'],
  goForWalk: [G.goForWalk, 'Fresh Air', 'A long walk cleared your head. Health +3, Happiness +2.'],
  playGame: [G.playGame, 'Game On', 'You had a blast playing games. Happiness +4.'],
  spendTimeOutside: [G.spendTimeOutside, 'Sunny Day', 'Some fresh air did you good. Happiness +2, Health +2.'],
  studyHarder: [G.studyHarder, 'Study Complete', 'You put in the extra hours. Performance +5, Smarts +2.'],
  skipStudying: [G.skipStudying, 'Free Time', 'You took the evening off. Performance -5, Happiness +2.'],
  visitSchoolLibrary: [G.visitSchoolLibrary, 'Quiet Study', 'You studied in the library. Smarts +2, Performance +2.'],
  attendClass: [G.attendClass, 'Front Row', 'You attended every lecture. Performance +4, Smarts +1.'],
  skipClass: [G.skipClass, 'Campus Life', 'You skipped a few classes. Performance -6, Happiness +3.'],
  workHarder: [G.workHarder, 'Hard Work', 'Your effort was noticed. Performance +6, Happiness -1.'],
  takeItEasy: [G.takeItEasyAtWork, 'Easy Days', 'You kept things relaxed at work. Performance -4, Happiness +3.'],
};

async function onAge() {
  if (!state.pendingDecision) {
    G.ageUp(state);
    render();
  }
  while (state.pendingDecision) {
    const choice = await showDecision(G.currentDecision(state));
    const followUp = G.resolveDecision(state, choice);
    if (followUp === 'university') screen = 'university';
    if (followUp === 'jobs') screen = 'jobs';
    render();
  }
}

async function handle(action, data) {
  if (FEEDBACK[action]) {
    const [fn, title, message] = FEEDBACK[action];
    await doAction(fn, title, message);
    return;
  }
  const person = state.relationships[selectedPerson];
  switch (action) {
    case 'go': go(data.target); break;
    case 'home': go('main'); break;
    case 'age': await onAge(); break;
    case 'person': selectedPerson = Number(data.index); go('person'); break;
    case 'spendTime': await doAction((s) => G.spendTime(s, person), 'Good Time', `You and ${G.firstName(person)} had a great time together. Closeness +5, Happiness +2.`); break;
    case 'compliment': await doAction((s) => G.compliment(s, person), 'Nice Words', `${G.firstName(person)} appreciated the compliment. Closeness +3, Happiness +1.`); break;
    case 'argue': await doAction((s) => G.argue(s, person), 'Rough Moment', `You and ${G.firstName(person)} had an argument. Closeness -8, Happiness -3.`); break;
    case 'doctor': {
      const result = G.visitDoctor(state);
      render();
      if (result === 'success') await showMessage('All Clear', 'The doctor says you are doing well. Health +3.');
      else if (result === 'noMoney') await showMessage('Not Enough Money', `A checkup costs ${money(G.CHECKUP_COST)} and you cannot afford it right now.`);
      else await busyYear();
      break;
    }
    case 'buy': {
      const item = G.SHOP_ITEMS[Number(data.item)];
      const result = G.buy(state, item);
      render();
      const name = item.name.toLowerCase();
      if (result === 'success') await showMessage('New Asset', `You bought a ${name} for ${money(item.cost)}.`);
      else if (result === 'alreadyOwned') await showMessage('Already Owned', `You already own a ${name}.`);
      else if (result === 'tooYoung') await showMessage('Not Yet', `You need to be an adult to buy a ${name}.`);
      else await showMessage('Not Enough Money', `A ${name} costs ${money(item.cost)} and you cannot afford it right now.`);
      break;
    }
    case 'enroll': {
      G.enrollInUniversity(state, data.major);
      go('main');
      await showMessage('Enrolled', `Welcome to ${UNIVERSITY_NAME}! You are now studying ${data.major}.`);
      break;
    }
    case 'apply': {
      const job = JOBS.find((j) => j.id === data.job);
      if (G.applyForJob(state, job)) {
        go('main');
        await showMessage("You're Hired!", `Congratulations! You start as a ${job.title} at ${job.company} earning ${money(job.salary)} a year.`);
      } else {
        await showMessage('Not Qualified', `This position requires: ${requirementText(job)}.`);
      }
      break;
    }
    case 'quit': {
      const company = currentJob(state.career).company;
      const choice = await showDecision({ title: 'Quit Your Job?', description: `Are you sure you want to leave ${company}?`, choices: [{ label: 'Quit' }, { label: 'Stay' }] });
      if (choice === 0) { G.quitJob(state); go('main'); }
      break;
    }
    case 'about':
      await showMessage('About BetLife', `BetLife ${VERSION} is a life simulation built for the AP Computer Science Arcade. Press Age to move through the years, and use your ${G.ACTIONS_PER_YEAR} actions each year on school, work, activities and the people in your life.`);
      break;
    case 'reset': {
      const choice = await showDecision({ title: 'Reset Life?', description: 'This erases the current life and starts over as Alex at 16.', choices: [{ label: 'Reset' }, { label: 'Keep playing' }] });
      if (choice === 0) { G.clearSavedGame(); state = G.createNewGame(); go('main'); }
      break;
    }
    default: break;
  }
}

root.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el || modalRoot.firstChild) return;
  handle(el.dataset.action, el.dataset);
});

// A hash such as #menu opens that screen directly (used for deep links and screenshots).
const hashScreen = location.hash.slice(1);
if (SCREENS[hashScreen]) screen = hashScreen;
render();

// Exposed for automated testing only.
window.betlife = { getState: () => state, go, handle };
