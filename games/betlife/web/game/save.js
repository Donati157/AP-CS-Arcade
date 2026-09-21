// Saving, loading and migrating older saves. The save is the whole game state as JSON.
import { createEventMemory } from './events/engine.js';
import { createCareer } from './career.js';
import { createEducation } from './education.js';
import { seedFromClock } from './rng.js';

export const STORAGE_KEY = 'betlife.web.save';
export const SAVE_VERSION = 2;

export function saveGame(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    return false; // storage unavailable (private mode): the game stays in memory
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return restoreState(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

export function clearSavedGame() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* nothing to clear */ }
}

// Turns parsed JSON into a usable state, migrating older shapes. Returns null when it cannot.
export function restoreState(raw) {
  if (!raw || typeof raw !== 'object' || !raw.player || !raw.profile) return null;
  let state = raw;
  if (!state.version || state.version < 2) state = migrateV1(state);
  if (!state) return null;
  if (!isValid(state)) return null;
  return state;
}

export function isValid(state) {
  const p = state.player;
  if (!p || typeof p.age !== 'number' || !Number.isFinite(p.age)) return false;
  for (const stat of ['happiness', 'health', 'smarts', 'looks']) if (typeof p[stat] !== 'number' || !Number.isFinite(p[stat])) return false;
  if (typeof state.rngState !== 'number' || !Array.isArray(state.timeline) || !Array.isArray(state.relationships)) return false;
  if (!state.education || !state.career || !state.events || !Array.isArray(state.pending)) return false;
  return true;
}

// Version 1 saves (the first public build) had a different career and relationship shape.
// Everything that can be kept is kept; the rest starts fresh without touching the player's age or journal.
function migrateV1(old) {
  try {
    const p = old.player;
    const ROLES = { Mother: 'mother', Father: 'father', Friend: 'friend' };
    let nextPersonId = 1;
    const relationships = (old.relationships || []).map((r) => ({
      id: `p${nextPersonId++}`, name: r.name, gender: r.type === 'Mother' ? 'female' : r.type === 'Father' ? 'male' : 'female',
      role: ROLES[r.type] || 'friend', age: r.age || Math.max(0, p.age), closeness: r.level ?? 50, occupation: r.job || '', alive: true,
      interactedThisYear: false, yearActions: {}, since: 0, retired: false,
    }));
    const [firstName, ...rest] = String(p.name || 'Alex Carter').split(' ');
    const state = {
      version: SAVE_VERSION, seed: seedFromClock(), rngState: 0, profile: old.profile,
      player: { ...p, firstName, lastName: rest.join(' ') || old.profile.lastName || '', residence: p.birthplace, alive: true, retired: false,
        livesWithParents: p.age < 22, hasLicence: false, money: Number.isFinite(p.money) ? p.money : 0 },
      education: { ...createEducation(), ...(old.education || {}) },
      career: createCareer(),
      relationships, assets: (old.assets || []).map((a, i) => ({ id: `a${i + 1}`, itemId: a.name, name: a.name, type: a.type === 'Vehicle' ? 'vehicle' : 'possession',
        kind: a.name.includes('Car') ? 'car' : 'bike', value: a.value || 0, condition: 70, upkeep: 0.05, boughtAt: p.age, cost: a.value || 0 })),
      timeline: (old.timeline || []).map((e) => ({ age: e.age, text: e.description || e.text || '', kind: e.kind || 'normal' })),
      yearly: { activities: {}, milestones: 0 },
      events: createEventMemory(), pending: [], flags: {}, statLog: [], nextPersonId, nextAssetId: (old.assets || []).length + 1,
    };
    state.rngState = state.seed;
    state.player.hasLicence = state.player.age >= 18;
    if (state.player.age >= 18 && state.education.stage === 'none' && !state.player.alive === false) state.player.occupation = 'Unemployed';
    state.timeline.push({ age: state.player.age, text: 'Your story continues in a new chapter of BetLife.', kind: 'normal' });
    return state;
  } catch (error) {
    return null;
  }
}
