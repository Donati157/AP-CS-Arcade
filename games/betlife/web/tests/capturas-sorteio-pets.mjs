// Capturas de entrega: os quadros das DUAS apresentações do sorteio (moeda com duas opções,
// sorteio com três), no computador e no celular, e o cartão de adoção nos dois idiomas.
import { webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
const RAIZ = fileURLToPath(new URL('../../../../docs/betlife-capturas/moeda/', import.meta.url));
const PETS = fileURLToPath(new URL('../../../../docs/betlife-capturas/pets/', import.meta.url));
mkdirSync(RAIZ, { recursive: true });
mkdirSync(PETS, { recursive: true });

const b = await webkit.launch();

const DECISAO = (rotulos) => `(async () => {
  const { pushModal } = await import('./game/journal.js');
  const st = window.betlife.getState();
  st.player.money = 9000;
  pushModal(st, { kind: 'decision', eventId: 'cap', band: 'Life', title: 'Favorite Toy',
    text: 'You are playing with some friends when a smaller kid grabs the toy xylophone right out of your hands.',
    choices: ${JSON.stringify(rotulos)}.map((label, index) => ({ label, index })) });
  window.betlife.go('main');
})()`;

const esperaEstagio = (page, nomes, limite = 5000) => page.evaluate(`(async () => {
  const fim = Date.now() + ${limite};
  while (Date.now() < fim) {
    const s = document.querySelector('.bl-coin-stage');
    if (s && ${JSON.stringify(nomes)}.includes(s.dataset.stage)) return s.dataset.stage;
    await new Promise((r) => requestAnimationFrame(r));
  }
  return null;
})()`);

// Uma sequência de quadros de um sorteio. Devolve os nomes dos arquivos, na ordem.
async function quadros(page, prefixo, rotulos, dir) {
  const feitos = [];
  const tira = async (nome) => { await page.screenshot({ path: join(dir, nome) }); feitos.push(nome); console.log('  ', nome); };
  await page.evaluate(DECISAO(rotulos));
  await page.waitForTimeout(300);
  await tira(`${prefixo}-00-cartao.png`);
  await page.evaluate(`document.querySelector('.bl-coin').click()`);
  await page.waitForTimeout(170);
  await tira(`${prefixo}-01-a-mao-entra.png`);
  await page.waitForTimeout(260);
  await tira(`${prefixo}-02-a-mao-viaja.png`);
  await esperaEstagio(page, ['aim']);
  await page.waitForTimeout(60);
  await tira(`${prefixo}-03-o-dedo-mira.png`);
  await esperaEstagio(page, ['press']);
  await page.waitForTimeout(120);
  await tira(`${prefixo}-04-o-dedo-aperta.png`);
  await esperaEstagio(page, ['spin']);
  await page.waitForTimeout(260);
  await tira(`${prefixo}-05-o-acaso-trabalha.png`);
  await page.waitForTimeout(430);
  await tira(`${prefixo}-06-quase-parando.png`);
  await esperaEstagio(page, ['reveal', 'done']);
  await page.waitForTimeout(220);
  await tira(`${prefixo}-07-o-resultado.png`);
  await page.waitForTimeout(900);
  await tira(`${prefixo}-08-de-volta-a-vida.png`);
  return feitos;
}

async function abre(ctx, lang) {
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('ERRO', String(e)));
  await page.goto(`${BASE}?seed=31&age=24${lang ? `&lang=${lang}` : ''}#main`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  return page;
}

const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
const page = await abre(ctx, 'pt');

console.log('\nMoeda (duas opções):');
const moeda = await quadros(page, 'moeda', ['Chorar', 'Pegar de volta'], RAIZ);
console.log('\nSorteio (três opções):');
const sort = await quadros(page, 'sorteio', ['Chorar', 'Deixar brincar', 'Contar para um adulto'], RAIZ);

// ---- celular: o quadro do clique nas duas apresentações ---------------------------------------
console.log('\nCelular (390x844), o quadro do clique:');
const ctxCel = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const cel = await abre(ctxCel, 'pt');
for (const [nome, rotulos] of [['moeda', ['Chorar', 'Pegar de volta']], ['sorteio', ['Chorar', 'Deixar brincar', 'Contar para um adulto']]]) {
  await cel.evaluate(DECISAO(rotulos));
  await cel.waitForTimeout(280);
  await cel.evaluate(`document.querySelector('.bl-coin').click()`);
  await esperaEstagio(cel, ['press']);
  await cel.waitForTimeout(120);
  await cel.screenshot({ path: join(RAIZ, `celular-${nome}-no-clique.png`) });
  console.log('  ', `celular-${nome}-no-clique.png`);
  await esperaEstagio(cel, ['reveal', 'done']);
  await cel.waitForTimeout(200);
  await cel.screenshot({ path: join(RAIZ, `celular-${nome}-resultado.png`) });
  console.log('  ', `celular-${nome}-resultado.png`);
  await cel.waitForTimeout(1200);
}
await ctxCel.close();

// ---- o cartão de adoção, nos dois idiomas -----------------------------------------------------
console.log('\nCartão de adoção:');
for (const lang of ['pt', 'en']) {
  const p2 = await abre(ctx, lang);
  await p2.evaluate(`(() => { window.betlife.getState().player.money = 9000; window.betlife.go('pets'); })()`);
  await p2.waitForTimeout(220);
  await p2.evaluate(`(() => { [...document.querySelectorAll('.bl-row')].filter((x) => x.dataset.target === 'petSource')[0].click(); })()`);
  await p2.waitForTimeout(260);
  await p2.evaluate(`(() => { [...document.querySelectorAll('.bl-row[data-action="adoptConfirm"]')][0].click(); })()`);
  await p2.waitForTimeout(460);
  await p2.screenshot({ path: join(PETS, `cartao-${lang}.png`) });
  console.log('  ', `cartao-${lang}.png`);
  await p2.close();
}

// ---- folhas de contato -------------------------------------------------------------------------
async function folha(lista, titulo, arquivo) {
  const html = `<!doctype html><meta charset="utf-8"><style>
    body { margin: 0; background: #11151c; font-family: -apple-system, sans-serif; padding: 18px; }
    h1 { color: #fff; font-size: 20px; margin: 0 0 14px; }
    .g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    figure { margin: 0; } img { width: 100%; display: block; border-radius: 8px; }
    figcaption { color: #cdd6e3; font-size: 13px; padding: 6px 2px 0; }
  </style><h1>${titulo}</h1><div class="g">
  ${lista.map((q) => `<figure><img src="file://${join(RAIZ, q)}"><figcaption>${q.replace(/^[a-z]+-\d+-/, '').replace(/-/g, ' ').replace('.png', '')}</figcaption></figure>`).join('\n')}
  </div>`;
  const caminho = join(RAIZ, arquivo.replace('.png', '.html'));
  writeFileSync(caminho, html);
  const f = await ctx.newPage();
  await f.setViewportSize({ width: 1180, height: 1200 });
  await f.goto(`file://${caminho}`, { waitUntil: 'load' });
  await f.waitForTimeout(600);
  await f.screenshot({ path: join(RAIZ, arquivo), fullPage: true });
  await f.close();
  console.log('  ', arquivo);
}
console.log('\nFolhas de contato:');
await folha(moeda, 'BetLife · Moeda (duas opções), quadro a quadro', 'storyboard-moeda.png');
await folha(sort, 'BetLife · Sorteio (três opções), quadro a quadro', 'storyboard-sorteio.png');
await b.close();
