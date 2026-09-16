// Decisions at university or trade school. Original BetLife writing.
import { ev } from '../events/define.js';

export const UNIVERSITY_DECISIONS = [
  ev({ id: 'researchAssistantOffer', category: 'education', needs: ['university'], minAge: 19, once: true, band: 'University', title: 'Research Assistant',
    text: 'A professor offers you a paid spot as a research assistant this year. It will eat your weekends.', choices: [
      { label: 'Accept', text: 'You worked as a research assistant and learned more than in any class.', effects: { smarts: 3, performance: 4, money: 900, happiness: -1 } },
      { label: 'Decline', text: 'You turned down the research position to protect your free time.', effects: { happiness: 2 } },
    ] }),
  ev({ id: 'studyGroupInvite', category: 'education', needs: ['student', 'adult'], once: true, band: 'University', title: 'Study Group',
    text: 'Your roommate suggests forming a weekly study group.', choices: [
      { label: 'Join', text: 'The weekly study group kept you on top of your classes.', effects: { smarts: 2, performance: 4, newFriend: true } },
      { label: 'Study alone', text: 'You preferred to study on your own this year.', effects: { performance: 1 } },
    ] }),
  ev({ id: 'springBreakPlans', category: 'personal', needs: ['university'], cooldown: 3, band: 'University', title: 'Spring Break',
    text: 'Spring break is coming. Your friends are planning a beach trip; your bank account is not.', choices: [
      { label: 'Go on the trip', text: 'You went on the beach trip and came back sunburned and broke.', effects: { happiness: 5, money: -400, friends: 3 } },
      { label: 'Work through the break', text: 'You picked up extra shifts over spring break and saved every dollar.', effects: { money: 500, happiness: -1 } },
      { label: 'Go home', text: 'You went home for spring break and slept in your childhood bed.', effects: { happiness: 2, family: 3 } },
    ] }),
  ev({ id: 'changeMajor', category: 'education', needs: ['university'], when: (c) => c.edu.year === 2 && c.edu.performance < 60, once: true, band: 'University', title: 'Second Thoughts',
    text: (c) => `Two years into ${c.edu.major}, you are not sure it is right for you.`, choices: [
      { label: 'Push through', text: 'You pushed through and rediscovered why you chose your major in the first place.', effects: { performance: 5, smarts: 1 } },
      { label: 'Talk to an advisor', text: 'An advisor helped you plan your remaining courses, and things clicked again.', effects: { performance: 3, happiness: 2 } },
    ] }),
  ev({ id: 'campusElection', category: 'personal', needs: ['university'], minAge: 19, once: true, band: 'University', title: 'Student Council',
    text: 'A friend nominates you for the student council.', choices: [
      { label: 'Run for it', text: (c) => (c.p.happiness >= 55 ? 'You ran for student council and won on a platform of better vending machines.' : 'You ran for student council and lost, but made friends on the campaign.'), effects: { happiness: 3, newFriend: true, smarts: 1 } },
      { label: 'Decline', text: 'You declined the nomination. Politics can wait.', effects: { happiness: 1 } },
    ] }),
  ev({ id: 'internshipChoice', category: 'career', needs: ['university'], minAge: 20, once: true, band: 'University', title: 'Summer Plans',
    text: 'You have two summer offers: an unpaid internship in your field or a paid job unrelated to it.', choices: [
      { label: 'Take the internship', text: 'You took the unpaid internship and built connections in your field.', effects: { smarts: 3, performance: 2, money: -200 } },
      { label: 'Take the paid job', text: 'You took the paid summer job and started the year with savings.', effects: { money: 2000, happiness: 1 } },
    ] }),
  ev({ id: 'tradeApprenticeship', category: 'career', needs: ['trade'], once: true, band: 'Trade School', title: 'Apprenticeship',
    text: 'A local company offers you a paid apprenticeship alongside your classes.', choices: [
      { label: 'Take it', text: 'You took the apprenticeship and learned the trade with real tools and real customers.', effects: { smarts: 3, performance: 3, money: 1500, health: -1 } },
      { label: 'Focus on classes', text: 'You decided to finish your classes before working.', effects: { performance: 2 } },
    ] }),
];
