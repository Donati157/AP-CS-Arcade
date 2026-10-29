// A tradução não pode quebrar save: o estado guarda os DADOS em inglês de propósito
// ('Computer Science', 'Harbor Sedan', 'Mother'), e só a exibição passa pelo catálogo. Este teste
// prova a consequência disso — uma vida salva em inglês abre em português, e vice-versa, com os
// mesmos números e a mesma linha do tempo.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
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

const estado = () => page.evaluate(() => {
  const s = window.betlife.getState();
  return {
    idade: s.player.age, dinheiro: s.player.money, felicidade: s.player.happiness,
    saude: s.player.health, inteligencia: s.player.smarts, aparencia: s.player.looks,
    nome: s.player.name, carreira: s.career.careerId, cargo: s.career.rung,
    diploma: s.education.degree, oficio: s.education.trade,
    pessoas: s.relationships.length, bens: s.assets.length, diario: s.timeline.length,
  };
});

// --- 1. vive em inglês até os 40 e guarda o estado
console.log('\n1. Uma vida vivida em inglês');
await page.goto(`${BASE}?lang=en&seed=909&age=40#main`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
await page.waitForTimeout(400);
const emIngles = await estado();
checa('a vida abriu aos 40 anos', emIngles.idade === 40, `veio ${emIngles.idade}`);
checa('tem diário', emIngles.diario > 20, `${emIngles.diario} linhas`);
const bruto = await page.evaluate(() => JSON.stringify(window.betlife.getState()));

// --- 2. a mesma vida, recarregada em português
console.log('\n2. A mesma vida, recarregada em português');
await page.goto(`${BASE}?lang=pt&seed=909&age=40#main`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
await page.waitForTimeout(400);
const emPortugues = await estado();
for (const campo of Object.keys(emIngles)) {
  checa(`${campo} igual nos dois idiomas`, emIngles[campo] === emPortugues[campo],
    `en=${JSON.stringify(emIngles[campo])} pt=${JSON.stringify(emPortugues[campo])}`);
}

// --- 3. os dados guardados continuam em inglês (é isso que mantém o save compatível)
console.log('\n3. O estado guardado continua em inglês');
const dados = JSON.parse(bruto);
const idsIngleses = [dados.career.careerId, dados.education.degree, dados.education.trade]
  .filter(Boolean).every((v) => /^[\x20-\x7E]+$/.test(v));
checa('os identificadores no estado são ASCII, não traduzidos', idsIngleses,
  JSON.stringify([dados.career.careerId, dados.education.degree, dados.education.trade]));
const papeis = [...new Set(dados.relationships.map((r) => r.role))];
checa('os papéis familiares no estado seguem em inglês',
  papeis.every((r) => /^[a-zA-Z]+$/.test(r)), JSON.stringify(papeis));

// --- 4. envelhecer em português e depois em inglês dá o mesmo resultado
console.log('\n4. Envelhecer dá o mesmo resultado nos dois idiomas');
const avanca = async (lang) => {
  await page.goto(`${BASE}?lang=${lang}&seed=4242&age=25#main`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 15000 });
  await page.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.betlife.handle({ action: 'age' }));
    await page.waitForTimeout(90);
  }
  return estado();
};
const avEn = await avanca('en');
const avPt = await avanca('pt');
for (const campo of ['idade', 'dinheiro', 'felicidade', 'saude', 'inteligencia', 'aparencia', 'diario']) {
  checa(`depois de 5 anos: ${campo} igual`, avEn[campo] === avPt[campo],
    `en=${avEn[campo]} pt=${avPt[campo]}`);
}

checa('nenhum erro de JavaScript', erros.length === 0, erros.join(' / '));
await navegador.close();
console.log(`\n${ok} de ${ok + falhas} verificações passaram.`);
process.exitCode = falhas ? 1 : 0;
