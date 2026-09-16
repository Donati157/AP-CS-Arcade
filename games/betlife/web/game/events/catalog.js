// Every event and decision in one list, with a duplicate-id check at load time.
import { INFANT_EVENTS } from './infant.js';
import { CHILD_EVENTS } from './child.js';
import { TEEN_EVENTS } from './teen.js';
import { UNIVERSITY_EVENTS } from './university.js';
import { CAREER_EVENTS } from './career.js';
import { ADULT_EVENTS } from './adult.js';
import { SENIOR_EVENTS } from './senior.js';
import { RELATIONSHIP_EVENTS } from './relationship.js';
import { FINANCE_EVENTS } from './finance.js';
import { CHILDHOOD_DECISIONS } from '../decisions/childhood.js';
import { SCHOOL_DECISIONS } from '../decisions/school.js';
import { UNIVERSITY_DECISIONS } from '../decisions/university.js';
import { CAREER_DECISIONS } from '../decisions/career.js';
import { ADULT_DECISIONS } from '../decisions/adult.js';
import { SENIOR_DECISIONS } from '../decisions/senior.js';

export const EVENT_GROUPS = {
  infant: INFANT_EVENTS, child: CHILD_EVENTS, teen: TEEN_EVENTS, university: UNIVERSITY_EVENTS, career: CAREER_EVENTS,
  adult: ADULT_EVENTS, senior: SENIOR_EVENTS, relationship: RELATIONSHIP_EVENTS, finance: FINANCE_EVENTS,
};
export const DECISION_GROUPS = {
  childhood: CHILDHOOD_DECISIONS, school: SCHOOL_DECISIONS, university: UNIVERSITY_DECISIONS, career: CAREER_DECISIONS,
  adult: ADULT_DECISIONS, senior: SENIOR_DECISIONS,
};

export const EVENTS = [...Object.values(EVENT_GROUPS).flat(), ...Object.values(DECISION_GROUPS).flat()];

const byId = new Map();
for (const event of EVENTS) {
  if (byId.has(event.id)) throw new Error(`Duplicate event id: ${event.id}`);
  byId.set(event.id, event);
}

export function findEvent(id) {
  return byId.get(id) || null;
}

export const isDecision = (event) => Array.isArray(event.choices);
