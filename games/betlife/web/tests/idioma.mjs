// Requisito 5: o idioma escolhido vale na hora, e sobrevive a recarga, a vida nova e a sair e
// voltar ao BetLife pelo Arcade.
//
// Não dá para provar isso com teste de unidade: a persistência mora no localStorage e o "aplica na
// hora" é um render. Então é WebKit de verdade, pelo caminho que o jogador faz — menu, Idioma,
// escolher no seletor, confirmar.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
const ARCADE = BASE.replace(/games\/betlife\/?$/, '');
const VIDA = `${BASE}?seed=11&age=20#main`;
let ok = 0, falhas = 0;
const checa = (nome, cond, detalhe = '') => {
  if (cond) { ok++; console.log(`  ok   ${nome}`); }
  else { falhas++; console.log(`  FALHA ${nome}${detalhe ? ' — ' + detalhe : ''}`); }
};

const navegador = await webkit.launch();
const ctx = await navegador.newContext();
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));

const tela = () => page.evaluate(() => document.getElementById('game').innerText);
const clica = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
const PT = /Envelhecer|Atributos|Relacionamentos|Profissão|Atividades|Conquistas|Opções|Nova vida/;
const EN = /\bAge\b|\bStats\b|Relationships|Occupation|Activities|Life Badges|Options|New Life/;

async function abreMenu() {
  await clica('[data-action="go"][data-target="menu"]');
  await page.waitForTimeout(250);
}

// --- 1. aplica na hora, sem recarregar
console.log('\n1. O seletor aplica o idioma na hora');
await page.goto(VIDA, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
const antes = await tela();
checa('a vida abre em inglês, o idioma original', EN.test(antes) && !PT.test(antes));
await abreMenu();
checa('o menu tem a entrada de idioma', await clica('[data-action="language"]'));
await page.waitForTimeout(350);
const temSeletor = await page.evaluate(() => !!document.querySelector('.bl-overlay select'));
checa('o cartão de idioma tem o seletor', temSeletor);
const opcoes = await page.evaluate(() => [...document.querySelectorAll('.bl-overlay select option')].map((o) => o.value));
checa('o seletor oferece en e pt', JSON.stringify(opcoes) === '["en","pt"]', JSON.stringify(opcoes));
await page.evaluate(() => { const s = document.querySelector('.bl-overlay select'); s.value = 'pt'; s.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(200);
await clica('.bl-overlay [data-choice="language"]');
await page.waitForTimeout(500);
const depois = await tela();
checa('a tela virou português sem recarregar', PT.test(depois) && !EN.test(depois),
  depois.slice(0, 110).replace(/\n/g, ' | '));

// --- 2. sobrevive à recarga
console.log('\n2. Sobrevive a recarregar a página');
await page.goto(VIDA, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
const recarregado = await tela();
checa('depois de recarregar continua em português', PT.test(recarregado) && !EN.test(recarregado),
  recarregado.slice(0, 110).replace(/\n/g, ' | '));

// --- 3. sobrevive à vida nova
console.log('\n3. Sobrevive a começar uma vida nova');
await abreMenu();
await clica('[data-action="newLife"]');
await page.waitForTimeout(700);
const vidaNova = await tela();
checa('a vida nova abre em português', PT.test(vidaNova) && !EN.test(vidaNova),
  vidaNova.slice(0, 110).replace(/\n/g, ' | '));

// --- 4. sobrevive a sair pelo Arcade e voltar
console.log('\n4. Sobrevive a sair ao Arcade e voltar ao BetLife');
await page.goto(ARCADE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(400);
await page.goto(VIDA, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
const voltou = await tela();
checa('ao reentrar continua em português', PT.test(voltou) && !EN.test(voltou),
  voltou.slice(0, 110).replace(/\n/g, ' | '));
const gravado = await page.evaluate(() => { try { return localStorage.getItem('betlife.web.language'); } catch (_) { return 'erro'; } });
checa("o idioma gravado é 'pt'", gravado === 'pt', `veio ${JSON.stringify(gravado)}`);

// --- 5. voltar para inglês funciona igual
console.log('\n5. E dá para voltar ao inglês do mesmo jeito');
await abreMenu();
await clica('[data-action="language"]');
await page.waitForTimeout(350);
await page.evaluate(() => { const s = document.querySelector('.bl-overlay select'); s.value = 'en'; s.dispatchEvent(new Event('change', { bubbles: true })); });
await page.waitForTimeout(150);
await clica('.bl-overlay [data-choice="language"]');
await page.waitForTimeout(500);
const voltouIngles = await tela();
checa('a tela voltou ao inglês', EN.test(voltouIngles) && !PT.test(voltouIngles),
  voltouIngles.slice(0, 110).replace(/\n/g, ' | '));

// --- 6. só idiomas completos são oferecidos
console.log('\n6. Só idiomas completos são oferecidos');
const idiomas = await page.evaluate(async () => {
  const m = await import('./game/i18n/index.js');
  return { prontos: m.LANGUAGES_READY.map((l) => l.id), todos: m.LANGUAGES.map((l) => l.id) };
});
checa('prontos são exatamente en e pt', JSON.stringify(idiomas.prontos) === '["en","pt"]', JSON.stringify(idiomas.prontos));
checa('es e fr estão previstos mas não oferecidos',
  idiomas.todos.includes('es') && idiomas.todos.includes('fr') &&
  !idiomas.prontos.includes('es') && !idiomas.prontos.includes('fr'));

checa('nenhum erro de JavaScript em todo o percurso', erros.length === 0, erros.join(' / '));
await navegador.close();
console.log(`\n${ok} de ${ok + falhas} verificações passaram.`);
process.exitCode = falhas ? 1 : 0;
