# 36 · Blocos 11/12 — D-6, a Mesa, a Fila e os casos reais

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-12 |
| **Base** | `b72223e` · ledger **121** · árvore com os dois `??` **pré-existentes**, intocados |
| **Natureza** | contrato vinculante. **Zero produção, zero teste, zero migration, zero RLS, zero evidência** |
| **Destinatário** | **`03 ENGENHEIRO`** |

---

## 1 · Pré-flight

HEAD `b72223e` ✓ · Tracks B, C, D e Bloco 7 encerrados ([29](29_B3_FECHAMENTO_TRACK_B.md), [31](31_TRACK_C_FECHAMENTO.md), [33](33_TRACK_D_FECHAMENTO.md), [35](35_BLOCO_7_FECHAMENTO.md)) ·
V-B7-1 e V-B7-5 fechados · ledger **121/121** ✓ · árvore só com os dois pré-existentes ✓ ·
**nenhuma pendência bloqueante herdada**.

## 2 · Quantitativo

| Cenário | Prompts |
|---|---|
| **melhor caso** | **4** |
| **previsão central** | **5** |
| **com uma remediação** | **6–7** |

**Ajustei para baixo, e o fato novo justifica:** a referência previa 3–4 prompts
para os Blocos 11/12 porque **D-6 era "o único item da Mesa com risco de
backend"**. A investigação do §3 mostra que **não há backend nenhum** — logo,
**Plano B, uma passagem** (§13).

Composição: **Blocos 11/12** (1 engenharia + 1 gate) → **passe final** (2) →
**certificação geral** (1).

**Caminho crítico:** este contrato → passe final → certificação. **Não há mais
nada entre eles.**

**Fora do encerramento atual:** D-5 · D-7 · D-8 · D-10 · `GAP-D-2` · `GAP-D-3` ·
`GAP-C-2` · `GAP-C-3` · `GAP-B3-COPY-ID` · GAP-D12-C1 · A3b/A4 · G-6 · V-D-1 ·
os três achados do detector · V-B7-2/3/4 · dívida do banco local.

## 3 · D-6, reconstruída — e a causa não é a que o nome sugere

| | |
|---|---|
| **problema observado** | *"Marcar os três e navegar para outra pergunta perde a seleção"* (C2) |
| **ator** | **o Curador** |
| **rota e estado** | `/portal-curador/casos/[id]/curadoria_tecnica`, Mesa aberta, seleção em curso |
| **dano hoje** | o trabalho de escolher e justificar **evapora** ao trocar de etapa. O Curador reescreve, ou evita navegar — e a Mesa de seis etapas vira uma etapa só |
| **decisão prévia** | *"Provavelmente C (action) — **verificar antes**: pode já haver onde gravar"* ([21](21_DECISOES_NECESSARIAS.md) D-6) |
| **natureza** | ⚠️ **superfície, não domínio.** Nem segurança, nem banco |

### 3.1 · Onde já se grava — e por que **não pode** guardar rascunho

`curated_selections` existe e é o alvo do writer real. **E ela recusa, por
construção, qualquer seleção parcial:**

```sql
composition_rationale text NOT NULL
constraint selection_rationale_not_blank check (btrim(composition_rationale) <> '')
selected_by uuid NOT NULL          -- "toda selecao tem autoria humana nomeada"
unique index curated_selections_one_active_per_profile
```

```ts
// method.ts:16 — validateSelection
if (ids.length !== REQUIRED_OPTION_COUNT)
  return { valid: false, error: "A Curadoria apresenta sempre exatamente três opções…" };
```

> **Gravar rascunho ali seria criar um fato a partir de um esboço**, e quebrar
> duas invariantes do Método de uma vez: *sempre exatamente três* e *toda
> seleção tem autoria e justificativa*.
>
> **Resposta a D-6: há onde gravar, e o lugar deve continuar all-or-nothing.**

### 3.2 · A causa real — provada em uma linha

```tsx
// mesa-shell.tsx:199
<div className="mt-6">{conteudo[etapaAtual]}</div>
```

`conteudo` é `Record<MesaEtapaId, ReactNode>`. React monta **apenas** a etapa
corrente. Trocar de etapa **desmonta** a anterior — e o `useReducer` de
`MesaWorkspace`, que guarda `selectedIds`, `pareceres`, `compositionRationale`,
`comparisonIds` e `log`, **morre junto**.

> ### D-6 não é uma tabela que falta. É um `unmount`.

### 3.3 · A resolução, vinculante

> **Elevar o estado da Mesa para acima do que desmonta.**
>
> O `mesaReducer` sai de dentro de `MesaWorkspace` e passa a viver num limite de
> cliente que **envolve** `MesaShell`. Trocar de etapa deixa de poder destruí-lo,
> porque o estado passa a morar acima da coisa que desmonta.

**Zero migration · zero action nova · zero fato novo.** `saveSelectionAction`
permanece o **único** writer, e continua all-or-nothing.

**⛔ Proibido `localStorage` para a Mesa.** Os rascunhos de parecer são **texto
de juízo clínico**; `localStorage` não é criptografado, sobrevive ao logout e é
por dispositivo. O precedente do `CaminhosPanel` vale para **memória de
navegação**, nunca para conteúdo.

**Limite honesto que fica:** recarregar a página ou sair da rota **ainda perde**
o rascunho. É aceitável e passa a ser **dito** — o botão de encerrar, sempre
visível (C7), nomeia o que falta para o trabalho virar registro.

## 4 · Os outros seis itens do Bloco 11

| # | Achado | Resolução vinculante |
|---|---|---|
| **C4** | dois vocabulários para o mesmo estado: contadores no topo × frase na barra | **uma origem, duas apresentações** — a frase **deriva** dos contadores. Nunca duas contagens |
| **C6** | justificativa da eliminação só é exigida no servidor | exigir **também no cliente**. ⛔ **a guarda do servidor não sai** |
| **C7** | *"Encerrar e gerar o Relatório"* só aparece com as 10 exigências satisfeitas | o botão **existe sempre**, **desabilitado**, com **o que falta** ao lado — `validateMesaClosure` já devolve `missing` |
| **C8** | relatório emitido aceita cliques que devolvem erro | ações **indisponíveis** quando congelado. **O produto já recusa corretamente** — falta a interface dizer antes |
| **C9** | atalhos existem e não se anunciam | dica de `?` junto ao botão de ajuda |
| **D2-4** | justificativa do conjunto **duas vezes na mesma tela** | **remover a segunda** |
| **§05.3** | o parecer **oferece** o juízo | a redação **propõe**; nada entra sem ato do Curador |

**⛔ Não alterar:** os quatro painéis · as seis etapas · a trilha · os juízos como
ato de domínio · G-2.3-5 · a gramática visual certificada.

## 5 · `mandatory-filters.tsx` — **integrar**, e este é o destino

[32](32_TRACK_D_LIMPEZA_E_CAPACIDADE_ENTERRADA.md) registrou `GAP-D-1` e nomeou o
Bloco 11 como destino. **Confirmo, e decido: integrar.**

| | |
|---|---|
| **onde** | etapa **`PERFIL`** da Mesa |
| **por quê ali** | o filtro é requisito **dela**, registrado no Perfil de Prioridades (`priorityProfileId`); o *efeito* aparece na Rede, mas o **ato** é do Perfil |
| **domínio** | ⛔ **nada muda** — `addMandatoryFilterAction`, `addPreferenceAction`, `removeFilterAction`, RLS e tabelas **já existem** |
| **prova exigida** | **alcançabilidade pela rota real** — o Curador registra um filtro percorrendo a Mesa, sem SQL |

> ⛔ **Proibido importar o componente só para satisfazer guarda.** A guarda
> `actions-have-callers` já passa hoje com ele órfão — foi exatamente esse falso
> positivo que enterrou a capacidade. **A prova é a rota, nunca a string.**

**Fecha `GAP-D-1`.** A allowlist do detector perde essa entrada.

## 6 · Bloco 12 — a Fila

**Objetivo:** agrupar por **ato devido**, nunca por data nem por prioridade
inventada.

**Projeção de leitura, derivada de fatos existentes** — mesmo padrão da Caixa de
Continuidade (NT-4): **nenhuma tabela de tarefa**, porque criá-la produziria um
segundo dono do Caso, concorrente com `cases`.

| Grupo | Fato que o define |
|---|---|
| **Aguarda Acolhimento** | Caso sem `understanding_confirmed_at` |
| **Aguarda o Primeiro Encontro** | Mapa preparado, `meeting_held_at is null` |
| **Aguarda o reconhecimento dela** | `meeting_held_at` presente, `validated_at is null` |
| **Curadoria em curso** | Perfil reconhecido, sem seleção encerrada |
| **Aguarda entrega** | Relatório emitido, `delivered_at is null` |
| **Aguarda a decisão dela** | entregue, sem `patient_curadoria_decisions` |
| **Com o Concierge** | decisão registrada |

⛔ **Sem SLA, sem "atrasado", sem cor de urgência, sem contagem de dias.** Não
existe regra temporal aprovada, e inventá-la seria criar SLA por conta própria —
doutrina herdada de `continuity-worklist` e da Track C.

## 7 · Regras operacionais — todas preservadas, e uma colide

| Regra | Situação |
|---|---|
| Curador responsável até a decisão | ✅ preservada — a Fila a **torna visível** |
| Concierge só depois da decisão | ✅ preservada — grupo próprio, último |
| 1º encontro prepara prioridades e preferências | ✅ — é onde `mandatory-filters` entra |
| análise entre os encontros | ✅ — é a Mesa |
| 2º encontro apresenta e entrega | ✅ intocado |
| **validação exige reunião realizada** | ⚠️ **colide — ver §8** |
| decisão append-only | ✅ intocada |
| Connection não é o fato da decisão | ✅ intocada |
| nenhuma identidade de Concierge inventada | ✅ — a Fila diz **"Com o Concierge"**, sem nome |
| fallback institucional permitido | ✅ *"Equipe Aliviar"* |
| D-10 separado | ✅ **continua separado** — a Fila não precisa dele |

## 8 · D-11 — decidido expressamente: **não fecha aqui**

**A pergunta de [24](24_D11_ORDEM_DO_PRIMEIRO_ENCONTRO.md) continua sendo de
Método:** *o reconhecimento do Perfil — que a ADR-042 declarou ato **dela**,
livre de condição que não fosse dela — pode passar a depender de
`meeting_held_at`, registrado pelo **Curador**?*

| Se fechasse aqui | Consequência |
|---|---|
| enforcement no writer | `create or replace` de `acknowledge_priority_profile` → **migration** |
| autoridade | condicionaria o ato dela ao registro dele → **emenda à ADR-042** |
| superfície | a recusa apareceria na **Home da paciente**, que não é Mesa nem Fila |

> **Nenhuma das três pertence aos Blocos 11/12.** Fechar D-11 aqui seria
> contrabandear uma emenda de Método dentro de uma track de UX do Curador — e
> **este contrato não tem essa autoridade.**

**O que entrego, e que não exige emenda nenhuma:** o grupo **"Aguarda o
reconhecimento dela"** na Fila (§6). É o efeito operacional do desenho 2 de
[24](24_D11_ORDEM_DO_PRIMEIRO_ENCONTRO.md) — o Curador **vê** que o Mapa está
preparado e aguardando —, com **zero** alteração na autoridade dela.

| | |
|---|---|
| **fato mínimo de reunião realizada** | `consultation_records.meeting_held_at` — **já existe**, entregue na D-9 |
| **enforcement no writer** | ⛔ **não nesta Track** |
| **impacto em fixtures** | nenhum — CR-03 e CR-04 já distinguem os dois estados |
| **rollback** | não se aplica — nada muda no banco |
| **segurança** | inalterada |
| **teste de perda** | **T-D11-7** de [24](24_D11_ORDEM_DO_PRIMEIRO_ENCONTRO.md) permanece **aberto**, e continua reprovando qualquer desenho |

**Fecha quando o DT-01 responder a pergunta acima.** Está registrado, não implícito.

## 9 · Fatos canônicos, segurança e concorrência

| | |
|---|---|
| **fatos novos** | **nenhum** |
| **writers** | os existentes: `saveSelectionAction`, `saveReportAction`, os três de filtros, `acknowledge_priority_profile` |
| **ator autorizado** | Curador (`requireCurator`) na Mesa; a Fila é **leitura** sob RLS |
| **RLS · grants · triggers** | ⛔ **nada muda** |
| **auditoria** | inalterada — nenhuma ação nova nasce |
| **idempotência** | `saveSelection` mantém o comportamento atual; a Fila não escreve |
| **concorrência** | `curated_selections_one_active_per_profile` continua sendo a guarda; elevar estado no cliente **não** cria corrida nova |
| **payload permitido** | ⛔ a Fila **não** expõe conteúdo clínico — só nome do Caso, ato devido e responsável |
| **projeções** | a Fila é projeção derivada, **nunca persistida** |
| **compatibilidade legada** | intocada |

**Nenhum experimento-gate é necessário.** A hipótese que exigiria um — *"falta
onde gravar"* — foi **refutada** no §3, por leitura do schema e do shell.

## 10 · Casos reais — o que significa aqui

| Categoria | Veredito |
|---|---|
| dados reais de paciente | ⛔ **proibidos** em teste e em evidência, sem exceção |
| **casos sintéticos realistas** | ✅ **é isto** — criados pelo **writer real**, nunca por `INSERT` direto |
| estados históricos do banco | ✅ legítimos para **leitura**, nunca para captura |
| fixtures pelo writer real | ✅ **obrigatório** — o estado tem de nascer pelo caminho do produto |
| simulação completa por navegador | ✅ para O4 e para as evidências |
| validação manual por operador | ✅ permitida, **nunca** substitui teste |

**Nenhuma evidência pode expor dado pessoal nem conta permanente.**

### 10.1 · Matriz nominal

| # | Caso | Fato que o define | Grupo na Fila |
|---|---|---|---|
| **CR-01** | antes da Curadoria | Caso sem `understanding_confirmed_at` | Aguarda Acolhimento |
| **CR-02** | preparação do 1º encontro | Mapa preparado, `meeting_held_at is null` | Aguarda o Primeiro Encontro |
| **CR-03** | 1º encontro realizado | `meeting_held_at` presente, `validated_at is null` | Aguarda o reconhecimento dela |
| **CR-04** | Perfil reconhecido | `validated_at` **pela via real** | Curadoria em curso |
| **CR-05** | análise entre encontros | seleção **em curso**, não encerrada | Curadoria em curso |
| **CR-06** | Relatório emitido, não entregue | `emitted_at`, `delivered_at is null` | Aguarda entrega |
| **CR-07** | entregue, sem decisão | `status = DELIVERED` | Aguarda a decisão dela |
| **CR-08** | decisão `CHOSEN` | `patient_curadoria_decisions` | Com o Concierge |
| **CR-09** | decisão `NONE_OF_THEM` | idem, `chosen_option_id null` | Com o Concierge |
| **CR-10** | acompanhamento aberto | `connection_records` | Com o Concierge |
| **CR-11** | encerrado sem entrega | `cases.closed_at` ou `CANCELLED` | **fora da Fila** |
| **CR-12** | compatibilidade legada | entrega do motor antigo | **fora da Fila** |

> **⚠️ Correção que a matriz exige.** A lista de origem pedia *"validação pelo
> Curador"*. **Isso não existe** — a ADR-042 removeu essa porta, e quem reconhece
> o Perfil é **a paciente**. CR-03 e CR-04 registram os dois lados do ato **dela**.
> Nomear o Curador ali reintroduziria, em fixture, a autoridade que a ADR removeu.

**O4 exige CR-01 a CR-10 simultâneos — dez Casos vivos ao mesmo tempo.** CR-11 e
CR-12 entram como leitura de borda, sem simultaneidade.

### 10.2 · Fixtures e cleanup

Reuso de [`apoio-curadoria-entregue.ts`](../../tests/apoio/apoio-curadoria-entregue.ts),
estendido com um parâmetro de **estágio**. **Nada de fixture nova paralela.**

**Ordem de limpeza obrigatória, herdada da B3 (`8520437`/`e94a5b2`):**

```
connection_events → Case → patient_stories → crm_contacts → perfil → user_roles → conta
```

`user_roles` **antes** da conta: o trigger `log_user_role_change()` grava com
`old.profile_id`, e sem o perfil viola `audit_logs_target_profile_id_fkey`.
**Todo passo lê o próprio erro; zero linhas afetadas é falha.**
**Baseline antes/depois obrigatória — resíduo novo: zero.**

## 11 · Superfícies

### 11.1 · Curador — Mesa

**Rota:** `/portal-curador/casos/[id]/curadoria_tecnica`

| Estado | Comportamento |
|---|---|
| seleção em curso | **sobrevive à troca de etapa** (§3.3) |
| 0–2 selecionados | encerrar **visível e desabilitado**, com o que falta (C7) |
| 3 selecionados, parecer faltando | idem, nomeando **qual** |
| eliminação sem justificativa | recusa **no cliente** e no servidor (C6) |
| Relatório congelado | ações **indisponíveis**, com o motivo (C8) |
| salvando | botão em `isLoading`; nada duplica |
| erro | `FormMessage`, e **o rascunho permanece** |

**Copy final:**

| Elemento | Texto |
|---|---|
| encerrar, habilitado | `Encerrar e gerar o Relatório` |
| encerrar, bloqueado | `Encerrar e gerar o Relatório` + `Falta: {lista}` |
| congelado | `O Relatório foi emitido. Esta Mesa é leitura.` |
| atalhos | `Atalhos: ?` |
| filtros (`PERFIL`) | `O que elimina` · `Registrar filtro obrigatório` · `Este filtro precisa do motivo nas palavras dela.` |

### 11.2 · Curador — Fila

**Rota:** a fila existente do portal. Agrupada por ato devido, **na ordem do §6**.
Cada grupo traz **contagem** e, vazio, diz que está vazio.
Copy do cabeçalho de grupo = o nome do grupo. **Sem badge de urgência.**

### 11.3 · Paciente

**Nenhuma mudança.** ⛔ Nenhuma rota, componente ou copy da paciente é tocada.

### 11.4 · Mobile e acessibilidade

A Mesa é **desktop-first** e permanece — ⛔ **não redesenhar para mobile**. A
Fila deve ser legível a **768px** sem overflow. Foco visível · alvos ≥ 44px ·
estado **nunca** só por cor (`StateMark` já é o primitivo) · `aria-live` nas
mensagens de bloqueio · hierarquia de cabeçalhos preservada.

## 12 · Arquivos

| Arquivo | Mudança |
|---|---|
| [`mesa/mesa-shell.tsx`](../../src/components/curadoria/mesa/mesa-shell.tsx) | receber o estado elevado |
| [`mesa-workspace.tsx`](../../src/components/curadoria/mesa-workspace.tsx) | reducer sai; C4, C6, C7, C8, D2-4 |
| **`mesa/mesa-estado.tsx`** | **novo** — o limite de cliente que guarda o reducer |
| [`curadoria_tecnica/page.tsx`](../../src/app/portal-curador/casos/[id]/curadoria_tecnica/page.tsx) | compor o novo limite; ligar `MandatoryFilters` em `PERFIL` |
| [`mandatory-filters.tsx`](../../src/components/curadoria/mandatory-filters.tsx) | ajuste de forma para a Mesa. ⛔ **não mexer nas actions** |
| fila do portal | agrupamento por ato devido |
| `mesa-curador.css` | **acréscimos** |
| [`apoio-curadoria-entregue.ts`](../../tests/apoio/apoio-curadoria-entregue.ts) | parâmetro de estágio (CR-01..CR-12) |
| allowlist do detector | remover `mandatory-filters` |

**⛔ Proibidos:** `AGENTS.md` · `foundation/FOUNDATION_VERIFICATION.md` ·
`supabase/**` · `src/modules/**` · `acknowledge_priority_profile` · qualquer
superfície da paciente · a Landing · `gramatica-de-estados.ts` · os quatro
painéis · as seis etapas · componentes removidos na Track D.

**Migration: ⛔ proibida.** Ledger fica **121**. **Sem banco, não há rollback a
definir** — reverter é `git revert`.

## 13 · Testes

| # | Camada | Prova |
|---|---|---|
| **T-11-1** | componente | **D-6** — selecionar três, trocar de etapa, voltar: **a seleção está lá** |
| **T-11-2** | componente | idem para `pareceres` e `compositionRationale` |
| **T-11-3** | componente | **C7** — encerrar **sempre visível**; desabilitado, nomeia o que falta |
| **T-11-4** | componente | **C6** — eliminação sem motivo é recusada **no cliente** |
| **T-11-5** | integração | **C6** — a guarda do **servidor continua recusando**, mesmo burlando o cliente |
| **T-11-6** | componente | **C8** — congelado ⇒ ações indisponíveis, com motivo |
| **T-11-7** | componente | **C4** — uma origem: a frase deriva dos contadores |
| **T-11-8** | componente | **D2-4** — a justificativa do conjunto aparece **uma vez** |
| **T-11-9** | **e2e** | **alcançabilidade** de `mandatory-filters` **pela rota real**, sem importar o componente |
| **T-11-10** | integração | ⛔ `saveSelectionAction` continua recusando ≠ 3 e rationale vazio |
| **T-12-1** | componente | os sete grupos, na ordem, cada um definido pelo seu fato |
| **T-12-2** | unitário | ⛔ a Fila **não** contém dia, prazo, "atrasado" nem badge de urgência |
| **T-12-3** | unitário | ⛔ a Fila **não** expõe conteúdo clínico |
| **T-12-4** | **e2e · O4** | **CR-01..CR-10 simultâneos**, cada um no grupo certo |
| **T-12-5** | integração | resíduo de fixture: **zero**, com baseline antes/depois |
| **T-CR-1** | unitário | toda fixture nasce **pelo writer real** — nenhum `INSERT` direto de estado |

## 14 · Mutações

| | Mutação | Deve cair |
|---|---|---|
| **M-11-1** | devolver o reducer para dentro de `MesaWorkspace` | **T-11-1, T-11-2** |
| **M-11-2** | esconder o botão de encerrar quando falta algo | **T-11-3** |
| **M-11-3** | remover a guarda de servidor do C6 | **T-11-5** |
| **M-11-4** | desligar `MandatoryFilters` da Mesa | **T-11-9** — e ⛔ **não** o detector |
| **M-11-5** | aceitar 2 opções em `saveSelectionAction` | **T-11-10** |
| **M-12-1** | ordenar a Fila por data em vez de ato devido | **T-12-1** |
| **M-12-2** | acrescentar *"há 3 dias"* a um item | **T-12-2** |

**M-11-4 é a mutação que importa:** prova que a capacidade foi **integrada**, não
apenas importada — o detector continua verde, e é a **rota** que reprova.

## 15 · Evidências

| | Viewport | O que prova |
|---|---|---|
| **EV-11-001** | 1440×900 | seleção preservada após ida e volta entre etapas |
| **EV-11-002** | 1440×900 | encerrar visível e desabilitado, com o que falta |
| **EV-11-003** | 1440×900 | `O que elimina` dentro da Mesa, na etapa `PERFIL` |
| **EV-12-001** | 1440×900 | a Fila com **dez** Casos simultâneos, nos sete grupos |
| **EV-12-002** | 768×1024 | a Fila legível, sem overflow |

**Todo Caso e toda pessoa nas imagens são sintéticos.** ⛔ Nenhum dado real,
nenhuma conta permanente.

## 16 · Regressão

`npm run build` verde · suítes verdes · as seis etapas e os quatro painéis
intactos · gramática visual inalterada · `saveSelectionAction` e
`saveReportAction` com o mesmo contrato · nenhuma superfície da paciente
alterada · `actions-have-callers` e o detector de órfãos verdes **com a
allowlist menor em um** · ledger **121** · os dois `??` intocados.

## 17 · Aprovação e reprovação

**Aprova se, e só se:** T-11-1..T-11-10, T-12-1..T-12-5 e T-CR-1 verdes ·
M-11-1..M-12-2 derrubam o previsto · **O4 com dez Casos simultâneos** ·
`GAP-D-1` fechado **pela rota** · zero resíduo de fixture · zero migration ·
build e suítes verdes.

**Reprova se:** o rascunho for para `localStorage` · nascer tabela, coluna ou
action · `curated_selections` aceitar seleção parcial · a guarda de servidor do
C6 sair · a Fila ganhar prazo, urgência ou conteúdo clínico · `mandatory-filters`
for importado sem gesto real · qualquer superfície da paciente mudar · **D-11 for
fechada por dentro deste contrato**.

## 18 · Gaps preservados

**D-5 · D-7 · D-8 · D-10 · D-11** (§8) · `GAP-D-2` · `GAP-D-3` · `GAP-C-2` ·
`GAP-C-3` · `GAP-B3-COPY-ID` · GAP-D12-C1 · A3b/A4 — **intocados**.

**Para o passe final, sem serem usados aqui:** V-D-1 · detector de ciclos ·
imports de efeito colateral · semântica da allowlist · **G-6** · V-B7-2/3/4 ·
dívida do banco local · `FOUNDATION_VERIFICATION.md` fora do Git.

> ⛔ **Os Blocos 11/12 não são o lugar de limpar dívida geral.**

**Fecha nesta Track:** `GAP-D-1`.

## 19 · Sequência — **Plano B**

**Uma passagem do `03 ENGENHEIRO`**, nesta ordem:

1. **fixture por estágio** (CR-01..CR-12) — tudo depois é verificado contra ela
2. **elevar o estado da Mesa** — D-6, com T-11-1 e T-11-2
3. **C7 · C6 · C8 · C4 · D2-4 · C9** — apresentação, um commit cada
4. **integrar `mandatory-filters`** em `PERFIL`, com T-11-9 **pela rota**
5. **Fila por ato devido**, com T-12-1..T-12-3
6. **e2e O4** com os dez simultâneos + as cinco evidências
7. **fechar a allowlist** e rodar a regressão

**Um gate do `04 VERIFICADOR`**, incluindo O4 e as sete mutações.

**Plano B é o correto e o motivo é factual:** não há banco, não há migração
destrutiva, e Mesa e Fila **não são domínios independentes** — a Fila lê
exatamente o que a Mesa produz.

**`05 CERTIFICADOR`: não exigido** — nenhum fato novo, nenhuma migration, nenhuma
promessa operacional. **Exceção que o próprio gate deve vigiar:** se a integração
de `mandatory-filters` revelar que a fase Filtros muda o resultado do Motor, isso
**é** fato novo, e aí a certificação passa a ser exigida.

---

# BLOCOS 11/12 CONTRATADOS — D-6 E CASOS REAIS PRONTOS PARA EXECUÇÃO

**D-6 mudou de natureza ao ser investigada.** Era "o único item da Mesa com risco
de backend"; é **um `unmount`**. `curated_selections` já existe, e **deve
continuar recusando rascunho** — gravar parcial ali criaria um fato a partir de
um esboço e quebraria duas invariantes do Método.

**D-11 fica aberta, e isso está decidido, não esquecido:** fechá-la exigiria
migration, emenda à ADR-042 e uma superfície da paciente — nenhuma das três
pertence a uma track de UX do Curador. O que entrego é o grupo *"Aguarda o
reconhecimento dela"*, que dá ao Curador a visibilidade do desenho 2 **sem tocar
na autoridade dela**.

**E a matriz de casos corrigiu a própria lista que a originou:** não existe
"validação pelo Curador". Quem reconhece o Perfil é **ela**.
