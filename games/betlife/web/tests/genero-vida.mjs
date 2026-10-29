// Joga vidas inteiras em português, uma com personagem masculino e outra com feminino, e lê CADA
// linha do diário procurando concordância errada.
//
// O teste é literal: procura a palavra no gênero oposto ao do personagem. "Você foi promovido"
// numa vida feminina é defeito; "Freya foi promovida" numa vida masculina também é, porque quem
// concorda ali é a Freya, não o jogador — e por isso o teste separa as frases que começam com
// "Você" das que começam com um nome.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
let ok = 0, falhas = 0;
const checa = (nome, cond, detalhe = '') => {
  if (cond) { ok++; console.log(`  ok   ${nome}`); }
  else { falhas++; console.log(`  FALHA ${nome}${detalhe ? '\n         ' + detalhe : ''}`); }
};

// Palavras que concordam com o sujeito. Par masculino/feminino.
const PARES = [
  ['promovido', 'promovida'], ['contratado', 'contratada'], ['matriculado', 'matriculada'],
  ['sozinho', 'sozinha'], ['calado', 'calada'], ['convidado', 'convidada'], ['reprovado', 'reprovada'],
  ['queimado', 'queimada'], ['cansado', 'cansada'], ['sentado', 'sentada'], ['acordado', 'acordada'],
  ['lisonjeado', 'lisonjeada'], ['agradecido', 'agradecida'], ['aposentado', 'aposentada'],
  ['rico', 'rica'], ['generoso', 'generosa'], ['pego', 'pega'], ['orgulhoso', 'orgulhosa'],
];
// "Você ficou amigo/amiga" — amigo também concorda, mas "um amigo", "os amigos" e "amigo de
// infância" são genéricos, então só conta quando vem logo depois de "ficou"/"virou".
const AMIGO = [/\b(ficou|virou) amigo\b/, /\b(ficou|virou) amiga\b/];

const navegador = await webkit.launch();

async function viver(seed, ateIdade) {
  const ctx = await navegador.newContext();
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  await page.goto(`${BASE}?lang=pt&seed=${seed}&age=${ateIdade}#main`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.betlife, null, { timeout: 25000 });
  await page.waitForTimeout(400);
  const genero = await page.evaluate(() => window.betlife.getState().player.gender);
  // Segue envelhecendo até morrer, despachando os cartões.
  let morto = false;
  // 160 passos: uma vida longa com cartões pendentes gasta mais de um clique por ano, e o teto
  // antigo (90) parava a vida viva aos 70 — falha do teste, não do jogo.
  for (let i = 0; i < 160 && !morto; i++) {
    const agiu = await page.evaluate(() => {
      const o = document.querySelector('.bl-overlay [data-choice]');
      if (o) { o.click(); return true; }
      const e = document.querySelector('[data-action="age"]');
      if (e) { e.click(); return true; }
      return false;
    });
    if (!agiu) break;
    await page.waitForTimeout(140);
    morto = await page.evaluate(() => !window.betlife.getState().player.alive);
  }
  const diario = await page.evaluate(() => window.betlife.getState().timeline.map((e) => e.text));
  const dinheiro = await page.evaluate(() => window.betlife.getState().player.money);
  const idade = await page.evaluate(() => window.betlife.getState().player.age);
  await ctx.close();
  return { genero, diario, erros, morto, dinheiro, idade };
}

for (const [seed, rotulo] of [[77, 'A'], [5, 'B'], [909, 'C'], [42, 'D']]) {
  const v = await viver(seed, 30);
  const esperado = v.genero === 'female' ? 1 : 0;      // índice no par
  const errado = 1 - esperado;
  console.log(`\nVIDA ${rotulo} — semente ${seed}, personagem ${v.genero}, morreu aos ${v.idade}`);

  const quebras = [];
  for (const linha of v.diario) {
    const souEu = /^(Você|O você)\b/.test(linha);
    if (!souEu) continue;                               // frase sobre outra pessoa: outro sujeito
    for (const par of PARES) {
      const re = new RegExp(`\\b${par[errado]}\\b`);
      if (re.test(linha)) quebras.push(`${par[errado]} (devia ser ${par[esperado]}): ${linha.slice(0, 78)}`);
    }
    if (AMIGO[errado].test(linha)) quebras.push(`amigo/amiga trocado: ${linha.slice(0, 78)}`);
  }
  checa(`concordância com o personagem em ${v.diario.length} linhas do diário`, quebras.length === 0,
    quebras.slice(0, 3).join('\n         '));
  checa('a vida chegou ao fim', v.morto, `parou viva aos ${v.idade}`);
  checa('nenhum erro de JavaScript', v.erros.length === 0, v.erros.slice(0, 2).join(' | '));

  // Dinheiro: toda cifra escrita no diário tem de estar no formato brasileiro.
  const cifrasErradas = v.diario.filter((l) => /\$\s?\d/.test(l) && !/US\$ \d{1,3}(\.\d{3})*,\d{2}/.test(l));
  checa('todo valor em dinheiro está no formato brasileiro', cifrasErradas.length === 0,
    cifrasErradas.slice(0, 3).map((l) => l.slice(0, 78)).join('\n         '));
}

await navegador.close();
console.log(`\n${ok} de ${ok + falhas} verificações passaram.`);
process.exitCode = falhas ? 1 : 0;
