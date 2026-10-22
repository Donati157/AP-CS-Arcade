// A vida de quem só aperta +Idade também precisa fechar a conta.
//
// Dois defeitos mediados aqui, os dois encontrados por vidas inteiras jogadas no navegador:
//
//  1. NENHUM caminho do jogo contratava ninguém. Toda contratação exigia abrir o quadro de vagas e
//     se candidatar. Um jogador que só envelhecia terminava a vida sem nunca trabalhar — 0 de 40.
//  2. Aos 22 o jogo mandava todo mundo sair da casa dos pais por não estar estudando, inclusive
//     quem não tinha emprego: $9.000 de aluguel contra renda zero, com 5% de juros compostos,
//     sem piso. A dívida chegava a −$878 mil aos 60, irrecuperável e sem aviso.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game/game-state.js';
import * as Career from '../game/career.js';
import * as Economy from '../game/economy.js';
import { simulateLife, simulateTo } from '../game/simulate.js';
import * as Activities from '../game/activities.js';

// Um jogador passivo: envelhece e responde sempre a primeira opção. Nada mais.
function vidaPassiva(seed, ate = 100) {
  const st = G.createNewGame({}, seed);
  let guarda = 0;
  while (st.player.alive && st.player.age < ate && guarda++ < 220) {
    while (st.pending.length) G.answerModal(st, 0);
    if (!G.ageUp(st)) break;
  }
  while (st.pending.length) G.answerModal(st, 0);
  return st;
}

const empregouAlgumaVez = (st) => !!st.career && (st.career.yearsWorked > 0 || st.career.history.length > 0);
const mediana = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

test('o jogo oferece emprego a quem só envelhece — a maioria das vidas passivas trabalha', () => {
  const vidas = [];
  for (let s = 1; s <= 30; s++) vidas.push(vidaPassiva(s));
  const empregadas = vidas.filter(empregouAlgumaVez).length;
  assert.ok(empregadas >= 18, `só ${empregadas} de 30 vidas passivas tiveram emprego`);
});

test('a oferta de emprego só aparece quando há vaga que o personagem qualifica', () => {
  const st = vidaPassiva(4, 12);              // criança: nada qualifica, e nem é adulto
  assert.equal(G.offeredJob(st), null, 'ofereceu emprego a uma criança');
  const adulto = vidaPassiva(4, 30);
  if (Career.isEmployed(adulto.career)) {
    assert.equal(G.offeredJob(adulto), null, 'ofereceu emprego a quem já está empregado');
  } else {
    const vaga = G.offeredJob(adulto);
    if (vaga) assert.ok(Career.isEligible(adulto, vaga), 'ofereceu uma vaga para a qual não qualifica');
  }
});

test('ninguém sai da casa dos pais sem emprego nem reserva', () => {
  for (let s = 1; s <= 25; s++) {
    const st = vidaPassiva(s, 24);
    if (st.player.livesWithParents || !st.player.alive) continue;
    const podia = Career.isEmployed(st.career) || st.player.money >= Economy.RENT || !!st.education.degree || st.assets.some((a) => a.type === 'home');
    assert.ok(podia, `seed ${s}: saiu de casa aos ${st.player.age} sem emprego e com $${st.player.money}`);
  }
});

test('a dívida de uma vida passiva fica em ordem de grandeza plausível', () => {
  const saldos = [];
  for (let s = 1; s <= 30; s++) saldos.push(vidaPassiva(s).player.money);
  const med = mediana(saldos);
  // Antes das correções a mediana era −$2,09 milhões. O teto aqui é folgado de propósito: prende a
  // ordem de grandeza, não um número exato que o balanceamento possa mexer depois.
  assert.ok(med > -400000, `mediana de saldo final $${med} — a espiral de dívida voltou`);
});

test('quem joga ativamente continua terminando com patrimônio', () => {
  const saldos = [];
  for (let s = 1; s <= 25; s++) saldos.push(simulateLife(s).state.player.money);
  assert.ok(mediana(saldos) > 100000, `mediana $${mediana(saldos)} — a correção prejudicou a vida ativa`);
});

test('o custo de vida é zero enquanto se mora com os pais', () => {
  const st = vidaPassiva(2, 20);
  if (st.player.livesWithParents) assert.equal(Economy.livingCost(st), 0);
});

test('repetir a mesma ação no mesmo ano rende cada vez menos', () => {
  // §5: "Uma ação não pode conceder a mesma recompensa repetidamente por acidente."
  const st = simulateTo(9, 25);
  st.player.happiness = 40; st.player.smarts = 40;
  const atividade = Activities.findActivity('volunteer');
  const ganhos = [];
  for (let i = 0; i < 4; i++) {
    const antes = st.player.happiness;
    const r = Activities.perform(st, atividade);
    assert.ok(r && typeof r.ok === 'boolean', 'a atividade não devolveu relatório');
    ganhos.push(st.player.happiness - antes);
  }
  assert.ok(ganhos[0] > 0, `a primeira vez não rendeu nada: ${ganhos.join(',')}`);
  assert.ok(ganhos[3] < ganhos[0], `a 4ª repetição rendeu o mesmo que a 1ª: ${ganhos.join(',')}`);
});

test('repetir a mesma interação com a mesma pessoa também decai', () => {
  const st = simulateTo(9, 25);
  const alvo = st.relationships.find((p) => p.alive && p.role !== 'pet');
  const ganhos = [];
  for (let i = 0; i < 4; i++) {
    const antes = alvo.closeness;
    G.interactWith(st, alvo.id, 'spendTime');
    ganhos.push(alvo.closeness - antes);
  }
  assert.ok(ganhos[0] > 0, `a primeira vez não aproximou: ${ganhos.join(',')}`);
  assert.ok(ganhos[3] < ganhos[0], `a 4ª repetição aproximou o mesmo que a 1ª: ${ganhos.join(',')}`);
});

test('o ano novo devolve o rendimento cheio — o decaimento não é permanente', () => {
  const st = simulateTo(9, 25);
  st.player.happiness = 40;
  const atividade = Activities.findActivity('volunteer');
  for (let i = 0; i < 3; i++) Activities.perform(st, atividade);
  const gastoAntes = st.player.happiness;
  Activities.perform(st, atividade);
  const quartaVez = st.player.happiness - gastoAntes;
  while (st.pending.length) G.answerModal(st, 0);
  G.ageUp(st);
  while (st.pending.length) G.answerModal(st, 0);
  st.player.happiness = 40;
  const antes = st.player.happiness;
  Activities.perform(st, atividade);
  assert.ok(st.player.happiness - antes > quartaVez, 'o ano novo não restaurou o rendimento da atividade');
});
