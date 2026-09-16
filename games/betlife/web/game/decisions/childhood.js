// Decisions for infants and children (ages 0-9). Original BetLife writing.
import { ev } from '../events/define.js';

const S = ['infant'];
const C = ['child'];

export const CHILDHOOD_DECISIONS = [
  ev({ id: 'vaccinationDay', category: 'health', stages: S, minAge: 1, maxAge: 2, once: true, person: 'parent', band: 'Family', title: 'The Doctor Visit',
    text: (c) => `${c.whoName} takes you to the clinic for your shots. The nurse has a very bright sticker.`, choices: [
      { label: 'Cry the whole time', text: 'You cried through the whole doctor visit. The sticker helped a little.', effects: { health: 2, happiness: -1 } },
      { label: 'Be brave', text: 'You held still for your shots like a champion and earned two stickers.', effects: { health: 2, happiness: 1, closeness: 2 } },
      { label: 'Hide under the chair', text: 'You hid under the chair at the clinic, which delayed everything by twenty minutes.', effects: { health: 2, closeness: -1 } },
    ] }),
  ev({ id: 'toyTaken', category: 'personal', stages: S, minAge: 2, maxAge: 3, once: true, band: 'Childhood', title: 'The Missing Toy',
    text: 'At the playground another toddler grabs your favorite toy right out of your hands.', choices: [
      { label: 'Cry', text: 'You cried until the toy came back. Effective, if loud.', effects: { happiness: 1 } },
      { label: 'Let them play', text: 'You let the other toddler play with your toy, and soon you were playing together.', effects: { happiness: 2, newFriend: true } },
      { label: 'Grab it back', text: 'You grabbed your toy back. There was a brief scuffle and a time-out.', effects: { happiness: -1 } },
    ] }),
  ev({ id: 'broccoliStandoff', category: 'family', stages: S, minAge: 2, maxAge: 3, once: true, person: 'parent', band: 'Family', title: 'Dinner Standoff',
    text: (c) => `${c.whoName} put broccoli on your plate and is waiting.`, choices: [
      { label: 'Eat it', text: 'You ate the broccoli. It was not terrible, but you did not admit it.', effects: { health: 2, closeness: 2 } },
      { label: 'Feed it to the dog', text: (c) => (c.pets.length ? 'You slipped the broccoli to the pet under the table. Everyone noticed.' : 'You hid the broccoli under your napkin. Everyone noticed.'), effects: { happiness: 1, closeness: -1 } },
      { label: 'Refuse', text: 'You refused the broccoli and sat at the table for a very long time.', effects: { happiness: -1 } },
    ] }),
  ev({ id: 'familyPet', category: 'family', stages: C, minAge: 4, maxAge: 9, once: true, needs: ['noPets'], band: 'Family', title: 'A New Pet',
    text: 'Your parents say the family can adopt a pet. Which one do you pick?', choices: [
      { label: 'A dog', text: 'Your family adopted a playful dog that follows you everywhere.', effects: { happiness: 4, health: 1, newPet: 'dog' } },
      { label: 'A cat', text: 'Your family adopted a cat that sleeps on your bed every night.', effects: { happiness: 3, newPet: 'cat' } },
      { label: 'A rabbit', text: 'Your family adopted a rabbit with enormous ears and no fear of anything.', effects: { happiness: 3, newPet: 'rabbit' } },
      { label: 'No pet, thanks', text: 'You decided the house was busy enough without a pet.', effects: { smarts: 1 } },
    ] }),
  ev({ id: 'brokenVase', category: 'personal', stages: C, minAge: 4, maxAge: 8, once: true, person: 'parent', band: 'Childhood', title: 'The Broken Vase',
    text: (c) => `You knocked over a vase while playing indoors. ${c.whoName} is about to come in.`, choices: [
      { label: 'Tell the truth', text: 'You admitted you broke the vase. There was a sigh, and then a hug.', effects: { closeness: 4, happiness: 1 } },
      { label: 'Blame the cat', text: (c) => (c.pets.length ? 'You blamed the pet. The pet was cleared of all charges by lunchtime.' : 'You blamed a cat that does not exist. It did not go well.'), effects: { closeness: -4, happiness: -1 } },
      { label: 'Hide the pieces', text: 'You hid the pieces behind the couch. They were found on Saturday.', effects: { closeness: -2 } },
    ] }),
  ev({ id: 'schoolPlayRole', category: 'education', stages: C, needs: ['elementary'], once: true, band: 'School', title: 'The School Play',
    text: 'Your class is putting on a play. Which part do you want?', choices: [
      { label: 'The lead role', text: 'You starred in the school play and took a bow to loud applause.', effects: { happiness: 4, smarts: 1, looks: 1 } },
      { label: 'Paint the scenery', text: 'You painted the scenery for the play and loved every minute.', effects: { happiness: 2, smarts: 1 } },
      { label: 'Run the lights', text: 'You ran the lights for the play and only plunged the stage into darkness once.', effects: { smarts: 2, happiness: 1 } },
    ] }),
  ev({ id: 'spellingBeePrep', category: 'education', stages: ['child', 'preteen'], needs: ['school'], minAge: 7, maxAge: 11, once: true, band: 'School', title: 'Spelling Bee',
    text: 'The school spelling bee is next week. How do you prepare?', choices: [
      { label: 'Practice every night', text: 'You practiced every night and made it to the final round of the spelling bee.', effects: { smarts: 3, performance: 3, happiness: 1 } },
      { label: 'Just wing it', text: 'You winged the spelling bee and went out early, but had fun anyway.', effects: { happiness: 2 } },
    ] }),
  ev({ id: 'classmateCheating', category: 'education', stages: ['child', 'preteen'], needs: ['school'], minAge: 7, once: true, band: 'School', title: 'Eyes on Your Paper',
    text: 'During a test, the classmate next to you keeps looking at your answers.', choices: [
      { label: 'Cover your paper', text: 'You covered your paper during the test. Your classmate sulked but got the message.', effects: { performance: 1, smarts: 1 } },
      { label: 'Let them copy', text: 'You let your classmate copy your test. The teacher noticed, and you both lost points.', effects: { performance: -4, happiness: -2 } },
      { label: 'Tell the teacher', text: 'You quietly told the teacher afterward. It was the right thing, and it felt awful.', effects: { happiness: -1, performance: 1 } },
    ] }),
  ev({ id: 'birthdayWish', category: 'family', stages: C, minAge: 5, maxAge: 9, once: true, band: 'Family', title: 'Birthday Wish',
    text: 'Your parents ask what you want most for your birthday.', choices: [
      { label: 'A bike', text: 'You got a bike for your birthday and rode it around the block eleven times.', effects: { happiness: 4, health: 2 } },
      { label: 'A big party', text: 'You had a big birthday party with all your friends and a dinosaur cake.', effects: { happiness: 4, friends: 3 } },
      { label: 'A trip to the zoo', text: 'Your family spent your birthday at the zoo. A giraffe ate your hat.', effects: { happiness: 3, smarts: 1, family: 2 } },
    ] }),
  ev({ id: 'playgroundBully', category: 'friendship', stages: ['child', 'preteen'], minAge: 6, once: true, person: 'friend', band: 'Friends', title: 'Standing Up',
    text: (c) => `An older kid at the playground is picking on ${c.whoName}.`, choices: [
      { label: 'Stand up for your friend', text: (c) => `You stood up for ${c.whoName}. The older kid backed off, surprised.`, effects: { closeness: 8, happiness: 2 } },
      { label: 'Get a grown-up', text: (c) => `You fetched a grown-up, and the situation ended quickly. ${c.whoName} was grateful.`, effects: { closeness: 5, smarts: 1 } },
      { label: 'Stay out of it', text: (c) => `You stayed out of it. ${c.whoName} did not say anything, which was worse.`, effects: { closeness: -6, happiness: -2 } },
    ] }),
  ev({ id: 'foundMoneyKid', category: 'finance', stages: ['child', 'preteen'], minAge: 6, once: true, band: 'Personal', title: 'Finders Keepers?',
    text: 'You find a $20 bill on the sidewalk outside the grocery store.', choices: [
      { label: 'Keep it', text: 'You kept the $20 you found and felt rich for a week.', effects: { money: 20, happiness: 2 } },
      { label: 'Hand it to the cashier', text: 'You handed the money to the cashier in case someone came back for it. Nobody did, but you felt good.', effects: { happiness: 2, smarts: 1 } },
    ] }),
];
