// A formatação de dinheiro: convenção do idioma, valor intacto.
//
// A invariante que mais importa aqui é a última: trocar de idioma muda a CADEIA EXIBIDA e nada
// mais. O jogo guarda dólares inteiros, e é isso que mantém uma vida salva em inglês abrindo em
// português com o mesmo patrimônio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setLanguage, dinheiro, numero } from '../game/i18n/index.js';
import { createNewGame } from '../game/game-state.js';
import { simulateTo } from '../game/simulate.js';

test('English keeps the format it always had', () => {
  setLanguage('en');
  assert.equal(dinheiro(190337), '$190,337');
  assert.equal(dinheiro(0), '$0');
  assert.equal(dinheiro(-500), '-$500');
  assert.equal(dinheiro(1551718), '$1,551,718');
  assert.equal(dinheiro(999), '$999');
  assert.equal(dinheiro(1000), '$1,000');
});

test('Portuguese writes the dollar the Brazilian way', () => {
  setLanguage('pt');
  // US$ porque a moeda do jogo é o dólar americano: formatar não é converter.
  assert.equal(dinheiro(190337), 'US$ 190.337,00');
  assert.equal(dinheiro(0), 'US$ 0,00');
  assert.equal(dinheiro(-500), '-US$ 500,00');
  assert.equal(dinheiro(1551718), 'US$ 1.551.718,00');
  assert.equal(dinheiro(999), 'US$ 999,00');
  assert.equal(dinheiro(1000), 'US$ 1.000,00');
});

test('plain numbers use the thousands separator of the language', () => {
  setLanguage('en');
  assert.equal(numero(12400), '12,400');
  setLanguage('pt');
  assert.equal(numero(12400), '12.400');
});

test('rounding is to the whole dollar, in both languages', () => {
  setLanguage('en');
  assert.equal(dinheiro(1234.49), '$1,234');
  assert.equal(dinheiro(1234.51), '$1,235');
  setLanguage('pt');
  assert.equal(dinheiro(1234.49), 'US$ 1.234,00');
  assert.equal(dinheiro(1234.51), 'US$ 1.235,00');
});

test('switching language does not change a single stored value', () => {
  setLanguage('en');
  const a = simulateTo(4242, 45);
  setLanguage('pt');
  const b = simulateTo(4242, 45);
  // Mesma semente, mesma vida: a troca de idioma não pode mexer em nada que o jogo guarda.
  assert.equal(a.player.money, b.player.money, 'dinheiro do jogador');
  assert.equal(a.career.salary, b.career.salary, 'salário');
  assert.equal(a.assets.reduce((s, x) => s + x.value, 0), b.assets.reduce((s, x) => s + x.value, 0), 'valor dos bens');
  assert.equal(a.player.age, b.player.age, 'idade');
  assert.equal(a.timeline.length, b.timeline.length, 'tamanho do diário');
  assert.equal(typeof a.player.money, 'number', 'dinheiro continua número, não cadeia formatada');
});

test('a new game stores numbers, never formatted strings', () => {
  setLanguage('pt');
  const s = createNewGame({}, 777);
  assert.equal(typeof s.player.money, 'number');
  assert.equal(typeof s.career.salary, 'number');
  for (const a of s.assets) assert.equal(typeof a.value, 'number');
});
