// Where pets come from: a rescue center, breeders and a pet shop, each with a list that changes
// every year (generated from the seeded RNG so a reload shows the same animals). Original content.
import { between, pick } from './rng.js';
import { PET_NAMES } from './life-generator.js';
import * as People from './people.js';

export const SOURCES = [
  { id: 'rescue', name: 'Harbor Rescue Center', sub: 'Adopt an animal in need', icon: 'paw', minAge: 8, species: ['dog', 'cat', 'rabbit'], fee: [25, 80], ages: [1, 9] },
  { id: 'catBreeder', name: 'Windowsill Cattery', sub: 'Pedigree kittens', icon: 'paw', minAge: 10, species: ['cat'], fee: [250, 600], ages: [0, 1] },
  { id: 'dogBreeder', name: 'Ridgeline Kennels', sub: 'Pedigree puppies', icon: 'paw', minAge: 10, species: ['dog'], fee: [350, 900], ages: [0, 1] },
  { id: 'petShop', name: 'Tiny Paws Pet Shop', sub: 'Small pets and fish', icon: 'bag', minAge: 6, species: ['hamster', 'fish', 'rabbit'], fee: [12, 60], ages: [0, 1] },
];

const BREEDS = {
  dog: ['Harbor Retriever', 'Cliffside Collie', 'Marsh Spaniel', 'Pocket Terrier', 'Ridge Husky', 'Mixed Breed'],
  cat: ['Silver Tabby', 'Moorland Shorthair', 'Lantern Point', 'Tuxedo Cat', 'Mixed Breed'],
  rabbit: ['Lop Ear', 'Dwarf Rabbit', 'Meadow Brown'], hamster: ['Golden Hamster', 'Dwarf Hamster'], fish: ['Goldfish', 'Betta', 'Guppy'],
};

// Deterministic per source and year: mixes the seed, the year and the source into a small RNG.
export function inventory(state, source) {
  let a = (state.seed ^ (state.player.age * 2654435761) ^ hash(source.id)) >>> 0;
  const local = { rngState: a };
  const list = [];
  const count = 4 + Math.floor(rnd(local) * 4);
  for (let i = 0; i < count; i++) {
    const species = source.species[Math.floor(rnd(local) * source.species.length)];
    const breed = BREEDS[species][Math.floor(rnd(local) * BREEDS[species].length)];
    const age = source.ages[0] + Math.floor(rnd(local) * (source.ages[1] - source.ages[0] + 1));
    const fee = Math.round((source.fee[0] + rnd(local) * (source.fee[1] - source.fee[0])) / 5) * 5;
    list.push({ id: `${source.id}-${i}`, name: PET_NAMES[Math.floor(rnd(local) * PET_NAMES.length)], species, breed, age, fee });
  }
  return list;
}

// O nome vem do jogador. `name` vazio cai no nome sugerido do anúncio, porque a adoção não pode
// depender de o campo ter sido preenchido — e porque é esse o nome que ele viu na lista.
export function adopt(state, source, animal, name = null) {
  if (state.player.money < animal.fee) return null;
  const escolhido = cleanName(name) || animal.name;
  return { pet: People.adoptPet(state, animal.species, escolhido, animal.breed, animal.age), fee: animal.fee };
}

export const MAX_PET_NAME = 24;

// Um nome digitado por gente: aceita espaços e acentos, recusa só o que não é nome. Os caracteres
// de controle saem (um \n colado quebraria a linha do diário), os espaços repetidos viram um, e as
// pontas são cortadas — " Mochi " e "Mochi" são o mesmo bicho.
export function cleanName(raw) {
  return String(raw ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** `null` quando o nome serve; 'empty' ou 'long' quando não. Medido em pontos de código, para que
 *  um nome com acentos valha o mesmo que um sem. */
export function nameProblem(raw) {
  const nome = cleanName(raw);
  if (!nome) return 'empty';
  if ([...nome].length > MAX_PET_NAME) return 'long';
  return null;
}

/** Um nome sugerido para a caixa de adoção, sem nome repetido na casa.
 *  Deriva da semente e da idade, NÃO do RNG do jogo: a sugestão é interface, e puxar do RNG aqui
 *  deslocaria toda a sequência da vida só por abrir o cartão. */
export function suggestName(state, species) {
  const usados = new Set(state.relationships.filter((p) => p.role === 'pet' && p.alive !== false).map((p) => p.name));
  const local = { rngState: (state.seed ^ (state.player.age * 2654435761) ^ hash(String(species))) >>> 0 };
  for (let i = 0; i < PET_NAMES.length * 3; i++) {
    const nome = PET_NAMES[Math.floor(rnd(local) * PET_NAMES.length)];
    if (!usados.has(nome)) return nome;
  }
  return PET_NAMES[0];
}

function hash(text) { let h = 0; for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
function rnd(local) {
  local.rngState = (local.rngState + 0x6D2B79F5) >>> 0;
  let t = local.rngState; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
void between; void pick;
