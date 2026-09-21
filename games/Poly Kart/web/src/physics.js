// The driving model.
//
// This is an arcade racer, not a vehicle simulation. The car has a heading, a speed along that
// heading and a small amount of sideways slide. Steering turns the heading; grip pulls the sideways
// slide back towards zero. That is enough to feel responsive and stay predictable, and it is short
// enough to read in one sitting.
//
// Every number below is in metres, seconds and radians. Speeds shown to the player are converted to
// km/h in the HUD.

import { queryTrack } from './track.js';

export const STEP = 1 / 120;          // the simulation always advances in fixed slices
const MAX_STEPS_PER_FRAME = 8;        // if the tab stalls, catch up a little then give up

export const CAR = {
  enginePower: 78,          // metres per second per second at full throttle from a standstill
  topSpeed: 108,            // about 390 km/h
  reverseTopSpeed: 9.5,        // about 34 km/h: enough to get unstuck, not a way round the track
  brakePower: 62,             // hard, but it still takes a moment: about 55 m from full speed
  coastDrag: 0.62,          // how quickly speed bleeds off with no throttle
  rollingResistance: 0.16,     // per second, not per step
  steerRate: 2.9,           // radians per second at low speed
  steerAtSpeed: 0.34,       // how much of that is left at top speed
  steerReturn: 7.0,         // how fast the wheels straighten when you let go
  grip: 7.2,                // how hard the car resists sliding sideways
  slideGrip: 3.4,           // grip while braking hard, which lets the back step out
  gravity: 26,
  airSteer: 0.55,           // fraction of normal steering available with no wheels down
  offRoadDrag: 3.2,         // the verge is slow, but it is not a wall
  wallBounce: 0.32,
  wallScrub: 0.55,
  respawnBelow: 26,         // metres under the road before the car counts as fallen
};

export function createCar(pose) {
  return {
    position: [...pose.position],
    heading: pose.heading,
    speed: 0,
    slide: 0,
    verticalSpeed: 0,
    steering: 0,
    pitch: 0,
    roll: 0,
    spin: 0,                 // extra yaw while tumbling through the air
    tumble: 0,
    grounded: true,
    onRoad: true,
    wheelSpin: 0,
    trackIndex: 0,
    distanceAlong: 0,
    fell: false,
    hitWall: false,
  };
}

export function resetCar(car, pose) {
  car.position = [...pose.position];
  car.heading = pose.heading;
  car.speed = 0;
  car.slide = 0;
  car.verticalSpeed = 0;
  car.steering = 0;
  car.pitch = 0;
  car.roll = 0;
  car.spin = 0;
  car.tumble = 0;
  car.grounded = true;
  car.onRoad = true;
  car.wheelSpin = 0;
  car.fell = false;
  car.hitWall = false;
  // trackIndex is left alone on purpose: it is the search hint, and the new pose is near it.
}

// Advances the world by one fixed slice.
export function step(car, track, input, dt = STEP) {
  const probe = queryTrack(track, car.position, car.trackIndex);
  car.trackIndex = probe.index;
  car.distanceAlong = probe.distanceAlong;
  car.hitWall = false;

  const rideHeight = 1.2;
  const groundY = probe.surfaceY + rideHeight;
  const wasGrounded = car.grounded;
  car.grounded = car.position[1] <= groundY + 0.35 && probe.onRoad;
  car.onRoad = probe.onRoad;

  // ---- Steering. Full lock at walking pace, much less of it at speed, so the car stays settled. --
  const speedFraction = Math.min(1, Math.abs(car.speed) / CAR.topSpeed);
  const steerAuthority = CAR.steerRate * (1 - (1 - CAR.steerAtSpeed) * speedFraction);
  const target = input.steer * (car.grounded ? 1 : CAR.airSteer);
  car.steering += (target - car.steering) * Math.min(1, CAR.steerReturn * dt);
  const direction = car.speed < -0.5 ? -1 : 1;
  car.heading += car.steering * steerAuthority * dt * direction * Math.min(1, Math.abs(car.speed) / 6 + 0.12);

  // ---- Engine, brakes and reverse. -------------------------------------------------------------
  if (car.grounded) {
    if (input.throttle > 0) {
      const headroom = Math.max(0, 1 - car.speed / CAR.topSpeed);
      car.speed += CAR.enginePower * input.throttle * headroom * dt;
    }
    if (input.brake > 0) {
      if (car.speed > 0.5) car.speed -= CAR.brakePower * input.brake * dt;
      else car.speed = Math.max(-CAR.reverseTopSpeed, car.speed - CAR.enginePower * 0.45 * input.brake * dt);
    }
    if (input.throttle === 0 && input.brake === 0) {
      car.speed -= car.speed * CAR.coastDrag * dt;
    }
    car.speed -= car.speed * CAR.rollingResistance * dt;
    if (!probe.onRoad) car.speed -= car.speed * CAR.offRoadDrag * dt;
    if (Math.abs(car.speed) < 0.05 && input.throttle === 0 && input.brake === 0) car.speed = 0;
  }

  // ---- Sideways slide. Turning throws the car outwards; grip pulls it back. ---------------------
  if (car.grounded) {
    const cornering = car.steering * steerAuthority * car.speed;
    car.slide += cornering * 0.045;
    const grip = input.brake > 0.5 && car.speed > 12 ? CAR.slideGrip : CAR.grip;
    car.slide -= car.slide * Math.min(1, grip * dt);
  } else {
    car.slide -= car.slide * Math.min(1, 1.2 * dt);
  }

  // ---- Move. ------------------------------------------------------------------------------------
  const forwardX = Math.sin(car.heading), forwardZ = Math.cos(car.heading);
  const rightX = Math.cos(car.heading), rightZ = -Math.sin(car.heading);
  car.position[0] += (forwardX * car.speed + rightX * car.slide) * dt;
  car.position[2] += (forwardZ * car.speed + rightZ * car.slide) * dt;

  // ---- Up and down. ------------------------------------------------------------------------------
  const after = queryTrack(track, car.position, car.trackIndex);
  car.trackIndex = after.index;
  const surface = after.surfaceY + rideHeight;
  if (car.grounded && after.onRoad) {
    // Follow the road, but let a crest throw the car into the air instead of gluing it down.
    const drop = car.position[1] - surface;
    if (drop > 0.6 && car.speed > 14) {
      car.verticalSpeed = Math.max(car.verticalSpeed, (drop / Math.max(dt, 1e-4)) * 0.06);
      car.grounded = false;
    } else {
      car.position[1] = surface;
      car.verticalSpeed = 0;
    }
  } else {
    car.verticalSpeed -= CAR.gravity * dt;
    car.position[1] += car.verticalSpeed * dt;
    if (after.onRoad && car.position[1] <= surface && car.verticalSpeed <= 0) {
      car.position[1] = surface;
      // Landing costs a little speed and cancels the tumble.
      car.speed *= car.tumble > 0.6 ? 0.55 : 0.94;
      car.verticalSpeed = 0;
      car.grounded = true;
      car.tumble = 0;
      car.spin = 0;
    }
  }
  if (!wasGrounded && car.grounded) car.spin = 0;

  // ---- Barriers. A shallow hit scrubs speed, a square hit pushes the car back onto the road. ----
  if (after.hasWall) {
    const limit = after.halfWidth - 0.5;
    if (Math.abs(after.lateral) > limit) {
      const side = Math.sign(after.lateral);
      const overlap = Math.abs(after.lateral) - limit;
      car.position[0] -= after.right[0] * side * overlap;
      car.position[1] -= after.right[1] * side * overlap;
      car.position[2] -= after.right[2] * side * overlap;
      car.slide = -car.slide * CAR.wallBounce - side * 2;
      car.speed *= CAR.wallScrub;
      car.hitWall = true;
    }
  }

  // ---- Attitude. The body leans with the road and with cornering load. --------------------------
  if (car.grounded) {
    const targetPitch = Math.asin(Math.max(-1, Math.min(1, -after.forward[1])));
    const targetRoll = Math.asin(Math.max(-1, Math.min(1, -after.right[1]))) - car.slide * 0.012;
    car.pitch += (targetPitch - car.pitch) * Math.min(1, 9 * dt);
    car.roll += (targetRoll - car.roll) * Math.min(1, 9 * dt);
  } else {
    // In the air the car keeps turning slowly, which reads as a tumble without spinning wildly.
    car.tumble = Math.min(1, car.tumble + dt * 0.9);
    car.spin += dt * 1.5 * car.tumble;
    car.pitch += (Math.min(0.6, Math.max(-0.6, -car.verticalSpeed * 0.02)) - car.pitch) * Math.min(1, 3 * dt);
    car.roll += (car.slide * 0.01 - car.roll) * Math.min(1, 2 * dt);
  }

  car.wheelSpin += car.speed * dt * 1.6;
  // Fallen clean off the world: the run manager turns this into a respawn.
  if (car.position[1] < after.surfaceY - CAR.respawnBelow) car.fell = true;
  return car;
}

// Runs as many fixed slices as the elapsed wall-clock time has earned. The leftover is carried over,
// so a 144 Hz screen and a 30 Hz screen simulate exactly the same amount of driving per second.
export function createClock() {
  return { accumulator: 0 };
}

export function advance(clock, elapsedSeconds, apply) {
  clock.accumulator += Math.min(elapsedSeconds, 0.25);   // a long stall never fast-forwards the race
  let steps = 0;
  while (clock.accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
    apply(STEP);
    clock.accumulator -= STEP;
    steps += 1;
  }
  if (steps === MAX_STEPS_PER_FRAME) clock.accumulator = 0;
  return steps;
}

export const speedKmh = (car) => Math.round(Math.abs(car.speed) * 3.6);
