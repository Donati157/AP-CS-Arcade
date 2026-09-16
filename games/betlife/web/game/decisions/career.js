// Decisions at work. Original BetLife writing.
import { ev } from '../events/define.js';

export const CAREER_DECISIONS = [
  ev({ id: 'overtimeRequest', category: 'career', needs: ['fullTime'], cooldown: 4, band: 'Work', title: 'Extra Hours',
    text: (c) => `Your manager at ${c.employer} asks if you can put in extra hours this year for a big push.`, choices: [
      { label: 'Take the hours', text: 'You worked the extra hours. The paycheck was bigger, and so were the bags under your eyes.', effects: { money: 1500, performance: 5, happiness: -3, health: -2 } },
      { label: 'Keep your schedule', text: 'You kept your regular schedule and your evenings.', effects: { happiness: 2, performance: -1 } },
    ] }),
  ev({ id: 'companyTeam', category: 'career', needs: ['fullTime'], once: true, band: 'Work', title: 'Company Team',
    text: 'A coworker invites you to join the company soccer team.', choices: [
      { label: 'Join the team', text: 'You played on the company team all season and never scored, but it was fun.', effects: { happiness: 3, health: 3, newCoworker: true } },
      { label: 'Decline', text: 'You decided team sports were not for you this year.', effects: {} },
    ] }),
  ev({ id: 'blameAtWork', category: 'career', needs: ['fullTime'], cooldown: 6, band: 'Work', title: 'Whose Fault?',
    text: 'A project failed, and your manager wants to know what went wrong. Part of it was your mistake.', choices: [
      { label: 'Own your part', text: 'You owned your part of the failure. Your manager respected the honesty.', effects: { performance: 3, happiness: -1 } },
      { label: 'Stay quiet', text: 'You stayed quiet, and the blame landed on a colleague. It did not sit right.', effects: { performance: 1, happiness: -4, friends: -2 } },
    ] }),
  ev({ id: 'jobOfferElsewhere', category: 'career', needs: ['fullTime', 'goodWork'], minAge: 24, cooldown: 7, band: 'Work', title: 'A Competing Offer',
    text: 'A rival company offers you a similar role with a signing bonus.', choices: [
      { label: 'Use it to negotiate', text: 'You used the competing offer to negotiate, and your employer matched it with a raise.', effects: { performance: 2, happiness: 3 },
        then: (state) => { state.career.salary = Math.round(state.career.salary * 1.06 / 10) * 10; state.career.raises += 1; } },
      { label: 'Stay loyal', text: 'You turned down the competing offer and stayed where you were happy.', effects: { happiness: 2, performance: 1 } },
      { label: 'Take the bonus and go', text: 'You took the signing bonus. Then the new company restructured, and you were back on the job market.', effects: { money: 3000, happiness: -4 },
        then: (state) => { state.career.careerId && (state.pendingQuit = true); } },
    ] }),
  ev({ id: 'trainingOpportunity', category: 'career', needs: ['fullTime'], cooldown: 5, band: 'Work', title: 'Training Course',
    text: 'Your employer offers to pay for a professional course, but it means evenings for three months.', choices: [
      { label: 'Take the course', text: 'You finished the professional course and immediately used it at work.', effects: { smarts: 3, performance: 4, happiness: -1 } },
      { label: 'Pass this time', text: 'You passed on the course this year.', effects: { happiness: 1 } },
    ] }),
  ev({ id: 'coworkerConflict', category: 'career', needs: ['fullTime'], cooldown: 5, band: 'Work', title: 'Office Friction',
    text: 'A coworker keeps taking credit for your ideas in meetings.', choices: [
      { label: 'Talk to them directly', text: 'You talked to the coworker directly. It was awkward, and then it stopped.', effects: { performance: 2, happiness: 1 } },
      { label: 'Raise it with your manager', text: 'You raised the issue with your manager, who started noting who said what.', effects: { performance: 3, happiness: -1 } },
      { label: 'Let it go', text: 'You let it go. The credit kept going to the wrong person.', effects: { happiness: -3, performance: -1 } },
    ] }),
  ev({ id: 'mentorJunior', category: 'career', needs: ['fullTime'], when: (c) => c.career.rung >= 1, cooldown: 5, band: 'Work', title: 'The New Hire',
    text: 'A new hire is struggling, and nobody has time to help them.', choices: [
      { label: 'Mentor them', text: 'You mentored the new hire, and they turned into one of the best on the team.', effects: { happiness: 3, performance: 2, newCoworker: true } },
      { label: 'Focus on your own work', text: 'You focused on your own work and hit every target.', effects: { performance: 3 } },
    ] }),
  ev({ id: 'retirementOffer', category: 'career', needs: ['fullTime'], minAge: 62, cooldown: 3, band: 'Work', title: 'Time to Retire?',
    text: (c) => `${c.employer} is offering early retirement packages. You could stop working now.`, choices: [
      { label: 'Retire', text: 'You accepted the retirement package.', effects: { money: 4000 }, followUp: 'retire' },
      { label: 'Keep working', text: 'You decided you were not done working yet.', effects: { happiness: 1 } },
    ] }),
  ev({ id: 'bossAsksFavor', category: 'career', needs: ['fullTime'], cooldown: 6, band: 'Work', title: 'Weekend Favor',
    text: 'Your boss asks you to cover a weekend shift at the last minute, on your birthday.', choices: [
      { label: 'Cover it', text: 'You covered the shift on your birthday. Your boss remembered it at review time.', effects: { performance: 4, happiness: -3 } },
      { label: 'Say no politely', text: 'You said no politely and had a great birthday.', effects: { happiness: 3, performance: -1 } },
    ] }),
  ev({ id: 'unemployedReferral', category: 'career', needs: ['unemployedAdult'], minAge: 19, person: 'friend', cooldown: 4, band: 'Work', title: 'A Lead',
    text: (c) => `${c.whoName} knows someone who is hiring and can put in a good word, but the job starts at the bottom.`, choices: [
      { label: 'Ask for the referral', text: (c) => `${c.whoName} put in a good word. Check the job board: your name is on the shortlist.`, effects: { closeness: 4, happiness: 2, smarts: 1 }, followUp: 'jobs' },
      { label: 'Keep looking on your own', text: 'You thanked your friend and kept looking on your own terms.', effects: { happiness: 1 } },
    ] }),
];
