// Adult life decisions: money, home, friends, lifestyle. Original BetLife writing.
import { ev } from '../events/define.js';

const A = ['youngAdult', 'adult', 'middleAge'];

export const ADULT_DECISIONS = [
  ev({ id: 'oldFriendVisitPlan', category: 'friendship', stages: A, person: 'friend', cooldown: 8, band: 'Friends', title: 'A Visit',
    text: (c) => `${c.whoName} is passing through town for one night and wants to meet up. You have an early morning.`, choices: [
      { label: 'Meet up', text: (c) => `You met ${c.whoName} and talked until the café closed. The morning was rough and worth it.`, effects: { closeness: 8, happiness: 4, health: -1 } },
      { label: 'Rain check', text: (c) => `You asked ${c.whoName} for a rain check. The next visit was a long way off.`, effects: { closeness: -5 } },
    ] }),
  ev({ id: 'roommateOffer', category: 'finance', stages: ['youngAdult'], needs: ['ownPlace', 'noHome', 'noPartner'], once: true, band: 'Money', title: 'Roommate?',
    text: 'A friend suggests sharing an apartment to split the rent.', choices: [
      { label: 'Share a place', text: 'You moved in with a roommate and cut your costs in half. The dishes situation was another matter.', effects: { money: 3000, happiness: 1 } },
      { label: 'Keep your own space', text: 'You kept your own place and your own dishes.', effects: { happiness: 2 } },
    ] }),
  ev({ id: 'carDecision', category: 'asset', stages: A, needs: ['car'], cooldown: 6, band: 'Belongings', title: 'Car Trouble',
    text: 'Your car needs a big repair. The mechanic gives you options.', choices: [
      { label: 'Pay for the repair', text: 'You paid for the repair, and the car ran like new. Almost.', effects: { money: -900, happiness: 1 } },
      { label: 'Patch it cheaply', text: 'You went for the cheap patch. It held, mostly.', effects: { money: -250, happiness: -1 } },
      { label: 'Sell it as is', text: 'You sold the car as is and started taking the bus.', effects: { money: 900, happiness: -2 }, then: (state) => { const i = state.assets.findIndex((a) => a.kind === 'car'); if (i >= 0) state.assets.splice(i, 1); } },
    ] }),
  ev({ id: 'lendMoney', category: 'finance', stages: A, needs: ['money'], person: 'friend', cooldown: 6, band: 'Money', title: 'A Loan',
    text: (c) => `${c.whoName} asks to borrow $400 to get through a rough month.`, choices: [
      { label: 'Lend it', text: (c) => `You lent ${c.whoName} the money. It came back, slowly, with a pie.`, effects: { money: -400, closeness: 8, happiness: 2 }, then: (state) => { state.flags.loanOwed = (state.flags.loanOwed || 0) + 400; } },
      { label: 'Offer help instead', text: (c) => `You could not lend the money but helped ${c.whoName} plan a budget.`, effects: { closeness: 2, smarts: 1 } },
      { label: 'Say no', text: (c) => `You said no. ${c.whoName} understood, but things were cooler for a while.`, effects: { closeness: -5 } },
    ] }),
  ev({ id: 'volunteerBoard', category: 'personal', stages: A, minAge: 28, cooldown: 8, band: 'Personal', title: 'Community Board',
    text: 'A neighbor asks you to join the community association board. It means monthly meetings.', choices: [
      { label: 'Join the board', text: 'You joined the community board and spent many evenings arguing about parking.', effects: { happiness: 2, smarts: 2, newFriend: true } },
      { label: 'Decline', text: 'You decided your evenings were already full.', effects: { happiness: 1 } },
    ] }),
  ev({ id: 'bigPurchase', category: 'finance', stages: A, needs: ['rich'], cooldown: 8, band: 'Money', title: 'Splurge or Save',
    text: 'You have more savings than ever. A friend suggests a big trip; a banker suggests leaving it alone.', choices: [
      { label: 'Take the trip', text: 'You took a once-in-a-lifetime trip and regretted nothing.', effects: { money: -5000, happiness: 8 } },
      { label: 'Leave it in savings', text: 'You left the money in savings, and it kept growing quietly.', effects: { money: 1500, happiness: 1 } },
    ] }),
  ev({ id: 'healthWakeup', category: 'health', stages: ['adult', 'middleAge'], needs: ['unfit'], cooldown: 6, band: 'Health', title: 'A Wake-up Call',
    text: 'Your doctor says your health numbers are heading the wrong way and suggests changes.', choices: [
      { label: 'Change your habits', text: 'You changed your diet and started walking every day. It was hard, and it worked.', effects: { health: 8, happiness: 1, looks: 2 } },
      { label: 'Ignore it', text: 'You nodded along at the doctor and changed nothing.', effects: { health: -3 } },
    ] }),
  ev({ id: 'moveCities', category: 'lifeStage', stages: ['youngAdult', 'adult'], minAge: 22, needs: ['notStudent', 'noHome'], once: true, weight: 0.6, band: 'Life', title: 'A Fresh Start',
    text: 'You have been thinking about moving to a new city for a change of scenery.', choices: [
      { label: 'Move', text: 'You packed everything into boxes and moved to a new city. The first month was lonely; the second was exciting.', effects: { happiness: 3, friends: -6, money: -800 } },
      { label: 'Stay', text: 'You decided your life was where your people were.', effects: { happiness: 1, friends: 2 } },
    ] }),
  ev({ id: 'parentNeedsHelp', category: 'family', stages: ['adult', 'middleAge'], person: (c) => c.parents.filter((p) => p.age >= 68), cooldown: 6, band: 'Family', title: 'Helping Out',
    text: (c) => `${c.whoName} is finding daily life harder and could use regular help.`, choices: [
      { label: 'Visit every week', text: (c) => `You started visiting ${c.whoName} every week to help around the house.`, effects: { closeness: 10, happiness: 2, health: -1 } },
      { label: 'Pay for a helper', text: (c) => `You paid for someone to help ${c.whoName} a few days a week.`, effects: { money: -2400, closeness: 5 } },
      { label: 'Do what you can', text: (c) => `You called ${c.whoName} more often and helped when you could.`, effects: { closeness: 2 } },
    ] }),
  ev({ id: 'childSchoolChoice', category: 'family', stages: A, person: (c) => c.children.filter((k) => k.age === 5), cooldown: 1, max: 3, band: 'Family', title: 'First Day of School',
    text: (c) => `${c.whoName} is starting school. Do you take the morning off for the first day?`, choices: [
      { label: 'Take the morning off', text: (c) => `You walked ${c.whoName} to the first day of school and cried a little in the car afterward.`, effects: { closeness: 6, happiness: 3, performance: -1 } },
      { label: 'Work as usual', text: (c) => `${c.whoName} went off to school, and you heard all about it at dinner.`, effects: { closeness: 1 } },
    ] }),
  ev({ id: 'gameNightHost', category: 'hobby', stages: A, needs: ['friends'], cooldown: 5, band: 'Friends', title: 'Game Night',
    text: 'Your friends want to start a regular game night. Someone has to host.', choices: [
      { label: 'Host it', text: 'You hosted game night, and it became the highlight of every month.', effects: { friends: 4, happiness: 4, money: -80 } },
      { label: 'Just show up', text: 'You showed up to game night with snacks and left the hosting to others.', effects: { friends: 2, happiness: 2 } },
    ] }),
  ev({ id: 'petAdoptionAdult', category: 'family', stages: A, needs: ['noPets', 'ownPlace'], once: true, band: 'Family', title: 'A Companion',
    text: 'A friend is fostering a litter of kittens and puppies and asks if you want one.', choices: [
      { label: 'Take a puppy', text: 'You adopted a puppy that chewed one shoe from every pair you own.', effects: { newPet: 'dog', happiness: 4 } },
      { label: 'Take a kitten', text: 'You adopted a kitten that immediately claimed the best chair.', effects: { newPet: 'cat', happiness: 4 } },
      { label: 'Not right now', text: 'You decided this was not the year for a pet.', effects: {} },
    ] }),
  ev({ id: 'weekendPlans', category: 'personal', stages: A, cooldown: 4, weight: 0.8, band: 'Personal', title: 'A Free Weekend',
    text: 'You have a rare completely free weekend.', choices: [
      { label: 'Rest at home', text: 'You spent the weekend at home doing gloriously little.', effects: { health: 2, happiness: 2 } },
      { label: 'Go hiking', text: 'You went hiking and came home with sore legs and a full camera roll.', effects: { health: 3, happiness: 3 } },
      { label: 'Catch up on work', text: 'You caught up on work. Responsible, if a little sad.', effects: { performance: 3, happiness: -2 } },
    ] }),
];
