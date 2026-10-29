// Person cards that ask for an answer: a new friend or a love interest, accepted or turned away.
import { t } from '../i18n/index.js';
import { ev } from './define.js';

const him = (c) => (c.who && c.who.gender === 'female' ? 'her' : 'him');

export const PEOPLE_EVENTS = [
  ev({ id: 'friendRequest', category: 'friendship', weight: 0, band: 'Friend', title: 'New Friend', text: '',
    choices: [
      { label: (c) => t('Become friends with {them}', { them: t(him(c)) }), text: (c) => t('You became friends with {whoName}.', { _g: c.meuGenero, whoName: c.who ? c.who.name : 'someone new' }), kind: 'positive', effects: { happiness: 2 } },
      { label: (c) => t('Reject {them}', { them: t(him(c)) }), text: (c) => t('You turned {whoName} down. {whoName} kept {theirs} distance after that.', { whoName: c.whoName, _g: c.who && c.who.gender, theirs: t(him(c) === 'him' ? 'his' : 'her') }), effects: { rejectPerson: true } },
    ] }),
  ev({ id: 'loveRequest', category: 'relationship', weight: 0, band: 'Love', title: 'Love Interest', text: '',
    choices: [
      { label: (c) => t('Start going out with {them}', { them: t(him(c)) }), text: (c) => t('You started going out with {whoName}.', { whoName: c.who ? c.who.name : 'someone' }), kind: 'positive', effects: { happiness: 4 } },
      { label: (c) => t('Reject {them}', { them: t(him(c)) }), text: (c) => t('You let {whoName} down gently.', { whoName: c.whoName, _g: c.who && c.who.gender }), effects: { rejectPerson: true } },
    ] }),
];
