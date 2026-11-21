import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida } from "../src/domino.js";

describe("Batida: acabar com as pecas da mao", () => {
  const batida = () => {
    const partida = new Partida({
      maos: [
        [[6, 6]],
        [[0, 1], [2, 3]],
      ],
      monte: [],
    });
    partida.jogar(0, [6, 6]);
    return partida;
  };

  test("jogar a ultima peca da mao encerra a partida", () => {
    assert.equal(batida().estado().encerrada, true);
  });

  test("quem bateu e o vencedor", () => {
    assert.equal(batida().estado().vencedor, 0);
  });

  test("a partida encerrada registra a batida como motivo", () => {
    assert.equal(batida().estado().motivo, "batida");
  });

  test("o vencedor soma os pontos que sobraram na mao do adversario", () => {
    assert.equal(batida().estado().pontuacao, 6);
  });

  test("depois da batida nenhuma jogada e aceita", () => {
    const partida = batida();

    assert.throws(() => partida.jogar(1, [0, 1], "direita"), /encerrada/i);
  });
});

describe("Trancamento: os dois jogadores passam em sequencia", () => {
  /** A linha pede 6 nas duas pontas e nenhuma das duas maos tem um 6. */
  const trancada = () => {
    const partida = new Partida({
      maos: [
        [[6, 6], [0, 5]],
        [[0, 1], [2, 3]],
      ],
      monte: [],
    });
    partida.jogar(0, [6, 6]);
    partida.passar(1);
    partida.passar(0);
    return partida;
  };

  test("dois passes seguidos encerram a partida", () => {
    assert.equal(trancada().estado().encerrada, true);
  });

  test("a partida encerrada registra o trancamento como motivo", () => {
    assert.equal(trancada().estado().motivo, "trancado");
  });

  test("na partida trancada vence quem tem a menor soma na mao", () => {
    assert.equal(trancada().estado().vencedor, 0);
  });

  test("o vencedor do trancamento soma os pontos da mao do perdedor", () => {
    assert.equal(trancada().estado().pontuacao, 6);
  });

  test("somas iguais na mao terminam a partida empatada", () => {
    const partida = new Partida({
      maos: [
        [[6, 6], [0, 5]],
        [[1, 4], [0, 0]],
      ],
      monte: [],
    });
    partida.jogar(0, [6, 6]);
    partida.passar(1);
    partida.passar(0);

    const estado = partida.estado();
    assert.equal(estado.encerrada, true);
    assert.equal(estado.motivo, "trancado");
    assert.equal(estado.vencedor, null);
    assert.equal(estado.pontuacao, 0);
  });

  test("um passe com jogada no meio nao tranca a partida", () => {
    const partida = new Partida({
      maos: [
        [[6, 6], [6, 2], [0, 5]],
        [[0, 1], [3, 4]],
      ],
      monte: [],
    });

    partida.jogar(0, [6, 6]);
    partida.passar(1);
    partida.jogar(0, [6, 2], "direita");
    partida.passar(1);

    assert.equal(partida.estado().encerrada, false);
  });

  test("os passes voltam a contar e o segundo par consecutivo tranca", () => {
    const partida = new Partida({
      maos: [
        [[6, 6], [6, 2], [0, 5]],
        [[0, 1], [3, 4]],
      ],
      monte: [],
    });

    partida.jogar(0, [6, 6]);
    partida.passar(1);
    partida.jogar(0, [6, 2], "direita");
    partida.passar(1);
    partida.passar(0);

    assert.equal(partida.estado().encerrada, true);
    assert.equal(partida.estado().motivo, "trancado");
  });

  test("depois do trancamento nenhuma compra e aceita", () => {
    const partida = trancada();

    assert.throws(() => partida.comprar(partida.estado().vez), /encerrada/i);
  });
});

describe("Partida em aberto", () => {
  test("comeca sem motivo de encerramento e sem pontuacao", () => {
    const estado = new Partida({ semente: 42 }).estado();

    assert.equal(estado.motivo, null);
    assert.equal(estado.pontuacao, 0);
  });
});
