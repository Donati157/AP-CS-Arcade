// Things the player can own: vehicles, homes and possessions. Each has a value that changes
// over time and a condition that wears down, and every asset costs a little each year to keep.
import { between, chance } from './rng.js';
import { changeMoney, changeStat } from './stats.js';
import { addJournal } from './journal.js';

// Shops on the Shopping screen. minAge gates the row; needsLicence applies to cars.
export const SHOPS = [
  { id: 'bikes', name: 'Spoke & Wheel Bicycles', tagline: 'Shop for bicycles', category: 'Bicycles', minAge: 8, items: [
    { id: 'kidsBike', name: 'Sprocket Junior', label: 'Kids Bike', type: 'vehicle', kind: 'bike', cost: 120, upkeep: 0.03 },
    { id: 'roadBike', name: 'Meridian Roadster', label: 'Road Bike', type: 'vehicle', kind: 'bike', cost: 650, upkeep: 0.03 },
    { id: 'eScooter', name: 'Volt Glide', label: 'Electric Scooter', type: 'vehicle', kind: 'bike', cost: 480, upkeep: 0.05, minAge: 14 },
  ] },
  { id: 'usedCars', name: 'Second Chance Motors', tagline: 'Shop for used cars', category: 'Car Dealers', minAge: 16, needsLicence: true, items: [
    { id: 'oldHatch', name: 'Pebble Mini', label: 'Used Hatchback', type: 'vehicle', kind: 'car', cost: 3200, upkeep: 0.12, condition: 45 },
    { id: 'usedSedan', name: 'Harbor Sedan', label: 'Used Sedan', type: 'vehicle', kind: 'car', cost: 7800, upkeep: 0.1, condition: 65 },
    { id: 'usedPickup', name: 'Ridgeback Pickup', label: 'Used Truck', type: 'vehicle', kind: 'car', cost: 11500, upkeep: 0.1, condition: 60 },
    { id: 'usedWagon', name: 'Willow Wagon', label: 'Used Wagon', type: 'vehicle', kind: 'car', cost: 9600, upkeep: 0.1, condition: 62 },
  ] },
  { id: 'newCars', name: 'Meridian Auto Gallery', tagline: 'Shop for new cars', category: 'Car Dealers', minAge: 18, needsLicence: true, items: [
    { id: 'compact', name: 'Pebble City', label: 'New Compact', type: 'vehicle', kind: 'car', cost: 21000, upkeep: 0.07 },
    { id: 'suv', name: 'Ridgeback Family', label: 'New SUV', type: 'vehicle', kind: 'car', cost: 34000, upkeep: 0.07 },
    { id: 'electric', name: 'Volt Horizon', label: 'New Electric Sedan', type: 'vehicle', kind: 'car', cost: 42000, upkeep: 0.05 },
    { id: 'minivan', name: 'Harbor Voyager', label: 'New Minivan', type: 'vehicle', kind: 'car', cost: 31000, upkeep: 0.07 },
    { id: 'sports', name: 'Meridian GT', label: 'New Coupe', type: 'vehicle', kind: 'car', cost: 68000, upkeep: 0.09 },
  ] },
  { id: 'homes', name: 'Harborview Realty', tagline: 'Shop for properties', category: 'Real Estate Brokers', minAge: 18, items: [
    { id: 'mobileHome', name: 'Mobile Home', label: '14 Quiet Meadow Ln', type: 'home', kind: 'home', cost: 38000, upkeep: 0.02 },
    { id: 'studio', name: 'Studio Apartment', label: '702 Ferry St', type: 'home', kind: 'home', cost: 95000, upkeep: 0.015 },
    { id: 'townhouse', name: 'Townhouse', label: '18 Linden Row', type: 'home', kind: 'home', cost: 185000, upkeep: 0.015 },
    { id: 'familyHome', name: 'Craftsman Home', label: '259 Birchfield Blvd', type: 'home', kind: 'home', cost: 320000, upkeep: 0.015 },
    { id: 'lakeCottage', name: 'Lakeside Cottage', label: '3 Heron Point', type: 'home', kind: 'home', cost: 450000, upkeep: 0.02 },
  ] },
  { id: 'electronics', name: 'Circuit Harbor Electronics', tagline: 'Shop for gadgets', category: 'Electronics', minAge: 10, items: [
    { id: 'console', name: 'Nimbus Console', label: 'Game Console', type: 'possession', kind: 'gadget', cost: 400, upkeep: 0, happiness: 3 },
    { id: 'laptop', name: 'Slate Laptop', label: 'Laptop', type: 'possession', kind: 'gadget', cost: 1100, upkeep: 0, smarts: 1 },
    { id: 'camera', name: 'Lumen Camera', label: 'Camera', type: 'possession', kind: 'gadget', cost: 750, upkeep: 0, happiness: 2 },
  ] },
  { id: 'music', name: 'Clef & Fret Music', tagline: 'Shop for instruments', category: 'Music Stores', minAge: 6, items: [
    { id: 'ukulele', name: 'Ukulele', label: 'Instrument', type: 'possession', kind: 'instrument', cost: 60, upkeep: 0, happiness: 2 },
    { id: 'guitar', name: 'Acoustic Guitar', label: 'Instrument', type: 'possession', kind: 'instrument', cost: 240, upkeep: 0, happiness: 2 },
    { id: 'violin', name: 'Violin', label: 'Instrument', type: 'possession', kind: 'instrument', cost: 310, upkeep: 0, happiness: 2 },
    { id: 'keyboard', name: 'Digital Piano', label: 'Instrument', type: 'possession', kind: 'instrument', cost: 520, upkeep: 0, happiness: 2 },
    { id: 'drums', name: 'Drum Kit', label: 'Instrument', type: 'possession', kind: 'instrument', cost: 680, upkeep: 0, happiness: 3 },
  ] },
  { id: 'jewelry', name: 'Northstar Jewelers', tagline: 'Shop for jewelry', category: 'Jewelers', minAge: 18, items: [
    { id: 'watch', name: 'Silver Watch', label: '0.1ct', type: 'possession', kind: 'jewelry', cost: 900, upkeep: 0, looks: 2 },
    { id: 'necklace', name: 'Gold Necklace', label: '0.4ct', type: 'possession', kind: 'jewelry', cost: 2400, upkeep: 0, looks: 3 },
    { id: 'ring', name: 'Diamond Ring', label: '0.8ct', type: 'possession', kind: 'jewelry', cost: 6500, upkeep: 0, looks: 4 },
  ] },
  { id: 'costumeJewelry', name: 'Tinsel & Twine', tagline: 'Shop for costume jewelry', category: 'Jewelers', minAge: 12, items: [
    { id: 'beadBracelet', name: 'Bead Bracelet', label: 'Costume', type: 'possession', kind: 'jewelry', cost: 18, upkeep: 0, looks: 1 },
    { id: 'glassPendant', name: 'Glass Pendant', label: 'Costume', type: 'possession', kind: 'jewelry', cost: 27, upkeep: 0, looks: 1 },
  ] },
];

export function findShop(id) { return SHOPS.find((s) => s.id === id) || null; }
export function findItem(id) {
  for (const shop of SHOPS) for (const item of shop.items) if (item.id === id) return item;
  return null;
}

export const vehicles = (state) => state.assets.filter((a) => a.type === 'vehicle');
export const homes = (state) => state.assets.filter((a) => a.type === 'home');
export const possessions = (state) => state.assets.filter((a) => a.type === 'possession');
export const ownsCar = (state) => state.assets.some((a) => a.kind === 'car');
export const ownsHome = (state) => homes(state).length > 0;
export const ownsKind = (state, kind) => state.assets.some((a) => a.kind === kind);
export const assetsValue = (state) => state.assets.reduce((sum, a) => sum + a.value, 0);
export const findAsset = (state, id) => state.assets.find((a) => a.id === id) || null;

// Returns 'ok' | 'tooYoung' | 'noLicence' | 'noMoney' | 'owned'.
export function canBuy(state, shop, item) {
  const age = state.player.age;
  if (age < shop.minAge || (item.minAge && age < item.minAge)) return 'tooYoung';
  if (shop.needsLicence && !state.player.hasLicence) return 'noLicence';
  if (state.assets.some((a) => a.itemId === item.id)) return 'owned';
  if (state.player.money < item.cost) return 'noMoney';
  return 'ok';
}

export function buy(state, shop, item) {
  const verdict = canBuy(state, shop, item);
  if (verdict !== 'ok') return verdict;
  changeMoney(state, -item.cost, `bought ${item.name}`);
  const asset = { id: `a${state.nextAssetId++}`, itemId: item.id, name: item.name, label: item.label || '', type: item.type, kind: item.kind, value: item.cost,
    condition: item.condition ?? 100, upkeep: item.upkeep, boughtAt: state.player.age, cost: item.cost };
  state.assets.push(asset);
  if (item.happiness) changeStat(state, 'happiness', item.happiness, `bought ${item.name}`);
  if (item.smarts) changeStat(state, 'smarts', item.smarts, `bought ${item.name}`);
  if (item.looks) changeStat(state, 'looks', item.looks, `bought ${item.name}`);
  if (item.type === 'home') {
    state.player.livesWithParents = false;
    addJournal(state, `You bought a ${item.name.toLowerCase()} for $${item.cost.toLocaleString('en-US')} and moved in.`, 'milestone');
  } else {
    addJournal(state, `You bought a ${item.name.toLowerCase()} for $${item.cost.toLocaleString('en-US')}.`, 'positive');
  }
  return 'ok';
}

export function sell(state, asset) {
  const price = Math.round(asset.value * (asset.type === 'home' ? 0.95 : 0.85) * (0.6 + asset.condition / 250));
  changeMoney(state, price, `sold ${asset.name}`);
  state.assets = state.assets.filter((a) => a.id !== asset.id);
  addJournal(state, `You sold your ${asset.name.toLowerCase()} for $${price.toLocaleString('en-US')}.`);
  return price;
}

// Owner actions beyond repair and sell. Each returns journal text, or null when unaffordable.
export function drive(state, asset) {
  changeStat(state, 'happiness', 3, `drove the ${asset.name}`);
  asset.condition = Math.max(0, asset.condition - 2);
  return `You took the ${asset.name.toLowerCase()} out for a long drive with the windows down.`;
}

export function maintenance(state, asset) {
  const cost = Math.max(40, Math.round(asset.value * 0.02 / 10) * 10);
  if (state.player.money < cost) return null;
  changeMoney(state, -cost, `maintenance for ${asset.name}`);
  asset.condition = Math.min(100, asset.condition + 15);
  return `You had the ${asset.name.toLowerCase()} serviced for $${cost.toLocaleString('en-US')}.`;
}

export function scrap(state, asset) {
  const money = Math.round(asset.value * 0.1);
  changeMoney(state, money, `scrapped ${asset.name}`);
  state.assets = state.assets.filter((a) => a.id !== asset.id);
  return `You scrapped the ${asset.name.toLowerCase()} for $${money.toLocaleString('en-US')} in parts.`;
}

export function gift(state, asset, person) {
  state.assets = state.assets.filter((a) => a.id !== asset.id);
  person.closeness = Math.min(100, person.closeness + 12);
  person.interactedThisYear = true;
  changeStat(state, 'happiness', 3, `gave ${asset.name} away`);
  return `You gave your ${asset.name.toLowerCase()} to ${person.name.split(' ')[0]}, who could not stop smiling.`;
}

export function renovate(state, asset) {
  const cost = Math.round(asset.value * 0.06 / 100) * 100;
  if (state.player.money < cost) return null;
  changeMoney(state, -cost, `renovated ${asset.name}`);
  asset.value = Math.round(asset.value * 1.08);
  asset.condition = 100;
  changeStat(state, 'happiness', 3, 'renovation');
  return `You renovated the ${asset.name.toLowerCase()} for $${cost.toLocaleString('en-US')}. It is worth more now.`;
}

export function repairCost(asset) {
  return Math.max(50, Math.round(asset.value * (100 - asset.condition) / 100 * 0.35 / 10) * 10);
}

export function repair(state, asset) {
  const cost = repairCost(asset);
  if (state.player.money < cost) return false;
  changeMoney(state, -cost, `repaired ${asset.name}`);
  asset.condition = 100;
  asset.brokenDown = false;
  addJournal(state, `You had your ${asset.name.toLowerCase()} repaired for $${cost.toLocaleString('en-US')}.`);
  return true;
}

// Yearly wear and value changes. Returns the total upkeep cost for the year.
export function processAssetsYear(state) {
  let upkeep = 0;
  for (const a of state.assets) {
    upkeep += Math.round(a.value * a.upkeep);
    if (a.type === 'home') a.value = Math.round(a.value * (1 + between(state, 1, 4) / 100));
    else if (a.type === 'vehicle') { a.value = Math.round(a.value * 0.88); a.condition = Math.max(0, a.condition - between(state, 5, 11)); }
    else a.value = Math.round(a.value * 0.85);
    // A worn-out car breaks down once; the journal does not nag every year until it is repaired.
    if (a.kind === 'car' && a.condition < 25 && !a.brokenDown && chance(state, 0.6)) {
      a.brokenDown = true;
      addJournal(state, `Your ${a.name.toLowerCase()} broke down and needs repairs.`, 'negative');
      changeStat(state, 'happiness', -3, 'car trouble');
    }
  }
  return upkeep;
}
