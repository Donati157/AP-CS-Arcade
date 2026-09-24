// Everything in Poly Kart that can be checked without drawing anything: the clock, lap and
// checkpoint order, what counts as a valid lap, resets, position, and the fixed timestep.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRace, createProgress, tickRace, updateProgress, applyReset, standings, positionOf,
  formatTime, formatDelta, ordinal, isImprovement, RESET_MODES,
} from '../src/run.js';
import { buildTrack, queryTrack, poseAtGate, wrapDistance, loopDelta } from '../src/track.js';
import { createCar, resetCar, step, createClock, advance, STEP, speedKmh, CAR } from '../src/physics.js';
import { createField, placeOnGrid, driveRival, separate } from '../src/racers.js';
import { TRACKS, trackById } from '../src/tracks.js';

const track = buildTrack(TRACKS[0]);
const LAPS = 3;

// A stand-in kart carrying only what the lap logic reads.
const kartAt = (distance, onRoad = true) => ({
  car: { distanceAlong: wrapDistance(distance, track.length), onRoad, lateral: onRoad ? 0 : 40, halfWidth: 8, speed: 30 },
});

// Drives a kart round in believable increments, collecting the events it triggers.
function driveTo(progress, kart, targetDistance, stepMetres = 8) {
  const events = [];
  let travelled = 0;
  while (travelled < targetDistance) {
    const move = Math.min(stepMetres, targetDistance - travelled);
    travelled += move;
    kart.car.distanceAlong = wrapDistance(kart.car.distanceAlong + move, track.length);
    const event = updateProgress(progress, track, kart, travelled);
    if (event) events.push(event);
  }
  return events;
}

test('time formatting uses minutes, seconds and milliseconds', () => {
  assert.equal(formatTime(0), '00:00.000');
  assert.equal(formatTime(9.5), '00:09.500');
  assert.equal(formatTime(61.004), '01:01.004');
  assert.equal(formatTime(null), '--:--.---');
  assert.equal(formatTime(NaN), '--:--.---');
  assert.equal(formatTime(59.9996), '01:00.000');
  assert.equal(formatDelta(-0.4), '-00:00.400');
});

test('places are written the way a race writes them', () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal),
    ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd']);
});

test('distances wrap round the loop and the gap between them is signed', () => {
  assert.equal(wrapDistance(track.length + 5, track.length), 5);
  assert.equal(wrapDistance(-5, track.length), track.length - 5);
  assert.ok(loopDelta(track.length - 5, 5, track.length) > 0, 'crossing the line reads as forward');
  assert.ok(loopDelta(5, track.length - 5, track.length) < 0, 'and the other way reads as backward');
});

test('every track is a closed loop with ordered checkpoints and a start on the road', () => {
  for (const definition of TRACKS) {
    const built = buildTrack(definition);
    assert.ok(built.length > 400, `${built.name} is long enough to be a circuit`);
    assert.equal(built.gates.length, definition.checkpoints.length);
    let previous = 0;
    for (const gate of built.gates) {
      assert.ok(gate.distance > previous, `${built.name}: gates are in order`);
      previous = gate.distance;
    }
    const first = built.samples[0].position;
    const last = built.samples[built.samples.length - 1].position;
    const closing = Math.hypot(first[0] - last[0], first[1] - last[1], first[2] - last[2]);
    assert.ok(closing < 8, `${built.name}: the loop closes, gap was ${closing.toFixed(1)}m`);
    assert.equal(queryTrack(built, built.start.position, 0).onRoad, true, `${built.name}: starts on the road`);
  }
});

test('no circuit runs alongside itself at the same height', () => {
  // Two points 150 metres apart along the track that are 15 metres apart in space are two different
  // parts of the circuit overlapping. Two points 80 metres apart are the entry and exit of the same
  // corner, which is what a corner is, so the window has to be wide enough to let corners be.
  for (const definition of TRACKS) {
    const built = buildTrack(definition);
    const window = Math.round(150 / (built.length / built.samples.length));
    let tightest = Infinity;
    for (let i = 0; i < built.samples.length; i++) {
      for (let j = i + 1; j < built.samples.length; j++) {
        if (Math.min(j - i, built.samples.length - (j - i)) < window) continue;
        const a = built.samples[i], b = built.samples[j];
        if (Math.abs(a.position[1] - b.position[1]) > 6) continue;
        tightest = Math.min(tightest, Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]) - (a.width + b.width) / 2);
      }
    }
    assert.ok(tightest > 6, `${built.name}: only ${tightest.toFixed(1)}m between two parts of the road`);
  }
});

test('checkpoints must be taken in order, and the line is dead until they are', () => {
  const progress = createProgress(track, LAPS);
  progress.started = true;
  const kart = kartAt(0);
  // A lap's worth of driving trips every checkpoint once, in order, then completes the lap.
  const events = driveTo(progress, kart, track.length + 4);
  assert.deepEqual(events.filter((e) => e.kind === 'checkpoint').map((e) => e.index), [1, 2, 3]);
  assert.equal(events.filter((e) => e.kind === 'lap').length, 1);
  assert.equal(progress.lap, 2);
});

test('sitting on the start line does not collect laps', () => {
  const progress = createProgress(track, LAPS);
  progress.started = true;
  const kart = kartAt(track.length - 3);
  let laps = 0;
  for (let i = 0; i < 40; i++) {
    // Shuffle back and forth across the line without ever going round.
    kart.car.distanceAlong = wrapDistance(track.length - 3 + (i % 2) * 6, track.length);
    const event = updateProgress(progress, track, kart, i);
    if (event && event.kind === 'lap') laps += 1;
  }
  assert.equal(laps, 0, 'crossing the line without the checkpoints is worth nothing');
  assert.equal(progress.lap, 1);
});

test('a big jump in distance scores nothing: you cannot cut the course', () => {
  const progress = createProgress(track, LAPS);
  progress.started = true;
  const kart = kartAt(0);
  kart.car.distanceAlong = track.gates[2].distance + 5;
  assert.equal(updateProgress(progress, track, kart, 1), null);
  assert.equal(progress.passed, 0);
});

test('going backwards over a gate scores nothing', () => {
  const progress = createProgress(track, LAPS);
  progress.started = true;
  const kart = kartAt(track.gates[0].distance + 20);
  updateProgress(progress, track, kart, 0);
  kart.car.distanceAlong = track.gates[0].distance - 5;
  assert.equal(updateProgress(progress, track, kart, 1), null);
  assert.equal(progress.passed, 0);
});

test('a gate counts when you clip the kerb but not when you are miles away', () => {
  const near = createProgress(track, LAPS);
  near.started = true;
  const clipping = kartAt(0);
  clipping.car.lateral = clipping.car.halfWidth + 2;      // a wheel on the grass
  assert.ok(driveTo(near, clipping, track.gates[0].distance + 6).length > 0, 'a clipped kerb still counts');

  const far = createProgress(track, LAPS);
  far.started = true;
  const wandering = kartAt(0);
  wandering.car.lateral = wandering.car.halfWidth + 40;   // out in the scenery
  assert.equal(driveTo(far, wandering, track.gates[0].distance + 6).length, 0, 'the scenery does not count');
});

test('three laps finish the race and the clock stops', () => {
  const progress = createProgress(track, LAPS);
  progress.started = true;
  const kart = kartAt(0);
  const events = driveTo(progress, kart, track.length * 3 + 8);
  const finish = events.find((e) => e.kind === 'finish');
  assert.ok(finish, 'the race finishes');
  assert.equal(progress.finished, true);
  assert.equal(events.filter((e) => e.kind === 'lap').length, LAPS - 1, 'two lap events, then the flag');
  // Crossing again changes nothing.
  const after = driveTo(progress, kart, track.length);
  assert.equal(after.length, 0);
});

test('the clock only runs once the race has started', () => {
  const race = createRace(track, LAPS);
  tickRace(race, 0.5);
  assert.equal(race.elapsed, 0);
  race.started = true;
  tickRace(race, 0.5);
  assert.equal(race.elapsed, 0.5);
  race.over = true;
  tickRace(race, 0.5);
  assert.equal(race.elapsed, 0.5, 'the flag stops the clock');
});

test('position comes from how far round you are, not who is nearest the line', () => {
  const field = createField(track, LAPS, 4);
  placeOnGrid(track, field);
  for (const racer of field) racer.progress.started = true;
  // Put the third kart a whole lap ahead and the second one just behind the line.
  field[2].progress.lap = 3;
  field[2].car.distanceAlong = 10;
  field[1].progress.lap = 1;
  field[1].car.distanceAlong = track.length - 10;
  const order = standings(field, track);
  assert.equal(order[0], field[2], 'a lap ahead wins, even though it is barely past the line');
  assert.equal(positionOf(field, track, field[2]), 1);
});

test('a kart that has finished stays ahead of one still running', () => {
  const field = createField(track, LAPS, 1);
  for (const racer of field) racer.progress.started = true;
  field[1].progress.finished = true;
  field[1].progress.finishTime = 90;
  field[0].progress.lap = 3;
  field[0].car.distanceAlong = track.length - 1;
  assert.equal(standings(field, track)[0], field[1]);
});

test('a reset leaves no hidden momentum and moves the search hint with the kart', () => {
  const car = createCar(track.start);
  Object.assign(car, { speed: 40, slide: 12, verticalSpeed: -20, steering: 1, pitch: 0.4, roll: -0.3, spin: 2, tumble: 1, fell: true, trackIndex: 300 });
  resetCar(car, poseAtGate(track, 0));
  for (const key of ['speed', 'slide', 'verticalSpeed', 'steering', 'pitch', 'roll', 'spin', 'tumble']) {
    assert.equal(car[key], 0, `${key} is cleared by a reset`);
  }
  assert.equal(car.fell, false);
  assert.equal(car.trackIndex, track.gates[0].index, 'the lookup hint follows the kart');
});

test('restarting the race puts everything back to the grid', () => {
  const progress = createProgress(track, LAPS);
  progress.lap = 3;
  progress.passed = 2;
  progress.nextGate = 2;
  const outcome = applyReset(progress, RESET_MODES.START);
  assert.equal(outcome.gate, -1);
  assert.equal(progress.lap, 1);
  assert.equal(progress.passed, 0);
  assert.equal(progress.finished, false);
});

test('the simulation runs the same amount of driving whatever the frame rate', () => {
  const drive = (frameSeconds, frames) => {
    const car = createCar(track.start);
    const clock = createClock();
    for (let i = 0; i < frames; i++) {
      advance(clock, frameSeconds, (dt) => step(car, track, { throttle: 1, brake: 0, steer: 0 }, dt));
    }
    return car.speed;
  };
  const at30 = drive(1 / 30, 60), at60 = drive(1 / 60, 120), at144 = drive(1 / 144, 288);
  assert.ok(Math.abs(at30 - at60) < 0.4, `30 vs 60 Hz: ${at30} vs ${at60}`);
  assert.ok(Math.abs(at60 - at144) < 0.4, `60 vs 144 Hz: ${at60} vs ${at144}`);
  assert.ok(at144 > 5, 'the kart actually accelerated');
});

test('a long stall does not fast-forward the race', () => {
  const clock = createClock();
  let steps = 0;
  advance(clock, 30, () => { steps += 1; });
  assert.ok(steps <= 8);
  assert.equal(clock.accumulator, 0);
});

test('the kart drives, brakes, reverses and stays finite', () => {
  const car = createCar(track.start);
  for (let i = 0; i < 240; i++) step(car, track, { throttle: 1, brake: 0, steer: 0 }, STEP);
  const top = car.speed;
  assert.ok(top > 20 && top <= CAR.topSpeed + 0.5, `reaches kart speed, got ${top}`);
  assert.equal(speedKmh(car), Math.round(car.speed * 3.6));
  for (let i = 0; i < 360; i++) step(car, track, { throttle: 0, brake: 1, steer: 0 }, STEP);
  assert.ok(car.speed < 0, 'holding the brake selects reverse');
  assert.ok(car.speed > -CAR.reverseTopSpeed - 1, 'reverse is slow');
  assert.ok(Number.isFinite(car.position[0]) && Number.isFinite(car.position[1]));
});

test('a stationary kart cannot turn on the spot', () => {
  const car = createCar(track.start);
  const heading = car.heading;
  for (let i = 0; i < 120; i++) step(car, track, { throttle: 0, brake: 0, steer: 1 }, STEP);
  assert.ok(Math.abs(car.heading - heading) < 0.02, 'the grid is not a turntable');
});

test('rivals complete the race, stay on the road and finish close together', () => {
  for (const definition of TRACKS) {
    const built = buildTrack(definition);
    const field = createField(built, LAPS, 4);
    placeOnGrid(built, field);
    const race = createRace(built, LAPS);
    race.started = true;
    for (const racer of field) { racer.progress.started = true; racer.progress.lastDistance = racer.car.distanceAlong; }
    let t = 0;
    let offRoad = 0;
    while (t < 300 && !field.every((r) => r.progress.finished)) {
      tickRace(race, STEP);
      for (const racer of field) {
        step(racer.car, built, driveRival(racer.isPlayer ? { ...racer, line: 0, pace: 0.96, patience: 0.94 } : racer, built), STEP);
        updateProgress(racer.progress, built, racer, race.elapsed);
        if (!racer.car.onRoad) offRoad += STEP;
      }
      separate(field);
      t += STEP;
    }
    const order = standings(field, built);
    assert.ok(field.every((r) => r.progress.finished), `${built.name}: every kart finished`);
    const spread = order[order.length - 1].progress.finishTime - order[0].progress.finishTime;
    assert.ok(spread < 20, `${built.name}: the field finished within ${spread.toFixed(1)}s`);
    assert.ok(offRoad < 20, `${built.name}: ${offRoad.toFixed(1)}s of the field's time was off the road`);
  }
});

test('trackById falls back to the first track rather than returning nothing', () => {
  assert.equal(trackById('harbour-loop').id, 'harbour-loop');
  assert.equal(trackById('not-a-track').id, TRACKS[0].id);
});

test('a best time is only replaced by a quicker one', () => {
  assert.equal(isImprovement(30, null), true);
  assert.equal(isImprovement(29.9, 30), true);
  assert.equal(isImprovement(30, 30), false);
  assert.equal(isImprovement(0, 30), false);
  assert.equal(isImprovement(NaN, 30), false);
});
