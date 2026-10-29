'use strict';
// Ponto único de entrada da tradução: carrega os catálogos e expõe o que o jogo usa.
//
// Os catálogos são registrados aqui, na subida. Nenhum outro arquivo do jogo importa catálogo nem
// pergunta em que idioma está — todos chamam `t()` / `tEvento()` e seguem.
import { registrarFrases, registrarEventos, setLanguage, language, onLanguageChange, t, tg, evento, cobertura, temTraducao } from './core.js';
import { PT_FRASES } from './pt/frases.js';
import { PT_EVENTOS, PT_EVENTOS_FRASES } from './pt/eventos.js';
import { PT_PESSOAS } from './pt/pessoas.js';
import { PT_NARRATIVA } from './pt/narrativa.js';
import { dinheiro, numero } from './moeda.js';
import { PT_DADOS } from './pt/dados.js';
import { PT_SENTENCAS } from './pt/sentencas.js';
import { PT_DECISOES } from './pt/decisoes.js';
import { PT_EVENTOS_VIDA } from './pt/eventos-vida.js';
import { PT_RESTO } from './pt/resto.js';

registrarFrases('pt', PT_FRASES);
registrarFrases('pt', PT_PESSOAS);
registrarFrases('pt', PT_NARRATIVA);
registrarFrases('pt', PT_EVENTOS_FRASES);
registrarFrases('pt', PT_DADOS);
registrarFrases('pt', PT_SENTENCAS);
registrarFrases('pt', PT_DECISOES);
registrarFrases('pt', PT_EVENTOS_VIDA);
registrarFrases('pt', PT_RESTO);
registrarEventos('pt', PT_EVENTOS);

export { setLanguage, language, onLanguageChange, t, tg, evento, cobertura, temTraducao };
export { dinheiro, numero };

// Os idiomas do jogo e se estão completos. Fonte única: o seletor lê daqui, e `completo` é o que
// decide se um idioma pode ser oferecido.
export const LANGUAGES = [
  { id: 'en', nome: 'English', completo: true },
  { id: 'pt', nome: 'Português (Brasil)', completo: true },
  { id: 'es', nome: 'Español', completo: false },
  { id: 'fr', nome: 'Français', completo: false },
];
export const LANGUAGES_READY = LANGUAGES.filter((l) => l.completo);

const CHAVE = 'betlife.web.language';

/** O idioma gravado, se for um dos completos. Qualquer outro valor cai no primeiro completo. */
export function idiomaGravado() {
  let g = null;
  try { g = localStorage.getItem(CHAVE); } catch (_) { /* modo privado */ }
  const pronto = LANGUAGES_READY.find((l) => l.id === g);
  return pronto ? pronto.id : (LANGUAGES_READY[0] ? LANGUAGES_READY[0].id : 'en');
}

export function gravarIdioma(lang) {
  try { localStorage.setItem(CHAVE, lang); } catch (_) { /* modo privado */ }
  setLanguage(lang);
}
