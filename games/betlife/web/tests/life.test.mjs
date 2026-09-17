import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import { restoreState, SAVE_VERSION } from '../game/save.js';
import { simulateLife } from '../game/simulate.js';
import { runLives, average, atAge } from './helpers.mjs';
import * as People from '../game/people.js';
import * as Education from '../game/education.js';

const ageTo = (s, target) => { while (s.player.age < target && s.player.alive) { s.pending.length = 0; G.ageUp(s); } };

test('birth: age 0, parents, journal, no money, possibly an older sibling', () => {
  const s = G.createNewGame({}, 1);
  assert.equal(s.player.age, 0);
  assert.equal(s.player.money, 0);
  assert.equal(s.player.occupation, 'Infant');
  assert.equal(People.parents(s).length, 2);
  assert.ok(s.timeline[0].text.startsWith('You were born'));
  assert.ok(s.timeline.length >= 5);
});

test('school progression and graduation at 18', () => {
  const s = G.createNewGame({}, 2);
  ageTo(s, 5);
  assert.equal(s.education.stage, 'school');
  assert.equal(s.player.occupation, 'Elementary School Student');
  ageTo(s, 11);
  assert.equal(Education.schoolLevel(s.education), 'Middle School');
  ageTo(s, 14);
  assert.equal(Education.schoolLevel(s.education), 'High School');
  ageTo(s, 18);
  assert.ok(s.education.highSchoolGraduate);
  assert.equal(s.pending.filter((m) => m.eventId === 'afterHighSchool').length, 1, 'the what-next decision is waiting');
  assert.equal(G.ageUp(s), false, 'Age is blocked while a decision is pending');
  assert.equal(G.answerModal(s, 2), 'jobs');
  assert.equal(s.player.occupation, 'Unemployed');
});

test('university: enroll, tuition as a loan, degree at 22', () => {
  const s = G.createNewGame({}, 3);
  ageTo(s, 18);
  assert.ok(G.enrollUniversity(s, 'Biology'));
  assert.equal(s.player.occupation, 'University Student');
  ageTo(s, 22);
  assert.equal(s.education.degree, 'Biology');
  assert.ok(s.timeline.some((e) => /degree in Biology/.test(e.text)));
});

test('relationships have state, age every year, and closeness responds to actions', () => {
  const s = G.createNewGame({}, 4);
  const mother = People.parents(s).find((r) => r.role === 'mother');
  const startAge = mother.age;
  ageTo(s, 10);
  assert.equal(mother.age, startAge + 10, 'parents age with the player');
  const before = mother.closeness;
  G.interactWith(s, mother.id, 'spendTime');
  assert.equal(mother.closeness, Math.min(100, before + 6));
  assert.ok(mother.occupation);
  assert.equal(typeof mother.alive, 'boolean');
});

test('assets: buying changes cash, net worth and expenses; selling gives money back', () => {
  const s = G.createNewGame({}, 5);
  ageTo(s, 25);
  s.player.money = 20000; s.player.hasLicence = true;
  const worth = G.netWorth(s);
  assert.equal(G.buyItem(s, 'usedCars', 'usedSedan'), 'ok');
  assert.equal(s.player.money, 20000 - 7800);
  assert.equal(G.netWorth(s), worth, 'net worth unchanged right after buying (cash became an asset)');
  assert.ok(G.yearlyExpenses(s) > 0);
  assert.equal(G.buyItem(s, 'usedCars', 'usedSedan'), 'owned');
  const price = G.sellAsset(s, s.assets[0].id);
  assert.ok(price > 0 && s.assets.length === 0);
  s.player.money = 0;
  assert.equal(G.buyItem(s, 'homes', 'studio'), 'noMoney');
});

test('save/load round trip and after-death behaviour', () => {
  const life = simulateLife(6);
  const s = life.state;
  assert.equal(s.player.alive, false);
  const ageAtDeath = s.player.age;
  const journalLength = s.timeline.length;
  assert.equal(G.ageUp(s), false, 'Age does nothing after death');
  assert.equal(G.doActivity(s, 'walk').ok, false, 'actions are blocked after death');
  assert.equal(s.timeline.length, journalLength, 'no new journal lines after death');
  assert.ok(s.timeline[journalLength - 1].text.startsWith('You passed away'));
  const restored = restoreState(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.player.alive, false, 'reload does not resurrect');
  assert.equal(restored.player.age, ageAtDeath);
  const summary = G.lifeSummary(restored);
  assert.equal(summary.name, s.player.name);
  assert.ok(summary.facts.some(([k]) => k === 'Net worth'));
  const fresh = G.createNewGame({}, 7);
  assert.equal(fresh.player.age, 0);
  assert.ok(fresh.player.alive);
  assert.notEqual(fresh.player.name, s.player.name);
});

test('old version-1 saves migrate without crashing; garbage is rejected', () => {
  const v1 = { profile: { firstName: 'Zoe', lastName: 'Okafor', gender: 'female', city: 'Lisbon', country: 'Portugal', birthday: 'May 3', mother: { name: 'Nora Okafor', job: 'nurse', age: 30 }, father: { name: 'Leo Okafor', job: 'chef', age: 33 } },
    player: { name: 'Zoe Okafor', gender: 'female', birthplace: 'Lisbon, Portugal', birthday: 'May 3', occupation: 'Student', age: 14, happiness: 80, health: 90, smarts: 70, looks: 60, money: 120 },
    education: { stage: 'school', year: 9, performance: 75, major: null, highSchoolGraduate: false, degree: null },
    career: { jobId: null, performance: 0, yearsEmployed: 0, workedHardThisYear: false },
    timeline: [{ age: 0, description: 'You were born a girl in Lisbon, Portugal.', kind: 'milestone' }, { age: 14, description: 'A camping trip.', kind: 'normal' }],
    relationships: [{ name: 'Nora Okafor', type: 'Mother', job: 'nurse', age: 44, level: 90 }, { name: 'Liam Parker', type: 'Friend', level: 55 }],
    assets: [{ name: 'Used Bicycle', type: 'Vehicle', value: 200 }], actionsRemaining: 3, nextFriendName: 1, lastEventId: 'camping', pendingDecision: null };
  const s = restoreState(JSON.parse(JSON.stringify(v1)));
  assert.ok(s, 'v1 save migrated');
  assert.equal(s.version, SAVE_VERSION);
  assert.equal(s.player.age, 14);
  assert.equal(s.player.name, 'Zoe Okafor');
  assert.equal(s.relationships[0].role, 'mother');
  assert.equal(s.timeline[1].text, 'A camping trip.');
  s.pending.length = 0;
  assert.ok(G.ageUp(s), 'migrated save can keep playing');
  assert.equal(s.player.age, 15);
  assert.equal(restoreState({ hello: 'world' }), null);
  assert.equal(restoreState(null), null);
  assert.equal(restoreState({ player: { age: 'NaN' }, profile: {} }), null);
});

test('long-run: 100 seeded lives all end, with natural variation and no impossible states', () => {
  const lives = runLives(100, 20000);
  const finalAges = lives.map((l) => l.state.player.age);
  const problems = [];
  for (const life of lives) {
    const s = life.state;
    if (life.reachedCap) problems.push(`seed life reached the ${life.state.player.age} cap`);
    if (s.player.alive) problems.push('still alive at the end of the simulation');
    // impossible states
    let sameJobYears = 0;
    for (let i = 1; i < life.snapshots.length; i++) {
      const a = life.snapshots[i - 1]; const b = life.snapshots[i];
      if (b.job && b.job === a.job && b.salary === a.salary) sameJobYears++; else sameJobYears = 0;
      if (sameJobYears > 30) problems.push(`same job and salary for ${sameJobYears} years (${b.job})`); // a plateau at the top of a ladder is fine; decades of it is not
      if (b.age !== a.age + 1) problems.push('a year was skipped or processed twice');
      for (const st of ['happiness', 'health', 'smarts', 'looks']) if (!Number.isFinite(b[st])) problems.push(`${st} is ${b[st]}`);
    }
    const mother = s.relationships.find((r) => r.role === 'mother');
    if (mother && mother.alive && mother.age < s.player.age + 18) problems.push('mother did not age');
    if (s.timeline.filter((e) => e.text.startsWith('You passed away')).length !== 1) problems.push('final event count wrong');
  }
  const sorted = [...finalAges].sort((a, b) => a - b);
  console.log(`    final ages: min ${sorted[0]}, median ${sorted[50]}, max ${sorted[99]}, mean ${average(finalAges).toFixed(1)}, distinct ${new Set(finalAges).size}`);
  const married = lives.filter((l) => l.state.relationships.some((r) => r.role === 'spouse')).length;
  const withKids = lives.filter((l) => l.state.relationships.some((r) => ['son', 'daughter'].includes(r.role))).length;
  const homeowners = lives.filter((l) => l.state.assets.some((a) => a.type === 'home')).length;
  console.log(`    married: ${married}, with children: ${withKids}, homeowners: ${homeowners}, retired: ${lives.filter((l) => l.state.career.retired).length}`);
  const under60 = finalAges.filter((a) => a < 60).length;
  console.log(`    under 60: ${under60}, 60-79: ${finalAges.filter((a) => a >= 60 && a < 80).length}, 80-94: ${finalAges.filter((a) => a >= 80 && a < 95).length}, 95+: ${finalAges.filter((a) => a >= 95).length}`);
  assert.deepEqual(problems.slice(0, 5), [], problems.join('; '));
  assert.ok(new Set(finalAges).size >= 15, 'final ages should vary');
  assert.ok(sorted[99] < 115, 'nobody should live past 115 in 100 lives');
  assert.ok(average(finalAges) > 60 && average(finalAges) < 95, `mean lifespan ${average(finalAges)} out of a plausible band`);
});

test('happiness history: values change over a life', () => {
  const lives = runLives(3, 40000);
  for (const life of lives) {
    const line = life.snapshots.filter((s) => [16, 20, 25, 30, 40, 50, 60, 70].includes(s.age)).map((s) => `${s.age}: ${s.happiness}`).join(', ');
    console.log('    ' + line);
    const values = new Set(life.snapshots.map((s) => s.happiness));
    if (life.snapshots.length >= 30) assert.ok(values.size >= 15, `happiness barely changes (${values.size} distinct values in ${life.snapshots.length} years)`);
  }
});

test('representative career and stat history of one life', () => {
  const life = simulateLife(2024);
  const rows = life.snapshots.filter((s) => s.age % 5 === 0 || !s.alive).map((s) =>
    `${String(s.age).padStart(3)} | H${String(s.happiness).padStart(3)} He${String(s.health).padStart(3)} S${String(s.smarts).padStart(3)} L${String(s.looks).padStart(3)} | $${s.money.toLocaleString('en-US').padStart(10)} | ${(s.job || s.occupation).padEnd(26)} ${s.job ? `t${s.tenure} $${s.salary}` : ''}`);
  console.log('    ' + rows.join('\n    '));
  assert.ok(life.snapshots.length > 30);
});
