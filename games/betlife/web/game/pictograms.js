// BetLife pictogram system: original flat vector glyphs drawn to the reference's visual treatment
// (about 32 pt, filled colour shapes, dark outlines only where the shape needs it, no OS emoji).
// Every drawing here is original. `pic(name)` returns inline SVG; unknown names fall back to a star.

const C = {
  red: '#e6392c', red2: '#b8261c', blue: '#1c6fd6', blue2: '#0b4a8f', sky: '#7ec3ee', yellow: '#f6c744', yellow2: '#d9a01a',
  green: '#34a853', green2: '#1f7d3a', orange: '#f5820d', brown: '#8b5a2b', brown2: '#5c3a17', grey: '#9aa3ad', grey2: '#5f6871',
  pink: '#f28fb1', pink2: '#d9557e', teal: '#17b3c1', purple: '#7b5cd6', skin: '#f1c9a5', dark: '#2b2b2b', white: '#ffffff',
  cream: '#fbf3dc', mint: '#bfe8d2', lilac: '#d9c7f2', navy: '#233a5e', gold: '#f2b632', silver: '#c7ced6', wood: '#c58a4a',
};
const svg = (body, vb = 32) => `<svg viewBox="0 0 ${vb} ${vb}" class="bl-pic-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const c = (cx, cy, r, f, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${extra}/>`;
const e = (cx, cy, rx, ry, f, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}"${extra}/>`;
const r = (x, y, w, h, f, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"${extra}/>`;
const p = (d, f, extra = '') => `<path d="${d}" fill="${f}"${extra}/>`;
const l = (d, s, w = 2, extra = '') => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const t = (x, y, s, txt, f = C.dark, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" font-family="Avenir Next, Arial, sans-serif" font-weight="800" fill="${f}" text-anchor="middle"${extra}>${txt}</text>`;

// ---- Faces used by the stat bars (happiness) and cards ----
const face = (mouth, f = C.yellow) => svg(`${c(16, 16, 13, f)}${c(11, 13, 1.8, C.dark)}${c(21, 13, 1.8, C.dark)}${mouth}`);
const FACES = {
  happy: face(l('M10 19c2 3.5 10 3.5 12 0', C.dark, 2.2)),
  neutral: face(l('M11 20h10', C.dark, 2.2)),
  sad: face(l('M10 22c2-3.5 10-3.5 12 0', C.dark, 2.2)),
  smile: face(l('M10 19c2 3.5 10 3.5 12 0', C.dark, 2.2)),
  frown: face(l('M10 22c2-3.5 10-3.5 12 0', C.dark, 2.2)),
  compliment: face(`${l('M10 19c2 3.5 10 3.5 12 0', C.dark, 2.2)}${c(8, 18, 2, C.pink)}${c(24, 18, 2, C.pink)}`),
  angry: face(`${l('M10 22c2-3.5 10-3.5 12 0', C.dark, 2.2)}${l('M8 10l5 2M24 10l-5 2', C.dark, 2)}`, C.orange),
  hug: face(`${l('M10 19c2 3.5 10 3.5 12 0', C.dark, 2.2)}${p('M3 20c-1-4 2-7 5-6v4c-2 0-3 1-3 3z', C.yellow)}${p('M29 20c1-4-2-7-5-6v4c2 0 3 1 3 3z', C.yellow)}`),
};

const heart = (f = C.red) => p('M16 27C8 21 3 16.5 3 11.2 3 7.5 6 5 9.3 5c2.6 0 4.9 1.5 6.7 4 1.8-2.5 4.1-4 6.7-4C26 5 29 7.5 29 11.2c0 5.3-5 9.8-13 15.8z', f);
const star = (f = C.yellow, s = 1, x = 0, y = 0) => p(`M${16 * s + x} ${3 * s + y}l${3.6 * s} ${7.4 * s} ${8.2 * s} ${1.2 * s}-${5.9 * s} ${5.8 * s} ${1.4 * s} ${8.1 * s}-${7.3 * s}-${3.9 * s}-${7.3 * s} ${3.9 * s} ${1.4 * s}-${8.1 * s}-${5.9 * s}-${5.8 * s} ${8.2 * s}-${1.2 * s}z`, f);
const book = (f = C.blue, f2 = C.red) => `${p('M5 6h9a3 3 0 013 3v18a3 3 0 00-3-3H5z', f)}${p('M27 6h-9a3 3 0 00-3 3v18a3 3 0 013-3h9z', f2)}${r(4, 5, 24, 2, C.white, 1)}`;
const briefcase = (f = C.brown) => `${r(3, 10, 26, 17, f, 3)}${r(3, 16, 26, 2, C.brown2)}${r(11, 5, 10, 6, C.brown2, 2)}${r(13, 7, 6, 3, f, 1)}${r(14, 15, 4, 4, C.gold, 1)}`;
const carBody = (f) => `${p('M3 20l3-8a2 2 0 012-1.5h16a2 2 0 012 1.5l3 8v5a1 1 0 01-1 1h-2l-1-2H7l-1 2H4a1 1 0 01-1-1z', f)}${p('M9 12h14l2 5H7z', C.sky)}${c(9, 25, 3, C.dark)}${c(23, 25, 3, C.dark)}${c(9, 25, 1.2, C.silver)}${c(23, 25, 1.2, C.silver)}`;
const person = (f = C.blue, skin = C.skin) => `${c(16, 10, 6, skin)}${p('M4 29c0-7 5-11 12-11s12 4 12 11z', f)}`;
const dog = svg(`${p('M8 13c-3-1-4-6-1-8 2-1 4 1 5 3z', C.brown2)}${p('M24 13c3-1 4-6 1-8-2-1-4 1-5 3z', C.brown2)}${e(16, 15, 10, 9, C.wood)}${e(16, 20, 6, 4.5, C.cream)}${c(12, 13, 1.6, C.dark)}${c(20, 13, 1.6, C.dark)}${e(16, 18.5, 2.2, 1.6, C.dark)}${p('M6 24h20v4H6z', C.wood)}`);
const cat = svg(`${p('M7 12L6 4l7 5z', C.orange)}${p('M25 12l1-8-7 5z', C.orange)}${e(16, 16, 10, 9, C.orange)}${c(12, 15, 1.6, C.green2)}${c(20, 15, 1.6, C.green2)}${p('M14.5 19h3l-1.5 1.8z', C.pink2)}${l('M4 19h7M4 22h7M21 19h7M21 22h7', C.dark, 1.2)}`);
const skull = (f = C.silver, x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${e(16, 13, 10, 9.5, f)}${r(10, 18, 12, 7, f, 2)}${e(12, 13, 2.8, 3.2, C.dark)}${e(20, 13, 2.8, 3.2, C.dark)}${p('M15 17l1-2 1 2z', C.dark)}${l('M12.5 22v3M15 22v3M17.5 22v3M20 22v3', C.dark, 1)}</g>`;
const trophy = (f = C.gold) => `${p('M9 5h14v8a7 7 0 01-14 0z', f)}${p('M5 7h4v3a4 4 0 01-4-1zM27 7h-4v3a4 4 0 004-1z', f)}${r(14, 19, 4, 4, C.yellow2)}${r(10, 23, 12, 3, C.brown, 1)}${r(8, 26, 16, 2, C.brown2, 1)}`;

export const PICS = {
  // ---- generic ----
  star: svg(star()), sparkle: svg(`${star(C.yellow, 0.7, 5, 4)}${star(C.yellow, 0.4, 16, 14)}`), info: svg(`${c(16, 16, 13, C.blue)}${r(14.5, 14, 3, 10, C.white, 1)}${c(16, 10, 1.8, C.white)}`),
  check: svg(`${c(16, 16, 13, C.green)}${l('M9 16l5 5 9-10', C.white, 3)}`), warning: svg(`${p('M16 3l14 25H2z', C.orange)}${r(14.5, 11, 3, 9, C.dark, 1)}${c(16, 24, 1.8, C.dark)}`),
  dice: svg(`${r(4, 4, 24, 24, C.white, 5, ` stroke="${C.dark}" stroke-width="2"`)}${c(10, 10, 2.2, C.dark)}${c(22, 10, 2.2, C.dark)}${c(16, 16, 2.2, C.dark)}${c(10, 22, 2.2, C.dark)}${c(22, 22, 2.2, C.dark)}`),
  reset: svg(`${l('M25 16a9 9 0 11-3-6.7', C.blue, 3)}${p('M25 4v8h-8z', C.blue)}`), key: svg(`${c(10, 16, 6, C.gold)}${c(10, 16, 2.3, C.cream)}${r(15, 14.5, 14, 3, C.gold)}${r(23, 17, 2.5, 4, C.gold)}${r(27, 17, 2, 3, C.gold)}`),
  exit: svg(`${r(6, 4, 14, 24, C.brown, 2)}${r(9, 7, 8, 18, C.wood, 1)}${c(15, 17, 1.4, C.gold)}${l('M22 16h7M26 12l3 4-3 4', C.dark, 2.5)}`),
  // ---- people & family ----
  person: svg(person()), baby: svg(`${c(16, 14, 9, C.skin)}${p('M16 4c1-2 3-2 3 0', C.dark)}${c(13, 13, 1.4, C.dark)}${c(19, 13, 1.4, C.dark)}${l('M13.5 17c1.5 1.5 3.5 1.5 5 0', C.dark, 1.6)}${p('M6 29c0-5 4-7 10-7s10 2 10 7z', C.mint)}`),
  people: svg(`${c(11, 10, 5, C.skin)}${p('M2 27c0-6 4-9 9-9s9 3 9 9z', C.blue)}${c(22, 11, 4.5, C.skin)}${p('M15 27c1-5 4-8 7-8 4 0 8 3 8 8z', C.teal)}`),
  friends: svg(`${c(11, 10, 5, C.skin)}${p('M2 27c0-6 4-9 9-9s9 3 9 9z', C.blue)}${c(22, 11, 4.5, C.skin)}${p('M15 27c1-5 4-8 7-8 4 0 8 3 8 8z', C.teal)}`),
  social: svg(`${c(11, 10, 5, C.grey2)}${p('M2 27c0-6 4-9 9-9s9 3 9 9z', C.grey2)}${c(22, 11, 4.5, C.grey)}${p('M15 27c1-5 4-8 7-8 4 0 8 3 8 8z', C.grey)}`),
  adoption: svg(`${c(16, 12, 7, C.skin)}${c(13.5, 11, 1.3, C.dark)}${c(18.5, 11, 1.3, C.dark)}${p('M8 29c0-6 3-8 8-8s8 2 8 8z', C.pink)}${p('M10 6c2-4 10-4 12 0-3-1-9-1-12 0z', C.brown2)}`),
  startFamily: svg(`${c(16, 12, 7, C.skin)}${c(13.5, 11, 1.3, C.dark)}${c(18.5, 11, 1.3, C.dark)}${p('M8 29c0-6 3-8 8-8s8 2 8 8z', C.mint)}`),
  identity: svg(`${r(3, 7, 26, 18, C.cream, 2, ` stroke="${C.blue2}" stroke-width="1.5"`)}${c(10, 15, 3.5, C.skin)}${p('M5 23c0-3 2-5 5-5s5 2 5 5z', C.blue)}${r(17, 12, 9, 2, C.blue2)}${r(17, 16, 9, 2, C.grey)}${r(17, 20, 6, 2, C.grey)}`),
  licence: svg(`${r(3, 7, 26, 18, C.cream, 2, ` stroke="${C.blue2}" stroke-width="1.5"`)}${c(10, 15, 3.5, C.skin)}${p('M5 23c0-3 2-5 5-5s5 2 5 5z', C.blue)}${r(17, 12, 9, 2, C.blue2)}${r(17, 16, 9, 2, C.grey)}${r(17, 20, 6, 2, C.grey)}`),
  teacher: svg(`${r(4, 5, 24, 15, C.green2, 1)}${l('M8 10h10M8 14h6', C.white, 1.5)}${c(22, 17, 4, C.skin)}${p('M15 29c0-4 3-6 7-6s7 2 7 6z', C.purple)}`),
  hr: svg(`${p('M5 13l14-7v20L5 19z', C.red)}${r(3, 12, 4, 8, C.red2, 1)}${l('M22 12a6 6 0 010 8M25 9a10 10 0 010 14', C.dark, 2.2)}`),
  recruiter: svg(`${p('M6 13c0-6 4-8 10-8s10 2 10 8H6z', C.brown2)}${r(4, 12, 24, 3, C.brown2, 1)}${c(16, 19, 6, C.skin)}${c(13.5, 18.5, 1.2, C.dark)}${c(18.5, 18.5, 1.2, C.dark)}${c(24, 23, 4, C.white, ` stroke="${C.dark}" stroke-width="2"`)}${l('M27 26l3 3', C.dark, 2.5)}`),
  // ---- love ----
  heart: svg(heart()), love: svg(heart()), health: svg(heart()), healthLow: svg(`${heart(C.grey)}${l('M16 8l-3 6 4 4-2 6', C.white, 2)}`),
  anniversary: svg(`${heart(C.red)}${heart('#ff6b6b')}${p('M12 10l2 4h-4z', C.white)}`), propose: svg(`${c(16, 19, 8, 'none', ` stroke="${C.gold}" stroke-width="4"`)}${p('M12 9l4-5 4 5-4 3z', C.sky)}${p('M12 9h8l-4 3z', '#4aa8e0')}`),
  ring: svg(`${c(16, 19, 8, 'none', ` stroke="${C.gold}" stroke-width="4"`)}${p('M12 9l4-5 4 5-4 3z', C.sky)}`),
  marry: svg(`${c(12, 19, 6.5, 'none', ` stroke="${C.gold}" stroke-width="3.5"`)}${c(20, 19, 6.5, 'none', ` stroke="${C.gold}" stroke-width="3.5"`)}${p('M17 8l3-4 3 4-3 2z', C.sky)}`),
  breakUp: svg(`${heart(C.red)}${p('M16 6l-3 7 5 4-4 9 1-7-5-4z', C.white)}`), askOut: svg(`${r(4, 8, 24, 17, C.pink, 2)}${p('M4 8l12 9 12-9', C.pink2)}${heart(C.red).replace('<path', '<path transform="translate(9 9) scale(0.45)"')}`),
  unfriend: svg(`${c(16, 16, 13, C.red)}${r(8, 14.5, 16, 3, C.white, 1)}`), release: svg(`${p('M6 20c0-8 5-12 10-12s10 4 10 12c0 4-3 6-10 6S6 24 6 20z', C.wood)}${c(11, 18, 1.8, C.dark)}${c(21, 18, 1.8, C.dark)}${e(16, 22, 2.5, 1.8, C.dark)}${l('M24 6l4-2', C.dark, 2)}`),
  // ---- school & work ----
  cap: svg(`${p('M16 6L2 12l14 6 14-6z', C.dark)}${p('M8 15v6c0 2 4 4 8 4s8-2 8-4v-6l-8 3z', C.dark)}${r(27, 12, 1.5, 9, C.gold)}${c(27.8, 22, 1.6, C.gold)}`),
  graduate: svg(`${p('M16 6L2 12l14 6 14-6z', C.dark)}${p('M8 15v6c0 2 4 4 8 4s8-2 8-4v-6l-8 3z', C.dark)}${r(27, 12, 1.5, 9, C.gold)}`),
  school: svg(`${r(4, 12, 24, 16, C.red)}${p('M16 4l14 8H2z', C.red2)}${r(13, 19, 6, 9, C.brown2, 1)}${r(6, 15, 4, 4, C.sky)}${r(22, 15, 4, 4, C.sky)}${c(16, 9, 1.5, C.gold)}`),
  study: svg(book()), book: svg(book()), library: svg(`${r(3, 6, 6, 21, C.blue, 1)}${r(10, 9, 6, 18, C.red, 1)}${r(17, 5, 6, 22, C.green, 1)}${p('M23 8l5-1 3 19-5 1z', C.orange)}`),
  homework: svg(`${r(6, 4, 20, 24, C.white, 1, ` stroke="${C.grey2}" stroke-width="1.5"`)}${l('M10 10h12M10 15h12M10 20h8', C.blue, 2)}${p('M22 20l6-6 2 2-6 6-3 1z', C.gold)}`),
  briefcase: svg(briefcase()), work: svg(briefcase()), job: svg(briefcase()),
  chart: svg(`${r(3, 5, 26, 22, C.white, 2, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(7, 16, 4, 8, C.red)}${r(14, 11, 4, 13, C.green)}${r(21, 8, 4, 16, C.blue)}`),
  performance: svg(`${r(3, 5, 26, 22, C.white, 2, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(7, 16, 4, 8, C.red)}${r(14, 11, 4, 13, C.green)}${r(21, 8, 4, 16, C.blue)}`),
  schedule: svg(`${r(4, 6, 24, 22, C.white, 2, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(4, 6, 24, 6, C.red)}${l('M10 3v6M22 3v6', C.dark, 2.5)}${t(16, 25, 11, '17', C.dark)}`),
  calendar: svg(`${r(4, 6, 24, 22, C.white, 2, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(4, 6, 24, 6, C.red)}${l('M10 3v6M22 3v6', C.dark, 2.5)}${t(16, 25, 11, '17', C.dark)}`),
  history: svg(`${c(16, 16, 12, C.white, ` stroke="${C.dark}" stroke-width="2.5"`)}${l('M16 9v7l5 3', C.dark, 2.5)}`), clock: svg(`${p('M6 26V14a10 10 0 0120 0v12z', C.brown)}${c(16, 15, 6.5, C.cream)}${l('M16 11v4l3 2', C.dark, 1.6)}${r(4, 26, 24, 3, C.brown2, 1)}`),
  list: svg(`${r(6, 3, 20, 26, C.cream, 2, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(11, 1, 10, 5, C.grey2, 1)}${l('M10 12h12M10 17h12M10 22h8', C.dark, 2)}`),
  will: svg(`${r(7, 3, 18, 26, C.cream, 1, ` stroke="${C.grey2}" stroke-width="1.5"`)}${l('M11 9h10M11 13h10M11 17h7', C.grey2, 1.6)}${c(20, 23, 3, C.red)}`),
  workHarder: svg(`${p('M6 22c0-6 3-9 7-10l2-5 4 1-2 6c4 1 7 3 7 8v5H6z', C.skin)}${p('M13 12l2-5 4 1-2 6z', C.skin)}${r(8, 24, 16, 4, C.blue, 1)}`),
  easy: svg(`${r(3, 14, 26, 10, C.blue, 3)}${r(6, 9, 20, 7, C.sky, 3)}${r(3, 23, 4, 4, C.blue2)}${r(25, 23, 4, 4, C.blue2)}`),
  raise: svg(`${r(3, 9, 26, 14, C.green2, 2)}${c(16, 16, 4.5, C.green)}${t(16, 19.5, 8, '$', C.white)}${c(6, 12, 1.2, C.green)}${c(26, 20, 1.2, C.green)}`),
  dollar: svg(`${c(16, 16, 12, C.gold)}${c(16, 16, 9, C.yellow)}${t(16, 21, 13, '$', C.brown2)}`), coin: svg(`${c(16, 16, 12, C.gold)}${c(16, 16, 9, C.yellow)}${t(16, 21, 13, '$', C.brown2)}`),
  money: svg(`${p('M10 9c0-3 3-4 6-4s6 1 6 4l-2 2H12z', C.green2)}${p('M8 29c-4-6-1-16 8-16s12 10 8 16z', C.green)}${t(16, 26, 11, '$', C.white)}`),
  finances: svg(`${p('M10 9c0-3 3-4 6-4s6 1 6 4l-2 2H12z', C.green2)}${p('M8 29c-4-6-1-16 8-16s12 10 8 16z', C.green)}${t(16, 26, 11, '$', C.white)}`),
  allowance: svg(`${r(3, 9, 26, 14, C.green2, 2)}${c(16, 16, 4.5, C.green)}${t(16, 19.5, 8, '$', C.white)}`), loan: svg(`${p('M16 3l13 7H3z', C.silver)}${r(5, 11, 22, 3, C.grey)}${r(7, 14, 3, 10, C.silver)}${r(12, 14, 3, 10, C.silver)}${r(17, 14, 3, 10, C.silver)}${r(22, 14, 3, 10, C.silver)}${r(4, 25, 24, 4, C.grey2)}`),
  bank: svg(`${p('M16 3l13 7H3z', C.silver)}${r(5, 11, 22, 3, C.grey)}${r(7, 14, 3, 10, C.silver)}${r(12, 14, 3, 10, C.silver)}${r(17, 14, 3, 10, C.silver)}${r(22, 14, 3, 10, C.silver)}${r(4, 25, 24, 4, C.grey2)}`),
  freelance: svg(`${r(7, 3, 18, 26, C.cream, 1, ` stroke="${C.grey2}" stroke-width="1.5"`)}${l('M11 9h10M11 13h10M11 17h10M11 21h6', C.grey2, 1.6)}${p('M7 29l3-3 3 3 3-3 3 3 3-3 3 3', C.cream)}`),
  resign: svg(`${p('M6 12c2-6 8-8 12-6s6 8 3 13l-4 5c-3 3-9 1-10-3z', C.skin)}${l('M11 8v6M15 6v8M19 7v7', C.skin, 3.5)}${l('M22 8c2-2 4-2 5 0', C.dark, 1.6)}`),
  retire: svg(`${p('M4 15c3-5 21-5 24 0H4z', C.orange)}${p('M4 15c3-5 21-5 24 0', C.yellow)}${r(15, 14, 2, 14, C.brown)}${p('M2 29c6-3 22-3 28 0z', C.yellow)}`),
  military: svg(`${p('M4 18c0-9 5-14 12-14s12 5 12 14z', '#4c6b3a')}${r(2, 18, 28, 4, '#3b5730', 1)}${r(13, 8, 6, 4, '#2e4225', 1)}`),
  flag: svg(`${r(6, 3, 2.5, 26, C.dark)}${p('M8.5 5h17l-4 5 4 5h-17z', C.red)}`), dream: svg(`${star(C.yellow)}${star(C.white, 0.35, 11, 9)}`),
  medal: svg(`${p('M10 2h5l-2 10h-4zM22 2h-5l2 10h4z', C.blue)}${c(16, 20, 8, C.gold)}${c(16, 20, 5, C.yellow)}${star(C.gold, 0.35, 10.5, 15)}`), trophy: svg(trophy()),
  // ---- home, assets, shopping ----
  house: svg(`${p('M3 15L16 4l13 11v13H3z', C.red)}${p('M3 15L16 4l13 11h-4L16 8 7 15z', C.red2)}${r(13, 19, 6, 9, C.brown2, 1)}${r(21, 18, 4, 4, C.sky)}`),
  home: svg(`${p('M3 15L16 4l13 11v13H3z', C.cream)}${p('M3 15L16 4l13 11h-4L16 8 7 15z', C.red)}${r(13, 19, 6, 9, C.brown, 1)}${r(21, 18, 4, 4, C.sky)}`),
  housing: svg(`${p('M3 15L16 4l13 11v13H3z', C.cream)}${p('M3 15L16 4l13 11h-4L16 8 7 15z', C.red)}${r(13, 19, 6, 9, C.brown, 1)}${r(21, 18, 4, 4, C.sky)}`),
  property: svg(`${r(3, 10, 12, 18, C.silver)}${r(17, 6, 12, 22, C.grey)}${r(5, 13, 3, 3, C.sky)}${r(10, 13, 3, 3, C.sky)}${r(5, 19, 3, 3, C.sky)}${r(19, 9, 3, 3, C.sky)}${r(24, 9, 3, 3, C.sky)}${r(19, 15, 3, 3, C.sky)}${r(24, 15, 3, 3, C.sky)}`),
  car: svg(carBody(C.red)), drive: svg(carBody(C.red)), bike: svg(`${c(8, 22, 6, 'none', ` stroke="${C.blue}" stroke-width="2.5"`)}${c(24, 22, 6, 'none', ` stroke="${C.blue}" stroke-width="2.5"`)}${l('M8 22l5-10h6l5 10M13 12h-4M19 12l-3 10H8', C.dark, 2.2)}`),
  tools: svg(`${p('M4 24l12-12 2 2L6 26z', C.grey2)}${p('M17 6a6 6 0 016 6l-3-1-2 2 1 3a6 6 0 01-7-7l3 1 2-2z', C.silver)}${r(3, 24, 5, 5, C.grey2, 1)}`),
  trash: svg(`${r(7, 8, 18, 20, C.grey, 2)}${r(5, 6, 22, 3, C.grey2, 1)}${r(12, 3, 8, 3, C.grey2, 1)}${l('M12 12v12M16 12v12M20 12v12', C.grey2, 2)}`),
  gift: svg(`${r(4, 12, 24, 16, C.blue, 2)}${r(3, 9, 26, 5, C.blue2, 1)}${r(14, 9, 4, 19, C.yellow)}${p('M16 9c-4 0-6-4-3-5s3 5 3 5zM16 9c4 0 6-4 3-5s-3 5-3 5z', C.yellow)}`),
  bag: svg(`${p('M6 11h20l-2 17H8z', C.pink2)}${l('M12 11V8a4 4 0 018 0v3', C.dark, 2)}`), shopping: svg(`${p('M4 10h18l-2 12H7z', C.orange)}${p('M16 12h12l-2 14H13z', C.pink2)}${l('M8 10V7a3 3 0 016 0v3M18 12V9a3 3 0 016 0v3', C.dark, 1.8)}`),
  jewelry: svg(`${p('M9 5h14l6 8-13 15L3 13z', C.sky)}${p('M9 5l7 8-7 15L3 13z', '#4aa8e0')}${p('M23 5l-7 8 7 15 6-15z', '#4aa8e0')}${p('M9 5h14l-7 8z', '#bfe6fb')}`),
  gadget: svg(`${p('M5 20v-4a11 11 0 0122 0v4', 'none', ` stroke="${C.dark}" stroke-width="3"`)}${r(3, 18, 7, 10, C.grey2, 2)}${r(22, 18, 7, 10, C.grey2, 2)}`),
  game: svg(`${r(2, 11, 28, 14, C.grey2, 7)}${r(7, 15, 6, 2, C.white, 1)}${r(9, 13, 2, 6, C.white, 1)}${c(22, 15, 1.6, C.red)}${c(25, 18, 1.6, C.green)}`),
  videoGames: svg(`${r(2, 11, 28, 14, C.grey2, 7)}${r(7, 15, 6, 2, C.white, 1)}${r(9, 13, 2, 6, C.white, 1)}${c(22, 15, 1.6, C.red)}${c(25, 18, 1.6, C.green)}`),
  music: svg(`${p('M12 6l14-3v17', 'none', ` stroke="${C.dark}" stroke-width="2.5"`)}${e(9, 22, 4, 3, C.dark)}${e(23, 19, 4, 3, C.dark)}`),
  instrument: svg(`${p('M11 30c-5 0-8-4-7-9 1-3 4-4 5-7l2-9h4l-1 9c3 2 6 4 6 8 0 5-4 8-9 8z', C.wood)}${c(12, 22, 3, C.dark)}${l('M13 12l7-8', C.dark, 2)}${r(19, 3, 5, 3, C.dark, 1)}`),
  phone: svg(`${r(9, 2, 14, 28, C.dark, 3)}${r(11, 5, 10, 20, C.sky, 1)}${c(16, 27.5, 1.3, C.grey)}`), suitcase: svg(`${r(5, 9, 22, 19, C.brown, 3)}${r(12, 5, 8, 5, C.brown2, 2)}${r(5, 16, 22, 3, C.brown2)}${r(14, 14, 4, 6, C.gold, 1)}`),
  // ---- pets ----
  dog, cat, paw: svg(`${e(9, 11, 3, 4, C.brown2)}${e(15, 7, 3, 4, C.brown2)}${e(21, 8, 3, 4, C.brown2)}${e(26, 13, 3, 3.5, C.brown2)}${p('M11 19c2-4 10-4 13 0 3 3 3 7-1 8-3 1-5-1-7 0s-4 2-6 0c-3-2-1-6 1-8z', C.brown2)}`),
  pets: dog, playPet: svg(`${c(16, 16, 11, '#b8e04a')}${l('M8 9c3 4 3 10 0 14M24 9c-3 4-3 10 0 14', C.white, 2)}`),
  walkPet: svg(`${p('M8 13c-3-1-4-6-1-8 2-1 4 1 5 3z', C.brown2)}${e(14, 16, 8, 7, C.wood)}${c(11, 15, 1.4, C.dark)}${r(10, 22, 3, 6, C.wood)}${r(17, 22, 3, 6, C.wood)}${l('M20 12l9-6', C.red, 2)}`),
  treatPet: svg(`${p('M6 12c-2-3 1-6 4-4l1 1h10l1-1c3-2 6 1 4 4l-1 1v6l1 1c2 3-1 6-4 4l-1-1H11l-1 1c-3 2-6-1-4-4l1-1v-6z', C.cream)}`),
  bathePet: svg(`${r(3, 16, 26, 10, C.white, 3, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(4, 14, 24, 3, C.sky)}${c(11, 10, 2, C.sky)}${c(18, 7, 2.5, C.sky)}${c(24, 11, 1.5, C.sky)}${r(6, 26, 3, 3, C.grey2)}${r(23, 26, 3, 3, C.grey2)}`),
  rehome: svg(`${p('M3 15L16 4l13 11v13H3z', C.cream)}${p('M3 15L16 4l13 11h-4L16 8 7 15z', C.green)}${r(13, 19, 6, 9, C.brown, 1)}`),
  hamster: svg(`${e(16, 17, 11, 9, C.wood)}${c(8, 10, 3, C.wood)}${c(24, 10, 3, C.wood)}${e(16, 21, 6, 4, C.cream)}${c(12, 15, 1.5, C.dark)}${c(20, 15, 1.5, C.dark)}${c(16, 19, 1.3, C.pink2)}`),
  bird: svg(`${e(15, 18, 9, 8, C.green)}${c(21, 11, 5, C.green)}${p('M25 11l5 1-5 2z', C.orange)}${c(22, 10, 1.2, C.dark)}${p('M6 17l-4 6 6-2z', C.green2)}${l('M13 26v3M17 26v3', C.orange, 1.6)}`),
  rabbit: svg(`${e(11, 8, 3, 7, C.silver)}${e(21, 8, 3, 7, C.silver)}${e(16, 19, 10, 9, C.silver)}${c(12, 18, 1.5, C.dark)}${c(20, 18, 1.5, C.dark)}${p('M14.5 22h3l-1.5 1.5z', C.pink2)}`),
  fish: svg(`${e(14, 16, 10, 7, C.orange)}${p('M22 16l7-6v12z', C.orange)}${c(9, 14, 1.5, C.dark)}${p('M12 9c3-3 6-3 8 0z', C.yellow2)}`),
  horse: svg(`${p('M8 28V14c0-6 5-9 10-8l8 4-3 3-3-1v16h-3v-6h-6v6z', C.brown)}${p('M12 7l-2-4 5 4z', C.brown2)}${c(17, 12, 1.3, C.dark)}`),
  zoo: svg(`${e(16, 18, 10, 8, C.orange)}${c(16, 14, 8, C.yellow2)}${c(16, 15, 6, C.orange)}${c(13.5, 14, 1.3, C.dark)}${c(18.5, 14, 1.3, C.dark)}${p('M14.5 18h3l-1.5 1.5z', C.dark)}`),
  // ---- activities ----
  meditate: svg(`${c(16, 8, 4.5, C.skin)}${p('M8 22c0-5 4-8 8-8s8 3 8 8l-2 2H10z', C.purple)}${p('M3 25c3-4 8-4 13-2 5-2 10-2 13 2-4 3-9 3-13 1-4 2-9 2-13-1z', C.skin)}`),
  mindBody: svg(`${c(16, 8, 4.5, C.skin)}${p('M8 22c0-5 4-8 8-8s8 3 8 8l-2 2H10z', C.purple)}${p('M3 25c3-4 8-4 13-2 5-2 10-2 13 2-4 3-9 3-13 1-4 2-9 2-13-1z', C.skin)}`),
  figure: svg(`${c(16, 8, 4.5, C.skin)}${p('M8 22c0-5 4-8 8-8s8 3 8 8l-2 2H10z', C.purple)}${p('M3 25c3-4 8-4 13-2 5-2 10-2 13 2-4 3-9 3-13 1-4 2-9 2-13-1z', C.skin)}`),
  gym: svg(`${r(2, 12, 4, 8, C.dark, 1)}${r(26, 12, 4, 8, C.dark, 1)}${r(6, 10, 4, 12, C.grey2, 1)}${r(22, 10, 4, 12, C.grey2, 1)}${r(10, 14.5, 12, 3, C.grey2)}`),
  martial: svg(`${c(16, 7, 4, C.skin)}${p('M7 28V16c0-4 4-6 9-6s9 2 9 6v12z', C.white, ` stroke="${C.grey}" stroke-width="1.5"`)}${r(7, 20, 18, 3, C.dark)}${p('M16 11l-5 8h10z', C.white)}`),
  walk: svg(`${c(16, 6, 3.5, C.skin)}${p('M13 10h6l3 8-3 1-2-4v6l4 8h-3l-4-7-3 7H8l4-9v-5l-3 3-2-2 4-5z', C.blue)}`),
  footprints: svg(`${c(16, 6, 3.5, C.skin)}${p('M13 10h6l3 8-3 1-2-4v6l4 8h-3l-4-7-3 7H8l4-9v-5l-3 3-2-2 4-5z', C.blue)}`),
  playOutside: svg(`${p('M4 26l6-16h12l6 16z', C.orange)}${r(13, 16, 6, 10, C.yellow, 1)}${c(16, 6, 3, C.skin)}${r(2, 26, 28, 3, C.green)}`),
  garden: svg(`${p('M8 17h16l-2 11H10z', C.brown)}${r(6, 15, 20, 3, C.brown2, 1)}${l('M16 15V7', C.green2, 2)}${p('M16 11c-5 0-7-4-7-7 4 0 7 3 7 7zM16 9c0-4 3-6 7-6 0 4-3 6-7 6z', C.green)}`),
  seedling: svg(`${l('M16 29V15', C.green2, 3)}${p('M16 18c-7 0-10-5-10-10 6 0 10 4 10 10zM16 14c0-6 4-9 10-9 0 6-4 9-10 9z', C.green)}`),
  leaf: svg(`${p('M6 26C6 12 14 6 27 5c-1 12-7 20-21 21z', C.green)}${l('M8 24L22 10', C.green2, 1.5)}`),
  diet: svg(`${c(16, 18, 10, C.green)}${c(16, 18, 7, '#7ad27a')}${p('M16 6c2-3 5-3 6-1-2 1-4 2-6 1z', C.green2)}${r(15, 4, 2, 5, C.brown)}`),
  memory: svg(`${p('M6 8h8v3a2 2 0 004 0V8h8v8h-3a2 2 0 000 4h3v8h-8v-3a2 2 0 00-4 0v3H6v-8h3a2 2 0 000-4H6z', C.purple)}`),
  brain: svg(`${p('M15 5c-5-1-9 3-8 8-3 2-2 7 1 8 0 3 3 5 7 4V5z', C.pink)}${p('M17 5c5-1 9 3 8 8 3 2 2 7-1 8 0 3-3 5-7 4V5z', '#f7a9c4')}${l('M12 10c2 1 3 3 2 6M20 10c-2 1-3 3-2 6', C.pink2, 1.4)}`),
  smarts: svg(`${p('M15 5c-5-1-9 3-8 8-3 2-2 7 1 8 0 3 3 5 7 4V5z', C.pink)}${p('M17 5c5-1 9 3 8 8 3 2 2 7-1 8 0 3-3 5-7 4V5z', '#f7a9c4')}`),
  bulb: svg(`${c(16, 12, 9, C.yellow)}${r(12, 20, 8, 5, C.grey2, 1)}${r(13, 26, 6, 2, C.dark, 1)}${l('M16 8v5M12 12l4 1 4-1', C.yellow2, 1.6)}`),
  advice: svg(`${c(16, 12, 9, C.yellow)}${r(12, 20, 8, 5, C.grey2, 1)}${r(13, 26, 6, 2, C.dark, 1)}`),
  sun: svg(`${c(16, 16, 7, C.yellow)}${l('M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3', C.yellow2, 2.5)}`),
  spendTime: svg(`${c(16, 16, 7, C.yellow)}${l('M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M7 25l3-3M22 10l3-3', C.yellow2, 2.5)}`),
  looks: svg(`${c(13, 12, 6, C.yellow)}${l('M13 3v3M4 12h3M6.6 5.6l2 2M17.5 5.6l2 2', C.yellow2, 2)}${p('M9 27a5 5 0 010-10 7 7 0 0113-2 5 5 0 013 12z', C.white, ` stroke="${C.silver}" stroke-width="1.5"`)}`),
  looksLow: svg(`${p('M9 24a5 5 0 010-10 7 7 0 0113-2 5 5 0 013 12z', C.grey, ` stroke="${C.grey2}" stroke-width="1.5"`)}${l('M11 26v3M16 26v3M21 26v3', C.blue, 2)}`),
  spa: svg(`${c(16, 9, 5, C.skin)}${p('M9 27c0-6 3-10 7-10s7 4 7 10z', C.mint)}${p('M20 7c3-2 6 0 6 3s-2 5-4 4', 'none', ` stroke="${C.skin}" stroke-width="3"`)}`),
  salon: svg(`${c(16, 10, 6, C.skin)}${p('M10 8c1-5 11-5 12 0 0 2-1 4-2 5 0-3-8-3-8 0-1-1-2-3-2-5z', C.brown2)}${l('M22 14l7 7M22 21l7-7', C.grey2, 2.2)}${c(24, 22, 1.5, C.grey2)}${c(24, 12, 1.5, C.grey2)}`),
  scissors: svg(`${l('M12 12l14 12M12 20l14-12', C.grey2, 2.5)}${c(8, 9, 4, 'none', ` stroke="${C.red}" stroke-width="2.5"`)}${c(8, 23, 4, 'none', ` stroke="${C.red}" stroke-width="2.5"`)}`),
  nails: svg(`${p('M8 29V13c0-6 3-9 8-9s8 3 8 9v16z', C.skin)}${e(16, 6, 4, 3, C.pink2)}${r(10, 24, 12, 5, C.pink)}`),
  doctor: svg(`${l('M8 4v9a8 8 0 0016 0V4', C.dark, 2.5)}${c(24, 22, 4, C.silver, ` stroke="${C.dark}" stroke-width="2"`)}${l('M16 21a8 8 0 008 1', C.dark, 2.5)}${r(6, 2, 4, 4, C.grey2, 1)}${r(22, 2, 4, 4, C.grey2, 1)}`),
  stethoscope: svg(`${l('M8 4v9a8 8 0 0016 0V4', C.dark, 2.5)}${c(24, 22, 4, C.silver, ` stroke="${C.dark}" stroke-width="2"`)}${l('M16 21a8 8 0 008 1', C.dark, 2.5)}`),
  doctorVisit: svg(`${l('M8 4v9a8 8 0 0016 0V4', C.dark, 2.5)}${c(24, 22, 4, C.silver, ` stroke="${C.dark}" stroke-width="2"`)}${l('M16 21a8 8 0 008 1', C.dark, 2.5)}`),
  cross: svg(`${r(3, 3, 26, 26, C.white, 4, ` stroke="${C.red}" stroke-width="2"`)}${r(13, 7, 6, 18, C.red)}${r(7, 13, 18, 6, C.red)}`),
  eye: svg(`${p('M2 16c4-7 9-10 14-10s10 3 14 10c-4 7-9 10-14 10S6 23 2 16z', C.white, ` stroke="${C.dark}" stroke-width="2"`)}${c(16, 16, 5.5, C.teal)}${c(16, 16, 2.5, C.dark)}${c(18, 14, 1, C.white)}`),
  talk: svg(`${c(12, 11, 6, C.skin)}${p('M4 28c0-6 3-9 8-9s8 3 8 9z', C.blue)}${l('M23 10a6 6 0 010 8M26 7a10 10 0 010 14', C.dark, 2.2)}`),
  conversation: svg(`${p('M3 6h18a2 2 0 012 2v9a2 2 0 01-2 2h-9l-6 5v-5H3a2 2 0 01-2-2V8a2 2 0 012-2z', C.white, ` stroke="${C.dark}" stroke-width="2"`)}${c(8, 12.5, 1.6, C.dark)}${c(13, 12.5, 1.6, C.dark)}${c(18, 12.5, 1.6, C.dark)}${p('M27 12h3a1 1 0 011 1v8a1 1 0 01-1 1h-2v4l-5-4h-6', C.sky)}`),
  chat: svg(`${p('M3 6h18a2 2 0 012 2v9a2 2 0 01-2 2h-9l-6 5v-5H3a2 2 0 01-2-2V8a2 2 0 012-2z', C.white, ` stroke="${C.dark}" stroke-width="2"`)}${c(8, 12.5, 1.6, C.dark)}${c(13, 12.5, 1.6, C.dark)}${c(18, 12.5, 1.6, C.dark)}`),
  argue: FACES.angry, compliment: FACES.compliment, hug: FACES.hug, happy: FACES.happy, neutral: FACES.neutral, sad: FACES.sad, smile: FACES.smile, frown: FACES.frown,
  hangout: svg(`${p('M4 26L16 4l12 22z', C.yellow)}${p('M7 24L16 8l9 16z', C.orange)}${c(13, 18, 2, C.red)}${c(18, 14, 1.6, C.red)}${c(17, 21, 1.6, C.red)}`),
  clubs: svg(`${p('M12 4h8l3 24H9z', C.white, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(11, 8, 10, 2, C.red)}${c(16, 22, 3, C.red)}`), club: svg(`${p('M12 4h8l3 24H9z', C.white, ` stroke="${C.grey2}" stroke-width="1.5"`)}${r(11, 8, 10, 2, C.red)}${c(16, 22, 3, C.red)}`),
  volunteer: svg(`${p('M4 14c3-3 7-3 10 0l2 2 2-2c3-3 7-3 10 0-3 3-6 6-8 8H12c-2-2-5-5-8-8z', C.skin)}${heart(C.red).replace('<path', '<path transform="translate(8 2) scale(0.5)"')}`),
  emigrate: svg(`${c(16, 16, 13, C.sky)}${p('M8 9c4-1 7 2 6 5s-5 3-5 7c0 2 2 3 2 5-5-2-8-8-6-13 1-2 2-3 3-4zM20 6c3 2 6 5 6 9-2 1-4-1-5 1s1 5-1 6-4-3-6-3 1-5 3-6 2-4 3-7z', C.green)}`),
  vacation: svg(`${p('M4 15c3-5 21-5 24 0H4z', C.red)}${p('M4 15c3-5 21-5 24 0', C.yellow)}${r(15, 14, 2, 12, C.brown)}${p('M2 28c6-3 22-3 28 0z', C.yellow)}${c(26, 8, 4, C.yellow)}`),
  plane: svg(`${p('M4 18l9-2 6-10h3l-3 10 8 2-1 3-8-1-3 6h-3l1-6-7-1z', C.silver)}`),
  film: svg(`${r(3, 6, 26, 20, C.dark, 2)}${r(6, 10, 20, 12, C.sky)}${r(3, 6, 26, 3, C.grey2)}${r(3, 23, 26, 3, C.grey2)}${r(5, 27, 2, 2, C.white)}${r(25, 27, 2, 2, C.white)}`),
  movie: svg(`${r(3, 10, 26, 18, C.dark, 2)}${p('M3 10l24-6 1 4-24 6z', C.grey2)}${r(6, 14, 20, 10, C.sky)}`), movies: svg(`${r(3, 10, 26, 18, C.dark, 2)}${p('M3 10l24-6 1 4-24 6z', C.grey2)}${r(6, 14, 20, 10, C.sky)}`),
  theater: svg(`${p('M4 8c4-2 8-2 12 0v10a6 6 0 01-12 0z', C.yellow)}${p('M16 8c4-2 8-2 12 0v10a6 6 0 01-12 0z', C.pink)}${c(8, 12, 1.4, C.dark)}${c(24, 12, 1.4, C.dark)}${l('M7 17c1 1.5 2 1.5 3 0M22 18c1-1.5 2-1.5 3 0', C.dark, 1.5)}`),
  concert: svg(`${r(13, 3, 6, 14, C.grey2, 3)}${r(15, 17, 2, 8, C.dark)}${r(10, 25, 12, 3, C.dark, 1)}${p('M9 12a7 7 0 0014 0', 'none', ` stroke="${C.dark}" stroke-width="2"`)}`),
  toy: svg(`${c(16, 12, 7, C.wood)}${c(9, 8, 3, C.wood)}${c(23, 8, 3, C.wood)}${e(16, 22, 8, 7, C.wood)}${c(13.5, 11, 1.3, C.dark)}${c(18.5, 11, 1.3, C.dark)}${c(16, 14, 1.4, C.dark)}${e(16, 22, 4, 5, C.cream)}`),
  play: svg(`${c(16, 12, 7, C.wood)}${c(9, 8, 3, C.wood)}${c(23, 8, 3, C.wood)}${e(16, 22, 8, 7, C.wood)}${c(13.5, 11, 1.3, C.dark)}${c(18.5, 11, 1.3, C.dark)}`),
  ball: svg(`${c(16, 16, 12, C.white, ` stroke="${C.dark}" stroke-width="1.5"`)}${p('M16 9l5 4-2 6h-6l-2-6z', C.dark)}${l('M16 4v5M21 13l6-2M19 19l3 6M13 19l-3 6M11 13l-6-2', C.dark, 1.5)}`),
  skip: svg(`${c(16, 6, 3.5, C.skin)}${p('M13 10h6l3 8-3 1-2-4v6l4 8h-3l-4-7-3 7H8l4-9v-5l-3 3-2-2 4-5z', C.red)}`),
  tombstone: svg(`${p('M6 29V13a10 10 0 0120 0v16z', C.grey)}${r(3, 27, 26, 3, C.green2, 1)}${l('M16 11v10M12 15h8', C.grey2, 2)}`),
  candle: svg(`${p('M16 3c-3 4-3 7 0 8 3-1 3-4 0-8z', C.orange)}${r(12, 11, 8, 17, C.cream, 1)}${r(10, 27, 12, 2, C.grey2, 1)}`),
  party: svg(`${p('M4 28l7-18 11 11z', C.pink2)}${p('M6 24l5-11 6 6z', C.pink)}${c(22, 8, 2, C.yellow)}${c(26, 14, 1.6, C.teal)}${c(20, 3, 1.5, C.green)}${l('M22 12c2-2 4-2 6-4', C.blue, 1.6)}`),
  globe: svg(`${c(16, 16, 13, C.sky)}${p('M8 9c4-1 7 2 6 5s-5 3-5 7c0 2 2 3 2 5-5-2-8-8-6-13 1-2 2-3 3-4zM20 6c3 2 6 5 6 9-2 1-4-1-5 1s1 5-1 6-4-3-6-3 1-5 3-6 2-4 3-7z', C.green)}`),
  lang: svg(`${c(16, 16, 13, C.white, ` stroke="${C.blue}" stroke-width="2"`)}${e(16, 16, 6, 13, 'none', ` stroke="${C.blue}" stroke-width="1.5"`)}${l('M3 16h26M5 10h22M5 22h22', C.blue, 1.5)}`),
  menu: svg(`${l('M6 9h20M6 16h20M6 23h20', C.white, 3)}`), photo: svg(`${r(3, 8, 26, 18, C.dark, 3)}${c(16, 17, 6, C.silver)}${c(16, 17, 3.5, C.sky)}${r(11, 5, 10, 4, C.dark, 1)}`),
  cloud: svg(`${p('M9 26a6 6 0 010-12 8 8 0 0115-2 6 6 0 012 14z', C.sky)}`), tv: svg(`${r(3, 6, 26, 18, C.dark, 3)}${r(6, 9, 20, 12, C.sky)}${r(10, 25, 12, 3, C.grey2, 1)}`),
  chirp: svg(`${e(15, 18, 9, 7, C.sky)}${c(21, 11, 5, C.sky)}${p('M25 11l5 1-5 2z', C.orange)}${c(22, 10, 1.2, C.dark)}${p('M6 17l-4 6 6-2z', '#4aa8e0')}`),
  pack: svg(`${r(3, 8, 26, 16, C.grey2, 3)}${t(16, 19.5, 8, 'PACK', C.white)}`),
};
// ---- small status and premium glyphs ----
Object.assign(PICS, {
  apple: svg(`${c(16, 18, 10, C.red)}${p('M16 8c1-3 3-4 5-4-1 3-3 4-5 4z', C.green)}${r(15, 5, 2, 5, C.brown)}`),
  bottle: svg(`${r(11, 9, 10, 20, C.white, 4, ` stroke="${C.sky}" stroke-width="2"`)}${r(12, 16, 8, 10, C.cream, 2)}${r(13, 3, 6, 6, C.pink, 2)}`),
  edit: svg(`${p('M5 27l2-7L21 6l5 5-14 14z', C.yellow)}${p('M21 6l5 5-2 2-5-5z', C.dark)}${p('M5 27l2-7 5 5z', C.skin)}`),
  garage: svg(`${c(16, 16, 12, C.dark)}${c(16, 16, 7, C.grey2)}${c(16, 16, 3, C.silver)}${l('M16 4v5M16 23v5M4 16h5M23 16h5', C.grey2, 2)}`),
  payoff: svg(`${p('M10 9c0-3 3-4 6-4s6 1 6 4l-2 2H12z', C.grey2)}${p('M8 29c-4-6-1-16 8-16s12 10 8 16z', C.grey)}${t(16, 26, 11, '$', C.white)}`),
  landlord: svg(`${r(4, 10, 24, 18, C.grey2, 1)}${p('M2 11L16 3l14 8z', C.grey)}${r(7, 14, 4, 4, C.sky)}${r(14, 14, 4, 4, C.sky)}${r(21, 14, 4, 4, C.sky)}${r(7, 21, 4, 4, C.sky)}${r(21, 21, 4, 4, C.sky)}${r(14, 21, 4, 7, C.brown2)}`),
  properties: svg(`${p('M3 15L14 6l11 9v12H3z', C.cream)}${p('M3 15L14 6l11 9h-3l-8-6-8 6z', C.orange)}${r(11, 20, 5, 7, C.brown, 1)}${p('M20 20l9-6v14h-9z', C.silver)}`),
  special: svg(`${star(C.yellow)}${c(16, 15, 3, C.white)}`),
  rewind: svg(`${c(16, 16, 13, C.red)}${p('M18 9l-8 7 8 7zM24 9l-8 7 8 7z', C.white)}`),
  reconnect: svg(`${c(11, 10, 5, C.skin)}${p('M2 27c0-6 4-9 9-9s9 3 9 9z', C.blue)}${l('M22 8a6 6 0 016 6M19 12a3 3 0 013 3', C.green, 2.2)}`),
  lock: svg(`${r(7, 14, 18, 14, C.gold, 3)}${p('M11 14V10a5 5 0 0110 0v4', 'none', ` stroke="${C.grey2}" stroke-width="3"`)}${c(16, 21, 2, C.dark)}`),
});
export const FLAGS = {
  'United States': `${r(0, 0, 32, 32, '#b22234')}${r(0, 4, 32, 3, '#fff')}${r(0, 11, 32, 3, '#fff')}${r(0, 18, 32, 3, '#fff')}${r(0, 25, 32, 3, '#fff')}${r(0, 0, 14, 14, '#3c3b6e')}`,
  Canada: `${r(0, 0, 32, 32, '#fff')}${r(0, 0, 8, 32, '#d52b1e')}${r(24, 0, 8, 32, '#d52b1e')}${p('M16 8l2 5 4-2-2 6h-8l-2-6 4 2z', '#d52b1e')}`,
  Brazil: `${r(0, 0, 32, 32, '#009c3b')}${p('M16 4l12 12-12 12L4 16z', '#ffdf00')}${c(16, 16, 5.5, '#002776')}`,
  Portugal: `${r(0, 0, 12, 32, '#006600')}${r(12, 0, 20, 32, '#ff0000')}${c(12, 16, 4, '#ffdf00')}`,
  Ireland: `${r(0, 0, 11, 32, '#169b62')}${r(11, 0, 10, 32, '#fff')}${r(21, 0, 11, 32, '#ff883e')}`,
  Japan: `${r(0, 0, 32, 32, '#fff')}${c(16, 16, 8, '#bc002d')}`,
  Australia: `${r(0, 0, 32, 32, '#00247d')}${c(24, 22, 2, '#fff')}${c(20, 12, 1.5, '#fff')}${c(27, 10, 1.5, '#fff')}${c(8, 22, 2.5, '#fff')}${r(0, 0, 14, 12, '#cf142b')}`,
  'South Africa': `${r(0, 0, 32, 32, '#fff')}${r(0, 0, 32, 10, '#de3831')}${r(0, 22, 32, 10, '#002395')}${p('M0 6l14 10L0 26z', '#007a4d')}${r(0, 12, 32, 8, '#007a4d')}${p('M0 10l10 6-10 6z', '#ffb612')}${p('M0 12l6 4-6 4z', '#000')}`,
  Germany: `${r(0, 0, 32, 11, '#000')}${r(0, 11, 32, 10, '#dd0000')}${r(0, 21, 32, 11, '#ffce00')}`,
  Mexico: `${r(0, 0, 11, 32, '#006847')}${r(11, 0, 10, 32, '#fff')}${r(21, 0, 11, 32, '#ce1126')}${c(16, 16, 3, '#8a6d3b')}`,
  'South Korea': `${r(0, 0, 32, 32, '#fff')}${c(16, 16, 7, '#cd2e3a')}${p('M9 16a7 7 0 0014 0z', '#0047a0')}`,
  Spain: `${r(0, 0, 32, 8, '#aa151b')}${r(0, 8, 32, 16, '#f1bf00')}${r(0, 24, 32, 8, '#aa151b')}`,
  Nigeria: `${r(0, 0, 11, 32, '#008751')}${r(11, 0, 10, 32, '#fff')}${r(21, 0, 11, 32, '#008751')}`,
  India: `${r(0, 0, 32, 11, '#ff9933')}${r(0, 11, 32, 10, '#fff')}${r(0, 21, 32, 11, '#138808')}${c(16, 16, 3.5, 'none', ' stroke="#000080" stroke-width="1.2"')}`,
  Norway: `${r(0, 0, 32, 32, '#ba0c2f')}${r(9, 0, 7, 32, '#fff')}${r(0, 12, 32, 8, '#fff')}${r(11, 0, 3, 32, '#00205b')}${r(0, 14.5, 32, 3, '#00205b')}`,
  Argentina: `${r(0, 0, 32, 11, '#74acdf')}${r(0, 11, 32, 10, '#fff')}${r(0, 21, 32, 11, '#74acdf')}${c(16, 16, 3, '#f6b40e')}`,
};
export function flagSvg(place) {
  const key = String(place || '').split(', ').pop();
  const body = FLAGS[key] || `${r(0, 0, 32, 32, '#d0d5db')}`;
  return `<svg viewBox="0 0 32 32" class="bl-flag-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><clipPath id="fl"><rect width="32" height="32" rx="3"/></clipPath><g clip-path="url(#fl)">${body}</g></svg>`;
}
// heavier versions of the glyphs that read too light beside the reference
for (const name of ['meditate', 'mindBody', 'figure', 'spa', 'salon', 'adoption', 'toy', 'play', 'clubs', 'club', 'doctor', 'stethoscope', 'doctorVisit', 'gym', 'martial', 'walk', 'footprints', 'skip', 'hangout', 'leaf', 'diet', 'startFamily', 'retire', 'vacation', 'resign', 'workHarder', 'easy', 'people', 'friends', 'social', 'reconnect', 'person', 'volunteer', 'talk', 'bird', 'chirp', 'rabbit', 'fish', 'hamster']) {
  if (PICS[name]) PICS[name] = PICS[name].replace('xmlns="http://www.w3.org/2000/svg">', 'xmlns="http://www.w3.org/2000/svg"><g transform="translate(16 16) scale(1.16) translate(-16 -16)">').replace(/<\/svg>$/, '</g></svg>');
}
PICS.skull = svg(skull('#e9edef'));
PICS.resign = svg(`${p('M9 30c-4-2-6-7-4-12l3-6c1-2 3-2 4 0l1 3V8a2 2 0 014 0v7l1-9a2 2 0 014 0l-1 9 2-6a2 2 0 014 1l-2 8 2-3a2 2 0 013 2l-3 9c-2 5-8 8-13 5z', C.yellow)}${l('M22 4l3-3M26 8l4-1', C.dark, 1.8)}`);
PICS.retire = svg(`${p('M2 30c4-8 24-8 28 0z', C.green)}${r(15, 6, 2, 22, C.dark)}${p('M17 6l10 4-10 4z', C.red)}${c(16, 27, 2, C.white)}`);
PICS.workHarder = svg(`${p('M5 24c-2-6 1-12 6-13l3-6 5 1-2 6c5 0 9 3 10 8v8H5z', C.skin)}${p('M13 11l3-6 5 1-2 6c-2-1-4-1-6-1z', C.skin)}${e(14, 15, 5, 3.5, '#e5b48f')}`);
PICS.gym = svg(`${r(1, 11, 5, 10, C.dark, 1)}${r(26, 11, 5, 10, C.dark, 1)}${r(6, 8, 5, 16, C.grey2, 1)}${r(21, 8, 5, 16, C.grey2, 1)}${r(11, 14, 10, 4, C.grey2)}`);
PICS.doctor = svg(`${l('M8 3v10a8 8 0 0016 0V3', C.dark, 3.5)}${c(24, 23, 4.5, C.silver, ` stroke="${C.dark}" stroke-width="2.5"`)}${l('M16 21a8 8 0 008 2', C.dark, 3.5)}${r(5, 1, 6, 4, C.grey2, 1)}${r(21, 1, 6, 4, C.grey2, 1)}`);
PICS.stethoscope = PICS.doctor; PICS.doctorVisit = PICS.doctor;
PICS.instrument = svg(`${p('M12 31c-6 0-9-4-8-10 1-3 4-4 5-8l2-11h4l-1 11c3 2 6 5 6 9 0 5-3 9-8 9z', C.wood)}${c(13, 22, 3.5, C.dark)}${l('M14 13l8-9', C.dark, 2.5)}${r(21, 2, 6, 3.5, C.dark, 1)}`);
PICS.music = PICS.instrument;
// aliases
Object.assign(PICS, { crown: PICS.medal, bosom: PICS.people, unlock: PICS.key, arrowUp: PICS.workHarder, arrowDown: PICS.easy, palette: PICS.theater, wheels: PICS.car, movingUp: PICS.raise });

export function pic(name, extraClass = '') {
  return `<span class="bl-pic${extraClass ? ` ${extraClass}` : ''}" aria-hidden="true">${PICS[name] || PICS.star}</span>`;
}

// ---- Avatars: a small drawn head per person, deterministic from the name -------------------------------------
const SKINS = ['#f6d3b5', '#f1c19a', '#d9a06e', '#b97a4b', '#8d5a34', '#5c3a1f'];
const HAIRS = ['#2b1d12', '#5a3a1f', '#8b5a2b', '#c98b3a', '#e0c070', '#b23b2a', '#1e1e1e'];
const SHIRTS = [C.blue, C.red, C.green, C.purple, C.teal, C.orange, C.pink2];
function hash(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
export function avatarSvg(who, size = 44) {
  if (!who) return svg(person());
  if (who.role === 'pet') { const a = { dog, cat, hamster: PICS.hamster, bird: PICS.bird, rabbit: PICS.rabbit, fish: PICS.fish, horse: PICS.horse }[who.species] || PICS.paw; return a; }
  if (who.alive === false && who.role !== 'pet' && who.rejected !== true && who.diedAt !== undefined) return svg(skull());
  const h = hash(who.name || who.id || 'x');
  const skin = SKINS[h % SKINS.length]; const hair = who.age >= 60 ? '#c9cdd3' : HAIRS[(h >> 3) % HAIRS.length]; const shirt = SHIRTS[(h >> 6) % SHIRTS.length];
  const female = who.gender === 'female'; const glasses = (h >> 9) % 4 === 0 && who.age >= 8; const beard = !female && who.age >= 22 && (h >> 11) % 3 === 0;
  const bald = !female && who.age >= 50 && (h >> 13) % 3 === 0;
  const face = `${c(32, 30, 17, skin)}${c(25, 29, 2.2, C.dark)}${c(39, 29, 2.2, C.dark)}${l(who.age < 3 ? 'M27 37c2 2 8 2 10 0' : 'M27 38c2 3 8 3 10 0', C.dark, 2)}`;
  let hairShape = '';
  if (who.age < 3) hairShape = who.age < 1 ? l('M32 12c1-3 3-4 5-3', hair, 2.5) : p('M20 22c2-8 22-8 24 0-4-4-20-4-24 0z', hair);
  else if (female) hairShape = `${p('M13 34c-2-14 4-24 19-24s21 10 19 24c-3-2-4-8-4-12-6 2-24 2-30 0 0 4-1 10-4 12z', hair)}${p('M13 34c0-6 2-10 4-13 1 6 0 10-1 15zM51 34c0-6-2-10-4-13-1 6 0 10 1 15z', hair)}`;
  else if (!bald) hairShape = p('M15 25c1-9 7-14 17-14s16 5 17 14c-3-3-7-5-17-5s-14 2-17 5z', hair);
  const beardShape = beard ? p('M18 34c2 10 6 14 14 14s12-4 14-14c-3 4-8 6-14 6s-11-2-14-6z', hair) : '';
  const glassesShape = glasses ? `${c(25, 29, 5, 'none', ` stroke="${C.dark}" stroke-width="1.8"`)}${c(39, 29, 5, 'none', ` stroke="${C.dark}" stroke-width="1.8"`)}${l('M30 29h4', C.dark, 1.8)}` : '';
  const shirtShape = p('M10 64c0-10 8-16 22-16s22 6 22 16z', shirt);
  return `<svg viewBox="0 0 64 64" class="bl-avatar-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="av"><circle cx="32" cy="32" r="32"/></clipPath></defs><g clip-path="url(#av)">${shirtShape}${face}${beardShape}${hairShape}${glassesShape}</g></svg>`;
}
export const avatarFor = (p) => avatarSvg(p);

// White filled glyphs for the bottom navigation rings (the reference draws solid white shapes on colour).
export const NAV = {
  briefcase: svg(`${r(6, 11, 20, 13, C.white, 2)}${r(12, 7, 8, 5, C.white, 1)}${r(6, 16, 20, 1.5, '#0000', 0)}`),
  house: svg(`${p('M4 16L16 6l12 10v10H4z', C.white)}${r(13, 18, 6, 8, C.teal, 1)}`),
  heart: svg(heart(C.white)), dots: svg(`${c(8, 16, 2.6, C.white)}${c(16, 16, 2.6, C.white)}${c(24, 16, 2.6, C.white)}`),
  cap: svg(`${p('M16 7L3 13l13 6 13-6z', C.white)}${p('M9 16v5c0 2 3 4 7 4s7-2 7-4v-5l-7 3z', C.white)}`),
  baby: svg(`${c(16, 14, 8, C.white)}${p('M6 28c0-5 4-8 10-8s10 3 10 8z', C.white)}`),
  person: svg(person(C.white, C.white)), flag: svg(`${r(8, 5, 2.5, 22, C.white)}${p('M10.5 6h14l-3 4 3 4h-14z', C.white)}`),
  moneybag: svg(`${p('M12 8c0-2 2-3 4-3s4 1 4 3l-1 2h-6z', C.white)}${p('M9 28c-4-6-1-16 7-16s11 10 7 16z', C.white)}${t(16, 25, 10, '$', C.teal)}`),
  tombstone: svg(`${p('M8 28V14a8 8 0 0116 0v14z', C.white)}`),
};
export const navGlyph = (name) => NAV[name] || NAV.dots;

// Star-with-speed-lines counter mark (header) and the ribbon icons.
export const STAR_COUNTER = svg(`${l('M2 11h9M1 16h7M2 21h9', C.yellow, 2.2)}${star(C.yellow, 0.85, 8, 2.5)}`);
export const LOGO_MARK = svg(`${c(16, 16, 15, C.white)}${p('M16 7c5 0 8 3 8 7 0 3-2 5-5 6l1 5h-4l-1-5c-3-1-5-3-5-6 0-4 3-7 6-7z', C.red)}${c(16, 13, 2, C.white)}`);
export const SPLASH_MARK = `<svg viewBox="0 0 200 200" class="bl-splash-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><filter id="sh"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.35"/></filter></defs><g filter="url(#sh)"><ellipse cx="132" cy="56" rx="52" ry="42" fill="#fff" transform="rotate(-28 132 56)"/><path d="M92 92c-8 26-14 40-32 52-20 13-40 10-52 30 14-14 30-10 50-24 24-16 32-36 40-58z" fill="#fff"/></g></svg>`;
export { skull, trophy, C as COLORS, svg as svgWrap };
