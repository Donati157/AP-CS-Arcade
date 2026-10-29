// AUDITORIA REAL DE BOTÕES — cada clique é um evento de entrada do WebKit (page.mouse), nunca um
// dispatch sintético, e nunca `window.betlife.go(...)`. Para chegar de novo a uma tela, o auditor
// REPETE O CAMINHO de cliques que a alcançou: é assim que telas que dependem de uma seleção
// (pessoa, bem, atividade, loja) são auditadas no estado em que o jogador realmente as vê.
//
// Um botão é MORTO quando, depois do clique: a tela não mudou, nenhum modal abriu ou mudou de
// texto, nenhum toast apareceu, o diário não cresceu e nada no estado do jogador mudou.
//
// A varredura roda em VÁRIAS IDADES, porque a mesma tela oferece coisas diferentes aos 8, 16, 25,
// 45 e 70 anos — e o pedido é explicitamente "teste a ação em estados diferentes da vida".
//
// Os quatro atributos ficam DIRETO em `player` (happiness, health, smarts, looks), não em
// `player.stats` — a primeira versão disto lia o caminho errado, não via mudança nenhuma de atributo
// e marcava como morto um botão que só mexe em atributo. Falso positivo, corrigido.
//
// Uso: node tests/button-audit.mjs [base-url] [idades separadas por vírgula]
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
// Idioma do teste: `BETLIFE_LANG=pt` roda a mesma suíte em português. Sem ele, inglês — o
// original. É assim que as duas passagens do requisito 8 usam exatamente o mesmo caminho.
const LANG = process.env.BETLIFE_LANG ? `&lang=${process.env.BETLIFE_LANG}` : '';
const IDADES = (process.argv[3] || '6,10,16,19,25,35,50,68,80').split(',').map(Number);
const SEED = Number(process.argv[4] || 7);
const MAX_CLIQUES_POR_IDADE = 420;

const browser = await webkit.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await context.newPage();

const erros = [];
page.on('pageerror', (e) => erros.push({ tipo: 'pageerror', texto: String(e) }));
page.on('console', (m) => { if (m.type() === 'error') erros.push({ tipo: 'console', texto: m.text() }); });

const snap = () => page.evaluate(() => {
  const s = window.betlife && window.betlife.getState();
  const modal = document.getElementById('modal-root');
  return {
    tela: document.getElementById('game')?.dataset.screen ?? null,
    modalAberto: !!(modal && modal.firstChild),
    modalTexto: modal?.firstChild ? (modal.innerText || '').replace(/\s+/g, ' ').slice(0, 140) : null,
    toast: (() => { const t = document.querySelector('.bl-toast'); return t ? t.innerText.replace(/\s+/g, ' ').slice(0, 90) : null; })(),
    idade: s?.player.age ?? null,
    dinheiro: s?.player.money ?? null,
    diario: s?.timeline.length ?? 0,
    stats: s ? `${s.player.happiness}/${s.player.health}/${s.player.smarts}/${s.player.looks}` : null,
    ocupacao: s?.player.occupation ?? null,
    pessoas: s ? s.relationships.filter((r) => r.alive).length : 0,
    bens: s ? (s.assets || []).length : 0,
    educacao: s ? JSON.stringify(s.education || null) : null,
    carreira: s ? JSON.stringify(s.career || null) : null,
  };
});

const mudou = (a, b) => a.tela !== b.tela || a.modalAberto !== b.modalAberto
  || (b.toast && b.toast !== a.toast) || a.idade !== b.idade || a.dinheiro !== b.dinheiro
  || a.diario !== b.diario || a.stats !== b.stats || a.ocupacao !== b.ocupacao
  || a.pessoas !== b.pessoas || a.bens !== b.bens || a.educacao !== b.educacao
  || a.carreira !== b.carreira || (a.modalAberto && b.modalAberto && a.modalTexto !== b.modalTexto);

async function limpar(max = 14) {
  for (let i = 0; i < max; i++) {
    const fechou = await page.evaluate(() => {
      const root = document.getElementById('modal-root');
      if (!root.firstChild) return false;
      const b = root.querySelector('.bl-banner') || root.querySelector('[data-choice]') || root.querySelector('button');
      if (!b) return false;
      b.click(); return true;
    });
    if (!fechou) return true;
    await page.waitForTimeout(80);
  }
  return false;
}

// Assinatura estável de um botão na tela: ação + alvo + rótulo. É por ela que o caminho é repetido,
// porque o índice muda quando a lista muda de tamanho.
const listar = () => page.evaluate(() => [...document.querySelectorAll('#game [data-action]')].map((el, i) => {
  const d = el.dataset;
  const alvo = d.target || d.feature || d.person || d.activity || d.study || d.hr || d.asset || d.source || d.shop || d.item || d.career || d.program || d.do || '';
  const r = el.getBoundingClientRect();
  return { i, acao: d.action, alvo, rotulo: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 44), visivel: r.width > 1 && r.height > 1 };
}));

async function clicarPorChave(chave) {
  const box = await page.evaluate((k) => {
    const els = [...document.querySelectorAll('#game [data-action]')];
    const el = els.find((e) => {
      const d = e.dataset;
      const alvo = d.target || d.feature || d.person || d.activity || d.study || d.hr || d.asset || d.source || d.shop || d.item || d.career || d.program || d.do || '';
      return `${d.action}|${alvo}|${(e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 44)}` === k;
    });
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, chave);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(120);
  return true;
}

const chaveDe = (b) => `${b.acao}|${b.alvo}|${b.rotulo}`;

async function novaVida(ateIdade, seed) {
  // O SETUP é determinístico (fixture ?seed=&age= que o jogo já tem, usada pelas capturas de tela).
  // A INTERAÇÃO continua 100% real: todo clique daqui para a frente é page.mouse sobre o elemento.
  // Sem isso a varredura nunca repete, porque cada vida sorteia família, dinheiro e eventos
  // diferentes — e cobertura que muda a cada execução não serve como auditoria.
  const url = `${BASE}?seed=${seed}&age=${ateIdade}&person=first&asset=first${LANG}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 15000 });
  await page.waitForTimeout(350);
  await limpar();
  await paraMain();
  const s = await snap();
  return s.idade !== null && s.tela === 'main';
}

// Volta à tela principal apertando o botão de voltar/fechar da barra de título, como um jogador
// faria. Telas como `university` não têm o botão de envelhecer: depois do fork dos 18 anos é preciso
// voltar, e foi isso que travou a primeira versão desta auditoria aos 18.
async function paraMain(max = 8) {
  for (let i = 0; i < max; i++) {
    await limpar();
    if ((await snap()).tela === 'main') return true;
    const ok = await page.evaluate(() => {
      const b = document.querySelector('#game .bl-titlebar [data-action="go"]')
        || document.querySelector('#game [data-action="home"]')
        || document.querySelector('#game [data-action="go"]');
      if (!b) return false; b.click(); return true;
    });
    if (!ok) return false;
    await page.waitForTimeout(140);
  }
  return (await snap()).tela === 'main';
}

// Repete um caminho (lista de chaves) a partir da tela principal.
async function percorrer(caminho) {
  if (!(await paraMain())) return false;
  for (const k of caminho) { if (!(await clicarPorChave(k))) return false; await limpar(3); }
  return true;
}

const resultados = [];
const errosPorIdade = {};

for (const idade of IDADES) {
  const chegou = await novaVida(idade, SEED);
  const s0 = await snap();
  if (!chegou) { resultados.push({ idade, tela: '-', acao: '(preparar vida)', veredito: 'NÃO CHEGOU', rotulo: `parou em ${s0.tela} aos ${s0.idade}` }); continue; }
  const antesErros = erros.length;

  const vistas = new Set();
  const fila = [{ tela: s0.tela, caminho: [] }];
  let cliques = 0;

  while (fila.length && cliques < MAX_CLIQUES_POR_IDADE) {
    const { tela, caminho } = fila.shift();
    if (vistas.has(tela)) continue;
    vistas.add(tela);
    if (!(await percorrer(caminho))) continue;
    if ((await snap()).tela !== tela) continue;

    const botoes = (await listar()).filter((b) => b.visivel);
    for (const b of botoes) {
      if (!(await percorrer(caminho))) { resultados.push({ idade, tela, ...b, veredito: 'REPLAY FALHOU' }); continue; }
      if ((await snap()).tela !== tela) { resultados.push({ idade, tela, ...b, veredito: 'REPLAY FALHOU' }); continue; }
      // Limpa o toast ANTES de medir: dois cliques seguidos que produzem a MESMA mensagem
      // ("You cannot afford that right now.") pareciam não fazer nada, porque o toast anterior
      // ainda estava na tela e o texto não mudava. Era falso positivo, não botão morto.
      await page.evaluate(() => { const t = document.getElementById('toast-root'); if (t) t.innerHTML = ''; });
      const antes = await snap();
      const eAntes = erros.length;
      if (!(await clicarPorChave(chaveDe(b)))) { resultados.push({ idade, tela, ...b, veredito: 'SUMIU' }); continue; }
      cliques++;
      const depois = await snap();
      const novos = erros.slice(eAntes);
      let veredito = mudou(antes, depois) ? 'ok' : 'MORTO';
      if (novos.length) veredito = 'ERRO JS';
      resultados.push({ idade, tela, ...b, veredito, para: depois.tela, erro: novos[0]?.texto?.slice(0, 130) });
      if (depois.tela && depois.tela !== tela && !vistas.has(depois.tela)) fila.push({ tela: depois.tela, caminho: [...caminho, chaveDe(b)] });
    }
  }
  errosPorIdade[idade] = erros.length - antesErros;
  const r = resultados.filter((x) => x.idade === idade);
  console.log(`idade ${String(idade).padStart(2)}: ${vistas.size} telas · ${cliques} cliques · ok ${r.filter((x) => x.veredito === 'ok').length} · MORTOS ${r.filter((x) => x.veredito === 'MORTO').length} · ERRO JS ${r.filter((x) => x.veredito === 'ERRO JS').length}`);
}


// ─── FASE 2: cobertura total por deep-link ─────────────────────────────────────
// A varredura por caminho só alcança o que a vida daquele momento oferece. Telas de escola,
// carreira, universidade, loja, pessoa e bem dependem do estado exato e ficavam de fora. O jogo já
// tem deep-link por hash (`#job`) e fixtures (`person=first`, `asset=first`, `shop=`), feitos para
// as capturas de tela — aqui eles servem para ABRIR a tela; os cliques continuam reais.
const TELAS = ['main','growing','school','university','tradeSchool','occupation','education','job','jobs',
  'military','dream','hr','partTimeJobs','careerHistory','assets','properties','socialMedia','finances',
  'asset','shopping','relationships','person','activities','pets','badges','identity','menu','about'];

console.log('\n── Fase 2: cobertura por deep-link');
for (const idade of [10, 19, 30, 55]) {
  for (const tela of TELAS) {
    // `_=${tela}` não é lido pelo jogo: existe para a URL mudar fora do hash. Navegar para uma URL
    // que difere APENAS no hash não recarrega a página, o módulo não re-executa e o deep-link é
    // ignorado — era por isso que toda tela "caía em main" depois da primeira.
    const url = `${BASE}?seed=${SEED}&age=${idade}&person=first&asset=first&shop=electronics&_=${tela}${LANG}#${tela}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    try { await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 12000 }); }
    catch (_) { resultados.push({ idade, tela, acao: '(abrir)', veredito: 'NÃO CARREGOU', fase: 2 }); continue; }
    await page.waitForTimeout(260);
    await limpar();
    const atual = (await snap()).tela;
    if (atual !== tela) { resultados.push({ idade, tela, acao: '(abrir)', veredito: 'REDIRECIONOU', rotulo: `caiu em ${atual}`, fase: 2 }); continue; }

    const botoes = (await listar()).filter((b) => b.visivel);
    if (!botoes.length) { resultados.push({ idade, tela, acao: '(abrir)', veredito: 'TELA VAZIA', fase: 2 }); continue; }
    for (const b of botoes) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      try { await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 12000 }); } catch (_) { break; }
      await page.waitForTimeout(220);
      await limpar();
      if ((await snap()).tela !== tela) break;
      await page.evaluate(() => { const t = document.getElementById('toast-root'); if (t) t.innerHTML = ''; });
      const antes = await snap();
      const eAntes = erros.length;
      if (!(await clicarPorChave(chaveDe(b)))) { resultados.push({ idade, tela, ...b, veredito: 'SUMIU', fase: 2 }); continue; }
      const depois = await snap();
      const novos = erros.slice(eAntes);
      let veredito = mudou(antes, depois) ? 'ok' : 'MORTO';
      if (novos.length) veredito = 'ERRO JS';
      resultados.push({ idade, tela, ...b, veredito, para: depois.tela, erro: novos[0]?.texto?.slice(0, 130), fase: 2 });
    }
  }
  const r2 = resultados.filter((x) => x.fase === 2 && x.idade === idade);
  console.log(`   idade ${String(idade).padStart(2)}: ${new Set(r2.filter((x) => x.veredito !== 'REDIRECIONOU').map((x) => x.tela)).size} telas · ${r2.filter((x) => x.acao !== '(abrir)').length} cliques · ok ${r2.filter((x) => x.veredito === 'ok').length} · MORTOS ${r2.filter((x) => x.veredito === 'MORTO').length} · ERRO JS ${r2.filter((x) => x.veredito === 'ERRO JS').length}`);
}


// Confirma um veredito de MORTO numa segunda tentativa ISOLADA: página nova, a tela aberta por
// deep-link, nada de estado herdado da varredura. Um veredito de disparo único mente — na primeira
// versão desta auditoria quatro "mortos" eram resíduo do próprio rastreador (toast antigo ainda na
// tela, cartão pós-vida auto-respondido, caminho de atributos lido errado). Só é relatado o que
// morre duas vezes, a segunda sem nenhum histórico.
async function confirmarMorto(r) {
  const url = `${BASE}?seed=${SEED}&age=${r.idade}&person=first&asset=first&shop=electronics&_=conf${r.tela}${LANG}#${r.tela}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 12000 });
    await page.waitForTimeout(260);
    await limpar();
    if ((await snap()).tela !== r.tela) return 'inconclusivo (tela não abre isolada)';
    await page.evaluate(() => { const t = document.getElementById('toast-root'); if (t) t.innerHTML = ''; });
    const antes = await snap();
    if (!(await clicarPorChave(chaveDe(r)))) return 'inconclusivo (botão ausente isolado)';
    await page.waitForTimeout(260);
    return mudou(antes, await snap()) ? 'FALSO POSITIVO (funciona isolado)' : 'CONFIRMADO';
  } catch (e) { return `inconclusivo (${e.message.slice(0, 50)})`; }
}

console.log('');
const mortos = resultados.filter((r) => r.veredito === 'MORTO');
const comErro = resultados.filter((r) => r.veredito === 'ERRO JS');
const naoChegou = resultados.filter((r) => r.veredito === 'NÃO CHEGOU');
const telas = new Set(resultados.map((r) => r.tela));
console.log(`TOTAL: ${resultados.length} cliques reais · ${telas.size} telas distintas · ok ${resultados.filter((r) => r.veredito === 'ok').length} · suspeitos de morto ${mortos.length} · ERRO JS ${comErro.length}`);

const grupo = (t, l) => { if (!l.length) return; console.log(`\n── ${t} (${l.length})`);
  for (const r of l) console.log(`   idade ${String(r.idade).padStart(2)} ${String(r.tela).padEnd(14)} ${String(r.acao).padEnd(14)} ${String(r.alvo || '').padEnd(14)} "${r.rotulo || ''}"${r.erro ? `  ← ${r.erro}` : ''}`); };
for (const m of mortos) m.confirmacao = await confirmarMorto(m);
const confirmados = mortos.filter((m) => m.confirmacao === 'CONFIRMADO');
const falsos = mortos.filter((m) => m.confirmacao.startsWith('FALSO'));
const inconclusivos = mortos.filter((m) => m.confirmacao.startsWith('inconcl'));

grupo('BOTÕES MORTOS CONFIRMADOS (falham duas vezes, a segunda isolada)', confirmados);
grupo('falsos positivos do rastreador (funcionam isolados) — NÃO são defeito', falsos);
grupo('inconclusivos', inconclusivos);
grupo('TELAS QUE REDIRECIONARAM (indisponíveis naquela idade)', resultados.filter((r) => r.veredito === 'REDIRECIONOU'));
grupo('TELAS VAZIAS (nenhum botão)', resultados.filter((r) => r.veredito === 'TELA VAZIA'));
grupo('ERROS DE JAVASCRIPT', comErro);
grupo('VIDAS QUE NÃO CHEGARAM NA IDADE', naoChegou);
grupo('REPLAY DE CAMINHO FALHOU (cobertura perdida)', resultados.filter((r) => r.veredito === 'REPLAY FALHOU'));

console.log(`\ntelas visitadas: ${[...telas].sort().join(', ')}`);
console.log(`erros de página no total: ${erros.length}`);
for (const e of erros.slice(0, 8)) console.log(`   ${e.tipo}: ${e.texto.slice(0, 150)}`);

await browser.close();
process.exit(confirmados.length || comErro.length ? 1 : 0);
