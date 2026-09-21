// A run: the clock, the checkpoints and the rules that decide whether a time counts.
//
// The reference recordings show the clock starting when the car starts moving, running without
// pause even while the car is stuck or being reset to a checkpoint, and stopping the instant the
// finish gate is crossed. A time only stands if every checkpoint was taken in order.

export const RESET_MODES = { CHECKPOINT: 'checkpoint', START: 'start' };

// The furthest the car can legitimately travel along the centre line between two gate checks. At
// full speed a fixed step covers about a metre, so anything past this is not driving: it is the
// distance measurement jumping, which happens when the nearest point on the road relocates across a
// switchback. Crediting a gate on one of those jumps is exactly how a player would skip a section.
const MAX_GATE_STEP = 30;

export function createRun(track) {
  return {
    trackId: track.id,
    checkpointCount: track.checkpointCount,
    nextGate: 0,               // index into track.gates; equal to gates.length means "finish next"
    passed: 0,
    elapsed: 0,
    started: false,
    finished: false,
    finalTime: null,
    lastDistance: 0,
    valid: true,
    resets: 0,
  };
}

// Called once per fixed step, before the checkpoint test, so the clock and the car agree.
export function tickRun(run, dt, car) {
  if (run.finished) return;
  if (!run.started) {
    if (Math.abs(car.speed) > 0.4) run.started = true;
    else return;
  }
  run.elapsed += dt;
}

// Checks whether the car has just crossed the gate it is allowed to cross next.
//
// Gates are compared by distance along the centre line, and only the next one in the sequence can
// ever trigger. That is what stops a player cutting across the scenery to the finish: the finish
// only counts once every checkpoint before it has been passed.
export function checkGates(run, track, car) {
  if (run.finished || !run.started) { run.lastDistance = car.distanceAlong; return null; }
  const from = run.lastDistance;
  const to = car.distanceAlong;
  run.lastDistance = to;
  if (to <= from) return null;                      // going backwards never scores
  if (to - from > MAX_GATE_STEP) return null;       // an implausible jump resyncs without scoring
  if (!car.onRoad) return null;                     // you have to be on the road to trip a gate

  if (run.nextGate < track.gates.length) {
    const gate = track.gates[run.nextGate];
    if (from < gate.distance && to >= gate.distance) {
      run.nextGate += 1;
      run.passed += 1;
      return { kind: 'checkpoint', index: run.passed, of: run.checkpointCount, split: run.elapsed };
    }
    return null;
  }

  // Every checkpoint is behind us, so the finish line is live.
  if (from < track.finish.distance && to >= track.finish.distance) {
    run.finished = true;
    run.passed += 1;
    run.finalTime = run.elapsed;
    return { kind: 'finish', time: run.elapsed, of: run.checkpointCount };
  }
  return null;
}

// Where a reset should put the car. Returning to a checkpoint keeps the clock running, exactly as
// the reference does; starting over puts everything back to zero.
export function applyReset(run, mode) {
  run.resets += 1;
  if (mode === RESET_MODES.START) {
    run.nextGate = 0;
    run.passed = 0;
    run.elapsed = 0;
    run.started = false;
    run.finished = false;
    run.finalTime = null;
    run.lastDistance = 0;
    return { gate: -1 };
  }
  // Back to the last gate that was actually taken. -1 means the start line.
  run.lastDistance = 0;
  return { gate: run.nextGate - 1 };
}

// ---- Time formatting ---------------------------------------------------------------------------

// Formats seconds as M:SS.mmm, the precision the reference HUD uses.
export function formatTime(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '--:--.---';
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const rest = clamped - minutes * 60;
  const whole = Math.floor(rest);
  const milliseconds = Math.round((rest - whole) * 1000);
  // Rounding can tip 59.9996 over the minute; carry it properly rather than printing 59.1000.
  if (milliseconds === 1000) return formatTime(minutes * 60 + whole + 1);
  return `${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// The signed gap against the record, written the way a split is written: +0.412 or -1.009.
export function formatDelta(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '';
  const sign = seconds < 0 ? '-' : '+';
  return sign + formatTime(Math.abs(seconds));
}

// ---- Best times --------------------------------------------------------------------------------

// A new time only replaces the stored one when it is genuinely quicker, so a slow run can never
// overwrite a good one.
export function isImprovement(newTime, bestTime) {
  if (!Number.isFinite(newTime) || newTime <= 0) return false;
  if (bestTime === null || bestTime === undefined || !Number.isFinite(bestTime)) return true;
  return newTime < bestTime;
}
