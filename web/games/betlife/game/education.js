// Where the player is in their education and what they have completed.
import { clampStat } from './player.js';

export const HIGH_SCHOOL_NAME = 'BetLife High School';
export const UNIVERSITY_NAME = 'Harborview University';
export const LAST_HIGH_SCHOOL_GRADE = 12;
export const UNIVERSITY_YEARS = 4;
export const MAJORS = ['Computer Science', 'Business', 'Biology', 'Arts'];

export function createEducation() {
  return {
    stage: 'highSchool', // 'highSchool' | 'university' | 'none'
    year: 10, // grade number in high school, year number at university
    performance: 70,
    major: null,
    highSchoolGraduate: false,
    degree: null,
  };
}

export function isEnrolled(education) {
  return education.stage !== 'none';
}

export function changePerformance(education, amount) {
  education.performance = clampStat(education.performance + amount);
}

export function schoolName(education) {
  if (education.stage === 'highSchool') return HIGH_SCHOOL_NAME;
  if (education.stage === 'university') return UNIVERSITY_NAME;
  return 'Not enrolled';
}

function ordinal(n) {
  if (n === 11 || n === 12 || n === 13) return `${n}th`;
  const last = n % 10;
  if (last === 1) return `${n}st`;
  if (last === 2) return `${n}nd`;
  if (last === 3) return `${n}rd`;
  return `${n}th`;
}

export function yearLabel(education) {
  if (education.stage === 'highSchool') return `${ordinal(education.year)} Grade`;
  if (education.stage === 'university') return `Year ${education.year}`;
  return '';
}

export function enrollInUniversity(education, major) {
  education.stage = 'university';
  education.year = 1;
  education.major = major;
  education.performance = 75;
}

// Moves one school year forward. Returns true when this step completed the program.
export function advanceYear(education) {
  if (education.stage === 'highSchool') {
    if (education.year >= LAST_HIGH_SCHOOL_GRADE) {
      education.highSchoolGraduate = true;
      education.stage = 'none';
      return true;
    }
    education.year += 1;
  } else if (education.stage === 'university') {
    if (education.year >= UNIVERSITY_YEARS) {
      education.degree = education.major;
      education.stage = 'none';
      return true;
    }
    education.year += 1;
  }
  return false;
}

export function educationSummary(education) {
  if (education.degree) return `${education.degree} degree`;
  if (education.highSchoolGraduate) return 'High school diploma';
  return 'High school student';
}
