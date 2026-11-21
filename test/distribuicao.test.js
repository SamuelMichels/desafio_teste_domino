import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida, criarConjunto } from "../src/domino.js";

const chave = ([a, b]) => `${a}-${b}`;

describe("Distribuicao das pecas", () => {
  test("cada jogador recebe 7 pecas", () => {
    const { maos } = new Partida({ semente: 42 }).estado();

    assert.equal(maos[0].length, 7);
    assert.equal(maos[1].length, 7);
  });

  test("as 14 pecas restantes formam o monte", () => {
    const { monte } = new Partida({ semente: 42 }).estado();

    assert.equal(monte.length, 14);
  });

  test("as 28 pecas da partida sao exatamente as do conjunto, sem perda nem repeticao", () => {
    const { maos, monte } = new Partida({ semente: 42 }).estado();
    const emJogo = [...maos[0], ...maos[1], ...monte].map(chave);

    assert.equal(emJogo.length, 28);
    assert.deepEqual(new Set(emJogo), new Set(criarConjunto().map(chave)));
  });

  test("a mesma semente produz sempre a mesma distribuicao", () => {
    const primeira = new Partida({ semente: 7 }).estado();
    const segunda = new Partida({ semente: 7 }).estado();

    assert.deepEqual(primeira.maos, segunda.maos);
    assert.deepEqual(primeira.monte, segunda.monte);
  });

  test("sementes diferentes produzem distribuicoes diferentes", () => {
    const uma = new Partida({ semente: 1 }).estado();
    const outra = new Partida({ semente: 2 }).estado();

    assert.notDeepEqual(uma.maos, outra.maos);
  });

  test("um cenario montado a mao e respeitado como esta", () => {
    const maos = [[[6, 6], [3, 4]], [[6, 5], [0, 1]]];
    const monte = [[2, 2]];

    const estado = new Partida({ maos, monte }).estado();

    assert.deepEqual(estado.maos, maos);
    assert.deepEqual(estado.monte, monte);
  });

  test("o estado devolvido e uma copia: alterar o retorno nao mexe na partida", () => {
    const partida = new Partida({ semente: 42 });

    partida.estado().maos[0].push([6, 6]);

    assert.equal(partida.estado().maos[0].length, 7);
  });
});
