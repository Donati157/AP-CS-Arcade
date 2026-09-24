// The field: the player's kart and the karts it is racing.
//
// Every kart on the grid runs the same physics. The only difference is where the steering and
// throttle come from: the player's from the keyboard, the rest from the policy below. That matters,
// because it means a rival cannot do anything the player cannot, and it cannot cheat its way round
// a corner it should have lost time in.
//
// The policy is deliberately simple and readable: look a distance up the road that grows with
// speed, aim at a point on your own racing line, and pick a speed from how sharp the road is
// between here and there. Different karts get a different line, a different lookahead and a
// different top speed, which is what makes a race rather than a procession.

import { queryTrack } from './track.js';
import { createCar, resetCar, CAR } from './physics.js';
import { createProgress } from './run.js';

export const RIVAL_COLOURS = [
  { body: '#3f7fb8', trim: '#eef4fa', name: 'Cobalt' },
  { body: '#33b07a', trim: '#eaf7f0', name: 'Fern' },
  { body: '#b657c4', trim: '#f6ecf8', name: 'Orchid' },
  { body: '#f2c53d', trim: '#fdf6e0', name: 'Amber' },
  { body: '#d8503f', trim: '#fcecea', name: 'Ember' },
];

export const PLAYER_COLOUR = { body: '#e8622c', trim: '#f5f1e6', name: 'You' };

// Grid slots: two columns, staggered back from the line the way a standing start is set out.
function gridPose(track, slot) {
  // Kept tight on purpose: a grid spread over twenty metres reaches back into the previous corner,
  // and karts should line up on a straight piece of road.
  const spacingBack = 5;
  const row = Math.floor(slot / 2);
  const side = slot % 2 === 0 ? -1 : 1;
  const back = 5 + row * spacingBack;
  // Walk backwards round the loop from the start line.
  let index = 0;
  let walked = 0;
  while (walked < back) {
    index = (index - 1 + track.samples.length) % track.samples.length;
    walked += 2.2;
  }
  const sample = track.samples[index];
  const lateral = side * Math.min(3.4, sample.width / 2 - 2.2);
  return {
    position: [
      sample.position[0] + sample.right[0] * lateral + sample.up[0] * 1.2,
      sample.position[1] + sample.right[1] * lateral + sample.up[1] * 1.2,
      sample.position[2] + sample.right[2] * lateral + sample.up[2] * 1.2,
    ],
    heading: Math.atan2(sample.forward[0], sample.forward[2]),
    index,
  };
}

export function createField(track, totalLaps, rivalCount) {
  const racers = [];
  // The player lines up at the back. Starting on pole with nobody ahead is a procession; starting
  // last means the whole race is spent actually racing something.
  const player = {
    isPlayer: true,
    name: PLAYER_COLOUR.name,
    colour: PLAYER_COLOUR,
    slot: rivalCount,
    car: createCar(gridPose(track, rivalCount)),
    progress: createProgress(track, totalLaps),
  };
  racers.push(player);
  for (let i = 0; i < rivalCount; i++) {
    const colour = RIVAL_COLOURS[i % RIVAL_COLOURS.length];
    const slot = i;
    racers.push({
      isPlayer: false,
      name: colour.name,
      colour,
      slot,
      car: createCar(gridPose(track, slot)),
      progress: createProgress(track, totalLaps),
      // Each rival drives its own line and its own pace, so they do not run in a single file.
      line: ((i % 3) - 1) * 2.4,
      lookahead: 15 + (i % 4) * 3,
      // A narrow spread on purpose: wide enough that the order changes, tight enough that the
      // field stays together instead of stringing out into a procession.
      pace: 0.94 + ((i * 7) % 11) / 160,
      patience: 0.92 + ((i * 5) % 7) / 80,
    });
  }
  return racers;
}

export function placeOnGrid(track, racers) {
  for (const racer of racers) {
    resetCar(racer.car, gridPose(track, racer.slot));
  }
}

// A sample index, wrapped round the loop.
const sampleAt = (track, index) => {
  const n = track.samples.length;
  return track.samples[((index % n) + n) % n];
};

// How tightly the road bends here, in radians per metre. One over this is the corner radius, which
// is what decides how fast anything can get round it.
function curvaturePerMetre(track, index, span, spacing) {
  const a = sampleAt(track, index);
  const b = sampleAt(track, index + span);
  let turn = Math.atan2(b.forward[0], b.forward[2]) - Math.atan2(a.forward[0], a.forward[2]);
  while (turn > Math.PI) turn -= Math.PI * 2;
  while (turn < -Math.PI) turn += Math.PI * 2;
  return Math.abs(turn) / (span * spacing);
}

// The input a rival would press this step.
//
// Two decisions: where to point, and how fast to be going when you get there. The first is an aim
// point a little way up the road on this driver's own line. The second comes from the tightest bend
// within braking distance and the grip the tyres actually have, which is why they lift before a
// corner instead of arriving at it flat out and bouncing off the barrier.
export function driveRival(racer, track) {
  const car = racer.car;
  const probe = queryTrack(track, car.position, car.trackIndex);
  const speed = Math.abs(car.speed);
  const spacing = track.length / track.samples.length;

  const aheadMetres = 8 + speed * 0.8;
  const reach = Math.max(3, Math.round(aheadMetres / spacing));
  const aim = sampleAt(track, probe.index + reach);

  // Hold this driver's line, but head for the middle when running out of road.
  const room = aim.width / 2 - 2.6;
  let line = Math.max(-room, Math.min(room, racer.line));
  if (Math.abs(probe.lateral) > probe.halfWidth - 1.6) line = 0;
  const target = [
    aim.position[0] + aim.right[0] * line,
    aim.position[1] + aim.right[1] * line,
    aim.position[2] + aim.right[2] * line,
  ];
  let want = Math.atan2(target[0] - car.position[0], target[2] - car.position[2]) - car.heading;
  while (want > Math.PI) want -= Math.PI * 2;
  while (want < -Math.PI) want += Math.PI * 2;
  const steer = Math.max(-1, Math.min(1, want * 1.7));

  // The sharpest bend between here and the end of braking distance sets the speed.
  const brakingMetres = 10 + (speed * speed) / (2 * CAR.brakePower);
  const scan = Math.max(3, Math.round(brakingMetres / spacing));
  let sharpest = 0;
  for (let i = 2; i <= scan; i += 3) sharpest = Math.max(sharpest, curvaturePerMetre(track, probe.index + i, 4, spacing));
  const radius = sharpest > 1e-4 ? 1 / sharpest : 1e5;
  const cornerSpeed = Math.sqrt(CAR.lateralGrip * radius) * racer.patience;
  const targetSpeed = Math.min(CAR.topSpeed * racer.pace, cornerSpeed);

  let throttle = 0;
  let brake = 0;
  if (speed < targetSpeed - 0.8) throttle = 1;
  else if (speed > targetSpeed + 2.2) brake = 1;
  else throttle = 0.4;

  // Facing the wrong way after a knock: back off and turn round rather than grinding the barrier.
  if (Math.abs(want) > 1.3) {
    throttle = speed > 6 ? 0 : 0.5;
    brake = speed > 6 ? 1 : 0;
  }
  return { throttle, brake, steer };
}

// Keeps karts from occupying the same patch of road. A gentle shove, not a crash, because a rival
// punting the player off on lap one is not fun.
//
// The speed penalty is deliberately one-off. Applying it every physics step, as this first did,
// compounds at 120 times a second: two karts touching for a single second came out of it at three
// per cent of their speed, which is what turned the opening lap into a crawl.
export function separate(racers) {
  const radius = 2.1;
  const touching = new Set();
  for (let i = 0; i < racers.length; i++) {
    for (let j = i + 1; j < racers.length; j++) {
      const a = racers[i].car;
      const b = racers[j].car;
      const dx = b.position[0] - a.position[0];
      const dz = b.position[2] - a.position[2];
      if (Math.abs(b.position[1] - a.position[1]) > 3) continue;
      const distance = Math.hypot(dx, dz);
      if (distance > radius * 2 || distance < 1e-4) continue;
      const overlap = (radius * 2 - distance) / 2;
      const nx = dx / distance;
      const nz = dz / distance;
      a.position[0] -= nx * overlap;
      a.position[2] -= nz * overlap;
      b.position[0] += nx * overlap;
      b.position[2] += nz * overlap;
      touching.add(i);
      touching.add(j);
      // Only the moment of first contact costs anything.
      if (!racers[i].wasTouching) racers[i].car.speed *= 0.93;
      if (!racers[j].wasTouching) racers[j].car.speed *= 0.93;
    }
  }
  racers.forEach((racer, index) => { racer.wasTouching = touching.has(index); });
}
