// Helpers for writing events. Every event is plain data plus small text functions.
//
//   ev({ id, category, stages, minAge, maxAge, needs, person, weight, cooldown, max, once,
//        family, band, title, text, effects, kind, choices })
//
// stages   life stages where it can happen (default: any)        e.g. ['child', 'preteen']
// needs    conditions from the player's life (all must hold)     e.g. ['employed', 'friends']
// person   who the event is about; picked at random from that group and available as c.who
// weight   relative chance inside its category (default 1)
// cooldown years before the same event can repeat (default 6)
// max      how many times it can happen in a life (default unlimited); once = true means 1
// family   events in the same family share a cooldown so near-duplicates do not appear back to back
// text     a string or a function (c) => string; c is the life context (see engine.js)
// effects  { happiness, health, smarts, looks, money, performance, closeness, family, friends,
//            newFriend, newCoworker, newSibling, newPartner, newChild, newPet }
// choices  turns the event into a decision: [{ label, text, effects, when, followUp }]

export function ev(def) {
  if (!def.id) throw new Error('event without id');
  return {
    stages: null, minAge: 0, maxAge: 999, needs: [], person: null, weight: 1, cooldown: 6, max: Infinity,
    family: null, band: null, title: null, effects: null, kind: 'normal', choices: null, ...def,
    once: def.once || false,
  };
}

export const CATEGORY_LABELS = {
  family: 'Family', friendship: 'Friends', education: 'School', career: 'Work', finance: 'Money', personal: 'Personal',
  hobby: 'Hobbies', asset: 'Belongings', health: 'Health', relationship: 'Love', lifeStage: 'Life', rare: 'Surprise',
};
