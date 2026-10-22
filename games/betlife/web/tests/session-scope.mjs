// PROGRESSO POR ABA, E A NAVEGAÇÃO DO CHIRPER.
//
// "Fechar a aba" é simulado como o navegador faz de verdade: um contexto novo que herda o
// localStorage do anterior (disco) e começa com sessionStorage vazio (a aba morreu). É a única
// forma honesta de testar isto — recarregar a página não fecha a aba.
//
// Uso: node tests/session-scope.mjs [base-url-do-arcade]
import { webkit } from 'playwright';

const ARCADE = process.argv[2] || 'http://127.0.0.1:8099/web/';
const JOGO = `${ARCADE}games/betlife/`;
const POLY = `${ARCADE}games/poly-kart/`;

const browser = await webkit.launch();
const resultados = [];
const check = (n, ok, d = '') => { resultados.push({ n, ok: !!ok, d }); console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${n}${ok || !d ? '' : ` — ${d}`}`); };
const titulo = (t) => console.log(`\n${t}`);

let disco;                      // o localStorage sobrevive ao fechar da aba; o sessionStorage não.
async function emNovaAba(fn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, storageState: disco, acceptDownloads: true });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e).slice(0, 120)));
  const r = await fn(page, erros);
  const estado = await ctx.storageState();
  // Só o localStorage atravessa: é isso que o disco guarda.
  disco = { cookies: [], origins: estado.origins.map((o) => ({ ...o })) };
  await ctx.close();
  return r;
}

const pronto = async (page) => {
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForFunction(() => { const t = document.getElementById('game').dataset.screen; return t && !['splash', 'disclaimer'].includes(t); }, null, { timeout: 18000 });
  await page.waitForTimeout(350);
};
const limpar = async (page, n = 14) => { for (let i = 0; i < n; i++) { const f = await page.evaluate(() => { const r = document.getElementById('modal-root'); if (!r.firstChild) return false; const b = r.querySelector('.bl-banner') || r.querySelector('[data-choice]') || r.querySelector('button'); if (!b) return false; b.click(); return true; }); if (!f) return; await page.waitForTimeout(60); } };
const est = (page) => page.evaluate(() => {
  const s = window.betlife.getState();
  const acc = s ? (s.social || {}) : {};
  return { tela: document.getElementById('game').dataset.screen, nome: s?.player.name ?? null, idade: s?.player.age ?? null,
    diario: s?.timeline.length ?? 0, contas: Object.keys(acc).filter((k) => acc[k]),
    modal: !!document.getElementById('modal-root').firstChild };
});
const chaves = (page) => page.evaluate(() => {
  const L = {}; const S = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); L[k] = String(localStorage.getItem(k)).length; } } catch (_) {}
  try { for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); S[k] = String(sessionStorage.getItem(k)).length; } } catch (_) {}
  return { local: L, session: S };
});
const clicar = async (page, sel) => {
  const box = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return r.width < 1 ? null : { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  if (!box) return false;
  await page.mouse.click(box.x, box.y); await page.waitForTimeout(230); return true;
};

/* ══ 1. Chirper ════════════════════════════════════════════════════════════ */
titulo('1. CHIRPER — Post e Delete Account voltam à tela principal');
await emNovaAba(async (page, erros) => {
  // Post
  await page.goto(`${JOGO}?seed=7&age=27&social=1&_=p#socialMedia`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 15000 });
  await page.waitForTimeout(350); await limpar(page);
  check('a conta do Chirper abre', await clicar(page, '#game [data-action="go"][data-target="socialAccount"]'));
  const antes = await est(page);
  check('está na tela da conta', antes.tela === 'socialAccount', `tela ${antes.tela}`);
  check('clicou em Post', await clicar(page, '#game [data-action="socialPost"]'));
  const depois = await est(page);
  check('Post → volta à tela principal', depois.tela === 'main', `ficou em ${depois.tela}`);
  check('Post executou a ação (entrou no diário)', depois.diario > antes.diario, `${antes.diario} → ${depois.diario}`);
  check('Post não reiniciou a vida', depois.nome === antes.nome && depois.idade === antes.idade, `${depois.nome} aos ${depois.idade}`);
  check('a conta continua existindo depois de postar', depois.contas.includes('chirper'), JSON.stringify(depois.contas));

  // Delete Account
  await page.goto(`${JOGO}?seed=7&age=27&social=1&_=d#socialMedia`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 15000 });
  await page.waitForTimeout(350); await limpar(page);
  await clicar(page, '#game [data-action="go"][data-target="socialAccount"]');
  const antesDel = await est(page);
  await clicar(page, '#game [data-action="socialDelete"]');
  const confirma = await est(page);
  check('Delete Account pede confirmação antes', confirma.modal, 'apagou sem perguntar');
  await page.evaluate(() => document.querySelector('#modal-root [data-choice="0"]')?.click());
  await page.waitForTimeout(400);
  const depoisDel = await est(page);
  check('Delete Account → a conta some', antesDel.contas.includes('chirper') && !depoisDel.contas.includes('chirper'), `${JSON.stringify(antesDel.contas)} → ${JSON.stringify(depoisDel.contas)}`);
  check('Delete Account → volta à tela principal', depoisDel.tela === 'main', `ficou em ${depoisDel.tela}`);
  check('Delete Account não reiniciou a vida', depoisDel.nome === antesDel.nome && depoisDel.idade === antesDel.idade, `${depoisDel.nome} aos ${depoisDel.idade}`);

  // Cancelar mantém a conta
  await page.goto(`${JOGO}?seed=7&age=27&social=1&_=k#socialMedia`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 15000 });
  await page.waitForTimeout(350); await limpar(page);
  await clicar(page, '#game [data-action="go"][data-target="socialAccount"]');
  await clicar(page, '#game [data-action="socialDelete"]');
  await page.evaluate(() => { const b = document.querySelectorAll('#modal-root [data-choice]'); if (b.length > 1) b[b.length - 1].click(); });
  await page.waitForTimeout(350);
  const cancelou = await est(page);
  check('cancelar a exclusão mantém a conta', cancelou.contas.includes('chirper'), JSON.stringify(cancelou.contas));

  // Voltar
  await page.goto(`${JOGO}?seed=7&age=27&social=1&_=v#socialMedia`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 15000 });
  await page.waitForTimeout(350); await limpar(page);
  await clicar(page, '#game [data-action="go"][data-target="socialAccount"]');
  const antesVoltar = await est(page);
  check('o botão voltar funciona', await clicar(page, '#game .bl-titlebar [data-action="go"]'));
  const voltou = await est(page);
  check('voltar leva à lista de redes sociais', voltou.tela === 'socialMedia', `tela ${voltou.tela}`);
  check('voltar não reinicia a vida', voltou.nome === antesVoltar.nome && voltou.idade === antesVoltar.idade, `${voltou.nome} aos ${voltou.idade}`);
  check('nenhum erro de JavaScript no Chirper', erros.length === 0, erros.slice(0, 2).join(' | '));
});

/* ══ 2. Progresso vive na aba ══════════════════════════════════════════════ */
titulo('2. ABA ABERTA — o progresso sobrevive a navegar e a recarregar');
disco = undefined;
const vida = await emNovaAba(async (page, erros) => {
  await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
  await pronto(page); await limpar(page);
  for (let i = 0; i < 6 && (await est(page)).tela !== 'main'; i++) {
    await page.evaluate(() => document.querySelector('[data-action="startRandom"], [data-action="newLife"]')?.click());
    await page.waitForTimeout(380); await limpar(page);
  }
  for (let i = 0; i < 6; i++) { await clicar(page, '#game [data-action="age"]'); await limpar(page); }
  const jogou = await est(page);
  check('jogou uma vida até alguns anos', jogou.idade >= 4, `idade ${jogou.idade}`);

  // navegar entre telas
  for (const t of ['relationships', 'assets', 'activities', 'menu']) {
    await clicar(page, `#game [data-action="go"][data-target="${t}"]`);
    await clicar(page, '#game .bl-titlebar [data-action="go"]');
  }
  const navegou = await est(page);
  check('navegar entre telas não perde o progresso', navegou.nome === jogou.nome && navegou.idade === jogou.idade, `${navegou.nome} aos ${navegou.idade}`);

  // recarregar a página (a aba continua a mesma)
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForTimeout(600);
  await limpar(page);
  const recarregou = await est(page);
  check('recarregar na mesma aba recupera a vida', recarregou.nome === jogou.nome && recarregou.idade === jogou.idade, `${recarregou.nome} aos ${recarregou.idade}`);

  const k = await chaves(page);
  check('o PROGRESSO não está em localStorage', !Object.keys(k.local).some((x) => /\.save$/.test(x)), JSON.stringify(k.local));
  check('o progresso está na aba (sessionStorage)', Object.keys(k.session).some((x) => /\.save$/.test(x)), JSON.stringify(Object.keys(k.session)));
  check('as preferências continuam no disco', Object.keys(k.local).length > 0, JSON.stringify(Object.keys(k.local)));
  check('sem erro de JavaScript', erros.length === 0, erros.slice(0, 2).join(' | '));
  return jogou;
});

/* ══ 3. Fechar a aba zera ══════════════════════════════════════════════════ */
titulo('3. ABA FECHADA — abrir o site de novo começa do zero');
await emNovaAba(async (page) => {
  await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  const novo = await est(page);
  check('a vida anterior NÃO voltou', novo.nome !== vida.nome || novo.idade === null || novo.idade === 0, `voltou ${novo.nome} aos ${novo.idade}`);
  const k = await chaves(page);
  check('nada de progresso sobrou no disco', !Object.keys(k.local).some((x) => /\.save$/.test(x)), JSON.stringify(k.local));
  check('as preferências sobreviveram ao fechar da aba', Object.keys(k.local).length > 0, JSON.stringify(Object.keys(k.local)));
});


/* ══ 3b. Duas abas ao mesmo tempo ══════════════════════════════════════════ */
titulo('3b. DUAS ABAS — cada uma com a sua vida, sem interferência');
{
  // `sessionStorage` é por aba. Duas abas ao mesmo tempo compartilham o localStorage (as
  // preferências) e NÃO compartilham o progresso — que é exatamente o que se quer.
  const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pa = await ctxA.newPage(); const pb = await ctxB.newPage();
  const erros = [];
  for (const pg of [pa, pb]) pg.on('pageerror', (e) => erros.push(String(e).slice(0, 110)));

  const comecar = async (pg, anos) => {
    await pg.goto(JOGO, { waitUntil: 'domcontentloaded' });
    await pronto(pg); await limpar(pg);
    for (let i = 0; i < 6 && (await est(pg)).tela !== 'main'; i++) {
      await pg.evaluate(() => document.querySelector('[data-action="startRandom"], [data-action="newLife"]')?.click());
      await pg.waitForTimeout(380); await limpar(pg);
    }
    for (let i = 0; i < anos; i++) { await clicar(pg, '#game [data-action="age"]'); await limpar(pg); }
    return est(pg);
  };

  const a1 = await comecar(pa, 3);
  const b1 = await comecar(pb, 7);
  check('as duas abas têm vidas próprias', a1.nome !== b1.nome || a1.idade !== b1.idade, `${a1.nome} ${a1.idade}a × ${b1.nome} ${b1.idade}a`);
  check('cada aba tem a idade que ela mesma jogou', a1.idade !== b1.idade, `${a1.idade} × ${b1.idade}`);

  // envelhecer numa aba não mexe na outra
  await clicar(pa, '#game [data-action="age"]'); await limpar(pa);
  const a2 = await est(pa); const b2 = await est(pb);
  check('jogar numa aba não altera a outra', b2.nome === b1.nome && b2.idade === b1.idade, `aba B virou ${b2.nome} aos ${b2.idade}`);
  check('a aba que jogou avançou', a2.idade > a1.idade, `${a1.idade} → ${a2.idade}`);

  // recarregar a aba B mantém a vida DELA
  await pb.reload({ waitUntil: 'domcontentloaded' });
  await pb.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await pb.waitForTimeout(700); await limpar(pb);
  const b3 = await est(pb);
  check('recarregar a aba B recupera a vida da aba B', b3.nome === b1.nome && b3.idade === b1.idade, `${b3.nome} aos ${b3.idade}`);
  check('sem erro de JavaScript com duas abas', erros.length === 0, erros.slice(0, 2).join(' | '));
  await ctxA.close(); await ctxB.close();
}

/* ══ 4. Voltar ao hub também zera ══════════════════════════════════════════ */
titulo('4. HUB — sair do Arcade e entrar de novo começa do zero');
await emNovaAba(async (page) => {
  await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
  await pronto(page); await limpar(page);
  for (let i = 0; i < 6 && (await est(page)).tela !== 'main'; i++) {
    await page.evaluate(() => document.querySelector('[data-action="startRandom"], [data-action="newLife"]')?.click());
    await page.waitForTimeout(380); await limpar(page);
  }
  for (let i = 0; i < 4; i++) { await clicar(page, '#game [data-action="age"]'); await limpar(page); }
  const antes = await est(page);
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  const depois = await est(page);
  check('passar pelo hub começa uma vida nova', depois.nome !== antes.nome || depois.idade === null || depois.idade === 0, `voltou ${depois.nome} aos ${depois.idade}`);
});

/* ══ 5. Os outros jogos ════════════════════════════════════════════════════ */
titulo('5. OUTROS JOGOS — nada foi quebrado nem apagado');
await emNovaAba(async (page, erros) => {
  // marca um recorde falso do Poly Kart no disco e confere que ele atravessa o fechar da aba
  await page.goto(POLY, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  check('Poly Kart carrega', !erros.some((e) => /Cannot find|is not defined/.test(e)), erros.slice(0, 2).join(' | '));
  await page.evaluate(() => { try { localStorage.setItem('poly-kart.best-times.v1', JSON.stringify({ teste: 123 })); } catch (_) {} });
});
await emNovaAba(async (page, erros) => {
  await page.goto(POLY, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const rec = await page.evaluate(() => { try { return localStorage.getItem('poly-kart.best-times.v1'); } catch (_) { return null; } });
  check('os recordes do Poly Kart sobrevivem ao fechar da aba', rec && rec.includes('123'), String(rec));
  await page.goto(`${ARCADE}games/flappy-bruh/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  check('Flappy Bruh carrega', !erros.some((e) => /Cannot find|is not defined/.test(e)), erros.slice(0, 2).join(' | '));
  const rec2 = await page.evaluate(() => { try { return localStorage.getItem('poly-kart.best-times.v1'); } catch (_) { return null; } });
  check('entrar em outro jogo não apaga os dados do Poly Kart', rec2 && rec2.includes('123'), String(rec2));
});


/* ══ 6. A vida que a versão anterior deixou no disco ═══════════════════════ */
titulo('6. VIDA ANTIGA NO DISCO — oferecida, nunca apagada em silêncio');
{
  const plantar = async (page) => {
    await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear();
      localStorage.setItem('betlife.web.save', JSON.stringify({ version: 2, player: { name: 'Antonia Reis', age: 41, alive: true, money: 1234 }, timeline: [{ text: 'x' }] }));
      localStorage.setItem('betlife.web.language', 'en'); } catch (_) {} });
    await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
    await page.waitForTimeout(2300);
  };
  const cartao = (page) => page.evaluate(() => { const m = document.getElementById('modal-root');
    return m.firstChild ? { txt: m.innerText.replace(/\s+/g, ' '), botoes: [...m.querySelectorAll('[data-choice]')].map((b) => b.innerText.trim()) } : null; });

  // caminho "baixar"
  disco = undefined;
  await emNovaAba(async (page, erros) => {
    await plantar(page);
    const c = await cartao(page);
    check('o jogo avisa sobre a vida antiga', !!c && /old version/i.test(c.txt), c ? c.txt.slice(0, 60) : 'nenhum cartão');
    check('o cartão diz de quem é a vida', !!c && /Antonia Reis/.test(c.txt) && /41/.test(c.txt), c ? c.txt.slice(0, 120) : '');
    check('oferece baixar e descartar', !!c && c.botoes.length === 2 && /download/i.test(c.botoes[0]), JSON.stringify(c && c.botoes));
    check('NÃO apagou antes de o jogador escolher', await page.evaluate(() => !!localStorage.getItem('betlife.web.save')), 'a vida sumiu sozinha');

    const baixando = page.waitForEvent('download', { timeout: 9000 }).catch(() => null);
    await page.evaluate(() => document.querySelector('#modal-root [data-choice="0"]')?.click());
    const arq = await baixando;
    await page.waitForTimeout(600);
    check('baixar produz um arquivo', !!arq, 'nenhum download');
    if (arq) {
      const fs = await import('node:fs');
      const j = JSON.parse(fs.readFileSync(await arq.path(), 'utf8'));
      check('o arquivo contém a vida de verdade', j.player && j.player.name === 'Antonia Reis' && j.player.age === 41, JSON.stringify(j.player || {}).slice(0, 60));
      check('o arquivo tem nome legível', /antonia/i.test(arq.suggestedFilename()), arq.suggestedFilename());
    }
    check('só depois de baixar a vida sai do disco', !(await page.evaluate(() => !!localStorage.getItem('betlife.web.save'))));
    check('a preferência de idioma sobreviveu', (await page.evaluate(() => localStorage.getItem('betlife.web.language'))) === 'en');
    check('sem erro de JavaScript', erros.length === 0, erros.slice(0, 2).join(' | '));
  });

  // caminho "descartar"
  disco = undefined;
  await emNovaAba(async (page) => {
    await plantar(page);
    await page.evaluate(() => { const b = document.querySelectorAll('#modal-root [data-choice]'); if (b.length > 1) b[b.length - 1].click(); });
    await page.waitForTimeout(600);
    check('descartar remove a vida antiga', !(await page.evaluate(() => !!localStorage.getItem('betlife.web.save'))));
    check('e o aviso não volta na próxima abertura', await (async () => {
      await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
      await page.waitForTimeout(2000);
      const c = await cartao(page);
      return !c || !/old version/i.test(c.txt);
    })());
  });

  // a guarda de sessão não pode apagar a vida antiga antes do aviso
  disco = undefined;
  await emNovaAba(async (page) => {
    await plantar(page);
    await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });     // passa pelo hub
    await page.waitForTimeout(500);
    await page.goto(JOGO, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    check('passar pelo hub não apaga a vida antiga do disco', await page.evaluate(() => !!localStorage.getItem('betlife.web.save')),
      'a guarda de sessão apagou antes de o jogador escolher');
  });
}

/* ══ Resumo ════════════════════════════════════════════════════════════════ */
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} verificações passaram${falhas.length ? `, ${falhas.length} FALHARAM` : ''}.`);
for (const f of falhas) console.log(`   FALHA  ${f.n}${f.d ? ` — ${f.d}` : ''}`);
await browser.close();
process.exit(falhas.length ? 1 : 0);
