// AUDITORIA DE VAZAMENTO — o que ainda aparece em inglês quando o jogo está em português.
//
// Percorre as telas no navegador com o idioma em pt-BR, lê o texto VISÍVEL e aponta o que ainda é
// inglês. O ponto difícil é separar frase não traduzida de nome próprio: "Maya was touched by your
// compliment" é defeito; "Maya" não é, e "Harborview University" também não.
//
// Como decide: uma frase é suspeita quando contém duas ou mais palavras funcionais do inglês
// ("you", "the", "and", "with", "of"…) que não existem em português. Nome próprio, cargo e lugar
// vêm das listas do próprio jogo e são ignorados.
//
// Uso: node tests/leak-audit.mjs [base-url]
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
const IDADES = [6, 12, 19, 27, 45, 70];
const TELAS = ['main', 'growing', 'school', 'university', 'tradeSchool', 'occupation', 'education', 'job', 'jobs',
  'military', 'dream', 'hr', 'partTimeJobs', 'careerHistory', 'assets', 'properties', 'socialMedia', 'socialAccount',
  'finances', 'asset', 'shopping', 'shop', 'relationships', 'person', 'activities', 'pets', 'badges', 'identity',
  'menu', 'about', 'summary'];
const MODAIS = ['decision', 'info', 'person', 'death', 'postlife', 'banner'];

// Palavras funcionais do inglês que não são palavras do português.
const INGLES = new Set(['you', 'your', 'yours', 'the', 'and', 'with', 'of', 'to', 'for', 'from', 'that', 'this',
  'these', 'those', 'is', 'was', 'were', 'are', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'can',
  'could', 'should', 'not', 'but', 'they', 'them', 'their', 'she', 'her', 'his', 'him', 'it', 'its', 'at',
  'on', 'in', 'by', 'as', 'an', 'any', 'all', 'about', 'into', 'over', 'after', 'before', 'again', 'just',
  'only', 'more', 'most', 'some', 'what', 'when', 'where', 'who', 'how', 'now', 'then', 'there', 'here',
  'back', 'out', 'up', 'down', 'off', 'own', 'same', 'than', 'too', 'very', 'while', 'because', 'through']);

const browser = await webkit.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e).slice(0, 110)));

// Nomes próprios: as listas do próprio jogo, para não acusar "Maya" de estar em inglês.
const proprios = await page.evaluate(() => new Set()).then(async () => {
  const mod = await import('../game/life-generator.js').catch(() => null);
  const car = await import('../game/careers.js').catch(() => null);
  const set = new Set();
  // `FIRST_NAMES` é { female: [...], male: [...] }; as outras são listas simples.
  const juntar = (v) => { if (!v) return []; if (Array.isArray(v)) return v; return Object.values(v).flat(); };
  if (mod) for (const lista of [mod.FIRST_NAMES, mod.LAST_NAMES, mod.PET_NAMES]) for (const n of juntar(lista)) set.add(String(n).toLowerCase());
  if (mod) for (const p of juntar(mod.PLACES)) for (const w of `${p.city || ''} ${p.country || ''}`.split(/\s+/)) if (w) set.add(w.toLowerCase());
  if (car) for (const c of juntar(car.CAREERS)) for (const w of String(c.employer || '').split(/\s+/)) if (w) set.add(w.toLowerCase());
  return set;
});

function suspeitas(texto) {
  const fora = [];
  for (const linha of texto.split('\n')) {
    const frase = linha.trim();
    if (frase.length < 12) continue;
    const palavras = frase.toLowerCase().match(/[a-zà-ÿ']+/g) || [];
    const uteis = palavras.filter((w) => !proprios.has(w));
    const marcas = uteis.filter((w) => INGLES.has(w));
    if (new Set(marcas).size >= 2) fora.push({ frase: frase.slice(0, 96), marcas: [...new Set(marcas)].slice(0, 5) });
  }
  return fora;
}

const achados = [];
let telasLidas = 0;

async function abrir(url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  try { await page.waitForFunction(() => window.betlife, null, { timeout: 12000 }); } catch (_) { return false; }
  await page.waitForTimeout(260);
  return true;
}
// Tudo o que o jogador pode ler: o texto visível e também os rótulos que só o leitor de tela e o
// tooltip mostram. O `aria-label` entrou nesta lista depois que dois botões — Envelhecer e o de
// voltar um ano — passaram meses em inglês justamente porque `innerText` não os alcança.
const visivel = () => page.evaluate(() => {
  const partes = [];
  const g = document.getElementById('game'); if (g) partes.push(g.innerText);
  const m = document.getElementById('modal-root'); if (m && m.firstChild) partes.push(m.innerText);
  const t = document.getElementById('toast-root'); if (t && t.firstChild) partes.push(t.innerText);
  for (const el of document.querySelectorAll('[aria-label],[title],[placeholder]')) {
    for (const attr of ['aria-label', 'title', 'placeholder']) {
      const v = el.getAttribute(attr);
      if (v && v.trim()) partes.push(v);
    }
  }
  return partes.join('\n');
});

for (const idade of IDADES) {
  for (const tela of TELAS) {
    const url = `${BASE}?seed=7&age=${idade}&lang=pt&person=first&asset=first&shop=electronics&social=1&_=${tela}${idade}#${tela}`;
    if (!(await abrir(url))) continue;
    const atual = await page.evaluate(() => document.getElementById('game')?.dataset.screen);
    if (atual !== tela) continue;
    telasLidas++;
    for (const s of suspeitas(await visivel())) achados.push({ onde: `${tela} @${idade}`, ...s });
  }
}
for (const m of MODAIS) {
  const url = `${BASE}?seed=7&age=27&lang=pt&modal=${m}&_=m${m}#main`;
  if (!(await abrir(url))) continue;
  await page.waitForTimeout(700);
  telasLidas++;
  for (const s of suspeitas(await visivel())) achados.push({ onde: `modal:${m}`, ...s });
}

// ── Relatório ────────────────────────────────────────────────────────────────
const porFrase = new Map();
for (const a of achados) {
  const k = a.frase;
  if (!porFrase.has(k)) porFrase.set(k, { ...a, vezes: 0, onde: new Set() });
  const e = porFrase.get(k); e.vezes++; e.onde.add(a.onde);
}
const lista = [...porFrase.values()].sort((a, b) => b.vezes - a.vezes);
console.log(`\ntelas e modais lidos: ${telasLidas}`);
console.log(`frases suspeitas de inglês: ${lista.length} distintas (${achados.length} ocorrências)\n`);
for (const e of lista.slice(0, 60)) {
  console.log(`  [${[...e.onde].slice(0, 3).join(', ')}]${e.onde.size > 3 ? ` +${e.onde.size - 3}` : ''}`);
  console.log(`    "${e.frase}"   ← ${e.marcas.join(', ')}`);
}
if (lista.length > 60) console.log(`  … e mais ${lista.length - 60}`);
// Despeja a lista inteira num arquivo, para servir de pauta de tradução.
if (process.env.LEAK_OUT) {
  const fs = await import('node:fs');
  fs.writeFileSync(process.env.LEAK_OUT, JSON.stringify(lista.map((e) => ({ frase: e.frase, vezes: e.vezes, onde: [...e.onde].slice(0, 4) })), null, 1));
  console.log(`lista completa gravada em ${process.env.LEAK_OUT}`);
}
const cob = await page.evaluate(async () => { const m = await import('../game/i18n/core.js').catch(() => null); return m ? m.cobertura('pt') : null; });
if (cob) console.log(`\ncatálogo pt: ${cob.frases} frases · ${cob.eventos} eventos`);
console.log(`erros de página: ${erros.length}${erros.length ? ` → ${erros[0]}` : ''}`);

await browser.close();
process.exit(lista.length ? 1 : 0);
