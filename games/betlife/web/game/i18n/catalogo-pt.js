// Junta todos os catálogos de português num só objeto.
//
// Existe para as ferramentas de auditoria (`tests/i18n-chaves.mjs`, `tests/i18n-estaticas.mjs`) não
// precisarem repetir a lista de arquivos — e para que acrescentar um catálogo novo seja uma linha
// aqui, não três lugares.
import { PT_FRASES } from './pt/frases.js';
import { PT_PESSOAS } from './pt/pessoas.js';
import { PT_NARRATIVA } from './pt/narrativa.js';
import { PT_EVENTOS_FRASES } from './pt/eventos.js';
import { PT_DADOS } from './pt/dados.js';
import { PT_SENTENCAS } from './pt/sentencas.js';
import { PT_DECISOES } from './pt/decisoes.js';
import { PT_EVENTOS_VIDA } from './pt/eventos-vida.js';
import { PT_RESTO } from './pt/resto.js';

export const CATALOGO_PT = {
  ...PT_FRASES, ...PT_PESSOAS, ...PT_NARRATIVA, ...PT_EVENTOS_FRASES, ...PT_DADOS,
  ...PT_SENTENCAS, ...PT_DECISOES, ...PT_EVENTOS_VIDA, ...PT_RESTO,
};
