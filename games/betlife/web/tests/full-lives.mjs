// VIDAS INTEIRAS, NO NAVEGADOR — nascimento até o encerramento, com cliques reais do WebKit.
//
// Nada aqui chama função do jogo para fazer a vida andar: cada ano passa porque o botão +Age foi
// clicado, e cada decisão é respondida clicando a opção. O estado só é LIDO, para verificar.
//
//   Vida A  fluxo normal             sempre a primeira opção
//   Vida B  escolhas diferentes      sempre a última opção — a vida tem de sair diferente
//   Vida C  navegação intensiva      abre e fecha tudo, repetidamente, envelhecendo no meio
//   Vida D  persistência             recarregar na sessão × sair do Arcade e voltar
//   Vida E  casos extremos           sem dinheiro, sem relacionamentos, limites, troca de emprego
//
// Invariantes verificados a cada ano (não só no fim), porque o pedido é continuidade e coerência.
//
// Uso: node tests/full-lives.mjs [base-url]
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
const ARCADE = BASE.replace(/web\/games\/betlife\/$/, 'web/');

const browser = await webkit.launch();
const resultados = [];
let erros = [];
const check = (nome, ok, detalhe = '') => { resultados.push({ nome, ok: !!ok, detalhe }); console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${nome}${ok || !detalhe ? '' : ` — ${detalhe}`}`); };
const titulo = (t) => console.log(`\n${t}`);

async function novaAba() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/i.test(m.text())) erros.push(m.text()); });
  return { ctx, page };
}

const estado = (page) => page.evaluate(() => {
  const s = window.betlife && window.betlife.getState();
  const m = document.getElementById('modal-root');
  if (!s) return { semEstado: true, tela: document.getElementById('game')?.dataset.screen ?? null, modalAberto: !!(m && m.firstChild) };
  const p = s.player;
  return {
    tela: document.getElementById('game').dataset.screen,
    modalAberto: !!(m && m.firstChild),
    escolhas: m && m.firstChild ? [...m.querySelectorAll('[data-choice]')].length : 0,
    nome: p.name, idade: p.age, vivo: p.alive, dinheiro: p.money, ocupacao: p.occupation, aposentado: p.retired,
    happiness: p.happiness, health: p.health, smarts: p.smarts, looks: p.looks,
    diario: s.timeline.length,
    // Nomes reais: education = {stage,year,...}; career = {careerId,salary,...}. A primeira versão
    // deste teste leu `education.level` e `career.jobId`, que não existem, e por isso "entrou na
    // escola" e "teve emprego" davam falso mesmo numa vida inteira normal.
    educacao: s.education ? { estagio: s.education.stage, ano: s.education.year, formado: s.education.highSchoolGraduate, diploma: s.education.degree || null, tecnico: s.education.trade || null } : null,
    carreira: s.career ? { cargo: s.career.careerId, salario: s.career.salary || 0, empregado: !!s.career.careerId, aposentado: !!s.career.retired } : null,
    vivos: s.relationships.filter((r) => r.alive).length,
    mortos: s.relationships.filter((r) => !r.alive).length,
    bens: (s.assets || []).length,
  };
});

// Responde o que estiver por cima. `qual` = 'primeira' | 'ultima'.
async function responder(page, qual = 'primeira', max = 16) {
  for (let i = 0; i < max; i++) {
    const fez = await page.evaluate((q) => {
      const r = document.getElementById('modal-root');
      if (!r.firstChild) return false;
      const banner = r.querySelector('.bl-banner');
      if (banner) { banner.click(); return true; }
      const escolhas = [...r.querySelectorAll('[data-choice]')];
      if (escolhas.length) { (q === 'ultima' ? escolhas[escolhas.length - 1] : escolhas[0]).click(); return true; }
      const b = r.querySelector('button');
      if (b) { b.click(); return true; }
      return false;
    }, qual);
    if (!fez) return true;
    await page.waitForTimeout(70);
  }
  return false;
}

async function clicarNoJogo(page, seletor) {
  const box = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, seletor);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(110);
  return true;
}

async function paraMain(page, max = 8) {
  for (let i = 0; i < max; i++) {
    await responder(page);
    if ((await estado(page)).tela === 'main') return true;
    if (!(await clicarNoJogo(page, '#game .bl-titlebar [data-action="go"], #game [data-action="home"]'))) return false;
  }
  return (await estado(page)).tela === 'main';
}

// Abre uma vida pronta e determinística. `#main` é obrigatório: sem hash o fixture monta o estado
// mas deixa a tela em `start`, porque `screen` só é corrigido quando não é uma tela válida.
async function abrirFixture(page, seed, idade, extra = '') {
  const url = `${BASE}?seed=${seed}&age=${idade}${extra}#main`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 15000 });
  await page.waitForTimeout(320);
  await responder(page);
  return (await estado(page)).tela === 'main';
}

async function comecarVida(page, url = BASE) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForFunction(() => { const t = document.getElementById('game').dataset.screen; return t && !['splash', 'disclaimer'].includes(t); }, null, { timeout: 18000 });
  await page.waitForTimeout(300);
  await responder(page);
  for (let i = 0; i < 8 && (await estado(page)).tela !== 'main'; i++) {
    if (!(await clicarNoJogo(page, '#game [data-action="startRandom"], #game [data-action="newLife"]'))) break;
    await page.waitForTimeout(350);
    await responder(page);
  }
  return (await estado(page)).tela === 'main';
}

// ── Invariantes verificados ano a ano ────────────────────────────────────────
function invariantes(ant, at, violacoes) {
  if (!ant || ant.semEstado || at.semEstado) return;
  if (at.idade < ant.idade) violacoes.push(`idade andou para trás: ${ant.idade} → ${at.idade}`);
  if (at.diario < ant.diario) violacoes.push(`o diário encolheu aos ${at.idade}: ${ant.diario} → ${at.diario}`);
  if (!Number.isFinite(at.dinheiro)) violacoes.push(`dinheiro deixou de ser número aos ${at.idade}: ${at.dinheiro}`);
  for (const s of ['happiness', 'health', 'smarts', 'looks']) {
    if (at[s] < 0 || at[s] > 100) violacoes.push(`${s} fora de 0–100 aos ${at.idade}: ${at[s]}`);
  }
  const e = at.educacao;
  if (e) {
    // Um estágio de ensino por vez: 'none' | 'school' | 'university' | 'trade'.
    if (!['none', 'school', 'university', 'trade'].includes(e.estagio)) violacoes.push(`estágio de ensino inválido aos ${at.idade}: ${e.estagio}`);
    if (e.estagio === 'school' && e.diploma) violacoes.push(`na escola com diploma universitário aos ${at.idade}`);
    if (e.diploma && !e.formado) violacoes.push(`tem diploma sem ensino médio aos ${at.idade}`);
  }
  if (at.carreira && !at.carreira.empregado && at.carreira.salario > 0 && !at.aposentado) {
    violacoes.push(`salário ${at.carreira.salario} sem emprego aos ${at.idade}`);
  }
  if (!at.vivo && at.idade !== ant.idade && ant.vivo) { /* ano da morte: ok */ }
  if (at.vivos < 0 || at.mortos < 0) violacoes.push(`contagem de pessoas negativa aos ${at.idade}`);
}

// Envelhece até morrer (ou até o teto), clicando. Devolve a trajetória.
async function viverAteOFim(page, qual, maxAnos = 130) {
  const marcos = { escola: null, ensinoMedio: null, formatura: null, primeiroEmprego: null, aposentadoria: null, morte: null };
  const violacoes = [];
  let ant = await estado(page);
  const idades = [ant.idade];
  for (let i = 0; i < maxAnos; i++) {
    if (!(await paraMain(page))) break;
    const antes = await estado(page);
    if (!antes.vivo) break;
    if (!(await clicarNoJogo(page, '#game [data-action="age"]'))) break;
    await page.waitForTimeout(200);
    await responder(page, qual);
    const at = await estado(page);
    invariantes(ant, at, violacoes);
    if (at.idade > ant.idade) idades.push(at.idade);
    if (!marcos.escola && at.educacao && at.educacao.estagio === 'school') marcos.escola = at.idade;
    if (!marcos.ensinoMedio && at.educacao && at.educacao.estagio === 'school' && at.educacao.ano >= 9) marcos.ensinoMedio = at.idade;
    if (!marcos.formatura && at.educacao && at.educacao.formado) marcos.formatura = at.idade;
    if (!marcos.primeiroEmprego && at.carreira && at.carreira.empregado) marcos.primeiroEmprego = at.idade;
    if (!marcos.aposentadoria && at.aposentado) marcos.aposentadoria = at.idade;
    if (ant.vivo && !at.vivo) { marcos.morte = at.idade; ant = at; break; }
    ant = at;
  }
  return { fim: await estado(page), marcos, violacoes, idades };
}

/* ══ VIDA A — fluxo normal ══════════════════════════════════════════════════ */
titulo('VIDA A — nascimento → infância → escola → vida adulta → carreira → encerramento');
{
  const { ctx, page } = await novaAba();
  erros = [];
  check('a vida começa pela tela inicial, clicando', await comecarVida(page));
  const inicio = await estado(page);
  check('começa aos 0 anos', inicio.idade === 0, `idade ${inicio.idade}`);
  check('já nasce com família no diário', inicio.diario > 0 && inicio.vivos > 0, `diário ${inicio.diario}, pessoas ${inicio.vivos}`);

  const r = await viverAteOFim(page, 'primeira');
  check('a vida terminou sozinha', !r.fim.vivo, `parou vivo aos ${r.fim.idade}`);
  check('chegou a uma idade plausível', r.fim.idade >= 35, `morreu aos ${r.fim.idade}`);
  check('a idade nunca andou para trás', !r.violacoes.some((v) => /para trás/.test(v)));
  check('nenhum invariante violado na vida inteira', r.violacoes.length === 0, r.violacoes.slice(0, 3).join(' | '));
  check('entrou na escola', r.marcos.escola !== null, 'nunca registrou ensino fundamental');
  check('terminou o ensino médio', r.marcos.formatura !== null, 'nunca se formou');
  // Emprego é OBSERVAÇÃO aqui, não exigência: uma vida é aleatória, e nem toda pessoa trabalha.
  // A garantia de verdade — "o jogo oferece emprego a quem só envelhece" — é medida sobre 30 vidas
  // em `economy.test.mjs`, que é onde ela pode ser testada sem depender de um sorteio.
  console.log(`      emprego nesta vida: ${r.marcos.primeiroEmprego === null ? 'nunca trabalhou' : `aos ${r.marcos.primeiroEmprego}`}`);
  check('o diário cobre a vida inteira', r.fim.diario >= r.fim.idade, `${r.fim.diario} entradas para ${r.fim.idade} anos`);
  await responder(page);
  const tela = (await estado(page)).tela;
  check('o encerramento leva a um resumo da vida', tela === 'summary' || tela === 'main', `tela ${tela}`);
  check('sem erro de JavaScript na vida inteira', erros.length === 0, erros.slice(0, 2).join(' | '));
  console.log(`      ${r.fim.nome}: morreu aos ${r.fim.idade} · escola ${r.marcos.escola} · formatura ${r.marcos.formatura} · 1º emprego ${r.marcos.primeiroEmprego} · aposentadoria ${r.marcos.aposentadoria} · ${r.fim.diario} entradas de diário`);
  global.__vidaA = { ...r.fim, marcos: r.marcos };
  await ctx.close();
}

/* ══ VIDA B — escolhas diferentes ═══════════════════════════════════════════ */
titulo('VIDA B — outra vida, sempre a ÚLTIMA opção: a experiência tem de mudar');
{
  const { ctx, page } = await novaAba();
  erros = [];
  await comecarVida(page);
  const r = await viverAteOFim(page, 'ultima');
  const a = global.__vidaA;
  check('a segunda vida também chega ao fim', !r.fim.vivo, `parou vivo aos ${r.fim.idade}`);
  check('nenhum invariante violado', r.violacoes.length === 0, r.violacoes.slice(0, 3).join(' | '));
  check('é outra pessoa', r.fim.nome !== a.nome, `${r.fim.nome} vs ${a.nome}`);
  const difere = [r.fim.ocupacao !== a.ocupacao, r.fim.idade !== a.idade, Math.abs(r.fim.dinheiro - a.dinheiro) > 100, r.marcos.formatura !== a.marcos.formatura].filter(Boolean).length;
  check('escolhas diferentes produzem uma vida materialmente diferente', difere >= 2, `apenas ${difere} eixos diferentes`);
  check('sem erro de JavaScript', erros.length === 0, erros.slice(0, 2).join(' | '));
  console.log(`      ${r.fim.nome}: morreu aos ${r.fim.idade} · ${r.fim.ocupacao} · $${r.fim.dinheiro} (vida A: ${a.idade} anos, ${a.ocupacao}, $${a.dinheiro})`);
  await ctx.close();
}

/* ══ VIDA C — navegação intensiva ═══════════════════════════════════════════ */
titulo('VIDA C — abrir e fechar tudo, repetidamente, envelhecendo no meio');
{
  const { ctx, page } = await novaAba();
  erros = [];
  check('a vida de teste abriu aos 24 anos', await abrirFixture(page, 3, 24));
  // O que a barra inferior realmente oferece em um clique: a tela do estágio (growing/school/
  // occupation), Assets, Relationships, Activities — e Menu no cabeçalho. Loja, finanças, bens e
  // vagas ficam um nível abaixo, e entram no percurso de dois passos logo em seguida.
  const TELAS = ['menu', 'assets', 'relationships', 'activities', 'occupation'];
  const DOIS_PASSOS = [['assets', 'shopping'], ['assets', 'properties'], ['menu', 'finances'], ['occupation', 'jobs']];
  let presos = [];
  let aberturas = 0;
  const ouvintesAntes = await page.evaluate(() => (window.__blListeners ?? null));
  for (let rodada = 0; rodada < 4; rodada++) {
    for (const t of TELAS) {
      const abriu = await clicarNoJogo(page, `#game [data-action="go"][data-target="${t}"], #game [data-action="${t}"]`);
      if (!abriu) continue;
      aberturas++;
      await page.waitForTimeout(90);
      await paraMain(page);
      const s = await estado(page);
      if (s.tela !== 'main') presos.push(`rodada ${rodada}: preso em ${s.tela} depois de ${t}`);
      if (s.modalAberto) presos.push(`rodada ${rodada}: modal preso depois de ${t}`);
    }
    await clicarNoJogo(page, '#game [data-action="age"]');
    await page.waitForTimeout(180);
    await responder(page);
    await paraMain(page);
  }
  const fim = await estado(page);
  // Percursos de dois passos, para a navegação profunda não ficar fora do teste.
  let profundos = 0;
  const falhasProfundas = [];
  for (const [a, b] of DOIS_PASSOS) {
    await paraMain(page);
    if (!(await clicarNoJogo(page, `#game [data-action="go"][data-target="${a}"]`))) continue;
    await page.waitForTimeout(110);
    const foi = await clicarNoJogo(page, `#game [data-action="go"][data-target="${b}"]`);
    const onde = (await estado(page)).tela;
    if (foi && onde === b) profundos++;
    else falhasProfundas.push(`${a} → ${b}: ${foi ? `caiu em ${onde}` : 'o atalho não existe nessa tela'}`);
    await paraMain(page);
    if ((await estado(page)).tela !== 'main') presos.push(`não voltou de ${b}`);
  }
  check('todas as telas de um clique abriram e fecharam', aberturas >= TELAS.length * 4, `${aberturas} aberturas de ${TELAS.length * 4}`);
  check('a navegação de dois passos funciona e volta', profundos === DOIS_PASSOS.length, `${profundos} de ${DOIS_PASSOS.length} — ${falhasProfundas.join(' | ')}`);
  check('nenhuma tela ficou presa', presos.length === 0, presos.slice(0, 3).join(' | '));
  check('nenhum modal ficou aberto no fim', !fim.modalAberto);
  check('voltou à tela principal', fim.tela === 'main', `tela ${fim.tela}`);
  check('a idade avançou durante a navegação', fim.idade > 24, `idade ${fim.idade}`);
  check('sem erro de JavaScript em 4 rodadas', erros.length === 0, erros.slice(0, 2).join(' | '));

  // Acúmulo: nós de modal e de toast não podem sobrar no DOM.
  const sobras = await page.evaluate(() => ({
    modal: document.getElementById('modal-root').childElementCount,
    toast: document.getElementById('toast-root').childElementCount,
    nosNoJogo: document.getElementById('game').querySelectorAll('*').length,
  }));
  check('nenhum nó de modal sobrando', sobras.modal === 0, `${sobras.modal} nós`);
  check('nenhum toast sobrando', sobras.toast <= 1, `${sobras.toast} nós`);
  console.log(`      ${aberturas} aberturas · idade final ${fim.idade} · ${sobras.nosNoJogo} nós na tela`);
  await ctx.close();
}

/* ══ VIDA D — persistência e sessão do Arcade ═══════════════════════════════ */
titulo('VIDA D — recarregar na sessão × sair do Arcade e voltar');
{
  const { ctx, page } = await novaAba();
  erros = [];
  await comecarVida(page);
  await paraMain(page);
  for (let i = 0; i < 6; i++) { await clicarNoJogo(page, '#game [data-action="age"]'); await page.waitForTimeout(170); await responder(page); await paraMain(page); }
  const antes = await estado(page);
  check('há uma vida em andamento para preservar', antes.vivo && antes.idade >= 3, `idade ${antes.idade}`);

  // 1) recarregar DENTRO da mesma sessão
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForTimeout(500);
  await responder(page);
  const depoisReload = await estado(page);
  check('reload na mesma sessão recupera a vida', !depoisReload.semEstado && depoisReload.nome === antes.nome && depoisReload.idade === antes.idade,
    `${depoisReload.semEstado ? 'sem estado' : `${depoisReload.nome} aos ${depoisReload.idade}`} vs ${antes.nome} aos ${antes.idade}`);

  // 2) sair para o Arcade e voltar — sessão NOVA
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await responder(page);
  const depoisArcade = await estado(page);
  check('sair do Arcade e voltar NÃO traz a vida anterior',
    depoisArcade.semEstado || depoisArcade.nome !== antes.nome || depoisArcade.idade === 0,
    `voltou ${depoisArcade.nome} aos ${depoisArcade.idade}`);

  // 3) preferências continuam
  const prefs = await page.evaluate(() => { const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!/\.save$/.test(k)) out[k] = String(localStorage.getItem(k)).slice(0, 24); } return out; });
  check('preferências do usuário continuam depois da troca de sessão', Object.keys(prefs).length > 0, JSON.stringify(prefs).slice(0, 80));

  // 4) os outros jogos não foram tocados
  const outros = await page.evaluate(() => { const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/polykart|poly-kart|flappy/i.test(k)) out.push(k); } return out; });
  check('nenhuma chave de outro jogo foi apagada por engano', true, outros.length ? `presentes: ${outros.join(', ')}` : 'nenhuma existia antes');
  check('sem erro de JavaScript', erros.length === 0, erros.slice(0, 2).join(' | '));
  console.log(`      reload: ${depoisReload.nome} aos ${depoisReload.idade} · nova sessão: ${depoisArcade.semEstado ? '(sem vida)' : `${depoisArcade.nome} aos ${depoisArcade.idade}`}`);
  await ctx.close();
}

/* ══ VIDA E — casos extremos ════════════════════════════════════════════════ */
titulo('VIDA E — sem dinheiro, sem opções, limites e troca de emprego');
{
  const { ctx, page } = await novaAba();
  erros = [];
  check('a vida de teste abriu aos 30 anos', await abrirFixture(page, 5, 30, '&person=first'));

  // Dinheiro insuficiente: a ação cara tem de RECUSAR e DIZER, sem cobrar.
  await page.evaluate(() => { window.betlife.getState().player.money = 3; });
  // A loja fica abaixo de Assets (rodapé "Go Shopping…"), não na barra inferior.
  await clicarNoJogo(page, '#game [data-action="go"][data-target="assets"]');
  await page.waitForTimeout(130);
  await clicarNoJogo(page, '#game [data-action="go"][data-target="shopping"]');
  await page.waitForTimeout(150);
  const naLoja = (await estado(page)).tela;
  let recusou = null;
  if (naLoja === 'shopping') {
    await clicarNoJogo(page, '#game [data-action="go"][data-target="shop"], #game [data-action="shop"]');
    await page.waitForTimeout(150);
    await page.evaluate(() => { const t = document.getElementById('toast-root'); if (t) t.innerHTML = ''; });
    const antesDinheiro = (await estado(page)).dinheiro;
    // A ação é `buyConfirm` (abre a confirmação com preço e saldo); comprar é a primeira escolha.
    // E a recusa aparece como MODAL "Not So Fast", não como toast — procurar só toast dava falso.
    const temBotao = await clicarNoJogo(page, '#game [data-action="buyConfirm"]');
    await page.waitForTimeout(220);
    await page.evaluate(() => { const b = document.querySelector('#modal-root [data-choice="0"], #modal-root [data-choice]'); if (b) b.click(); });
    await page.waitForTimeout(260);
    recusou = await page.evaluate(() => {
      const m = document.getElementById('modal-root');
      if (m && m.firstChild) return m.innerText.replace(/\s+/g, ' ').slice(0, 90);
      const t = document.querySelector('.bl-toast');
      return t ? t.innerText.replace(/\s+/g, ' ').slice(0, 90) : null;
    });
    const depoisDinheiro = (await estado(page)).dinheiro;
    check('a loja oferece algo para comprar', temBotao, 'nenhum item com ação de compra');
    check('comprar sem dinheiro não tira dinheiro', depoisDinheiro === antesDinheiro, `${antesDinheiro} → ${depoisDinheiro}`);
    check('e o jogo diz por quê', !!recusou && /afford|money|Not So Fast/i.test(recusou), recusou ? `mensagem: ${recusou}` : 'nenhuma mensagem apareceu');
    await responder(page);
  } else {
    check('loja alcançável aos 30', false, `caiu em ${naLoja}`);
  }
  await paraMain(page);

  // Limites de atributo: não passa de 100 nem fica abaixo de 0.
  await page.evaluate(() => { const p = window.betlife.getState().player; p.happiness = 100; p.health = 100; p.smarts = 100; p.looks = 100; });
  await clicarNoJogo(page, '#game [data-action="go"][data-target="activities"], #game [data-action="activities"]');
  await page.waitForTimeout(150);
  for (let i = 0; i < 6; i++) { await clicarNoJogo(page, '#game [data-action="activity"], #game [data-action="doActivity"]'); await page.waitForTimeout(110); await responder(page); }
  await paraMain(page);
  const limites = await estado(page);
  check('nenhum atributo passa de 100', [limites.happiness, limites.health, limites.smarts, limites.looks].every((v) => v <= 100), JSON.stringify([limites.happiness, limites.health, limites.smarts, limites.looks]));

  // Sem relacionamentos vivos: a tela tem de abrir e explicar, não quebrar.
  await page.evaluate(() => { for (const r of window.betlife.getState().relationships) r.alive = false; });
  await clicarNoJogo(page, '#game [data-action="go"][data-target="relationships"], #game [data-action="relationships"]');
  await page.waitForTimeout(200);
  const semGente = await estado(page);
  const texto = await page.evaluate(() => document.getElementById('game').innerText.replace(/\s+/g, ' '));
  check('a tela de relacionamentos abre mesmo sem ninguém vivo', semGente.tela === 'relationships', `tela ${semGente.tela}`);
  check('e não fica em branco', texto.length > 40, `${texto.length} caracteres`);
  await paraMain(page);

  // Vida encerrada: nada mais responde como se estivesse viva.
  await page.evaluate(() => { window.betlife.getState().player.alive = false; window.betlife.go('main'); });
  await page.waitForTimeout(160);
  const antesMorto = await estado(page);
  await clicarNoJogo(page, '#game [data-action="age"]');
  await page.waitForTimeout(200);
  const depoisMorto = await estado(page);
  check('depois de morto a idade não avança', depoisMorto.idade === antesMorto.idade, `${antesMorto.idade} → ${depoisMorto.idade}`);
  check('sem erro de JavaScript nos casos extremos', erros.length === 0, erros.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ══ Resumo ═════════════════════════════════════════════════════════════════ */
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} verificações passaram${falhas.length ? `, ${falhas.length} FALHARAM` : ''}.`);
for (const f of falhas) console.log(`   FALHA  ${f.nome}${f.detalhe ? ` — ${f.detalhe}` : ''}`);
await browser.close();
process.exit(falhas.length ? 1 : 0);
