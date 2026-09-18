// Person cards that ask for an answer: a new friend or a love interest, accepted or turned away.
import { ev } from './define.js';

const him = (c) => (c.who && c.who.gender === 'female' ? 'her' : 'him');

export const PEOPLE_EVENTS = [
  ev({ id: 'friendRequest', category: 'friendship', weight: 0, band: 'Friend', title: 'New Friend', text: '',
    choices: [
      { label: (c) => `Become friends with ${him(c)}`, text: (c) => `You became friends with ${c.who ? c.who.name : 'someone new'}.`, kind: 'positive', effects: { happiness: 2 } },
      { label: (c) => `Reject ${him(c)}`, text: (c) => `You turned ${c.whoName} down. ${c.whoName} kept ${him(c) === 'him' ? 'his' : 'her'} distance after that.`, effects: { rejectPerson: true } },
    ] }),
  ev({ id: 'loveRequest', category: 'relationship', weight: 0, band: 'Love', title: 'Love Interest', text: '',
    choices: [
      { label: (c) => `Start going out with ${him(c)}`, text: (c) => `You started going out with ${c.who ? c.who.name : 'someone'}.`, kind: 'positive', effects: { happiness: 4 } },
      { label: (c) => `Reject ${him(c)}`, text: (c) => `You let ${c.whoName} down gently.`, effects: { rejectPerson: true } },
    ] }),
];
