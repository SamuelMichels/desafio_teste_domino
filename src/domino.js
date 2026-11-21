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

const PECAS_POR_JOGADOR = 7;

/**
 * Gerador pseudoaleatorio com semente (mulberry32). Existe para que o
 * embaralhamento seja reproduzivel: um caso de teste que depende de sorteio
 * so vale se rodar igual todas as vezes.
 */
function geradorComSemente(semente) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let x = estado;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates guiado pela semente. */
function embaralhar(pecas, semente) {
  const sorteio = geradorComSemente(semente);
  const copia = [...pecas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(sorteio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Forca de uma peca na disputa da abertura, em ordem de prioridade:
 * 1) carroca ganha de qualquer peca que nao seja carroca;
 * 2) entre pecas do mesmo tipo, a de maior soma;
 * 3) persistindo o empate, a que tem o maior lado.
 * Como as 28 pecas sao distintas, esses tres criterios nunca empatam de fato.
 */
function forcaNaAbertura([a, b]) {
  return [a === b ? 1 : 0, a + b, Math.max(a, b)];
}

const maisForte = (uma, outra) => {
  const forcaUma = forcaNaAbertura(uma);
  const forcaOutra = forcaNaAbertura(outra);
  for (let i = 0; i < forcaUma.length; i++) {
    if (forcaUma[i] !== forcaOutra[i]) return forcaUma[i] > forcaOutra[i];
  }
  return false;
};

/** Descobre a peca que abre a partida e em qual das duas maos ela esta. */
function definirAbertura(maos) {
  let abertura = null;
  let jogador = 0;
  maos.forEach((mao, indice) => {
    mao.forEach((peca) => {
      if (abertura === null || maisForte(peca, abertura)) {
        abertura = peca;
        jogador = indice;
      }
    });
  });
  return { abertura, jogador };
}

const copiarPecas = (pecas) => pecas.map(([a, b]) => [a, b]);

export class Partida {
  /**
   * @param {object} inicio
   * @param {number} [inicio.semente] distribui as 28 pecas de forma reproduzivel
   * @param {number[][][]} [inicio.maos] cenario pronto: a mao de cada jogador
   * @param {number[][]} [inicio.monte] cenario pronto: o monte de compra
   */
  constructor({ semente, maos, monte } = {}) {
    if (maos) {
      this.maos = maos.map(copiarPecas);
      this.monte = copiarPecas(monte ?? []);
    } else {
      const baralho = embaralhar(criarConjunto(), semente ?? 0);
      this.maos = [
        baralho.slice(0, PECAS_POR_JOGADOR),
        baralho.slice(PECAS_POR_JOGADOR, PECAS_POR_JOGADOR * 2),
      ];
      this.monte = baralho.slice(PECAS_POR_JOGADOR * 2);
    }

    const { abertura, jogador } = definirAbertura(this.maos);
    this.abertura = abertura;
    this.vez = jogador;
    this.linha = [];
    this.encerrada = false;
    this.vencedor = null;
  }

  /** Retrato do jogo. E sempre uma copia: mexer no retorno nao altera a partida. */
  estado() {
    return {
      vez: this.vez,
      abertura: this.abertura === null ? null : [...this.abertura],
      linha: copiarPecas(this.linha),
      pontas: this.linha.length === 0
        ? []
        : [this.linha[0][0], this.linha[this.linha.length - 1][1]],
      maos: this.maos.map(copiarPecas),
      monte: copiarPecas(this.monte),
      encerrada: this.encerrada,
      vencedor: this.vencedor,
    };
  }
}
