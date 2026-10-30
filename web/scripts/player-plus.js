// PLAYER+ no portal: a pílula, o modal de ativação e o selo de ativo.
//
// O contrato com o BetLife — e é só isto que os dois precisam combinar — tem três itens:
//
//   1. o endereço          /api/player-plus
//   2. a chave do bilhete  arcade.playerplus.token   (localStorage, mesma origem, logo compartilhado)
//   3. o bilhete é opaco   ninguém o lê; quem diz se vale é o servidor
//
// O que NÃO está aqui, de propósito: a decisão de quem é PLAYER+. Esta página guarda um bilhete e
// pergunta. Se alguém escrever qualquer coisa na chave do localStorage, a conferência falha e a
// página volta a mostrar o botão de ativar — que é o comportamento certo, e não um bug.
export const ENDPOINT = '/api/player-plus';
export const CHAVE = 'arcade.playerplus.token';

// O idioma: o portal não tem seletor próprio, então ele segue o que o jogador escolheu no BetLife.
// É o único sinal de idioma que existe no site, e vive na mesma origem.
const FRASES = {
  pt: {
    'Become a': 'Seja um', 'PLAYER+ ACTIVE': 'PLAYER+ ATIVO',
    'Activate PLAYER+': 'Ativar PLAYER+',
    'Type the activation code to turn on PLAYER+ in this browser.': 'Digite o código de ativação para ligar o PLAYER+ neste navegador.',
    'Activation code': 'Código de ativação',
    'Activate': 'Ativar', 'Cancel': 'Cancelar',
    'PLAYER+ activated successfully!': 'PLAYER+ ativado com sucesso!',
    'Wrong code. Try again.': 'Senha incorreta. Tente novamente.',
    'Too many attempts. Wait a minute and try again.': 'Tentativas demais. Espere um minuto e tente de novo.',
    'PLAYER+ activation is not set up on this server yet.': 'A ativação do PLAYER+ ainda não está configurada neste servidor.',
    'Could not reach the server. Check your connection and try again.': 'Não foi possível falar com o servidor. Verifique a conexão e tente de novo.',
    'PLAYER+ is a visual status. It does not change gameplay.': 'O PLAYER+ é um status visual. Ele não muda a jogabilidade.',
    'Checking…': 'Conferindo…',
  },
};
const idioma = () => { try { return localStorage.getItem('betlife.web.language') || 'en'; } catch (_) { return 'en'; } };
const t = (texto) => (FRASES[idioma()] || {})[texto] || texto;

const guardado = () => { try { return localStorage.getItem(CHAVE); } catch (_) { return null; } };

async function pergunta(corpo) {
  const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  let dados = {};
  try { dados = await r.json(); } catch (_) { /* resposta sem corpo */ }
  return { status: r.status, ...dados };
}

/** Pede a ativação ao servidor. O código viaja; a resposta é um bilhete assinado, ou uma recusa. */
export async function ativar(codigo) {
  let r;
  try { r = await pergunta({ code: codigo }); }
  catch (_) { return { ok: false, motivo: 'Could not reach the server. Check your connection and try again.' }; }
  if (r.ok && r.token) {
    try { localStorage.setItem(CHAVE, r.token); } catch (_) { /* modo privado: vale só esta aba */ }
    return { ok: true };
  }
  if (r.status === 429) return { ok: false, motivo: 'Too many attempts. Wait a minute and try again.' };
  if (r.status === 503) return { ok: false, motivo: 'PLAYER+ activation is not set up on this server yet.' };
  return { ok: false, motivo: 'Wrong code. Try again.' };
}

/** O status, conferido pelo servidor. Sem bilhete, ou com bilhete forjado, devolve falso. */
export async function ativo() {
  const bilhete = guardado();
  if (!bilhete) return false;
  try { return !!(await pergunta({ token: bilhete })).ok; } catch (_) { return false; }
}

// ---- A pílula e o modal -------------------------------------------------------------------------

function pilula() {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'plus-pill';
  b.id = 'player-plus-pill';
  return b;
}

function desenhaPilula(b, estado) {
  if (estado === 'ativo') {
    b.classList.add('is-active');
    b.disabled = true;
    b.innerHTML = `<span class="plus-check" aria-hidden="true">★</span><b>${t('PLAYER+ ACTIVE')}</b>`;
    b.setAttribute('aria-label', t('PLAYER+ ACTIVE'));
  } else {
    b.classList.remove('is-active');
    b.disabled = estado === 'conferindo';
    b.innerHTML = `<span>${t(estado === 'conferindo' ? 'Checking…' : 'Become a')}</span><b>PLAYER+</b>`;
    b.setAttribute('aria-label', t('Activate PLAYER+'));
  }
}

function abreModal(aoAtivar) {
  const dlg = document.createElement('dialog');
  dlg.className = 'plus-dialog';
  dlg.innerHTML = `<form method="dialog" class="plus-form" novalidate>
      <h2 class="plus-title">${t('Activate PLAYER+')}</h2>
      <p class="plus-text">${t('Type the activation code to turn on PLAYER+ in this browser.')}</p>
      <label class="plus-label" for="plus-code">${t('Activation code')}</label>
      <input class="plus-input" id="plus-code" type="password" inputmode="numeric" autocomplete="off"
             autocapitalize="off" spellcheck="false" enterkeyhint="done" maxlength="64">
      <p class="plus-note" id="plus-note" role="status">${t('PLAYER+ is a visual status. It does not change gameplay.')}</p>
      <div class="plus-buttons">
        <button type="submit" class="plus-btn plus-btn-go" id="plus-go">${t('Activate')}</button>
        <button type="button" class="plus-btn plus-btn-off" id="plus-cancel">${t('Cancel')}</button>
      </div>
    </form>`;
  document.body.appendChild(dlg);
  const campo = dlg.querySelector('#plus-code');
  const nota = dlg.querySelector('#plus-note');
  const botao = dlg.querySelector('#plus-go');

  // Fechar não muda nada: nem pelo Cancelar, nem pelo Esc, nem clicando fora.
  const fecha = () => { dlg.close(); dlg.remove(); };
  dlg.querySelector('#plus-cancel').addEventListener('click', fecha);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); fecha(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) fecha(); });

  dlg.querySelector('form').addEventListener('submit', async (e) => {
    // O Enter no campo cai AQUI, no submit do formulário — é por isso que o teclado funciona sem
    // nenhuma escuta de tecla: um formulário com um botão de submit já faz isso.
    e.preventDefault();
    const codigo = campo.value.trim();
    if (!codigo) { campo.focus(); return; }
    botao.disabled = true;
    nota.className = 'plus-note';
    nota.textContent = t('Checking…');
    const r = await ativar(codigo);
    if (r.ok) {
      nota.className = 'plus-note is-good';
      nota.textContent = t('PLAYER+ activated successfully!');
      aoAtivar();
      setTimeout(fecha, 900);
      return;
    }
    botao.disabled = false;
    nota.className = 'plus-note is-bad';
    nota.textContent = t(r.motivo);
    campo.value = '';
    campo.focus();
  });

  dlg.showModal();
  campo.focus();
}

export function montaPilula(destino) {
  const b = pilula();
  desenhaPilula(b, 'conferindo');
  destino.appendChild(b);
  b.addEventListener('click', () => { if (!b.classList.contains('is-active')) abreModal(() => desenhaPilula(b, 'ativo')); });
  ativo().then((sim) => desenhaPilula(b, sim ? 'ativo' : 'inativo'));
  return b;
}
