// O sorteio, nas duas apresentações, no WebKit de verdade.
//
// Duas opções → moeda (cara e coroa). Três ou mais → sorteio, com as opções na tela e o marcador
// parando na que saiu. O que não dá para verificar lendo código é tudo o que importa aqui: se a
// PONTA DO DEDO chega dentro da opção sorteada, se a mão NÃO COBRE o rótulo dessa opção, se o dedo
// abaixa, se cliques repetidos viram um sorteio só, se as duas faces acontecem e se, com três
// opções, não ganha sempre a mesma. Geometria e tempo medidos no navegador.
//
// Idioma do teste: `BETLIFE_LANG=pt` roda a mesma suíte em português.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
const LANG = process.env.BETLIFE_LANG ? `&lang=${process.env.BETLIFE_LANG}` : '';
const VIDA = `${BASE}?seed=31&age=24${LANG}#main`;
const SORTEIOS = Number(process.env.BETLIFE_FLIPS || 20);
const SORTEIOS_MULTI = Number(process.env.BETLIFE_DRAWS || 12);

let ok = 0, falhas = 0;
const checa = (nome, cond, detalhe = '') => {
  if (cond) { ok++; console.log(`  ok   ${nome}`); }
  else { falhas++; console.log(`  FALHA ${nome}${detalhe ? ' — ' + detalhe : ''}`); }
};

const navegador = await webkit.launch();

// Uma decisão nova em cima da vida atual, pelo mesmo caminho que o jogo usa (`pushModal`), para o
// cartão vir traduzido como qualquer outro.
const DECISAO = `async (rotulos) => {
  const { pushModal } = await import('./game/journal.js');
  const st = window.betlife.getState();
  pushModal(st, { kind: 'decision', eventId: 'coinTest', band: 'Life', title: 'Favorite Toy',
    text: 'You are playing with some friends when a smaller kid grabs the toy xylophone right out of your hands.',
    choices: rotulos.map((label, index) => ({ label, index })) });
  window.betlife.go('main');
}`;

// Um sorteio inteiro, amostrado por estágio. Devolve a geometria do momento do clique.
const SORTEIO = `async () => {
  const esperaEstagio = async (nomes, limite = 4000) => {
    const fim = Date.now() + limite;
    while (Date.now() < fim) {
      const s = document.querySelector('.bl-coin-stage');
      if (s && nomes.includes(s.dataset.stage)) return s.dataset.stage;
      if (!s && nomes.includes('ido')) return 'ido';
      await new Promise((r) => requestAnimationFrame(r));
    }
    return null;
  };
  const caixa = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const link = document.querySelector('.bl-coin');
  if (!link) return { erro: 'sem link de sorteio' };
  link.click();
  // Cliques repetidos durante a animação: o jogo não pode sortear duas vezes.
  link.click(); link.click();
  const chegou = await esperaEstagio(['aim', 'press', 'release']);
  const palco = document.querySelector('.bl-coin-stage');
  if (!palco) return { erro: 'palco sumiu antes do clique da mão' };
  const modo = palco.dataset.mode;
  const face = palco.dataset.face;
  const vencedor = modo === 'coin'
    ? palco.querySelector('.bl-coin-plate[data-face="' + face + '"]')
    : null;
  const dedo = palco.querySelector('.bl-hand-finger');
  const ponta = palco.querySelector('.bl-hand-tip');
  // A MÃO QUE COBRE é a arte, não a caixa do SVG: o grupo tem margem transparente dos dois lados, e
  // medir a caixa acusaria sobreposição onde não há tinta nenhuma.
  const arte = palco.querySelector('.bl-hand-art');

  let apertada = false, naMira = null, pico = null, rt = null, alvoCaixa = null, rotuloCaixa = null, maoCaixa = null, dimNoAperto = 0,
    maoNaMira = null, todosOsRotulos = [];
  const atePassar = Date.now() + 900;
  while (Date.now() < atePassar && ['aim', 'press', 'release'].includes(palco.dataset.stage)) {
    const topo = dedo ? dedo.getBoundingClientRect().top : null;
    if (palco.dataset.stage === 'aim') {
      naMira = topo;
      // Na MIRA nenhuma opção saiu de cena ainda: é o pior quadro possível para a mão cobrir texto,
      // e por isso é aqui que se mede TODOS os rótulos, não só o da opção que vai ganhar.
      maoNaMira = caixa(arte);
      todosOsRotulos = [...palco.querySelectorAll('.bl-coin-plate-label, .bl-raffle-label')].map(caixa);
    }
    else {
      pico = pico === null ? topo : Math.max(pico, topo);
      if (palco.querySelector('.bl-coin-plate.is-pressed, .bl-raffle-item.is-pressed')) apertada = true;
      // A ponta do dedo é medida no ÚLTIMO quadro desta janela, que é a mão já parada na opção.
      const premido = palco.querySelector('.bl-coin-plate.is-pressed, .bl-coin-plate.is-winner, .bl-raffle-item.is-pressed, .bl-raffle-item.is-winner');
      if (ponta) { const r2 = ponta.getBoundingClientRect(); rt = { x: r2.x + r2.width / 2, y: r2.y + r2.height / 2 }; }
      if (premido) { alvoCaixa = caixa(premido); rotuloCaixa = caixa(premido.querySelector('.bl-coin-plate-label, .bl-raffle-label')); }
      maoCaixa = caixa(arte);
      dimNoAperto = palco.querySelectorAll('.bl-raffle-item.is-dim').length;
    }
    await new Promise((r) => requestAnimationFrame(r));
  }
  const antesDoDedo = naMira, noAperto = pico;

  await esperaEstagio(['reveal', 'done']);
  const resultado = (palco.querySelector('.bl-coin-result') || {}).textContent || '';
  const vencedoraFace = (palco.querySelector('.bl-coin-plate.is-winner') || {}).dataset?.face ?? null;
  const vencedorIndice = (palco.querySelector('.bl-raffle-item.is-winner') || {}).dataset?.i ?? null;
  const aindaCorrendo = palco.querySelectorAll('.bl-raffle-item.is-running').length;
  // Na revelação a mão já saiu de cena: é isso que garante que ela não cobre a frase do resultado.
  const maoNaRevelacao = caixa(arte);
  const caixaResultado = caixa(palco.querySelector('.bl-coin-result'));
  await esperaEstagio(['ido'], 3000);
  await new Promise((r) => setTimeout(r, 120));
  return {
    chegou, modo, face, resultado, vencedoraFace, vencedorIndice, apertada, aindaCorrendo, dimNoAperto,
    temMoeda: !!palco.querySelector('.bl-coin-piece'), itens: palco.querySelectorAll('.bl-raffle-item').length,
    palcos: document.querySelectorAll('.bl-coin-stage').length,
    cartaoAberto: !!document.querySelector('#modal-root .bl-modal'),
    tela: document.getElementById('game').dataset.screen,
    pendentes: window.betlife.getState().pending.length,
    ponta: rt, alvo: alvoCaixa, rotulo: rotuloCaixa, mao: maoCaixa, maoNaRevelacao, caixaResultado,
    maoNaMira, todosOsRotulos,
    dedo: antesDoDedo !== null && noAperto !== null ? Math.round((noAperto - antesDoDedo) * 10) / 10 : null,
  };
}`;

const cruza = (a, b) => !!a && !!b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const dentro = (p, c) => !!p && !!c && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h;

async function rodada(page, rotulos) {
  await page.evaluate(`(${DECISAO})(${JSON.stringify(rotulos)})`);
  await page.waitForTimeout(260);
  return page.evaluate(`(${SORTEIO})()`);
}

async function abreVida(ctx) {
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.goto(VIDA, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  return { page, erros };
}

// ---- 1. a moeda: duas opções ---------------------------------------------------------------
console.log(`\n1. ${SORTEIOS} sorteios de moeda (duas opções)${LANG ? ' (pt)' : ''}`);
const ctx = await navegador.newContext({ viewport: { width: 420, height: 880 } });
const { page, erros } = await abreVida(ctx);

const DUAS = ['Cry', 'Take it back'];
const caras = { heads: 0, tails: 0 };
const escolhas = new Map();
let foraDaPlaca = 0, semDedo = 0, semAperto = 0, duplicados = 0, naoVoltou = 0, semResultado = 0,
  moedaErrada = 0, placaErrada = 0, cobriuRotulo = 0, cobriuResultado = 0, semMoeda = 0, cobriuNaMira = 0;
for (let i = 0; i < SORTEIOS; i++) {
  const r = await rodada(page, DUAS);
  if (r.erro) { falhas++; console.log(`  FALHA sorteio ${i + 1}: ${r.erro}`); continue; }
  caras[r.face] = (caras[r.face] || 0) + 1;
  escolhas.set(r.resultado, (escolhas.get(r.resultado) || 0) + 1);
  if (!dentro(r.ponta, r.alvo)) { foraDaPlaca++; if (foraDaPlaca === 1) console.log(`       ponta ${JSON.stringify(r.ponta)} placa ${JSON.stringify(r.alvo)}`); }
  if (!(r.dedo > 1)) semDedo++;
  if (!r.apertada) semAperto++;
  if (r.palcos > 1) duplicados++;
  if (r.pendentes !== 0 || r.cartaoAberto) naoVoltou++;
  if (!r.resultado) semResultado++;
  if (r.modo !== 'coin' || !r.temMoeda) semMoeda++;
  if (r.vencedoraFace !== r.face) { placaErrada++; if (placaErrada === 1) console.log(`       face ${r.face}, placa ${r.vencedoraFace}`); }
  if (cruza(r.mao, r.rotulo)) { cobriuRotulo++; if (cobriuRotulo === 1) console.log(`       mão ${JSON.stringify(r.mao)} rótulo ${JSON.stringify(r.rotulo)}`); }
  if ((r.todosOsRotulos || []).some((c) => cruza(r.maoNaMira, c))) cobriuNaMira++;
  if (cruza(r.maoNaRevelacao, r.caixaResultado)) cobriuResultado++;
}
checa('os sorteios rodaram sem erro de página', erros.length === 0, erros.slice(0, 2).join(' | '));
checa('duas opções mostram a moeda', semMoeda === 0, `${semMoeda} sem moeda`);
checa('cara e coroa acontecem', caras.heads > 0 && caras.tails > 0, JSON.stringify(caras));
checa('não escolhe sempre a mesma opção', escolhas.size > 1, JSON.stringify([...escolhas]));
checa('a ponta do dedo cai dentro da placa vencedora em todos', foraDaPlaca === 0, `${foraDaPlaca} fora`);
checa('a mão nunca cobre o rótulo da opção apertada', cobriuRotulo === 0, `${cobriuRotulo} cobriram`);
checa('nem cobre rótulo nenhum no quadro da mira', cobriuNaMira === 0, `${cobriuNaMira} cobriram na mira`);
checa('a mão já saiu quando o resultado aparece', cobriuResultado === 0, `${cobriuResultado} cobriram o texto`);
checa('o dedo desce no clique em todos', semDedo === 0, `${semDedo} sem movimento de dedo`);
checa('a placa reage ao clique em todos', semAperto === 0, `${semAperto} sem reação`);
checa('cliques repetidos não abrem um segundo sorteio', duplicados === 0, `${duplicados} com dois palcos`);
checa('cada sorteio responde o cartão uma vez e volta para a vida', naoVoltou === 0, `${naoVoltou} não voltaram`);
checa('todo sorteio revela o resultado por escrito', semResultado === 0, `${semResultado} sem texto`);
checa('a moeda cai mostrando a face que saiu', moedaErrada === 0, `${moedaErrada} erradas`);
checa('a placa marcada é a da face que saiu', placaErrada === 0, `${placaErrada} erradas`);

// ---- 2. o sorteio: três opções ---------------------------------------------------------------
console.log(`\n2. ${SORTEIOS_MULTI} sorteios com três opções`);
const TRES = ['Cry', 'Take it back', 'Tell a grown-up'];
const ganhadores = new Map();
let comMoeda = 0, foraDoItem = 0, cobriu3 = 0, cobriu3Mira = 0, marcadorSolto = 0, semDim = 0, semResultado3 = 0, naoVoltou3 = 0;
for (let i = 0; i < SORTEIOS_MULTI; i++) {
  const r = await rodada(page, TRES);
  if (r.erro) { falhas++; console.log(`  FALHA sorteio múltiplo ${i + 1}: ${r.erro}`); continue; }
  ganhadores.set(r.vencedorIndice, (ganhadores.get(r.vencedorIndice) || 0) + 1);
  if (r.modo !== 'raffle' || r.temMoeda) comMoeda++;
  if (!dentro(r.ponta, r.alvo)) { foraDoItem++; if (foraDoItem === 1) console.log(`       ponta ${JSON.stringify(r.ponta)} item ${JSON.stringify(r.alvo)}`); }
  if (cruza(r.mao, r.rotulo)) { cobriu3++; if (cobriu3 === 1) console.log(`       mão ${JSON.stringify(r.mao)} rótulo ${JSON.stringify(r.rotulo)}`); }
  if ((r.todosOsRotulos || []).some((c) => cruza(r.maoNaMira, c))) { cobriu3Mira++; if (cobriu3Mira === 1) console.log(`       na mira: mão ${JSON.stringify(r.maoNaMira)} rótulos ${JSON.stringify(r.todosOsRotulos)}`); }
  if (r.aindaCorrendo !== 0) marcadorSolto++;
  if (r.dimNoAperto !== TRES.length - 1) semDim++;
  if (!r.resultado) semResultado3++;
  if (r.pendentes !== 0 || r.cartaoAberto) naoVoltou3++;
}
checa('três opções NÃO mostram moeda nenhuma', comMoeda === 0, `${comMoeda} com moeda`);
checa('as três opções podem ganhar', ganhadores.size >= 2, JSON.stringify([...ganhadores]));
checa('a ponta do dedo cai dentro da opção sorteada', foraDoItem === 0, `${foraDoItem} fora`);
checa('a mão nunca cobre o rótulo da opção sorteada', cobriu3 === 0, `${cobriu3} cobriram`);
checa('e não cobre rótulo nenhum no quadro da mira, com as três à mostra', cobriu3Mira === 0, `${cobriu3Mira} cobriram na mira`);
checa('o marcador para na opção que saiu', marcadorSolto === 0, `${marcadorSolto} ficaram correndo`);
checa('as outras opções saem de cena no toque', semDim === 0, `${semDim} sem apagar as outras`);
checa('todo sorteio múltiplo revela o resultado', semResultado3 === 0, `${semResultado3} sem texto`);
checa('e responde o cartão uma vez, voltando para a vida', naoVoltou3 === 0, `${naoVoltou3} não voltaram`);

console.log('\n3. Decisão com quatro opções');
const quatro = await rodada(page, ['Cry', 'Let them play with it', 'Take it back', 'Tell a grown-up']);
checa('com quatro opções o sorteio conclui', !quatro.erro && !!quatro.resultado && quatro.itens === 4, JSON.stringify(quatro.erro || [quatro.itens, quatro.resultado]));
checa('a mão acerta a opção e não cobre o rótulo', dentro(quatro.ponta, quatro.alvo) && !cruza(quatro.mao, quatro.rotulo),
  JSON.stringify([quatro.ponta, quatro.alvo, quatro.rotulo, quatro.mao]));
await ctx.close();

// ---- 4. celular -------------------------------------------------------------------------------
console.log('\n4. No celular (390x844), nas duas apresentações');
const ctxCel = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const { page: cel, erros: errosCel } = await abreVida(ctxCel);
for (const [nome, rotulos] of [['moeda', DUAS], ['sorteio', TRES]]) {
  const r = await rodada(cel, rotulos);
  checa(`${nome}: roda no celular`, !r.erro && !!r.resultado, JSON.stringify(r.erro || ''));
  checa(`${nome}: a mão chega na opção sorteada`, dentro(r.ponta, r.alvo), JSON.stringify([r.ponta, r.alvo]));
  checa(`${nome}: a mão não cobre o rótulo`, !cruza(r.mao, r.rotulo), JSON.stringify([r.mao, r.rotulo]));
  checa(`${nome}: a mão não cobre o resultado`, !cruza(r.maoNaRevelacao, r.caixaResultado), JSON.stringify([r.maoNaRevelacao, r.caixaResultado]));
}
checa('sem erro de página no celular', errosCel.length === 0, errosCel.slice(0, 2).join(' | '));
await ctxCel.close();

// ---- 5. movimento reduzido ----------------------------------------------------------------------
console.log('\n5. Com preferência por menos movimento, nas duas apresentações');
const ctxCalmo = await navegador.newContext({ viewport: { width: 420, height: 880 }, reducedMotion: 'reduce' });
const { page: calmo, erros: errosCalmo } = await abreVida(ctxCalmo);
for (const [nome, rotulos] of [['moeda', DUAS], ['sorteio', TRES]]) {
  await calmo.evaluate(`(${DECISAO})(${JSON.stringify(rotulos)})`);
  await calmo.waitForTimeout(260);
  const t0 = Date.now();
  const curto = await calmo.evaluate(`(async () => {
    document.querySelector('.bl-coin').click();
    await new Promise((r) => setTimeout(r, 160));
    const palco = document.querySelector('.bl-coin-stage');
    const out = { temMao: !!document.querySelector('.bl-hand'), modo: palco && palco.dataset.mode,
      resultado: (palco && palco.querySelector('.bl-coin-result').textContent) || '',
      vencedora: !!(palco && palco.querySelector('.bl-coin-plate.is-winner, .bl-raffle-item.is-winner')) };
    const fim = Date.now() + 4000;
    while (Date.now() < fim && document.querySelector('.bl-coin-stage')) await new Promise((r) => setTimeout(r, 50));
    out.pendentes = window.betlife.getState().pending.length;
    return out;
  })()`);
  const duracao = Date.now() - t0;
  checa(`${nome}: sem a animação longa, a mão não entra em cena`, curto.temMao === false);
  checa(`${nome}: o resultado aparece mesmo assim`, !!curto.resultado && curto.vencedora, JSON.stringify(curto));
  checa(`${nome}: sai rápido, sem prender a interface`, duracao < 2200, `${duracao} ms`);
  checa(`${nome}: a decisão é respondida do mesmo jeito`, curto.pendentes === 0, String(curto.pendentes));
}
checa('sem erro de página com movimento reduzido', errosCalmo.length === 0, errosCalmo.slice(0, 2).join(' | '));
await ctxCalmo.close();

await navegador.close();
console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
