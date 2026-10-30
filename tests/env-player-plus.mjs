// DE ONDE OS TESTES TIRAM O CÓDIGO DE ATIVAÇÃO — e por que não é de dentro deles.
//
// Este repositório é público no GitHub. Um código escrito aqui está publicado, mesmo que o
// navegador nunca baixe este arquivo: "fora do frontend" não é o mesmo que "fora do código
// público". Então o código real nunca aparece escrito em teste nenhum. Ele vem do ambiente, ou de
// `.env.player-plus` na raiz (ignorado pelo git), igual ao que tools/serve.mjs faz.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** Põe no ambiente o que estiver em `.env.player-plus`, sem sobrescrever o que já veio de fora. */
export function carregaEnvLocal() {
  if (process.env.PLAYER_PLUS_CODE && process.env.PLAYER_PLUS_SECRET) return;
  try {
    for (const linha of fs.readFileSync(path.join(RAIZ, '.env.player-plus'), 'utf8').split('\n')) {
      const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch (_) { /* sem arquivo: quem chamar `codigoReal` recebe a instrução do que fazer */ }
}

/** O código de verdade. Falha dizendo o que falta em vez de passar por omissão. */
export function codigoReal() {
  carregaEnvLocal();
  const codigo = process.env.PLAYER_PLUS_CODE;
  if (!codigo) {
    throw new Error('PLAYER_PLUS_CODE não está no ambiente. Crie `.env.player-plus` na raiz '
      + '(PLAYER_PLUS_CODE=... e PLAYER_PLUS_SECRET=...) ou exporte as duas variáveis. '
      + 'O código não fica escrito no repositório de propósito.');
  }
  return codigo;
}
