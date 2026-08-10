# Revisão integral final de UX da Mesa de Curadoria

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base de código** | `f477971` |
| **Natureza** | auditoria UX/UI integral. **Zero código** |

---

## A. Resumo executivo

> ### A Mesa não precisa mais de alteração estrutural. Há **uma** melhoria que vale uma missão.

Revisei as superfícies da Mesa na forma atual, sem reusar conclusão antiga sem
reconferir. O resultado é majoritariamente **"já está bom"** — e isso é o
achado, não a ausência dele.

| Veredito | Quantidade |
|---|---|
| **Já está bom — não mexer** | 9 superfícies |
| **Oportunidade real** (missão própria) | **1** |
| **Polimento** (não recomendo abrir missão) | 2 |
| **Não recomendado** | 3 hipóteses |
| **Encerrar sem implementar** | A-3 |

**A oportunidade:** o cartão de candidato repete, **por candidato**, duas frases
que são **constantes** — não dependem de quem é o profissional. Com N na Rede,
são 2N repetições de texto que poderia ser dito **uma vez acima da lista**.

## B. Os 6 `<Card>` de `mesa-workspace` — inventário

**Primeiro, a correção do número — de novo.** "6 cards" é a contagem de
**ocorrências no código-fonte**, não de caixas na tela. O que se renderiza é
variável:

```
1 (Comparação) + 0–3 (pareceres) + 0–1 (composição)
+ 1 (encerramento) + 0–1 (memória) + N (candidatos da Rede)
```

**Com uma Rede de 8 profissionais e 3 selecionados, são ~14 caixas — não 6.**

| # | Card | Conteúdo | Função | Interação | Estado | Selecionável? | Por que é card | Manter? |
|---|---|---|---|---|---|---|---|---|
| 1 | **Comparação** | matriz do Motor, critério a critério | leitura comparativa | não | não | não | delimita uma **tabela**; a borda separa a matriz do texto ao redor | **MANTER** |
| 2 | **Parecer** *(×0–3)* | um por profissional selecionado | escrever o parecer | **sim** — campo + reordenar | **sim** — texto e ordem | — | **unidade de trabalho por profissional** | **MANTER** |
| 3 | **"Por que estas três, juntas"** | justificativa da composição | escrever | **sim** — campo | **sim** | não | unidade de escrita própria, sobre o conjunto | **MANTER** |
| 4 | **Encerramento** | Barreira 4 | **encerrar a Curadoria Técnica** | **sim** — ação irreversível | **sim** — `closed`, `missing`, **borda verde quando pronto** | não | **ação + estado**: o caso mais claro de card funcional da Mesa | **MANTER** |
| 5 | **Memória desta sessão** | log de movimentos com autor | leitura | não | não | não | unidade fechada; só existe quando há log | **MANTER** |
| 6 | **Candidato** *(×N)* | profissional da Rede | **selecionar / comparar** | **sim** — `onToggleSelection` | **sim** — `selected`, `inComparison`, **borda muda** | **SIM** | **é a affordance de seleção** | **MANTER** |

### As dez perguntas do §7 — respondidas para o conjunto

| # | Pergunta | Resposta |
|---|---|---|
| 1 | representa alternativa real? | **#6 sim** (candidatos), **#2 sim** (as três escolhidas). Os demais não são alternativas |
| 2 | pode ser selecionado? | **#6 sim** |
| 3 | tem estado próprio? | **#2, #4, #6 sim** |
| 4 | precisa separação visual? | **#6 sim** — sem ela, oito profissionais viram texto corrido |
| 5 | o usuário compara com os vizinhos? | **#6 sim** — é literalmente a etapa de comparar |
| 6 | o contêiner comunica clicabilidade? | **#6 sim** — a borda **muda** quando `selected` |
| 7 | sem a caixa a affordance pioraria? | **#6 sim, muito.** #4 também: a borda verde de "pronto para encerrar" sumiria |
| 8 | há texto repetido dentro dos seis? | **SIM — e é o achado (§C)** |
| 9 | há informação comum que poderia sair? | **SIM — duas frases constantes** |
| 10 | mobile sofre pela moldura ou pelo conteúdo? | **pelo conteúdo repetido**, não pela moldura |

> ### CONCLUSÃO DOS SEIS: **MANTER TODOS.**
>
> O §9 estava certo — na etapa `CAMINHOS`, o card **é** o componente correto.
> Três deles (**#2, #4, #6**) são funcionais por qualquer critério: seleção,
> ação irreversível, estado com mudança de borda. **Remover moldura aqui
> destruiria affordance.**
>
> **A oportunidade não era tirar cards. Era tirar repetição de dentro deles.**

## C. 🎯 A oportunidade real — constantes repetidas por candidato

Dentro de `CandidatoCard`, renderizado **uma vez por profissional da Rede**:

| Texto | Depende do candidato? |
|---|---|
| *"Aprovado pela Aliviar — critério próprio, anterior a este caso."* | **não** — é verdade para **todos**, por definição de estar na Rede |
| *"Leitura do Motor para este caso"* | **não** — rótulo fixo |
| *"Contagens por estado — nunca uma nota. O detalhe, critério a critério, está na Comparação."* | **não** — explicação constante, com referência cruzada fixa |

**Com N candidatos, são 2N frases constantes** (mais N rótulos) numa etapa cuja
tarefa é **comparar**. Elas ocupam a altura que deveria mostrar a diferença
entre os profissionais — e no celular, onde os cards empilham, o custo é linear
em N.

**Proposta:** dizer cada uma **uma vez, acima da lista**. O card fica com o que
é **daquele** profissional: nome, resumo do Motor, contagens, e os dois botões.

| Critério | Avaliação |
|---|---|
| problema observado | 2N repetições de texto constante, medido na fonte |
| solução delimitada | mover dois `<p>` de `CandidatoCard` para um cabeçalho da lista |
| ganho esperado | altura cai proporcional a N; a diferença entre candidatos ganha o espaço |
| teste possível | as frases aparecem **exatamente uma vez** na etapa `CAMINHOS`, com qualquer N |
| risco | **baixo** — nenhum estado, nenhuma ação, nenhuma seleção tocada |
| reversibilidade | máxima |

**Passa nos cinco requisitos do §35.** **Prioridade: P1.**

## D. Superfície por superfície

| Superfície | Está boa? | Problema real | Proposta | Prioridade | Implementar? |
|---|---|---|---|---|---|
| **Trilha + faixa de pendência** | **sim** | — | — | — | não |
| **Pergunta ativa** (pós A-1) | **sim** | — | — | — | não |
| **Linha de investigação** | **sim** | não compete com a pergunta: fica acima, é fina, e nomeia o raciocínio | — | — | não |
| **Contexto lateral (7 seções)** | **sim** — A-4 revalidada | filete + `1.5rem` + `<h2>` continuam suficientes | — | — | **não** |
| **Comparação** (card 1) | **sim** | caixa em volta de matriz é legítima | — | P3 | não |
| **Cartão de candidato** (card 6) | **quase** | **2N frases constantes** | hoist acima da lista | **P1** | **sim** |
| **Pareceres** (card 2) | **sim** | — | — | — | não |
| **Composição** (card 3) | **sim** | — | — | — | não |
| **Encerramento** (card 4) | **sim** | — | — | — | não |
| **Memória da sessão** (card 5) | **sim** | — | — | P3 | não |
| **Etapa RELATORIO** | **sim** | entrega limpa: explica que o Relatório é documento, não painel, e aponta o próximo passo | — | — | não |
| **Painel de entrada** | **sim** | — | — | — | não |
| **Estados vazios** | **sim** | `MesaVazio` uniforme: título + corpo + próximo passo | — | — | não |

## E. Densidade

| Superfície | Densidade **necessária** | Densidade **de interface** |
|---|---|---|
| Cartão de candidato | nome, resumo do Motor, contagens | **2 frases constantes + 1 rótulo, ×N** ⚠️ |
| Comparação | a matriz inteira — é o conteúdo | descrição de uma linha, justa |
| Encerramento | lista do que falta | nenhuma |
| Contexto lateral | sete leituras distintas | nenhuma — sem moldura, sem repetição |

**A única densidade de interface encontrada é a do §C.** O resto é conteúdo
clínico/técnico indispensável, e **não se combate densidade clínica apagando
conteúdo**.

## F. Instruções — mapeadas, não reescritas

| Texto | Classificação |
|---|---|
| *"Selecione profissionais acima para escrever o parecer de cada um."* | **necessária sempre** — só aparece com zero selecionados; é estado vazio |
| *"N de 3 selecionados. Nenhuma opção existe sem justificativa."* | **necessária sempre** — comunica limite e regra |
| *"As três já estão selecionadas — remova uma para trocar."* | **necessária** — só aparece quando a seleção está cheia |
| *"Para encerrar:"* + lista do que falta | **necessária** — precede ato irreversível |
| *"Contagens por estado — nunca uma nota…"* | **necessária uma vez**, não N vezes ⚠️ **§C** |
| *"Aprovado pela Aliviar — critério próprio…"* | **necessária uma vez**, não N vezes ⚠️ **§C** |

**Nenhuma instrução do tipo *"nesta etapa você deverá…"* sobrevive na Mesa.**
As que existem são condicionais e informam estado ou regra.

## G. Estados

Procurei estado exibido duas vezes sem função diferente. **Não encontrei
nenhum** depois das rodadas.

O caso que mais se aproxima é legítimo: no card de candidato, `selected` aparece
como **borda** e como **`<Badge>Selecionado</Badge>`** — mas isso é o §14 do
nível ESSENCIAL sendo cumprido: **cor nunca é a única linguagem**.

## H. Cores

| Pergunta | Resposta |
|---|---|
| âmbar está raro? | **sim** — só na faixa de pendência e no "Merece atenção" |
| verde continua processual? | **sim** — a borda verde do encerramento significa *"pronto para encerrar"*, estado de processo |
| vermelho restrito? | **sim** — nenhum uso interpretativo encontrado |
| neutro está neutro? | **sim** |
| evidência sem verde/vermelho? | **sim** — E-3 mantido; distinção por forma |

**Nada a propor. A paleta não foi reaberta.**

## I. Visualizações futuras

| Hipótese | *Que texto ou esforço substituiria?* | Veredito |
|---|---|---|
| barra de progresso da Curadoria | nenhum — **a trilha já é** | ❌ |
| gráfico comparando profissionais | nenhum — seria **ranking** | ❌ proibido |
| proporção de evidências | nenhum, e **sugeriria força** | ❌ |
| régua de seis conceitos por profissional no Juízo | substituiria **rolar 6×N cartões** | 🔸 **oportunidade futura, não agora** |

Só a última substitui esforço real. **Fica registrada, não recomendada neste
ciclo** — o Juízo não apresentou problema observado.

## J. Mobile

O trabalho pesado já foi feito e está documentado no CSS: topo `static` no
celular, `aside` não-sticky, alvos de toque ampliados, pendência que **nunca**
vai para gaveta, e a faixa que empilha em vez de disputar a linha.

**O único ganho de mobile que resta é o §C**, e ele é **linear em N** — é onde
mais rende.

**Medições em 320/375/768px: a medir na implementação.** Não invento número.

## K. A-3

**§23 cumprido: procurei evidência nova de que a ordem do Briefing atrapalha o
uso. Não encontrei nenhuma.** Nenhuma rodada gerou achado operacional sobre o
Briefing, e a ordem atual preserva *fonte antes de interpretação*.

> ### RECOMENDAÇÃO: ENCERRAR A-3 SEM IMPLEMENTAÇÃO.
>
> Manter em espera indefinida é dívida silenciosa. Se um dia houver observação
> real, que se abra uma missão nova — com a evidência na mão.

## L. Não mexer — a lista tão importante quanto a das melhorias

1. **Trilha e faixa de pendência** — E-1/S-1 certificados, funcionando.
2. **Pergunta ativa como primeiro título** — A-1 recém-certificada.
3. **As sete seções do contexto lateral** — A-4 revalidada: já são editoriais.
4. **Os seis `<Card>` de `mesa-workspace`** — três são funcionais; remover
   moldura destruiria affordance.
5. **Card de encerramento** — um card, uma ação, checklist, borda verde quando
   pronto. **A hipótese do §25 (excesso de confirmações) não se confirma.**
6. **Etapa RELATORIO** — entrega limpa, sem confirmação duplicada.
7. **Painel de entrada** — *"Suas Curadorias"* com ação primária por caso, mais
   a fila de disponíveis. **Responde às quatro perguntas do §20; não adicionar
   dashboard.**
8. **Estados vazios** — `MesaVazio` uniforme, didático, curto.
9. **Gramática cromática** — E-2/E-3/R-1/S-1 coerentes entre superfícies.

## M. As melhores oportunidades

> ### Uma. Só uma vale missão.

**1. Constantes repetidas por candidato** — §C. **P1**, alto impacto, baixo
risco, delta mínimo, reversível.

**Polimentos que NÃO recomendo abrir missão para:** converter os cards
*Comparação* e *Memória* em `mesa-bloco` (P3 cada). São coerentes com a doutrina
*"nunca cartão dentro de cartão"*, mas **delimitam unidades autônomas de
leitura** — matriz e log —, e o ganho não paga o toque.

**Pendência normativa, fora do UX:** **S-4(cálculo)** — o que
`criteriosInsuficientes` deve medir. **Registrada, não misturada.**

## N. Custo × benefício da única proposta

| | |
|---|---|
| impacto UX | **alto** — cresce com o tamanho da Rede |
| risco | **baixo** — sem estado, ação ou seleção |
| delta | **mínimo** — dois `<p>` mudam de lugar |
| reversibilidade | **máxima** |

**Gate do §35: 5/5.**

---

# RESPOSTA À PERGUNTA DO §37

> **Depois de todas as rodadas, o que ainda vale realmente mexer?**

**Uma coisa:** as duas frases constantes que o cartão de candidato repete a cada
profissional da Rede. Sair de dentro do card, subir uma vez acima da lista.

**Todo o resto da Mesa está bom** — e vários pontos que pareciam candidatos
(os seis cards, o encerramento, o contexto lateral, o painel de entrada) foram
**verificados e confirmados como corretos como estão**.

# PRÓXIMO PASSO

**Duas decisões do DT-01, ambas de uma linha:**

1. **Abrir a Rodada 5** com o item do §C — `03 ENGENHEIRO`, escopo mínimo.
2. **Encerrar A-3 sem implementação** (§K).

**Não há terceira.** Se a resposta a (1) for "depois", a Mesa continua íntegra —
esta é melhoria, não correção.
