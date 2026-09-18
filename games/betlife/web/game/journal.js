// The life journal and the queue of dialogs the interface shows after a year passes.

// kind: 'normal' | 'positive' | 'negative' | 'milestone'
export function addJournal(state, text, kind = 'normal') {
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
  state.pending.push(modal);
  return modal;
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
