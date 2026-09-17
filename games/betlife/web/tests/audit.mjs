// Audit report for real-gameplay questions: event repetition, stats over a life, a full career,
// and mortality across seeds. Run with `node games/betlife/web/tests/audit.mjs [seed]`.
import { simulateLife } from '../game/simulate.js';
import { findEvent } from '../game/events/catalog.js';
import { runLives } from './helpers.mjs';

const seed = Number(process.argv[2] || 2026);
const life = simulateLife(seed);
const s = life.state;
console.log(`=== Life ${seed}: ${s.player.name}, born ${s.player.birthplace}, lived to ${s.player.age} (${s.player.deathCause}) ===\n`);

console.log('AGE -> EVENT ID -> FAMILY -> DISPLAYED EVENT');
const byAge = new Map();
for (const e of s.timeline) { if (!byAge.has(e.age)) byAge.set(e.age, []); byAge.get(e.age).push(e.text); }
for (const { age, id } of s.events.log) {
  const def = findEvent(id);
  const shown = (byAge.get(age) || []).find((t) => typeof def.text === 'string' ? t === def.text : true) || (byAge.get(age) || [])[0] || '';
  console.log(`${String(age).padStart(3)} -> ${id.padEnd(24)} -> ${(def.family || '-').padEnd(16)} -> ${shown.slice(0, 70)}`);
}
const counts = {};
for (const { id } of s.events.log) counts[id] = (counts[id] || 0) + 1;
const repeated = Object.entries(counts).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
console.log(`\nEvents in this life: ${s.events.log.length}, distinct ${Object.keys(counts).length}, repeated ids: ${repeated.map(([id, n]) => `${id}x${n}`).join(', ') || 'none'}`);
const catching = s.events.log.filter((e) => /catch/i.test(e.id) || /catching up/i.test((byAge.get(e.age) || []).join(' ')));
console.log(`"Catching up" occurrences: ${catching.length} (${catching.map((e) => e.age).join(', ') || 'never'}); the old fallback event no longer exists in the catalog: ${findEvent('catchingUp') === null}`);

console.log('\nSTATS BY AGE (happiness / health / smarts / looks / money)');
for (const age of [0, 6, 12, 18, 30, 50, 70, 85]) {
  const snap = age === 0 ? { ...life.snapshots[0], age: 0 } : life.snapshots.find((x) => x.age === age);
  if (snap) console.log(`  ${String(age).padStart(3)}: ${snap.happiness} / ${snap.health} / ${snap.smarts} / ${snap.looks} / $${snap.money.toLocaleString('en-US')}`);
}

console.log('\nCAREER (age, job, salary, tenure, performance, status)');
let last = null;
for (const snap of life.snapshots) {
  const key = `${snap.job}|${snap.salary}|${snap.retired}`;
  if (key !== last || snap.age % 10 === 0) console.log(`  ${String(snap.age).padStart(3)} ${(snap.job || snap.occupation).padEnd(28)} $${String(snap.salary).padStart(7)} t${String(snap.tenure).padStart(2)} p${String(snap.performance).padStart(3)} ${snap.retired ? 'RETIRED' : snap.job ? 'employed' : '-'}`);
  last = key;
}
const c = s.career;
console.log(`  promotions ${c.promotions}, raises ${c.raises}, years worked ${c.yearsWorked}, retired at ${c.retiredAt ?? 'never'}, history: ${c.history.map((h) => `${h.title} (${h.from}-${h.to}, ${h.reason})`).join('; ') || 'none'}`);

console.log('\nMORTALITY across 20 seeds: final age / cause / retired');
for (const l of runLives(20, seed + 1)) console.log(`  ${l.state.player.age} / ${l.state.player.deathCause} / ${l.state.career.retired ? `retired at ${l.state.career.retiredAt}` : 'not retired'}`);
