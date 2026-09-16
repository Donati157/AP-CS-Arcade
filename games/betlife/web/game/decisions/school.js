// Decisions during middle school and high school (ages 10-17). Original BetLife writing.
import { ev } from '../events/define.js';

const PT = ['preteen', 'teen'];
const T = ['teen'];

export const SCHOOL_DECISIONS = [
  ev({ id: 'fieldTripConduct', category: 'education', stages: PT, needs: ['school'], once: true, band: 'School', title: 'Field Trip',
    text: 'Your class is going on a field trip to the aquarium. How do you spend the day?', choices: [
      { label: 'Pay attention to the guide', text: 'You listened to the aquarium guide and learned the names of nine kinds of jellyfish.', effects: { smarts: 3, performance: 2 } },
      { label: 'Hang out with friends', text: 'You spent the field trip laughing with your friends by the touch pool.', effects: { happiness: 3, friends: 3 } },
      { label: 'Sneak off to the gift shop', text: 'You snuck off to the gift shop and got caught by a chaperone. Detention followed.', effects: { happiness: 1, performance: -3 } },
    ] }),
  ev({ id: 'roboticsInvite', category: 'education', stages: PT, needs: ['school'], minAge: 12, once: true, band: 'School', title: 'Robotics Club',
    text: 'A classmate invites you to join the robotics club after school.', choices: [
      { label: 'Join the club', text: 'You joined the robotics club and built a robot that mostly went in circles.', effects: { smarts: 3, happiness: 2, newFriend: true } },
      { label: 'Decline', text: 'You decided to keep your afternoons free this year.', effects: { happiness: 1 } },
    ] }),
  ev({ id: 'talentShowSignup', category: 'hobby', stages: PT, needs: ['school'], minAge: 11, once: true, band: 'School', title: 'Talent Show',
    text: 'The school is holding a talent show. Do you sign up?', choices: [
      { label: 'Perform', text: 'You performed at the talent show, and the crowd loved it.', effects: { happiness: 4, looks: 1 } },
      { label: 'Help backstage', text: 'You ran the music backstage and kept the show on time.', effects: { happiness: 2, smarts: 1, newFriend: true } },
      { label: 'Watch from the audience', text: 'You cheered for your friends from the audience.', effects: { happiness: 1, friends: 1 } },
    ] }),
  ev({ id: 'studyBuddy', category: 'friendship', stages: T, needs: ['highSchool'], person: 'friend', cooldown: 4, band: 'Friends', title: 'Study Buddy',
    text: (c) => `${c.whoName} asks you to help study before a big test.`, choices: [
      { label: 'Help them', text: (c) => `You spent the evening helping ${c.whoName} study. You both did well.`, effects: { closeness: 6, smarts: 1, performance: 1 } },
      { label: "Say you're busy", text: (c) => `You told ${c.whoName} you were too busy to help.`, effects: { closeness: -4, happiness: 1 } },
    ] }),
  ev({ id: 'dogWalkingJob', category: 'finance', stages: PT, minAge: 11, once: true, band: 'Money', title: 'Dog Walking',
    text: 'A neighbor offers to pay you to walk their dog every week this year.', choices: [
      { label: 'Accept', text: "You walked the neighbor's dog all year and earned some money and strong calves.", effects: { money: 160, health: 2, happiness: 1 } },
      { label: 'Decline', text: 'You told the neighbor you were too busy this year.', effects: {} },
    ] }),
  ev({ id: 'groupProjectSlacker', category: 'education', stages: T, needs: ['highSchool'], once: true, band: 'School', title: 'Group Project',
    text: 'One member of your group project has done nothing, and the deadline is tomorrow.', choices: [
      { label: 'Do their part yourself', text: 'You finished the whole group project yourself and got a good grade and a headache.', effects: { performance: 4, smarts: 1, happiness: -2, health: -1 } },
      { label: 'Talk to them', text: 'You had an honest talk with your teammate, and they pulled an all-nighter to catch up.', effects: { performance: 3, smarts: 1 } },
      { label: 'Tell the teacher', text: 'You told the teacher who did the work. Fair, but the group was not happy.', effects: { performance: 2, friends: -2 } },
    ] }),
  ev({ id: 'sportsTryout', category: 'hobby', stages: T, needs: ['school'], minAge: 13, once: true, band: 'School', title: 'Team Tryouts',
    text: 'Tryouts for the school team are this week.', choices: [
      { label: 'Try out', text: (c) => (c.p.health >= 55 ? 'You made the team and spent the season practicing after school.' : 'You did not make the team, but the coach suggested trying again next year.'), effects: { health: 3, happiness: 2 } },
      { label: 'Skip it', text: 'You decided team sports were not your thing.', effects: {} },
    ] }),
  ev({ id: 'peerPressureSkip', category: 'personal', stages: T, needs: ['highSchool'], minAge: 14, once: true, person: 'friend', band: 'Friends', title: 'Skipping Class',
    text: (c) => `${c.whoName} wants to skip the last class of the day and go get milkshakes.`, choices: [
      { label: 'Go along', text: (c) => `You skipped class with ${c.whoName}. The milkshakes were great; the missed quiz was not.`, effects: { closeness: 4, happiness: 2, performance: -4 } },
      { label: 'Stay in class', text: (c) => `You stayed in class and met ${c.whoName} afterward instead.`, effects: { closeness: 1, performance: 1 } },
    ] }),
  ev({ id: 'partTimeJobOffer', category: 'career', stages: T, minAge: 15, once: true, needs: ['school'], band: 'Money', title: 'First Job Offer',
    text: 'The corner café is hiring weekend help. It would mean less free time but real money.', choices: [
      { label: 'Take the job', text: 'You took the weekend job at the café and learned how to carry four plates at once.', effects: { money: 1400, smarts: 1, happiness: -1, health: -1 } },
      { label: 'Focus on school', text: 'You decided school and friends were enough for now.', effects: { performance: 2, happiness: 1 } },
    ] }),
  ev({ id: 'examCheatOffer', category: 'education', stages: T, needs: ['highSchool'], minAge: 15, once: true, band: 'School', title: 'The Answer Key',
    text: 'Someone is passing around what they claim are the answers to tomorrow\'s exam.', choices: [
      { label: 'Use them', text: 'You used the leaked answers. They were half wrong, and the teacher noticed the pattern.', effects: { performance: -6, happiness: -3 } },
      { label: 'Ignore them and study', text: 'You ignored the leaked answers and studied. You did fine on your own.', effects: { performance: 3, smarts: 2 } },
    ] }),
  ev({ id: 'collegeVsWork', category: 'education', stages: T, needs: ['highSchool'], minAge: 16, maxAge: 17, once: true, band: 'School', title: 'Thinking Ahead',
    text: 'A school counselor asks what you are planning to do after graduation.', choices: [
      { label: 'University', text: 'You told the counselor you were aiming for university and left with a study plan.', effects: { smarts: 2, performance: 2 } },
      { label: 'Learn a trade', text: 'You told the counselor you wanted hands-on work and toured the technical institute.', effects: { smarts: 1, happiness: 1 } },
      { label: 'Not sure yet', text: 'You told the counselor you had no idea, and they said that was normal.', effects: { happiness: 1 } },
    ] }),
  ev({ id: 'friendSecret', category: 'friendship', stages: PT, minAge: 12, person: 'friend', cooldown: 5, band: 'Friends', title: 'A Secret',
    text: (c) => `${c.whoName} tells you a secret and makes you promise not to tell anyone.`, choices: [
      { label: 'Keep it', text: (c) => `You kept ${c.whoName}'s secret, and your friendship grew stronger.`, effects: { closeness: 7, happiness: 1 } },
      { label: 'Tell someone', text: (c) => `You told someone ${c.whoName}'s secret. It got back to them within a day.`, effects: { closeness: -12, happiness: -3 } },
    ] }),
  ev({ id: 'carGiftOffer', category: 'asset', stages: T, minAge: 16, needs: ['licence', 'noCar'], person: 'parent', once: true, band: 'Family', title: 'Wheels',
    text: (c) => `${c.whoName} offers you the old family car if you promise to pay for the gas.`, choices: [
      { label: 'Accept gratefully', text: (c) => `${c.whoName} gave you the old family car. It rattles, and you love it.`, effects: { happiness: 5, closeness: 3 },
        then: (state) => { state.assets.push({ id: `a${state.nextAssetId++}`, itemId: 'oldHatch', name: 'Old Family Hatchback', type: 'vehicle', kind: 'car', value: 2500, condition: 50, upkeep: 0.12, boughtAt: state.player.age, cost: 0 }); } },
      { label: 'Turn it down', text: 'You turned down the old car. You would rather save for your own.', effects: { smarts: 1 } },
    ] }),
];
