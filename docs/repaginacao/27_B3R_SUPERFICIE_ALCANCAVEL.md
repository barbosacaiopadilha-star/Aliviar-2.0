# 27 · B3-R — contrato de superfície alcançável

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-11 |
| **Natureza** | contrato arquitetural vinculante. **Zero código, zero migration** |

## A · Pré-flight

**Branch** `d9-primeiro-encontro` · **HEAD** `603c4f5` · **53 commits à frente** de
`origin/main` · árvore limpa exceto `?? AGENTS.md` e
`?? docs/repaginacao/foundation/FOUNDATION_VERIFICATION.md`, **pré-existentes e
intocados**.

---

## B · A composição real da rota

```
/paciente/curadoria/page.tsx        (Server Component)
├─ requireRole("paciente")
├─ getLatestFinalCuradoriaDeliveryForPatient()   → delivery (legado)
├─ loadPatientCuradoria()                        → curadoria  ← TRAZ A DECISÃO
├─ SupabaseConnectionRepository.findByCaseId()   → connection
├─ SupabaseRelationshipRepository.findByCaseId() → relationship
│
├─ blocoAcompanhamento   { caseId && options.length > 0 }
│    ├─ <Limiar nome={connection ? "Seu acompanhamento" : "A decisão"} />
│    ├─ <RelationshipStatusPanel/>   { relationship }
│    ├─ <ConnectionChoicePanel/>     ← SEMPRE
│    └─ <ContactModePanel/>          { connection }
│
└─ blocoMesa             { curadoria }
     ├─ <CaminhosPanel/> → FaixaDoComum · CartaCaminho ×3 · ComparacaoCaminhos
     └─ link "Levar em PDF"
```

Ordem: `varandaPrimeiro ? [acompanhamento, mesa] : [mesa, acompanhamento]`.
`varandaPrimeiro = Boolean(relationship)`.

> **`CuradoriaDecisionPanel` não aparece em lugar nenhum desta árvore.**

## C · Onde `decided` nasce — e até onde chega

**Nasce em `loadPatientCuradoria`** ([patient-curadoria.ts:109](../../src/modules/curadoria/patient-curadoria.ts:109)):
consulta `patient_curadoria_decisions` e devolve
`{ outcome, chosenName, decidedAt } | null`.

**Chega até:** `CaminhosPanel`, **e só para esconder dois parágrafos** — a
"Conversa Consigo" e o convite *"a escolha está logo adiante"*.

> ### O tipo já é exatamente o que o painel órfão pede
>
> `PatientCuradoria["decision"]` e a prop `decided` são **estruturalmente
> idênticos**. A rota carrega o fato, entrega-o a um componente que só o usa
> para ocultar texto, e **descarta-o**.

## D · Por que o painel ficou fora

**Não foi esquecimento. Foi decisão anterior, escrita em três lugares:**

| Onde | O que diz |
|---|---|
| [caminhos-panel.tsx:20](../../src/components/paciente/caminhos/caminhos-panel.tsx:20) | *"a escolha continua sendo um ato só, **registrado na Connection**"* |
| [caminhos-panel.tsx:117](../../src/components/paciente/caminhos/caminhos-panel.tsx:117) | *"(A saída 'nenhum dos três' pertence ao domínio e está registrada como **candidata à v1.1** — nenhuma superfície nova nesta fase.)"* |
| [DOMAIN_CONNECTION_RELATIONSHIP.md](../architecture/DOMAIN_CONNECTION_RELATIONSHIP.md) | *"**Connection** (pontual): **registrar a decisão final do paciente** e o primeiro contato"* |

E a raiz documental está numa tabela de ADR que se contradiz na linha seguinte:

```
| decisão da paciente | connection_records (+ patient_curadoria_decisions) | tabela |
…
**Nenhum fato tem duas fontes concorrentes.**
```

> **A primeira linha lista duas fontes para um fato, e o parágrafo seguinte
> afirma que isso não acontece.** É daí que o órfão nasceu.

## E · `ConnectionChoicePanel` — provado pelo código

| | |
|---|---|
| **pergunta** | *"Com quem você gostaria de seguir?"* |
| **opções** | **os três profissionais. Nada mais** |
| **actions** | `createConnectionAction` · `correctChoiceAction` |
| **fato** | **`connection_records`** + `connection_events` |
| **momento** | sob o `Limiar` **"A decisão"**, depois da Mesa |
| **pré-requisito** | entrega reconhecida (`findDeliveredCuradoria`) — **não** exige decisão canônica |
| **reversível** | ✅ **sim** — `correctChoice` enquanto `DECISAO_REGISTRADA` |
| **idempotente** | ❌ **não** — segunda criação devolve *"Este Caso já possui um Connection registrado."* |
| **efeito de responsabilidade** | ❌ **nenhum** — `resolveCurrentResponsible` **não lê** `connection_records` |
| **Home / Jornada** | **não o interpretam** — zero leitura fora de `/coa/concierge` e da Caixa de Continuidade |
| **natureza** | **continuidade operacional** — abre modo de contato, primeiro atendimento e o nascimento do Relationship |

> ### A copy pode ser confundida com a decisão? — **Ela já é.**
>
> O `Limiar` acima dele diz literalmente **"A decisão"**. A paciente executa o
> ato que a página chama de decisão, e o modelo de responsabilidade **não se
> move**: `resolveCurrentResponsible` continua devolvendo *Curador*, para
> sempre.
>
> **Não é risco de confusão. É um falso rótulo de decisão em produção.**

## F · `CuradoriaDecisionPanel` — provado pelo código

| | |
|---|---|
| **pergunta** | *"Sua decisão"* |
| **opções** | os três **+ "Nenhuma destas serviu para mim"**, com o mesmo peso visual |
| **action** | `registerDecisionAction` |
| **fato** | **`patient_curadoria_decisions`** |
| **chave** | `curated_selection_options.id` |
| **reversível** | ❌ **não** — append-only, sem UPDATE, sem DELETE |
| **efeito de responsabilidade** | ✅ **é o único** — Curador → Concierge/Equipe Aliviar |
| **estados** | formulário · feedback imediato (`registrado`) · **durável** (`decided`) · erro com `role="alert"` |
| **CTA final** | *"Falar com a Aliviar"* — `whatsappHref("duvida")`, canal já existente |

**Props: já existem na rota, todas.** `curatedSelectionId`, `options[].id`,
`options[].professionalName`, `decision`.

> **Nenhum loader novo. Nenhum motor novo. Nenhuma consulta nova.**

## G · A diferença entre os dois fatos

| | decisão canônica | conexão |
|---|---|---|
| **o que ela decide** | *"esta Curadoria me serviu — e este é o caminho"* **ou** *"nenhuma serviu"* | *"quero começar com esta pessoa, e assim"* |
| **fecha** | o ciclo da Curadoria | nada — **abre** a operação |
| **recusa possível** | ✅ `NONE_OF_THEM` | ❌ **estruturalmente impossível** |
| **reversível** | não | sim, até o contato |
| **move responsabilidade** | **sim** | não |

**Os dois atos são distintos, e nenhum é dispensável.** A conexão carrega modo
de contato, primeiro atendimento, Relationship e a Caixa de Continuidade — nada
disso existe no fato canônico. O fato canônico carrega a recusa legítima e o
handoff — nada disso existe na conexão.

> **A duplicação real é só uma: nomear qual das três pessoas.** É a única coisa
> que as duas superfícies perguntam igual — e é o que não pode ser perguntado
> duas vezes.

## H · Arquitetura escolhida — **E**

> ### E · Consolidação em uma única superfície de escolha, preservando os dois fatos de domínio
>
> **A pessoa é nomeada UMA vez, no fato canônico. A conexão deixa de perguntar
> *com quem* e passa a tratar apenas do *começar*.**

**As quatro regras vinculantes:**

| # | Regra |
|---|---|
| **H1** | `CuradoriaDecisionPanel` é a **única** superfície que oferece os três caminhos **+ "nenhuma destas"** |
| **H2** | Havendo Curadoria do Método, `ConnectionChoicePanel` **nunca** recebe mais de um profissional: recebe **o já decidido** (ou, sem decisão, **o do próprio `connection`**) |
| **H3** | `outcome = NONE_OF_THEM` → **nenhuma superfície de conexão**. Perguntar *"com quem seguir?"* a quem disse que nenhuma serviu é incoerente e cruel |
| **H4** | **Caminho legado** (`!curadoria && delivery`): `ConnectionChoicePanel` mantém os três e a correção completa. **Nada muda para quem só tem o documento antigo** |

**Consequência que declaro abertamente:** no caminho canônico, corrigir a
conexão **para outro profissional** deixa de ser oferecido — contradiria um fato
append-only. O caminho legítimo de mudar de rumo continua sendo **uma nova
seleção curada** ([26 §Q](26_B3A_DECISAO_SEGUNDO_ENCONTRO_HANDOFF.md)). Trocar o
*modo de contato* e encerrar sem relacionamento **permanecem**.

## I · Alternativas rejeitadas

| | Por que não |
|---|---|
| **A** substituir | apaga modo de contato, primeiro atendimento, Relationship e a Caixa de Continuidade. **§12 proíbe** |
| **B** canônica antes, conexão depois **como está** | a paciente escolheria entre os três **duas vezes**. Dupla decisão |
| **C** conexão antes, canônica depois | `NONE_OF_THEM` ficaria inalcançável, e o handoff chegaria **depois** do início operacional |
| **D** mutuamente exclusivas | quem entrasse pela conexão **nunca** produziria o fato canônico — o handoff não aconteceria justamente para quem agiu |
| **F** outra | não foi necessária: **E** cabe sem tabela nova, sem motor novo e sem tocar no writer |

## J · Ponto exato de inserção

**Dentro de `blocoAcompanhamento`, sob o `Limiar` que já se chama "A decisão".**

```
blocoAcompanhamento
├─ <Limiar/>
├─ <RelationshipStatusPanel/>        { relationship }
├─ <CuradoriaDecisionPanel/>         ◀── AQUI  { curadoria }
├─ <ConnectionChoicePanel/>          { legado || decision?.outcome === "CHOSEN" || connection }
└─ <ContactModePanel/>               { connection }
```

| Pergunta do §6 | Resposta |
|---|---|
| acima ou abaixo de `CaminhosPanel` | **abaixo** — `blocoMesa` vem antes quando não há varanda; ela lê os três, depois decide |
| antes ou depois de `ConnectionChoicePanel` | **antes**, sempre |
| dentro ou fora de `FinalCuradoriaView` | **fora** — aquilo é o documento legado |
| em relação a `RelationshipStatusPanel` | **abaixo** — a varanda é o presente e abre a página |
| em relação a `ContactModePanel` | **acima** — modo de contato pressupõe conexão, que pressupõe decisão |
| desktop | `max-w-[44rem] space-y-8`, mesma coluna dos irmãos |
| **390px** | `Card` fluido; rádios, textarea e botão empilham. **Sem largura fixa, sem tabela, sem overflow** |
| evitar que fique quilômetros abaixo | o `Limiar` **"A decisão"** já é a âncora, e `CaminhosPanel` já escreve *"a escolha está logo adiante"*. **Proibido barra fixa ou CTA flutuante** — pressionaria |
| rever os três antes de decidir | `blocoMesa` fica **acima** e **continua acessível depois** — nada fecha atrás dela |
| decidido visível sem dominar | o estado durável é **um card compacto**. Havendo `relationship`, **é omitido**: a varanda é o foco único, conforme a doutrina já escrita na página |

**Master Visual preservado:** nenhum `Limiar` novo, nenhuma seção nova, nenhum
token novo.

## K · Matriz de visibilidade

| | Estado | Responsável | `CuradoriaDecisionPanel` | Forma | `ConnectionChoicePanel` | Três caminhos | WhatsApp | Próximo passo comunicado |
|---|---|---|---|---|---|---|---|---|
| **R1** | não entregue | Curador | ❌ | — | ❌ | ❌ | ❌ | *"Ainda não há relatórios aqui."* |
| **R2** | entregue, sem decisão, sem conexão | Curador | ✅ | **formulário** | ❌ | ✅ | ❌ | *"registre quando você estiver pronta"* |
| **R3** | entregue, sem decisão, **com** conexão | Curador | ✅ | **formulário** | ✅ **só progresso**, um profissional | ✅ | ❌ | decidir; a continuidade existente **nunca é escondida** |
| **R4** | decisão, sem conexão | **Concierge** | ✅ | **decidido** | `CHOSEN` ✅ (1 opção) · `NONE_OF_THEM` ❌ | ✅ | ✅ | *"a próxima etapa passa a ser acompanhada pela Equipe Aliviar"* |
| **R5** | decisão **e** conexão | **Concierge** | ✅ decidido¹ | **decidido** | ✅ progresso | ✅ | ✅ | o estado da conexão |
| **R6** | erro ao decidir | Curador | ✅ | **formulário + `role="alert"`** | inalterado | ✅ | ❌ | a escolha e a nota **permanecem** |
| **R7** | recém-registrada, antes da reprojeção | Curador→Concierge | ✅ | **feedback `aria-live`** | inalterado | ✅ | ❌ | *"Agora a Aliviar pode seguir com os próximos passos."* |

¹ **omitido quando existe `relationship`** — um foco perceptivo por vez.

## L · Props e dados

| Prop | Origem | Novo? |
|---|---|---|
| `curatedSelectionId` | `curadoria.curatedSelectionId` | ❌ |
| `options` | `curadoria.options.map(o => ({ id: o.id, professionalName: o.professionalName }))` | ❌ |
| `decided` | **`curadoria.decision`** — tipo já idêntico | ❌ |

| Regra | |
|---|---|
| **L1** | **nenhuma segunda consulta.** O loader já traz o fato |
| **L2** | `decided` **nunca** vem de `connection_record`, de contato ou de comparação |
| **L3** | o transitório (`registrado`) **não** é fonte da verdade — `decided` é |
| **L4** | `router.refresh()` reexecuta o Server Component; a rota permanece **server-authoritative** |
| **L5** | zero estado local duplicado: a escolha decidida **não** é espelhada em `useState` |
| **L6** | `ConnectionChoicePanel` recebe `providerPresentations` **filtrado**, no call site. **Sem alterar o componente** |

## M · Responsabilidade

**Inalterada, e já correta.** `resolveCurrentResponsible` guarda por
`!devolutiva.decision` **antes** da fase. `connection_records`, `deliveredAt`,
`presentedAt`, `emittedAt`, `meetingHeldAt` e comparação **não** movem ninguém.
**Nenhum motor de handoff novo.**

## N · Testes permanentes

| # | Prova | Como |
|---|---|---|
| **T-B3-R1** | a **rota real** renderiza a superfície canônica quando entregue e sem decisão | render da composição de `/paciente/curadoria` |
| **T-B3-R2** | o clique **na rota real** chama `registerDecisionAction` | idem, action espionada |
| **T-B3-R3** | refresh da rota real consome `decided` | fato semeado → estado durável |
| **T-B3-R4** | decisão existente **não** reapresenta formulário nem oferece desfazer | idem |
| **T-B3-R5** | os três caminhos continuam acessíveis **depois** de decidir | `CaminhosPanel` presente em R4/R5 |
| **T-B3-R6** | `ConnectionChoicePanel` **não** cria decisão canônica | integração: criar conexão → `patient_curadoria_decisions` vazia |
| **T-B3-R7** | `connection_record` **não** faz handoff sem decisão | `resolveCurrentResponsible` → `curador` |
| **T-B3-R8** | decisão faz handoff **sem** `connection_record` | → `concierge` |
| **T-B3-R9** | 390px: decisão alcançável, `scrollWidth <= clientWidth` | e2e |
| **T-B3-R10** | **alcançabilidade permanente** — ver §P | estático **+** composição |

> **T-B3-R1..R5 são proibidos de importar `CuradoriaDecisionPanel`
> diretamente.** Precisam atravessar a rota. Importá-lo é repetir o falso
> positivo.

## O · Mutação M7

**Remover o call site de produção do painel canônico em `page.tsx`.**

**Esperado: T-B3-R1 e T-B3-R10 caem.** `b3-ui-decisao.test.tsx` (708 verdes) e
`b3-decisao-persistencia.integration.test.ts` (10 verdes) **continuam passando** —
e é exatamente por isso que M7 é a prova que faltava.

## P · GAP-B3-2 — SUPERFÍCIE CANÔNICA ÓRFÃ

> ⚠️ **Renumeração declarada:** o GAP-B3-2 registrado em
> [21](21_DECISOES_NECESSARIAS.md) — *"a decisão persiste sem feedback"* — foi
> **fechado em `603c4f5`**. Esta missão reatribui a etiqueta ao achado atual.
> Registro a troca em vez de silenciá-la.

### Por que nada viu

| Suíte | Por que passou |
|---|---|
| **708/708 componentes** | `b3-ui-decisao.test.tsx` **importa e renderiza o painel diretamente**. Prova que o componente funciona — nunca que alguém o alcança |
| **B3 integração 10/10** | chama `registerPatientDecision` / `registerDecisionAction` **pelo repositório**. Prova o fato — nunca o caminho |
| **M1–M6** | mutam o painel e o writer, e são pegas por testes que **já** importam o painel. **Nenhuma mutou a composição da rota** |
| **`actions-have-callers`** | 🔴 **a causa raiz** |

```ts
const callerSources = CALLER_DIRS.flatMap(walk)   // src/app + src/components
  .map((file) => readFileSync(file, "utf8")).join("\n");
expect(callerSources.includes(action)).toBe(true);
```

> **O teste concatena `src/components` inteiro numa string.** O próprio arquivo
> órfão contém `registerDecisionAction` — então ele **satisfaz a própria
> verificação**. Um componente que ninguém importa prova que a action tem
> chamador.
>
> **A classe de teste que faltava: alcançabilidade — não existência.**

### Condição objetiva de fechamento

**As quatro, juntas:**

1. `/paciente/curadoria` renderiza `CuradoriaDecisionPanel` em R2/R3;
2. **T-B3-R1** verde, atravessando a composição real, **sem importar o painel**;
3. **M7** derruba pelo menos um teste;
4. **T-B3-R10** falha se qualquer componente que chama uma action de
   `src/modules/curadoria/actions.ts` deixar de ser importado, transitivamente,
   por um arquivo de `src/app`.

## Q · Arquivos que o Engenheiro altera

| Arquivo | O quê |
|---|---|
| [`src/app/paciente/curadoria/page.tsx`](../../src/app/paciente/curadoria/page.tsx) | **único de produção** — importar, renderizar, aplicar H2/H3/H4 |
| `tests/e2e/b3r-decisao-alcancavel.spec.ts` | **novo** — T-B3-R1..R5, R9 |
| [`tests/unit/actions-have-callers.test.ts`](../../tests/unit/actions-have-callers.test.ts) | T-B3-R10 — grafo de import, não busca em string |
| [`tests/e2e/connection-choice.spec.ts`](../../tests/e2e/connection-choice.spec.ts) | ⚠️ a fixture passa a registrar a decisão antes |
| [`tests/apoio/apoio-curadoria-entregue.ts`](../../tests/apoio/apoio-curadoria-entregue.ts) | opção `decidir` |
| [`docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`](../architecture/DOMAIN_CONNECTION_RELATIONSHIP.md) | corrigir *"registrar a decisão final do paciente"* |
| `docs/DECISIONS.md` | **ADR nova** — a fronteira dos dois fatos, e a correção da linha que lista duas fontes |

**Nada em `supabase/`. Nada em `src/modules/`.**

## R · Riscos de regressão

| Risco | Gravidade | Mitigação |
|---|---|---|
| `connection-choice.spec.ts` (8/8) quebra — a fixture não tem decisão | 🔴 **alta, certa** | atualizar a fixture; **é o novo fluxo, não um defeito** |
| pacientes reais em R3 perderem a continuidade | 🟠 média | H2 + matriz: progresso **nunca** escondido |
| correção para outro profissional some no caminho canônico | 🟠 média | **consequência declarada** de um fato append-only; nova seleção é a via |
| rádio de uma opção só parecer estranho | 🟡 baixa | o Engenheiro pode apresentar como afirmação em vez de rádio — **não muda o contrato** |
| `NONE_OF_THEM` deixar a página sem próximo passo visível | 🟠 média | o card decidido já traz a frase e o *"Falar com a Aliviar"* |
| dois `Limiar` "A decisão" | 🟡 baixa | **não criar Limiar novo** |

## S · Gaps preservados

**Intocados, por §12:** D-10 · D-11 residual · GAP-D12-C1 · Concierge nominal ·
automação de WhatsApp · comparação B2 · writer · fato canônico · tabela nova ·
motor de handoff.
**Aberto de [26](26_B3A_DECISAO_SEGUNDO_ENCONTRO_HANDOFF.md):** GAP-B3-1
(trilha de auditoria) e GAP-B3-3 (`presentedAt` acumulado).

---

# B3-R APROVADA PARA ENGENHARIA — A SUPERFÍCIE CANÔNICA TEM POSIÇÃO E RELAÇÃO DEFINIDAS

**Posição:** dentro de `blocoAcompanhamento`, sob o `Limiar` que **já se chama
"A decisão"**, acima de `ConnectionChoicePanel`.

**Relação:** arquitetura **E** — a pessoa é nomeada **uma vez**, no fato
canônico; a conexão deixa de perguntar *com quem* e trata só do *começar*. Os
dois fatos sobrevivem porque **guardam coisas diferentes**: a conexão guarda o
que a decisão não sabe (modo de contato, primeiro atendimento, Relationship); a
decisão guarda o que a conexão **não consegue expressar** — a recusa legítima e
o handoff.

**Um só arquivo de produção muda.** Todas as props já existem na rota — ela
carrega o fato desde sempre e o descarta.
