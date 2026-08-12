# 37 · Bloco 11 — fechamento

**Estado:** CONCLUÍDO. **Bloco 12 (Fila) permanece PENDENTE** — nada aqui o
antecipa nem o autoriza.

Contrato de origem: [36](36_BLOCOS_11_12_D6_CASOS_REAIS.md). Este documento
registra o que ficou provado, e por quê — não repete o contrato.

## 1 · D-6 — o rascunho da Mesa parou de evaporar

O diagnóstico que o Bloco 11 herdou dizia "falta persistir o rascunho". Não
faltava. `mesa-shell.tsx` renderiza **apenas `conteudo[etapaAtual]`**: trocar de
etapa **desmonta** `MesaWorkspace`, e com ele morria o `useReducer` que guardava
seleção, pareceres e justificativa do conjunto. Não era perda de dados — era
ciclo de vida.

A correção é uma só: o estado subiu para
[`mesa-estado.tsx`](../../src/components/curadoria/mesa/mesa-estado.tsx), num
provider montado **acima** do slot que desmonta. O reducer foi movido verbatim.

**A arquitetura é EM MEMÓRIA, e isso é decisão, não limitação.** Não há
`localStorage`, `sessionStorage`, cookie, query string nem gravação parcial no
banco — um teste estrutural varre o provider procurando exatamente por isso.
Rascunho é trabalho do Curador; fato é o que ele confirma. O limite honesto
permanece e passou a ser **dito** em vez de descoberto: recarregar a página ou
sair da rota perde o rascunho — e é o botão de encerrar, sempre visível, que
nomeia o que falta para o trabalho virar registro.

Duas guardas nasceram junto: o provider recusa consumo fora dele, e recusa
rascunho de um Case consumido por outro.

## 2 · Os seis itens de apresentação

Nenhum deles mudou uma regra. Todos corrigiram o que a tela **diz** sobre regras
que já existiam.

| # | O que era | O que é |
|---|---|---|
| **C4** | contadores no topo e frase da barra montados por duas chamadas independentes | `estadoDaMesa()` — **uma** derivação, duas apresentações. `etapaConcluida()` define "concluída" uma vez |
| **C6** | eliminar sem justificativa só era recusado no servidor | recusado **também** no cliente. ⛔ a guarda do servidor **não saiu** — T-11-5 a mantém falseável |
| **C7** | *"Encerrar e gerar o Relatório"* só nascia com tudo pronto | existe sempre, **desabilitado**, apontando as pendências por `aria-describedby` |
| **C8** | Relatório emitido aceitava digitação e cliques que voltavam como erro | `congelado = emitido \|\| entregue`; campos e *Salvar* indisponíveis, com **motivo textual** |
| **C9** | — | já estava correto (`Atalhos ?`); verificado, nada alterado |
| **D2-4** | a justificativa do conjunto era nomeada **duas vezes na mesma tela** — título visível × `aria-label` divergente | o título **É** o rótulo. Um nome, um campo |

**Achado do C8 que não estava no contrato:** *"Salvar rascunho"* aparece em
**dois ramos** da tela do Relatório. Congelar só um deixava a porta aberta pelo
outro — um Relatório emitido com pendência ainda listada caía no segundo ramo e
salvava. Os dois foram fechados.

**Interpretação declarada do D2-4:** §05.3 situa o achado em **uma tela** — a do
Relatório. Lá existe uma única `textarea` para o conjunto; a duplicação real era
de **nome**, não de campo. Foi essa que saiu. As invariantes pedidas (uma
superfície, um estado, um valor na submissão) ficaram como teste permanente,
para que uma segunda cópia não possa reaparecer.

## 3 · `mandatory-filters` — GAP-D-1 FECHADO

O componente existia inteiro — três actions, validação — e **nenhuma rota o
renderizava**. `actions-have-callers` passava porque o próprio arquivo órfão
continha as strings que procurava.

Agora a Mesa o renderiza na etapa **PERFIL**, ao lado do Mapa: é o mesmo Perfil,
e o filtro obrigatório é parte do critério da paciente. Depois do reconhecimento
o Perfil é imutável, e o painel entra em leitura.

- allowlist de órfãos: **10 → 9**;
- `addMandatoryFilterAction` e `addPreferenceAction` promovidas para
  `FLUXO_COMPLETO`; a lista `ENTERRADAS` deixou de ter membros e saiu;
- `removeFilterAction` confirmada.

**A lição que fica escrita no código:** *import não é render*. A primeira
tentativa desta integração deixou o import sem o JSX — e `tsc` passou limpo. O
grafo de alcance não distingue os dois. Por isso a guarda decisiva
([`gap-d1-filtros-na-mesa`](../../tests/unit/gap-d1-filtros-na-mesa.test.ts)) lê
o **slot PERFIL da rota** e exige o JSX.

## 4 · Atomicidade

Provada sobre o banco real, pelos cortes da matriz CR (FIX-A/FIX-B):

- **antes** (CR-04, Perfil reconhecido): Case existe; seleção, decisão e conexão
  **não existem** — e o Case é verificado primeiro, para que as ausências não
  sejam verdadeiras por vacuidade;
- **depois** (CR-05): **exatamente uma** seleção, **exatamente três** opções sem
  profissional repetido, `composition_rationale` não vazio, `selected_by`
  preenchido;
- repetir o corte cria Cases distintos, cada um com uma seleção — nunca duas.

## 5 · Acessibilidade

- a justificativa do conjunto tem **rótulo real** nas duas telas (Mesa e
  Relatório): o título passou a ser o `label` do campo, sem mudar a copy;
- o que impede encerrar é lido junto com o botão (`aria-describedby`);
- o motivo do congelamento é **texto**, apontado pelos controles — não é a cor
  do desabilitado;
- o motivo da eliminação indisponível é apontado pelo botão que ele bloqueia.

## 6 · Provas de perda

| Mutação | Cai |
|---|---|
| **M-11-4** · JSX fora, import mantido | composição e props do painel |
| **M-11-5** · allowlist obsoleta reintroduzida | detector e contagem de nove |
| **M-11-6** · componente fora da rota | grafo, composição, props, detector |
| **M-11-7** · parecer e conjunto compartilhando estado | isolamento entre campos |
| **M-11-8** · persistência prematura (as duas camadas) | as três provas do C7 |
| **M-11-9** · rótulo desassociado | as quatro provas do D2-4/C8 |

**Ressalva declarada:** M-11-4 **não** derruba `actions-have-callers`. O grafo
prova *import*, não *render* — um componente importado e não renderizado
continua sendo capacidade enterrada com aparência de integrada. É precisamente a
lacuna que a guarda de composição cobre, e fica nomeada aqui para não ser
redescoberta como surpresa.

**Achado de método:** M-11-7 e M-11-8 **sobreviveram** na primeira execução. Não
havia teste que as matasse — o isolamento entre campos não era verificado, e o
teste do C7 clicava num botão desabilitado, o que não exercita a guarda interna.
Os testes foram escritos **depois** da mutação sobreviver, que é o único momento
em que se sabe que eles provam alguma coisa.

## 7 · Testes

`T-11-1` a `T-11-9` completos. Camadas: componente (C6, C7, C8, C4, D2-4,
isolamento, ciclo de vida), unitário (C6 no servidor, alcance dos filtros),
integração (atomicidade sobre o banco real).

## 8 · O que este bloco NÃO fez

- **Bloco 12 (Fila) — pendente por inteiro.** Nada aqui adianta grupos, ordem,
  prazo ou urgência;
- nenhuma migration: **ledger 121**, sem SQL, policy ou grant no delta;
- nenhuma transição ou permissão nova — C8 apenas **lê** marcos que já existiam;
- **medição mobile não executada** nesta passagem (ver §9).

## 9 · Limite honesto desta entrega

A medição de viewport em 1440/768/390 sobre a rota real **não foi executada**.
Foi tentada e bloqueada por falta de cenário, não por decisão: o servidor local
subiu, e a sondagem do banco devolveu **zero** `curated_selections` — sem Case
com seleção não existe Mesa a medir. As contas presentes são resíduo sintético
de e2e (`connection-e2e-admin-*`), sem senha conhecida. Chegar lá exige
`seed:mesa:local` + `bootstrap:test-users:local` e um fluxo de login.

Não há defeito conhecido de layout introduzido pelo Bloco 11 — as mudanças são
de estado `disabled`, de rótulo e de um painel adicional na etapa PERFIL —, mas
isso é **inferência, não medição**, e fica registrado como tal para uma passagem
própria, com o cenário semeado antes.
