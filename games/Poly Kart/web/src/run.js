// The race: laps, checkpoints and the rules that decide whether a lap counts.
//
// Every kart on the grid, player or not, carries one of these. It records how far round the lap it
// is, which checkpoints it has taken, and how many laps it has completed. Position is worked out
// from the same numbers, so a kart is ahead because it has actually driven further, not because it
// happens to be nearer the finish line in a straight line.

import { loopDelta } from './track.js';

export const RESET_MODES = { CHECKPOINT: 'checkpoint', START: 'start' };

// The furthest a kart can legitimately travel along the centre line between two checks. At full
// speed a fixed step covers about a metre, so anything past this is not driving: it is the distance
// measurement jumping, which is how a kart cutting across the scenery would look.
const MAX_GATE_STEP = 30;

export function createProgress(track, totalLaps) {
  return {
    totalLaps,
    lap: 1,                 // the lap being driven, counting from one
    nextGate: 0,            // index into track.gates
    passed: 0,              // checkpoints taken on this lap
    checkpointCount: track.gates.length,
    lastDistance: 0,
    covered: 0,             // metres driven round the circuit, across every lap
    started: false,
    finished: false,
    finishTime: null,
    bestLap: null,
    lapStarted: 0,
    resets: 0,
  };
}

// Called once per fixed step, before the gate test, so the clock and the kart agree.
export function tickRace(race, dt) {
  if (race.over) return;
  if (!race.started) return;
  race.elapsed += dt;
}

export function createRace(track, totalLaps) {
  return { track, totalLaps, elapsed: 0, started: false, over: false, order: [] };
}

// Advances one kart's progress and reports anything worth showing.
//
// Gates are compared by distance along the centre line, and only the next one in the sequence can
// ever trigger. The finish line is dead until every checkpoint on the lap is behind you, which is
// what stops a kart cutting the course or sitting on the line collecting laps.
export function updateProgress(progress, track, racer, elapsed) {
  if (progress.finished || !progress.started) {
    progress.lastDistance = racer.car.distanceAlong;
    return null;
  }
  const from = progress.lastDistance;
  const to = racer.car.distanceAlong;
  const delta = loopDelta(from, to, track.length);
  progress.lastDistance = to;
  if (delta <= 0) return null;                    // going backwards never scores
  if (delta > MAX_GATE_STEP) return null;         // an implausible jump resyncs without scoring
  // You have to be near the road to trip a gate, but not perfectly on it. Requiring strict
  // on-road cost karts a whole lap for clipping a kerb at the wrong instant, which looks exactly
  // like a bug to whoever it happens to.
  if (Math.abs(racer.car.lateral) > racer.car.halfWidth + 4) return null;
  progress.covered += delta;

  // Did the arc we just drove contain the gate we are allowed to take next?
  const crossed = (gateDistance) => {
    const reach = loopDelta(from, gateDistance, track.length);
    return reach >= 0 && reach <= delta;
  };

  if (progress.nextGate < track.gates.length) {
    if (crossed(track.gates[progress.nextGate].distance)) {
      progress.nextGate += 1;
      progress.passed += 1;
      return { kind: 'checkpoint', index: progress.passed, of: progress.checkpointCount };
    }
    return null;
  }

  // Every checkpoint is behind us, so the line is live.
  if (crossed(0)) {
    const lapTime = elapsed - progress.lapStarted;
    progress.lapStarted = elapsed;
    if (progress.bestLap === null || lapTime < progress.bestLap) progress.bestLap = lapTime;
    progress.nextGate = 0;
    progress.passed = 0;
    if (progress.lap >= progress.totalLaps) {
      progress.finished = true;
      progress.finishTime = elapsed;
      return { kind: 'finish', time: elapsed, lapTime };
    }
    progress.lap += 1;
    return { kind: 'lap', lap: progress.lap, of: progress.totalLaps, lapTime, final: progress.lap === progress.totalLaps };
  }
  return null;
}

// How far round the whole race a kart has driven. Position is a sort on this.
export function raceProgress(progress, track, racer) {
  const lapPart = (progress.lap - 1) * track.length;
  return lapPart + racer.car.distanceAlong + progress.passed * 0.001;
}

// Sorts the field: anyone who has finished is placed by when they finished, everyone else by how
// far round they are.
export function standings(racers, track) {
  return [...racers].sort((a, b) => {
    if (a.progress.finished && b.progress.finished) return a.progress.finishTime - b.progress.finishTime;
    if (a.progress.finished) return -1;
    if (b.progress.finished) return 1;
    return raceProgress(b.progress, track, b) - raceProgress(a.progress, track, a);
  });
}

export function positionOf(racers, track, racer) {
  return standings(racers, track).indexOf(racer) + 1;
}

// Where a reset should put the kart. Returning to a checkpoint keeps the race running; starting
// over is only offered before the flag and puts this kart back on the grid.
export function applyReset(progress, mode) {
  progress.resets += 1;
  if (mode === RESET_MODES.START) {
    progress.lap = 1;
    progress.nextGate = 0;
    progress.passed = 0;
    progress.covered = 0;
    progress.started = false;
    progress.finished = false;
    progress.finishTime = null;
    progress.lastDistance = 0;
    return { gate: -1 };
  }
  return { gate: progress.nextGate - 1 };
}

// ---- Time formatting ---------------------------------------------------------------------------

// Formats seconds as MM:SS.mmm.
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

export function formatDelta(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '';
  return (seconds < 0 ? '-' : '+') + formatTime(Math.abs(seconds));
}

// Places are written the way a race writes them.
export function ordinal(place) {
  const suffix = place % 100 >= 11 && place % 100 <= 13 ? 'th'
    : place % 10 === 1 ? 'st' : place % 10 === 2 ? 'nd' : place % 10 === 3 ? 'rd' : 'th';
  return `${place}${suffix}`;
}

// A new time only replaces the stored one when it is genuinely quicker.
export function isImprovement(newTime, bestTime) {
  if (!Number.isFinite(newTime) || newTime <= 0) return false;
  if (bestTime === null || bestTime === undefined || !Number.isFinite(bestTime)) return true;
  return newTime < bestTime;
}
