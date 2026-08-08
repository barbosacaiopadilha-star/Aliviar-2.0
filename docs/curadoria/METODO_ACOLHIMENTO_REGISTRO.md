# MÉTODO — Caminho de Registro da Preparação do Acolhimento (M-003)

| Campo | Valor |
|---|---|
| **Identificador** | **M-003** |
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-04 · **Branch:** `curadoria/onda-1-4-dependencia-falsa` · **HEAD:** `fae6465` |
| **Estado** | **VIGENTE — aguardando validação do DT-01** |
| **Natureza** | Decisão arquitetural operacional. **Não altera domínio, Motor, catálogo, escalas, critérios médicos nem a ordem das fases** |
| **Complementa** | [`METODO_ACOLHIMENTO_PREPARADO.md`](METODO_ACOLHIMENTO_PREPARADO.md) (M-001) — define **como** a preparação é registrada |
| **Emenda** | **M-001 §4.3 e §5.1** — precisão sobre qual história é "a história do Case" (§2.4 deste documento) |
| **Desbloqueia** | **Item 1.5** — checkboxes derivados do Acolhimento (P13) |

> **Nenhuma linha de código, migration, tabela, componente ou teste foi criada ou
> alterada.** Este arquivo é o único produto da missão M-003.

---

## 1. Resumo executivo

O Agente 03 está certo, e o problema é **maior** do que ele reportou.

Verifiquei o código diretamente. `known_facts` e `open_pendencies` não têm
caminho de escrita — **confirmado**. `registerAcolhimentoAction` é a **única**
criadora de `consultation_records` — **confirmado**, e `registerHistoriaAction`
falha explicitamente sem a linha. Implementar o M-001 literalmente travaria todo
Case com material: o gate exigiria conteúdo em campos que ninguém consegue
preencher.

**Encontrei um terceiro problema que não estava no relatório.** O componente
`AcolhimentoWorkspace` **já tem** as props `hasContext` / `hasDocuments` e já
implementa a doutrina correta (*"Confirmar revisão do que não está à vista é
pedir uma declaração falsa"*) — mas **a página nunca as passa**, e elas caem no
default `true`. Pior: se fossem passadas como `false`, o Case **travaria** — sem
checkbox renderizado, `done` nunca fica verdadeiro e o botão de prosseguir nunca
aparece. **O ramo B já está quebrado hoje, e ninguém percebeu porque o caminho
está morto.**

**A decisão:** o caminho de escrita **faz parte do Item 1.5** (Opção A). Não
porque seja conveniente, mas porque separá-lo criaria um intervalo com **dois
gates simultâneos** — o cerimonial e o substantivo —, dobrando o trabalho do
Curador e fazendo o sistema sustentar duas noções concorrentes de "preparado".

**E a peça que fecha tudo:** a fase ACOLHIMENTO **já declara**
`requiredInformation: ["Contexto já conhecido", "Documentos disponíveis"]`
(`phases.ts`). O checkbox sempre foi um *proxy* dessa informação. O M-001 não
cria obrigação nova — **liga o gate à informação que a fase já exigia** e que
nunca teve onde ser escrita. Por isso não exige ADR.

---

## 2. Diagnóstico reproduzido

### 2.1 P-1 — `known_facts` / `open_pendencies` sem caminho de escrita

**CONFIRMADO.** Varredura completa:

```
grep -rn "known_facts|knownFacts|open_pendencies|openPendencies" src/ supabase/migrations/
```

| Papel | Ocorrências |
|---|---|
| **Escritores em produção** | **ZERO** |
| Leitor | `cos/repository.ts:242-243` |
| Consumidor | `cos/conduction.ts:238` — `openPendencies` vira pendência de dono `EQUIPE` |
| Definição | `cos/types.ts:54-55` (`AcolhimentoRecord`) |
| Banco | `20260724023512`, linhas 8–9 — `text[] not null default '{}'` |
| Demais | apenas `cos/mock-records.ts` (fixtures de teste) |

**Os dois campos existem, são lidos, um deles alimenta a lista de pendências da
Mesa — e nunca puderam ser preenchidos por ninguém.**

### 2.2 P-2 — `registerAcolhimentoAction` é a única criadora da linha

**CONFIRMADO, e mais grave que o reportado.**

Escritores de `consultation_records` em todo o `src/`:

| Local | Operação |
|---|---|
| `actions.ts:425` | `update` (Acolhimento, linha existente) |
| `actions.ts:427` | **`insert`** — **único ponto de criação em todo o sistema** |
| `actions.ts:487` | `update` (História) |

E `registerHistoriaAction` (`actions.ts:474-476`):

```ts
if (!existing) {
  // A História pressupõe o Acolhimento — que cria o registro da Consulta.
  return { success: false, error: "Conclua o Acolhimento antes de registrar a História." };
}
```

**Remover a action sem substituição não "impediria" o registro da História —
faria a fase HISTORIA falhar com erro explícito em todo Case novo.**

### 2.3 P-3 — achado novo: o ramo B já está quebrado

Não consta do relatório do Implementador. Dois defeitos encadeados:

| # | Defeito | Evidência |
|---|---|---|
| **a** | O componente aceita `hasContext` / `hasDocuments` com default `true`, **e a página nunca os passa** | `page.tsx:145-148` passa apenas `caseId`, `contextReviewed`, `documentsReviewed`, `nextPhaseHref` |
| **b** | Se fossem passados como `false`, o Case **travaria**: sem checkbox, `context`/`documents` permanecem `false` → `done = false` → o link "Prosseguir para a História" nunca renderiza, e `salvar()` fica desabilitado por `!dirty` | `acolhimento-workspace.tsx:49-50, 113-131` |

A doutrina certa já está escrita no componente, em comentário:
*"Confirmar revisão do que não está à vista é pedir uma declaração falsa."*
**Ela está morta no código e quebrada se ativada.** O Item 1.5 precisa corrigir
isso — não é escopo novo, é o mesmo defeito P13 visto pelo outro lado.

### 2.4 Emenda ao M-001 — precisão sobre "a história do Case"

O M-001 §5.1 definiu `HA_HISTORIA_ENVIADA` como *"existe `patient_stories` do
paciente do Case com `status = 'enviada'`"*. **Isso é impreciso:** um perfil pode
ter mais de uma história, e o Case nasce de **uma** delas.

O vínculo exato já existe no banco: **`cases.source_story_id`**
(`src/modules/cases/repository.ts:148-152`).

> **EMENDA M-001 §4.3 e §5.1:**
>
> ```
> HISTORIA_DO_CASE(case)     := cases.source_story_id
>
> HA_HISTORIA_ENVIADA(case)  := HISTORIA_DO_CASE ≠ null
>                             ∧ patient_stories[HISTORIA_DO_CASE].status = 'enviada'
>
> HA_DOCUMENTO_VINCULADO(c)  := ∃ a ∈ patient_story_attachments :
>                                   a.story_id = HISTORIA_DO_CASE(c)
> ```
>
> **A decisão de Método não muda** — muda a resolução de qual história é a do
> Case, que passa de inferida a explícita.

---

## 3. Decisão arquitetural operacional

Cinco decisões. Nenhuma deixa alternativa ao Implementador.

### D-1 · O gate é desacoplado da existência da linha

> **`acolhimento-preparado` é computado sobre fatos, não sobre a existência de
> `consultation_records`.** No ramo B, o gate passa **sem que a linha exista**.

O repositório já suporta isso: `maybeSingle()` + `consultation?.known_facts ?? []`
(`repository.ts:72, 242`). Linha ausente já é tratada como listas vazias.

**Consequência:** desaparece a pergunta "quem cria a linha no ramo B?" — **ninguém
precisa criá-la**. A linha existe para guardar conteúdo, não para destravar fase.

### D-2 · A linha nasce de quem primeiro escreve conteúdo

> **Tanto o Acolhimento quanto a História passam a criar a linha se ela não
> existir.** A dependência artificial *"Conclua o Acolhimento antes de registrar
> a História"* **é removida** — ela só existia porque a action do Acolhimento era
> a única criadora.

`consultation_records.curator_id` é `NOT NULL`: quem cria é quem age, e a autoria
fica registrada nativamente. Nenhum mecanismo novo.

### D-3 · O predicado do M-001 é **ratificado sem alteração**

```
REGISTRO_DE_PREPARACAO  ⟺  known_facts ≠ ∅  ∨  open_pendencies ≠ ∅
```

Disjunção inclusiva, com "não vazio" = ao menos um item cujo `trim()` ≠ `""`.
**Nenhuma mudança. Não exige revisão do M-001 nem ADR.**

**Fundamento reforçado que faltava ao M-001:** a fase já declara
`requiredInformation: ["Contexto já conhecido", "Documentos disponíveis"]`
(`phases.ts`, ACOLHIMENTO). O predicado liga o gate à informação **já declarada
obrigatória pelo próprio COS**. O checkbox era o proxy; o M-001 troca o proxy
pela coisa.

### D-4 · A monotonicidade é garantida por validação, não por coluna nova

O M-001 §6.2 exige que o gate não regrida. Sem coluna nova (migration é
proibida), a garantia vem da **recusa de payload vazio**:

> **A action rejeita submissão em que ambas as listas fiquem vazias.**

Consequência: conteúdo, uma vez presente, só pode ser **substituído por outro
conteúdo** — nunca esvaziado pelo caminho oferecido. A monotonicidade passa a ser
propriedade da modelagem, não disciplina.

*(Ressalva: esta é a única regra nova deste documento. Ver §12.)*

### D-5 · As listas são substituídas, não acumuladas

> **O payload substitui integralmente o conteúdo das duas listas.**

Acumular tornaria a correção impossível sem um caminho de remoção, que este
pacote não constrói. Com D-4, substituir nunca produz vazio.

---

## 4. Fluxo do Ramo A — há material

```
1. Curador abre o Acolhimento
2. A tela mostra: a história enviada (já mostra hoje) e os documentos vinculados
3. Curador registra o que extraiu:
      · fatos conhecidos      → known_facts
      · pendências abertas    → open_pendencies
      (ao menos um item, em qualquer das duas listas — D-4)
4. registerAcolhimentoAction:
      · linha ausente → INSERT com case_id, curator_id, e as duas listas
      · linha presente → UPDATE das duas listas
5. Gate: acolhimento-preparado = true  (REGISTRO_DE_PREPARACAO satisfeito)
6. HISTORIA abre
```

**Quando o gate fica satisfeito:** no instante em que a primeira submissão válida
é gravada. Não há segundo ato, não há confirmação, não há checkbox.

## 5. Fluxo do Ramo B — não há material

```
1. Curador abre o Acolhimento
2. hasSubmittedStory = false  ∧  hasLinkedDocument = false
3. A tela declara: "Ainda não há material desta pessoa para revisar."
      · nenhum formulário é oferecido
      · nenhum clique é pedido
4. Gate: acolhimento-preparado = true  (ramo B, por derivação)
      · consultation_records NÃO existe — e não precisa existir (D-1)
5. HISTORIA abre
6. Quando a História for registrada:
      registerHistoriaAction cria a linha (D-2), com curator_id de quem registrou
```

**Corrige o defeito P-3:** o ramo B deixa de travar o Case e passa a ser o
caminho normal — sem cerimônia, sem linha órfã, sem clique.

## 6. Fluxo de material posterior

Formaliza o M-001 §6.3.

```
Estado inicial:  Case no ramo B, acolhimento-preparado = true
Evento:          chega história enviada OU documento vinculado
                 ↓
Reavaliação:     RAMO_B agora é false
                 REGISTRO_DE_PREPARACAO ainda é false
                 preparedBefore? → ver abaixo
                 ↓
Resultado:       acolhimento-preparado = FALSE — o gate volta a pendente
```

| Pergunta | Resposta |
|---|---|
| **O gate volta a ficar pendente?** | **Sim** — e isso é o comportamento correto, não um efeito colateral |
| **Como `preparedBefore` participa?** | **Não participa neste caso.** `preparedBefore` cobre **exclusivamente** Cases do regime anterior (`context_reviewed ∧ documents_reviewed` gravados antes deste pacote). Um Case que passou pelo ramo B **nunca gravou nada** — logo não há `preparedBefore`, e o gate reabre corretamente |
| **O que deve ser registrado?** | O mesmo do ramo A: fatos conhecidos e/ou pendências, sobre o material que chegou |
| **Como evitar perda silenciosa?** | A reabertura **é** o mecanismo: a fase volta a aparecer como pendente na condução, e o Curador vê que há material novo. Sem ela, o material chegaria e nunca seria lido — o dano exato que a fase existe para impedir |
| **HISTORIA já registrada regride?** | **Não.** HISTORIA tem critérios próprios (`narrative`, `understanding_confirmed_at`), avaliados sobre seus próprios fatos. A reabertura do Acolhimento **não apaga** o que já foi registrado depois |

**Nota sobre o efeito visível:** um Case pode ter HISTORIA registrada e
ACOLHIMENTO pendente simultaneamente. Isso é correto e não é regressão: significa
*"chegou material que ainda não foi lido"*, que é precisamente a informação útil.

---

## 7. Contrato da action

### 7.1 Decisão: **`registerAcolhimentoAction` permanece e tem o payload substituído**

| Alternativa | Escolhida? | Justificativa |
|---|---|---|
| **Manter o nome, trocar o payload** | **✅ SIM** | A responsabilidade não mudou — registrar o Acolhimento. Mudou **o que se registra**. Renomear obrigaria a tocar imports sem ganho |
| Substituir por action nova | Não | Criaria migração de nome sem mudança de responsabilidade |
| Dividir em duas actions | Não | Fatos e pendências são um só ato de preparação; separá-los pediria dois envios para uma leitura só |

### 7.2 Contrato

| Item | Definição |
|---|---|
| **Nome** | `registerAcolhimentoAction` (inalterado) |
| **Responsabilidade** | Registrar o que o Curador extraiu do material do Case, criando a linha da Consulta Inicial se ainda não existir |
| **Entradas** | `caseId: string` · `knownFacts: string[]` · `openPendencies: string[]` |
| **Entradas removidas** | `contextReviewed` · `documentsReviewed` — **saem do schema** |
| **Autorização** | `requireCurator()` — inalterada |
| **Validação 1** | `caseId` válido (inalterada) |
| **Validação 2** | itens em branco são descartados (`trim()`); listas normalizadas |
| **Validação 3** | **após normalização, a soma dos itens das duas listas deve ser ≥ 1** — senão, recusa com mensagem própria (D-4) |
| **Campos persistidos** | `known_facts`, `open_pendencies` |
| **Criação** | linha ausente → `insert { case_id, curator_id: authState.user.id, known_facts, open_pendencies }` |
| **Atualização** | linha presente → `update { known_facts, open_pendencies }` — **substituição integral** (D-5) |
| **Nunca escreve** | `context_reviewed`, `documents_reviewed` — nem no insert, nem no update (§9) |
| **Idempotência** | mesma entrada, mesmo estado final. Reenviar conteúdo idêntico não muda nada além de `updated_at` |
| **Revalidação** | inalterada — `revalidateCuradoria(caseId)` + path do Acolhimento |

### 7.3 `registerHistoriaAction` — alteração mínima

| Item | Mudança |
|---|---|
| **O que muda** | O bloco `if (!existing) return { success: false, ... }` é substituído por **criação da linha** |
| **Criação** | `insert { case_id, curator_id: <curador autenticado>, ...patch }` |
| **O que NÃO muda** | validações, acumulação de `understanding_confirmed_at`, revalidação, mensagens |
| **Por quê** | Sem isso, o ramo B fica com a HISTORIA inalcançável — a linha nunca teria sido criada (D-2) |

**Consequência a registrar:** `requireCurator()` em `registerHistoriaAction` hoje
descarta o retorno (`await requireCurator()`), sem capturar o usuário. Passará a
capturá-lo, porque `curator_id` é `NOT NULL`. É ajuste mecânico, não regra nova.

---

## 8. Persistência e auditoria

**Nenhum mecanismo novo. Tudo já existe.**

| O quê | Onde | Origem |
|---|---|---|
| **Autor** | `consultation_records.curator_id` — `NOT NULL`, gravado na criação | já existe |
| **Data de criação** | `created_at` — `default now()` | já existe |
| **Data de atualização** | `updated_at` — **trigger** `set_consultation_records_updated_at` | já existe |
| **Conteúdo** | `known_facts` · `open_pendencies` | já existem |
| **Unicidade** | `consultation_records_one_per_case` (índice único) | já existe |
| **Histórico relevante** | `context_reviewed` / `documents_reviewed` preservados (§9) | já existem |

### 8.1 O que **não** é criado

| Não criar | Motivo |
|---|---|
| Tabela de versões do registro de preparação | Fora do escopo do Item 1.5; o M-001 não a exige |
| `viewed_at`, `opened_at`, `read_at` ou equivalente | **Proibido** — M-001 §0 |
| Coluna nova de qualquer natureza | Migration é proibida neste pacote |
| Evento de auditoria próprio | `updated_at` + `curator_id` respondem "quem" e "quando" |

**Limitação declarada:** o sistema guarda **o estado atual** do registro e **quem
o criou**, não o histórico de edições. Isso é o que existe hoje para toda a
Consulta Inicial (narrativa inclusive) e este pacote **não piora nem melhora**
esse patamar. Registrar versões seria escopo próprio, e não é exigido pelo M-001.

---

## 9. Campos históricos

| Pergunta | Resposta |
|---|---|
| **Continuam sendo gravados?** | **NÃO.** Nenhuma escrita nova, em nenhuma action |
| **Deixam apenas de ser gate?** | **Deixam de ser gate E deixam de ser escritos.** As duas coisas |
| **As colunas permanecem?** | **SIM.** Nenhuma coluna é removida, renomeada ou zerada. Nenhuma migration |
| **Permanecem legíveis?** | **SIM** — para auditoria de Cases anteriores, e como `preparedBefore` |
| **O código deve tratá-los como legado?** | **SIM.** Leitura permitida em **um único ponto**: o cálculo de `preparedBefore` |

### 9.1 `preparedBefore` — definição fechada

```
preparedBefore(case) := consultation_records.context_reviewed
                      ∧ consultation_records.documents_reviewed
```

| Regra | Conteúdo |
|---|---|
| **Para que serve** | Impedir que Cases já conduzidos regridam de fase no dia da entrega |
| **Onde é lido** | Exclusivamente no predicado `acolhimento-preparado` |
| **Onde nunca é lido** | Qualquer outra regra, superfície ou relatório |
| **Quando é `true` para Case novo** | **Nunca** — Cases novos não gravam esses campos |

### 9.2 Proibições

| # | Proibido |
|---|---|
| 1 | Escrever `context_reviewed` ou `documents_reviewed` em qualquer caminho |
| 2 | Fazer backfill de `known_facts` a partir deles |
| 3 | Removê-los, renomeá-los ou zerá-los |
| 4 | Lê-los fora do cálculo de `preparedBefore` |

---

## 10. Escopo definitivo do Item 1.5

### **OPÇÃO A — o caminho de escrita faz parte do Item 1.5.**

**Justificativa:**

| # | Razão |
|---|---|
| 1 | **Separar criaria dois gates simultâneos.** Um pacote anterior que só adicionasse a escrita, sem trocar o gate, faria o Curador registrar preparação **e** marcar os checkboxes durante todo o intervalo — dobrando o trabalho que o Item 1.5 existe para eliminar |
| 2 | **Duas noções concorrentes de "preparado"** conviveriam no sistema, e a pergunta "qual vale?" não teria resposta escrita |
| 3 | **Não é escopo novo.** A fase já declara `requiredInformation: ["Contexto já conhecido", "Documentos disponíveis"]`. O caminho de escrita é a **implementação faltante** de informação que o COS já exigia — não um requisito acrescentado |
| 4 | **O pacote permanece atômico e reversível.** Um único commit troca proxy por conteúdo; reverter devolve o estado anterior por inteiro |
| 5 | **A Opção B teria um estado intermediário pior que os dois extremos** — e estado intermediário ruim é o que a Onda 1 evita por desenho |

**Opção C (revisar o Método) foi examinada e recusada:** o M-001 não está errado.
Ele está **incompleto quanto ao caminho de escrita** — que é exatamente o que este
documento fecha. A única correção necessária é a precisão do §2.4, que não muda
nenhuma decisão.

### 10.1 Fronteira — o que o Item 1.5 **não** inclui

| Fora do escopo | Onde vive |
|---|---|
| Histórico versionado do registro de preparação | pacote próprio, se um dia for exigido |
| Superfície de resolução de pendências pela EQUIPE | `conduction.ts:238` já as exibe; agir sobre elas é outro escopo |
| Qualquer alteração em `case_clinical_context` | Item 1.6 e seguintes |
| Redesenho da tela do Acolhimento | proibido pela missão |

---

## 11. Especificação objetiva para o Agente 03

### 11.1 Alterações autorizadas, por arquivo

| # | Arquivo | Alteração |
|---|---|---|
| **A1** | `src/modules/curadoria/cos/phases.ts` | ACOLHIMENTO: substituir os **dois** critérios de saída por **um**, `acolhimento-preparado` (§11.2). HISTORIA: entrada passa a usar o mesmo predicado |
| **A2** | `src/modules/curadoria/cos/types.ts` | `AcolhimentoRecord` recebe: `hasSubmittedStory: boolean`, `hasLinkedDocument: boolean`, `preparedBefore: boolean` |
| **A3** | `src/modules/curadoria/cos/repository.ts` | Preencher os três campos novos. `hasSubmittedStory` e `hasLinkedDocument` conforme §2.4; `preparedBefore` conforme §9.1. **Manter `maybeSingle()`** — linha ausente continua legítima |
| **A4** | `src/modules/curadoria/schema.ts` | `registerAcolhimentoInputSchema`: remover `contextReviewed`/`documentsReviewed`; incluir `knownFacts: string[]`, `openPendencies: string[]`; validação de payload não vazio (§7.2) |
| **A5** | `src/modules/curadoria/actions.ts` | `registerAcolhimentoAction`: novo contrato (§7.2). `registerHistoriaAction`: criar a linha em vez de falhar (§7.3) |
| **A6** | `src/components/curadoria/acolhimento-workspace.tsx` | Trocar os dois `Checkbox` por dois campos de lista (fatos, pendências). Props passam a ser `hasSubmittedStory`/`hasLinkedDocument`/`preparado`. Ramo B: sem formulário, com "Prosseguir" habilitado — **corrige P-3** |
| **A7** | `src/app/portal-curador/casos/[id]/[etapa]/page.tsx` | Passar as props novas ao workspace — **corrige P-3(a)** |
| **A8** | `src/modules/curadoria/cos/mock-records.ts` | Ajustar fixtures aos campos novos |

### 11.2 O predicado, pronto para codificar

```
acolhimento-preparado(record) =
       ( ¬record.acolhimento.hasSubmittedStory
       ∧ ¬record.acolhimento.hasLinkedDocument )              -- ramo B
    ∨  ( naoVazio(record.acolhimento.knownFacts)
       ∨ naoVazio(record.acolhimento.openPendencies) )        -- ramo A
    ∨  record.acolhimento.preparedBefore                      -- legado

naoVazio(lista) := existe item em lista com item.trim() ≠ ""

id:          "acolhimento-preparado"
description: "O Curador registrou o que extraiu do material disponível — ou não havia material."
```

### 11.3 Alterações proibidas

| # | Proibido |
|---|---|
| **X1** | Criar migration, tabela, coluna, índice, policy ou trigger |
| **X2** | Criar `viewed_at`, `opened_at`, `read_at`, log de acesso ou telemetria de tela |
| **X3** | Remover, renomear ou zerar `context_reviewed` / `documents_reviewed` |
| **X4** | Escrever nesses dois campos em qualquer caminho |
| **X5** | Fazer backfill de `known_facts` a partir deles |
| **X6** | Contar documento sem vínculo em `patient_story_attachments` |
| **X7** | Contar história em `rascunho`, ou história que não seja `cases.source_story_id` |
| **X8** | Aceitar payload vazio na action |
| **X9** | Acumular listas em vez de substituir |
| **X10** | Alterar Motor, Compatibilidade, Avaliação Técnica, critérios, pesos, escalas ou a ordem das fases |
| **X11** | Alterar qualquer fase do COS que não seja ACOLHIMENTO (saída) e HISTORIA (entrada) |
| **X12** | Redesenhar a tela do Acolhimento além do descrito em A6 |

### 11.4 Testes obrigatórios

| # | Teste |
|---|---|
| **T1** | Ramo B — sem história e sem documento: gate `true`, **sem `consultation_records`** |
| **T2** | Ramo A — com material e sem registro: gate `false` |
| **T3** | Ramo A — com `known_facts` não vazio: gate `true` |
| **T4** | Ramo A — com `open_pendencies` não vazio e `known_facts` vazio: gate `true` |
| **T5** | Listas com apenas `""` / `"   "`: gate `false`; action **recusa** o envio |
| **T6** | Legado — `context_reviewed ∧ documents_reviewed` sem listas: gate `true` |
| **T7** | Material posterior — ramo B satisfeito, chega história: gate volta a `false` |
| **T8** | `registerHistoriaAction` **cria** a linha quando ausente, com `curator_id` |
| **T9** | Action é idempotente: mesmo payload duas vezes, mesmo estado |
| **T10** | Nenhuma escrita em `context_reviewed` / `documents_reviewed` (asserção sobre o payload gravado) |
| **T11** | Entrada de HISTORIA acompanha exatamente a saída de ACOLHIMENTO |
| **T12** | As sete linhas da tabela §8.3 do M-001 permanecem verdadeiras |

### 11.5 Rollback

| Item | Conteúdo |
|---|---|
| **Como** | Reverter o commit único do pacote |
| **Perda de dado** | **Nenhuma.** O pacote não apaga nem migra; `known_facts` gravados permanecem no banco e voltam a ser apenas lidos |
| **Efeito colateral** | Cases que concluíram o Acolhimento pelo regime novo voltariam a exigir os checkboxes — situação já conhecida e resolvível manualmente |
| **Risco** | Baixo. Nenhuma estrutura de banco é tocada |

---

## 12. Decisão

# **CAMINHO DEFINIDO COM RESSALVAS**

**Três ressalvas, nenhuma exigindo ADR:**

| # | Ressalva | Encaminhamento |
|---|---|---|
| **R-1** | **Emenda ao M-001 §4.3/§5.1** — "a história do Case" passa a ser `cases.source_story_id`, não "qualquer história enviada do paciente" (§2.4). É precisão, não mudança de decisão | Ratificar no DT-01 |
| **R-2** | **Achado novo P-3** — o ramo B já está quebrado hoje: props nunca passadas e Case travaria se fossem. A correção entra no Item 1.5 (A6, A7) | Registrar como parte do escopo |
| **R-3** | **A recusa de payload vazio (D-4) é a única regra nova deste documento.** Ela existe para preservar a monotonicidade do M-001 §6.2 sem criar coluna. É implementação de decisão vigente, não domínio novo — mas é minha, e cabe ratificação | Ratificar no DT-01 |

**Não exige nova ADR.** Nenhum conceito, critério, escala, célula, peso, fase ou
ordem foi criado ou alterado. O caminho de escrita implementa informação que a
fase **já declarava obrigatória** (`requiredInformation`), e que nunca teve onde
ser escrita.

---

*Fim do M-003. **Item 1.5 não implementado.** Nenhum código, migration ou tabela
foi criada. Item 1.6 não aberto. Encaminhamento exclusivo: **DT-01**, para
decidir a reabertura do Item 1.5 ao Agente 03.*
