// O PLAYER+ NO NAVEGADOR, DOS DOIS LADOS E NOS DOIS IDIOMAS.
//
// O que esta suíte existe para provar, e que um teste de unidade não prova: que o BOTÃO que já
// estava lá abre a ativação e NÃO o aviso antigo; que o status atravessa do jogo para o portal e
// volta; que recarregar não apaga; e que mexer no localStorage à mão não vira PLAYER+.
//
// Uso: node tests/player-plus-flow.mjs [base-url-do-arcade]
// Precisa do servidor local (tools/serve.mjs), que serve a mesma função de api/ que a Vercel serve.
import { webkit } from 'playwright';
import { codigoReal } from './env-player-plus.mjs';

const ARCADE = process.argv[2] || 'http://127.0.0.1:8099/web/';
const JOGO = `${ARCADE}games/betlife/`;
const CODIGO = codigoReal();          // do ambiente; não fica escrito aqui — o repositório é público
const CHAVE = 'arcade.playerplus.token';

// A frase exata que o botão mostrava antes. Se ela reaparecer em qualquer ponto do fluxo, o
// religamento falhou — é a regressão que esta suíte vigia de perto.
const AVISO_ANTIGO = /is an admin tool|ferramenta de administrador|premium candidate|candidato a premium/i;

const browser = await webkit.launch();
let ok = 0; let falhas = 0;
const check = (n, passou, d = '') => {
  if (passou) { ok++; console.log(`  ok    ${n}`); }
  else { falhas++; console.log(`  FALHA ${n}${d ? ` — ${d}` : ''}`); }
};
const titulo = (t) => console.log(`\n${t}`);

// Cada cenário nasce num contexto limpo: sem bilhete, sem idioma, sem nada herdado.
async function cenario({ lang = null, mobile = false } = {}, fn) {
  const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } : { viewport: { width: 1100, height: 820 } });
  const page = await ctx.newPage();
  const erros = [];
  const chamadas = [];
  page.on('pageerror', (e) => erros.push(String(e).slice(0, 160)));
  // Um 401 é a resposta CERTA a um código errado, e o navegador anota isso no console como se fosse
  // problema. Os status das chamadas são conferidos à parte, em `chamadas`.
  page.on('console', (m) => { if (m.type() === 'error' && !/status of (401|429)/.test(m.text())) erros.push(`console: ${m.text().slice(0, 160)}`); });
  page.on('response', (r) => { if (r.url().includes('/api/player-plus')) chamadas.push(r.status()); });
  if (lang) {
    await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
    await page.evaluate((l) => localStorage.setItem('betlife.web.language', l), lang);
  }
  try { await fn(page, erros, chamadas); } finally { await ctx.close(); }
}

const pilulaPortal = (page) => page.locator('#player-plus-pill');
const esperaPilula = async (page) => {
  await page.waitForSelector('#player-plus-pill');
  // A pílula nasce "Conferindo…" e só decide depois da resposta do servidor. Esperar isso passar é
  // esperar o estado REAL, em vez de fotografar o provisório.
  await page.waitForFunction(() => !document.getElementById('player-plus-pill').disabled
    || document.getElementById('player-plus-pill').classList.contains('is-active'), null, { timeout: 8000 });
};
const prontoJogo = async (page) => {
  await page.waitForFunction(() => window.betlife && window.betlife.getState(), null, { timeout: 15000 });
  await page.waitForTimeout(300);
  // Limpa banners/cartões pendentes para o cabeçalho ficar clicável.
  for (let i = 0; i < 14; i++) {
    const fechou = await page.evaluate(() => { const r = document.getElementById('modal-root'); if (!r.firstChild) return false;
      const b = r.querySelector('.bl-banner') || r.querySelector('[data-choice]') || r.querySelector('button'); if (!b) return false; b.click(); return true; });
    if (!fechou) break;
    await page.waitForTimeout(60);
  }
};
const textoDaTela = (page) => page.evaluate(() => document.body.innerText);

/* ══ 1. O portal, do zero ══════════════════════════════════════════════════════════════════════ */
titulo('1. PORTAL — a pílula, o modal, o código errado e o certo');
await cenario({}, async (page, erros, chamadas) => {
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  check('a pílula começa como convite', (await pilulaPortal(page).innerText()).includes('PLAYER+')
    && !(await pilulaPortal(page).getAttribute('class')).includes('is-active'));

  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]', { timeout: 4000 });
  check('o clique abre o modal de ativação', true);
  check('o título é "Activate PLAYER+"', (await page.locator('.plus-title').innerText()).trim() === 'Activate PLAYER+');
  check('o campo esconde os caracteres', await page.getAttribute('#plus-code', 'type') === 'password');
  check('tem botão Ativar e botão Cancelar',
    await page.locator('#plus-go').count() === 1 && await page.locator('#plus-cancel').count() === 1);

  // Código errado
  await page.fill('#plus-code', '0000');
  await page.click('#plus-go');
  await page.waitForFunction(() => document.querySelector('#plus-note')?.classList.contains('is-bad'), null, { timeout: 6000 });
  check('código errado mostra o erro', (await page.locator('#plus-note').innerText()).includes('Wrong code'));
  check('e NÃO ativa nada', await page.evaluate((k) => !localStorage.getItem(k), CHAVE));
  check('o modal continua aberto para tentar de novo', await page.locator('dialog.plus-dialog[open]').count() === 1);

  // Código certo, pelo Enter
  await page.fill('#plus-code', CODIGO);
  await page.press('#plus-code', 'Enter');
  await page.waitForFunction(() => document.querySelector('#plus-note')?.classList.contains('is-good'), null, { timeout: 6000 });
  check('o código certo mostra o sucesso', (await page.locator('#plus-note').innerText()).includes('activated successfully'));
  check('o Enter funciona como o botão Ativar', true);
  await page.waitForFunction(() => document.getElementById('player-plus-pill')?.classList.contains('is-active'), null, { timeout: 4000 });
  check('a pílula vira selo na hora', (await pilulaPortal(page).innerText()).includes('PLAYER+ ACTIVE'));
  check('o selo não é mais clicável', await pilulaPortal(page).isDisabled());

  // Recarregar
  await page.reload({ waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  check('recarregar mantém o status', (await pilulaPortal(page).innerText()).includes('PLAYER+ ACTIVE'));

  check('nenhum erro de JavaScript no portal', erros.length === 0, erros.join(' | '));
  check('toda conversa com o servidor respondeu', chamadas.length > 0 && chamadas.every((s) => [200, 401].includes(s)), chamadas.join(','));
});

/* ══ 2. O portal em português ══════════════════════════════════════════════════════════════════ */
titulo('2. PORTAL — o mesmo modal em português');
await cenario({ lang: 'pt' }, async (page, erros) => {
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  check('a pílula fala português', (await pilulaPortal(page).innerText()).includes('Seja um'));
  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]');
  check('o título é "Ativar PLAYER+"', (await page.locator('.plus-title').innerText()).trim() === 'Ativar PLAYER+');
  check('os botões são Ativar e Cancelar',
    (await page.locator('#plus-go').innerText()).trim() === 'Ativar' && (await page.locator('#plus-cancel').innerText()).trim() === 'Cancelar');
  await page.fill('#plus-code', '1111');
  await page.press('#plus-code', 'Enter');
  await page.waitForFunction(() => document.querySelector('#plus-note')?.classList.contains('is-bad'), null, { timeout: 6000 });
  check('o erro é "Senha incorreta. Tente novamente."', (await page.locator('#plus-note').innerText()).includes('Senha incorreta'));
  await page.fill('#plus-code', CODIGO);
  await page.press('#plus-code', 'Enter');
  await page.waitForFunction(() => document.getElementById('player-plus-pill')?.classList.contains('is-active'), null, { timeout: 6000 });
  check('o selo é "PLAYER+ ATIVO"', (await pilulaPortal(page).innerText()).includes('PLAYER+ ATIVO'));
  check('nenhum erro de JavaScript', erros.length === 0, erros.join(' | '));
});

/* ══ 3. Cancelar e Esc não mudam nada ══════════════════════════════════════════════════════════ */
titulo('3. PORTAL — fechar sem ativar deixa tudo como estava');
await cenario({}, async (page) => {
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]');
  await page.fill('#plus-code', CODIGO);          // digitado, mas não confirmado
  await page.click('#plus-cancel');
  await page.waitForTimeout(250);
  check('Cancelar fecha o modal', await page.locator('dialog.plus-dialog[open]').count() === 0);
  check('e não ativa, mesmo com o código certo digitado', await page.evaluate((k) => !localStorage.getItem(k), CHAVE));
  check('a pílula continua convite', !(await pilulaPortal(page).getAttribute('class')).includes('is-active'));

  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  check('Esc também fecha sem ativar',
    await page.locator('dialog.plus-dialog[open]').count() === 0 && await page.evaluate((k) => !localStorage.getItem(k), CHAVE));
});

/* ══ 4. O BetLife: o botão que já existia ══════════════════════════════════════════════════════ */
for (const lang of ['en', 'pt']) {
  titulo(`4. BETLIFE (${lang}) — o botão abre a ativação, e NÃO o aviso antigo`);
  await cenario({ lang }, async (page, erros, chamadas) => {
    await page.goto(`${JOGO}?seed=5&age=24#main`, { waitUntil: 'domcontentloaded' });
    await prontoJogo(page);

    const pilula = page.locator('.bl-premium-pill');
    check('a pílula do PLAYER+ está no cabeçalho', await pilula.count() === 1);
    check('e ainda é um botão, com a aparência de sempre',
      await page.locator('button.bl-header-pill.bl-premium-pill').count() === 1);
    check('ela aponta para a ativação, não para o aviso',
      await pilula.getAttribute('data-action') === 'playerPlus');

    const antes = await page.evaluate(() => { const s = window.betlife.getState(); return { dinheiro: s.player.money, idade: s.player.age, felicidade: s.player.happiness }; });

    await pilula.click();
    await page.waitForSelector('#modal-root .bl-field-input', { timeout: 4000 });
    const cartao = await textoDaTela(page);
    check('o clique abre o cartão de ativação', /Activate PLAYER\+|Ativar PLAYER\+/.test(cartao));
    check('O AVISO ANTIGO NÃO APARECE', !AVISO_ANTIGO.test(cartao), cartao.match(AVISO_ANTIGO)?.[0]);
    check('o campo esconde os caracteres', await page.getAttribute('#bl-field', 'type') === 'password');
    check('o botão de confirmar nasce desligado com o campo vazio',
      await page.locator('#modal-root .bl-modal-buttons [data-choice="0"]').isDisabled());

    // Errado
    await page.fill('#bl-field', '0000');
    await page.press('#bl-field', 'Enter');
    await page.waitForSelector('#modal-root .bl-field-note.is-error', { timeout: 6000 });
    const comErro = await textoDaTela(page);
    check('código errado mostra o erro', /Wrong code|Senha incorreta/.test(comErro));
    check('e o aviso antigo continua fora', !AVISO_ANTIGO.test(comErro));
    check('nada foi ativado', await page.evaluate((k) => !localStorage.getItem(k), CHAVE));

    // Certo
    await page.fill('#bl-field', CODIGO);
    await page.press('#bl-field', 'Enter');
    await page.waitForFunction(() => window.betlife.playerPlus.isActive(), null, { timeout: 6000 });
    await page.waitForTimeout(250);
    const depois = await textoDaTela(page);
    check('o sucesso é anunciado', /activated successfully|ativado com sucesso/.test(depois));
    check('a pílula virou selo na hora', (await page.locator('.bl-premium-pill.is-active').count()) === 1);
    check('o selo diz PLAYER+ ATIVO/ACTIVE', /PLAYER\+ (ACTIVE|ATIVO)/.test(await page.locator('.bl-premium-pill').innerText()));
    check('e não é mais um botão', await page.locator('button.bl-premium-pill').count() === 0);

    // Nada de jogabilidade mudou
    const estado = await page.evaluate(() => { const s = window.betlife.getState(); return { dinheiro: s.player.money, idade: s.player.age, felicidade: s.player.happiness }; });
    check('o PLAYER+ não deu dinheiro, idade nem atributo',
      estado.dinheiro === antes.dinheiro && estado.idade === antes.idade && estado.felicidade === antes.felicidade,
      `${JSON.stringify(antes)} -> ${JSON.stringify(estado)}`);
    check('o status não entrou no estado salvo da vida',
      await page.evaluate(() => !JSON.stringify(window.betlife.getState()).toLowerCase().includes('playerplus')));

    // Recarregar
    await page.reload({ waitUntil: 'domcontentloaded' });
    await prontoJogo(page);
    await page.waitForFunction(() => window.betlife.playerPlus.isActive(), null, { timeout: 8000 });
    check('recarregar mantém o status', await page.locator('.bl-premium-pill.is-active').count() === 1);

    check('nenhum erro de JavaScript no jogo', erros.length === 0, erros.join(' | '));
    check('toda conversa com o servidor respondeu', chamadas.length > 0 && chamadas.every((s) => [200, 401].includes(s)), chamadas.join(','));
  });
}

/* ══ 5. Os outros botões premium continuam como estavam ════════════════════════════════════════ */
titulo('5. BETLIFE — o PLAYER+ não destrava vantagem nenhuma');
await cenario({}, async (page) => {
  await page.goto(`${JOGO}?seed=5&age=24#main`, { waitUntil: 'domcontentloaded' });
  await prontoJogo(page);
  await page.locator('.bl-premium-pill').click();
  await page.waitForSelector('#modal-root .bl-field-input');
  await page.fill('#bl-field', CODIGO);
  await page.press('#bl-field', 'Enter');
  await page.waitForFunction(() => window.betlife.playerPlus.isActive(), null, { timeout: 6000 });
  await page.waitForTimeout(400);
  // O botão de voltar um ano é candidato a premium e DEVE continuar recusando, com PLAYER+ ou sem.
  const rewind = page.locator('.bl-rewind');
  check('o botão de voltar um ano continua existindo', await rewind.count() === 1);
  const idadeAntes = await page.evaluate(() => window.betlife.getState().player.age);
  await rewind.click();
  await page.waitForTimeout(500);
  const texto = await textoDaTela(page);
  check('e com PLAYER+ ativo ele ainda diz que não faz parte do jogo', AVISO_ANTIGO.test(texto));
  check('a idade não voltou', await page.evaluate(() => window.betlife.getState().player.age) === idadeAntes);
});

/* ══ 6. O status atravessa, nos dois sentidos ══════════════════════════════════════════════════ */
titulo('6. COMPARTILHADO — ativar de um lado aparece do outro');
await cenario({}, async (page) => {
  // Ativa no jogo...
  await page.goto(`${JOGO}?seed=5&age=24#main`, { waitUntil: 'domcontentloaded' });
  await prontoJogo(page);
  await page.locator('.bl-premium-pill').click();
  await page.waitForSelector('#modal-root .bl-field-input');
  await page.fill('#bl-field', CODIGO);
  await page.press('#bl-field', 'Enter');
  await page.waitForFunction(() => window.betlife.playerPlus.isActive(), null, { timeout: 6000 });
  // ...e o portal já sabe.
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  check('ativado no BetLife → o portal mostra o selo', (await pilulaPortal(page).innerText()).includes('PLAYER+ ACTIVE'));
});
await cenario({}, async (page) => {
  // E no sentido contrário.
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]');
  await page.fill('#plus-code', CODIGO);
  await page.press('#plus-code', 'Enter');
  await page.waitForFunction(() => document.getElementById('player-plus-pill')?.classList.contains('is-active'), null, { timeout: 6000 });
  await page.goto(`${JOGO}?seed=5&age=24#main`, { waitUntil: 'domcontentloaded' });
  await prontoJogo(page);
  await page.waitForFunction(() => window.betlife.playerPlus.isActive(), null, { timeout: 8000 });
  check('ativado no portal → o BetLife mostra o selo', await page.locator('.bl-premium-pill.is-active').count() === 1);
});

/* ══ 7. Mexer no localStorage não vira PLAYER+ ═════════════════════════════════════════════════ */
titulo('7. SEGURANÇA — bilhete inventado à mão não vale');
await cenario({}, async (page) => {
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]');
  await page.fill('#plus-code', CODIGO);
  await page.press('#plus-code', 'Enter');
  await page.waitForFunction(() => document.getElementById('player-plus-pill')?.classList.contains('is-active'), null, { timeout: 6000 });
  const verdadeiro = await page.evaluate((k) => localStorage.getItem(k), CHAVE);
  check('há um bilhete guardado', !!verdadeiro);
  check('o bilhete NÃO é um simples "true"', verdadeiro !== 'true' && verdadeiro.includes('.'), String(verdadeiro).slice(0, 20));

  for (const forjado of ['true', '1', '{"plus":true}', `${verdadeiro.split('.')[0]}.assinaturaFalsa`]) {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CHAVE, forjado]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await esperaPilula(page);
    const virou = (await pilulaPortal(page).getAttribute('class')).includes('is-active');
    check(`"${forjado.slice(0, 24)}" não vira PLAYER+`, !virou);
  }
  // E o bilhete de verdade continua valendo depois de tudo isso.
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CHAVE, verdadeiro]);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  check('o bilhete legítimo volta a valer', (await pilulaPortal(page).getAttribute('class')).includes('is-active'));
});

/* ══ 8. Celular ════════════════════════════════════════════════════════════════════════════════ */
titulo('8. CELULAR (390×844) — o modal cabe e dá para apertar');
await cenario({ mobile: true }, async (page, erros) => {
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]');
  const m = await page.evaluate(() => {
    const d = document.querySelector('dialog.plus-dialog').getBoundingClientRect();
    const go = document.getElementById('plus-go').getBoundingClientRect();
    const cancel = document.getElementById('plus-cancel').getBoundingClientRect();
    const campo = document.getElementById('plus-code');
    return { d: { x: d.x, y: d.y, w: d.width, h: d.height }, go: go.height, cancel: cancel.height,
      fonte: parseFloat(getComputedStyle(campo).fontSize),
      rolagem: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      larguraTela: window.innerWidth, alturaTela: window.innerHeight };
  });
  check('o modal cabe na largura', m.d.x >= 0 && m.d.x + m.d.w <= m.larguraTela + 1, `x=${m.d.x} w=${m.d.w} tela=${m.larguraTela}`);
  check('o modal cabe na altura', m.d.y >= 0 && m.d.y + m.d.h <= m.alturaTela + 1, `y=${m.d.y} h=${m.d.h} tela=${m.alturaTela}`);
  check('nenhuma rolagem lateral', m.rolagem <= 0, `sobra ${m.rolagem}px`);
  check('os dois botões têm alvo de toque de 44px', m.go >= 44 && m.cancel >= 44, `ativar ${m.go} cancelar ${m.cancel}`);
  check('o campo tem 16px (abaixo disso o iPhone dá zoom sozinho)', m.fonte >= 16, `${m.fonte}px`);

  await page.fill('#plus-code', CODIGO);
  await page.press('#plus-code', 'Enter');
  await page.waitForFunction(() => document.getElementById('player-plus-pill')?.classList.contains('is-active'), null, { timeout: 6000 });
  check('ativa no celular', true);
  check('nenhum erro de JavaScript no celular', erros.length === 0, erros.join(' | '));
});

/* ══ 9. Sem servidor, nada de PLAYER+ ══════════════════════════════════════════════════════════ */
titulo('9. SEM SERVIDOR — a ativação falha com recado, e não em silêncio');
await cenario({}, async (page) => {
  await page.route('**/api/player-plus', (route) => route.abort());
  await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
  await esperaPilula(page);
  check('sem servidor a pílula fica no convite', !(await pilulaPortal(page).getAttribute('class')).includes('is-active'));
  await pilulaPortal(page).click();
  await page.waitForSelector('dialog.plus-dialog[open]');
  await page.fill('#plus-code', CODIGO);
  await page.press('#plus-code', 'Enter');
  await page.waitForFunction(() => document.querySelector('#plus-note')?.classList.contains('is-bad'), null, { timeout: 8000 });
  check('o jogador é avisado de que não deu para falar com o servidor',
    /Could not reach the server/.test(await page.locator('#plus-note').innerText()));
  check('e nada foi guardado', await page.evaluate((k) => !localStorage.getItem(k), CHAVE));
});

await browser.close();
console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
