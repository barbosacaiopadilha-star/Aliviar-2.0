# Portal do Curador — registro de implementação

**Estado**: em construção (MISSÃO 100 — ÉPICO 1). Dados de demonstração; sem integração com banco, autenticação ou serviço externo.

**O que é.** O ambiente onde acontece a Curadoria Aliviar. Não é um painel administrativo — é a ferramenta de trabalho de quem conduz conversas difíceis (`docs/EXPERIENCE_BIBLE.md` §3).

**Onde vive hoje.** Rota `/portal-curador`, aberta no middleware enquanto usa dados mockados. O `/curador` atual permanece intocado, exigindo autenticação real e lendo o banco. Quando a integração acontecer, este Portal assume `/curador` e a entrada em `PUBLIC_PREFIXES` sai.

**Regra de existência.** Nenhum componente existe para preencher espaço. Todo componente em `src/components/curadoria/` declara, no topo do arquivo, de qual documento canônico nasceu — e a suíte quebra se não declarar (`tests/unit/curadoria-portal-traceability.test.ts`).

---

## Convenção de rastreabilidade

Cada componente traz, no bloco de comentário inicial:

```
@metodo <Fonte> §<seção> — <por que este comportamento existe>
```

Fontes válidas e seus documentos:

| Fonte | Documento |
|---|---|
| `Fundamentos` / `Método` | [`FUNDAMENTOS_DO_METODO_ALIVIAR.md`](FUNDAMENTOS_DO_METODO_ALIVIAR.md) |
| `Ontologia` | [`ONTOLOGIA_CURADORIA_COMPARTILHADA.md`](ONTOLOGIA_CURADORIA_COMPARTILHADA.md) |
| `Experience` | [`EXPERIENCE_BIBLE.md`](EXPERIENCE_BIBLE.md) |
| `Engine` | [`CURATION_ENGINE_SPECIFICATION.md`](CURATION_ENGINE_SPECIFICATION.md) |

Além da anotação, cada componente responde em prosa a **"Por que existe"** e **"O que nunca faz"** — também verificado por teste.

---

## Módulos

| # | Módulo | Rota | Estado |
|---|---|---|---|
| 1 | Painel Inicial | `/portal-curador` | **Implementado** |
| 2 | Consulta Inicial | `/portal-curador/casos/[id]/consulta` | Pendente |
| 3 | Perfil de Prioridades | `/portal-curador/casos/[id]/consulta` | Pendente |
| 4 | Curadoria Técnica | `/portal-curador/casos/[id]/curadoria` | Pendente |
| 5 | Relatório | `/portal-curador/casos/[id]/relatorio` | Pendente |
| 6 | Entrega | `/portal-curador/casos/[id]/entrega` | Pendente |

---

## Módulo 1 — Painel Inicial

### Qual problema do Curador esta tela resolve?

> **"Eu tenho seis pessoas em andamento. Por onde eu começo agora?"**

A tela existe para responder essa única pergunta. Tudo que não ajuda a respondê-la ficou de fora.

### Decisões de método tomadas nesta tela

| Decisão | Origem |
|---|---|
| **Nenhuma métrica de produtividade** — sem total de casos, tempo médio, gráfico de volume ou "parado há N dias" | Experience §3 — "Nenhum painel de métricas. A pressa é inimiga direta do Método" |
| **Ordenação por quem precisa de você**, não por data: bloqueio → alerta → ação → aguardando | Experience §5 (UX3) e §3 |
| **Casos aguardando o paciente vão para o fim**, com rótulo "Acompanhar — sem cobrar" em vez de botão de ação | Experience §2.6 — insistência é vetor de indução |
| **Uma única próxima ação por caso**, nomeada pelo que faz | Experience §5 (UX1, UX3) |
| **Alertas carregam o código da exceção** (E-02, C-01) e nunca sugerem a resolução | Engine §9 e §4.5 — o Motor nomeia, quantifica e para |
| **Prazo aparece como "retorno combinado"**, nunca como contagem regressiva | Experience §2.4 e §5 (UX9) |
| **Atividades nomeiam o autor**, inclusive quando é o Sistema | Engine §5.6 — trilha sempre com autor e instante |
| **Saudação por nome, sem exclamação** | Brand — serena, acolhedora sem informalidade excessiva |

### O que deliberadamente **não** existe aqui

- Contador de casos concluídos no mês.
- Gráfico de qualquer espécie.
- Badge de "urgente".
- Ação em massa (selecionar vários casos).
- Busca — com seis casos, busca é ruído; entra quando o volume justificar.

---

## Componentes

Todos em `src/components/curadoria/`, desacoplados e reutilizáveis entre módulos.

| Componente | Responsabilidade | Usado em |
|---|---|---|
| `MethodStepper` | Indicar em qual das sete etapas do raciocínio o caso está. Variantes `compact` (cabeçalho de card) e `full` (topo de tela de trabalho). Nunca mostra percentual — voltar de etapa não é retrocesso. | M1, M2, M4 |
| `CaseAlert` | Exibir uma exceção nomeada do Motor, com código rastreável, descrição e severidade. Nunca sugere resolução. | M1, M4 |
| `CaseCard` | Resumir um caso no Painel com etapa, situação, pendências, alertas e a única próxima ação. | M1 |
| `ActivityFeed` | Listar eventos recentes do catálogo do Motor, sempre com autor nomeado. | M1 |

---

## Dados de demonstração

`src/modules/curadoria/portal/mock-data.ts` — seis casos cobrindo as sete etapas e as exceções que importam, inclusive as desconfortáveis:

- **caso-2029** dispara `E-02` (menos de três elegíveis) — o Portal precisa saber mostrar o Método se recusando a entregar algo mal fundamentado.
- **caso-2033** dispara `C-01` (empate) — o Motor não desempata.
- **caso-2038** tem um Perfil validado real, com nota de validação escrita como o Curador escreveria.
- **caso-2024** está com o paciente — testa a regra de não cobrar.

Os mocks obedecem aos invariantes da Ontologia, e isso é verificado por teste (`tests/unit/curadoria-portal-mock-data.test.ts`): peso sem evidência, Perfil validado que não soma 100, ou faixa incoerente com o score quebram a suíte. Um mock que viola o Método ensina o comportamento errado — e depois o código nasce para servir a tela.

---

## Verificações do Módulo 1

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` | Sem erros nos arquivos novos |
| `next lint` | Sem avisos ou erros |
| Testes de unidade | 26 novos; suíte completa 700 passando |
| Console do navegador | Sem erros |
| Responsividade | Sem overflow horizontal em 375px e 1265px; cards empilham no mobile |
| Rastreabilidade | Todos os componentes com anotação `@metodo` válida (verificado por teste) |

---

## Pendências conhecidas

1. **Rotas de destino ainda não existem** — os botões do Painel apontam para `/casos/[id]/consulta`, `/curadoria`, `/relatorio` e `/entrega`, que chegam nos Módulos 2 a 6. Hoje resultam em 404.
2. **Sem navegação entre módulos** — o cabeçalho só volta ao Painel. A navegação lateral entra quando houver mais de uma tela para navegar.
3. **Sem estado de lista vazia** — um Curador sem nenhum caso ainda não tem tela. Entra com o Módulo 2.
4. **`prefers-reduced-motion`** — não há animação nesta tela, então nada a respeitar ainda; a regra passa a valer nos módulos com transição.

---

# Curator Operating System (COS) — MISSÃO 101

O cérebro operacional da Curadoria. Enquanto o Portal (MISSÃO 100) é a
superfície, o COS é a lógica que sabe conduzir o Método.

**Princípio central**: o Portal conduz o Método; o Curador conduz o paciente.
O COS nunca avança uma fase sozinho, nunca decide e nunca impede o Curador de
voltar — informar é o oposto de controlar.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| `cos/types.ts` | A Memória da Curadoria: um registro único de onde tudo é reconstruível. |
| `cos/phases.ts` | As nove fases como dado canônico — objetivo, critérios de entrada/saída, informações, artefatos, estados, validações, alertas, exceções e rastreabilidade. |
| `cos/conduction.ts` | **Motor de Condução** — responde as cinco perguntas. Puro e determinístico. |
| `cos/memory.ts` | Linha do tempo e **teste de reconstrução** (as nove perguntas da auditoria). |
| `cos/mock-records.ts` | Três Memórias de demonstração, em fases diferentes. |

Nenhum arquivo do COS importa banco, rede ou data do sistema. A mesma Memória
sempre produz a mesma condução — verificado por teste.

## As nove fases

Cada fase declara a **etapa do raciocínio** (Fundamentos §5.2) que materializa.
É assim que o COS permanece ancorado no Método em vez de virar um fluxo
paralelo.

| # | Fase | Raciocínio |
|---|---|---|
| 1 | Acolhimento | Compreender |
| 2 | História | Compreender |
| 3 | Caso | Estruturar |
| 4 | Filtros | Estruturar |
| 5 | Perfil de Prioridades | Priorizar |
| 6 | Validação | Priorizar |
| 7 | Curadoria Técnica | Comparar |
| 8 | Relatório | Justificar |
| 9 | Devolutiva | Apresentar |

## Motor de Condução — as cinco respostas

| Pergunta | Como responde |
|---|---|
| Onde estou? | Primeira fase não concluída — nunca a mais avançada com algum dado, porque voltar é legítimo no Método. |
| O que já foi concluído? | Fases cujos critérios de saída foram atendidos. Lista, nunca percentual. |
| O que falta? | Critérios de saída não atendidos da fase atual, em linguagem de meta. |
| Qual é o próximo passo? | Exatamente um. Um alerta de bloqueio assume o próximo passo. |
| Inconsistências e pendências? | Códigos I-xx do Motor e pendências sempre com dono nomeado. |

Detecta hoje: **I-01, I-02, I-03, I-04, I-05, I-09, I-10, I-11, I-12** e os
alertas **E-01, E-02, C-01, C-05, C-06**.

Duas decisões de redação que evitam ruído:

- **I-01 só é inconsistência depois da validação.** Antes disso, "faltam 15
  pontos" é trabalho em andamento e já aparece como critério de saída.
- **Nenhuma pendência é criada para a fase atual do Curador** — "o que falta"
  já responde. Repetir a mesma frase em duas seções é ruído, e ruído em um
  copiloto é pior que silêncio.

## Memória e teste de reconstrução

`buildMemory` monta a linha do tempo com autor e instante em cada entrada —
inclusive quando o autor é o Sistema, o que torna visível no uso diário a
fronteira entre o que a máquina fez e o que uma pessoa decidiu.

`runReconstructionTest` roda as nove perguntas do Engine §5.6. **A pergunta 5
falha de propósito** em todos os casos: o registro guarda o resultado da
análise, não o estado do cadastro no momento do cálculo (divergência 13 da
especificação do Motor). Um teste garante que essa lacuna continue visível até
ser resolvida — nunca esquecida.

## Telas

| Rota | Resolve |
|---|---|
| `/portal-curador/casos/[id]` | "Onde eu parei, o que falta, e o que eu faço agora?" |
| `/portal-curador/casos/[id]/[fase]` | "O que exatamente esta fase espera de mim, e por quê?" |

A tela de fase é **inteiramente dirigida por `COS_PHASE_DEFINITIONS`** — objetivo,
critérios, regras e rastreabilidade vêm da definição canônica, nunca de texto
escrito na tela. Mudar o Método muda a tela; nunca o contrário.

## Componentes novos

| Componente | Responsabilidade |
|---|---|
| `ConductionPanel` | As cinco respostas do Motor de Condução. |
| `PhaseNavigator` | As nove fases com estado e, no bloqueio, o motivo. |
| `MemoryTimeline` / `ReconstructionReport` | A Memória e o teste de reconstrução. |

## Caso de ensino deliberado

O caso de Marina (`caso-2041`) tem a **mesma fala registrada como filtro
obrigatório e como critério com peso**. O Motor detecta I-03 e devolve em
linguagem de pessoa: *"Acompanhamento contínuo está como filtro obrigatório e
como critério com peso ao mesmo tempo. Ou elimina, ou pesa."* É o tipo de
engano real que acontece quando a conversa flui, e o COS precisa saber apanhá-lo.

## Verificações

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` | Sem erros nos arquivos novos |
| `next lint` | Sem avisos ou erros |
| Testes | 38 novos (28 condução + 10 memória); suíte completa 744 passando |
| Console do navegador | Sem erros |
| Determinismo | Verificado por teste em todas as Memórias |

## Pontos de integração futura

1. **Banco** — `CuradoriaRecord` é o contrato: a migration da MISSÃO 002 cobre Perfil, pesos, evidências, compatibilidade e seleção; faltam tabelas para Acolhimento, Caso, Relatório e Devolutiva.
2. **Autenticação** — `/portal-curador` sai de `PUBLIC_PREFIXES` e passa a exigir `curador_medico`.
3. **Motor de Compatibilidade real** — `method.ts` (MISSÃO 002) já existe e é puro; basta alimentá-lo com o cadastro real em vez do mock.
4. **Eventos** — a Memória é montada a partir do registro; a trilha append-only do Engine §7 substitui essa derivação quando existir.
5. **Estado histórico do Perfil Médico** — pendência estrutural que a pergunta 5 do teste de reconstrução mantém visível.

## Pendências do COS

1. **Telas de trabalho das fases** (Módulos 2 a 6) — hoje cada fase mostra sua definição operacional, não a interface de execução.
2. **Sem escrita** — nada é editável ainda; o COS lê a Memória e conduz, mas não registra.
3. **Exceções E-05, E-07, E-08, E-09, E-12** ainda não detectadas.
4. **Inconsistências I-06, I-07, I-13** ainda não verificadas.
