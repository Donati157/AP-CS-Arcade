// Everything in Poly Kart that can be checked without drawing anything: the clock, checkpoint
// order, what counts as a valid finish, resets and the fixed timestep.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRun, tickRun, checkGates, applyReset, formatTime, formatDelta, isImprovement, RESET_MODES } from '../src/run.js';
import { buildTrack, queryTrack, poseAtGate } from '../src/track.js';
import { createCar, resetCar, step, createClock, advance, STEP, speedKmh } from '../src/physics.js';
import { TRACKS, trackById } from '../src/tracks.js';

const track = buildTrack(TRACKS[0]);

// A stand-in for the car that only carries what the gate logic reads.
const carAt = (distance, onRoad = true) => ({ distanceAlong: distance, onRoad, speed: 40 });

// Walks the car along the centre line in believable increments, collecting whatever gates fire.
// Gates are only credited on plausible movement, so tests have to drive rather than teleport.
function driveTo(run, built, distance, onRoad = true) {
  const events = [];
  let at = run.lastDistance;
  while (at < distance) {
    at = Math.min(distance, at + 8);
    const event = checkGates(run, built, carAt(at, onRoad));
    if (event) events.push(event);
  }
  return events;
}

test('time formatting uses minutes, seconds and milliseconds', () => {
  assert.equal(formatTime(0), '00:00.000');
  assert.equal(formatTime(9.5), '00:09.500');
  assert.equal(formatTime(61.004), '01:01.004');
  assert.equal(formatTime(600), '10:00.000');
  assert.equal(formatTime(null), '--:--.---');
  assert.equal(formatTime(NaN), '--:--.---');
});

test('a time that rounds up to a whole minute carries properly', () => {
  assert.equal(formatTime(59.9996), '01:00.000');
  assert.equal(formatTime(119.9999), '02:00.000');
});

test('the gap against the record is signed', () => {
  assert.equal(formatDelta(1.25), '+00:01.250');
  assert.equal(formatDelta(-0.4), '-00:00.400');
  assert.equal(formatDelta(null), '');
});

test('the clock only starts once the car moves, and never runs backwards', () => {
  const run = createRun(track);
  tickRun(run, 0.5, { speed: 0 });
  assert.equal(run.elapsed, 0, 'a stationary car does not burn time');
  assert.equal(run.started, false);
  tickRun(run, 0.5, { speed: 5 });
  assert.equal(run.started, true);
  tickRun(run, 0.25, { speed: 5 });
  assert.ok(run.elapsed > 0);
});

test('the clock keeps running while the car is stuck', () => {
  const run = createRun(track);
  tickRun(run, 0.1, { speed: 5 });
  const before = run.elapsed;
  for (let i = 0; i < 20; i++) tickRun(run, 0.1, { speed: 0 });
  assert.ok(run.elapsed > before + 1.9, 'being stopped does not pause the clock');
});

test('checkpoints must be taken in order', () => {
  const run = createRun(track);
  run.started = true;
  const gates = track.gates;
  // Teleporting past the last checkpoint scores nothing at all.
  assert.equal(checkGates(run, track, carAt(gates[2].distance + 5)), null);
  assert.equal(run.passed, 0);
  // Actually driving the track does, one gate at a time and in order.
  run.lastDistance = 0;
  const events = driveTo(run, track, gates[2].distance + 4);
  assert.deepEqual(events.map((e) => e.index), [1, 2, 3], 'each checkpoint fires once, in order');
  assert.equal(run.passed, 3);
});

test('driving straight to the finish without the checkpoints does not count', () => {
  const run = createRun(track);
  run.started = true;
  // Jump the whole track in one go, the way a cut across the scenery would look.
  const event = checkGates(run, track, carAt(track.finish.distance + 10));
  assert.equal(event, null, 'the finish is not live until every checkpoint is behind you');
  assert.equal(run.finished, false);
  assert.equal(run.finalTime, null);
  // Even resyncing and then crossing the line only skips to the first checkpoint, never the finish.
  run.lastDistance = track.finish.distance - 5;
  assert.equal(checkGates(run, track, carAt(track.finish.distance + 2)), null);
  assert.equal(run.finished, false);
});

test('a complete lap finishes and stops the clock', () => {
  const run = createRun(track);
  run.started = true;
  run.elapsed = 42.5;
  const events = driveTo(run, track, track.finish.distance + 2);
  const finish = events[events.length - 1];
  assert.equal(finish.kind, 'finish');
  assert.equal(run.finished, true);
  assert.equal(run.finalTime, 42.5);
  // Crossing again changes nothing.
  run.elapsed = 99;
  assert.equal(checkGates(run, track, carAt(track.finish.distance + 8)), null);
  assert.equal(run.finalTime, 42.5, 'the stored time is not overwritten by a second crossing');
});

test('going backwards over a gate scores nothing', () => {
  const run = createRun(track);
  run.started = true;
  run.lastDistance = track.gates[0].distance + 50;
  assert.equal(checkGates(run, track, carAt(track.gates[0].distance - 10)), null);
  assert.equal(run.passed, 0);
});

test('a gate only counts when the car is on the road', () => {
  const run = createRun(track);
  run.started = true;
  driveTo(run, track, track.gates[0].distance + 2, false);
  assert.equal(run.passed, 0, 'crossing a gate off the road scores nothing');
});

test('resetting to a checkpoint keeps the clock, starting over clears it', () => {
  const run = createRun(track);
  run.started = true;
  run.elapsed = 30;
  driveTo(run, track, track.gates[0].distance + 2);
  assert.equal(run.passed, 1);

  const back = applyReset(run, RESET_MODES.CHECKPOINT);
  assert.equal(back.gate, 0, 'returns to the checkpoint that was actually taken');
  assert.equal(run.elapsed, 30, 'the clock is untouched');
  assert.equal(run.passed, 1, 'the checkpoint stays taken');

  const over = applyReset(run, RESET_MODES.START);
  assert.equal(over.gate, -1);
  assert.equal(run.elapsed, 0);
  assert.equal(run.passed, 0);
  assert.equal(run.started, false);
  assert.equal(run.finished, false);
});

test('a best time is only replaced by a quicker one', () => {
  assert.equal(isImprovement(30, null), true, 'the first time always counts');
  assert.equal(isImprovement(29.9, 30), true);
  assert.equal(isImprovement(30, 30), false, 'matching is not beating');
  assert.equal(isImprovement(31, 30), false);
  assert.equal(isImprovement(0, 30), false, 'a zero time is not a time');
  assert.equal(isImprovement(NaN, 30), false);
});

test('every track builds, has ordered gates and a start on the road', () => {
  for (const definition of TRACKS) {
    const built = buildTrack(definition);
    assert.ok(built.length > 200, `${built.name} is long enough to be a track`);
    assert.equal(built.checkpointCount, definition.checkpoints.length + 1);
    let previous = 0;
    for (const gate of built.gates) {
      assert.ok(gate.distance > previous, `${built.name}: gates are in order`);
      previous = gate.distance;
    }
    assert.ok(built.finish.distance > previous, 'the finish is last');
    const probe = queryTrack(built, built.start.position, 0);
    assert.equal(probe.onRoad, true, `${built.name}: the car starts on the road`);
  }
});

test('no track crosses over itself at the same height', () => {
  // Two ribbons of road in the same place look wrong and, worse, confuse the lookup that decides
  // what is under the car. Sections that pass at clearly different heights are fine.
  for (const definition of TRACKS) {
    const built = buildTrack(definition);
    let tightest = Infinity;
    let where = '';
    for (let i = 0; i < built.samples.length; i++) {
      for (let j = i + 40; j < built.samples.length; j++) {
        const a = built.samples[i], b = built.samples[j];
        if (Math.abs(a.position[1] - b.position[1]) > 6) continue;
        const flat = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
        const clearance = flat - (a.width + b.width) / 2;
        if (clearance < tightest) { tightest = clearance; where = `samples ${i} and ${j}`; }
      }
    }
    assert.ok(tightest > 6, `${built.name}: only ${tightest.toFixed(1)} m between ${where}`);
  }
});

test('trackById falls back to the first track rather than returning nothing', () => {
  assert.equal(trackById('harbour-loop').id, 'harbour-loop');
  assert.equal(trackById('not-a-track').id, TRACKS[0].id);
});

test('a reset leaves no hidden momentum', () => {
  const car = createCar(track.start);
  car.speed = 60;
  car.slide = 12;
  car.verticalSpeed = -20;
  car.steering = 1;
  car.pitch = 0.4;
  car.roll = -0.3;
  car.spin = 2;
  car.tumble = 1;
  car.fell = true;
  resetCar(car, poseAtGate(track, 0));
  for (const key of ['speed', 'slide', 'verticalSpeed', 'steering', 'pitch', 'roll', 'spin', 'tumble']) {
    assert.equal(car[key], 0, `${key} is cleared by a reset`);
  }
  assert.equal(car.fell, false);
  assert.equal(car.grounded, true);
});

test('the simulation runs the same amount of driving whatever the frame rate', () => {
  const drive = (frameSeconds, frames) => {
    const car = createCar(track.start);
    const clock = createClock();
    for (let i = 0; i < frames; i++) {
      advance(clock, frameSeconds, (dt) => step(car, track, { throttle: 1, brake: 0, steer: 0 }, dt));
    }
    return car;
  };
  const at30 = drive(1 / 30, 60);      // two seconds
  const at60 = drive(1 / 60, 120);     // two seconds
  const at144 = drive(1 / 144, 288);   // two seconds
  assert.ok(Math.abs(at30.speed - at60.speed) < 0.6, `30 vs 60 Hz: ${at30.speed} vs ${at60.speed}`);
  assert.ok(Math.abs(at60.speed - at144.speed) < 0.6, `60 vs 144 Hz: ${at60.speed} vs ${at144.speed}`);
  assert.ok(at144.speed > 5, 'the car actually accelerated');
});

test('a long stall does not fast-forward the race', () => {
  const clock = createClock();
  let steps = 0;
  advance(clock, 30, () => { steps += 1; });
  assert.ok(steps <= 8, `a 30 second stall ran ${steps} steps, not the whole gap`);
  assert.equal(clock.accumulator, 0, 'the backlog is dropped rather than queued');
});

test('driving forward moves the car along the track and reports a speed', () => {
  const car = createCar(track.start);
  const before = car.distanceAlong;
  for (let i = 0; i < 240; i++) step(car, track, { throttle: 1, brake: 0, steer: 0 }, STEP);
  assert.ok(car.speed > 10, `the car should be moving, speed was ${car.speed}`);
  assert.ok(car.distanceAlong > before + 5, 'and it should have covered ground');
  assert.equal(speedKmh(car), Math.round(car.speed * 3.6));
  assert.ok(Number.isFinite(car.position[0]) && Number.isFinite(car.position[1]) && Number.isFinite(car.position[2]));
});

test('braking stops the car and then reverses it', () => {
  const car = createCar(track.start);
  for (let i = 0; i < 240; i++) step(car, track, { throttle: 1, brake: 0, steer: 0 }, STEP);
  const topSpeed = car.speed;
  for (let i = 0; i < 240; i++) step(car, track, { throttle: 0, brake: 1, steer: 0 }, STEP);
  assert.ok(car.speed < topSpeed, 'braking slows the car');
  assert.ok(car.speed < 0, 'holding the brake at a standstill selects reverse');
  assert.ok(car.speed > -11, `reverse is slow, was ${car.speed}`);
});

test('steering turns the car and the heading stays finite', () => {
  const car = createCar(track.start);
  const heading = car.heading;
  for (let i = 0; i < 180; i++) step(car, track, { throttle: 1, brake: 0, steer: 1 }, STEP);
  assert.notEqual(car.heading, heading, 'the car turned');
  assert.ok(Number.isFinite(car.heading));
});

test('a hundred runs leave the simulation healthy', () => {
  // Stands in for opening and closing the track over and over: state must not drift or blow up.
  for (let lap = 0; lap < 100; lap++) {
    const car = createCar(track.start);
    const run = createRun(track);
    for (let i = 0; i < 120; i++) {
      step(car, track, { throttle: 1, brake: 0, steer: (lap % 7) / 7 - 0.5 }, STEP);
      tickRun(run, STEP, car);
      checkGates(run, track, car);
    }
    assert.ok(Number.isFinite(car.position[0]) && Number.isFinite(car.speed), `lap ${lap} stayed finite`);
    assert.ok(Math.abs(car.speed) <= 130, `lap ${lap} did not run away: ${car.speed}`);
  }
});
