// VIDA LONGA — §9: "uma vida longa precisa continuar tão funcional quanto uma vida recém-iniciada".
//
// Mede o que acumula ao longo de uma vida inteira jogada no navegador: nós no DOM, ouvintes de
// evento, temporizadores, tamanho do estado salvo, e o tempo de resposta de envelhecer um ano.
// Compara o começo da vida com o fim. O que cresce sem limite é vazamento.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
// Idioma do teste: `BETLIFE_LANG=pt` roda a mesma suíte em português. Sem ele, inglês — o
// original. É assim que as duas passagens do requisito 8 usam exatamente o mesmo caminho.
const LANG = process.env.BETLIFE_LANG ? `?lang=${process.env.BETLIFE_LANG}` : '';
const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });

const resultados = [];
const check = (n, ok, d = '') => { resultados.push({ n, ok: !!ok, d }); console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${n}${ok || !d ? '' : ` — ${d}`}`); };

// Conta ouvintes instrumentando addEventListener ANTES de qualquer script da página rodar.
await page.addInitScript(() => {
  window.__ouvintes = 0;
  window.__timers = 0;
  const addL = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (...a) { window.__ouvintes++; return addL.apply(this, a); };
  const remL = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (...a) { window.__ouvintes--; return remL.apply(this, a); };
  const st = window.setTimeout;
  window.setTimeout = function (...a) { window.__timers++; return st.apply(this, a); };
});

await page.goto(BASE + LANG, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} });
await page.goto(BASE + LANG, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
await page.waitForFunction(() => { const t = document.getElementById('game').dataset.screen; return t && !['splash', 'disclaimer'].includes(t); }, null, { timeout: 18000 });
await page.waitForTimeout(400);

const limpar = async (n = 16) => { for (let i = 0; i < n; i++) { const f = await page.evaluate(() => { const r = document.getElementById('modal-root'); if (!r.firstChild) return false; const b = r.querySelector('.bl-banner') || r.querySelector('[data-choice]') || r.querySelector('button'); if (!b) return false; b.click(); return true; }); if (!f) return; await page.waitForTimeout(60); } };
const paraMain = async () => { for (let i = 0; i < 8; i++) { await limpar(); if (await page.evaluate(() => document.getElementById('game').dataset.screen) === 'main') return; await page.evaluate(() => document.querySelector('#game .bl-titlebar [data-action="go"]')?.click()); await page.waitForTimeout(100); } };
const medir = () => page.evaluate(() => {
  const s = window.betlife.getState();
  let salvo = 0; try { for (let i = 0; i < localStorage.length; i++) salvo += (localStorage.getItem(localStorage.key(i)) || '').length; } catch (_) {}
  return {
    idade: s?.player.age, vivo: s?.player.alive, diario: s?.timeline.length ?? 0,
    nos: document.getElementById('game').querySelectorAll('*').length,
    nosModal: document.getElementById('modal-root').childElementCount,
    nosToast: document.getElementById('toast-root').childElementCount,
    ouvintes: window.__ouvintes, timers: window.__timers,
    salvoKB: Math.round(salvo / 102.4) / 10,
    pessoas: s ? s.relationships.length : 0,
    pendentes: s ? s.pending.length : 0,
  };
});

await limpar();
for (let i = 0; i < 8 && await page.evaluate(() => document.getElementById('game').dataset.screen) !== 'main'; i++) {
  await page.evaluate(() => document.querySelector('[data-action="startRandom"], [data-action="newLife"]')?.click());
  await page.waitForTimeout(350); await limpar();
}
await paraMain();

const amostras = [];
const tempos = [];
const fila = [];        // tamanho da fila de decisões A CADA ANO, não só nos marcos
let ano = 0;
while (ano < 120) {
  const s = await medir();
  if (!s.vivo) break;
  fila.push({ idade: s.idade, n: s.pendentes });
  if ([1, 10, 25, 50, 70].includes(s.idade) || s.idade === 0) amostras.push(s);
  const t0 = Date.now();
  await paraMain();
  await page.evaluate(() => document.querySelector('#game [data-action="age"]')?.click());
  await page.waitForTimeout(170);
  await limpar();
  tempos.push({ idade: s.idade, ms: Date.now() - t0 });
  ano++;
}
const fim = await medir();
amostras.push(fim);

console.log('\n  idade  diário  nós  modal toast  ouvintes  timers  salvo(KB)  pessoas');
for (const a of amostras) console.log(`  ${String(a.idade).padStart(5)}  ${String(a.diario).padStart(6)}  ${String(a.nos).padStart(4)}  ${String(a.nosModal).padStart(5)} ${String(a.nosToast).padStart(5)}  ${String(a.ouvintes).padStart(8)}  ${String(a.timers).padStart(6)}  ${String(a.salvoKB).padStart(9)}  ${String(a.pessoas).padStart(7)}`);

const inicio = amostras[0];
const cedo = tempos.filter((t) => t.idade <= 15).map((t) => t.ms);
const tarde = tempos.filter((t) => t.idade >= fim.idade - 15).map((t) => t.ms);
const med = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
console.log(`\n  tempo por ano: início ${med(cedo)} ms · fim ${med(tarde)} ms`);

console.log('');
check('a vida chegou ao fim', !fim.vivo, `parou aos ${fim.idade}`);
check('viveu uma vida longa', fim.idade >= 50, `morreu aos ${fim.idade}`);
check('os ouvintes de evento NÃO crescem com a vida', fim.ouvintes - inicio.ouvintes <= 10, `${inicio.ouvintes} → ${fim.ouvintes}`);
check('o DOM não incha', fim.nos < inicio.nos * 4 + 400, `${inicio.nos} → ${fim.nos} nós`);
check('nenhum modal preso no fim', fim.nosModal === 0, `${fim.nosModal} nós`);
check('nenhum toast acumulado', fim.nosToast <= 1, `${fim.nosToast} nós`);
check('o salvamento não explode', fim.salvoKB < 900, `${fim.salvoKB} KB`);
// A fila de decisões é uma FILA: um ano pode enfileirar mais de um cartão (uma decisão e uma
// conquista, por exemplo) e o jogador responde um por vez. Duas execuções deste teste viram 2
// pendentes e acusaram acúmulo — era fila normal drenando. O que importa não é o pico de um ano:
// é se ela fica limitada e se volta a zero. Uma fila que só cresce é decisão que nunca foi mostrada.
const picoFila = Math.max(...fila.map((f) => f.n));
const drenou = fila.filter((f) => f.n === 0).length;
const ultimoTercoCresce = (() => {
  const t = Math.floor(fila.length / 3);
  if (t < 2) return false;
  const inicio = Math.max(...fila.slice(0, t).map((f) => f.n));
  const fimT = Math.max(...fila.slice(-t).map((f) => f.n));
  return fimT > inicio + 2;
})();
check('a fila de decisões fica limitada', picoFila <= 6, `pico de ${picoFila} — ${fila.filter((f) => f.n > 1).map((f) => `${f.idade}:${f.n}`).join(' ')}`);
check('a fila volta a zero ao longo da vida', drenou >= fila.length / 2, `zerou em ${drenou} de ${fila.length} anos`);
check('a fila NÃO cresce com a idade', !ultimoTercoCresce, `pico do último terço maior que o do primeiro`);
check('ao morrer sobra apenas o encerramento', fim.pendentes <= 2, `${fim.pendentes} pendentes`);
console.log(`  fila de decisões: pico ${picoFila} · zerada em ${drenou} de ${fila.length} anos`);
check('envelhecer no fim da vida não fica lento', med(tarde) < med(cedo) * 3 + 300, `${med(cedo)} ms → ${med(tarde)} ms`);
check('as pessoas da vida não se multiplicam sem limite', fim.pessoas < 90, `${fim.pessoas} pessoas`);
check('sem erro de JavaScript na vida inteira', erros.length === 0, erros.slice(0, 2).join(' | '));

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} verificações passaram${falhas.length ? `, ${falhas.length} FALHARAM` : ''}.`);
await browser.close();
process.exit(falhas.length ? 1 : 0);
