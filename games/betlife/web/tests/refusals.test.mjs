// Toda recusa precisa FALAR.
//
// O defeito que originou este arquivo: `enrollUniversity`/`enrollTradeSchool` devolviam `false` e o
// handler fazia `if (ok) { ... }` — o jogador clicava num curso e o jogo não dizia absolutamente
// nada. O resto do jogo já seguia a convenção certa (`{ ok, title, text }`), que `report()` mostra
// como toast. Estes testes prendem essa convenção nos caminhos que podem recusar.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import * as People from '../game/people.js';
import * as Activities from '../game/activities.js';
import { simulateTo } from '../game/simulate.js';
import { lifeSummary } from '../game/summary.js';

const relatorio = (r, onde) => {
  assert.ok(r && typeof r === 'object', `${onde}: devolveu ${JSON.stringify(r)} em vez de um relatório`);
  assert.equal(typeof r.ok, 'boolean', `${onde}: sem campo ok`);
  assert.ok(r.title && r.text, `${onde}: recusa sem título/texto — o jogador não saberia o motivo`);
};

test('matrícula na universidade explica cada recusa', () => {
  const crianca = simulateTo(11, 10);
  const r1 = G.enrollUniversity(crianca, 'Biology');
  relatorio(r1, 'criança');
  assert.equal(r1.ok, false);
  assert.match(r1.text, /high school/i);

  const formado = simulateTo(11, 30);
  // garante um estado com diploma e sem matrícula em curso
  formado.education.degree = formado.education.degree || 'Biology';
  formado.education.enrolled = false;
  const r2 = G.enrollUniversity(formado, 'Arts');
  relatorio(r2, 'já formado');
  assert.equal(r2.ok, false);
  assert.match(r2.text, /already have a degree/i);
});

test('matrícula bem-sucedida também devolve relatório, e entra no diário', () => {
  const s = simulateTo(11, 18);
  s.education.highSchoolGraduate = true;
  s.education.enrolled = false;
  s.education.degree = null;
  const antes = s.timeline.length;
  const r = G.enrollUniversity(s, 'Engineering');
  relatorio(r, 'matrícula válida');
  assert.equal(r.ok, true);
  assert.ok(s.timeline.length > antes, 'a matrícula não entrou no diário');
});

test('um diploma não bloqueia o curso técnico (e vice-versa)', () => {
  const s = simulateTo(11, 30);
  s.education.highSchoolGraduate = true;
  s.education.enrolled = false;
  s.education.degree = 'Biology';
  s.education.trade = null;
  const r = G.enrollTradeSchool(s, 'Electrical');
  relatorio(r, 'técnico com diploma');
  assert.equal(r.ok, true, 'ter diploma não pode impedir um curso técnico');
});

test('estar matriculado bloqueia nova matrícula, com motivo', () => {
  const s = simulateTo(11, 18);
  s.education.highSchoolGraduate = true;
  s.education.enrolled = false;
  s.education.degree = null;
  assert.equal(G.enrollUniversity(s, 'Arts').ok, true);
  for (const r of [G.enrollUniversity(s, 'Biology'), G.enrollTradeSchool(s, 'Culinary')]) {
    relatorio(r, 'já matriculado');
    assert.equal(r.ok, false);
    assert.match(r.text, /already enrolled/i);
  }
});

test('interação cara sem dinheiro recusa com motivo, e não cobra nada', () => {
  const s = simulateTo(11, 25);
  const alvo = s.relationships.find((p) => p.alive && p.role !== 'pet');
  s.player.money = 5;
  for (const acao of ['gift', 'movie', 'concert', 'mealOut', 'dateNight']) {
    if (!People.actionsFor(s, alvo).some(([id]) => id === acao)) continue;
    const r = G.interactWith(s, alvo.id, acao);
    relatorio(r, `interação ${acao}`);
    assert.equal(r.ok, false, `${acao} deveria recusar com $5`);
    assert.equal(s.player.money, 5, `${acao} cobrou mesmo recusando`);
  }
});

test('atividade cara sem dinheiro recusa com motivo, e não cobra nada', () => {
  const s = simulateTo(11, 30);
  s.player.money = 5;
  const cara = Activities.findActivity('vacation');
  const r = Activities.perform(s, cara);
  relatorio(r, 'atividade cara');
  assert.equal(r.ok, false);
  assert.equal(s.player.money, 5, 'cobrou mesmo recusando');
});

test('nada funciona depois que a vida acabou, e o jogo diz isso', () => {
  const s = simulateTo(11, 30);
  s.player.alive = false;
  const alvo = s.relationships.find((p) => p.alive && p.role !== 'pet');
  const casos = [G.doActivity(s, 'volunteer')];
  if (alvo) casos.push(G.interactWith(s, alvo.id, 'spendTime'));
  for (const r of casos) { relatorio(r, 'vida encerrada'); assert.equal(r.ok, false); }
});

test('o resumo da vida funciona para quem NUNCA trabalhou', () => {
  // `careerSummary()` devolve null quando não houve nenhum emprego, e a faixa do resumo lia
  // `career.yearsWorked` sem guarda: toda vida sem emprego quebrava a tela final com TypeError.
  const s = simulateTo(11, 40);
  s.career.history.length = 0;
  s.career.careerId = null;
  s.career.yearsWorked = 0;
  s.player.alive = false;
  const r = lifeSummary(s);
  assert.ok(r, 'o resumo não foi produzido');
  const career = r.facts.find(([k]) => k === 'Career');
  assert.equal(career[1], 'Never worked');
  assert.ok(r.ribbon && r.ribbon.label, 'a faixa do resumo não foi produzida');
});

test('o resumo da vida funciona para quem trabalhou a vida toda', () => {
  const s = simulateTo(11, 70);
  s.player.alive = false;
  const r = lifeSummary(s);
  assert.ok(r && r.facts.length > 3);
  assert.ok(r.ribbon && r.ribbon.label);
});
