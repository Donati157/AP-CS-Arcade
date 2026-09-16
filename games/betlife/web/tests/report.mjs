// Development report: content counts and reachability. Run with `node tests/report.mjs`.
import { EVENTS, EVENT_GROUPS, DECISION_GROUPS, isDecision } from '../game/events/catalog.js';
import { runLives } from './helpers.mjs';

const plain = EVENTS.filter((e) => !isDecision(e));
const decisions = EVENTS.filter(isDecision);
console.log(`TOTAL EVENT DEFINITIONS: ${EVENTS.length} (${plain.length} events, ${decisions.length} decision scenarios)`);
console.log('\nEvents by file:');
for (const [name, list] of Object.entries(EVENT_GROUPS)) console.log(`  ${name.padEnd(13)} ${list.length}`);
console.log('Decisions by file:');
for (const [name, list] of Object.entries(DECISION_GROUPS)) console.log(`  ${name.padEnd(13)} ${list.length}`);
const byCategory = {};
for (const e of EVENTS) byCategory[e.category] = (byCategory[e.category] || 0) + 1;
console.log('\nBy category: ' + Object.entries(byCategory).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(`One-time milestones: ${EVENTS.filter((e) => e.once).length} · Repeatable: ${EVENTS.filter((e) => !e.once).length} · Families: ${new Set(EVENTS.filter((e) => e.family).map((e) => e.family)).size}`);

const lives = runLives(100, 77);
const seen = new Map();
const stageSeen = {};
for (const life of lives) for (const { id, age } of life.state.events.log) {
  seen.set(id, (seen.get(id) || 0) + 1);
  const stage = age <= 3 ? 'Infant' : age <= 9 ? 'Child' : age <= 12 ? 'Preteen' : age <= 17 ? 'Teen' : age <= 29 ? 'Young Adult' : age <= 44 ? 'Adult' : age <= 64 ? 'Middle Age' : 'Senior';
  stageSeen[stage] = stageSeen[stage] || new Set(); stageSeen[stage].add(id);
}
const unreachable = EVENTS.filter((e) => !seen.has(e.id)).map((e) => e.id);
console.log(`\nREACHABLE (fired at least once in 100 lives): ${EVENTS.length - unreachable.length}`);
console.log(`UNREACHABLE: ${unreachable.length}${unreachable.length ? ' -> ' + unreachable.join(', ') : ''}`);
console.log('\nDistinct events seen per stage across 100 lives:');
for (const [stage, ids] of Object.entries(stageSeen)) console.log(`  ${stage.padEnd(12)} ${ids.size}`);
const ages = lives.map((l) => l.state.player.age).sort((a, b) => a - b);
console.log(`\nFinal ages: min ${ages[0]} median ${ages[50]} max ${ages[99]}`);
