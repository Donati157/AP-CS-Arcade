// School and university: where the player is, how they are doing, and what they have completed.
// Kindergarten starts at 5, grade 12 ends at 17, graduation happens on the 18th birthday.
// University (4 years) or trade school (2 years) can follow.
import { clampStat } from './stats.js';

export const SCHOOL_START_AGE = 5;
export const ELEMENTARY_NAME = 'Maple Grove Elementary';
export const MIDDLE_SCHOOL_NAME = 'Riverside Middle School';
export const HIGH_SCHOOL_NAME = 'Harbor Point High School';
export const UNIVERSITY_NAME = 'Harborview University';
export const TRADE_SCHOOL_NAME = 'Ironwood Technical Institute';
export const FIRST_MIDDLE_GRADE = 6;
export const FIRST_HIGH_GRADE = 9;
export const LAST_HIGH_SCHOOL_GRADE = 12;
export const UNIVERSITY_YEARS = 4;
export const TRADE_SCHOOL_YEARS = 2;
export const UNIVERSITY_TUITION = 6000;   // per year, paid with a student loan when needed
export const TRADE_TUITION = 4000;

export const MAJORS = [
  { id: 'Computer Science', note: 'Software, algorithms and problem solving' },
  { id: 'Business', note: 'Management, marketing and finance' },
  { id: 'Biology', note: 'Life sciences and laboratory work' },
  { id: 'Arts', note: 'Drawing, design and creative practice' },
  { id: 'Education', note: 'Teaching, learning and child development' },
  { id: 'Engineering', note: 'Building things that work: bridges, machines, systems' },
  { id: 'Nursing', note: 'Patient care and clinical practice' },
  { id: 'Communications', note: 'Writing, media and public speaking' },
];
// Programs after a degree. `needs` is a list of majors (or null for any degree).
export const PROGRAMS = {
  graduate: { id: 'graduate', name: 'Graduate School', school: 'Harborview Graduate School', years: 2, tuition: 9000, credential: "Master's", needs: null, note: 'A master\'s degree in your field' },
  law: { id: 'law', name: 'Law School', school: 'Halloran School of Law', years: 3, tuition: 14000, credential: 'Law', needs: null, note: 'Three years to practise law' },
  medical: { id: 'medical', name: 'Medical School', school: 'Cedar Grove School of Medicine', years: 4, tuition: 16000, credential: 'Medicine', needs: ['Biology', 'Nursing'], note: 'Four years to become a physician' },
  business: { id: 'business', name: 'Business School', school: 'Summit School of Business', years: 2, tuition: 12000, credential: 'MBA', needs: null, note: 'An MBA for management careers' },
};

export const TRADES = [
  { id: 'Electrical', note: 'Wiring, circuits and power systems' },
  { id: 'Culinary', note: 'Professional kitchens and food preparation' },
  { id: 'Automotive', note: 'Engines, diagnostics and repair' },
];

export function createEducation() {
  return {
    stage: 'none',        // 'none' | 'school' | 'university' | 'trade'
    year: 0,              // grade number at school (0 = kindergarten), year number afterwards
    performance: 70,      // 0-100, the player's grades this year
    major: null,          // chosen field at university or trade school
    highSchoolGraduate: false,
    degree: null,         // university major once completed
    trade: null,          // trade certificate once completed
    gradeHistory: [],     // performance at the end of each completed year
    droppedOut: false,
    clubs: [],
    program: null,       // program id while attending graduate or professional school
    credentials: [],     // credentials earned from programs
  };
}

export const isEnrolled = (e) => e.stage !== 'none';
export const isInSchool = (e) => e.stage === 'school';
export const isHighSchool = (e) => e.stage === 'school' && e.year >= FIRST_HIGH_GRADE;
export const isMiddleSchool = (e) => e.stage === 'school' && e.year >= FIRST_MIDDLE_GRADE && e.year < FIRST_HIGH_GRADE;
export const isElementary = (e) => e.stage === 'school' && e.year < FIRST_MIDDLE_GRADE;
export const isUniversity = (e) => e.stage === 'university';
export const isTradeSchool = (e) => e.stage === 'trade';
export const isProgram = (e) => e.stage === 'program';
export const currentProgram = (e) => (e.stage === 'program' ? PROGRAMS[e.program] : null);
export const canEnrollProgram = (e, program) => !!e.degree && !isEnrolled(e) && !(e.credentials || []).includes(program.credential) && (!program.needs || program.needs.includes(e.degree));
export const canEnrollHigher = (e) => e.highSchoolGraduate && !isEnrolled(e);

export function changePerformance(education, amount) {
  education.performance = clampStat(education.performance + amount);
}

export function schoolName(education) {
  if (education.stage === 'school') {
    if (education.year < FIRST_MIDDLE_GRADE) return ELEMENTARY_NAME;
    if (education.year < FIRST_HIGH_GRADE) return MIDDLE_SCHOOL_NAME;
    return HIGH_SCHOOL_NAME;
  }
  if (education.stage === 'university') return UNIVERSITY_NAME;
  if (education.stage === 'trade') return TRADE_SCHOOL_NAME;
  if (education.stage === 'program') return currentProgram(education).school;
  return 'Not enrolled';
}

export function schoolLevel(education) {
  if (isElementary(education)) return 'Elementary School';
  if (isMiddleSchool(education)) return 'Middle School';
  if (isHighSchool(education)) return 'High School';
  if (isUniversity(education)) return 'University';
  if (isTradeSchool(education)) return 'Trade School';
  if (isProgram(education)) return currentProgram(education).name;
  return '';
}

function ordinal(n) {
  if (n === 11 || n === 12 || n === 13) return `${n}th`;
  const last = n % 10;
  return `${n}${last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th'}`;
}

export function yearLabel(education) {
  if (education.stage === 'school') return education.year === 0 ? 'Kindergarten' : `${ordinal(education.year)} Grade`;
  if (education.stage === 'university') return `Year ${education.year} of ${UNIVERSITY_YEARS}`;
  if (education.stage === 'trade') return `Year ${education.year} of ${TRADE_SCHOOL_YEARS}`;
  if (education.stage === 'program') return `Year ${education.year} of ${currentProgram(education).years}`;
  return '';
}

export function gradeLetter(performance) {
  if (performance >= 90) return 'A';
  if (performance >= 80) return 'B';
  if (performance >= 65) return 'C';
  if (performance >= 50) return 'D';
  return 'F';
}

export function startSchool(education) {
  education.stage = 'school';
  education.year = 0;
  education.performance = 70;
}

export function enrollInUniversity(education, major) {
  education.stage = 'university';
  education.year = 1;
  education.major = major;
  education.performance = 72;
}

export function enrollInTradeSchool(education, trade) {
  education.stage = 'trade';
  education.year = 1;
  education.major = trade;
  education.performance = 72;
}

export function enrollInProgram(education, programId) {
  education.stage = 'program';
  education.program = programId;
  education.year = 1;
  education.performance = 72;
}

export function dropOut(education) {
  education.stage = 'none';
  education.year = 0;
  education.major = null;
  education.program = null;
  education.droppedOut = true;
}

/**
 * Moves one school year forward. Returns 'highSchool', 'university' or 'trade' when this step
 * completed that program, otherwise null. Grades drift back toward 70 a little each year so one
 * great year does not carry a whole education.
 */
export function advanceYear(education) {
  if (!isEnrolled(education)) return null;
  education.gradeHistory.push(education.performance);
  education.performance = clampStat(education.performance + (70 - education.performance) * 0.25);
  if (education.stage === 'school') {
    if (education.year >= LAST_HIGH_SCHOOL_GRADE) {
      education.highSchoolGraduate = true;
      education.stage = 'none';
      return 'highSchool';
    }
    education.year += 1;
  } else if (education.stage === 'university') {
    if (education.year >= UNIVERSITY_YEARS) {
      education.degree = education.major;
      education.stage = 'none';
      return 'university';
    }
    education.year += 1;
  } else if (education.stage === 'trade') {
    if (education.year >= TRADE_SCHOOL_YEARS) {
      education.trade = education.major;
      education.stage = 'none';
      return 'trade';
    }
    education.year += 1;
  } else if (education.stage === 'program') {
    const program = currentProgram(education);
    if (education.year >= program.years) {
      education.credentials = [...(education.credentials || []), program.credential];
      education.stage = 'none';
      education.program = null;
      return 'program';
    }
    education.year += 1;
  }
  return null;
}

export function educationSummary(education) {
  const parts = [];
  for (const c of education.credentials || []) parts.push(c === "Master's" ? "Master's degree" : c === 'MBA' ? 'MBA' : `${c} school`);
  if (education.degree) parts.push(`${education.degree} degree`);
  if (education.trade) parts.push(`${education.trade} certificate`);
  if (parts.length) return parts.join(', ');
  if (education.highSchoolGraduate) return 'High school diploma';
  if (education.stage === 'school') return `${yearLabel(education)} student`;
  if (education.droppedOut) return 'Left school';
  return 'Not in school yet';
}

export function averageGrade(education) {
  const all = education.gradeHistory;
  if (all.length === 0) return education.performance;
  return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
}
