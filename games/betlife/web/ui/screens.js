// Every screen of BetLife as a function of the game state. Screens only read state.
import * as G from '../game/game-state.js';
import * as Education from '../game/education.js';
import * as Career from '../game/career.js';
import { CAREERS, CATEGORIES, MILITARY, DREAM, REGULAR, requirementText } from '../game/careers.js';
import { HR_OPTIONS } from '../game/career.js';
import * as Pets from '../game/pets.js';
import { BADGES } from '../game/badges.js';
import * as People from '../game/people.js';
import * as Assets from '../game/assets.js';
import * as Activities from '../game/activities.js';
import { PLACES } from '../game/life-generator.js';
import { journalYears } from '../game/journal.js';
import { stageLabel } from '../game/player.js';
import { icon } from '../game/icons.js';
import { esc, money, pct, strip, section, row, infoRow, meter, footerBar, note, empty, screen } from './render.js';

const isEmployed = (s) => Career.isEmployed(s.career);
const actionsLeft = (s) => `${s.actionsRemaining} of ${G.ACTIONS_PER_YEAR} actions left this year`;

// ---- Start, menu and new life ----------------------------------------------------------------------------

export function start(ctx) {
  const { state, version } = ctx;
  const saved = state ? row(state.player.alive ? 'Continue' : 'Last Life', state.player.alive ? { sub: `${state.player.name}, age ${state.player.age}`, icon: 'person', action: 'go', data: { target: 'main' } }
    : { sub: `${state.player.name} lived to ${state.player.age}`, icon: 'candle', action: 'go', data: { target: 'main' } }) : '';
  return `<header class="bl-header bl-header-main"><span class="bl-header-spacer"></span>
      <div class="bl-brand"><span>BET</span><span class="bl-brand-accent">LIFE</span></div><span class="bl-header-spacer"></span></header>
    <div class="bl-scroll">${section('Main Menu')}
    ${row('New Life', { sub: 'Start from birth', icon: 'sparkle', action: 'newLife', right: 'dots' })}${saved}
    ${section('More')}
    ${row('About BetLife', { sub: 'How the game works', icon: 'info', action: 'about', right: 'dots' })}
    <a class="bl-row" href="../../"><span class="bl-row-icon">${icon('exit')}</span><span class="bl-row-text"><span class="bl-row-title">Back to Arcade</span><span class="bl-row-sub">Leave the game</span></span><span class="bl-row-right">${icon('chevron')}</span></a>
    <p class="bl-footnote">BetLife ${esc(version)}</p></div>`;
}

export function newlife(ctx) {
  const places = PLACES.map((p, i) => `<option value="${i}">${esc(p.city)}, ${esc(p.country)}</option>`).join('');
  const body = `<form class="bl-form" id="bl-custom-form">
    <label>First name<input name="firstName" maxlength="20" placeholder="Leave blank for random"></label>
    <label>Last name<input name="lastName" maxlength="20" placeholder="Leave blank for random"></label>
    <fieldset><legend>Gender</legend>
      <label class="bl-radio"><input type="radio" name="gender" value="female" checked> Girl</label>
      <label class="bl-radio"><input type="radio" name="gender" value="male"> Boy</label></fieldset>
    <label>Birthplace<select name="placeIndex"><option value="-1">Random</option>${places}</select></label>
    ${note('Stats, family and everything else are generated at birth. There is no stat editor: every life starts fair.')}
    <button type="button" class="bl-btn bl-btn-green" data-action="startCustom">START LIFE</button>
    <button type="button" class="bl-btn bl-btn-blue" data-action="startRandom">RANDOM LIFE INSTEAD</button>
    <button type="button" class="bl-text-btn" data-action="go" data-target="start">Back</button></form>`;
  return `<header class="bl-header bl-header-main"><span class="bl-header-spacer"></span><div class="bl-brand"><span>BET</span><span class="bl-brand-accent">LIFE</span></div><span class="bl-header-spacer"></span></header>
    <div class="bl-titlebar"><button class="bl-round-btn" data-action="go" data-target="start" aria-label="Back">${icon('back')}</button><h1 class="bl-screen-title">New Life</h1></div><div class="bl-scroll">${body}</div>`;
}

export function menu(ctx) {
  const { state, version } = ctx;
  return screen(state, 'Menu', `
    ${section('This Life')}
    ${infoRow('Character', state.player.name)}${infoRow('Age', `${state.player.age} years`)}${infoRow('Stage', state.player.alive ? stageLabel(state.player.age) : 'Life complete')}
    ${section('Options')}
    ${row('New Life', { sub: 'Start over from birth', icon: 'sparkle', action: 'newLife', right: 'dots' })}
    ${row('Main Menu', { sub: 'Back to the start screen', icon: 'reset', action: 'go', data: { target: 'start' } })}
    ${row('About BetLife', { sub: `Version ${version}`, icon: 'info', action: 'about', right: 'dots' })}
    ${row('Life Badges', { sub: `${(state.badges || []).length} of ${BADGES.length} earned`, icon: 'medal', action: 'go', data: { target: 'badges' } })}
    ${section('Admin Tools')}
    ${row('Life Editor', { sub: 'Change stats or force outcomes', icon: 'tools', disabled: true, note: 'Premium candidate · not part of normal play', badge: 'PREMIUM' })}
    <a class="bl-row" href="../../"><span class="bl-row-icon">${icon('exit')}</span><span class="bl-row-text"><span class="bl-row-title">Back to Arcade</span><span class="bl-row-sub">Leave the game</span></span><span class="bl-row-right">${icon('chevron')}</span></a>`);
}

// ---- Main life screen ------------------------------------------------------------------------------------

function firstNav(state) {
  const p = state.player;
  if (!p.alive) return ['Summary', 'candle', 'summary'];
  if (Education.isEnrolled(state.education)) return ['School', 'cap', 'school'];
  if (isEmployed(state)) return ['Job', 'briefcase', 'job'];
  if (state.career.retired) return ['Retired', 'flag', 'occupation'];
  if (p.age >= 15) return ['Occupation', 'briefcase', 'occupation'];
  return [p.age < 4 ? 'Infant' : 'Child', p.age < 4 ? 'baby' : 'person', 'growing'];
}

export function main(ctx) {
  const { state } = ctx;
  const p = state.player;
  const journal = journalYears(state.timeline).map((year) => `<section class="bl-year"><h3>Age: ${year.age} ${year.age === 1 ? 'year' : 'years'}</h3>
      ${year.entries.map((e) => `<p class="bl-entry kind-${e.kind}">${esc(e.text)}</p>`).join('')}</section>`).join('');
  const first = firstNav(state);
  const nav = (label, iconName, target, extra = '') => `<button class="bl-nav-item${extra}" data-action="go" data-target="${target}"><span class="bl-nav-ring">${icon(iconName)}</span><span>${label}</span></button>`;
  const ageButton = p.alive
    ? `<button class="bl-age" data-action="age" aria-label="Age one year"><span class="bl-age-plus">+</span><span class="bl-age-label">Age</span></button><button class="bl-rewind" data-action="premium" data-feature="Rewind" aria-label="Rewind a year (premium candidate)"><span>−</span><small>Age</small></button>`
    : `<button class="bl-age is-newlife" data-action="newLife" aria-label="New life"><span class="bl-age-icon">${icon('seedling')}</span><span class="bl-age-label">New Life</span></button>`;
  return `<header class="bl-header bl-header-main${p.alive ? '' : ' is-dead'}">
      <button class="bl-round-btn bl-menu-btn" data-action="go" data-target="menu" aria-label="Menu">${icon('menu')}</button>
      <div class="bl-brand"><span>BET</span><span class="bl-brand-accent">LIFE</span></div>
      <button class="bl-header-pill bl-badge-pill" data-action="go" data-target="badges" aria-label="Life badges">${icon('medal')} ${(state.badges || []).length}</button></header>
    ${strip(state)}
    <div class="bl-journal" id="bl-journal">${journal}</div>
    <nav class="bl-nav${p.alive ? '' : ' is-dead'}" aria-label="Game sections">
      ${nav(first[0], first[1], first[2], ' is-first')}${p.alive ? nav('Assets', 'house', 'assets') : '<span class="bl-nav-empty"></span>'}
      <span class="bl-nav-gap" aria-hidden="true"></span>
      ${p.alive ? nav('Relationships', 'heart', 'relationships') + nav('Activities', 'dots', 'activities') : '<span class="bl-nav-empty"></span><span class="bl-nav-empty"></span>'}
      ${ageButton}</nav>
    <div class="bl-stats${p.alive ? '' : ' is-dead'}">
      ${meter('Happiness', p.happiness, p.happiness >= 50 ? 'smile' : 'frown', 'happiness')}${meter('Health', p.health, 'heart', 'health')}
      ${meter('Smarts', p.smarts, 'bulb', 'smarts')}${meter('Looks', p.looks, 'sparkle', 'looks')}</div>`;
}

// ---- Growing up (infant / child) ---------------------------------------------------------------------------

export function growing(ctx) {
  const { state } = ctx;
  const p = state.player;
  const family = People.parents(state).concat(People.siblings(state), People.pets(state));
  return screen(state, p.age < 4 ? 'Infant' : 'Child', `
    ${section('You')}
    ${infoRow('Name', p.name)}${infoRow('Age', `${p.age} years`)}${infoRow('Stage', stageLabel(p.age))}${infoRow('Born in', p.birthplace)}${infoRow('Birthday', p.birthday)}
    ${infoRow('School', p.age < Education.SCHOOL_START_AGE ? `Starts at age ${Education.SCHOOL_START_AGE}` : Education.schoolName(state.education))}
    ${section('Family')}
    ${family.map((r) => personRow(r)).join('')}
    ${section('Tip')}${note(p.age < G.ACTIVITY_MIN_AGE ? 'Spend time with your family in Relationships. Activities open up at age 3.' : 'Play, read and spend time with people: every action shapes your stats and your story.')}`);
}

// ---- School --------------------------------------------------------------------------------------------------

export function school(ctx) {
  const { state } = ctx;
  const e = state.education;
  const p = state.player;
  if (!Education.isEnrolled(e)) return occupation(ctx);
  const higher = Education.isUniversity(e) || Education.isTradeSchool(e);
  const grade = Education.gradeLetter(e.performance);
  const actions = [
    ['studyHarder', 'Study Harder', 'Grades up, a little less fun', 'book', 5],
    ['askTeacher', higher ? 'Office Hours' : 'Ask the Teacher for Help', 'Extra help with the hard parts', 'chat', 8],
    ['joinClub', 'Join a Club', 'Meet a new friend', 'people', 10],
    ['skipClass', 'Skip Class', 'More fun, worse grades', 'sun', 13],
  ].map(([id, title, sub, ic, minAge]) => row(title, { sub, icon: ic, action: 'study', data: { study: id }, right: 'dots', disabled: p.age < minAge, note: `Age ${minAge}+` }));
  const tuition = Education.isUniversity(e) ? infoRow('Tuition', `${money(Education.UNIVERSITY_TUITION)} / year`) : Education.isTradeSchool(e) ? infoRow('Tuition', `${money(Education.TRADE_TUITION)} / year`) : '';
  const loan = p.money < 0 ? infoRow('Student loan', money(p.money), 'negative') : '';
  return screen(state, higher ? (Education.isUniversity(e) ? 'University' : 'Trade School') : 'School', `
    ${section('You')}
    ${row(Education.schoolName(e), { sub: `${Education.schoolLevel(e)} · ${Education.yearLabel(e)}`, icon: 'cap', right: 'none' })}
    ${row(`Grades: ${grade}`, { icon: 'medal', right: 'none', bar: { label: 'Performance', value: e.performance, tone: e.performance < 50 ? 'warn' : '' } })}
    ${e.major ? infoRow(Education.isUniversity(e) ? 'Major' : 'Trade', e.major) : ''}${tuition}${loan}
    ${infoRow('Average so far', `${Education.averageGrade(e)}% (${Education.gradeLetter(Education.averageGrade(e))})`)}${infoRow('Actions', actionsLeft(state))}
    ${section('Actions')}${actions.join('')}
    ${p.age >= 14 ? section('Work') + row('Freelance Gigs', { sub: 'Make some quick money', icon: 'coin', action: 'freelance', right: 'dots', disabled: p.age < 16, note: 'Age 16+' })
      + row('Part-Time Jobs', { sub: Career.isEmployed(state.career) ? `Working as ${p.occupation}` : 'Hourly listings for students', icon: 'history', action: 'go', data: { target: 'partTimeJobs' }, disabled: p.age < G.JOBS_MIN_AGE, note: `Age ${G.JOBS_MIN_AGE}+` }) : ''}
    ${higher ? section('Options') + row('Leave Your Studies', { sub: 'Drop out without finishing', icon: 'exit', action: 'dropOut', right: 'dots', tone: 'danger' }) : ''}`);
}

export function university(ctx) {
  const { state } = ctx;
  return screen(state, 'University', `
    ${section(Education.UNIVERSITY_NAME)}
    ${infoRow('Length', `${Education.UNIVERSITY_YEARS} years`)}${infoRow('Tuition', `${money(Education.UNIVERSITY_TUITION)} / year (student loan if needed)`)}
    ${section('Choose a major')}
    ${Education.MAJORS.map((m) => row(m.id, { sub: m.note, icon: 'cap', action: 'enrollUniversity', data: { major: m.id }, right: 'dots' })).join('')}`, { back: 'occupation', mode: 'back' });
}

export function tradeSchool(ctx) {
  const { state } = ctx;
  return screen(state, 'Trade School', `
    ${section(Education.TRADE_SCHOOL_NAME)}
    ${infoRow('Length', `${Education.TRADE_SCHOOL_YEARS} years`)}${infoRow('Tuition', `${money(Education.TRADE_TUITION)} / year`)}
    ${section('Choose a trade')}
    ${Education.TRADES.map((t) => row(t.id, { sub: t.note, icon: 'tools', action: 'enrollTrade', data: { trade: t.id }, right: 'dots' })).join('')}`, { back: 'occupation', mode: 'back' });
}

// ---- Occupation, jobs and career ----------------------------------------------------------------------------

export function occupation(ctx) {
  const { state } = ctx;
  const p = state.player;
  const c = state.career;
  const e = state.education;
  const canHigher = Education.canEnrollHigher(e);
  const you = isEmployed(state)
    ? row(Career.jobTitle(c), { sub: `${Career.employer(c)} · ${money(c.salary)} / year`, icon: 'briefcase', action: 'go', data: { target: 'job' }, bar: { label: 'Performance', value: c.performance } })
    : c.retired ? row('Retired', { sub: c.pension > 0 ? `Pension ${money(c.pension)} / year` : 'No pension', icon: 'flag', right: 'none' })
      : row(p.occupation, { sub: Education.educationSummary(e), icon: 'person', right: 'none' });
  const findWork = c.retired ? '' : section('Find Work')
    + row('Freelance Gigs', { sub: 'Make some quick money', icon: 'coin', action: 'freelance', right: 'dots', disabled: p.age < 16, note: 'Age 16+' })
    + row('Job Recruiter', { sub: '$1,000 · find the best job you qualify for', icon: 'chat', action: 'recruiterConfirm', right: 'dots', disabled: p.age < 18 || !e.highSchoolGraduate, note: 'Needs a high school diploma' })
    + row('Jobs', { sub: `Full-time listings · ${CAREERS.filter((j) => !j.partTime && Career.isEligible(state, j)).length} you qualify for`, icon: 'briefcase', action: 'go', data: { target: 'jobs' }, disabled: p.age < 16, note: 'Age 16+' })
    + row('Part-Time Jobs', { sub: 'Hourly listings for students', icon: 'history', action: 'go', data: { target: 'partTimeJobs' }, disabled: p.age < G.JOBS_MIN_AGE, note: `Age ${G.JOBS_MIN_AGE}+` });
  const programs = Object.values(Education.PROGRAMS).map((pr) => row(pr.name, { sub: `${pr.years} years · ${pr.note}`, icon: pr.id === 'law' ? 'list' : pr.id === 'medical' ? 'cross' : pr.id === 'business' ? 'briefcase' : 'cap', action: 'programConfirm', data: { program: pr.id }, right: 'dots',
    disabled: !Education.canEnrollProgram(e, pr), note: (e.credentials || []).includes(pr.credential) ? 'Completed' : !e.degree ? 'Needs a university degree' : pr.needs ? `Needs a ${pr.needs.join(' or ')} degree` : 'Not available right now' })).join('');
  const education = canHigher && !c.retired ? section('Education')
    + row('University', { sub: e.degree ? `You already hold a ${e.degree} degree` : `${Education.UNIVERSITY_YEARS} years · choose a major`, icon: 'cap', action: 'go', data: { target: 'university' }, disabled: !!e.degree })
    + row('Trade School', { sub: e.trade ? `You already hold a ${e.trade} certificate` : `${Education.TRADE_SCHOOL_YEARS} years · hands-on training`, icon: 'tools', action: 'go', data: { target: 'tradeSchool' }, disabled: !!e.trade })
    + programs : '';
  const special = c.retired ? '' : section('Special Careers')
    + row('Military', { sub: 'Enlist in one of five branches', icon: 'flag', action: 'go', data: { target: 'military' }, disabled: p.age < 18, note: 'Age 18+' })
    + row('Dream Careers', { sub: 'Acting, athletics, music, writing, space, politics', icon: 'star', action: 'go', data: { target: 'dream' }, disabled: p.age < 16, note: 'Age 16+' });
  const history = c.history.length || isEmployed(state) ? section('History') + row('Career History', { sub: `${c.history.length + (isEmployed(state) ? 1 : 0)} positions · ${c.yearsWorked} years worked`, icon: 'history', action: 'go', data: { target: 'careerHistory' } }) : '';
  return screen(state, 'Occupation', `${section('You')}${you}${infoRow('Education', Education.educationSummary(e))}${findWork}${special}${education}${history}`);
}

export function job(ctx) {
  const { state } = ctx;
  const c = state.career;
  if (!isEmployed(state)) return occupation(ctx);
  const def = Career.currentCareer(c);
  const pos = Career.currentPosition(c);
  const next = def.ladder[c.rung + 1];
  const actions = [
    row('Work Harder', { sub: 'Performance up, a little tiring', icon: 'arrowUp', action: 'job', data: { job: 'workHarder' }, right: 'dots' }),
    row('Take It Easy', { sub: 'Relax at the cost of performance', icon: 'sun', action: 'job', data: { job: 'takeItEasy' }, right: 'dots' }),
    row('Ask for a Raise', { sub: c.askedRaiseThisYear ? 'Already asked this year' : 'Better odds with strong performance', icon: 'dollar', action: 'job', data: { job: 'askForRaise' }, right: 'dots', disabled: c.askedRaiseThisYear }),
    row('Resign', { sub: `Leave ${def.employer}`, icon: 'exit', action: 'quitConfirm', right: 'dots', tone: 'danger' }),
    row('Retire', { sub: Career.canRetire(state) ? 'Consider retirement' : `Available from age ${Career.RETIREMENT_MIN_AGE}`, icon: 'flag', action: 'retireConfirm', right: 'dots', disabled: !Career.canRetire(state), note: `Age ${Career.RETIREMENT_MIN_AGE}+` }),
  ].join('');
  return screen(state, 'Job', `
    ${section('You')}
    ${row(pos.title, { sub: `${def.name} · ${def.employer}`, icon: 'briefcase', right: 'none', bar: { label: 'Performance', value: c.performance, tone: c.performance < 40 ? 'warn' : '' } })}
    ${infoRow('Salary', `${money(c.salary)} / year`)}${infoRow('Years at company', String(c.tenure))}${infoRow('Level', `${c.rung + 1} of ${def.ladder.length}${next ? ` · next: ${next.title}` : ' · top of the ladder'}`)}
    ${row('Schedule', { sub: c.stress >= 70 ? 'Burning out: take it easy or a vacation' : c.stress >= 40 ? 'Busy but manageable' : 'A healthy pace', icon: 'history', right: 'none', bar: { label: 'Stress', value: c.stress, tone: c.stress >= 70 ? 'warn' : '' } })}
    ${infoRow('Warnings', c.warnings ? `${c.warnings} on file` : 'None')}${infoRow('Actions', actionsLeft(state))}
    ${section('Actions')}${row('Human Resources', { sub: 'Requests and workplace problems', icon: 'people', action: 'go', data: { target: 'hr' } })}${actions}
    ${section('Elsewhere')}${row('Job Listings', { sub: 'Look at other openings', icon: 'list', action: 'go', data: { target: 'jobs' } })}`);
}

function jobRow(state, career) {
  const eligible = Career.isEligible(state, career);
  const entry = career.ladder[0];
  const current = state.career.careerId === career.id;
  if (career.tagline) {
    return row(career.name, { sub: `${career.tagline} · starts as ${entry.title}, ${money(entry.salary)} / year`, icon: career.military ? 'flag' : 'star', action: 'applyConfirm', data: { career: career.id },
      right: 'dots', disabled: !eligible || current, note: current ? 'Your current career' : `Requires ${requirementText(career)}` });
  }
  return row(entry.title, { titleNote: `(${career.category})`, sub: `${money(entry.salary)} / year · ${requirementText(career)}`, icon: careerIcon(career.category), action: 'applyConfirm', data: { career: career.id },
    right: 'dots', disabled: !eligible || current, note: current ? 'Your current job' : `Requires ${requirementText(career)}` });
}

function careerIcon(category) {
  return { Technology: 'bulb', Finance: 'dollar', Healthcare: 'cross', Education: 'cap', Science: 'eye', Engineering: 'tools', Creative: 'palette', Media: 'film', Trades: 'tools', Retail: 'bag', Restaurant: 'leaf', Logistics: 'car', Recreation: 'ball', Corporate: 'briefcase', 'Public Service': 'flag', Hospitality: 'house', 'Part-time': 'coin' }[category] || 'briefcase';
}

export function jobs(ctx) {
  const { state } = ctx;
  const sorted = REGULAR.slice().sort((a, b) => b.ladder[0].salary - a.ladder[0].salary);
  const groups = CATEGORIES.map((cat) => section(cat) + sorted.filter((c) => c.category === cat).map((c) => jobRow(state, c)).join(''));
  return screen(state, 'Jobs', `${infoRow('Your education', Education.educationSummary(state.education))}${infoRow('Smarts', pct(state.player.smarts))}${groups.join('')}`, { back: isEmployed(state) ? 'job' : 'occupation', mode: 'back' });
}

export function military(ctx) {
  const { state } = ctx;
  return screen(state, 'Military', `${note('Enlisting needs a high school diploma and good health. Ranks come with time and performance; the service retires you like any other career.')}${section('Branches')}${MILITARY.map((c) => jobRow(state, c)).join('')}`, { back: 'occupation', mode: 'back' });
}

export function dream(ctx) {
  const { state } = ctx;
  return screen(state, 'Dream Careers', `${note('Rare paths that reward talent: Looks, Health or Smarts instead of a diploma. Entry pay is low; the top is not.')}${section('Careers')}${DREAM.map((c) => jobRow(state, c)).join('')}`, { back: 'occupation', mode: 'back' });
}

export function hr(ctx) {
  const { state } = ctx;
  const c = state.career;
  if (!isEmployed(state)) return occupation(ctx);
  const rows = HR_OPTIONS.map(([id, title, sub]) => row(title, { sub, icon: id === 'complaint' ? 'warning' : id === 'training' ? 'book' : id === 'transfer' ? 'people' : 'history', action: 'hr', data: { hr: id }, right: 'dots', disabled: c.hrThisYear, note: 'HR already handled a request this year' })).join('');
  return screen(state, 'Human Resources', `${infoRow('Employer', Career.employer(c))}${row('Stress', { icon: 'history', right: 'none', bar: { label: 'Stress', value: c.stress, tone: c.stress >= 70 ? 'warn' : '' } })}${infoRow('Actions', actionsLeft(state))}${section('Requests')}${rows}`, { back: 'job', mode: 'back' });
}

export function partTimeJobs(ctx) {
  const { state } = ctx;
  const list = CAREERS.filter((c) => c.partTime).map((c) => jobRow(state, c)).join('');
  return screen(state, 'Part-time Jobs', `${note('Part-time work fits around school and usually ends around 19.')}${section('Openings')}${list}`, { back: 'occupation', mode: 'back' });
}

export function careerHistory(ctx) {
  const { state } = ctx;
  const c = state.career;
  const rows = c.history.map((h) => row(h.title, { sub: `${h.employer} · ages ${h.from}-${h.to} · ${h.reason} · ${money(h.lastSalary)}`, icon: 'briefcase', right: 'none' })).join('');
  const current = isEmployed(state) ? row(Career.jobTitle(c), { sub: `${Career.employer(c)} · since age ${c.hiredAt} · ${money(c.salary)}`, icon: 'briefcase', right: 'none', badge: 'NOW' }) : '';
  return screen(state, 'Career History', `${infoRow('Years worked', String(c.yearsWorked))}${infoRow('Promotions', String(c.promotions))}${infoRow('Raises', String(c.raises))}${infoRow('Career earnings', money(c.earnings))}
    ${section('Positions')}${current}${rows || empty('No jobs yet.')}`, { back: 'occupation', mode: 'back' });
}

// ---- Assets and shopping --------------------------------------------------------------------------------------

export function assets(ctx) {
  const { state } = ctx;
  const p = state.player;
  const assetRows = (list) => list.map((a) => row(a.name, { titleNote: a.label ? `(${a.label})` : '', sub: `Value ${money(a.value)}`, icon: a.kind === 'car' ? 'car' : a.kind === 'bike' ? 'bike' : a.kind === 'home' ? 'house' : a.kind === 'instrument' ? 'music' : a.kind === 'jewelry' ? 'ring' : 'game',
    action: 'asset', data: { asset: a.id }, bar: a.type !== 'possession' ? { label: 'Condition', value: a.condition, tone: a.condition < 30 ? 'warn' : '' } : null })).join('');
  const homes = Assets.homes(state); const vehicles = Assets.vehicles(state); const things = Assets.possessions(state);
  return screen(state, 'Assets', `
    ${section('Finances')}
    ${row('Finances', { sub: `Net worth ${money(G.netWorth(state))} · ${p.money < 0 ? 'in debt' : 'in the black'}`, icon: 'dollar', action: 'go', data: { target: 'finances' } })}
    ${row('Housing', { sub: homes.length ? homes[0].name : p.livesWithParents ? 'Living with your parents' : 'Renting', icon: 'house', right: 'none' })}
    ${section('Real Estate')}${assetRows(homes) || empty('No property yet.')}
    ${section('Vehicles')}${assetRows(vehicles) || empty('No vehicles yet.')}
    ${section('Possessions')}${assetRows(things) || empty('Nothing yet.')}
    ${footerBar('Go Shopping…', 'bag', 'go', { target: 'shopping' })}`);
}

export function finances(ctx) {
  const { state } = ctx;
  const p = state.player;
  const c = state.career;
  return screen(state, 'Finances', `
    ${section('Balance')}${infoRow('Bank Balance', money(p.money), p.money < 0 ? 'negative' : '')}${infoRow('Net Worth', money(G.netWorth(state)))}${infoRow('Belongings value', money(Assets.assetsValue(state)))}
    ${section('This year')}${infoRow(c.retired ? 'Pension' : 'Income after tax', money(G.yearlyIncome(state)))}${infoRow('Living costs and bills', money(G.yearlyExpenses(state)))}${infoRow('Balance change', money(G.yearlyIncome(state) - G.yearlyExpenses(state)), G.yearlyIncome(state) - G.yearlyExpenses(state) < 0 ? 'negative' : '')}
    ${section('Debt')}${infoRow('Owed', p.money < 0 ? money(-p.money) : 'Nothing')}${infoRow('Interest', p.money < 0 ? '5% a year' : '-')}${state.flags.studentLoan ? infoRow('Student loan', 'Being repaid from income') : ''}
    ${section('Career earnings')}${infoRow('Lifetime earnings', money(c.earnings))}${infoRow('Raises', String(c.raises))}${infoRow('Promotions', String(c.promotions))}`, { back: 'assets', mode: 'back' });
}

export function asset(ctx) {
  const { state, sel } = ctx;
  const a = Assets.findAsset(state, sel.asset);
  if (!a) return assets(ctx);
  const wear = a.type !== 'possession';
  const kind = a.type === 'home' ? 'Real estate' : a.type === 'vehicle' ? 'Vehicle' : 'Possession';
  let actions = '';
  if (a.type === 'vehicle') {
    actions = row('Drive', { sub: 'Take it out for a spin', icon: 'car', action: 'assetAction', data: { asset: a.id, do: 'drive' }, right: 'dots' })
      + row('Maintenance', { sub: 'A service keeps it running', icon: 'tools', action: 'assetAction', data: { asset: a.id, do: 'maintenance' }, right: 'dots' })
      + row('Repair', { sub: `${money(Assets.repairCost(a))} · back to perfect condition`, icon: 'tools', action: 'repair', data: { asset: a.id }, right: 'dots', disabled: a.condition >= 100, note: 'Already in perfect condition' })
      + row('Gift', { sub: 'Give it to someone', icon: 'gift', action: 'go', data: { target: 'giftAsset', asset: a.id } })
      + row('Sell', { sub: 'Turn it back into cash', icon: 'dollar', action: 'sellConfirm', data: { asset: a.id }, right: 'dots' })
      + row('Scrap', { sub: 'Sell it for parts', icon: 'exit', action: 'assetAction', data: { asset: a.id, do: 'scrap' }, right: 'dots', tone: 'danger' });
  } else if (a.type === 'home') {
    actions = row('Renovate', { sub: 'Raise the value and freshen it up', icon: 'tools', action: 'assetAction', data: { asset: a.id, do: 'renovate' }, right: 'dots' })
      + row('Sell', { sub: 'Put it on the market', icon: 'dollar', action: 'sellConfirm', data: { asset: a.id }, right: 'dots' });
  } else {
    actions = row('Gift', { sub: 'Give it to someone', icon: 'gift', action: 'go', data: { target: 'giftAsset', asset: a.id } })
      + row('Sell', { sub: 'Turn it back into cash', icon: 'dollar', action: 'sellConfirm', data: { asset: a.id }, right: 'dots' });
  }
  return screen(state, a.name, `
    ${row(a.name, { titleNote: a.label ? `(${a.label})` : '', sub: `${kind} · owned since age ${a.boughtAt}`, icon: a.kind === 'car' ? 'car' : a.kind === 'bike' ? 'bike' : a.kind === 'home' ? 'house' : a.kind === 'instrument' ? 'music' : a.kind === 'jewelry' ? 'ring' : 'game', right: 'none', bar: wear ? { label: 'Condition', value: a.condition, tone: a.condition < 30 ? 'warn' : '' } : null })}
    ${infoRow('Paid', money(a.cost))}${infoRow('Value now', money(a.value))}${infoRow('Yearly upkeep', money(Math.round(a.value * a.upkeep)))}${infoRow('Actions', actionsLeft(state))}
    ${section('Activities')}${actions}`, { back: 'assets', mode: 'back' });
}

export function giftAsset(ctx) {
  const { state, sel } = ctx;
  const a = Assets.findAsset(state, sel.asset);
  if (!a) return assets(ctx);
  const people = People.alive(state).filter((r) => r.role !== 'pet');
  return screen(state, 'Give a Gift', `${infoRow('Gift', a.name)}${section('Who gets it?')}${people.map((r) => row(r.name, { titleNote: `(${People.roleLabel(r)})`, icon: 'person', action: 'assetAction', data: { asset: a.id, do: 'gift', person: r.id }, right: 'dots', bar: { label: 'Relationship', value: r.closeness } })).join('') || empty('Nobody to give it to.')}`, { back: 'asset', mode: 'back' });
}

export function shopping(ctx) {
  const { state } = ctx;
  const age = state.player.age;
  const shopIcon = (s) => (s.id.includes('Cars') ? 'car' : s.id === 'bikes' ? 'bike' : s.id === 'homes' ? 'house' : s.id === 'music' ? 'music' : s.category === 'Jewelers' ? 'ring' : 'game');
  const categories = [...new Set(Assets.SHOPS.map((s) => s.category))].sort();
  const groups = categories.map((cat) => section(cat) + Assets.SHOPS.filter((s) => s.category === cat).map((s) => row(s.name, { sub: s.tagline, icon: shopIcon(s),
    action: 'go', data: { target: 'shop', shop: s.id }, disabled: age < s.minAge, note: `Age ${s.minAge}+` })).join('')).join('');
  return screen(state, 'Shopping', `${infoRow('Bank Balance', money(state.player.money))}${groups}`, { back: 'assets', mode: 'back' });
}

export function shop(ctx) {
  const { state, sel } = ctx;
  const s = Assets.findShop(sel.shop);
  if (!s) return shopping(ctx);
  const age = state.player.age; void age;
  const rows = s.items.map((item) => {
    const verdict = Assets.canBuy(state, s, item);
    const notes = { tooYoung: `Age ${item.minAge || s.minAge}+`, noLicence: 'Needs a driving licence', owned: 'Already owned', noMoney: 'Not enough money' };
    return row(item.name, { titleNote: item.label ? `(${item.label})` : '', sub: money(item.cost), icon: item.kind === 'car' ? 'car' : item.kind === 'bike' ? 'bike' : item.kind === 'home' ? 'house' : item.kind === 'instrument' ? 'music' : item.kind === 'jewelry' ? 'ring' : 'game',
      action: 'buyConfirm', data: { shop: s.id, item: item.id }, right: 'dots', disabled: verdict !== 'ok', note: notes[verdict] });
  }).join('');
  return screen(state, s.name, `${infoRow('Bank Balance', money(state.player.money))}${section(s.tagline)}${rows}`, { back: 'shopping', mode: 'back' });
}

// ---- Relationships --------------------------------------------------------------------------------------------

function personRow(r) {
  const label = r.role === 'pet' ? People.PET_SPECIES[r.species].label : People.ROLE_LABELS[r.role];
  return row(r.name, { titleNote: `(${label})`, icon: r.role === 'pet' ? 'paw' : 'person', action: 'person', data: { person: r.id }, bar: { label: 'Relationship', value: r.closeness, tone: r.closeness < 30 ? 'warn' : '' } });
}

export function relationships(ctx) {
  const { state } = ctx;
  const sections = People.relationshipSections(state).map(([title, people]) => section(title) + people.map(personRow).join('')).join('');
  const count = People.alive(state).length;
  return screen(state, 'Relationships', `${sections || empty('Nobody in your life yet.')}${count ? footerBar(`Spend Time With All (${count})`, 'people', 'familyDay') : ''}`);
}

export function person(ctx) {
  const { state, sel } = ctx;
  const r = People.findPerson(state, sel.person);
  if (!r || !r.alive) return relationships(ctx);
  const label = People.roleLabel(r);
  const facts = [infoRow('Age', `${r.age} years`)];
  if (r.role === 'pet') facts.push(infoRow('Breed', r.breed || People.PET_SPECIES[r.species].label));
  else if (r.occupation) facts.push(infoRow('Occupation', r.occupation));
  if (r.yearsTogether !== undefined) facts.push(infoRow('Years together', String(r.yearsTogether)));
  facts.push(infoRow('In your life since', r.since === 0 ? 'birth' : `age ${r.since}`));
  facts.push(infoRow('Actions', actionsLeft(state)));
  const actions = People.actionsFor(state, r).map(([id, title, sub]) => row(title, { sub, icon: actionIcon(id), action: 'interact', data: { person: r.id, do: id }, right: 'dots', tone: ['argue', 'breakUp', 'unfriend', 'release'].includes(id) ? 'danger' : '' })).join('');
  return screen(state, label, `
    ${row(r.name, { titleNote: `(Age ${r.age})`, icon: r.role === 'pet' ? 'paw' : 'person', right: 'none', bar: { label: 'Relationship', value: r.closeness, tone: r.closeness < 30 ? 'warn' : '' } })}
    ${facts.join('')}
    ${r.traits && r.role !== 'pet' ? `<div class="bl-traits">${['looks', 'smarts', 'kindness'].map((t) => `<div class="bl-trait"><span>${t[0].toUpperCase()}${t.slice(1)}</span><span class="bl-track"><span class="bl-fill" style="width:${r.traits[t]}%"></span></span></div>`).join('')}</div>` : ''}
    ${section('Activities')}${actions}`, { back: 'relationships', mode: 'back' });
}

function actionIcon(id) {
  return { spendTime: 'sun', conversation: 'chat', compliment: 'smile', gift: 'gift', advice: 'bulb', argue: 'frown', allowance: 'coin', homework: 'book', playPet: 'ball', walkPet: 'footprints', treatPet: 'leaf',
    anniversary: 'heart', propose: 'ring', marry: 'ring', breakUp: 'exit', unfriend: 'exit', release: 'exit' }[id] || 'star';
}

// ---- Activities ----------------------------------------------------------------------------------------------

function menuRow(state, entry) {
  if (entry.menu) {
    const m = Activities.SUBMENUS[entry.menu];
    const open = m.items.filter((i) => !Activities.unavailableReason(state, i)).length;
    const minAge = Math.min(...m.items.map((i) => i.minAge));
    const note = state.player.age < minAge ? `Opens at age ${minAge}` : (open === 0 ? (Activities.unavailableReason(state, m.items[0]) || 'Nothing available right now') : '');
    return row(entry.name, { sub: entry.sub, icon: entry.icon, action: 'go', data: { target: 'activity', category: entry.menu }, disabled: open === 0, note });
  }
  if (entry.screen) return row(entry.name, { sub: entry.sub, icon: entry.icon, action: 'go', data: { target: entry.screen } });
  const reason = Activities.unavailableReason(state, entry.action);
  const sub = [entry.action.cost ? money(entry.action.cost) : null, entry.sub].filter(Boolean).join(' · ');
  return row(entry.name, { sub, icon: entry.icon, action: 'activity', data: { activity: entry.action.id }, right: 'dots', disabled: !!reason, note: reason });
}

export function activities(ctx) {
  const { state } = ctx;
  const favorites = Activities.FAVORITES.map((id) => Activities.ACTIVITY_MENU.find((e) => e.id === id)).filter(Boolean);
  const all = Activities.ACTIVITY_MENU.filter((e) => !Activities.FAVORITES.includes(e.id));
  return screen(state, 'Activities', `${section('Favorites')}${favorites.map((e) => menuRow(state, e)).join('')}
    ${section('All')}${all.map((e) => menuRow(state, e)).join('')}
    ${infoRow('Actions', actionsLeft(state))}`);
}

export function activity(ctx) {
  const { state, sel } = ctx;
  const c = Activities.SUBMENUS[sel.category];
  if (!c) return activities(ctx);
  const rows = c.items.map((item) => {
    const reason = Activities.unavailableReason(state, item);
    const effects = Object.entries(item.effects).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k[0].toUpperCase()}${k.slice(1)}`).join(', ');
    const sub = [item.cost ? money(item.cost) : null, item.sub, effects].filter(Boolean).join(' · ');
    const isForm = item.special === 'nameForm';
    return row(item.name, { sub, icon: item.icon, action: isForm ? 'go' : 'activity', data: isForm ? { target: 'identity' } : { activity: item.id }, right: isForm ? 'chevron' : 'dots', disabled: !!reason, note: reason });
  }).join('');
  return screen(state, c.name, `${section(c.sub)}${rows}${infoRow('Actions', actionsLeft(state))}`, { back: 'activities', mode: 'back' });
}

export function pets(ctx) {
  const { state } = ctx;
  const age = state.player.age;
  const rows = Pets.SOURCES.map((s) => row(s.name, { sub: s.sub, icon: s.icon, action: 'go', data: { target: 'petSource', source: s.id }, disabled: age < s.minAge, note: `Age ${s.minAge}+` })).join('');
  const mine = People.pets(state).map((p) => row(p.name, { titleNote: `(${p.breed || People.PET_SPECIES[p.species].label})`, icon: 'paw', action: 'person', data: { person: p.id }, bar: { label: 'Relationship', value: p.closeness } })).join('');
  return screen(state, 'Pets', `${section('Find a pet')}${rows}${section('Your pets')}${mine || empty('No pets yet.')}`, { back: 'activities', mode: 'back' });
}

export function petSource(ctx) {
  const { state, sel } = ctx;
  const source = Pets.SOURCES.find((s) => s.id === sel.source);
  if (!source) return pets(ctx);
  const taken = state.flags.adoptedFrom || [];
  const rows = Pets.inventory(state, source).map((a) => row(a.name, { titleNote: `(${a.breed})`, sub: `${a.age === 0 ? 'Baby' : `${a.age}-year-old`} ${People.PET_SPECIES[a.species].label.toLowerCase()} · ${money(a.fee)}`, icon: 'paw', action: 'adoptConfirm', data: { source: source.id, animal: a.id }, right: 'dots', disabled: taken.includes(a.id), note: 'Already adopted' })).join('');
  return screen(state, source.name, `${infoRow('Bank Balance', money(state.player.money))}${section('Available today')}${rows}${note('The list changes every year.')}`, { back: 'pets', mode: 'back' });
}

export function badges(ctx) {
  const { state } = ctx;
  const earned = new Set(state.badges || []);
  const rows = BADGES.map((b) => row(b.name, { sub: b.desc, icon: 'medal', right: 'none', disabled: !earned.has(b.id), note: 'Not yet', tone: earned.has(b.id) ? '' : '' })).join('');
  return screen(state, 'Life Badges', `${infoRow('Earned', `${earned.size} of ${BADGES.length}`)}${section('Badges')}${rows}`, { back: 'main', mode: 'close' });
}

export function identity(ctx) {
  const { state } = ctx;
  const p = state.player;
  return screen(state, 'Name Change', `<form class="bl-form" id="bl-name-form">
    ${note('A legal name change costs $120 and one action. Your journal keeps your old name.')}
    <label>First name<input name="firstName" maxlength="20" value="${esc(p.firstName)}"></label>
    <label>Last name<input name="lastName" maxlength="20" value="${esc(p.lastName)}"></label>
    <button type="button" class="bl-btn bl-btn-blue" data-action="changeName">CHANGE NAME</button></form>`, { back: 'activity', mode: 'back' });
}

// ---- Life summary ---------------------------------------------------------------------------------------------

export function summary(ctx) {
  const { state } = ctx;
  const s = G.lifeSummary(state);
  return screen(state, 'Life Summary', `
    <div class="bl-summary-head"><span class="bl-summary-icon">${icon('candle')}</span><h2>${esc(s.name)}</h2><p>Aged ${s.age} years</p></div>
    ${section('Life')}${s.facts.map(([k, v]) => infoRow(k, v)).join('')}
    ${section('Milestones')}${s.milestones.map((m) => `<p class="bl-entry">${esc(m)}</p>`).join('') || empty('A quiet life.')}
    ${section('In Memory')}${note(s.epitaph)}
    <div class="bl-summary-actions"><button class="bl-btn bl-btn-green" data-action="newLife">NEW LIFE</button><button class="bl-btn bl-btn-blue" data-action="go" data-target="start">MAIN MENU</button></div>`);
}

export function about(ctx) {
  const { state, version } = ctx;
  const body = `${section('BetLife')}${note(`BetLife ${version} is a life simulation built for the AP Computer Science Arcade. You start as a newborn. Press Age to move through the years; use your ${G.ACTIONS_PER_YEAR} actions each year on school, work, activities and the people in your life. Every choice lands in your journal and moves your stats.`)}
    ${section('How it works')}${note('Stats run from 0 to 100 and respond to what you do. Repeating the same activity in one year pays less each time. Life has an end, and a summary of everything that happened.')}
    ${section('Original content')}${note('Every name, place, event and picture in BetLife is original. Normal gameplay is free; admin tools such as a stat editor are classified as premium candidates and are not part of the game.')}`;
  return state ? screen(state, 'About', body, { back: 'menu', mode: 'back' })
    : `<header class="bl-header bl-header-main"><span class="bl-header-spacer"></span><div class="bl-brand"><span>BET</span><span class="bl-brand-accent">LIFE</span></div><span class="bl-header-spacer"></span></header><div class="bl-titlebar"><button class="bl-round-btn" data-action="go" data-target="start" aria-label="Back">${icon('back')}</button><h1 class="bl-screen-title">About</h1></div><div class="bl-scroll">${body}</div>`;
}

export const SCREENS = { start, newlife, menu, main, growing, school, university, tradeSchool, occupation, job, jobs, partTimeJobs, careerHistory, military, dream, hr, assets, asset, finances, giftAsset, shopping, shop, relationships, person, activities, activity, identity, pets, petSource, badges, summary, about };
