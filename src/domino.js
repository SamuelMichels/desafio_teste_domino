/**
 * Domino dupla-seis para 02 jogadores, na variante com compra do monte.
 * A especificacao completa das regras esta no README.md deste repositorio.
 */

const MAIOR_NUMERO = 6;

/** As 28 pecas da dupla-seis, de [0,0] a [6,6], cada par exatamente uma vez. */
export function criarConjunto() {
  const pecas = [];
  for (let a = 0; a <= MAIOR_NUMERO; a++) {
    for (let b = a; b <= MAIOR_NUMERO; b++) {
      pecas.push([a, b]);
    }
  }
  return pecas;
}

/** Pontos de uma peca: a soma dos seus dois lados. */
export function pontos([a, b]) {
  return a + b;
}
