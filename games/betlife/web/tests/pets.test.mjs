// O nome do bicho é escolhido pelo jogador — e o que este arquivo guarda é o que pode dar errado
// nisso sem aparecer na tela: o nome chegar ao animal, o dinheiro sair uma única vez, cancelar não
// deixar rastro, e o nome sobreviver a um save.
//
// A interface (o cartão, o campo, o botão desabilitado) está em `tests/pets-flow.mjs`, no WebKit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import * as Pets from '../game/pets.js';
import * as People from '../game/people.js';
import { setLanguage } from '../game/i18n/index.js';

setLanguage('en');

// Uma vida com idade e dinheiro para adotar em qualquer lugar.
function vida(seed = 4242, idade = 30) {
  const s = G.createNewGame({}, seed);
  while (s.player.age < idade) { s.pending.length = 0; G.ageUp(s); }
  s.pending.length = 0;
  s.player.money = 50000;
  return s;
}
const bichos = (s) => People.pets(s).map((p) => p.name);
const digital = (s) => JSON.stringify([s.player.money, s.player.happiness, s.relationships.length, s.timeline.length, s.flags.adoptedFrom || []]);

test('cleanName keeps a human name and drops what is not one', () => {
  assert.equal(Pets.cleanName('  Mochi  '), 'Mochi');
  assert.equal(Pets.cleanName('Dona  Flor'), 'Dona Flor', 'espaço repetido vira um');
  assert.equal(Pets.cleanName('Açucena'), 'Açucena', 'acento fica');
  assert.equal(Pets.cleanName('Rex\nLinha 2'), 'Rex Linha 2', 'quebra de linha não entra no diário');
  assert.equal(Pets.cleanName(''), '');
  assert.equal(Pets.cleanName(null), '');
});

test('nameProblem refuses an empty name and a name that does not fit', () => {
  assert.equal(Pets.nameProblem(''), 'empty');
  assert.equal(Pets.nameProblem('   '), 'empty', 'só espaço é nome vazio');
  assert.equal(Pets.nameProblem('Mochi'), null);
  assert.equal(Pets.nameProblem('A'.repeat(Pets.MAX_PET_NAME)), null, 'o limite ainda cabe');
  assert.equal(Pets.nameProblem('A'.repeat(Pets.MAX_PET_NAME + 1)), 'long');
  // Acento conta como UMA letra: medir em bytes faria 'Açucenazinha…' valer mais que a de ASCII.
  assert.equal(Pets.nameProblem('Ç'.repeat(Pets.MAX_PET_NAME)), null);
});

test('the suggested name does not move the game forward', () => {
  const s = vida();
  const antes = s.rngState;
  const a = Pets.suggestName(s, 'dog');
  const b = Pets.suggestName(s, 'dog');
  assert.equal(s.rngState, antes, 'sugerir um nome não pode consumir o RNG da vida');
  assert.equal(a, b, 'a mesma situação sugere o mesmo nome');
  assert.ok(a && a.length > 1);
});

test('the suggested name avoids a name already in the house', () => {
  const s = vida();
  const primeiro = Pets.suggestName(s, 'dog');
  People.adoptPet(s, 'dog', primeiro);
  assert.notEqual(Pets.suggestName(s, 'dog'), primeiro);
});

test('adopting from a shop uses the name the player typed', () => {
  const s = vida();
  const fonte = Pets.SOURCES.find((x) => x.id === 'rescue');
  const animal = Pets.inventory(s, fonte)[0];
  const dinheiro = s.player.money;
  const r = G.adoptFromSource(s, fonte.id, animal.id, '  Dona Flor  ');
  assert.equal(r.ok, true, r.text);
  assert.ok(bichos(s).includes('Dona Flor'), bichos(s).join(', '));
  assert.ok(!bichos(s).includes(animal.name) || animal.name === 'Dona Flor', 'o nome do anúncio não fica');
  assert.equal(s.player.money, dinheiro - animal.fee, 'a taxa sai uma vez');
  const linha = s.timeline[s.timeline.length - 1].text;
  assert.ok(linha.includes('Dona Flor'), linha);
});

test('an empty name falls back to the one on the listing', () => {
  const s = vida();
  const fonte = Pets.SOURCES.find((x) => x.id === 'petShop');
  const animal = Pets.inventory(s, fonte)[0];
  G.adoptFromSource(s, fonte.id, animal.id, '   ');
  assert.ok(bichos(s).includes(animal.name), bichos(s).join(', '));
});

test('the same animal cannot be adopted twice', () => {
  const s = vida();
  const fonte = Pets.SOURCES.find((x) => x.id === 'rescue');
  const animal = Pets.inventory(s, fonte)[0];
  G.adoptFromSource(s, fonte.id, animal.id, 'Pipoca');
  const dinheiro = s.player.money;
  const quantos = People.pets(s).length;
  const r = G.adoptFromSource(s, fonte.id, animal.id, 'Pipoca de novo');
  assert.equal(r.ok, false, 'o segundo clique não adota de novo');
  assert.equal(s.player.money, dinheiro, 'e não cobra de novo');
  assert.equal(People.pets(s).length, quantos);
});

test('not confirming leaves the life exactly as it was', () => {
  const s = vida();
  const fonte = Pets.SOURCES.find((x) => x.id === 'dogBreeder');
  const antes = digital(s);
  // Cancelar, do lado do jogo, é simplesmente não chamar nada: abrir a lista e ler o anúncio não
  // muda estado nenhum. É isto que o teste fixa — que o preço da adoção não é cobrado antes dela.
  Pets.inventory(s, fonte);
  Pets.suggestName(s, 'dog');
  assert.equal(digital(s), antes);
});

test('adopting through the activity list uses the typed name too', () => {
  const s = vida();
  const r = G.doActivity(s, 'adopt_cat', { petName: 'Sete Vidas' });
  assert.equal(r.ok !== false, true, r.text);
  assert.ok(bichos(s).includes('Sete Vidas'), bichos(s).join(', '));
  assert.ok(s.timeline.some((e) => e.text.includes('Sete Vidas')), 'o diário conta o nome escolhido');
});

test('the chosen name survives a save and load', async () => {
  const { restoreState } = await import('../game/save.js');
  const s = vida();
  G.doActivity(s, 'adopt_dog', { petName: 'Café com Leite' });
  const copia = restoreState(JSON.parse(JSON.stringify(s)));
  assert.ok(People.pets(copia).some((p) => p.name === 'Café com Leite'), People.pets(copia).map((p) => p.name).join(', '));
});

test('the pet keeps its name for the rest of its life', () => {
  const s = vida(99, 25);
  G.doActivity(s, 'adopt_dog', { petName: 'Juliette' });
  for (let i = 0; i < 8 && s.player.alive; i++) { s.pending.length = 0; G.ageUp(s); }
  const pet = s.relationships.find((p) => p.role === 'pet' && p.name === 'Juliette');
  assert.ok(pet, People.pets(s).map((p) => p.name).join(', '));
});
