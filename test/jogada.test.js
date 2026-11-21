import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida } from "../src/domino.js";

/** Cenario fixo: abre o jogador 0 com a carroca de seis. */
const cenario = () =>
  new Partida({
    maos: [
      [[6, 6], [6, 3], [0, 1]],
      [[5, 5], [2, 6], [0, 4]],
    ],
    monte: [],
  });

describe("A jogada de abertura", () => {
  test("so aceita a peca que ganhou a disputa da abertura", () => {
    const partida = cenario();

    assert.throws(() => partida.jogar(0, [6, 3], "direita"), /abertura/i);
  });

  test("a peca de abertura entra na linha", () => {
    const partida = cenario();

    partida.jogar(0, [6, 6]);

    assert.deepEqual(partida.estado().linha, [[6, 6]]);
  });

  test("a peca jogada sai da mao de quem a jogou", () => {
    const partida = cenario();

    partida.jogar(0, [6, 6]);

    assert.deepEqual(partida.estado().maos[0], [[6, 3], [0, 1]]);
  });

  test("depois da abertura a vez passa para o adversario", () => {
    const partida = cenario();

    partida.jogar(0, [6, 6]);

    assert.equal(partida.estado().vez, 1);
  });

  test("a carroca aberta deixa as duas pontas no mesmo numero", () => {
    const partida = cenario();

    partida.jogar(0, [6, 6]);

    assert.deepEqual(partida.estado().pontas, [6, 6]);
  });
});

describe("Encaixe nas pontas", () => {
  test("a peca encaixa na ponta direita", () => {
    const partida = cenario();
    partida.jogar(0, [6, 6]);

    partida.jogar(1, [2, 6], "direita");

    assert.deepEqual(partida.estado().linha, [[6, 6], [6, 2]]);
  });

  test("a peca e invertida quando o encaixe pede", () => {
    const partida = cenario();
    partida.jogar(0, [6, 6]);

    partida.jogar(1, [2, 6], "direita");

    assert.deepEqual(partida.estado().pontas, [6, 2]);
  });

  test("a peca encaixa na ponta esquerda", () => {
    const partida = cenario();
    partida.jogar(0, [6, 6]);
    partida.jogar(1, [2, 6], "direita");

    partida.jogar(0, [6, 3], "esquerda");

    assert.deepEqual(partida.estado().linha, [[3, 6], [6, 6], [6, 2]]);
    assert.deepEqual(partida.estado().pontas, [3, 2]);
  });
});

describe("Jogadas recusadas", () => {
  test("peca que nao casa com a ponta escolhida e recusada", () => {
    const partida = cenario();
    partida.jogar(0, [6, 6]);

    assert.throws(() => partida.jogar(1, [0, 4], "direita"), /encaixa/i);
  });

  test("jogar fora da vez e recusado", () => {
    const partida = cenario();

    assert.throws(() => partida.jogar(1, [5, 5], "direita"), /vez/i);
  });

  test("jogar peca que nao esta na mao e recusado", () => {
    const partida = cenario();
    partida.jogar(0, [6, 6]);

    assert.throws(() => partida.jogar(1, [6, 1], "direita"), /mao/i);
  });

  test("ponta inexistente e recusada", () => {
    const partida = cenario();
    partida.jogar(0, [6, 6]);

    assert.throws(() => partida.jogar(1, [2, 6], "meio"), /ponta/i);
  });

  test("uma jogada recusada nao altera nada no estado", () => {
    const partida = cenario();
    partida.jogar(0, [6, 6]);
    const antes = partida.estado();

    assert.throws(() => partida.jogar(1, [0, 4], "direita"));

    assert.deepEqual(partida.estado(), antes);
  });
});
