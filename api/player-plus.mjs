// A ATIVAÇÃO DO PLAYER+ ACONTECE AQUI, E NÃO NO NAVEGADOR.
//
// Por que existe esta função numa pasta que, fora ela, é um site estático: o código de ativação não
// pode estar no JavaScript que o navegador baixa. Tudo em `web/` é público — qualquer pessoa abre o
// arquivo e lê. Então o navegador nunca vê o código certo; ele manda o que o jogador digitou e
// pergunta. Quem compara é este arquivo, com o valor que vive numa variável de ambiente da Vercel e
// não no repositório.
//
// E a persistência também é protegida daqui. Se o status ficasse guardado como `plus: true`, bastava
// abrir o painel do navegador e escrever isso à mão. Em vez disso, a ativação devolve um bilhete
// ASSINADO com um segredo que só o servidor conhece, e o site reapresenta esse bilhete a cada visita
// para ser conferido. Um valor inventado no localStorage não tem assinatura válida, e não vira nada.
//
// O código nunca é registrado em log — nem quando está certo, nem quando está errado. O que se
// registra de uma tentativa falha é que houve uma tentativa falha.
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Compara dois textos em tempo constante. Comparar com `===` vaza, pelo tempo, quantos
 *  caracteres iniciais estavam certos — o que transforma adivinhar 4 dígitos em adivinhar 1 por vez. */
function mesmoTexto(a, b) {
  const x = Buffer.from(String(a), 'utf8');
  const y = Buffer.from(String(b), 'utf8');
  // `timingSafeEqual` exige o mesmo tamanho, e o próprio tamanho não é segredo aqui.
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/** O bilhete: `<dados>.<assinatura>`. Os dados são públicos e legíveis de propósito — não há nada
 *  secreto neles. O que não dá para forjar é a assinatura. */
export function assinar(segredo, agora = Date.now()) {
  const dados = b64url(JSON.stringify({ v: 1, iat: agora, nonce: b64url(randomBytes(9)) }));
  return `${dados}.${b64url(createHmac('sha256', segredo).update(dados).digest())}`;
}

/** Confere um bilhete. Devolve `false` para qualquer coisa que não tenha saído de `assinar`. */
export function conferir(segredo, bilhete) {
  if (typeof bilhete !== 'string' || bilhete.length > 512) return false;
  const corte = bilhete.lastIndexOf('.');
  if (corte < 1) return false;
  const dados = bilhete.slice(0, corte);
  const esperada = b64url(createHmac('sha256', segredo).update(dados).digest());
  if (!mesmoTexto(bilhete.slice(corte + 1), esperada)) return false;
  // A assinatura já garante que os dados vieram daqui; isto só rejeita um bilhete de versão futura.
  try { return JSON.parse(Buffer.from(dados.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')).v === 1; }
  catch (_) { return false; }
}

// Freio simples contra adivinhação automática. É honesto sobre o que é: um contador em memória, que
// vale por instância e zera quando a função hiberna. Não substitui um código mais longo nem um
// limitador de verdade — ver a nota de segurança em docs/ARCADE-PLAYER-PLUS.md.
const tentativas = new Map();
const JANELA = 60_000;
const LIMITE = 12;
const recentes = (quem) => (tentativas.get(quem) || []).filter((t) => Date.now() - t < JANELA);
/** Conta SÓ as tentativas que falharam. Quem acertou não está adivinhando, e não deve ser freado —
 *  uma versão anterior disto contava os acertos junto e barrava o próprio jogador legítimo. */
function anotaFalha(quem) {
  const registro = recentes(quem);
  registro.push(Date.now());
  tentativas.set(quem, registro);
  if (tentativas.size > 5000) tentativas.clear();        // teto de memória; prefere esquecer a crescer
}
const freado = (quem) => recentes(quem).length >= LIMITE;

async function corpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;          // a Vercel já traz o JSON pronto
  let bruto = typeof req.body === 'string' ? req.body : '';
  if (!bruto) { for await (const parte of req) bruto += parte; if (bruto.length > 4096) return {}; }
  try { return JSON.parse(bruto || '{}'); } catch (_) { return {}; }
}

export default async function handler(req, res) {
  const responde = (status, dados) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(dados));
  };
  if (req.method !== 'POST') return responde(405, { ok: false, error: 'method' });

  const CODIGO = process.env.PLAYER_PLUS_CODE;
  const SEGREDO = process.env.PLAYER_PLUS_SECRET;
  // Sem configuração não existe ativação possível. Em vez de cair num código embutido — que é
  // exatamente o que esta função existe para evitar — ela diz que não está configurada.
  if (!CODIGO || !SEGREDO) return responde(503, { ok: false, error: 'not-configured' });

  const { code, token } = await corpo(req);

  // 1. Reapresentação de um bilhete: é isto que roda a cada carregamento de página.
  if (token !== undefined) return responde(200, { ok: conferir(SEGREDO, token) });

  // 2. Ativação.
  if (typeof code !== 'string' || !code.trim()) return responde(400, { ok: false, error: 'missing-code' });
  const quem = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
  if (freado(quem)) return responde(429, { ok: false, error: 'too-many' });
  if (!mesmoTexto(code.trim(), CODIGO)) {
    anotaFalha(quem);
    console.log('player-plus: tentativa de ativação recusada');     // sem o código, nem certo nem errado
    return responde(401, { ok: false, error: 'bad-code' });
  }
  return responde(200, { ok: true, token: assinar(SEGREDO) });
}
