// AUDITORIA DE NAVEGAÇÃO POR AÇÃO — para onde cada ação LEVA, não se ela responde ao clique.
//
// A auditoria anterior (`button-audit.mjs`) perguntava "mudou alguma coisa?". Um botão que altera o
// personagem e deixa o jogador parado numa tela secundária passava por ela sem reclamação. Foi por
// isso que ela deu 1.065 cliques sem defeito enquanto o jogo, em uso real, ficava preso em telas.
//
// A REGRA, afirmada aqui como asserção:
//
//   Se uma ação mudou o estado do personagem e NÃO deixou nenhum cartão aberto,
//   o jogo tem de estar na tela principal.
//
//   Abrir uma tela, consultar informação ou mexer em configuração não devolve a ninguém.
//   Ação que pede mais escolhas pode ficar no fluxo — enquanto o cartão estiver aberto.
//
// Uso: node tests/navigation-audit.mjs [base-url] [idades]
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
// Idioma do teste: `BETLIFE_LANG=pt` roda a mesma suíte em português. Sem ele, inglês — o
// original. É assim que as duas passagens do requisito 8 usam exatamente o mesmo caminho.
const LANG = process.env.BETLIFE_LANG ? `&lang=${process.env.BETLIFE_LANG}` : '';
const IDADES = (process.argv[3] || '10,19,30,55').split(',').map(Number);
const SEED = 7;

// Ações cujo propósito é ABRIR algo. Nunca devem devolver à tela principal.
const NAVEGACAO = new Set(['go', 'person', 'asset', 'activity', 'about', 'newLife', 'startRandom', 'startCustom', 'home']);
// Ações que são configuração/informação: não mudam a vida e não devolvem.
const CONFIGURACAO = new Set(['premium']);
// A própria passagem de ano: já acontece na tela principal.
const ANO = new Set(['age']);

const TELAS = ['main', 'growing', 'school', 'university', 'tradeSchool', 'occupation', 'education', 'job', 'jobs',
  'military', 'dream', 'hr', 'partTimeJobs', 'careerHistory', 'assets', 'properties', 'socialMedia', 'socialAccount',
  'finances', 'asset', 'shopping', 'shop', 'relationships', 'person', 'activities', 'pets', 'badges', 'identity', 'menu'];

const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e).slice(0, 120)));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/i.test(m.text())) erros.push(m.text().slice(0, 120)); });

const snap = () => page.evaluate(() => {
  const s = window.betlife && window.betlife.getState();
  const m = document.getElementById('modal-root');
  const p = s && s.player;
  return {
    tela: document.getElementById('game')?.dataset.screen ?? null,
    modal: !!(m && m.firstChild),
    modalTxt: m && m.firstChild ? m.innerText.replace(/\s+/g, ' ').slice(0, 70) : null,
    toast: (() => { const t = document.querySelector('.bl-toast'); return t ? t.innerText.replace(/\s+/g, ' ').slice(0, 80) : null; })(),
    // a "impressão digital" do personagem: tudo que uma ação concluída poderia mudar
    marca: s ? JSON.stringify([p.age, p.money, p.happiness, p.health, p.smarts, p.looks, p.occupation,
      s.timeline.length, s.relationships.length, s.relationships.filter((r) => r.alive).length,
      (s.assets || []).length, s.career && s.career.careerId, s.career && s.career.salary,
      s.education && s.education.stage, s.education && s.education.degree,
      JSON.stringify(s.social || {}), (s.badges || []).length]) : null,
  };
});

const limpar = async (n = 12) => { for (let i = 0; i < n; i++) { const f = await page.evaluate(() => { const r = document.getElementById('modal-root'); if (!r.firstChild) return false; const b = r.querySelector('.bl-banner') || r.querySelector('[data-choice]') || r.querySelector('button'); if (!b) return false; b.click(); return true; }); if (!f) return; await page.waitForTimeout(70); } };

const listar = () => page.evaluate(() => [...document.querySelectorAll('#game [data-action]')].map((el) => {
  const d = el.dataset;
  const alvo = d.target || d.feature || d.person || d.activity || d.study || d.hr || d.asset || d.source || d.shop || d.item || d.career || d.program || d.do || d.major || d.trade || '';
  const r = el.getBoundingClientRect();
  return { acao: d.action, alvo, rotulo: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40), visivel: r.width > 1 && r.height > 1 };
}));
const chave = (b) => `${b.acao}|${b.alvo}|${b.rotulo}`;

async function clicar(k) {
  const box = await page.evaluate((kk) => {
    const el = [...document.querySelectorAll('#game [data-action]')].find((e) => {
      const d = e.dataset;
      const alvo = d.target || d.feature || d.person || d.activity || d.study || d.hr || d.asset || d.source || d.shop || d.item || d.career || d.program || d.do || d.major || d.trade || '';
      return `${d.action}|${alvo}|${(e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40)}` === kk;
    });
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, k);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  await page.waitForTimeout(260);
  return true;
}

async function abrir(tela, idade) {
  const url = `${BASE}?seed=${SEED}&age=${idade}&person=first&asset=first&shop=electronics&social=1&_=${tela}${LANG}#${tela}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  try { await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 12000 }); } catch (_) { return false; }
  await page.waitForTimeout(240);
  await limpar();
  await page.evaluate(() => { const t = document.getElementById('toast-root'); if (t) t.innerHTML = ''; });
  return (await snap()).tela === tela;
}

const achados = [];
let cliques = 0;

for (const idade of IDADES) {
  for (const tela of TELAS) {
    if (!(await abrir(tela, idade))) continue;
    const botoes = (await listar()).filter((b) => b.visivel);
    for (const b of botoes) {
      if (!(await abrir(tela, idade))) break;
      const antes = await snap();
      if (antes.tela !== tela) break;
      const nErros = erros.length;
      if (!(await clicar(chave(b)))) continue;
      cliques++;
      let depois = await snap();

      // Se abriu um cartão de confirmação, a ação ainda não terminou: responde a PRIMEIRA opção e
      // mede de novo. É isso que "ação que precisa de escolhas pode ficar no fluxo" quer dizer.
      let respondeu = false;
      if (!antes.modal && depois.modal) {
        await page.evaluate(() => { const b2 = document.querySelector('#modal-root [data-choice="0"], #modal-root [data-choice], #modal-root button'); if (b2) b2.click(); });
        await page.waitForTimeout(320);
        await limpar(4);
        depois = await snap();
        respondeu = true;
      }

      const mudouEstado = antes.marca !== depois.marca;
      const tipo = NAVEGACAO.has(b.acao) ? 'navegação' : CONFIGURACAO.has(b.acao) ? 'configuração' : ANO.has(b.acao) ? 'ano' : 'ação';
      let esperado, ok;
      if (tipo === 'navegação') { esperado = 'abre uma tela (não volta)'; ok = true; }
      else if (tipo === 'configuração') { esperado = 'fica onde está'; ok = depois.tela === tela; }
      else if (tipo === 'ano') { esperado = 'segue na principal'; ok = depois.tela === 'main'; }
      else if (depois.modal) { esperado = 'fluxo em andamento (cartão aberto)'; ok = true; }
      else if (!mudouEstado) { esperado = 'não mudou nada: pode ficar'; ok = true; }
      else { esperado = 'TELA PRINCIPAL'; ok = depois.tela === 'main'; }

      achados.push({ idade, de: tela, acao: b.acao, alvo: b.alvo, rotulo: b.rotulo, tipo,
        para: depois.tela, mudouEstado, respondeu, toast: depois.toast, esperado, ok,
        erro: erros.slice(nErros)[0] || null });
    }
  }
  const r = achados.filter((x) => x.idade === idade);
  console.log(`  idade ${String(idade).padStart(2)}: ${r.length} ações · fora do destino esperado: ${r.filter((x) => !x.ok).length}`);
}

// ── Relatório ────────────────────────────────────────────────────────────────
const ruins = achados.filter((x) => !x.ok);
const acoesConcluidas = achados.filter((x) => x.esperado === 'TELA PRINCIPAL');
console.log(`\nTOTAL: ${cliques} cliques · ${achados.length} ações medidas · ${acoesConcluidas.length} delas eram ações CONCLUÍDAS`);
console.log(`fora do destino esperado: ${ruins.length}\n`);

if (ruins.length) {
  // agrupa por tipo de ação, porque é por ação que se conserta, não por botão
  const porAcao = new Map();
  for (const r of ruins) {
    const k = `${r.acao}`;
    if (!porAcao.has(k)) porAcao.set(k, []);
    porAcao.get(k).push(r);
  }
  console.log('── AÇÕES QUE NÃO VOLTAM À TELA PRINCIPAL');
  for (const [acao, lista] of [...porAcao.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const telas = [...new Set(lista.map((x) => `${x.de}→${x.para}`))];
    console.log(`\n   ${acao}  (${lista.length} ocorrências)`);
    console.log(`     caminhos: ${telas.join(', ')}`);
    console.log(`     exemplo : "${lista[0].rotulo}" · mensagem: ${lista[0].toast ? JSON.stringify(lista[0].toast.slice(0, 50)) : 'nenhuma'}`);
  }
}

// quantas ações concluídas há por tela de origem, para dimensionar
const porTela = new Map();
for (const a of acoesConcluidas) porTela.set(a.de, (porTela.get(a.de) || 0) + 1);
console.log(`\nações concluídas por tela de origem: ${[...porTela.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}:${n}`).join(' · ')}`);
console.log(`erros de página: ${erros.length}${erros.length ? ` → ${erros[0]}` : ''}`);

await browser.close();
process.exit(ruins.length ? 1 : 0);
