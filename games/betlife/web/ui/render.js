// Small HTML building blocks shared by every screen. Everything returns a string.
import { icon, pic, avatarFor, flagSvg, navGlyph } from '../game/icons.js';
import { stageId } from '../game/player.js';

export const esc = (text) => String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const pct = (n) => `${Math.round(n)}%`;
const attrs = (data) => Object.entries(data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');

// The character strip under the header: avatar, name, status and bank balance.
export function strip(state) {
  const p = state.player;
  const stage = p.alive ? stageId(p.age) : 'gone';
  const status = !p.alive ? 'tombstone' : p.age < 5 ? 'bottle' : state.education.stage !== 'none' ? 'apple' : state.career.careerId ? 'chart' : state.career.retired ? 'retire' : 'person';
  const negative = p.money < 0;
  return `<div class="bl-strip${p.alive ? '' : ' is-dead'}">
    <div class="bl-avatar stage-${stage}" aria-hidden="true">${p.alive ? avatarFor({ name: p.name, age: p.age, gender: p.gender, alive: true }) : pic('tombstone')}</div>
    <div class="bl-identity"><strong><i class="bl-flag">${flagSvg(p.residence || p.birthplace)}</i><u>${esc(p.name)}</u></strong><span><i class="bl-status-icon">${pic(status)}</i>${esc(p.occupation)}</span></div>
    <div class="bl-money"><strong class="${negative ? 'is-negative' : 'is-positive'}">${money(p.money)}</strong><span>Bank Balance</span></div></div>`;
}

// Blue title bar of secondary screens: round back/close button plus an uppercase title.
export function titleBar(title, backTarget = 'main', mode = 'close') {
  return `<div class="bl-titlebar">
    <button class="bl-round-btn" data-action="go" data-target="${esc(backTarget)}" aria-label="${mode === 'close' ? 'Close' : 'Back'}">${icon(mode === 'close' ? 'close' : 'back')}</button>
    <h1 class="bl-screen-title">${esc(title)}</h1></div>`;
}

export const section = (text) => `<div class="bl-section">${esc(text)}</div>`;

/**
 * A list row. `opts`: { sub, icon, action, data, bar: { label, value, tone }, right: 'chevron' | 'dots' | 'none',
 * disabled, note, badge, tone }. Disabled rows stay visible but greyed, with `note` explaining why.
 */
export function row(title, opts = {}) {
  const right = opts.right || 'chevron';
  const disabled = !!opts.disabled;
  const tag = opts.action && !disabled ? 'button' : 'div';
  const bar = opts.bar ? `<span class="bl-mini-meter"><span class="bl-mini-label">${esc(opts.bar.label)}</span><span class="bl-track"><span class="bl-fill${opts.bar.tone ? ` tone-${opts.bar.tone}` : ''}" style="width:${Math.max(0, Math.min(100, opts.bar.value))}%"></span></span></span>` : '';
  const sub = opts.sub ? `<span class="bl-row-sub">${esc(opts.sub)}</span>` : '';
  const note = disabled && opts.note ? `<span class="bl-row-sub bl-row-note">${esc(opts.note)}</span>` : '';
  const badge = opts.badge ? `<span class="bl-tag">${esc(opts.badge)}</span>` : '';
  const pack = opts.pack ? `<span class="bl-pack">${pic(opts.packIcon || 'lock', 'bl-pack-icon')}<b>${esc(opts.pack)}</b></span>` : '';
  const rightHtml = pack ? pack : right === 'none' ? '' : `<span class="bl-row-right">${icon(right === 'dots' ? 'dots' : 'chevron')}</span>`;
  const iconHtml = opts.emoji ? `<span class="bl-pic bl-pic-avatar" aria-hidden="true">${opts.emoji}</span>` : pic(opts.icon || 'star');
  return `<${tag} class="bl-row${disabled ? ' is-disabled' : ''}${opts.tone ? ` tone-${opts.tone}` : ''}"${opts.action && !disabled ? ` data-action="${esc(opts.action)}"${attrs(opts.data)}` : ''}${disabled ? ' aria-disabled="true"' : ''}>
    <span class="bl-row-icon">${iconHtml}</span>
    <span class="bl-row-text"><span class="bl-row-title">${esc(title)}${opts.titleNote ? ` <span class="bl-row-title-note">${esc(opts.titleNote)}</span>` : ''}${badge}</span>${sub}${note}${bar}</span>
    ${rightHtml}</${tag}>`;
}

export const infoRow = (label, value, tone = '') => `<div class="bl-info${tone ? ` tone-${tone}` : ''}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;

export function meter(label, value, iconName, tone = '') {
  const low = value < 25;
  return `<div class="bl-meter${low ? ' is-low' : ''}${tone ? ` tone-${tone}` : ''}" data-stat="${esc(label.toLowerCase())}">
    <span class="bl-meter-label">${low ? `<i class="bl-warn">${icon('warning')}</i>` : ''}${esc(label)}</span>
    <i class="bl-stat-icon">${pic(iconName)}</i>
    <span class="bl-track"><span class="bl-fill" style="width:calc((100% - 46px) * ${value / 100})"></span>${low ? `<button class="bl-boost" data-action="premium" data-feature="Boost">+ Boost</button>` : ''}<span class="bl-meter-value">${pct(value)}</span></span></div>`;
}

export const footerBar = (label, iconName, action, data = {}) => `<button class="bl-footer" data-action="${esc(action)}"${attrs(data)}>${pic(iconName)}<span>${esc(label)}</span></button>`;

export const note = (text) => `<p class="bl-note">${esc(text)}</p>`;

export const empty = (text) => `<div class="bl-empty">${esc(text)}</div>`;

export function screen(state, title, body, opts = {}) {
  return `<div class="bl-secondary">${strip(state)}${titleBar(title, opts.back || 'main', opts.mode || 'close')}</div><div class="bl-scroll">${body}</div>`;
}
export { avatarFor, pic, navGlyph };
