// Procura o texto ESTÁTICO da interface que ainda não tem tradução.
//
// É o par de `i18n-chaves.mjs`. Aquele cobre o que o código manda para `t()` de propósito; este
// cobre o que chega à tela sem `t()` explícito, pela fronteira de `render.js` e `journal.js`: o
// literal passado como título de linha, `sub:`, `note:`, `text:`, rótulo de escolha. É esse o
// caminho de 90% da narrativa, e um literal novo aqui aparece em inglês sem avisar ninguém.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as I18N from '../game/i18n/catalogo-pt.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const catalogo = new Set(Object.keys(I18N.CATALOGO_PT));

const PROPS_TEXTO = new Set(['name', 'sub', 'title', 'text', 'label', 'note', 'badge', 'pack', 'titleNote',
  'tagline', 'question', 'hint', 'breed', 'employer', 'reason', 'desc', 'description', 'summary', 'prompt',
  'band', 'bandRole', 'category']);
const FUNC_TEXTO = new Set(['row', 'section', 'note', 'empty', 'titleBar', 'infoRow', 'screen', 'toast',
  'info', 'addJournal', 't', 'pushModal']);

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === 'i18n' || nome === 'tests') continue;
    const cam = join(dir, nome);
    if (statSync(cam).isDirectory()) saida.push(...arquivos(cam));
    else if (nome.endsWith('.js') && !nome.endsWith('pictograms.js')) saida.push(cam);
  }
  return saida;
}

const LIT = /(?<![\w$])(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")/g;
const desencapa = (s) => s.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n');

const pendentes = new Map();
for (const cam of arquivos(RAIZ)) {
  const src = readFileSync(cam, 'utf8');
  for (const m of src.matchAll(LIT)) {
    const txt = desencapa(m[1] ?? m[2] ?? '');
    if (!txt || txt.length < 3 || catalogo.has(txt)) continue;
    if (!/[A-Za-z]{3}/.test(txt)) continue;
      // identificador interno (`friendship`, `lifeStage`): uma unica palavra em minusculas ou
      // camelCase nunca e rotulo de tela. Rotulo de dado que parece isso ('student', 'retired')
      // ja esta no catalogo e foi descartado antes desta linha.
      if (/^[a-z][a-zA-Z0-9]*$/.test(txt)) continue;
    const antes = src.slice(Math.max(0, m.index - 40), m.index);
    const prop = antes.match(/(\w+)\s*:\s*$/);
    const fn = antes.match(/(\w+)\(\s*$/);
    const emChoices = /choices:\s*\[[^\]]*$/.test(antes);
    if (!(prop && PROPS_TEXTO.has(prop[1])) && !(fn && FUNC_TEXTO.has(fn[1])) && !emChoices) continue;
    const rel = relative(RAIZ, cam);
    if (!pendentes.has(txt)) pendentes.set(txt, new Set());
    pendentes.get(txt).add(rel);
  }
}

console.log(`catalogo pt:                 ${catalogo.size}`);
console.log(`texto estatico sem traducao: ${pendentes.size}`);
const porArquivo = new Map();
for (const [txt, arqs] of pendentes) for (const a of arqs) porArquivo.set(a, (porArquivo.get(a) || 0) + 1);
for (const [a, n] of [...porArquivo].sort((x, y) => y[1] - x[1])) console.log(`  ${String(n).padStart(4)}  ${a}`);
if (process.env.ESTATICAS_OUT) {
  const saida = {};
  for (const [txt, arqs] of pendentes) saida[txt] = [...arqs];
  writeFileSync(process.env.ESTATICAS_OUT, JSON.stringify(saida, null, 1));
  console.log(`lista em ${process.env.ESTATICAS_OUT}`);
}
