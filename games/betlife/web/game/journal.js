// The life journal and the queue of dialogs the interface shows after a year passes.
//
// A TRADUÇÃO ENTRA AQUI, na última fronteira por onde toda narrativa passa antes de virar linha do
// diário ou cartão na tela. Quem já chegou traduzido (as frases com nome interpolado, que passam por
// `t()` na origem) atravessa sem mudança, porque `t()` de um texto já traduzido devolve ele mesmo.
//
// Fazer aqui cobre de uma vez o texto estático de atividades, eventos e decisões — centenas de
// frases que, de outro modo, exigiriam mexer em 45 arquivos.
import { t } from './i18n/index.js';

// kind: 'normal' | 'positive' | 'negative' | 'milestone'
export function addJournal(state, texto, kind = 'normal') {
  // O gênero do JOGADOR entra aqui, na fronteira, porque é ele que "Você foi promovido/promovida"
  // descreve — e assim as centenas de frases do diário não precisam passar `_g` uma a uma. Frase
  // sobre OUTRA pessoa já chega traduzida da origem, com o `_g` daquela pessoa, e `t()` de um texto
  // já traduzido devolve ele mesmo.
  const text = t(texto, { _g: state.player.gender });
  const entry = { age: state.player.age, text, kind };
  // The same sentence never repeats inside one year (repeated actions read as one line).
  const dup = state.timeline.find((e) => e.age === entry.age && e.text === text);
  if (dup) return dup;
  state.timeline.push(entry);
  return entry;
}

/**
 * Queues a dialog for the interface. Everything queued is saved with the game, so a reload shows
 * the same dialogs again instead of losing a decision.
 *   { kind: 'info', band, title, text, facts: [[label, value]], tone: 'blue' | 'green' | 'red' }
 *   { kind: 'decision', eventId, band, title, text, facts, choices: [{ label }], person }
 */
export function pushModal(state, modal) {
  // O cartão é traduzido ao ser enfileirado: título, texto, rótulos das escolhas e os pares de
  // fatos. O `eventId`, a banda e os demais campos de controle não são tocados.
  const g = { _g: state.player.gender };            // mesma razão de `addJournal`
  const traduzido = { ...modal };
  if (typeof traduzido.title === 'string') traduzido.title = t(traduzido.title, g);
  if (typeof traduzido.text === 'string') traduzido.text = t(traduzido.text, g);
  if (Array.isArray(traduzido.choices)) {
    traduzido.choices = traduzido.choices.map((c) => (c && typeof c.label === 'string' ? { ...c, label: t(c.label, g) } : c));
  }
  if (Array.isArray(traduzido.facts)) {
    traduzido.facts = traduzido.facts.map((f) => (Array.isArray(f) ? [t(String(f[0]), g), t(String(f[1]), g)] : f));
  }
  state.pending.push(traduzido);
  return traduzido;
}

export function info(state, title, text, options = {}) {
  return pushModal(state, { kind: 'info', title, text, band: options.band || null, facts: options.facts || null,
    tone: options.tone || 'blue', person: options.person || null });
}

export function journalYears(timeline) {
  const years = [];
  for (const entry of timeline) {
    const last = years[years.length - 1];
    if (last && last.age === entry.age) last.entries.push(entry);
    else years.push({ age: entry.age, entries: [entry] });
  }
  return years;
}
