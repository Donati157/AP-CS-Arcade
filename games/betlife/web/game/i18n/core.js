'use strict';
// NÚCLEO DE TRADUÇÃO — um lugar só.
//
// Regras de desenho, e os porquês:
//
//  1. A CHAVE É O PRÓPRIO TEXTO EM INGLÊS. Não há inventário de identificadores para manter em
//     sincronia com 2.500 strings, e um texto sem tradução aparece em inglês em vez de aparecer
//     como `menu.bank.balance` — um defeito visível em vez de um defeito escondido.
//  2. Eventos e decisões são traduzidos POR `id`, porque são dados com identidade própria e o texto
//     deles é função (interpolação de nome, patrão, anos de casa).
//  3. Nada de verificação de idioma espalhada: nenhum arquivo do jogo pergunta "estou em pt?". Eles
//     chamam `t()` e seguem a vida.
//  4. Trocar de idioma redesenha na hora. O que já foi escrito no diário fica na língua em que foi
//     vivido, porque o diário é a memória daquela vida, não um texto re-renderizável.

const CATALOGOS = new Map();          // idioma -> Map(texto em inglês -> tradução)
const EVENTOS = new Map();            // idioma -> Map(id do evento -> { text, choices, title })
const LISTENERS = new Set();

let atual = 'en';

/** Registra (ou acrescenta a) o catálogo de frases de um idioma. */
export function registrarFrases(lang, dicionario) {
  if (!CATALOGOS.has(lang)) CATALOGOS.set(lang, new Map());
  const m = CATALOGOS.get(lang);
  for (const [en, pt] of Object.entries(dicionario)) m.set(en, pt);
}

/** Registra as traduções de eventos/decisões de um idioma, por id. */
export function registrarEventos(lang, dicionario) {
  if (!EVENTOS.has(lang)) EVENTOS.set(lang, new Map());
  const m = EVENTOS.get(lang);
  for (const [id, def] of Object.entries(dicionario)) m.set(id, def);
}

export function setLanguage(lang) {
  if (lang === atual) return;
  atual = lang;
  for (const fn of LISTENERS) { try { fn(lang); } catch (_) { /* um ouvinte ruim não derruba a troca */ } }
}
export const language = () => atual;
export const onLanguageChange = (fn) => { LISTENERS.add(fn); return () => LISTENERS.delete(fn); };

/**
 * Traduz uma frase. Sem tradução, devolve o inglês — de propósito: um buraco aparece como inglês
 * no meio do português, que é exatamente o que a auditoria de vazamento procura.
 *
 * `vars` substitui marcadores `{nome}`. Duas chaves são reservadas e não viram marcador:
 *
 *   `_g`  o gênero de quem a frase descreve: 'female' | 'male'. O inglês não precisa dele; o
 *         português precisa, porque "promovido" e "promovida" são a mesma palavra em inglês.
 *   `_n`  o número, para a frase que concorda em plural. Reservado pelo mesmo motivo.
 *
 * Quando a tradução é um par `{ m, f }`, `_g` escolhe. Sem `_g`, vale o masculino — que é o que
 * o português usa quando não se sabe, e o que não inventa um gênero que o estado não afirma.
 */
export function t(texto, vars) {
  const cat = CATALOGOS.get(atual);
  const bruto = (cat && cat.get(texto)) || texto;
  let saida = escolherForma(bruto, vars);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      if (k === '_g' || k === '_n') continue;      // reservadas: concordância, não substituição
      saida = saida.split(`{${k}}`).join(String(v));
    }
  }
  return saida;
}

/** Uma tradução pode ser string ou o par `{ m, f }`. Aqui ela vira string. */
function escolherForma(bruto, vars) {
  if (typeof bruto === 'string') return bruto;
  if (!bruto || typeof bruto !== 'object') return String(bruto);
  const g = vars && vars._g;
  return (g === 'female' ? bruto.f : bruto.m) ?? bruto.m ?? bruto.f ?? '';
}

/**
 * A forma feminina de um rótulo de dado — profissão, cargo, papel — quando o catálogo guarda o par.
 * Existe separada de `t()` porque esses rótulos entram no meio de outra frase já traduzida, e ali
 * quem conhece o gênero é o chamador, não a frase.
 */
export function tg(texto, genero) {
  return t(texto, { _g: genero });
}

/** A tradução de um evento/decisão, ou null quando não há. */
export function evento(id) {
  const m = EVENTOS.get(atual);
  return (m && m.get(id)) || null;
}

/** Existe tradução para esta frase? Usado só pela auditoria. */
export const temTraducao = (texto) => {
  const cat = CATALOGOS.get(atual);
  return !!(cat && cat.has(texto));
};

/** Quantas frases e eventos este idioma conhece. Usado pelo relatório e pelos testes. */
export function cobertura(lang = atual) {
  return {
    frases: CATALOGOS.has(lang) ? CATALOGOS.get(lang).size : 0,
    eventos: EVENTOS.has(lang) ? EVENTOS.get(lang).size : 0,
  };
}
