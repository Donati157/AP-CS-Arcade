// The pool of random life events (original BetLife content) and the yearly pick.
// effect fields: happiness, health, smarts, money, performance, friend, family, newFriend.
const NO_LIMIT = 200;

function effect(happiness = 0, health = 0, smarts = 0, money = 0, extra = {}) {
  return { happiness, health, smarts, money, ...extra };
}
const NONE = effect();

function plain(id, text, minAge, maxAge, requires, eff, kind = 'normal') {
  return { id, text, minAge, maxAge, requires, effect: eff, kind, decision: null };
}

function choice(label, resultText, eff, followUp = null) {
  return { label, resultText, effect: eff, followUp };
}

function decision(id, text, minAge, maxAge, requires, title, description, choices) {
  return { id, text, minAge, maxAge, requires, effect: NONE, kind: 'normal', decision: { title, description, choices } };
}

export const EVENTS = [
  // Early years
  plain('firstSteps', 'You took your first wobbly steps across the living room.', 1, 1, 'anyone', effect(2, 1), 'positive'),
  plain('firstWord', 'You said your first word, and your parents could not stop cheering.', 1, 2, 'anyone', effect(2, 0, 2), 'positive'),
  plain('grandparents', 'Your grandparents came to visit and spoiled you all week.', 2, 12, 'anyone', effect(3, 0, 0, 0, { family: 3 }), 'positive'),
  plain('scrapedKnee', 'You scraped your knee falling off the playground slide.', 3, 9, 'anyone', effect(-1, -2)),
  plain('daycareFriend', 'You met another kid at the park and became inseparable.', 3, 5, 'anyone', effect(2, 0, 0, 0, { newFriend: true }), 'positive'),
  decision('familyPet', 'Your parents ask what pet the family should adopt.', 4, 10, 'anyone',
    'A New Pet', 'Your parents say the family can adopt a pet. Which one do you pick?', [
      choice('A dog', 'Your family adopted a playful dog, and it follows you everywhere.', effect(4, 1, 0, 0, { family: 2 })),
      choice('A cat', 'Your family adopted a cat that sleeps on your bed every night.', effect(3, 0, 0, 0, { family: 2 })),
    ]),
  plain('lostTooth', 'You lost your first tooth and found a coin under your pillow.', 5, 7, 'anyone', effect(2, 0, 0, 5), 'positive'),
  plain('learnedToSwim', 'You learned to swim at the community pool this summer.', 5, 9, 'anyone', effect(2, 3), 'positive'),
  plain('trainingWheels', 'You rode a bike without training wheels for the first time.', 5, 8, 'anyone', effect(3, 1), 'positive'),
  decision('schoolPlay', 'Your class is putting on a school play.', 6, 11, 'school',
    'School Play', 'Your class is putting on a play. What part do you want?', [
      choice('Take the lead role', 'You starred in the school play and took a bow to loud applause.', effect(4, 0, 1)),
      choice('Paint the scenery', 'You painted the scenery for the school play and loved every minute.', effect(2, 0, 1)),
    ]),
  decision('spellingBee', 'The school spelling bee is next week.', 7, 12, 'school',
    'Spelling Bee', 'The school spelling bee is next week. How do you prepare?', [
      choice('Practice every night', 'You practiced every night and made it to the final round of the spelling bee.', effect(1, 0, 3, 0, { performance: 3 })),
      choice('Just wing it', 'You winged the spelling bee and went out early, but had fun anyway.', effect(2)),
    ]),
  plain('scienceKit', 'You got a science kit for your birthday and spent weeks experimenting.', 7, 12, 'anyone', effect(2, 0, 3), 'positive'),

  // Teen years at high school
  decision('robotics', 'A classmate invites you to join the robotics club.', 13, 17, 'highSchool',
    'Robotics Club', 'A classmate invites you to join the robotics club after school.', [
      choice('Join the club', 'You joined the robotics club and made new friends.', effect(3, 0, 2, 0, { friend: 3 })),
      choice('Decline', 'You decided to keep your afternoons free.', NONE),
    ]),
  plain('groupProject', 'Your class was assigned a big group project, and you carried your share of the work.',
    9, 17, 'school', effect(0, 0, 2, 0, { performance: 3 })),
  decision('talentShow', 'The school talent show is coming up.', 13, 17, 'highSchool',
    'Talent Show', 'The school is holding a talent show. Do you sign up to perform?', [
      choice('Perform', 'You performed at the talent show and the crowd loved it.', effect(4)),
      choice('Watch from the audience', 'You cheered for your friends at the talent show.', effect(1)),
    ]),
  plain('camping', 'Your family went on a weekend camping trip together.', 5, 17, 'anyone', effect(3, 1, 0, 0, { family: 2 }), 'positive'),
  plain('birthdayGift', 'You received a small birthday gift from your family.', 3, 25, 'anyone', effect(1, 0, 0, 50), 'positive'),
  decision('dogWalking', 'A neighbor offers to pay you to walk their dog.', 12, 17, 'anyone',
    'Dog Walking', 'A neighbor offers to pay you to walk their dog every week this year.', [
      choice('Accept', "You walked the neighbor's dog all year and earned some money.", effect(1, 1, 0, 150)),
      choice('Decline', 'You told the neighbor you were too busy this year.', NONE),
    ]),
  plain('newStudent', 'A new student joined your class, and the two of you became friends.', 6, 17, 'school', effect(2, 0, 0, 0, { newFriend: true }), 'positive'),
  decision('studyBuddy', 'A friend asks for help before a big test.', 13, 17, 'highSchool',
    'Study Buddy', 'A friend asks you to help them study before a big test.', [
      choice('Help them', 'You spent the evening helping a friend study.', effect(1, 0, 1, 0, { friend: 5 })),
      choice("Say you're busy", 'You told your friend you were too busy to help.', effect(1, 0, 0, 0, { friend: -3 })),
    ]),
  plain('toughExams', 'Exams were tougher than expected this year, but you got through them.', 14, 17, 'highSchool', effect(-2, 0, 1, 0)),

  // Any age
  plain('lostWallet', 'You lost your wallet at the mall and never found it.', 12, NO_LIMIT, 'anyone', effect(-2, 0, 0, -40)),
  plain('cleanup', 'You helped organize a community cleanup day.', 14, NO_LIMIT, 'anyone', effect(3), 'positive'),
  plain('surpriseParty', 'Your friends threw you a surprise party.', 15, NO_LIMIT, 'anyone', effect(5, 0, 0, 0, { friend: 3 }), 'positive'),
  plain('badCold', 'You caught a bad cold and spent a week in bed.', 5, NO_LIMIT, 'anyone', effect(-1, -3)),
  decision('catchingUp', 'An old friend is visiting town.', 16, NO_LIMIT, 'anyone',
    'Catching Up', 'An old friend is visiting town and wants to catch up.', [
      choice('Meet up', 'You spent a great afternoon catching up with an old friend.', effect(2, 0, 0, 0, { friend: 6 })),
      choice('Too busy', 'You never found time to meet your visiting friend.', effect(0, 0, 0, 0, { friend: -4 })),
    ]),
  plain('photography', 'You picked up photography as a new hobby.', 12, NO_LIMIT, 'anyone', effect(3), 'positive'),
  plain('repairBill', 'An unexpected repair bill arrived this year.', 18, NO_LIMIT, 'anyone', effect(-1, 0, 0, -120)),
  decision('volunteering', 'A local charity asked for volunteers.', 16, NO_LIMIT, 'anyone',
    'Volunteering', 'A local charity is looking for weekend volunteers.', [
      choice('Volunteer', 'You volunteered on weekends and met wonderful people.', effect(3, 0, 0, 0, { newFriend: true })),
      choice('Not this year', 'You decided not to volunteer this year.', NONE),
    ]),

  // University
  plain('textbooks', 'You found a great deal on used textbooks and saved some money.', 18, 30, 'university', effect(1, 0, 0, 60), 'positive'),
  decision('research', 'A professor offers you a research assistant position.', 18, 30, 'university',
    'Research Assistant', 'A professor offers you a paid spot as a research assistant this year.', [
      choice('Accept', 'You worked as a research assistant and learned a lot.', effect(-1, 0, 3, 300, { performance: 4 })),
      choice('Decline', 'You turned down the research position to focus on classes.', effect(1)),
    ]),
  decision('studyGroup', 'Your roommate suggests starting a study group.', 18, 30, 'university',
    'Study Group', 'Your roommate suggests forming a weekly study group.', [
      choice('Join', 'The weekly study group kept you on top of your classes.', effect(1, 0, 2, 0, { performance: 4, friend: 2 })),
      choice('Study alone', 'You preferred to study on your own this year.', NONE),
    ]),
  plain('campusLife', 'Campus life was busy this year, with late nights and early classes.', 18, 30, 'university', effect(1, -1, 1)),

  // Work
  decision('soccerTeam', 'A coworker invites you to join the company soccer team.', 18, NO_LIMIT, 'employed',
    'Company Team', 'A coworker invites you to join the company soccer team.', [
      choice('Join the team', 'You played on the company soccer team all season.', effect(2, 3, 0, 0, { newFriend: true })),
      choice('Decline', 'You decided team sports were not for you this year.', NONE),
    ]),
  decision('extraShifts', 'Your manager offered you extra shifts.', 18, NO_LIMIT, 'employed',
    'Extra Shifts', 'Your manager asks if you want to take on extra shifts this year.', [
      choice('Take the shifts', 'You worked extra shifts and earned a nice bonus.', effect(-2, -1, 0, 400)),
      choice('Keep your hours', 'You kept your regular hours and enjoyed your free time.', effect(1)),
    ]),
  plain('bonus', 'You received a year-end bonus for your dedication at work.', 18, NO_LIMIT, 'employed', effect(2, 0, 0, 500), 'positive'),
  plain('busySeason', 'A busy season at work left you tired but proud of what you accomplished.', 18, NO_LIMIT, 'employed', effect(1, -1, 1)),
];

export function findEvent(id) {
  return EVENTS.find((event) => event.id === id) || null;
}

// requires: 'anyone' | 'school' (any grade) | 'highSchool' | 'university' | 'employed'
export function isEligible(event, age, education, employed) {
  if (age < event.minAge || age > event.maxAge) return false;
  switch (event.requires) {
    case 'school': return education.stage === 'school';
    case 'highSchool': return education.stage === 'school' && education.year >= 9;
    case 'university': return education.stage === 'university';
    case 'employed': return employed;
    default: return true;
  }
}

// Picks a random eligible event, avoiding last year's. Returns null if nothing is eligible.
export function pickEvent(rng, age, education, employed, lastEventId) {
  const eligible = EVENTS.filter((event) => event.id !== lastEventId && isEligible(event, age, education, employed));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(rng() * eligible.length)];
}
