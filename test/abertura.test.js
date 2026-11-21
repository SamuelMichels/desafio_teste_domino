import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida } from "../src/domino.js";

describe("Quem abre a partida", () => {
  test("abre quem tem a maior carroca", () => {
    const partida = new Partida({
      maos: [
        [[5, 5], [6, 4]],
        [[6, 6], [0, 1]],
      ],
    });

    assert.equal(partida.estado().vez, 1);
  });

  test("a peca de abertura e a maior carroca da mesa", () => {
    const partida = new Partida({
      maos: [
        [[5, 5], [6, 4]],
        [[6, 6], [0, 1]],
      ],
    });

    assert.deepEqual(partida.estado().abertura, [6, 6]);
  });

  test("a carroca mais alta vence mesmo estando na mao com menos pontos", () => {
    const partida = new Partida({
      maos: [
        [[3, 3], [6, 5], [6, 4]],
        [[4, 4], [0, 1], [0, 2]],
      ],
    });

    assert.equal(partida.estado().vez, 1);
    assert.deepEqual(partida.estado().abertura, [4, 4]);
  });

  test("sem nenhuma carroca na mesa, abre quem tem a peca de maior soma", () => {
    const partida = new Partida({
      maos: [
        [[6, 5], [0, 1]],
        [[6, 4], [0, 2]],
      ],
    });

    assert.equal(partida.estado().vez, 0);
    assert.deepEqual(partida.estado().abertura, [6, 5]);
  });

  test("empate na soma e desfeito pelo maior lado da peca", () => {
    const partida = new Partida({
      maos: [
        [[5, 4], [0, 1]],
        [[6, 3], [0, 2]],
      ],
    });

    assert.equal(partida.estado().vez, 1);
    assert.deepEqual(partida.estado().abertura, [6, 3]);
  });

  test("a partida comeca com a linha vazia e sem pontas abertas", () => {
    const partida = new Partida({ semente: 42 });

    assert.deepEqual(partida.estado().linha, []);
    assert.deepEqual(partida.estado().pontas, []);
  });

  test("a partida comeca em aberto, sem vencedor", () => {
    const estado = new Partida({ semente: 42 }).estado();

    assert.equal(estado.encerrada, false);
    assert.equal(estado.vencedor, null);
  });
});
