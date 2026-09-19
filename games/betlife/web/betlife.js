// BetLife browser controller: keeps the current screen, renders it from game state, shows the
// dialogs the simulation queues, and forwards clicks to the simulation API in game/game-state.js.
import * as G from './game/game-state.js';
import * as Career from './game/career.js';
import * as Careers from './game/careers.js';
import * as Assets from './game/assets.js';
import * as Activities from './game/activities.js';
import * as People from './game/people.js';
import * as Education from './game/education.js';
import { withArticle } from './game/life-generator.js';
import { SCREENS } from './ui/screens.js';
import * as Modals from './ui/modals.js';
import { money, esc } from './ui/render.js';

export const VERSION = '2.6.2-web';

const root = document.getElementById('game');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');

let state = G.loadGame();
let screen = state ? 'main' : 'start';
const sel = { person: null, asset: null, shop: null, category: null, source: null };
let uiModal = null;   // a confirmation asked by the interface (not saved)
let postLifeOpen = false;
let bannerTimer = null;
let eyeTimer = null;

// The eye exam counts down; running out of time fails it.
function startEyeTimer(modal) {
  clearInterval(eyeTimer);
  if (modal.game !== 'eyeExam') return;
  let left = 8;
  eyeTimer = setInterval(() => {
    left -= 1;
    const el = document.getElementById('bl-eye-timer');
    if (el) el.textContent = `Time remaining: ${left} seconds`;
    if (left <= 0) { clearInterval(eyeTimer); if (G.currentModal(state) === modal) answer('fail'); }
  }, 1000);
}
let toastTimer = null;

// ---- Rendering ----------------------------------------------------------------------------------------------

function render() {
  if (!state && !['start', 'newlife', 'about', 'splash', 'disclaimer'].includes(screen)) screen = 'start';
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
  if (uiModal && uiModal.kind === 'language') { modalRoot.innerHTML = Modals.languageCard(uiModal.current); return; }
  if (uiModal) { modalRoot.innerHTML = Modals.confirm(uiModal); focusModal(); return; }
  if (postLifeOpen && state) { modalRoot.innerHTML = Modals.postLife(state.player.name, !!state.profile, People.children(state)); focusModal(); return; }
  const modal = state ? G.currentModal(state) : null;
  if (!modal) { modalRoot.innerHTML = ''; return; }
  if (modal.kind === 'badge') {
    modalRoot.innerHTML = Modals.badgeBanner(modal);
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { if (G.currentModal(state) === modal) answer('ok'); }, 3000);
    return;
  }
  if (modal.kind === 'minigame') { modalRoot.innerHTML = Modals.minigame(modal, state); startEyeTimer(modal); focusModal(); return; }
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
  const wasIntro = screen === 'disclaimer' || screen === 'splash';
  screen = target === 'home' ? 'main' : target;
  let setup = '1';
  try { setup = localStorage.getItem('betlife.web.setup'); } catch { /* ignore */ }
  if (wasIntro && screen === 'start' && !setup) uiModal = { kind: 'language', current: 'en' };
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
  if (result.silent) { render(); return; }
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
  postLifeOpen = false;
  render();
}

async function newLifeFlow() {
  const choice = await ask({ title: 'New Life', band: 'Life', icon: 'sparkle', text: 'Starting a new life erases the current one. Start with a random life or create your own.',
    choices: ['New Random Life', 'New Custom Life', 'Cancel'] });
  if (choice === 0) startNewLife({});
  else if (choice === 1) go('newlife');
}

// ---- Age ----------------------------------------------------------------------------------------------------------

function onAge() {
  if (!state || !state.player.alive) return;
  while (state.pending.length && state.pending[0].kind === 'badge') G.answerModal(state);   // a badge banner never blocks aging
  clearTimeout(bannerTimer);
  if (state.pending.length > 0) { render(); return; }
  root.classList.add('is-aging');
  G.ageUp(state);
  render();
  setTimeout(() => root.classList.remove('is-aging'), 350);
}

// Answers the dialog on top of the queue (a saved simulation dialog or an interface confirmation).
function answer(choice) {
  if (choice === 'undoDeath') { toast('Rewind is an admin tool', 'Undoing a death is a premium candidate and is not part of normal play.', 'blue'); return; }
  if (uiModal && uiModal.kind === 'language') {
    if (choice !== 'language') return;
    const select = document.getElementById('bl-lang');
    const lang = select ? select.value : 'en';
    try { localStorage.setItem('betlife.web.language', lang); localStorage.setItem('betlife.web.setup', '1'); } catch { /* private mode */ }
    uiModal = null;
    render();
    if (lang !== 'en') toast('Language', 'BetLife text is available in English for now. Your choice was saved.', 'blue');
    return;
  }
  if (uiModal) {
    const m = uiModal;
    uiModal = null;
    if (m.resolve) m.resolve(choice === 'ok' ? 0 : Number(choice));
    render();
    return;
  }
  if (postLifeOpen) {
    postLifeOpen = false;
    if (String(choice).startsWith('child:')) { const next = G.continueAsChild(state, String(choice).slice(6)); if (next) { G.clearSavedGame(); state = next; screen = 'main'; render(); uiModal = { title: 'The Story Continues', text: `You are now ${state.player.name}, age ${state.player.age}. Press Age to keep the family story going.`, choices: ['Continue'], icon: 'seedling', band: 'Life', tone: 'green' }; render(); } return; }
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
  if (modal.kind === 'minigame') { clearInterval(eyeTimer); G.answerModal(state, choice === 'pass'); render(); toast(choice === 'pass' ? 'Passed!' : 'Not this time', modal.game === 'drivingQuiz' ? (choice === 'pass' ? 'You got your license.' : 'You can try again next year.') : (choice === 'pass' ? 'Your eyes are fine.' : 'You got glasses.'), choice === 'pass' ? 'green' : 'red'); return; }
  if (modal.kind !== 'decision') { G.answerModal(state); render(); return; }
  const index = choice === 'random' ? G.randomChoice(state, modal) : Number(choice);
  if (!Number.isFinite(index) || !modal.choices[index]) { render(); return; }   // ignore stray answers to a decision
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
      if (data.source) sel.source = data.source;
      go(data.target); break;
    case 'home': go('main'); break;
    case 'age': onAge(); break;
    case 'newLife':
      if (state && !state.player.alive) { postLifeOpen = true; render(); }
      else if (!state) startNewLife({});
      else await newLifeFlow();
      break;
    case 'socialSignUp': report(G.socialSignUp(state, data.source)); break;
    case 'socialPost': report(G.socialPost(state, data.source)); break;
    case 'socialDelete': { const c = await ask({ title: 'Delete account?', band: 'Social Media', icon: 'phone', text: 'Your followers will be gone for good.', choices: ['Delete', 'Keep it'], danger: true }); if (c === 0) { sel.source = null; screen = 'socialMedia'; report(G.socialDelete(state, data.source)); } break; }
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
    case 'activity': {
      const act = Activities.findActivity(data.activity);
      if (act && act.cost > 0 && !Activities.unavailableReason(state, act)) {
        const effects = Object.entries(act.effects).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k[0].toUpperCase()}${k.slice(1)}`).join(', ');
        const c = await ask({ title: act.name, band: 'Activities', icon: act.icon || 'star', text: act.sub, facts: [['Cost', money(act.cost)], ...(effects ? [['Effect', effects]] : []), ['Bank Balance', money(state.player.money)]], choices: [act.name, 'Not now'] });
        if (c !== 0) break;
      }
      report(G.doActivity(state, data.activity)); break;
    }
    case 'hr': report(G.humanResources(state, data.hr)); break;
    case 'assetAction': {
      if (data.do === 'scrap') { const c = await ask({ title: 'Scrap it?', band: 'Belongings', icon: 'exit', text: 'Scrapping pays only a tenth of the value.', choices: ['Scrap', 'Keep'], danger: true }); if (c !== 0) break; }
      const result = G.assetAction(state, data.asset, data.do, data.person || null);
      if (result.ok && ['scrap', 'gift'].includes(data.do)) screen = 'assets';
      report(result); break;
    }
    case 'adoptConfirm': {
      const c = await ask({ title: 'Adopt this pet?', band: 'Pets', icon: 'paw', text: 'A pet joins your family for life.', choices: ['Adopt', 'Not now'] });
      if (c === 0) { const result = G.adoptFromSource(state, data.source, data.animal); if (result.ok) screen = 'pets'; report(result); }
      break;
    }
    case 'programConfirm': {
      const pr = Education.PROGRAMS[data.program];
      if (!pr) break;
      const c = await ask({ title: pr.name, band: 'Education', icon: 'cap', text: `${pr.school}: ${pr.note}.`, facts: [['Length', `${pr.years} years`], ['Tuition', `${money(pr.tuition)} / year`], ['Result', pr.credential]], choices: ['Enroll', 'Not now'] });
      if (c === 0) { if (G.enrollProgram(state, data.program)) { go('main'); toast('Enrolled', `You are now studying at ${pr.school}.`, 'green'); } }
      break;
    }
    case 'interact': report(G.interactWith(state, data.person, data.do)); break;
    case 'study': report(G.studyAction(state, data.study)); break;
    case 'job': report(G.jobAction(state, data.job)); break;
    case 'familyDay': report(G.familyDay(state)); break;
    case 'applyConfirm': {
      const career = Careers.findCareer(data.career);
      if (!career) break;
      const entry = career.ladder[0];
      const c = await ask({ title: 'Apply for this job?', band: 'Career', icon: 'briefcase', text: `${career.employer} is hiring ${withArticle(entry.title)}.`, facts: [['Title', entry.title], ['Career', career.name], ['Salary', `${money(entry.salary)} / year`], ['Requires', Careers.requirementText(career)]], choices: ['Apply', 'Not now'] });
      if (c === 0) {
        const result = G.applyForCareer(state, data.career);
        if (result.ok) { screen = 'main'; report(result); }
        else { uiModal = { title: 'Application Rejected', band: 'Career', icon: 'briefcase', tone: 'red', text: `${career.employer} turned you down. ${result.text}`, choices: ['OK'] }; render(); }
      }
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
        else { uiModal = { title: 'Not So Fast', band: 'Shopping', icon: 'shopping', tone: 'red', text: { tooYoung: 'You are too young to buy that.', noLicence: `You need a driving licence before ${shop.name} will sell you ${withArticle(item.name.toLowerCase())}.`, owned: 'You already own one of those.', noMoney: `You cannot afford ${withArticle(item.name.toLowerCase())} right now.` }[verdict] || 'Something went wrong.', choices: ['OK'] }; render(); }
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
  if (!el) return;
  if (modalRoot.firstChild && !modalRoot.querySelector('.bl-banner')) return;   // badge banners do not block navigation
  handle(el.dataset.action, el.dataset);
});
modalRoot.addEventListener('click', (event) => {
  const el = event.target.closest('[data-choice]');
  if (el) answer(el.dataset.choice);
});

// Screenshot fixtures (development only): ?seed=7&age=27 builds a deterministic life, and
// &modal=decision|info|person|death|postlife|banner stages a dialog on top of it.
const params = new URLSearchParams(location.search);
if (params.has('seed')) {
  const { simulateTo } = await import('./game/simulate.js');
  state = simulateTo(Number(params.get('seed')) || 1, Number(params.get('age')) || 0);
  state.pending.length = 0;
  if (params.get('category')) sel.category = params.get('category');
  if (params.get('shop')) sel.shop = params.get('shop');
  if (params.get('person') === 'first') { const who = state.relationships.find((r) => r.alive && r.role !== 'pet'); if (who) sel.person = who.id; }
  if (params.get('asset') === 'first') {
    if (!state.assets.some((a) => a.type === 'vehicle')) { state.player.money += 20000; state.player.hasLicence = true; G.buyItem(state, 'usedCars', 'usedSedan'); }
    const vehicle = state.assets.find((a) => a.type === 'vehicle') || state.assets[0]; if (vehicle) sel.asset = vehicle.id;
  }
  const fixtureModal = params.get('modal');
  if (fixtureModal === 'decision') state.pending.push({ kind: 'decision', eventId: 'fixture', band: 'Childhood', title: 'Favorite Toy', icon: 'toy', text: 'You are playing with some friends when a smaller kid grabs the toy xylophone right out of your hands.', choices: [{ label: 'Cry' }, { label: 'Let them play with it' }, { label: 'Take it back' }, { label: 'Tell a grown-up' }] });
  if (fixtureModal === 'info') state.pending.push({ kind: 'info', band: 'School', tone: 'blue', icon: 'cap', title: 'Primary School', text: 'You are starting primary school.', facts: [['School', 'Maple Grove Elementary'], ['Type', 'Public'], ['Level', 'Elementary School'], ['Years', '6']] });
  if (fixtureModal === 'person' || fixtureModal === 'love') {
    const { personRequest } = await import('./game/events/engine.js');
    const People = await import('./game/people.js');
    const who = fixtureModal === 'love' ? People.startDating(state) : People.addFriend(state, { age: state.player.age, occupation: 'student' });
    if (who) personRequest(state, who, fixtureModal === 'love' ? 'loveRequest' : 'friendRequest');
  }
  if (params.get('enemy')) { const People = await import('./game/people.js'); People.makeEnemy(state, { age: state.player.age }); const pet = state.relationships.find((r) => r.role === 'pet'); if (pet) { pet.alive = false; pet.diedAt = state.player.age - 3; } }
  if (params.get('social')) { const acc = G.socialAccounts(state); acc.chirper = { followers: 1240, since: 18, posts: 12 }; }
  if (fixtureModal === 'death') { state.player.alive = false; state.pending.push({ kind: 'death' }); }
  if (fixtureModal === 'postlife') { state.player.alive = false; postLifeOpen = true; }
  if (fixtureModal === 'banner') state.pending.push({ kind: 'badge', id: 'firstSteps', name: 'First Steps', desc: 'Reach age 1' });
}

// First start ever: splash, disclaimer, then the empty life frame with the language card.
let firstRun = false;
try { firstRun = !state && !localStorage.getItem('betlife.web.setup') && !params.has('seed') && !location.hash; } catch { firstRun = false; }
if (firstRun) {
  screen = 'splash';
  setTimeout(() => { if (screen === 'splash') { screen = 'disclaimer'; render(); } }, 1700);
  setTimeout(() => { if (screen === 'disclaimer') go('start'); }, 5200);
}
if (params.get('fixture') === 'splash') screen = 'splash';
if (params.get('fixture') === 'disclaimer') screen = 'disclaimer';
if (params.get('fixture') === 'language') { screen = 'start'; uiModal = { kind: 'language', current: 'en' }; }

// Deep links such as #menu open that screen directly (used for screenshots and tests).
const hashScreen = location.hash.slice(1);
if (SCREENS[hashScreen] && (state || ['start', 'newlife', 'about'].includes(hashScreen))) screen = hashScreen;
if (!SCREENS[screen]) screen = state ? 'main' : 'start';
render();

// Exposed for automated testing and debugging only.
window.betlife = {
  getState: () => state, go, handle, startNewLife, answer,
  statLog: () => (state ? state.statLog.map((e) => `${e.age}: ${e.stat} ${e.from} → ${e.to} (${e.change > 0 ? '+' : ''}${e.change}) ${e.reason}`) : []),
  activities: Activities.CATEGORIES,
};
