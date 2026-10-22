// Saving, loading and migrating older saves. The save is the whole game state as JSON.
//
// O PROGRESSO VIVE NA ABA, NÃO NO DISCO.
//
// A vida em andamento fica em `sessionStorage`, que o navegador apaga sozinho quando a aba fecha.
// Antes ela ficava em `localStorage` e dependia de uma guarda no carregamento seguinte para ser
// removida: funcionava, mas deixava a vida inteira gravada no disco no intervalo entre fechar a aba
// e abrir o site de novo — e qualquer falha da guarda (HTML em cache sem ela, link direto para o
// arquivo do jogo, erro de script antes dela) ressuscitava a vida antiga.
//
// Com `sessionStorage` não existe cópia persistente em momento nenhum, e continuar jogando ao
// navegar entre telas segue funcionando, porque `sessionStorage` sobrevive a recarregar a página.
// As PREFERÊNCIAS (idioma, primeira execução) continuam em `localStorage`: são configuração, não
// progresso, e o pedido é explícito em não apagar configuração.
import { createEventMemory } from './events/engine.js';
import { createCareer } from './career.js';
import { createEducation } from './education.js';
import { seedFromClock } from './rng.js';

export const STORAGE_KEY = 'betlife.web.save';
export const SAVE_VERSION = 2;

// ---- A vida que ficou no disco pela versão anterior -------------------------------------------
//
// A versão publicada gravava a vida em `localStorage` e nunca a apagava. Quem jogou lá tem uma vida
// guardada no disco agora. Ela NÃO é apagada em silêncio: o jogo encontra, avisa, e oferece baixar
// antes de seguir. Quem decide é o jogador.

/** O que ficou no disco, cru, ou null. Não remove nada. */
export function legacyDiskSave() {
  try { return localStorage.getItem(STORAGE_KEY) || null; } catch (error) { return null; }
}

/** Um resumo legível da vida antiga, para o cartão poder dizer de quem é. */
export function legacyDiskSummary() {
  const raw = legacyDiskSave();
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    const p = s && s.player;
    if (!p || !p.name) return { nome: 'Uma vida salva', idade: null, bytes: raw.length };
    return { nome: p.name, idade: p.age ?? null, viva: p.alive !== false, bytes: raw.length };
  } catch (error) {
    return { nome: 'Uma vida salva (ilegível)', idade: null, bytes: raw.length };
  }
}

/** Baixa a vida antiga como um arquivo. Devolve false se o navegador não deixar. */
export function exportLegacyDiskSave() {
  const raw = legacyDiskSave();
  if (!raw) return false;
  try {
    const resumo = legacyDiskSummary();
    const nome = `betlife-${String(resumo && resumo.nome || 'vida').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.json`;
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = nome; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch (error) {
    return false;
  }
}

/** Remove a vida antiga do disco. Só é chamado DEPOIS de o jogador decidir. */
export function discardLegacyDiskSave() {
  try { localStorage.removeItem(STORAGE_KEY); return true; } catch (error) { return false; }
}

export function saveGame(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    return false; // storage unavailable (private mode): the game stays in memory
  }
}

export function loadGame() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return restoreState(JSON.parse(raw));
  } catch (error) {
    return null;
  }
}

export function clearSavedGame() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (error) { /* nothing to clear */ }
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
