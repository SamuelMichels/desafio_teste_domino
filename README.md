# desafio_teste_domino

Casos de teste em JavaScript para uma partida de **dominó dupla-seis entre 02 jogadores**.

**Disciplina:** Projeto, Implementação e Teste de Software — 2026

## Colaborador

- **Samuel Fuentes Michels** — RA 24011114-2

Trabalho individual. Todo o conteúdo deste repositório foi escrito por mim, e o histórico de commits registra o processo ciclo por ciclo.

## Como executar

Requer apenas **Node.js 18 ou superior** — os testes usam o executor `node:test` e o `node:assert`, que fazem parte da biblioteca padrão. **Não há nenhuma dependência para instalar**, nem `npm install`.

```bash
node --test
```

ou, equivalente:

```bash
npm test
```

Resultado esperado:

```
# tests 65
# suites 12
# pass 65
# fail 0
```

---

# 1. Especificação do desafio

O enunciado pede "casos de teste para testar uma partida para 02 jogadores". Dominó tem muitas variantes, e um caso de teste só significa algo contra uma regra escrita. A regra adotada aqui é a **dupla-seis para dois jogadores na variante com compra do monte**, especificada abaixo. Tudo que os testes cobrem vem desta lista, e cada item dela tem pelo menos um caso de teste.

### 1.1 Peças

O conjunto é a **dupla-seis**: todos os pares não ordenados de números de 0 a 6, cada par uma única vez — **28 peças**, de `[0,0]` a `[6,6]`. Entre elas há 7 **carroças** (peças de lados iguais). Os **pontos** de uma peça são a soma dos seus dois lados; a soma de todo o conjunto é 168.

A peça é um par não ordenado: `[3,5]` e `[5,3]` são a mesma peça. Ao ser encaixada, porém, ela é guardada **orientada**, com o lado que casa voltado para a linha — por isso a mesma peça pode aparecer na linha como `[5,3]`.

### 1.2 Distribuição

Cada jogador recebe **7 peças**. As **14 restantes formam o monte** (o "dorme"), de onde se compra durante a partida. Nenhuma peça fica fora do jogo.

### 1.3 Quem abre

Abre a partida quem tiver a **maior carroça**. Não havendo carroça em nenhuma das duas mãos, abre quem tiver a **peça de maior soma**; se duas peças empatarem na soma, decide a que tem o **maior lado**. A peça vencedora dessa disputa é obrigatoriamente a primeira peça jogada.

Esses três critérios, nessa ordem, nunca empatam de fato, porque as 28 peças são distintas.

### 1.4 A jogada

Na sua vez, o jogador encaixa uma peça da mão em **uma das duas pontas** da linha. Um dos lados da peça precisa ser igual ao número exposto naquela ponta; a peça é **virada** se necessário. A jogada é recusada quando:

- não é a vez do jogador;
- a peça não está na mão dele;
- a peça não casa com a ponta escolhida;
- a ponta informada não existe;
- é a primeira jogada e a peça não é a que ganhou a disputa da abertura;
- a partida já está encerrada.

Uma jogada recusada **não altera nada**: a partida fica exatamente como estava.

### 1.5 Compra

Quem **não tem nenhum encaixe** compra a primeira peça do monte. A compra existe para destravar o jogador, não para escolher peça melhor: **só é permitida a quem não tem encaixe**, e é **recusada** para quem tem. Comprar **não cede a vez** — o jogador repete a compra enquanto continuar sem encaixe, até conseguir jogar ou o monte esvaziar.

### 1.6 Passe

O jogador passa a vez **somente** no único caso em que não tem o que fazer: **sem encaixe na mão e com o monte vazio**. Com peça no monte, a compra é obrigatória e o passe é recusado.

### 1.7 Fim da partida e placar

A partida termina de duas formas:

| Desfecho | Quando acontece | Vencedor | Pontuação |
|---|---|---|---|
| **Batida** | um jogador joga a última peça da mão | quem bateu | a soma dos pontos que sobraram na mão do adversário |
| **Trancado** | os dois jogadores passam **em sequência** | quem tem a **menor** soma na mão | a soma da mão do perdedor |

No trancamento, **somas iguais terminam a partida empatada**, sem vencedor e sem ponto para ninguém. O contador de passes **zera a cada jogada**: um passe com uma jogada no meio não tranca nada.

Depois de encerrada, a partida não aceita mais jogada, compra nem passe.

---

# 2. O modelo testado

Toda a implementação está em [src/domino.js](src/domino.js) (290 linhas, sem dependências).

```js
criarConjunto()                      // as 28 peças da dupla-seis
pontos([a, b])                       // a + b

new Partida({ semente })             // distribui 7/7/14 de forma reproduzível
new Partida({ maos, monte })         // cenário montado à mão

partida.estado()                     // retrato completo (sempre uma cópia)
partida.jogar(jogador, peça, ponta)  // ponta: "esquerda" | "direita"
partida.comprar(jogador)
partida.passar(jogador)
```

`estado()` devolve `{ vez, abertura, linha, pontas, maos, monte, encerrada, vencedor, motivo, pontuacao }`.

### Duas decisões tomadas por causa dos testes

**Sorteio com semente.** Um caso de teste que depende de embaralhamento só vale se rodar igual todas as vezes. O embaralhamento usa um gerador pseudoaleatório com semente (mulberry32 + Fisher-Yates), então `new Partida({ semente: 42 })` produz sempre a mesma distribuição. Um teste confirma isso, e outro confirma que sementes diferentes produzem distribuições diferentes — sem o segundo, uma função que ignorasse a semente passaria no primeiro.

**Cenário montado à mão.** Testar trancamento ou batida a partir de um sorteio exigiria fabricar dezenas de jogadas até cair no estado desejado, e o teste passaria a depender de coisas que não está testando. Por isso o construtor aceita `{ maos, monte }` diretamente: cada caso monta em duas linhas a situação exata que quer examinar. Essa é a diferença entre um teste que examina uma regra e um teste que examina uma partida inteira por acidente.

---

# 3. Como funcionam os casos de teste

São **65 casos** em **7 arquivos**, um arquivo por bloco da especificação. Cada caso tem um nome que descreve o comportamento esperado em português, e verifica **uma** coisa.

| Arquivo | Casos | O que examina | Seção da especificação |
|---|---:|---|---|
| [test/pecas.test.js](test/pecas.test.js) | 7 | o conjunto dupla-seis e os pontos de uma peça | 1.1 |
| [test/distribuicao.test.js](test/distribuicao.test.js) | 7 | o reparte 7/7/14, a reprodutibilidade e o isolamento do estado | 1.2 |
| [test/abertura.test.js](test/abertura.test.js) | 7 | quem abre e com qual peça, incluindo os dois desempates | 1.3 |
| [test/jogada.test.js](test/jogada.test.js) | 13 | encaixe nas duas pontas, inversão da peça e as cinco recusas | 1.4 |
| [test/compra-e-passe.test.js](test/compra-e-passe.test.js) | 11 | quando comprar e passar são permitidos e quando são recusados | 1.5, 1.6 |
| [test/fim-de-partida.test.js](test/fim-de-partida.test.js) | 14 | batida, trancamento, empate e o cálculo do placar | 1.7 |
| [test/partida-completa.test.js](test/partida-completa.test.js) | 6 | partidas inteiras jogadas do início ao fim | todas |
| **Total** | **65** | | |

### 3.1 Três formas de examinar a mesma partida

Os casos não são todos do mesmo tipo, de propósito:

**Caso de unidade — uma regra isolada.** Monta o estado exato, executa uma ação, verifica uma consequência:

```js
test("empate na soma e desfeito pelo maior lado da peca", () => {
  const partida = new Partida({
    maos: [[[5, 4], [0, 1]],
           [[6, 3], [0, 2]]],
  });

  assert.equal(partida.estado().vez, 1);
  assert.deepEqual(partida.estado().abertura, [6, 3]);
});
```

Nenhuma das duas mãos tem carroça e as duas melhores peças somam 9. A regra do maior lado é a única coisa que decide, e é a única coisa que o caso examina.

**Caso de recusa — o que o jogo tem de proibir.** Um jogo de dominó em que tudo é aceito não é um jogo de dominó. Treze dos 65 casos verificam que uma operação inválida é recusada, e um deles verifica que a recusa não deixa resíduo:

```js
test("uma jogada recusada nao altera nada no estado", () => {
  const partida = cenario();
  partida.jogar(0, [6, 6]);
  const antes = partida.estado();

  assert.throws(() => partida.jogar(1, [0, 4], "direita"));

  assert.deepEqual(partida.estado(), antes);
});
```

Sem este caso, uma implementação que recusasse a jogada **depois** de já ter tirado a peça da mão passaria em todos os outros.

**Caso de partida completa — as regras funcionando juntas.** O arquivo `partida-completa.test.js` joga partidas de verdade, do sorteio até o encerramento, com uma estratégia determinística simples (joga a primeira peça que encaixa, prefere a ponta esquerda; sem encaixe compra; monte vazio passa). O que ele verifica não é o vencedor — isso depende da estratégia — mas **invariantes que valem em qualquer momento de qualquer partida**, conferidas **lance a lance**:

- as 28 peças continuam existindo, sem perda nem duplicação, somando linha + mãos + monte;
- a linha está encadeada: o lado direito de cada peça é igual ao lado esquerdo da seguinte;
- as pontas informadas correspondem de fato às extremidades da linha;
- a partida termina dentro de um limite de lances (uma regra mal escrita trava o jogo em laço infinito, e um teste que trava não acusa nada);
- o placar fecha com a regra: a pontuação do vencedor é sempre a soma da mão do adversário.

A conferência é feita a cada lance, e não só no resultado final, porque um erro que aparece no meio da partida e se corrige sozinho depois passaria batido num exame apenas do placar.

Essas invariantes são verificadas em **20 sementes diferentes**, que produzem **16 partidas terminadas em batida e 4 em trancamento** — os dois desfechos da especificação são realmente exercitados, e não há caso passando no vácuo por falta de cenário.

### 3.2 Por que "passou" não é evidência suficiente

Os casos de teste foram escritos **antes** da implementação, um bloco de cada vez, no ciclo RED → GREEN. O histórico do git tem um commit por ciclo:

| Commit | Ciclo | RED observado antes de implementar |
|---|---|---|
| `720e923` | 1 — peças | `Cannot find module '../src/domino.js'` |
| `5b56208` | 2 — distribuição | `does not provide an export named 'Partida'` |
| `02efcc4` | 3 — abertura | 7 de 7 falhando: `vez` e `abertura` indefinidos |
| `d7bdfd2` | 4 — jogada | 13 de 13 falhando: `partida.jogar is not a function` |
| `cf83b99` | 5 — compra e passe | 11 de 11 falhando: `comprar`/`passar is not a function` |
| `68e1457` | 6 — fim da partida | 13 de 14 falhando |
| `c68ac33` | 7 — partida completa | 6 de 6 falhando |

**O ciclo 6 merece atenção: um caso passou no RED, antes de existir qualquer implementação.** Foi o `um passe com jogada no meio nao tranca a partida`, que verifica `encerrada === false` — e um código que não encerra nada nunca deixa `encerrada` verdadeiro. Ele passou por omissão, não por acerto. Isso é o que um teste verde não mostra: **contar testes que passam não mede nada; o que mede é se o teste falha quando o código está errado.**

Para medir isso, a suíte foi submetida a **teste de mutação**: sete defeitos foram inseridos de propósito na implementação, um por vez, para ver se algum caso de teste acusava. Os sete foram detectados:

| Mutante | Defeito inserido | Resultado | Casos que acusaram |
|---|---|---|---|
| M1 | carroça deixa de ter prioridade na abertura | **morto** | 1 |
| M2 | o trancamento passa a exigir 3 passes | **morto** | 7 |
| M3 | no trancado vence a maior soma | **morto** | 3 |
| M4 | a compra sai do fim do monte, não do começo | **morto** | 3 |
| M5 | a batida nunca é detectada | **morto** | 5 |
| M6 | a peça nunca é invertida ao encaixar | **morto** | 9 |
| M7 | o contador de passes não zera na jogada | **morto** | 2 |

O M7 é o mais interessante: quem o matou foi justamente **aquele caso que passou no vácuo no RED**, junto com o par que o acompanha (`os passes voltam a contar e o segundo par consecutivo tranca`). Sozinho, ele não provava nada; ao lado do caso que exige o trancamento depois de dois passes de verdade, ele fecha a regra — um exige que o contador conte, o outro exige que ele zere. O par detecta o defeito que nenhum dos dois pegaria isolado.

A implementação foi restaurada ao original depois dos sete mutantes, e a suíte volta a 65/65.

### 3.3 Um defeito que os testes encontraram

No ciclo 7, os seis casos de partida completa falharam com uma mensagem que não era sobre regra de dominó:

```
lance 5: o conjunto de pecas mudou
-   '3-5'
+   '5-3'
```

A peça `[3,5]` havia entrado na linha virada, como `[5,3]`, e a verificação de conservação das 28 peças a contou como outra peça. A implementação estava certa — virar a peça é exatamente o que mantém a linha encadeada —, **o errado era o invariante**, que confundia a identidade da peça com a orientação dela.

A correção foi no teste, não na produção: a chave de comparação passou a ser canônica (`a <= b`). O achado valeu mais que a correção: ele deixou explícito no modelo que **peça é um par não ordenado, mas a linha guarda peças orientadas** — distinção que está agora escrita na seção 1.1 desta especificação e comentada no próprio teste.

---

## Resultado final

```
$ node --test

# tests 65
# suites 12
# pass 65
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

| Medida | Valor |
|---|---:|
| Casos de teste | 65 |
| Arquivos de teste | 7 |
| Dependências externas | 0 |
| Mutantes inseridos / detectados | 7 / 7 |
| Linhas de implementação | 290 |
