// Life badges: original milestone rewards shown as a banner when earned. Purely feedback.
import * as People from './people.js';
import * as Career from './career.js';
import { netWorth } from './economy.js';

export const BADGES = [
  { id: 'firstSteps', name: 'First Steps', desc: 'Reach age 1', when: (s) => s.player.age >= 1 },
  { id: 'schoolDays', name: 'School Days', desc: 'Start school', when: (s) => s.education.stage === 'school' || s.education.highSchoolGraduate },
  { id: 'bosomBuddies', name: 'Bosom Buddies', desc: 'Make a friend', when: (s) => s.relationships.some((r) => ['friend', 'bestFriend', 'coworker'].includes(r.role)) },
  { id: 'socialButterfly', name: 'Social Butterfly', desc: 'Make three friends', when: (s) => s.relationships.filter((r) => ['friend', 'bestFriend', 'coworker'].includes(r.role)).length >= 3 },
  { id: 'capAndGown', name: 'Cap and Gown', desc: 'Graduate from high school', when: (s) => s.education.highSchoolGraduate },
  { id: 'scholar', name: 'Scholar', desc: 'Earn a degree or certificate', when: (s) => !!s.education.degree || !!s.education.trade },
  { id: 'nineToFive', name: 'Nine to Five', desc: 'Get your first full-time job', when: (s) => Career.isEmployed(s.career) && !Career.currentCareer(s.career).partTime },
  { id: 'movingUp', name: 'Moving Up', desc: 'Earn a promotion', when: (s) => s.career.promotions >= 1 },
  { id: 'licensed', name: 'Licensed', desc: 'Pass your driving test', when: (s) => s.player.hasLicence },
  { id: 'homeowner', name: 'Homeowner', desc: 'Buy a home', when: (s) => s.assets.some((a) => a.type === 'home') },
  { id: 'wheels', name: 'Wheels', desc: 'Own a car', when: (s) => s.assets.some((a) => a.kind === 'car') },
  { id: 'sweethearts', name: 'Sweethearts', desc: 'Start a relationship', when: (s) => !!People.partner(s) },
  { id: 'justMarried', name: 'Just Married', desc: 'Get married', when: (s) => s.relationships.some((r) => r.role === 'spouse') },
  { id: 'newParent', name: 'New Parent', desc: 'Welcome a child', when: (s) => People.children(s).length >= 1 },
  { id: 'petPal', name: 'Pet Pal', desc: 'Adopt a pet', when: (s) => s.relationships.some((r) => r.role === 'pet') },
  { id: 'sixFigures', name: 'Six Figures', desc: 'Reach a net worth of $100,000', when: (s) => netWorth(s) >= 100000 },
  { id: 'millionaire', name: 'Millionaire', desc: 'Reach a net worth of $1,000,000', when: (s) => netWorth(s) >= 1000000 },
  { id: 'goldWatch', name: 'Gold Watch', desc: 'Retire', when: (s) => s.career.retired },
  { id: 'halfCentury', name: 'Half Century', desc: 'Reach age 50', when: (s) => s.player.age >= 50 },
  { id: 'elder', name: 'Elder', desc: 'Reach age 80', when: (s) => s.player.age >= 80 },
  { id: 'fullLife', name: 'A Full Life', desc: 'Complete a life', when: (s) => !s.player.alive },
];

// Checks every badge and returns the ones newly earned (also recorded on the state).
export function checkBadges(state) {
  if (!state.badges) state.badges = [];
  const earned = [];
  for (const b of BADGES) {
    if (state.badges.includes(b.id)) continue;
    let ok = false;
    try { ok = b.when(state); } catch (error) { ok = false; }
    if (ok) { state.badges.push(b.id); earned.push(b); }
  }
  return earned;
}

export const findBadge = (id) => BADGES.find((b) => b.id === id) || null;
