// Jobs, their requirements, and the player's employment state.
import { clampStat } from './player.js';

// title, company, salary, minAge, requiresDiploma, requiredDegree, smartsInsteadOfDegree
export const JOBS = [
  { id: 'retail', title: 'Retail Associate', company: 'Maple Street Market', salary: 22000, minAge: 16, requiresDiploma: false, requiredDegree: null, smartsInsteadOfDegree: 0 },
  { id: 'office', title: 'Office Assistant', company: 'Northwind Logistics', salary: 28000, minAge: 18, requiresDiploma: true, requiredDegree: null, smartsInsteadOfDegree: 0 },
  { id: 'teaching', title: 'Teaching Assistant', company: 'Riverside Elementary', salary: 30000, minAge: 18, requiresDiploma: true, requiredDegree: null, smartsInsteadOfDegree: 0 },
  { id: 'gallery', title: 'Gallery Assistant', company: 'Lantern Arts Center', salary: 30000, minAge: 18, requiresDiploma: true, requiredDegree: 'Arts', smartsInsteadOfDegree: 0 },
  { id: 'lab', title: 'Lab Assistant', company: 'Bluefield Labs', salary: 34000, minAge: 18, requiresDiploma: true, requiredDegree: 'Biology', smartsInsteadOfDegree: 85 },
  { id: 'analyst', title: 'Junior Analyst', company: 'Summit Partners', salary: 42000, minAge: 18, requiresDiploma: true, requiredDegree: 'Business', smartsInsteadOfDegree: 88 },
  { id: 'developer', title: 'Junior Developer', company: 'Pixel Harbor Software', salary: 48000, minAge: 18, requiresDiploma: true, requiredDegree: 'Computer Science', smartsInsteadOfDegree: 90 },
];

export function findJob(id) {
  return JOBS.find((job) => job.id === id) || null;
}

export function meetsRequirements(job, player, education) {
  if (player.age < job.minAge) return false;
  if (job.requiresDiploma && !education.highSchoolGraduate) return false;
  if (!job.requiredDegree) return true;
  const hasDegree = education.degree === job.requiredDegree;
  const smartEnough = job.smartsInsteadOfDegree > 0 && player.smarts >= job.smartsInsteadOfDegree;
  return hasDegree || smartEnough;
}

export function requirementText(job) {
  if (job.requiredDegree) {
    let text = `${job.requiredDegree} degree`;
    if (job.smartsInsteadOfDegree > 0) text += ` or Smarts ${job.smartsInsteadOfDegree}+`;
    return text;
  }
  if (job.requiresDiploma) return 'High school diploma';
  return `Age ${job.minAge}+`;
}

export function createCareer() {
  return { jobId: null, performance: 0, yearsEmployed: 0, workedHardThisYear: false };
}

export function isEmployed(career) {
  return career.jobId !== null;
}

export function currentJob(career) {
  return isEmployed(career) ? findJob(career.jobId) : null;
}

export function startJob(career, job) {
  career.jobId = job.id;
  career.performance = 70;
  career.yearsEmployed = 0;
  career.workedHardThisYear = false;
}

export function quitJob(career) {
  career.jobId = null;
  career.performance = 0;
  career.yearsEmployed = 0;
}

export function changeCareerPerformance(career, amount) {
  career.performance = clampStat(career.performance + amount);
  if (amount > 0) career.workedHardThisYear = true;
}

export function completeCareerYear(career) {
  career.yearsEmployed += 1;
  career.workedHardThisYear = false;
}
