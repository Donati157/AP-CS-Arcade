// Decisions in later life. Non-graphic, original BetLife writing.
import { ev } from '../events/define.js';

const S = ['senior'];

export const SENIOR_DECISIONS = [
  ev({ id: 'retireNow', category: 'career', needs: ['fullTime'], minAge: 65, cooldown: 2, band: 'Work', title: 'Ready to Retire?',
    text: (c) => `You have worked for ${c.career.yearsWorked} years. Colleagues keep asking when you will retire.`, choices: [
      { label: 'Retire this year', text: 'You decided this was the year to retire.', effects: {}, followUp: 'retire' },
      { label: 'One more year', text: 'You decided on one more year. Maybe two.', effects: { happiness: 1 } },
    ] }),
  ev({ id: 'seniorHobbyChoice', category: 'hobby', stages: S, once: true, band: 'Hobbies', title: 'New Chapter',
    text: 'With more free time than ever, you want to pick up something new.', choices: [
      { label: 'Join a choir', text: 'You joined a community choir and sang at the winter concert.', effects: { happiness: 4, newFriend: true } },
      { label: 'Take up woodworking', text: 'You took up woodworking and made a birdhouse that birds actually use.', effects: { happiness: 3, smarts: 2 } },
      { label: 'Learn to paint', text: 'You learned to paint and hung your third landscape in the hallway.', effects: { happiness: 3 } },
    ] }),
  ev({ id: 'moveCloserToFamily', category: 'family', stages: S, needs: ['children'], once: true, band: 'Family', title: 'Closer to Family',
    text: 'Your children suggest you move closer to them.', choices: [
      { label: 'Move closer', text: 'You moved closer to your children and became the default babysitter, happily.', effects: { happiness: 4, money: -1500 }, then: (state, c) => { for (const k of c.children) k.closeness = Math.min(100, k.closeness + 10); } },
      { label: 'Stay put', text: 'You stayed in the home you know, with the neighbors you know.', effects: { happiness: 2 } },
    ] }),
  ev({ id: 'seniorHealthChoice', category: 'health', stages: S, cooldown: 5, band: 'Health', title: 'Staying Active',
    text: 'Your doctor recommends a regular exercise program designed for seniors.', choices: [
      { label: 'Sign up', text: 'You signed up for the exercise program and made friends in the class.', effects: { health: 5, happiness: 2, newFriend: true } },
      { label: 'Walk on your own', text: 'You promised to walk every day instead, and mostly kept it.', effects: { health: 3 } },
      { label: 'Skip it', text: 'You skipped the exercise program.', effects: { health: -2 } },
    ] }),
  ev({ id: 'grandkidsSummer', category: 'family', stages: S, when: (c) => (c.state.events.count.grandchildBorn || 0) > 0, cooldown: 4, band: 'Family', title: 'Summer Guests',
    text: 'Your grandchildren could spend the whole summer with you.', choices: [
      { label: 'Have them all summer', text: 'The grandchildren stayed all summer. The house was loud, sticky and wonderful.', effects: { happiness: 6, health: -2, family: 3 } },
      { label: 'Two weeks is plenty', text: 'The grandchildren stayed for two weeks, which was exactly right.', effects: { happiness: 4 } },
    ] }),
  ev({ id: 'writeWill', category: 'finance', stages: S, once: true, band: 'Money', title: 'Putting Things in Order',
    text: 'A friend suggests it is time to write a will and organize your affairs.', choices: [
      { label: 'Write the will', text: 'You wrote your will and felt a weight lift.', effects: { happiness: 2, money: -200 } },
      { label: 'Later', text: 'You decided there was still plenty of time for that.', effects: {} },
    ] }),
  ev({ id: 'oldFriendTrip', category: 'friendship', stages: S, person: 'friend', needs: ['money'], cooldown: 6, band: 'Friends', title: 'One More Adventure',
    text: (c) => `${c.whoName} wants to take the road trip you two always talked about.`, choices: [
      { label: 'Go', text: (c) => `You and ${c.whoName} took the road trip at last, arguing about the map the whole way.`, effects: { closeness: 8, happiness: 6, money: -1200 } },
      { label: 'Maybe next year', text: (c) => `You told ${c.whoName} maybe next year. You both knew what that meant.`, effects: { closeness: -3, happiness: -2 } },
    ] }),
];
