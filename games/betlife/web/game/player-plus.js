// PLAYER+ dentro do BetLife.
//
// O mesmo contrato do portal, e de propósito curto: o endereço, a chave do bilhete, e o bilhete
// sendo opaco. São três linhas de acordo, e o que decide quem é PLAYER+ não está em nenhum dos dois
// lados — está no servidor. Preferi repetir estas poucas linhas a fazer o jogo importar um arquivo
// de fora da própria pasta: o build publica `games/betlife/` inteiro e sozinho, e quebrar isso por
// vinte linhas sairia mais caro do que repeti-las.
//
// O status NÃO entra no estado da vida. Ele não é um fato da vida do personagem, não é salvo junto e
// não aparece em save nenhum — uma vida antiga continua carregando igual, com ou sem PLAYER+.
const ENDPOINT = '/api/player-plus';
const CHAVE = 'arcade.playerplus.token';

let ligado = false;             // o que a interface desenha; só vira true depois de o servidor confirmar

/** O status conhecido agora. Síncrono de propósito: quem desenha não pode esperar. */
export function isActive() { return ligado; }

async function pergunta(corpo) {
  const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  let dados = {};
  try { dados = await r.json(); } catch (_) { /* resposta sem corpo */ }
  return { status: r.status, ...dados };
}

/** Reapresenta ao servidor o bilhete guardado. Bilhete inventado à mão não passa daqui. */
export async function refresh() {
  let bilhete = null;
  try { bilhete = localStorage.getItem(CHAVE); } catch (_) { /* modo privado */ }
  if (!bilhete) { ligado = false; return false; }
  try { ligado = !!(await pergunta({ token: bilhete })).ok; } catch (_) { ligado = false; }
  return ligado;
}

/** Pede a ativação. Devolve `{ ok }` ou `{ ok: false, motivo }` com uma frase já pronta para a tela. */
export async function activate(codigo) {
  let r;
  try { r = await pergunta({ code: codigo }); }
  catch (_) { return { ok: false, motivo: 'Could not reach the server. Check your connection and try again.' }; }
  if (r.ok && r.token) {
    try { localStorage.setItem(CHAVE, r.token); } catch (_) { /* modo privado: vale só esta aba */ }
    ligado = true;
    return { ok: true };
  }
  if (r.status === 429) return { ok: false, motivo: 'Too many attempts. Wait a minute and try again.' };
  if (r.status === 503) return { ok: false, motivo: 'PLAYER+ activation is not set up on this server yet.' };
  return { ok: false, motivo: 'Wrong code. Try again.' };
}
