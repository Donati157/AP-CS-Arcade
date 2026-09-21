// Best times, kept in this browser only. There is no server and nothing leaves the machine.
//
// Every read and write is wrapped: private windows and blocked site data make localStorage throw,
// and a racing game should still be playable when that happens.

const KEY = 'poly-kart.best-times.v1';

function readAll() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(times) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(times));
    return true;
  } catch {
    return false;
  }
}

export function bestTime(trackId) {
  const value = readAll()[trackId];
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export function allBestTimes() {
  return readAll();
}

// Stores the time only when it beats what is already there, and reports what happened.
export function recordTime(trackId, seconds) {
  const times = readAll();
  const previous = typeof times[trackId] === 'number' ? times[trackId] : null;
  if (!Number.isFinite(seconds) || seconds <= 0) return { saved: false, previous, best: previous };
  if (previous !== null && seconds >= previous) return { saved: false, previous, best: previous };
  times[trackId] = seconds;
  const saved = writeAll(times);
  return { saved, previous, best: saved ? seconds : previous, improvement: previous === null ? null : previous - seconds };
}

export function clearTimes() {
  try {
    window.localStorage.removeItem(KEY);
  } catch { /* nothing to do */ }
}
