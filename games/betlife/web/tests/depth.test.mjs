import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import * as Career from '../game/career.js';
import * as People from '../game/people.js';
import { restoreState } from '../game/save.js';
import { simulateLife } from '../game/simulate.js';

const ageTo = (s, target) => { while (s.player.age < target && s.player.alive) { s.pending.length = 0; G.ageUp(s); } };

test('professional school unlocks a professional career', () => {
  const s = G.createNewGame({}, 8080);
  ageTo(s, 18);
  s.education.highSchoolGraduate = true; s.education.stage = 'none';
  assert.ok(G.enrollUniversity(s, 'Biology'));
  ageTo(s, 22);
  assert.equal(s.education.degree, 'Biology');
  assert.equal(G.applyForCareer(s, 'medicine').ok, false, 'no medical credential yet');
  assert.ok(G.enrollProgram(s, 'medical'));
  ageTo(s, 26);
  assert.ok(s.education.credentials.includes('Medicine'));
  assert.equal(G.applyForCareer(s, 'medicine').ok, true);
  assert.equal(s.player.occupation, 'Resident Physician');
});

test('military and dream careers check stats; HR and stress work; badges are earned once', () => {
  const s = G.createNewGame({}, 9090);
  ageTo(s, 18);
  s.education.highSchoolGraduate = true; s.education.stage = 'none';
  s.player.health = 30;
  assert.equal(G.applyForCareer(s, 'army').ok, false, 'needs health');
  s.player.health = 80;
  assert.equal(G.applyForCareer(s, 'army').ok, true);
  const before = s.career.stress;
  G.jobAction(s, 'workHarder');
  assert.ok(s.career.stress > before, 'working harder raises stress');
  assert.equal(G.humanResources(s, 'flexHours').ok, true);
  assert.equal(G.humanResources(s, 'training').ok, false, 'one HR request a year');
  assert.ok(s.badges.includes('nineToFive'));
  assert.equal(s.badges.filter((b) => b === 'nineToFive').length, 1);
  s.player.looks = 20;
  assert.equal(G.applyForCareer(s, 'actor').ok, false, 'acting needs looks');
});

test('vehicle actions, pets from a source and gifts', async () => {
  const s = G.createNewGame({}, 7070);
  ageTo(s, 25);
  s.player.money = 30000; s.player.hasLicence = true;
  assert.equal(G.buyItem(s, 'usedCars', 'usedSedan'), 'ok');
  const car = s.assets[0];
  assert.equal(G.assetAction(s, car.id, 'drive').ok, true);
  const cond = car.condition;
  assert.equal(G.assetAction(s, car.id, 'maintenance').ok, true);
  assert.ok(car.condition >= cond);
  const mom = People.parents(s)[0];
  assert.equal(G.assetAction(s, car.id, 'gift', mom.id).ok, true);
  assert.equal(s.assets.length, 0);
  const { SOURCES, inventory } = await import('../game/pets.js');
  const animal = inventory(s, SOURCES[0])[0];
  const result = G.adoptFromSource(s, SOURCES[0].id, animal.id);
  assert.ok(result.ok, result.text);
  assert.equal(People.pets(s).length, 1);
  assert.equal(People.pets(s)[0].breed, animal.breed);
});

test('continue as a child carries the family and inheritance into a fresh life', () => {
  const s = G.createNewGame({}, 6060);
  ageTo(s, 30);
  s.player.money = 50000;
  const kid = People.haveChild(s); kid.age = 12;
  s.player.alive = false; s.player.age = 70;
  const next = G.continueAsChild(s, kid.id);
  assert.ok(next);
  assert.equal(next.player.age, 12);
  assert.equal(next.player.name, kid.name);
  assert.ok(next.player.money >= 50000);
  assert.equal(next.education.stage, 'school');
  assert.ok(next.timeline[0].text.includes('passed away'));
  next.pending.length = 0;
  assert.ok(G.ageUp(next));
  assert.equal(next.player.age, 13);
});

test('regressions stay fixed: RNG persistence, relationship aging, new-life reset, no eternal employment', () => {
  const life = simulateLife(5150);
  const s = life.state;
  assert.ok(!s.player.alive);
  for (const snap of life.snapshots) assert.ok(!(snap.age > Career.RETIREMENT_MAX_AGE && snap.job && !snap.retired));
  const mother = s.relationships.find((r) => r.role === 'mother');
  const motherAgeAtDeath = mother.alive ? s.player.age : (mother.diedAtPlayerAge ?? null);
  if (mother.alive) assert.ok(mother.age >= s.player.age + 18, 'a living mother keeps aging with the player');
  else assert.ok(mother.age >= 18, 'a dead parent keeps the age at which they died');
  const copy = restoreState(JSON.parse(JSON.stringify(s)));
  assert.equal(copy.rngState, s.rngState);
  const fresh = G.createNewGame({}, 5151);
  assert.equal(fresh.timeline.length <= 7, true);
  assert.deepEqual(fresh.events.log, []);
  assert.deepEqual(fresh.badges || [], []);
});

test('freelance gigs, the job recruiter and name changes move money (2.1 regression)', () => {
  const state = G.createNewGame({}, 5);
  ageTo(state, 22);
  state.education.highSchoolGraduate = true; state.education.stage = 'none';
  state.player.money = 5000;
  const before = state.player.money;
  const gig = G.freelanceGig(state);
  assert.equal(gig.ok, true);
  assert.ok(state.player.money > before, 'freelance gig pays');
  const name = G.changeName(state, 'Rowan', 'Vale');
  assert.equal(name.ok, true);
  assert.equal(state.player.name, 'Rowan Vale');
  const afterName = state.player.money;
  const recruiter = G.jobRecruiter(state);
  assert.ok(recruiter.ok || recruiter.title === 'No Matches', recruiter.text);
  if (recruiter.ok) assert.equal(state.player.money, afterName - 1000, 'recruiter fee charged');
});

test('2.4: friend requests can be rejected, enemies and social media work, vehicles can be abandoned', async () => {
  const { personRequest } = await import('../game/events/engine.js');
  const s = G.createNewGame({}, 2424);
  ageTo(s, 14);
  s.pending.length = 0;
  const friend = People.addFriend(s, { age: 14, occupation: 'student' });
  personRequest(s, friend, 'friendRequest');
  assert.equal(s.pending[0].kind, 'decision');
  assert.ok(s.pending[0].choices[1].label.startsWith('Reject'));
  G.answerModal(s, 1);
  assert.equal(friend.alive, false, 'rejected friend leaves the list');
  const enemy = People.makeEnemy(s, { age: 14 });
  assert.ok(People.relationshipSections(s).some(([t]) => t === 'Enemies'));
  assert.ok(People.actionsFor(s, enemy).some(([id]) => id === 'makePeace'));
  assert.equal(G.socialSignUp(s, 'chirper').ok, true);
  assert.equal(G.socialPost(s, 'chirper').ok, true);
  assert.ok(s.social.chirper.followers > 0);
  s.player.money = 20000;
  assert.equal(G.buyItem(s, 'bikes', 'roadBike'), 'ok');
  const car = s.assets.find((a) => a.type === 'vehicle');
  assert.equal(G.assetAction(s, car.id, 'abandon').ok, true);
  assert.ok(!s.assets.some((a) => a.id === car.id));
  const copy = restoreState(JSON.parse(JSON.stringify(s)));
  assert.equal(copy.social.chirper.followers, s.social.chirper.followers, 'social accounts survive a save');
});
