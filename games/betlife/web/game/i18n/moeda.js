// FORMATAÇÃO DE DINHEIRO — um lugar só.
//
// A moeda do jogo é o dólar americano, e continua sendo: formatar não é converter. O que muda com o
// idioma é a CONVENÇÃO de escrita, não o valor nem a moeda.
//
//   en:  $190,337        -$500
//   pt:  US$ 190.337,00  -US$ 500,00
//
// Em português brasileiro o símbolo de moeda estrangeira vem como "US$", o ponto separa milhar, a
// vírgula separa centavos e eles aparecem mesmo quando são zero — é assim que se escreve valor
// monetário, e omitir os centavos é que pareceria errado.
//
// O VALOR ARMAZENADO NÃO MUDA. `state.player.money` continua sendo o mesmo número inteiro de
// dólares nos dois idiomas; só a cadeia exibida muda. É por isso que uma vida salva em inglês abre
// em português com o mesmo patrimônio — o que `tests/save-idioma.mjs` verifica.
import { language } from './core.js';

/** Agrupa os milhares com um separador qualquer, sem depender de locale do ambiente. */
function agrupar(inteiro, separador) {
  return String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, separador);
}

/**
 * O valor como o idioma corrente o escreve. `n` é sempre em dólares; arredonda para o dólar
 * inteiro, que é a unidade em que o jogo guarda tudo.
 */
export function dinheiro(n) {
  const negativo = n < 0;
  const inteiro = Math.abs(Math.round(n));
  const sinal = negativo ? '-' : '';
  if (language() === 'pt') return `${sinal}US$ ${agrupar(inteiro, '.')},00`;
  return `${sinal}$${agrupar(inteiro, ',')}`;
}

/** Só o número, sem símbolo — para a frase que já traz "US$" ou "$" escrito por fora. */
export function numero(n) {
  const inteiro = Math.abs(Math.round(n));
  return (n < 0 ? '-' : '') + agrupar(inteiro, language() === 'pt' ? '.' : ',');
}
