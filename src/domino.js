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

/** Soma dos pontos de todas as pecas de uma mao. */
const somarMao = (mao) => mao.reduce((soma, peca) => soma + pontos(peca), 0);

const PONTAS = ["esquerda", "direita"];

/** Duas pecas sao a mesma independente da ordem dos lados: [6,3] e [3,6]. */
const mesmaPeca = ([a, b], [c, d]) => (a === c && b === d) || (a === d && b === c);

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
    this.motivo = null;
    this.pontuacao = 0;
    this.passesSeguidos = 0;
  }


  /**
   * Encaixa uma peca da mao do jogador em uma das pontas da linha.
   * Na primeira jogada da partida a ponta e irrelevante: a linha esta vazia.
   * Qualquer recusa lanca Error antes de alterar qualquer coisa, para que uma
   * jogada invalida nunca deixe a partida pela metade.
   */
  jogar(jogador, peca, ponta = "direita") {
    this.#exigirEmAndamento();
    this.#exigirVez(jogador);
    const naMao = this.maos[jogador].findIndex((candidata) => mesmaPeca(candidata, peca));
    if (naMao < 0) {
      throw new Error(`A peca [${peca}] nao esta na mao do jogador ${jogador}.`);
    }

    let orientada;
    if (this.linha.length === 0) {
      if (!mesmaPeca(peca, this.abertura)) {
        throw new Error(`A abertura cabe a peca [${this.abertura}].`);
      }
      orientada = [...peca];
    } else {
      if (!PONTAS.includes(ponta)) {
        throw new Error(`Ponta invalida: ${ponta}. Use "esquerda" ou "direita".`);
      }
      orientada = this.#orientar(peca, ponta);
    }

    if (ponta === "esquerda" && this.linha.length > 0) {
      this.linha.unshift(orientada);
    } else {
      this.linha.push(orientada);
    }
    this.maos[jogador].splice(naMao, 1);
    this.passesSeguidos = 0;

    if (this.maos[jogador].length === 0) {
      this.#encerrar("batida", jogador);
      return;
    }
    this.vez = 1 - jogador;
  }

  /** Vira a peca para que o lado que casa com a ponta fique voltado para a linha. */
  #orientar([a, b], ponta) {
    const numero = ponta === "direita"
      ? this.linha[this.linha.length - 1][1]
      : this.linha[0][0];

    if (ponta === "direita") {
      if (a === numero) return [a, b];
      if (b === numero) return [b, a];
    } else {
      if (b === numero) return [a, b];
      if (a === numero) return [b, a];
    }
    throw new Error(`A peca [${a},${b}] nao encaixa na ponta ${ponta}, que pede ${numero}.`);
  }


  /**
   * Tira a primeira peca do monte para a mao de quem esta na vez.
   * So e permitido a quem nao tem nenhum encaixe: a compra existe para
   * destravar o jogador, nao para escolher peca melhor. Comprar nao cede a vez,
   * entao o jogador repete a compra enquanto continuar sem encaixe.
   */
  comprar(jogador) {
    this.#exigirEmAndamento();
    this.#exigirVez(jogador);
    if (this.#temEncaixe(jogador)) {
      throw new Error(`O jogador ${jogador} tem encaixe na mao e por isso nao pode comprar.`);
    }
    if (this.monte.length === 0) {
      throw new Error("O monte esta vazio: nao ha o que comprar.");
    }
    this.maos[jogador].push(this.monte.shift());
  }

  /**
   * Cede a vez sem jogar. So e permitido no unico caso em que o jogador
   * realmente nao tem o que fazer: sem encaixe na mao e com o monte vazio.
   */
  passar(jogador) {
    this.#exigirEmAndamento();
    this.#exigirVez(jogador);
    if (this.#temEncaixe(jogador)) {
      throw new Error(`O jogador ${jogador} tem encaixe na mao e por isso nao pode passar.`);
    }
    if (this.monte.length > 0) {
      throw new Error("Ainda ha peca no monte: a compra e obrigatoria antes de passar.");
    }
    this.vez = 1 - jogador;
    this.passesSeguidos += 1;

    if (this.passesSeguidos === 2) {
      this.#encerrar("trancado");
    }
  }

  /**
   * Fecha a partida e calcula o placar.
   * Na batida, o vencedor e quem zerou a mao e marca os pontos que sobraram na
   * mao do adversario. No trancamento, vence a menor soma e o vencedor marca a
   * mao do perdedor; somas iguais terminam empatadas, sem ponto para ninguem.
   */
  #encerrar(motivo, jogadorQueBateu = null) {
    this.encerrada = true;
    this.motivo = motivo;

    if (motivo === "batida") {
      this.vencedor = jogadorQueBateu;
      this.pontuacao = somarMao(this.maos[1 - jogadorQueBateu]);
      return;
    }

    const somas = this.maos.map(somarMao);
    if (somas[0] === somas[1]) {
      this.vencedor = null;
      this.pontuacao = 0;
      return;
    }
    this.vencedor = somas[0] < somas[1] ? 0 : 1;
    this.pontuacao = Math.max(somas[0], somas[1]);
  }

  #exigirEmAndamento() {
    if (this.encerrada) {
      throw new Error(`A partida ja esta encerrada (${this.motivo}).`);
    }
  }

  #exigirVez(jogador) {
    if (jogador !== this.vez) {
      throw new Error(`Nao e a vez do jogador ${jogador}.`);
    }
  }

  /** O jogador tem alguma peca que encaixe em alguma das duas pontas? */
  #temEncaixe(jogador) {
    if (this.linha.length === 0) return true;
    const pontas = [this.linha[0][0], this.linha[this.linha.length - 1][1]];
    return this.maos[jogador].some(([a, b]) => pontas.includes(a) || pontas.includes(b));
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
      motivo: this.motivo,
      pontuacao: this.pontuacao,
    };
  }
}
