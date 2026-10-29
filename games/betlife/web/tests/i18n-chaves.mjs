// Extrai todas as chaves `t('...')` do código-fonte e diz quais ainda não têm tradução em pt.
// É a ferramenta de medida da localização: o auditor de vazamento olha a tela renderizada, este
// olha o código. Juntos cobrem os dois lados — texto que passa por `t()` sem tradução, e texto que
// nem passa por `t()`.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOGO_PT } from '../game/i18n/catalogo-pt.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));  // fileURLToPath, senao o espaco em 'AP CS Arcade' chega como %20
const catalogo = new Map(Object.entries(CATALOGO_PT));

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === 'i18n' || nome === 'tests') continue;
    const cam = join(dir, nome);
    if (statSync(cam).isDirectory()) saida.push(...arquivos(cam));
    else if (nome.endsWith('.js')) saida.push(cam);
  }
  return saida;
}

// Varre o PRIMEIRO argumento de cada `t(...)` e colhe todo literal de string que houver nele.
// Precisa ser um scanner, e não uma expressão regular: metade das chaves chega por condicional
// — `t(n === 1 ? 'Died {n} year ago' : 'Died {n} years ago', ...)` — e uma regex ancorada na
// abertura do parêntese só veria a primeira, ou nenhuma.
function chavesDe(src) {
  const achadas = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== 't' || src[i + 1] !== '(') continue;
    const antes = src[i - 1] || ' ';
    if (/[\w$.]/.test(antes)) continue;          // `format(`, `obj.t(`, `let(`
    let j = i + 2, prof = 0;
    const aqui = [];
    while (j < src.length) {
      const c = src[j];
      if (c === '(' || c === '[' || c === '{') { prof++; j++; continue; }
      if (c === ')' && prof === 0) break;
      if (c === ')' || c === ']' || c === '}') { prof--; j++; continue; }
      if (c === ',' && prof === 0) break;          // fim do primeiro argumento
      if (c === "'" || c === '"' || c === '`') {
        let k = j + 1, bruto = '';
        while (k < src.length && src[k] !== c) {
          if (src[k] === '\\') { bruto += src[k] + src[k + 1]; k += 2; continue; }
          bruto += src[k]; k++;
        }
        // literal de comparacao (`gender === 'female' ? ...`) e operando, nao chave de traducao
        const comparacao = /(===|!==|==|!=)\s*$/.test(src.slice(Math.max(0, j - 6), j));
        if (c !== '`' && !comparacao) aqui.push(bruto.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n'));
        j = k + 1; continue;
      }
      j++;
    }
    achadas.push(...aqui);
  }
  return achadas;
}

const usos = new Map();
for (const cam of arquivos(RAIZ)) {
  if (cam.endsWith('pictograms.js')) continue;  // `t` ali é o helper local de <text> do SVG
  const src = readFileSync(cam, 'utf8');
  for (const chave of chavesDe(src)) {
    if (!chave) continue;
    if (!usos.has(chave)) usos.set(chave, new Set());
    usos.get(chave).add(relative(RAIZ, cam));
  }
}

const faltando = [...usos.keys()].filter((k) => !catalogo.has(k)).sort();
const orfas = [...catalogo.keys()].filter((k) => !usos.has(k));

console.log(`chaves t() no codigo: ${usos.size}`);
console.log(`catalogo pt:          ${catalogo.size}`);
console.log(`sem traducao:         ${faltando.length}`);
for (const k of faltando) console.log(`  x ${JSON.stringify(k)}   [${[...usos.get(k)].join(', ')}]`);
console.log(`\nno catalogo mas sem t() direto no codigo (chegam pela fronteira render/journal): ${orfas.length}`);
if (process.env.CHAVES_OUT) {
  writeFileSync(process.env.CHAVES_OUT, JSON.stringify(faltando, null, 1));
  console.log(`faltantes gravadas em ${process.env.CHAVES_OUT}`);
}
