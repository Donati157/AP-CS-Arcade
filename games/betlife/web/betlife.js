// BetLife browser controller: keeps the current screen, renders it from game state, shows the
// dialogs the simulation queues, and forwards clicks to the simulation API in game/game-state.js.
import * as G from './game/game-state.js';
import * as Career from './game/career.js';
import * as Careers from './game/careers.js';
import * as Assets from './game/assets.js';
import * as Activities from './game/activities.js';
import { withArticle } from './game/life-generator.js';
import { SCREENS } from './ui/screens.js';
import * as Modals from './ui/modals.js';
import { money, esc } from './ui/render.js';

export const VERSION = '2.1.0-web';

const root = document.getElementById('game');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

let state = G.loadGame();
let screen = state ? 'main' : 'start';
const sel = { person: null, asset: null, shop: null, category: null };
let uiModal = null;   // a confirmation asked by the interface (not saved)
let postLifeOpen = false;
let toastTimer = null;

// ---- Rendering ----------------------------------------------------------------------------------------------

function render() {
  if (!state && !['start', 'newlife', 'about'].includes(screen)) screen = 'start';
  if (state) G.saveGame(state);
  const ctx = { state, sel, version: VERSION };
  root.innerHTML = (SCREENS[screen] || SCREENS.main)(ctx);
  root.dataset.screen = screen;
  const journal = document.getElementById('bl-journal');
  if (journal) journal.scrollTop = journal.scrollHeight;
  const scroll = root.querySelector('.bl-scroll');
  if (scroll && screen !== 'main') scroll.scrollTop = 0;
  renderModal();
}

function renderModal() {
  if (uiModal) { modalRoot.innerHTML = Modals.confirm(uiModal); focusModal(); return; }
  if (postLifeOpen && state) { modalRoot.innerHTML = Modals.postLife(state.player.name, !!state.profile); focusModal(); return; }
  const modal = state ? G.currentModal(state) : null;
  if (!modal) { modalRoot.innerHTML = ''; return; }
  if (modal.kind === 'decision') modalRoot.innerHTML = Modals.decision(modal, state);
  else if (modal.kind === 'death') modalRoot.innerHTML = Modals.death(G.lifeSummary(state));
  else modalRoot.innerHTML = Modals.info(modal, state);
  focusModal();
}

function focusModal() {
  const first = modalRoot.querySelector('button');
  if (first) first.focus();
}

function go(target) {
  screen = target === 'home' ? 'main' : target;
  render();
}

function toast(title, text, tone = 'blue') {
  toastRoot.innerHTML = `<div class="bl-toast tone-${tone}"><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastRoot.innerHTML = ''; }, 3200);
}

// Shows an action result: failures as a toast, successes as a toast too (the journal keeps the line).
function report(result) {
  if (!result) return;
  if (result.facts) { uiModal = { title: result.title, text: result.text, facts: result.facts, choices: ['OK'], icon: 'briefcase', band: 'Career' }; render(); return; }
  toast(result.title, result.text, result.ok ? 'green' : 'red');
  render();
}

// Asks a yes/no question. Resolves with the index of the chosen button.
function ask(opts) {
  return new Promise((resolve) => {
    uiModal = { ...opts, resolve };
    render();
  });
}

// ---- Life start ------------------------------------------------------------------------------------------------

function startNewLife(custom) {
  G.clearSavedGame();
  state = G.createNewGame(custom);
  screen = 'main';
  sel.person = sel.asset = sel.shop = sel.category = null;
  uiModal = null;
  render();
  postLifeOpen = false;
  const p = state.player;
  uiModal = { title: 'A New Life Begins', text: `${p.name} was just born in ${p.birthplace}. Press Age to grow up, and make every year count.`, choices: ["Let's go"], icon: 'sparkle', band: 'Life', tone: 'green' };
  render();
}

async function newLifeFlow() {
  const choice = await ask({ title: 'New Life', band: 'Life', icon: 'sparkle', text: state && state.player.alive ? 'Starting a new life erases the current one. Start with a random life or create your own.' : 'Start with a randomly generated life or create your own.',
    choices: ['New Random Life', 'New Custom Life', 'Cancel'] });
  if (choice === 0) startNewLife({});
  else if (choice === 1) go('newlife');
}

// ---- Age ----------------------------------------------------------------------------------------------------------

function onAge() {
  if (!state || !state.player.alive) return;
  if (state.pending.length > 0) { render(); return; }
  root.classList.add('is-aging');
  G.ageUp(state);
  render();
  setTimeout(() => root.classList.remove('is-aging'), 350);
}

// Answers the dialog on top of the queue (a saved simulation dialog or an interface confirmation).
function answer(choice) {
  if (uiModal) {
    const m = uiModal;
    uiModal = null;
    if (m.resolve) m.resolve(choice === 'ok' ? 0 : Number(choice));
    render();
    return;
  }
  if (postLifeOpen) {
    postLifeOpen = false;
    if (choice === 'random') startNewLife({});
    else if (choice === 'custom') go('newlife');
    else if (choice === 'retry') startNewLife(G.retryProfile(state));
    else render();
    return;
  }
  const modal = G.currentModal(state);
  if (!modal) return;
  if (modal.kind === 'death') {
    G.answerModal(state);
    postLifeOpen = true;
    render();
    return;
  }
  if (modal.kind !== 'decision') { G.answerModal(state); render(); return; }
  const index = choice === 'random' ? G.randomChoice(state, modal) : Number(choice);
  const followUp = G.answerModal(state, index);
  if (followUp === 'university') screen = 'university';
  else if (followUp === 'tradeSchool') screen = 'tradeSchool';
  else if (followUp === 'jobs') screen = 'jobs';
  render();
}

// ---- Clicks -------------------------------------------------------------------------------------------------------

async function handle(action, data) {
  switch (action) {
    case 'go':
      if (data.person) sel.person = data.person;
      if (data.asset) sel.asset = data.asset;
      if (data.shop) sel.shop = data.shop;
      if (data.category) sel.category = data.category;
      go(data.target); break;
    case 'home': go('main'); break;
    case 'age': onAge(); break;
    case 'newLife': if (state && !state.player.alive) { postLifeOpen = true; render(); } else await newLifeFlow(); break;
    case 'premium': toast(`${data.feature} is an admin tool`, 'Changing stats or rewinding years is a premium candidate and is not part of normal play.', 'blue'); break;
    case 'freelance': report(G.freelanceGig(state)); break;
    case 'recruiterConfirm': {
      const c = await ask({ title: 'Job Recruiter', band: 'Career', icon: 'chat', text: 'For $1,000 the recruiter places you in the best-paying job you qualify for.', facts: [['Fee', money(1000)], ['Bank Balance', money(state.player.money)]], choices: ["Let's try it", 'Not now'] });
      if (c === 0) { const result = G.jobRecruiter(state); if (result.ok) screen = 'main'; report(result); }
      break;
    }
    case 'changeName': {
      const form = new FormData(document.getElementById('bl-name-form'));
      const result = G.changeName(state, form.get('firstName'), form.get('lastName'));
      if (result.ok) screen = 'main';
      report(result);
      break;
    }
    case 'startRandom': startNewLife({}); break;
    case 'startCustom': {
      const form = new FormData(document.getElementById('bl-custom-form'));
      startNewLife({ firstName: form.get('firstName'), lastName: form.get('lastName'), gender: form.get('gender'), placeIndex: Number(form.get('placeIndex')) });
      break;
    }
    case 'about': go('about'); break;
    case 'person': sel.person = data.person; go('person'); break;
    case 'asset': sel.asset = data.asset; go('asset'); break;
    case 'activity': report(G.doActivity(state, data.activity)); break;
    case 'interact': report(G.interactWith(state, data.person, data.do)); break;
    case 'study': report(G.studyAction(state, data.study)); break;
    case 'job': report(G.jobAction(state, data.job)); break;
    case 'familyDay': report(G.familyDay(state)); break;
    case 'applyConfirm': {
      const career = Careers.findCareer(data.career);
      if (!career) break;
      const entry = career.ladder[0];
      const c = await ask({ title: 'Apply for this job?', band: 'Career', icon: 'briefcase', text: `${career.employer} is hiring ${withArticle(entry.title)}.`, facts: [['Title', entry.title], ['Career', career.name], ['Salary', `${money(entry.salary)} / year`], ['Requires', Careers.requirementText(career)]], choices: ['Apply', 'Not now'] });
      if (c === 0) { const result = G.applyForCareer(state, data.career); screen = result.ok ? 'main' : screen; report(result); }
      break;
    }
    case 'quitConfirm': {
      const c = await ask({ title: 'Resign?', band: 'Career', icon: 'exit', text: `Are you sure you want to leave ${Career.employer(state.career)}?`, choices: ['Resign', 'Stay'], danger: true });
      if (c === 0) { G.quitJob(state); toast('Resigned', 'You handed in your resignation.', 'blue'); go('main'); }
      break;
    }
    case 'retireConfirm': {
      const c = await ask({ title: 'Retire?', band: 'Career', icon: 'flag', text: `Retire now after ${state.career.yearsWorked} years of work? Your salary stops and a pension begins.`, choices: ['Retire', 'Keep working'] });
      if (c === 0) { G.retireNow(state); go('main'); }
      break;
    }
    case 'enrollUniversity': {
      if (G.enrollUniversity(state, data.major)) { go('main'); toast('Enrolled', `You are now studying ${data.major} at Harborview University.`, 'green'); }
      break;
    }
    case 'enrollTrade': {
      if (G.enrollTradeSchool(state, data.trade)) { go('main'); toast('Enrolled', `You are training in ${data.trade}.`, 'green'); }
      break;
    }
    case 'dropOut': {
      const c = await ask({ title: 'Leave your studies?', band: 'School', icon: 'exit', text: 'You would leave without a degree or certificate.', choices: ['Leave', 'Stay'], danger: true });
      if (c === 0) { G.dropOut(state); go('main'); }
      break;
    }
    case 'buyConfirm': {
      const shop = Assets.findShop(data.shop); const item = Assets.findItem(data.item);
      if (!shop || !item) break;
      const c = await ask({ title: item.name, band: 'Shopping', icon: 'bag', text: `Buy ${withArticle(item.name.toLowerCase())} from ${shop.name}?`, facts: [['Price', money(item.cost)], ['Bank Balance', money(state.player.money)]], choices: ['Buy', 'Not now'] });
      if (c === 0) {
        const verdict = G.buyItem(state, data.shop, data.item);
        if (verdict === 'ok') { toast('Purchased', `You bought ${withArticle(item.name.toLowerCase())}.`, 'green'); go(item.type === 'home' ? 'assets' : 'shop'); }
        else toast('Not Possible', { tooYoung: 'You are too young for that.', noLicence: 'You need a driving licence first.', owned: 'You already own one.', noMoney: 'You cannot afford that right now.' }[verdict] || 'Something went wrong.', 'red');
      }
      break;
    }
    case 'sellConfirm': {
      const a = Assets.findAsset(state, data.asset);
      if (!a) break;
      const c = await ask({ title: `Sell your ${a.name.toLowerCase()}?`, band: 'Belongings', icon: 'dollar', text: 'You will get part of its current value back.', facts: [['Value', money(a.value)]], choices: ['Sell', 'Keep'] });
      if (c === 0) { const price = G.sellAsset(state, data.asset); toast('Sold', `You received ${money(price)}.`, 'green'); go('assets'); }
      break;
    }
    case 'repair': {
      if (G.repairAsset(state, data.asset)) toast('Repaired', 'Good as new.', 'green'); else toast('Not Enough Money', 'You cannot afford the repair.', 'red');
      render();
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
modalRoot.addEventListener('click', (event) => {
  const el = event.target.closest('[data-choice]');
  if (el) answer(el.dataset.choice);
});

// Deep links such as #menu open that screen directly (used for screenshots and tests).
const hashScreen = location.hash.slice(1);
if (SCREENS[hashScreen] && (state || ['start', 'newlife', 'about'].includes(hashScreen))) screen = hashScreen;
render();

// Exposed for automated testing and debugging only.
window.betlife = {
  getState: () => state, go, handle, startNewLife, answer,
  statLog: () => (state ? state.statLog.map((e) => `${e.age}: ${e.stat} ${e.from} → ${e.to} (${e.change > 0 ? '+' : ''}${e.change}) ${e.reason}`) : []),
  activities: Activities.CATEGORIES,
};
