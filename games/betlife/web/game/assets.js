// Things the player can own: vehicles, homes and possessions. Each has a value that changes
// over time and a condition that wears down, and every asset costs a little each year to keep.
import { between, chance } from './rng.js';
import { changeMoney, changeStat } from './stats.js';
import { addJournal } from './journal.js';

// Shops on the Shopping screen. minAge gates the row; needsLicence applies to cars.
export const SHOPS = [
  { id: 'bikes', name: 'Spoke & Wheel Bicycles', tagline: 'Bikes and scooters', minAge: 8, items: [
    { id: 'kidsBike', name: 'Kids Bike', type: 'vehicle', kind: 'bike', cost: 120, upkeep: 0.03 },
    { id: 'roadBike', name: 'Road Bike', type: 'vehicle', kind: 'bike', cost: 650, upkeep: 0.03 },
    { id: 'eScooter', name: 'Electric Scooter', type: 'vehicle', kind: 'bike', cost: 480, upkeep: 0.05, minAge: 14 },
  ] },
  { id: 'usedCars', name: 'Second Chance Motors', tagline: 'Used cars', minAge: 16, needsLicence: true, items: [
    { id: 'oldHatch', name: '12-year-old Hatchback', type: 'vehicle', kind: 'car', cost: 3200, upkeep: 0.12, condition: 45 },
    { id: 'usedSedan', name: 'Used Sedan', type: 'vehicle', kind: 'car', cost: 7800, upkeep: 0.1, condition: 65 },
    { id: 'usedPickup', name: 'Used Pickup Truck', type: 'vehicle', kind: 'car', cost: 11500, upkeep: 0.1, condition: 60 },
  ] },
  { id: 'newCars', name: 'Meridian Auto Gallery', tagline: 'New cars', minAge: 18, needsLicence: true, items: [
    { id: 'compact', name: 'Compact Car', type: 'vehicle', kind: 'car', cost: 21000, upkeep: 0.07 },
    { id: 'suv', name: 'Family SUV', type: 'vehicle', kind: 'car', cost: 34000, upkeep: 0.07 },
    { id: 'electric', name: 'Electric Sedan', type: 'vehicle', kind: 'car', cost: 42000, upkeep: 0.05 },
    { id: 'sports', name: 'Sports Coupe', type: 'vehicle', kind: 'car', cost: 68000, upkeep: 0.09 },
  ] },
  { id: 'homes', name: 'Harborview Realty', tagline: 'Apartments and houses', minAge: 18, items: [
    { id: 'studio', name: 'Studio Apartment', type: 'home', kind: 'home', cost: 95000, upkeep: 0.015 },
    { id: 'townhouse', name: 'Townhouse', type: 'home', kind: 'home', cost: 185000, upkeep: 0.015 },
    { id: 'familyHome', name: 'Family Home', type: 'home', kind: 'home', cost: 320000, upkeep: 0.015 },
    { id: 'lakeCottage', name: 'Lakeside Cottage', type: 'home', kind: 'home', cost: 450000, upkeep: 0.02 },
  ] },
  { id: 'electronics', name: 'Circuit City Electronics', tagline: 'Gadgets and games', minAge: 10, items: [
    { id: 'console', name: 'Game Console', type: 'possession', kind: 'gadget', cost: 400, upkeep: 0, happiness: 3 },
    { id: 'laptop', name: 'Laptop', type: 'possession', kind: 'gadget', cost: 1100, upkeep: 0, smarts: 1 },
    { id: 'camera', name: 'Camera', type: 'possession', kind: 'gadget', cost: 750, upkeep: 0, happiness: 2 },
  ] },
  { id: 'music', name: 'Clef & Fret Music', tagline: 'Instruments', minAge: 6, items: [
    { id: 'ukulele', name: 'Ukulele', type: 'possession', kind: 'instrument', cost: 60, upkeep: 0, happiness: 2 },
    { id: 'guitar', name: 'Acoustic Guitar', type: 'possession', kind: 'instrument', cost: 240, upkeep: 0, happiness: 2 },
    { id: 'keyboard', name: 'Digital Piano', type: 'possession', kind: 'instrument', cost: 520, upkeep: 0, happiness: 2 },
    { id: 'drums', name: 'Drum Kit', type: 'possession', kind: 'instrument', cost: 680, upkeep: 0, happiness: 3 },
  ] },
  { id: 'jewelry', name: 'Northstar Jewelers', tagline: 'Fine jewelry', minAge: 18, items: [
    { id: 'watch', name: 'Silver Watch', type: 'possession', kind: 'jewelry', cost: 900, upkeep: 0, looks: 2 },
    { id: 'necklace', name: 'Gold Necklace', type: 'possession', kind: 'jewelry', cost: 2400, upkeep: 0, looks: 3 },
    { id: 'ring', name: 'Diamond Ring', type: 'possession', kind: 'jewelry', cost: 6500, upkeep: 0, looks: 4 },
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
  const asset = { id: `a${state.nextAssetId++}`, itemId: item.id, name: item.name, type: item.type, kind: item.kind, value: item.cost,
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

export function repairCost(asset) {
  return Math.max(50, Math.round(asset.value * (100 - asset.condition) / 100 * 0.35 / 10) * 10);
}

export function repair(state, asset) {
  const cost = repairCost(asset);
  if (state.player.money < cost) return false;
  changeMoney(state, -cost, `repaired ${asset.name}`);
  asset.condition = 100;
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
    if (a.kind === 'car' && a.condition < 25 && chance(state, 0.5)) {
      addJournal(state, `Your ${a.name.toLowerCase()} broke down and needs repairs.`, 'negative');
      changeStat(state, 'happiness', -3, 'car trouble');
    }
  }
  return upkeep;
}
