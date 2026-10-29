// BetLife browser controller: keeps the current screen, renders it from game state, shows the
// dialogs the simulation queues, and forwards clicks to the simulation API in game/game-state.js.
import * as G from './game/game-state.js';
import * as Career from './game/career.js';
import * as Careers from './game/careers.js';
import * as Assets from './game/assets.js';
import * as Activities from './game/activities.js';
import * as People from './game/people.js';
import * as Education from './game/education.js';
import * as Pets from './game/pets.js';
import { withArticle } from './game/life-generator.js';
import { pushModal } from './game/journal.js';
import { SCREENS } from './ui/screens.js';
import * as Modals from './ui/modals.js';
import { sorteio } from './ui/sorteio.js';
import { money, esc } from './ui/render.js';
import { legacyDiskSummary, exportLegacyDiskSave, discardLegacyDiskSave } from './game/save.js';
import { setLanguage, gravarIdioma, idiomaGravado, language, t, tg } from './game/i18n/index.js';

export const VERSION = '2.7.0-web';

const root = document.getElementById('game');
// O cabeçalho do BetLife é HTML fixo em `index.html`, fora do render — então o idioma tem de
// alcançá-lo à parte, na subida e a cada troca. Sem isso o único texto em inglês que sobrava na
// tela era justamente o link de saída.
function traduzCasca() {
  const voltar = document.getElementById('shell-back');
  if (voltar) voltar.textContent = `← ${t('Back to Arcade')}`;
}

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
    if (el) el.textContent = t('Time remaining: {n} seconds', { n: left });
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

// What is on screen right now, so a card only plays its arrival when it is genuinely a new card.
// The overlay is rewritten on every render, and without this the card would pop again every time
// anything at all changed behind it.
let mountedModal = null;
let mountTimer = 0;

// The screen is genuinely empty between one card and the next. In the recording the card you
// answered is gone for about two tenths of a second before the next one pops in, and that gap is
// most of what gives the game its rhythm; replacing one card with another in the same frame reads
// as a form re-rendering.
const CARD_GAP = 200;

function mountModal(html, token) {
  // Same card, just re-rendered behind something that changed: swap the content and leave it alone.
  if (token === mountedModal) { modalRoot.innerHTML = html; return; }
  const replacing = mountedModal !== null;
  mountedModal = token;
  clearTimeout(mountTimer);
  const place = () => {
    modalRoot.innerHTML = html;
    if (modalRoot.firstElementChild) modalRoot.firstElementChild.classList.add('is-entering');
    focusModal();
  };
  if (!replacing) { place(); return; }
  modalRoot.innerHTML = '';
  mountTimer = setTimeout(() => { if (mountedModal === token) place(); }, CARD_GAP);
}

function renderModal() {
  if (uiModal && uiModal.kind === 'language') { mountModal(Modals.languageCard(uiModal.current), uiModal); return; }
  if (uiModal) { mountModal(Modals.confirm(uiModal, state), uiModal); focusModal(); return; }
  if (postLifeOpen && state) { mountModal(Modals.postLife(state.player.name, !!state.profile, People.children(state)), 'postlife'); focusModal(); return; }
  const modal = state ? G.currentModal(state) : null;
  if (!modal) { clearTimeout(mountTimer); mountedModal = null; modalRoot.innerHTML = ''; return; }
  if (modal.kind === 'badge') {
    mountModal(Modals.badgeBanner(modal), modal);
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { if (G.currentModal(state) === modal) answer('ok'); }, 3000);
    return;
  }
  if (modal.kind === 'minigame') { mountModal(Modals.minigame(modal, state), modal); startEyeTimer(modal); focusModal(); return; }
  if (modal.kind === 'decision') mountModal(Modals.decision(modal, state), modal);
  else if (modal.kind === 'death') mountModal(Modals.death(G.lifeSummary(state)), 'death');
  else mountModal(Modals.info(modal, state), modal);
  focusModal();
}

function focusModal() {
  // Num cartão com campo o cursor pertence ao campo, não ao botão: o jogador chegou aqui para
  // digitar um nome, e o texto sugerido fica selecionado para ele poder trocar direto.
  const campo = modalRoot.querySelector('.bl-field-input');
  if (campo) { campo.focus(); campo.select(); return; }
  const first = modalRoot.querySelector('button');
  if (first) first.focus();
}

function go(target) {
  const wasIntro = screen === 'disclaimer' || screen === 'splash';
  screen = target === 'home' ? 'main' : target;
  let setup = '1';
  try { setup = localStorage.getItem('betlife.web.setup'); } catch { /* ignore */ }
  if (wasIntro && screen === 'start' && !setup) uiModal = { kind: 'language', current: language() };
  render();
}

// Mais uma fronteira que recebe texto cru de trinta lugares, e pela mesma razão do cartão de
// confirmação a tradução entra AQUI. Faltava: o aviso de 'New Pet' saía em inglês por cima de uma
// frase em português, e nenhuma auditoria de tela pega isso — o aviso vive três segundos.
function toast(title, text, tone = 'blue') {
  const g = { _g: state && state.player ? state.player.gender : undefined };
  toastRoot.innerHTML = `<div class="bl-toast tone-${tone}"><strong>${esc(t(String(title ?? ''), g))}</strong><span>${esc(t(String(text ?? ''), g))}</span></div>`;
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

// Pergunta o nome de um bicho e devolve o nome limpo, ou `null` se o jogador desistir.
//
// O laço existe porque validar é conversar: nome vazio ou gigante volta o cartão com o aviso e com
// o que a pessoa digitou, em vez de aceitar um bicho sem nome ou engolir a tentativa em silêncio.
// Nada é cobrado aqui — quem adota é quem chama, depois do `return`.
async function askPetName(opts) {
  let valor = opts.suggestion || '';
  let erro = null;
  for (let tentativa = 0; tentativa < 12; tentativa++) {
    const r = await ask({ ...opts, field: { label: 'What do you want to call your pet?', value: valor, error: erro,
      hint: erro ? null : 'You can keep the suggested name or type your own.', whenEmpty: 'Your pet needs a name.',
      maxLength: Pets.MAX_PET_NAME } });
    if (!r || r.index !== 0) return null;
    valor = r.value;
    const problema = Pets.nameProblem(valor);
    if (!problema) return Pets.cleanName(valor);
    erro = problema === 'empty' ? 'Your pet needs a name.' : t('Keep the name under {n} characters.', { n: Pets.MAX_PET_NAME });
  }
  return null;
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
    gravarIdioma(lang);                                  // grava E aplica: o próximo render já sai traduzido
    traduzCasca();
    try { localStorage.setItem('betlife.web.setup', '1'); } catch { /* private mode */ }
    uiModal = null;
    render();
    return;
  }
  if (uiModal) {
    const m = uiModal;
    // O valor é lido ANTES de `render()`, que reescreve o cartão: depois dele o campo já não existe.
    const digitado = m.field ? (modalRoot.querySelector('.bl-field-input')?.value ?? '') : null;
    uiModal = null;
    const escolhido = choice === 'ok' ? 0 : Number(choice);
    if (m.resolve) m.resolve(m.field ? { index: escolhido, value: digitado } : escolhido);
    render();
    return;
  }
  if (postLifeOpen) {
    if (choice === 'summary') { postLifeOpen = false; go('summary'); return; }
    if (choice === 'arcade') { location.href = '../../'; return; }
    postLifeOpen = false;
    if (String(choice).startsWith('child:')) { const next = G.continueAsChild(state, String(choice).slice(6)); if (next) { G.clearSavedGame(); state = next; screen = 'main'; render(); uiModal = { title: 'The Story Continues', text: t('You are now {name}, age {age}. Press Age to keep the family story going.', { name: state.player.name, age: state.player.age }), choices: ['Continue'], icon: 'seedling', band: 'Life', tone: 'green' }; render(); } return; }
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
    case 'premium': toast(t('{feature} is an admin tool', { feature: data.feature }), 'Changing stats or rewinding years is a premium candidate and is not part of normal play.', 'blue'); break;
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
    // Sair para o Arcade de dentro do jogo. O mesmo destino do link no alto da página; existe aqui
    // porque, no fim de uma vida, é onde o jogador está olhando.
    case 'arcade': location.href = '../../'; break;
    // Trocar de idioma no meio do jogo. Redesenha na hora; o que já está no diário fica na língua em
    // que foi vivido, porque o diário é a memória daquela vida e não um texto re-renderizável.
    case 'language': uiModal = { kind: 'language', current: language() }; render(); break;
    case 'person': sel.person = data.person; go('person'); break;
    case 'asset': sel.asset = data.asset; go('asset'); break;
    case 'activity': {
      const act = Activities.findActivity(data.activity);
      // Adotar pela lista de atividades é o MESMO ato de adotar numa loja, e tem de perguntar o
      // nome do mesmo jeito: era o caminho que ficava de fora quando só o cartão da loja perguntava.
      if (act && act.special === 'adopt' && !Activities.unavailableReason(state, act)) {
        const especie = People.PET_SPECIES[act.species];
        const nome = await askPetName({ title: act.name, band: 'Activities', icon: 'paw', text: act.sub,
          pet: { species: act.species }, suggestion: Pets.suggestName(state, act.species), choices: ['Adopt', 'Not now'],
          facts: [[t('Lifespan'), t('about {n} years', { n: especie ? especie.lifespan : 10 })],
            [t('Cost'), money(act.cost)], [t('Bank Balance'), money(state.player.money)]] });
        if (nome === null) break;
        report(G.doActivity(state, data.activity, { petName: nome }));
        break;
      }
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
      // Scrapping and gifting used to drop you back on the belongings list. They both write a line in
      // the life log, so `afterAction` now takes you to the log to read it, and sending you to the
      // list first would only be a screen you see for an instant on the way.
      report(result); break;
    }
    case 'adoptConfirm': {
      const source = Pets.SOURCES.find((s) => s.id === data.source);
      const animal = source ? Pets.inventory(state, source).find((a) => a.id === data.animal) : null;
      if (!animal) break;
      const especie = People.PET_SPECIES[animal.species];
      const nome = await askPetName({ title: 'Adopt this pet?', band: 'Pets', icon: 'paw', text: 'A pet joins your family for life.',
        pet: { species: animal.species }, suggestion: animal.name, choices: ['Adopt', 'Not now'],
        facts: [[t('Breed'), animal.breed], [t('Age'), animal.age === 0 ? t('Baby') : t('{n}-year-old', { n: animal.age })],
          [t('Lifespan'), t('about {n} years', { n: especie ? especie.lifespan : 10 })],
          [t('Fee'), money(animal.fee)], [t('Bank Balance'), money(state.player.money)]] });
      // Cancelar não cobra, não cria o animal e não escreve no diário: o jogo fica como estava.
      if (nome === null) break;
      const result = G.adoptFromSource(state, data.source, data.animal, nome);
      if (result.ok) screen = 'pets';
      report(result);
      break;
    }
    case 'programConfirm': {
      const pr = Education.PROGRAMS[data.program];
      if (!pr) break;
      const c = await ask({ title: pr.name, band: 'Education', icon: 'cap', text: t('{school}: {note}.', { school: pr.school, note: t(pr.note) }), facts: [['Length', t('{n} years', { n: pr.years })], ['Tuition', t('{amount} / year', { amount: money(pr.tuition) })], ['Result', t(pr.credential)]], choices: ['Enroll', 'Not now'] });
      if (c === 0) { if (G.enrollProgram(state, data.program)) { go('main'); toast('Enrolled', t('You are now studying at {school}.', { school: pr.school }), 'green'); } }
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
      const c = await ask({ title: 'Apply for this job?', band: 'Career', icon: 'briefcase', text: t('{employer} is hiring {title}.', { employer: career.employer, title: tg(withArticle(entry.title), state.player.gender) }), facts: [['Title', t(entry.title)], ['Career', t(career.name)], ['Salary', t('{amount} / year', { amount: money(entry.salary) })], ['Requires', Careers.requirementText(career)]], choices: ['Apply', 'Not now'] });
      if (c === 0) {
        const result = G.applyForCareer(state, data.career);
        if (result.ok) { screen = 'main'; report(result); }
        else { uiModal = { title: 'Application Rejected', band: 'Career', icon: 'briefcase', tone: 'red', text: t('{employer} turned you down. {reason}', { employer: career.employer, reason: result.text }), choices: ['OK'] }; render(); }
      }
      break;
    }
    case 'quitConfirm': {
      const c = await ask({ title: 'Resign?', band: 'Career', icon: 'exit', text: t('Are you sure you want to leave {employer}?', { employer: Career.employer(state.career) }), choices: ['Resign', 'Stay'], danger: true });
      if (c === 0) { G.quitJob(state); toast('Resigned', 'You handed in your resignation.', 'blue'); go('main'); }
      break;
    }
    case 'retireConfirm': {
      const c = await ask({ title: 'Retire?', band: 'Career', icon: 'flag', text: t('Retire now after {n} years of work? Your salary stops and a pension begins.', { n: state.career.yearsWorked }), choices: ['Retire', 'Keep working'] });
      if (c === 0) { G.retireNow(state); go('main'); }
      break;
    }
    case 'enrollUniversity': {
      const r = G.enrollUniversity(state, data.major);
      if (r.ok) go('main');
      report(r);                       // recusa também fala: antes o clique não produzia nada
      break;
    }
    case 'enrollTrade': {
      const r = G.enrollTradeSchool(state, data.trade);
      if (r.ok) go('main');
      report(r);
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
      const c = await ask({ title: item.name, band: 'Shopping', icon: 'bag', text: t('Buy {item} from {shop}?', { item: t(withArticle(item.name.toLowerCase())), shop: t(shop.name) }), facts: [['Price', money(item.cost)], ['Bank Balance', money(state.player.money)]], choices: ['Buy', 'Not now'] });
      if (c === 0) {
        const verdict = G.buyItem(state, data.shop, data.item);
        if (verdict === 'ok') { toast('Purchased', t('You bought {item}.', { item: t(withArticle(item.name.toLowerCase())) }), 'green'); go(item.type === 'home' ? 'assets' : 'shop'); }
        else { uiModal = { title: 'Not So Fast', band: 'Shopping', icon: 'shopping', tone: 'red', text: { tooYoung: 'You are too young to buy that.', noLicence: t('You need a driving licence before {shop} will sell you {item}.', { shop: t(shop.name), item: t(withArticle(item.name.toLowerCase())) }), owned: 'You already own one of those.', noMoney: t('You cannot afford {item} right now.', { item: t(withArticle(item.name.toLowerCase())) }) }[verdict] || 'Something went wrong.', choices: ['OK'] }; render(); }
      }
      break;
    }
    case 'sellConfirm': {
      const a = Assets.findAsset(state, data.asset);
      if (!a) break;
      const c = await ask({ title: t('Sell your {item}?', { item: t(a.name.toLowerCase()) }), band: 'Belongings', icon: 'dollar', text: 'You will get part of its current value back.', facts: [['Value', money(a.value)]], choices: ['Sell', 'Keep'] });
      if (c === 0) { const price = G.sellAsset(state, data.asset); toast('Sold', t('You received {amount}.', { amount: money(price) }), 'green'); go('assets'); }
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

// Where an action leaves you: back on the life, reading the line you just earned.
//
// Doing something in BetLife writes a sentence in the life log, and the life log is the main screen.
// Before this, the sentence was written on a screen you were not looking at: giving a gift left you
// staring at the belongings list, spending the day with everyone left you on Relationships, and
// studying harder left you in School. You had to find your way back to read what had happened.
//
// The test is the log itself rather than a list of action names. An action that writes a line is one
// whose result you are meant to read, so it takes you to where the lines are; anything that writes
// nothing - browsing a shop, selling, repairing, opening a person - leaves you where you were, which
// is what you want while you are working through a list of things.
// Ação concluída volta para a vida; abrir uma tela, consultar ou configurar, não.
//
// A regra é "o diário cresceu?". Parece heurística, e é — mas é a certa, e vale registrar por quê,
// porque eu tentei trocá-la por algo aparentemente mais rigoroso e PIOREI o jogo.
//
// A tentativa foi comparar uma impressão digital do personagem (dinheiro, atributos, carreira,
// educação, proximidade de cada pessoa…) antes e depois, e voltar sempre que algo mudasse. O
// problema é o que acontece junto: uma ação que concede uma conquista deixa o banner na fila
// (`state.pending`), e enquanto a fila não esvazia a ação não terminou. A verificação passava a
// adiar, e a volta à vida só acontecia quando o banner sumia sozinho — três segundos depois, num
// pulo de tela sem causa aparente para quem está jogando.
//
// A auditoria de navegação pegou isso: 736 ações, 0 fora do destino com esta regra, 22 fora com a
// "melhoria". O diário cresce em toda ação que o jogador entende como concluída, porque é ele que
// conta a história da vida — e é exatamente esse o critério certo para devolver o jogador a ela.
function afterAction(hadState, journalBefore) {
  if (!hadState || !state || screen === 'main') return;
  // Um cartão ainda aberto quer dizer que a ação não terminou: o jogador está no meio de uma
  // escolha, e puxar a tela debaixo dele seria tirar o chão.
  if (uiModal || postLifeOpen) return;
  if (state.timeline.length === journalBefore) return;
  go('main');
}

root.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el) return;
  if (modalRoot.firstChild && !modalRoot.querySelector('.bl-banner')) return;   // badge banners do not block navigation
  const hadState = !!state;
  const journalBefore = state ? state.timeline.length : 0;
  // `handle` is async - it awaits confirmation cards - so this waits for the whole interaction to
  // finish before deciding, not just for the click.
  Promise.resolve(handle(el.dataset.action, el.dataset)).then(() => afterAction(hadState, journalBefore));
});
// Choosing an option, timed off the recordings rather than answered on the spot.
//
// Frame by frame the reference does this: the chosen button darkens and stays darkened for about
// a tenth of a second, returns to its normal colour, the card sits there for another couple of
// frames, and then it is gone in one frame with no fade and no scale. The options you did not pick
// do nothing at all. Answering immediately skipped the whole beat, which is what made the old
// version feel like a web form rather than the reference.
const PRESS_HOLD = 100;      // the chosen button stays dark this long
const CARD_LINGER = 70;      // then the card sits a moment before it goes
let answering = false;

modalRoot.addEventListener('click', (event) => {
  const el = event.target.closest('[data-choice]');
  if (!el || answering) return;
  const choice = el.dataset.choice;
  if (choice === 'random' && el.classList.contains('bl-coin')) { sorteioFlow(el); return; }
  answering = true;
  el.classList.add('is-chosen');
  setTimeout(() => {
    el.classList.remove('is-chosen');
    setTimeout(() => {
      answering = false;
      answer(choice);
    }, CARD_LINGER);
  }, PRESS_HOLD);
});

// O campo de texto do cartão: o botão de confirmar acompanha o que está escrito, para o jogador
// ver que um nome vazio não serve antes de tentar, e Enter vale como confirmar.
modalRoot.addEventListener('input', (event) => {
  const campo = event.target.closest('.bl-field-input');
  if (!campo) return;
  const vazio = !campo.value.trim();
  const botao = modalRoot.querySelector('.bl-modal-buttons [data-choice="0"]');
  if (botao) botao.disabled = vazio;
  const nota = modalRoot.querySelector('.bl-field-note');
  if (nota && nota.dataset.empty) {
    nota.textContent = vazio ? nota.dataset.empty : nota.dataset.full;
    nota.classList.toggle('is-error', vazio);
  }
});
modalRoot.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  const campo = event.target.closest('.bl-field-input');
  if (!campo) return;
  event.preventDefault();
  const botao = modalRoot.querySelector('.bl-modal-buttons [data-choice="0"]');
  if (botao && !botao.disabled) botao.click();
});

// O sorteio.
//
// A ORDEM IMPORTA: o jogo sorteia primeiro, a animação mostra depois. A mão vai até a opção que já
// venceu — ela não escolhe nada, e trocar essa ordem faria a decisão depender de pixels.
//
// A APRESENTAÇÃO depende de quantas opções existem, e isso não é estética: uma moeda só decide
// entre DUAS coisas. Com duas, é a moeda, e a face sai da opção sorteada — cara é a primeira, coroa
// é a segunda. Com três ou mais, mostrar uma moeda seria afirmar uma coisa falsa sobre como a
// escolha foi feita; aparece o sorteio, com as opções na tela e o marcador parando na que saiu.
// Nos dois casos o resultado é o de `randomChoice`, o mesmo de antes da animação existir.
//
// `answering` fica levantado do primeiro clique até o cartão ser respondido: é ele que faz de
// vários cliques durante a animação um único sorteio.
const menosMovimento = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

async function sorteioFlow(el) {
  const modal = G.currentModal(state);
  if (!modal || modal.kind !== 'decision' || !modal.choices || modal.choices.length < 2) return;
  // O sorteio sai primeiro e FORA do `try`: se alguma coisa aqui falhasse com `answering` já
  // levantado, o cartão ficaria sem resposta e a interface travada para sempre.
  const index = G.randomChoice(state, modal);
  const posicao = modal.choices.findIndex((c) => c.index === index);
  const escolha = modal.choices[posicao] || modal.choices[0];
  const duas = modal.choices.length === 2;
  answering = true;
  el.classList.add('is-chosen');
  try {
    await sorteio({
      mode: duas ? 'coin' : 'raffle',
      face: duas ? (posicao === 0 ? 'heads' : 'tails') : undefined,
      options: modal.choices.map((c) => c.label),
      winner: Math.max(0, posicao),
      reduced: menosMovimento(),
      labels: { title: t(duas ? 'Flip a coin' : 'Random draw'), heads: t('Heads'), tails: t('Tails') },
      outcome: t(duas ? 'The coin chose: {choice}' : 'The draw chose: {choice}', { choice: escolha.label }),
    });
  } finally {
    el.classList.remove('is-chosen');
    answering = false;
  }
  answer(String(index));
}

// Screenshot fixtures (development only): ?seed=7&age=27 builds a deterministic life, and
// &modal=decision|info|person|death|postlife|banner stages a dialog on top of it.
const params = new URLSearchParams(location.search);

// O idioma é aplicado ANTES de qualquer desenho, para que a primeira tela já saia traduzida.
// `?lang=pt` existe para as capturas e para os testes; fora isso vale o que está gravado.
setLanguage(params.get('lang') && ['en', 'pt'].includes(params.get('lang')) ? params.get('lang') : idiomaGravado());
traduzCasca();
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
  if (fixtureModal === 'decision') pushModal(state, { kind: 'decision', eventId: 'fixture', band: 'Childhood', title: 'Favorite Toy', icon: 'toy', text: 'You are playing with some friends when a smaller kid grabs the toy xylophone right out of your hands.', choices: [{ label: 'Cry' }, { label: 'Let them play with it' }, { label: 'Take it back' }, { label: 'Tell a grown-up' }] });
  if (fixtureModal === 'info') pushModal(state, { kind: 'info', band: 'School', tone: 'blue', icon: 'cap', title: 'Primary School', text: 'You are starting primary school.', facts: [['School', 'Maple Grove Elementary'], ['Type', 'Public'], ['Level', 'Elementary School'], ['Years', '6']] });
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

// ---- A vida que a versão anterior deixou no disco ---------------------------------------------
//
// A versão antiga gravava a vida em `localStorage` e nunca a apagava; quem jogou nela tem uma vida
// guardada. Ela não some em silêncio — mas o aviso também não pode virar um pedido de exportação.
//
// A PRIMEIRA versão disto tinha "Download it" como botão principal, e transformava a entrada do jogo
// num diálogo de arquivo. Errado: o BetLife é um simulador de vida, não uma ferramenta de dados.
// Agora o botão principal é JOGAR, que descarta; guardar uma cópia é uma linha discreta embaixo, e
// nada começa a baixar sozinho em momento nenhum.
async function ofereceVidaAntiga() {
  if (params.has('seed') || params.has('fixture')) return;
  const antiga = legacyDiskSummary();
  if (!antiga) return;
  const quem = antiga.idade === null ? antiga.nome : `${antiga.nome}, ${antiga.idade}`;
  const escolha = await ask({
    title: 'An old saved life',
    band: 'Saved Life', icon: 'info', tone: 'blue',
    text: t('BetLife keeps your progress in this tab now, so {quem} will not be loaded again. ', { quem })
        + 'Tap Start playing and it is cleared for good.',
    choices: ['Start playing', 'Save a copy first (.json)'],
    secondary: 1,                  // a segunda opção é discreta, não um botão de igual peso
  });
  if (escolha === 1) {
    const baixou = exportLegacyDiskSave();
    if (!baixou) {
      await ask({ title: 'Could not save the copy', band: 'Saved Life', icon: 'info', tone: 'red',
        text: 'This browser would not let the file through. The old life is still here — tap Start playing to clear it.',
        choices: ['Start playing'] });
    }
  }
  discardLegacyDiskSave();
}
ofereceVidaAntiga();

// Exposed for automated testing and debugging only.
window.betlife = {
  getState: () => state, go, handle, startNewLife, answer,
  statLog: () => (state ? state.statLog.map((e) => `${e.age}: ${e.stat} ${e.from} → ${e.to} (${e.change > 0 ? '+' : ''}${e.change}) ${e.reason}`) : []),
  activities: Activities.CATEGORIES,
};
