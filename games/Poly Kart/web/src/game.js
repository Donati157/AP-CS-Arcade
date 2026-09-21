// Puts the pieces together: one track, one car, one loop.
//
// The important rule in here is that there is exactly one animation frame in flight and exactly one
// set of listeners. `stop()` tears everything down, and `start()` is safe to call again afterwards,
// so opening and closing Poly Kart inside the arcade never stacks up loops.

import { Renderer, RendererError, perspective, lookAt, multiply, composeModel, identity } from './renderer.js';
import { SoftwareRenderer } from './software-renderer.js';
import { buildTrack, poseAtGate, queryTrack } from './track.js';
import { addGroundPlane, emptyGeometry } from './mesh.js';
import { buildCarBody, buildWheelPair, buildShadow, WHEEL } from './car-model.js';
import { createCar, resetCar, step, advance, createClock, speedKmh, STEP } from './physics.js';
import { createCamera, updateCamera, snapCamera } from './camera.js';
import { createRun, tickRun, checkGates, applyReset, RESET_MODES } from './run.js';
import { bestTime, recordTime } from './storage.js';

const FIELD_OF_VIEW = 70 * Math.PI / 180;   // wide, like the recordings
const STUCK_SECONDS = 1.6;                  // how long stationary before the reset hint appears

export class Game {
  constructor(canvas, hud, input) {
    this.canvas = canvas;
    this.hud = hud;
    this.input = input;
    // WebGL if the browser will give it to us, and the software renderer if it will not. Either way
    // the game itself is identical: same track, same physics, same camera, same rules.
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
    this.stuckFor = 0;
    this.pausedByVisibility = false;
    this.definition = null;
    this.contextLost = false;
    this.framesDrawn = 0;
    this.onVisibility = () => this.handleVisibility();
    document.addEventListener('visibilitychange', this.onVisibility);
    // A dropped GPU context is recoverable: the race keeps its state, the buffers are rebuilt.
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

  // Everything that lives on the GPU, kept apart from the track and the run so it can be rebuilt
  // after a context loss without disturbing the car, the clock or the checkpoints.
  uploadMeshes(definition) {
    this.renderer.disposeMeshes();
    const water = emptyGeometry();
    addGroundPlane(water, definition.waterLevel ?? -18, 1600, definition.palette.water);
    this.meshes = {
      road: this.renderer.upload(this.track.geometry.road),
      furniture: this.renderer.upload(this.track.geometry.furniture),
      scenery: this.renderer.upload(this.track.geometry.scenery),
      water: this.renderer.upload(water),
      body: this.renderer.upload(buildCarBody()),
      wheels: this.renderer.upload(buildWheelPair()),
      shadow: this.renderer.upload(buildShadow()),
    };
  }

  // Builds a track and puts the car on the line. Safe to call repeatedly.
  load(definition) {
    this.definition = definition;
    this.track = buildTrack(definition);
    this.uploadMeshes(definition);
    this.car = createCar(this.track.start);
    this.run = createRun(this.track);
    this.camera = createCamera(this.car);
    snapCamera(this.camera, this.car);
    this.best = bestTime(this.track.id);
    this.stuckFor = 0;
    this.hud.setTrack(this.track, this.best);
    this.hud.setMessage(null);
    this.hud.update(this.run, this.car, this.best);
    return this.track;
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

  // Leaving the tab must not fast-forward the race or corrupt the clock. The loop keeps running so
  // the page stays responsive, but the accumulator is thrown away on the way back in.
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
    const outcome = applyReset(this.run, mode);
    const pose = poseAtGate(this.track, outcome.gate);
    resetCar(this.car, pose);
    snapCamera(this.camera, this.car);
    this.stuckFor = 0;
    this.hud.setMessage(null);
    this.hud.flash(mode === RESET_MODES.START ? 'Back to the start line' : 'Back to the last checkpoint');
  }

  update(elapsed) {
    if (this.pausedByVisibility || document.hidden || this.contextLost) return;
    const request = this.input.takeResetRequest();
    if (request === 'start') this.respawn(RESET_MODES.START);
    else if (request === 'checkpoint' && !this.run.finished) this.respawn(RESET_MODES.CHECKPOINT);

    advance(this.clock, elapsed, (dt) => {
      if (!this.run.finished) {
        step(this.car, this.track, this.input.state, dt);
        tickRun(this.run, dt, this.car);
        const event = checkGates(this.run, this.track, this.car);
        if (event) this.handleGate(event);
      } else {
        // After the flag the car rolls to a stop rather than freezing mid-air.
        step(this.car, this.track, { throttle: 0, brake: 0.6, steer: 0 }, dt);
      }
      if (this.car.fell) this.respawn(RESET_MODES.CHECKPOINT);
    });

    updateCamera(this.camera, this.car, Math.min(elapsed, 0.1));

    // The stuck hint, exactly the two-level reset the recordings show.
    const stopped = Math.abs(this.car.speed) < 1.2 && this.run.started && !this.run.finished;
    this.stuckFor = stopped ? this.stuckFor + elapsed : 0;
    if (this.stuckFor > STUCK_SECONDS) {
      this.hud.setMessage(['Press R or Enter to return to the last checkpoint', 'Press T or Backspace to start over']);
    } else if (!this.run.finished) {
      this.hud.setMessage(null);
    }
    this.hud.update(this.run, this.car, this.best);
  }

  handleGate(event) {
    if (event.kind === 'checkpoint') {
      this.hud.flash(`Checkpoint ${event.index} of ${event.of}`);
      return;
    }
    // Finish. Store the time only when it is actually quicker.
    const outcome = recordTime(this.track.id, event.time);
    const previous = this.best;
    if (outcome.saved) this.best = outcome.best;
    this.hud.setMessage(null);
    if (this.onFinish) {
      this.onFinish({
        time: event.time,
        improved: outcome.saved,
        previous,
        best: this.best,
        improvement: previous === null ? null : previous - event.time,
        saved: outcome.saved,
      });
    }
  }

  render() {
    if (!this.meshes || this.contextLost) return;
    this.renderer.resize();
    const projection = perspective(FIELD_OF_VIEW, this.renderer.aspect, 0.4, 1600);
    const view = lookAt(this.camera.position, this.camera.target, [0, 1, 0]);
    const viewProjection = multiply(projection, view);
    this.renderer.beginFrame(viewProjection, this.track.palette.sky, this.camera.position);

    const world = identity();
    this.renderer.draw(this.meshes.water, world);
    this.renderer.draw(this.meshes.scenery, world);
    this.renderer.draw(this.meshes.road, world);
    this.renderer.draw(this.meshes.furniture, world);

    // The blob shadow sits on the road under the car and shrinks as the car climbs.
    const probe = queryTrack(this.track, this.car.position, this.car.trackIndex);
    const height = Math.max(0, this.car.position[1] - (probe.surfaceY + 1.2));
    if (probe.onRoad && height < 14) {
      const scale = Math.max(0.35, 1 - height / 18);
      const shadowModel = composeModel(
        [this.car.position[0], probe.surfaceY + 0.08, this.car.position[2]],
        this.car.heading + this.car.spin, 0, 0, scale,
      );
      this.renderer.draw(this.meshes.shadow, shadowModel, Math.min(0.75, 0.25 + height / 22), this.track.palette.road);
    }

    const bodyModel = composeModel(this.car.position, this.car.heading + this.car.spin, this.car.pitch, this.car.roll);
    this.renderer.draw(this.meshes.body, bodyModel);
    this.framesDrawn += 1;

    // Wheels: the front pair steers, both pairs spin.
    for (const [z, steer] of [[WHEEL.frontZ, this.car.steering * 0.45], [WHEEL.rearZ, 0]]) {
      const local = composeModel([0, 0, 0], 0, 0, 0);
      void local;
      const axle = offsetInCar(this.car, z);
      const model = composeModel(axle, this.car.heading + this.car.spin + steer, this.car.pitch, this.car.roll);
      // Spin is folded in as an extra rotation about the car's X axis.
      spinWheels(model, this.car.wheelSpin, this.car.heading + this.car.spin + steer);
      this.renderer.draw(this.meshes.wheels, model);
    }
    // The software path collects triangles and sorts them before filling; the GPU path has already
    // drawn everything by now and does not define this.
    if (this.renderer.present) this.renderer.present();
  }
}

// The world-space position of an axle, given how far forward it sits in the car.
function offsetInCar(car, forwardOffset) {
  const sin = Math.sin(car.heading + car.spin), cos = Math.cos(car.heading + car.spin);
  const lift = WHEEL.radius - 1.2 + 1.2;
  return [
    car.position[0] + sin * forwardOffset,
    car.position[1] + lift - 0.58,
    car.position[2] + cos * forwardOffset,
  ];
}

// Rolls a wheel pair about its own axle by rewriting the rotation part of its model matrix.
function spinWheels(model, angle, yaw) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  // Axle runs along the car's local X. Rebuild the basis: X stays, Y and Z rotate by `angle`.
  const axisX = [cy, 0, -sy];
  const axisY = [0, 1, 0];
  const axisZ = [sy, 0, cy];
  const newY = [
    axisY[0] * c + axisZ[0] * s, axisY[1] * c + axisZ[1] * s, axisY[2] * c + axisZ[2] * s,
  ];
  const newZ = [
    axisZ[0] * c - axisY[0] * s, axisZ[1] * c - axisY[1] * s, axisZ[2] * c - axisY[2] * s,
  ];
  model[0] = axisX[0]; model[1] = axisX[1]; model[2] = axisX[2];
  model[4] = newY[0]; model[5] = newY[1]; model[6] = newY[2];
  model[8] = newZ[0]; model[9] = newZ[1]; model[10] = newZ[2];
}

export { STEP, speedKmh };
