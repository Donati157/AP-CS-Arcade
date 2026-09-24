// Puts the pieces together: one circuit, a grid of karts, one loop.
//
// There is exactly one animation frame in flight and exactly one set of listeners. `stop()` tears
// everything down and `start()` is safe to call again afterwards, so opening and closing Poly Kart
// inside the arcade never stacks up loops.

import { Renderer, RendererError, perspective, lookAt, multiply, composeModel, identity } from './renderer.js';
import { SoftwareRenderer } from './software-renderer.js';
import { buildTrack, poseAtGate, queryTrack } from './track.js';
import { addGroundPlane, emptyGeometry, colourFromHex } from './mesh.js';
import { buildCarBody, buildWheelPair, buildShadow, WHEEL } from './car-model.js';
import { createCar, resetCar, step, advance, createClock, speedKmh, STEP, CAR } from './physics.js';
import { createCamera, updateCamera, snapCamera } from './camera.js';
import {
  createRace, tickRace, updateProgress, applyReset, standings, positionOf, RESET_MODES,
} from './run.js';
import { createField, placeOnGrid, driveRival, separate } from './racers.js';
import { bestTime, recordTime } from './storage.js';

const STUCK_SECONDS = 1.8;
const COUNTDOWN_STEPS = ['3', '2', '1', 'GO'];
const COUNTDOWN_STEP_SECONDS = 0.7;
const TOTAL_LAPS = 3;
const RIVALS = 4;

// A fixed vertical field is wrong on a phone: a tall viewport then shows the same width of road
// with a huge band of sky above it. The angle narrows as the screen gets taller so the kart stays
// large and the horizon sits where a racing game puts it.
function fieldOfView(aspect, speedFraction) {
  const base = aspect >= 1.5 ? 70 : aspect >= 1.15 ? 66 : aspect >= 0.85 ? 60 : 54;
  return (base + 7 * speedFraction) * Math.PI / 180;
}

export class Game {
  constructor(canvas, hud, input) {
    this.canvas = canvas;
    this.hud = hud;
    this.input = input;
    try {
      this.renderer = new Renderer(canvas);
      this.software = false;
    } catch (error) {
      if (!(error instanceof RendererError) || error.stage !== 'context') throw error;
      this.renderer = new SoftwareRenderer(canvas);
      this.software = true;
      this.contextFallbackReason = error;
    }
    this.frame = 0;
    this.running = false;
    this.lastTime = 0;
    this.clock = createClock();
    this.onFinish = null;
    this.meshes = null;
    this.track = null;
    this.definition = null;
    this.contextLost = false;
    this.framesDrawn = 0;
    this.pausedByVisibility = false;
    this.onVisibility = () => this.handleVisibility();
    document.addEventListener('visibilitychange', this.onVisibility);
    this.renderer.onContextLost = () => {
      this.contextLost = true;
      this.meshes = null;
      this.hud.setMessage(['The graphics context was interrupted', 'Hold on, it is coming back']);
    };
    this.renderer.onContextRestored = () => {
      this.contextLost = false;
      if (this.definition) this.uploadMeshes(this.definition);
      this.hud.setMessage(null);
      this.hud.flash('Graphics restored');
    };
  }

  // Everything that lives on the GPU, kept apart from the race so it can be rebuilt after a context
  // loss without disturbing the karts, the clock or the laps.
  uploadMeshes(definition) {
    this.renderer.disposeMeshes();
    const water = emptyGeometry();
    addGroundPlane(water, definition.waterLevel ?? -18, 1600, definition.palette.water);
    this.meshes = {
      road: this.renderer.upload(this.track.geometry.road),
      furniture: this.renderer.upload(this.track.geometry.furniture),
      scenery: this.renderer.upload(this.track.geometry.scenery),
      water: this.renderer.upload(water),
      wheels: this.renderer.upload(buildWheelPair()),
      shadow: this.renderer.upload(buildShadow()),
      // One body mesh per livery, so every kart on the grid is a different colour.
      bodies: this.racers.map((racer) => this.renderer.upload(
        buildCarBody(colourFromHex(racer.colour.body), colourFromHex(racer.colour.trim)),
      )),
    };
  }

  load(definition) {
    this.definition = definition;
    this.track = buildTrack(definition);
    this.racers = createField(this.track, TOTAL_LAPS, RIVALS);
    this.player = this.racers[0];
    this.race = createRace(this.track, TOTAL_LAPS);
    this.uploadMeshes(definition);
    this.camera = createCamera(this.player.car);
    snapCamera(this.camera, this.player.car);
    this.best = bestTime(this.track.id);
    this.armCountdown();
    this.stuckFor = 0;
    this.wasOnRoad = true;
    this.wasHittingWall = false;
    this.hud.setTrack(this.track, this.best, TOTAL_LAPS);
    this.hud.setMessage(null);
    this.hud.update(this.race, this.player, this.racers, this.track, this.best);
    return this.track;
  }

  armCountdown() {
    placeOnGrid(this.track, this.racers);
    this.countdown = 0;
    this.countdownStep = -1;
    this.armed = false;
    this.race.elapsed = 0;
    this.race.started = false;
    this.race.over = false;
    this.race.order = [];
    for (const racer of this.racers) {
      racer.progress.lap = 1;
      racer.progress.nextGate = 0;
      racer.progress.passed = 0;
      racer.progress.covered = 0;
      racer.progress.started = false;
      racer.progress.finished = false;
      racer.progress.finishTime = null;
      racer.progress.bestLap = null;
      racer.progress.lapStarted = 0;
      racer.progress.lastDistance = racer.car.distanceAlong;
    }
    this.hud.setCountdown(COUNTDOWN_STEPS[0]);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.clock.accumulator = 0;
    const tick = (now) => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(tick);
      const elapsed = Math.max(0, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.update(elapsed);
      this.render();
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  handleVisibility() {
    if (document.hidden) {
      this.pausedByVisibility = true;
      this.input.releaseAll();
    } else if (this.pausedByVisibility) {
      this.pausedByVisibility = false;
      this.lastTime = performance.now();
      this.clock.accumulator = 0;
    }
  }

  dispose() {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.renderer.disposeMeshes();
    this.meshes = null;
  }

  respawn(mode) {
    if (mode === RESET_MODES.START) {
      this.armCountdown();
      snapCamera(this.camera, this.player.car);
      this.hud.setMessage(null);
      this.hud.flash('Back to the grid');
      return;
    }
    const outcome = applyReset(this.player.progress, mode);
    const pose = poseAtGate(this.track, outcome.gate);
    resetCar(this.player.car, pose);
    this.player.progress.lastDistance = this.player.car.distanceAlong;
    snapCamera(this.camera, this.player.car);
    this.stuckFor = 0;
    this.hud.setMessage(null);
    this.hud.flash('Back to the last checkpoint');
  }

  // Runs the lights. Returns the input the player's kart may act on this frame.
  tickCountdown(elapsed) {
    if (this.armed) return this.input.state;
    this.countdown += elapsed;
    const stepIndex = Math.min(COUNTDOWN_STEPS.length - 1, Math.floor(this.countdown / COUNTDOWN_STEP_SECONDS));
    if (stepIndex !== this.countdownStep) {
      this.countdownStep = stepIndex;
      this.hud.setCountdown(COUNTDOWN_STEPS[stepIndex]);
    }
    if (this.countdown >= COUNTDOWN_STEPS.length * COUNTDOWN_STEP_SECONDS) {
      this.armed = true;
      this.race.started = true;
      for (const racer of this.racers) racer.progress.started = true;
      this.hud.setCountdown(null);
      return this.input.state;
    }
    // Steering is allowed while waiting, which feels better than a frozen kart, but nothing moves.
    return { throttle: 0, brake: 0, steer: this.input.state.steer };
  }

  update(elapsed) {
    if (this.pausedByVisibility || document.hidden || this.contextLost) return;
    const request = this.input.takeResetRequest();
    if (request === 'start') this.respawn(RESET_MODES.START);
    else if (request === 'checkpoint' && !this.player.progress.finished) this.respawn(RESET_MODES.CHECKPOINT);

    const allowed = this.tickCountdown(elapsed);

    advance(this.clock, elapsed, (dt) => {
      tickRace(this.race, dt);
      for (const racer of this.racers) {
        const finished = racer.progress.finished;
        const input = racer.isPlayer
          ? (finished ? { throttle: 0, brake: 0.6, steer: 0 } : allowed)
          : (this.armed ? driveRival(racer, this.track) : { throttle: 0, brake: 0, steer: 0 });
        step(racer.car, this.track, input, dt);
        const event = updateProgress(racer.progress, this.track, racer, this.race.elapsed);
        if (event) this.handleEvent(racer, event);
        if (racer.car.fell) {
          const outcome = applyReset(racer.progress, RESET_MODES.CHECKPOINT);
          resetCar(racer.car, poseAtGate(this.track, outcome.gate));
          racer.progress.lastDistance = racer.car.distanceAlong;
          if (racer.isPlayer) { snapCamera(this.camera, this.player.car); this.hud.flash('Back on track'); }
        }
      }
      separate(this.racers);
    });

    updateCamera(this.camera, this.player.car, Math.min(elapsed, 0.1), this.renderer.aspect);

    const car = this.player.car;
    if (car.onRoad !== this.wasOnRoad) {
      this.wasOnRoad = car.onRoad;
      if (!car.onRoad && this.race.started && !this.player.progress.finished) this.hud.flash('Off track');
    }
    if (car.hitWall && !this.wasHittingWall) this.hud.flash('Barrier');
    this.wasHittingWall = car.hitWall;

    const stopped = Math.abs(car.speed) < 1.2 && this.race.started && !this.player.progress.finished;
    this.stuckFor = stopped ? this.stuckFor + elapsed : 0;
    if (this.stuckFor > STUCK_SECONDS) {
      this.hud.setMessage(['Press R or Enter to return to the last checkpoint', 'Press T or Backspace to restart the race']);
    } else if (!this.player.progress.finished) {
      this.hud.setMessage(null);
    }
    this.hud.update(this.race, this.player, this.racers, this.track, this.best);
  }

  handleEvent(racer, event) {
    if (event.kind === 'finish') {
      this.race.order.push(racer);
      if (!racer.isPlayer) return;
      this.finishRace(event);
      return;
    }
    if (!racer.isPlayer) return;
    if (event.kind === 'checkpoint') {
      this.hud.flash(`Checkpoint ${event.index}/${event.of}`, 'is-good');
    } else if (event.kind === 'lap') {
      this.hud.flash(event.final ? 'Final lap' : `Lap ${event.lap} of ${event.of}`, event.final ? 'is-warn' : 'is-good');
    }
  }

  finishRace(event) {
    this.race.over = true;
    const place = this.race.order.indexOf(this.player) + 1;
    const outcome = recordTime(this.track.id, event.time);
    const previous = this.best;
    if (outcome.saved) this.best = outcome.best;
    this.hud.setMessage(null);
    // Rivals keep circulating for a moment so the finish does not freeze the world.
    if (this.onFinish) {
      this.onFinish({
        time: event.time,
        place,
        field: this.racers.length,
        bestLap: this.player.progress.bestLap,
        improved: outcome.saved,
        previous,
        best: this.best,
        improvement: previous === null ? null : previous - event.time,
        order: standings(this.racers, this.track).map((r) => ({ name: r.name, isPlayer: r.isPlayer, finished: r.progress.finished, time: r.progress.finishTime, lap: r.progress.lap })),
      });
    }
  }

  render() {
    if (!this.meshes || this.contextLost) return;
    this.renderer.resize();
    const speedFraction = Math.min(1, Math.abs(this.player.car.speed) / CAR.topSpeed);
    const projection = perspective(fieldOfView(this.renderer.aspect, speedFraction), this.renderer.aspect, 0.4, 1600);
    const view = lookAt(this.camera.position, this.camera.target, [0, 1, 0]);
    const viewProjection = multiply(projection, view);
    this.renderer.beginFrame(viewProjection, this.track.palette.sky, this.camera.position);

    const world = identity();
    this.renderer.draw(this.meshes.water, world);
    this.renderer.draw(this.meshes.scenery, world);
    this.renderer.draw(this.meshes.road, world);
    this.renderer.draw(this.meshes.furniture, world);

    for (let i = 0; i < this.racers.length; i++) this.drawKart(this.racers[i], this.meshes.bodies[i]);
    if (this.renderer.present) this.renderer.present();
    this.framesDrawn += 1;
  }

  drawKart(racer, bodyMesh) {
    const car = racer.car;
    const probe = queryTrack(this.track, car.position, car.trackIndex);
    const height = Math.max(0, car.position[1] - (probe.surfaceY + 1.2));
    if (probe.onRoad && height < 14) {
      const scale = Math.max(0.35, 1 - height / 18);
      const shadowModel = composeModel(
        [car.position[0], probe.surfaceY + 0.08, car.position[2]],
        car.heading + car.spin, 0, 0, scale,
      );
      this.renderer.draw(this.meshes.shadow, shadowModel, Math.min(0.75, 0.25 + height / 22), this.track.palette.road);
    }
    const bodyModel = composeModel(car.position, car.heading + car.spin, car.pitch, car.roll);
    this.renderer.draw(bodyMesh, bodyModel);
    for (const [z, steer] of [[WHEEL.frontZ, car.steering * 0.45], [WHEEL.rearZ, 0]]) {
      const axle = offsetInCar(car, z);
      const model = composeModel(axle, car.heading + car.spin + steer, car.pitch, car.roll);
      spinWheels(model, car.wheelSpin, car.heading + car.spin + steer);
      this.renderer.draw(this.meshes.wheels, model);
    }
  }
}

// The world-space position of an axle, given how far forward it sits in the kart.
function offsetInCar(car, forwardOffset) {
  const sin = Math.sin(car.heading + car.spin), cos = Math.cos(car.heading + car.spin);
  return [
    car.position[0] + sin * forwardOffset,
    car.position[1] - 0.58 + WHEEL.radius,
    car.position[2] + cos * forwardOffset,
  ];
}

// Rolls a wheel pair about its own axle by rewriting the rotation part of its model matrix.
function spinWheels(model, angle, yaw) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const axisX = [cy, 0, -sy];
  const axisY = [0, 1, 0];
  const axisZ = [sy, 0, cy];
  const newY = [axisY[0] * c + axisZ[0] * s, axisY[1] * c + axisZ[1] * s, axisY[2] * c + axisZ[2] * s];
  const newZ = [axisZ[0] * c - axisY[0] * s, axisZ[1] * c - axisY[1] * s, axisZ[2] * c - axisY[2] * s];
  model[0] = axisX[0]; model[1] = axisX[1]; model[2] = axisX[2];
  model[4] = newY[0]; model[5] = newY[1]; model[6] = newY[2];
  model[8] = newZ[0]; model[9] = newZ[1]; model[10] = newZ[2];
}

export { STEP, speedKmh, positionOf, TOTAL_LAPS };
