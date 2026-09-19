// Original BetLife icon set: inline SVG on one 24x24 grid, 2px rounded strokes, filled accents.
// Every icon shares the same stroke weight, scale and padding so lists look consistent.
const wrap = (body) => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  menu: wrap('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  back: wrap('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  close: wrap('<path d="M6 6l12 12M18 6L6 18"/>'),
  dots: wrap('<circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6" fill="currentColor"/>'),
  chevron: wrap('<path d="M9 5l7 7-7 7"/>'),
  cap: wrap('<path d="M3 10l9-4 9 4-9 4-9-4z" fill="currentColor"/><path d="M7 12v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4M21 10v6"/>'),
  house: wrap('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
  people: wrap('<circle cx="8" cy="8" r="3" fill="currentColor"/><circle cx="16" cy="8" r="3" fill="currentColor"/><path d="M2 20c0-3 3-5 6-5s6 2 6 5M10 20c0-3 3-5 6-5s6 2 6 5"/>'),
  star: wrap('<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z" fill="currentColor"/>'),
  briefcase: wrap('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>'),
  book: wrap('<path d="M4 5h6a2 2 0 012 2v13a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v13a2 2 0 012-2h6z"/>'),
  cross: wrap('<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="currentColor"/>'),
  bag: wrap('<path d="M5 9h14l-1 11H6z"/><path d="M9 9V7a3 3 0 016 0v2"/>'),
  ball: wrap('<circle cx="12" cy="12" r="9"/><path d="M8 4.5c3 3 3 12 0 15M16 4.5c-3 3-3 12 0 15"/>'),
  person: wrap('<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6z" fill="currentColor"/>'),
  baby: wrap('<circle cx="12" cy="9" r="5"/><path d="M9 9h.01M15 9h.01M10 12c1 1 3 1 4 0M6 21c0-3 3-5 6-5s6 2 6 5" /><path d="M12 4V2"/>'),
  figure: wrap('<circle cx="12" cy="5" r="2.5" fill="currentColor"/><path d="M12 8v7M12 10l-5-3M12 10l5-3M12 15l-4 6M12 15l4 6"/>'),
  arrowUp: wrap('<path d="M12 20V4M5 11l7-7 7 7"/>'),
  arrowDown: wrap('<path d="M12 4v16M5 13l7 7 7-7"/>'),
  sun: wrap('<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
  chat: wrap('<path d="M4 5h16v11H9l-5 4z"/>'),
  bike: wrap('<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h4l4 8M10 8h5M14 8l-3 8"/>'),
  car: wrap('<path d="M4 15l2-6h12l2 6v4H4z"/><path d="M4 15h16"/><circle cx="8" cy="18" r="1.5" fill="currentColor"/><circle cx="16" cy="18" r="1.5" fill="currentColor"/>'),
  footprints: wrap('<ellipse cx="8" cy="14" rx="3" ry="5" fill="currentColor"/><ellipse cx="16" cy="9" rx="3" ry="5" fill="currentColor"/>'),
  info: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/>'),
  exit: wrap('<path d="M10 4H5v16h5M14 8l5 4-5 4M19 12H9"/>'),
  reset: wrap('<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>'),
  smile: wrap('<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8.5 14.5c1.5 2 5.5 2 7 0"/>'),
  frown: wrap('<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/><path d="M8.5 16c1.5-2 5.5-2 7 0"/>'),
  heart: wrap('<path d="M12 20s-7-4.5-7-10a3.5 3.5 0 017-1 3.5 3.5 0 017 1c0 5.5-7 10-7 10z" fill="currentColor"/>'),
  bulb: wrap('<path d="M8 13a5 5 0 118 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z"/><path d="M10 20h4"/>'),
  sparkle: wrap('<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor"/>'),
  leaf: wrap('<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" fill="currentColor"/><path d="M5 19l7-7"/>'),
  music: wrap('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="16.5" cy="16" r="2.5" fill="currentColor"/>'),
  eye: wrap('<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
  game: wrap('<rect x="3" y="8" width="18" height="10" rx="4"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r="1" fill="currentColor"/><circle cx="18" cy="14" r="1" fill="currentColor"/>'),
  film: wrap('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4"/>'),
  paw: wrap('<circle cx="7" cy="9" r="2" fill="currentColor"/><circle cx="11" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="6" r="2" fill="currentColor"/><circle cx="19" cy="9" r="2" fill="currentColor"/><path d="M13 11c3 0 6 3 6 6a3 3 0 01-4 2 5 5 0 00-4 0 3 3 0 01-4-2c0-3 3-6 6-6z" fill="currentColor"/>'),
  plane: wrap('<path d="M2 14l8-2 4-8 3 1-2 7 6 2-1 3-6-1-3 5-2-1 1-5-6-2z" fill="currentColor"/>'),
  palette: wrap('<path d="M12 3a9 9 0 100 18c2 0 2-2 1-3s0-2 2-2h2a3 3 0 003-3 10 10 0 00-8-10z"/><circle cx="8" cy="10" r="1.3" fill="currentColor"/><circle cx="12" cy="7" r="1.3" fill="currentColor"/><circle cx="16" cy="9" r="1.3" fill="currentColor"/>'),
  dice: wrap('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/>'),
  warning: wrap('<path d="M12 3l10 18H2z" fill="currentColor"/><path d="M12 10v5M12 18h.01" stroke="#fff"/>'),
  flag: wrap('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  dollar: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9c0-1-1.5-2-3-2s-3 1-3 2.5 1.5 2 3 2.5 3 1 3 2.5-1.5 2.5-3 2.5-3-1-3-2"/>'),
  ring: wrap('<circle cx="12" cy="14" r="6"/><path d="M9 6l3-3 3 3-3 3z" fill="currentColor"/>'),
  tools: wrap('<path d="M14 6l4 4-9 9-4-4z"/><path d="M4 20l1-1M17 3l4 4"/>'),
  medal: wrap('<circle cx="12" cy="15" r="5"/><path d="M8 3l2 7M16 3l-2 7M9 3h6"/>'),
  gift: wrap('<rect x="3" y="10" width="18" height="10" rx="1"/><path d="M3 10h18v-3H3zM12 7v13M12 7c-2 0-4-1-4-3s3-1 4 3c1-4 4-5 4-3s-2 3-4 3"/>'),
  list: wrap('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>'),
  history: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  coin: wrap('<ellipse cx="12" cy="8" rx="7" ry="3"/><path d="M5 8v8c0 1.7 3.1 3 7 3s7-1.3 7-3V8M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>'),
  key: wrap('<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M15 12v2"/>'),
  candle: wrap('<path d="M9 21h6M10 10h4v11h-4z"/><path d="M12 3c-1.5 2-2 3-2 4.5a2 2 0 004 0C14 6 13.5 5 12 3z" fill="currentColor"/>'),
  seedling: wrap('<path d="M12 21v-8"/><path d="M12 13c-4 0-7-3-7-7 4 0 7 3 7 7zM12 11c0-4 3-7 7-7 0 4-3 7-7 7z" fill="currentColor"/>'),
  check: wrap('<path d="M5 12l5 5 9-10"/>'),
};

export function icon(name) {
  return ICONS[name] || ICONS.star;
}

// Content pictograms and avatars are original vector drawings (see pictograms.js). No OS emoji anywhere.
export { pic, avatarFor, avatarSvg, navGlyph, flagSvg, STAR_COUNTER, LOGO_MARK, SPLASH_MARK, PICS } from './pictograms.js';
