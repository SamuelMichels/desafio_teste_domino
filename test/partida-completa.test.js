import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { Partida, criarConjunto, pontos } from "../src/domino.js";

/**
 * Identidade da peca, independente da orientacao com que ela entrou na linha.
 * Uma peca encaixada pode ficar virada ([3,5] entra como [5,3]) para manter o
 * encadeamento; continua sendo a mesma peca do conjunto.
 */
const chave = ([a, b]) => (a <= b ? `${a}-${b}` : `${b}-${a}`);
const TODAS = new Set(criarConjunto().map(chave));
const LIMITE_DE_LANCES = 200;

/**
 * Invariantes que valem em QUALQUER momento de QUALQUER partida.
 * Sao conferidas lance a lance, nao so no fim: um erro que aparece no meio
 * e se corrige sozinho depois passaria batido num exame apenas do resultado.
 */
function conferirInvariantes(estado, lance) {
  const { linha, maos, monte, pontas } = estado;
  const onde = `lance ${lance}`;

  const todasAsPecas = [...linha, ...maos[0], ...maos[1], ...monte].map(chave);
  assert.equal(todasAsPecas.length, 28, `${onde}: alguma peca foi perdida ou duplicada`);
  assert.deepEqual(new Set(todasAsPecas), TODAS, `${onde}: o conjunto de pecas mudou`);

  for (let i = 0; i + 1 < linha.length; i++) {
    assert.equal(
      linha[i][1],
      linha[i + 1][0],
      `${onde}: a linha quebrou entre ${chave(linha[i])} e ${chave(linha[i + 1])}`,
    );
  }

  if (linha.length > 0) {
    assert.deepEqual(
      pontas,
      [linha[0][0], linha[linha.length - 1][1]],
      `${onde}: as pontas nao correspondem as extremidades da linha`,
    );
  }
}

/**
 * Conduz a partida ate o fim com uma estrategia deterministica e simples:
 * joga a primeira peca da mao que encaixar, preferindo a ponta esquerda;
 * sem encaixe, compra enquanto houver monte; monte vazio, passa.
 * Nao e um jogador esperto, e o suficiente para exercitar as regras.
 */
function jogarAteOFim(partida) {
  let lance = 0;

  while (!partida.estado().encerrada) {
    assert.ok(++lance <= LIMITE_DE_LANCES, "a partida nao terminou dentro do limite de lances");

    const estado = partida.estado();
    conferirInvariantes(estado, lance);

    const { vez, maos, monte, pontas, linha, abertura } = estado;

    if (linha.length === 0) {
      partida.jogar(vez, abertura);
      continue;
    }

    const jogada = maos[vez]
      .flatMap((peca) => ["esquerda", "direita"].map((ponta) => ({ peca, ponta })))
      .find(({ peca, ponta }) => peca.includes(ponta === "esquerda" ? pontas[0] : pontas[1]));

    if (jogada) {
      partida.jogar(vez, jogada.peca, jogada.ponta);
    } else if (monte.length > 0) {
      partida.comprar(vez);
    } else {
      partida.passar(vez);
    }
  }

  conferirInvariantes(partida.estado(), "final");
  return partida.estado();
}

describe("Uma partida completa entre 02 jogadores", () => {
  test("a partida da semente 42 termina e o placar fecha com as regras", () => {
    const final = jogarAteOFim(new Partida({ semente: 42 }));

    assert.equal(final.encerrada, true);
    assert.ok(["batida", "trancado"].includes(final.motivo));
  });

  test("em dez partidas diferentes nenhuma trava e todas respeitam as invariantes", () => {
    for (let semente = 1; semente <= 10; semente++) {
      const final = jogarAteOFim(new Partida({ semente }));

      assert.equal(final.encerrada, true, `a partida da semente ${semente} nao encerrou`);
    }
  });

  test("quando a partida termina em batida, o vencedor fica sem pecas na mao", () => {
    for (let semente = 1; semente <= 20; semente++) {
      const final = jogarAteOFim(new Partida({ semente }));
      if (final.motivo !== "batida") continue;

      assert.equal(final.maos[final.vencedor].length, 0);
      assert.ok(final.maos[1 - final.vencedor].length > 0);
    }
  });

  test("a pontuacao do vencedor e sempre a soma da mao do adversario", () => {
    for (let semente = 1; semente <= 20; semente++) {
      const final = jogarAteOFim(new Partida({ semente }));
      if (final.vencedor === null) continue;

      const maoDoPerdedor = final.maos[1 - final.vencedor];
      const soma = maoDoPerdedor.reduce((total, peca) => total + pontos(peca), 0);

      assert.equal(final.pontuacao, soma, `placar errado na semente ${semente}`);
    }
  });

  test("no trancamento o vencedor nunca tem mais pontos na mao que o perdedor", () => {
    for (let semente = 1; semente <= 20; semente++) {
      const final = jogarAteOFim(new Partida({ semente }));
      if (final.motivo !== "trancado" || final.vencedor === null) continue;

      const soma = (mao) => mao.reduce((total, peca) => total + pontos(peca), 0);

      assert.ok(soma(final.maos[final.vencedor]) < soma(final.maos[1 - final.vencedor]));
    }
  });

  test("a mesma semente joga a mesma partida duas vezes", () => {
    const uma = jogarAteOFim(new Partida({ semente: 99 }));
    const outra = jogarAteOFim(new Partida({ semente: 99 }));

    assert.deepEqual(uma, outra);
  });
});
