// Small original line icons as inline SVG. Every icon shares one 24x24 grid and stroke style.
const wrap = (body) => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  menu: wrap('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  back: wrap('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  cap: wrap('<path d="M3 10l9-4 9 4-9 4-9-4z" fill="currentColor"/><path d="M7 12v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4M21 10v6"/>'),
  house: wrap('<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>'),
  people: wrap('<circle cx="8" cy="8" r="3" fill="currentColor"/><circle cx="16" cy="8" r="3" fill="currentColor"/><path d="M2 20c0-3 3-5 6-5s6 2 6 5M10 20c0-3 3-5 6-5s6 2 6 5"/>'),
  star: wrap('<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4l-5.6 2.9 1.1-6.2L3 9.7l6.2-.9z"/>'),
  briefcase: wrap('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>'),
  book: wrap('<path d="M4 5h6a2 2 0 012 2v13a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v13a2 2 0 012-2h6z"/>'),
  cross: wrap('<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="currentColor"/>'),
  bag: wrap('<path d="M5 9h14l-1 11H6z"/><path d="M9 9V7a3 3 0 016 0v2"/>'),
  ball: wrap('<circle cx="12" cy="12" r="9"/><path d="M8 4.5c3 3 3 12 0 15M16 4.5c-3 3-3 12 0 15"/>'),
  person: wrap('<circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6z" fill="currentColor"/>'),
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
  heart: wrap('<path d="M12 20s-7-4.5-7-10a3.5 3.5 0 017-1 3.5 3.5 0 017 1c0 5.5-7 10-7 10z" fill="currentColor"/>'),
  bulb: wrap('<path d="M8 13a5 5 0 118 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3z"/><path d="M10 20h4"/>'),
  sparkle: wrap('<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor"/>'),
};

export function icon(name) {
  return ICONS[name] || '';
}
