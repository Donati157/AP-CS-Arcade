// O sorteio: as duas apresentações.
//
// DUAS, porque uma moeda só sabe decidir entre duas coisas. Com duas opções é a moeda — cara e
// coroa, que é exatamente o que o link prometeu ao jogador. Com três ou mais a moeda seria
// mentira: aparece o SORTEIO, a lista das opções com um marcador correndo por elas até parar na
// que saiu. As duas têm a mesma mão, o mesmo ritmo e a mesma ordem; muda o randomizador do meio.
//
// O sorteio NÃO mora aqui. Quem decide é `G.randomChoice`, com o RNG do jogo, antes de qualquer
// pixel aparecer — este arquivo recebe a cara que saiu e só conta a história dela. Por isso a mão
// nunca "escolhe": ela vai até a placa que já venceu. Inverter isso faria a animação decidir a
// vida do personagem, e um replay com a mesma semente deixaria de dar o mesmo resultado.
//
// Toda a arte é original: a mão de luva, as duas faces da moeda e o palco. Nada aqui é recorte de
// personagem de ninguém.

export const FACES = ['heads', 'tails'];

// O ritmo, em milissegundos. Medido no navegador até parar de parecer apressado (entrada curta
// demais lê como teletransporte) e de parecer arrastado (giro longo demais cansa na segunda vez).
export const TIMING = { enter: 100, travel: 760, aim: 170, press: 170, release: 120, spin: 1080, reveal: 380, hold: 140 };
export const TOTAL = Object.values(TIMING).reduce((a, b) => a + b, 0);
const REDUCED_HOLD = 900;

// A ponta do indicador dentro do desenho, em fração da largura e da altura. É daqui que sai o
// alinhamento com a placa: a mão é posicionada pela PONTA DO DEDO, não pelo seu canto, senão ela
// aponta para o lado do botão em vez de para ele.
const TIP = { x: 0.396, y: 0.08 };

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- Arte ---------------------------------------------------------------------------------------

// Face "cara": um perfil de desenho. Face "coroa": uma coroa. Serve nos dois idiomas, porque é
// exatamente isso que as duas palavras dizem — e dispensa escrever "heads"/"tails" na moeda.
function faceArt(face) {
  const disco = `<circle cx="50" cy="50" r="46" fill="#f2b632"/><circle cx="50" cy="50" r="46" fill="none" stroke="#c98f10" stroke-width="5"/>
    <circle cx="50" cy="50" r="37" fill="none" stroke="#dba421" stroke-width="3"/>`;
  if (face === 'heads') {
    // Cabeça de perfil — é o que toda moeda desenha na cara, e é o desenho que continua legível a
    // 46 px na placa. Testei um rosto de frente e um perfil menor: o de frente vira carinha de
    // emoji e o menor vira mancha.
    return `<svg viewBox="0 0 100 100" class="bl-coin-art" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${disco}
      <path d="M34 22c14-6 32 0 35 15 1 6 3 9 6 13 2 2 1 5-2 6l-4 1c0 7-3 11-9 13v6c0 3-2 5-5 5H37c-3 0-5-2-5-5v-9c-8-6-12-14-12-22 0-10 5-18 14-23z" fill="#8a5a12"/>
      <circle cx="55" cy="40" r="4" fill="#f2b632"/>
      <path d="M48 57c4 2 9 2 12-1" fill="none" stroke="#f2b632" stroke-width="3.4" stroke-linecap="round"/></svg>`;
  }
  return `<svg viewBox="0 0 100 100" class="bl-coin-art" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${disco}
    <path d="M24 66V36l11 10 15-18 15 18 11-10v30z" fill="#8a5a12"/>
    <rect x="22" y="66" width="56" height="9" rx="4" fill="#8a5a12"/>
    <circle cx="35" cy="44" r="3.2" fill="#f2b632"/><circle cx="50" cy="38" r="3.6" fill="#f2b632"/><circle cx="65" cy="44" r="3.2" fill="#f2b632"/></svg>`;
}

// A mão: luva branca de desenho, punho azul do BetLife, indicador apontando para cima e à
// esquerda. O indicador é um grupo separado porque é ele que desce no clique — o resto da mão só
// acompanha com um mergulho de três pixels.
function handArt() {
  return `<svg viewBox="0 0 120 150" class="bl-hand-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <g class="bl-hand-art" stroke="#23262b" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round" fill="#ffffff">
      <path class="bl-hand-cuff" d="M41 98h42v22c0 6-5 11-11 11H52c-6 0-11-5-11-11z" fill="#2f7ad6"/>
      <path class="bl-hand-thumb" d="M35 73c-5-5-13-5-17 0s-2 13 4 16l14 6z"/>
      <path class="bl-hand-fingers" d="M88 55c8 0 14 5 14 12s-6 12-14 12zM88 76c8 0 13 5 13 11s-5 11-13 11z"/>
      <path class="bl-hand-palm" d="M34 63c0-10 7-16 16-16h25c12 0 19 8 19 20v22c0 12-8 20-20 20H52c-11 0-18-8-18-20z"/>
      <g class="bl-hand-finger"><rect x="37" y="8" width="21" height="56" rx="10.5"/></g>
      <path class="bl-hand-crease" d="M48 93c7 3 15 3 22 0" fill="none" stroke="#c9d4e4" stroke-width="3.5"/>
    </g>
    <circle class="bl-hand-tip" cx="47.5" cy="12" r="1.5" fill="none" stroke="none"/></svg>`;
}

// ---- Palco --------------------------------------------------------------------------------------

function stage(labels, reduced, modo, opcoes) {
  // O rótulo vem ACIMA do desenho: o dedo aperta a parte de baixo da placa, e com a palavra lá
  // embaixo a mão cobria justamente a palavra Cara ou Coroa no quadro em que ela importa.
  const plate = (face) => `<div class="bl-coin-plate" data-face="${face}"><span class="bl-coin-plate-label">${esc(labels[face])}</span><span class="bl-coin-plate-art">${faceArt(face)}</span></div>`;
  const moeda = `<div class="bl-coin-plates">${plate('heads')}${plate('tails')}</div>
      <div class="bl-coin-arena"><div class="bl-coin-toss"><div class="bl-coin-piece">
        <span class="bl-coin-side is-heads">${faceArt('heads')}</span>
        <span class="bl-coin-side is-tails">${faceArt('tails')}</span>
      </div></div><div class="bl-coin-shadow"></div></div>`;
  // No sorteio o rótulo fica à ESQUERDA e o alvo do dedo à DIREITA. Não é decoração: é o que
  // garante que a mão nunca cubra o nome da opção que ela está apertando, em tela nenhuma.
  const item = (texto, i) => `<div class="bl-raffle-item" data-i="${i}">
      <span class="bl-raffle-label">${esc(texto)}</span><span class="bl-raffle-mark" aria-hidden="true"></span></div>`;
  const sorteio = `<div class="bl-raffle">${(opcoes || []).map(item).join('')}</div>`;
  return `<div class="bl-coin-stage" data-stage="${reduced ? 'reveal' : 'enter'}" data-show="heads" data-mode="${modo}" role="status" aria-live="polite">
    <div class="bl-coin-panel">
      <p class="bl-coin-kicker">${esc(labels.title)}</p>
      ${modo === 'coin' ? moeda : sorteio}
      <p class="bl-coin-result"></p>
    </div>
    ${reduced ? '' : `<div class="bl-hand">${handArt()}</div>`}
  </div>`;
}

/**
 * Mostra o sorteio e resolve quando termina.
 *
 * `mode`: 'coin' com exatamente duas opções, 'raffle' com três ou mais.
 * `face`: a cara que o jogo já tirou (só na moeda). `options`: os rótulos, na ordem da tela.
 * `winner`: a POSIÇÃO da opção sorteada dentro de `options`. `outcome`: a frase do resultado.
 *
 * Resolve SEMPRE: qualquer erro no caminho remove o palco e devolve o controle, porque travar a
 * interface numa animação é pior do que não ter animação.
 */
export async function sorteio({ mode = 'coin', face, options = [], winner = 0, labels, outcome, reduced = false }) {
  const modo = mode === 'raffle' ? 'raffle' : 'coin';
  const alvo = FACES.includes(face) ? face : 'heads';
  const palco = document.createElement('div');
  palco.className = 'bl-coin-root';
  palco.innerHTML = stage(labels, reduced, modo, options);
  document.body.appendChild(palco);
  const el = palco.querySelector('.bl-coin-stage');
  const itens = [...palco.querySelectorAll('.bl-raffle-item')];
  const vencedor = modo === 'coin'
    ? palco.querySelector(`.bl-coin-plate[data-face="${alvo}"]`)
    : (itens[winner] || itens[0]);
  const peca = palco.querySelector('.bl-coin-piece');
  const mao = palco.querySelector('.bl-hand');
  const saida = palco.querySelector('.bl-coin-result');
  el.dataset.face = alvo;

  // Oito voltas inteiras — número PAR de meias-voltas, sempre. A moeda tem de cair deitada e com a
  // gravação para cima; meia volta a mais deixaria a face de cabeça para baixo no quadro final.
  const MEIAS_VOLTAS = 16;

  // O marcador do sorteio: duas voltas pela lista e para na opção que saiu, desacelerando. A conta
  // do número de passos é o que garante o pouso — o último passo É o vencedor, por construção.
  function passosDoSorteio(n, ganhador) {
    const quantos = 2 * n + ganhador + 1;
    const passos = [];
    for (let k = 0; k < quantos; k++) passos.push(k % n);
    return passos;
  }

  const fim = () => { palco.remove(); };
  const guarda = setTimeout(fim, (reduced ? REDUCED_HOLD : TOTAL) + 2500);
  try {
    if (reduced) {
      // Preferência por menos movimento: sem viagem de mão, sem giro e sem marcador correndo. O
      // resultado já está na tela — a face que saiu, a opção marcada e a frase.
      el.dataset.show = alvo;
      if (vencedor) vencedor.classList.add('is-winner');
      if (modo === 'raffle') itens.forEach((it, i) => { if (i !== winner) it.classList.add('is-dim'); });
      if (saida) saida.textContent = outcome;
      el.dataset.stage = 'done';
      await espera(REDUCED_HOLD);
      return;
    }

    const r = el.getBoundingClientRect();
    const rm = mao.getBoundingClientRect();
    const tipX = rm.width * TIP.x;
    const tipY = rm.height * TIP.y;
    // Entra por baixo e pela direita, fora da tela.
    //
    // `agora` coloca a mão SEM transição e força o cálculo de layout antes de devolvê-la. Sem isso
    // o WebKit perde a primeira transição da sequência: ela sairia da posição inicial do CSS para
    // o destino sem nunca animar, e a mão apareceria já no botão.
    const poe = (x, y, agora = false) => {
      if (agora) mao.style.transition = 'none';
      mao.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      if (agora) { void mao.offsetWidth; mao.style.transition = ''; }
    };
    poe(r.width * 0.62, r.height + 30, true);
    await espera(TIMING.enter);

    const rp = vencedor.getBoundingClientRect();
    // Onde o dedo encosta. Na moeda, no meio da placa; no sorteio, no marcador da direita — nos
    // dois casos longe do rótulo, que é o texto que o jogador precisa ler no momento do clique.
    const destinoX = modo === 'coin'
      ? rp.left - r.left + rp.width / 2 - tipX
      : rp.left - r.left + rp.width - 30 - tipX;
    // Mira na parte DE BAIXO da placa, em cima do desenho da moeda — e não no meio. O corpo da mão
    // fica abaixo da ponta do dedo, então mirar mais alto faria a palma cobrir justamente a palavra
    // Cara ou Coroa no quadro em que o jogador quer lê-la. O rótulo mora em cima pelo mesmo motivo.
    const destinoY = rp.top - r.top + rp.height * (modo === 'coin' ? 0.66 : 0.5) - tipY;
    el.dataset.stage = 'travel';
    poe(destinoX, destinoY + 26);           // chega um pouco abaixo e sobe na antecipação
    await espera(TIMING.travel);

    el.dataset.stage = 'aim';
    poe(destinoX, destinoY);
    await espera(TIMING.aim);

    el.dataset.stage = 'press';
    vencedor.classList.add('is-pressed');
    // As outras opções saem de cena AQUI, e não antes: enquanto a mão viaja todas continuam
    // legíveis, e a partir do toque o que a mão eventualmente cobre já não importa mais.
    if (modo === 'raffle') itens.forEach((it, i) => { if (i !== winner) it.classList.add('is-dim'); });
    await espera(TIMING.press);
    vencedor.classList.remove('is-pressed');
    vencedor.classList.add('is-winner');
    el.dataset.stage = 'release';
    await espera(TIMING.release);

    el.dataset.stage = 'spin';
    poe(destinoX + 40, r.height + 60);      // a mão sai de cena enquanto o acaso faz o seu trabalho
    if (modo === 'coin') {
      // A face do resultado entra AQUI, com a moeda já no ar: trocar antes deixaria a resposta à
      // mostra na moeda parada, antes de a mão sequer chegar na placa.
      el.dataset.show = alvo;
      if (peca) peca.style.transform = `rotateX(${MEIAS_VOLTAS * 180}deg)`;
      await espera(TIMING.spin);
    } else {
      const passos = passosDoSorteio(itens.length, winner);
      // Desacelera: o passo k dura mais que o k-1, e a soma dá exatamente o tempo do giro da moeda.
      const pesos = passos.map((_, k) => 1 + 2.4 * ((k + 1) / passos.length) ** 2);
      const soma = pesos.reduce((a, b) => a + b, 0);
      for (let k = 0; k < passos.length; k++) {
        itens.forEach((it) => it.classList.remove('is-running'));
        itens[passos[k]].classList.add('is-running');
        await espera(Math.round((TIMING.spin * pesos[k]) / soma));
      }
      itens.forEach((it) => it.classList.remove('is-running'));
    }

    el.dataset.stage = 'reveal';
    if (saida) saida.textContent = outcome;
    await espera(TIMING.reveal);
    el.dataset.stage = 'done';
    await espera(TIMING.hold);
  } catch {
    /* uma animação não pode derrubar uma decisão: o jogo segue sem ela */
  } finally {
    clearTimeout(guarda);
    fim();
  }
}
