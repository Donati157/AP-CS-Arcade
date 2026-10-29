// Lista as traduções em português que marcam gênero e ainda têm uma forma só.
//
// O inglês não distingue: "promoted" serve para Lucas e para Freya. O português distingue, e uma
// frase com forma única acerta metade das vezes. Esta ferramenta acha as candidatas procurando
// terminações que concordam — particípios em -ado/-ido, adjetivos em -oso/-eiro, artigos e
// possessivos — para que a correção seja uma lista fechada e não uma caçada.
import { CATALOGO_PT } from '../game/i18n/catalogo-pt.js';

// Terminações que mudam com o gênero. A lista é deliberadamente generosa: é melhor revisar um
// falso positivo do que deixar "Freya foi promovido" passar.
const MARCAS = [
  /\b\w+[ai]do\b/i, /\b\w+[ai]da\b/i,          // promovido / promovida, contratado / contratada
  /\b\w+ido\b/i, /\b\w+ida\b/i,                // despedido, querida
  /\b(um|uma)\b/i, /\b(o|a)s?\b ?$/,           // artigo
  /\b(seu|sua|dele|dela|ele|ela)\b/i,          // possessivo e pronome
  /\b\w+(oso|osa|eiro|eira|tor|tora|dor|dora|ivo|iva|ico|ica|ano|ana|ário|ária)\b/i,
  /\bnovo\b|\bnova\b|\borgulhoso\b|\bpronto\b|\bsozinho\b|\bcansado\b/i,
];
// Formas que valem para os dois gêneros: não precisam de par.
const NEUTRAS = [
  /^[^a-zA-Z]*$/,                               // só números e símbolos
  /\b(estudante|cônjuge|gerente|colega|agente|cliente|paciente|doente|responsável|profissional)\b/i,
];

const paresProntos = [];
const candidatas = [];
for (const [en, pt] of Object.entries(CATALOGO_PT)) {
  if (pt && typeof pt === 'object') { paresProntos.push(en); continue; }
  if (typeof pt !== 'string') continue;
  if (NEUTRAS.some((r) => r.test(pt))) continue;
  if (!MARCAS.some((r) => r.test(pt))) continue;
  candidatas.push([en, pt]);
}

// Separa o que fala de OUTRA pessoa (tem {name}, {whoName}, {role}) do que fala do jogador.
const DE_OUTREM = /\{(name|whoName|name\d|firstName\d?|petName|role|stepName|them|their|job|title)\}/;
const outrem = candidatas.filter(([, pt]) => DE_OUTREM.test(pt));
const jogador = candidatas.filter(([, pt]) => !DE_OUTREM.test(pt));

console.log(`pares { m, f } ja prontos: ${paresProntos.length}`);
console.log(`candidatas com forma unica: ${candidatas.length}`);
console.log(`  sobre outra pessoa: ${outrem.length}`);
console.log(`  sobre o jogador:    ${jogador.length}`);
if (process.env.GENERO_OUT) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(process.env.GENERO_OUT, JSON.stringify({ outrem, jogador }, null, 1));
  console.log(`listas em ${process.env.GENERO_OUT}`);
}
