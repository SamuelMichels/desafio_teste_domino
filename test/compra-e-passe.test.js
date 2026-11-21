import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida } from "../src/domino.js";

/**
 * Cenario em que o jogador 1 fica sem encaixe depois da abertura:
 * a linha pede 6 nas duas pontas e a mao dele nao tem nenhum 6.
 */
const semEncaixe = (monte) => {
  const partida = new Partida({
    maos: [
      [[6, 6], [0, 5]],
      [[0, 1], [2, 3]],
    ],
    monte,
  });
  partida.jogar(0, [6, 6]);
  return partida;
};

describe("Compra do monte", () => {
  test("quem nao tem encaixe compra a primeira peca do monte", () => {
    const partida = semEncaixe([[6, 4], [1, 1]]);

    partida.comprar(1);

    assert.deepEqual(partida.estado().maos[1], [[0, 1], [2, 3], [6, 4]]);
  });

  test("a peca comprada sai do monte", () => {
    const partida = semEncaixe([[6, 4], [1, 1]]);

    partida.comprar(1);

    assert.deepEqual(partida.estado().monte, [[1, 1]]);
  });

  test("comprar nao cede a vez: quem comprou continua jogando", () => {
    const partida = semEncaixe([[6, 4], [1, 1]]);

    partida.comprar(1);

    assert.equal(partida.estado().vez, 1);
  });

  test("a compra se repete enquanto a peca comprada tambem nao encaixa", () => {
    const partida = semEncaixe([[1, 4], [6, 4]]);

    partida.comprar(1);
    partida.comprar(1);

    assert.deepEqual(partida.estado().monte, []);
    partida.jogar(1, [6, 4], "direita");
    assert.deepEqual(partida.estado().pontas, [6, 4]);
  });

  test("comprar com encaixe disponivel na mao e recusado", () => {
    const partida = new Partida({
      maos: [
        [[6, 6], [0, 5]],
        [[6, 1], [2, 3]],
      ],
      monte: [[1, 1]],
    });
    partida.jogar(0, [6, 6]);

    assert.throws(() => partida.comprar(1), /encaixe/i);
  });

  test("comprar com o monte vazio e recusado", () => {
    const partida = semEncaixe([]);

    assert.throws(() => partida.comprar(1), /monte/i);
  });

  test("comprar fora da vez e recusado", () => {
    const partida = semEncaixe([[6, 4]]);

    assert.throws(() => partida.comprar(0), /vez/i);
  });
});

describe("Passe", () => {
  test("sem encaixe e com o monte vazio, o jogador passa a vez", () => {
    const partida = semEncaixe([]);

    partida.passar(1);

    assert.equal(partida.estado().vez, 0);
  });

  test("passar com encaixe disponivel e recusado", () => {
    const partida = new Partida({
      maos: [
        [[6, 6], [0, 5]],
        [[6, 1], [2, 3]],
      ],
      monte: [],
    });
    partida.jogar(0, [6, 6]);

    assert.throws(() => partida.passar(1), /encaixe/i);
  });

  test("passar com peca no monte e recusado: a compra e obrigatoria", () => {
    const partida = semEncaixe([[6, 4]]);

    assert.throws(() => partida.passar(1), /monte/i);
  });

  test("passar fora da vez e recusado", () => {
    const partida = semEncaixe([]);

    assert.throws(() => partida.passar(0), /vez/i);
  });
});
