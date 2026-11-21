import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { criarConjunto, pontos } from "../src/domino.js";

describe("Conjunto dupla-seis", () => {
  test("tem exatamente 28 pecas", () => {
    assert.equal(criarConjunto().length, 28);
  });

  test("nao repete nenhuma peca", () => {
    const chaves = criarConjunto().map(([a, b]) => `${a}-${b}`);

    assert.equal(new Set(chaves).size, 28);
  });

  test("cobre todas as combinacoes de 0 a 6, sem ordenar duas vezes o mesmo par", () => {
    const chaves = criarConjunto().map(([a, b]) => `${a}-${b}`);

    for (let a = 0; a <= 6; a++) {
      for (let b = a; b <= 6; b++) {
        assert.ok(chaves.includes(`${a}-${b}`), `falta a peca ${a}-${b}`);
      }
    }
  });

  test("tem 7 carrocas, uma para cada numero", () => {
    const carrocas = criarConjunto().filter(([a, b]) => a === b);

    assert.deepEqual(carrocas, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]]);
  });

  test("os pontos de uma peca sao a soma dos dois lados", () => {
    assert.equal(pontos([6, 4]), 10);
  });

  test("a carroca de zero vale zero ponto", () => {
    assert.equal(pontos([0, 0]), 0);
  });

  test("a soma dos pontos de todas as 28 pecas e 168", () => {
    const total = criarConjunto().reduce((soma, peca) => soma + pontos(peca), 0);

    assert.equal(total, 168);
  });
});
