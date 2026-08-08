# MÉTODO — Acolhimento PREPARADO (M-001 materializado)

| Campo | Valor |
|---|---|
| **Identificador** | **M-001** |
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-04 · **Branch:** `curadoria/onda-1-4-dependencia-falsa` · **HEAD:** `fae6465` |
| **Estado** | **VIGENTE — aguardando validação documental do DT-01** |
| **Natureza** | **Decisão de Método.** Não altera domínio, arquitetura, ADR, Motor, catálogo, escalas ou critérios médicos |
| **Desbloqueia** | **Item 1.5** — remoção dos checkboxes burocráticos do Acolhimento (achado **P13** da auditoria operacional) |
| **Subordinado a** | Constituição da Aliviar · ADR-035 · `MODELO_CURADORIA_V1.md` · `CONGELAMENTO_ARQUITETURAL.md` |
| **Origem** | Missão M-001 (decisão) · Missão M-002 (materialização) |

> **Nenhuma linha de código, migration, banco, API, componente, teste ou
> interface foi criada ou alterada por este documento.** Ele é o único produto
> da missão M-002.
>
> **Por que este documento existe.** A decisão M-001 foi tomada como resultado
> de missão e **não existia no repositório**. O Agente 03 interrompeu o Item 1.5
> corretamente: implementar a partir de conhecimento que só vive em histórico de
> conversa viola o **P-01** — *o conhecimento pertence ao Método, nunca a quem
> passou por ele*. Este arquivo corrige isso. **A partir daqui, nenhuma
> implementação do Item 1.5 precisa consultar conversa alguma.**

---

## 0. Verificação de premissa — leia antes de tudo

A auditoria operacional afirma, no §2.3, que *"o sistema sabe se a história e os
documentos foram abertos"*.

> ### ⚠️ **Isso é falso.** Não existe rastreio de leitura no repositório.

**Evidência, reproduzível:**

```
grep -rn "viewed_at|opened_at|accessed_at|last_viewed" src/ supabase/migrations/
```

Zero ocorrências para `patient_stories` ou `patient_documents`. O único `read_at`
existente pertence a **notificação lida** (`src/modules/connection/approach-repository.ts`)
— domínio distinto. `case_events` registra **mudanças de estado**, nunca leituras.

**Consequência de Método, e ela é vinculante:**

> **É PROIBIDO criar rastreio de leitura para satisfazer este Método.** Nenhum
> `viewed_at`, nenhum log de acesso, nenhuma telemetria sobre o Curador.

Dois motivos, ambos suficientes:

1. **Abrir não é ler.** Um sensor de abertura produziria um fato falso — e a 2.0
   proíbe exatamente esse vício na direção oposta: *"assinatura humana sem
   leitura demonstrável não transforma automação em decisão humana"*.
2. **Vigiar o Curador para provar preparação** trocaria uma cerimônia por uma
   vigilância, e não entregaria a garantia prometida.

**O que substitui o checkbox não é um sensor. É o conteúdo que só existe se
alguém leu.**

---

## 1. Definição operacional — Acolhimento PREPARADO

### 1.1 A definição

> **O Acolhimento de um Case está PREPARADO quando não resta material do
> paciente sobre o qual o Curador ainda não tenha registrado o que dele
> extraiu.**

O Curador deixa de afirmar *"eu li"* e passa a registrar *"isto é o que eu li"*.

### 1.2 A regra, em dois ramos exaustivos e mutuamente exclusivos

| Ramo | Condição | Como se satisfaz | Ato humano exigido |
|---|---|---|---|
| **A — HÁ MATERIAL** | existe história **enviada** **ou** existe ao menos um documento vinculado (§4) | **registro de preparação presente** (§2) | **sim** — registrar o que se extraiu |
| **B — NÃO HÁ MATERIAL** | não existe história enviada **e** não existe documento vinculado | **satisfeito por derivação** | **nenhum** |

**Não existe terceiro ramo.** As condições de A e B são complementares por
construção: `B ⟺ ¬A`.

### 1.3 O que a definição preserva

O objetivo declarado da fase permanece palavra por palavra: *"O Curador chega à
conversa sabendo o que já se sabe — o paciente nunca recomeça do zero"*
(`src/modules/curadoria/cos/phases.ts`, ACOLHIMENTO). A Experience Bible §2.2 já
exigia que *"o Curador começa demonstrando que leu"* — este Método apenas passa a
**exigir a demonstração** em vez da afirmação.

---

## 2. Registro de preparação — o predicado oficial

### 2.1 Resposta à lacuna **L-1**, sem ambiguidade

O parecer M-001 escreveu *"`knownFacts` e/ou `openPendencies`"*. **"E/ou" não é
predicado.** Fica definido:

> ### **`REGISTRO_DE_PREPARACAO ⟺ known_facts ≠ ∅ ∨ open_pendencies ≠ ∅`**
>
> **Disjunção inclusiva. Basta um dos dois ser não vazio.**

| Opção | Escolhida? | Justificativa |
|---|---|---|
| Apenas `known_facts` | **Não** | Há material legítimo do qual não se extrai nenhum fato conhecido e sim uma pendência — "o exame citado na história não veio anexado" é preparação real, e exigir `known_facts` a rejeitaria |
| **`known_facts` OU `open_pendencies`** | **✅ SIM** | Ambos são produto de consulta ao material; nenhum dos dois se produz sem ler. A disjunção cobre os dois desfechos honestos da leitura: *o que se sabe* e *o que falta* |
| Ambos obrigatórios (conjunção) | **Não** | Forçaria o Curador a inventar pendência inexistente — cerimônia nova no lugar da antiga |
| Outro campo | **Não** | Nenhum outro campo de `consultation_records` representa extração de material |

### 2.2 Localização física dos dois campos

Ambos existem, e não são criados por este Método:

```
curadoria.consultation_records.known_facts       text[] not null default '{}'
curadoria.consultation_records.open_pendencies   text[] not null default '{}'
```

*(migration `20260724023512_curadoria_stage8_fases_operacionais.sql`, linhas 8–9)*

Expostos em `CuradoriaRecord` como `record.acolhimento.knownFacts` e
`record.acolhimento.openPendencies` (`src/modules/curadoria/cos/types.ts`,
`AcolhimentoRecord`).

### 2.3 O que "não vazio" significa

> **Não vazio = ao menos um elemento cujo conteúdo, após remoção de espaços em
> branco nas extremidades, não seja string vazia.**

Um array com um único elemento `""` ou `"   "` **não** satisfaz o predicado. É o
mesmo tratamento que o COS já aplica à narrativa
(`isMet: (record) => Boolean(record.historia.narrative?.trim())`).

### 2.4 Objeção antecipada, e sua resposta

*"O Curador pode escrever qualquer coisa em `known_facts`."* — Verdade, e vale
para toda declaração humana do sistema. A resposta do Método nunca foi
vigilância; é **autoria e auditabilidade**: o registro é nominal, datado e
legível por qualquer auditor. Um checkbox falso é indistinguível de um
verdadeiro; um `known_facts` falso é visível para quem lê o Case.

---

## 3. Estrutura do critério de saída do COS

### 3.1 Resposta: **um único critério derivado**

A fase ACOLHIMENTO passa a ter **exatamente um critério de saída**, não dois.

| | Estrutura |
|---|---|
| **Antes** | **dois** critérios independentes: `contexto-lido` (`contextReviewed`) e `documentos-revisados` (`documentsReviewed`) |
| **Depois** | **um** critério: `acolhimento-preparado` |

### 3.2 O critério, formalmente

```
acolhimento-preparado :=
      ( ¬HA_HISTORIA_ENVIADA  ∧  ¬HA_DOCUMENTO_VINCULADO )     — ramo B
    ∨ ( known_facts ≠ ∅  ∨  open_pendencies ≠ ∅ )              — ramo A
```

- **id:** `acolhimento-preparado`
- **description:** *"O Curador registrou o que extraiu do material disponível — ou não havia material."*

### 3.3 Por que um e não dois

Os dois critérios anteriores separavam **contexto** de **documentos** como se
fossem preparações distintas. Não são: o Curador prepara-se para **uma**
conversa, a partir de **todo** o material. A separação produzia o efeito absurdo
de um Case sem documento nenhum exigir a declaração de que se revisou o nada.

**A fusão não perde informação:** nenhum consumidor no repositório lê os dois
booleanos separadamente. Verificado por varredura completa — os únicos
dependentes são `phases.ts` (3 usos, sempre em conjunção), `repository.ts`
(leitura), `actions.ts` (escrita), `schema.ts` (validação) e a superfície.

### 3.4 O gate de HISTORIA

A entrada da fase HISTORIA depende hoje da conjunção dos dois booleanos
(`phases.ts:111`). Passa a depender do **mesmo critério único**:

```
entrada(HISTORIA) := acolhimento-preparado
```

Nenhuma outra fase referencia estes campos.

---

## 4. O que conta como documento

### 4.1 Resposta à lacuna **L-2**, sem ambiguidade

O parecer M-001 escreveu *"`story_attachments` / `patient_documents`"*, como se
fossem alternativas. **Não são.** O esquema real:

```
curadoria.patient_documents          -- o documento (profile_id, file_path, file_name, …)
curadoria.patient_story_attachments  -- o VÍNCULO (story_id, document_id) — tabela de junção
```

*(migration `20260723164543_curadoria_stage3_stories_notifications_documents.sql`,
linhas 43 e 127)*

`patient_story_attachments` **não é uma tabela de documentos** — é a ligação
entre uma história e um documento. Portanto a pergunta "qual das duas?" estava
mal posta, e a resposta é:

> ### **Conta como documento do Acolhimento a linha de `patient_documents` que estiver VINCULADA, via `patient_story_attachments`, à história do Case.**
>
> **Fonte do documento:** `patient_documents`.
> **Critério de pertencimento ao Case:** o vínculo em `patient_story_attachments`.

### 4.2 Documento órfão **não conta** — e por quê

`patient_documents` é chaveado por `profile_id`, **não** por `case_id` nem por
`story_id`. Existem documentos sem vínculo, e o repositório os reconhece
explicitamente como **resíduo**: a migration
`20260802153000_rastro_de_documento_sem_vinculo.sql` institui o verbo de
auditoria `patient_document_orphaned` para *"documento que sobrou sem vínculo"*
quando a compensação de uma saga falha.

Três razões para excluí-los:

| # | Razão |
|---|---|
| 1 | São **modelados como resíduo**, não como material da história |
| 2 | Não pertencem a este Case — pertencem ao perfil, e um perfil pode ter mais de uma história |
| 3 | Contá-los faria o gate do Acolhimento **depender de sagas falhadas** — uma falha técnica passaria a exigir ato humano |

### 4.3 Predicado formal

```
HA_DOCUMENTO_VINCULADO(case) :=
    ∃ d ∈ patient_documents,  ∃ a ∈ patient_story_attachments :
        a.document_id = d.id  ∧  a.story_id = historia_do_case.id
```

---

## 5. Caso sem material — comportamento formalizado

### 5.1 Resposta à lacuna **L-3**, sem ambiguidade

```
HA_HISTORIA_ENVIADA(case) := ∃ s ∈ patient_stories :
                                 s pertence ao paciente do Case
                               ∧ s.status = 'enviada'
```

O domínio de `status` é fechado no banco:
`check (status in ('rascunho','enviada'))`
*(migration `20260723164543`, linha 70)*. **História em `rascunho` não conta** —
ela ainda não foi entregue pela paciente, e o Curador não deve prepará-la.

### 5.2 O ramo B, formalizado

```
RAMO_B(case)  :=  ¬HA_HISTORIA_ENVIADA(case)  ∧  ¬HA_DOCUMENTO_VINCULADO(case)

RAMO_B(case)  ⟹  acolhimento-preparado = true
```

| Aspecto | Definição |
|---|---|
| **Ato humano exigido** | **Nenhum.** Nenhum clique, nenhum registro, nenhuma confirmação |
| **O que a superfície mostra** | que **não há material disponível** — nunca "não foi revisado" |
| **Quando o material chegar depois** | o Case sai do ramo B e entra no ramo A. Se ainda não houver registro de preparação, **o critério volta a falso** — ver a exceção de monotonicidade em §6.3 |
| **O que nunca acontece** | o sistema **nunca** conclui que o Curador se preparou. Ele conclui que **não havia o que preparar** — I-8 aplicado: ausência de material nunca vira ausência de preparo |

### 5.3 Por que este ramo é o núcleo do P13

Hoje, um Case sem história enviada e sem documento **exige dois cliques** para
declarar que se revisou o nada. É a definição operacional de cerimônia, e é o que
o achado P13 nomeou.

---

## 6. Monotonicidade

### 6.1 O comportamento atual, e sua origem

```ts
context_reviewed:   Boolean(existing?.context_reviewed)   || contextReviewed,
documents_reviewed: Boolean(existing?.documents_reviewed) || documentsReviewed,
```
*(`src/modules/curadoria/actions.ts`, linhas 420–421)*

Uma vez marcado, **nunca desmarca**. O gate atual é irreversível por construção.

### 6.2 A regra oficial — preservação

> **O critério `acolhimento-preparado`, uma vez verdadeiro pelo ramo A, não
> regride por edição posterior do conteúdo.**

Esvaziar `known_facts` depois de a fase ter concluído **não** reabre o
Acolhimento. O fato relevante é *"houve registro de preparação"*, e esse fato,
tendo ocorrido, não deixa de ter ocorrido — é o mesmo fundamento de **I-7**
(*histórico é imutável*).

### 6.3 A única exceção, e ela é obrigatória

> **Um Case que estava no ramo B e passa a ter material entra no ramo A, e o
> critério volta a exigir registro de preparação.**

Isto **não é regressão do fato** — é mudança do mundo. O ramo B nunca afirmou
preparação; afirmou ausência de material. Quando o material chega, há pela
primeira vez o que preparar.

**Sem esta exceção, o Método teria um buraco:** bastaria o Acolhimento concluir
antes de a paciente enviar a história para que o material chegasse sem nunca ser
preparado — exatamente o dano que a fase existe para impedir.

### 6.4 Formalização conjunta

```
preparado(case, t) :=
      RAMO_B(case, t)
    ∨ REGISTRO_DE_PREPARACAO(case, t)
    ∨ ( ∃ t' < t : REGISTRO_DE_PREPARACAO(case, t') )    -- monotonicidade (§6.2)
```

A terceira cláusula preserva a irreversibilidade; a primeira, sendo avaliada em
`t`, produz naturalmente a exceção do §6.3.

---

## 7. Campos históricos `context_reviewed` e `documents_reviewed`

### 7.1 Decisão oficial

| Pergunta | Resposta |
|---|---|
| **Permanecem?** | **SIM.** As colunas não são removidas, não são renomeadas, não são zeradas |
| **Deixam de ser gate?** | **SIM.** Nenhum critério de entrada ou de saída de qualquer fase do COS volta a lê-las |
| **Continuam históricos?** | **SIM.** Permanecem legíveis para auditoria de Cases anteriores a este Método |

### 7.2 Justificativa

Apagá-las reescreveria o passado: Cases já conduzidos concluíram o Acolhimento
por aqueles dois atos, e o registro de que eles ocorreram é parte da história do
Case (**I-7**). O que muda não é o passado — é o que passa a valer daqui em
diante.

### 7.3 Regras que acompanham

| # | Regra |
|---|---|
| 1 | **Nenhuma escrita nova.** A superfície deixa de oferecer os dois checkboxes; a action deixa de aceitá-los |
| 2 | **Nenhum backfill.** Não se preenche `known_facts` a partir de `context_reviewed` — seria inventar conteúdo que ninguém escreveu |
| 3 | **Nenhuma leitura em regra de negócio.** Podem ser lidas por auditoria; nunca por gate |
| 4 | **Cases em andamento** que já concluíram o Acolhimento pelo regime antigo **permanecem concluídos** — a monotonicidade do §6.2 os cobre pela terceira cláusula do §6.4, tratando o ato antigo como registro de preparação já ocorrido |

**A regra 4 é essencial e não pode ser omitida na implementação:** sem ela, todo
Case em curso regrediria de fase no dia da entrega.

---

## 8. Demonstração formal — nenhum critério de saída do COS enfraquece

**Este é o critério de aceite registrado para o Item 1.5.**

### 8.1 O que o critério atual garante

```
saída_atual(ACOLHIMENTO) ⟺ context_reviewed ∧ documents_reviewed
```

Valor evidencial real: **"um humano praticou dois atos sem conteúdo"**. Não
garante leitura, não garante preparação, não garante sequer que exista material.

### 8.2 O que o critério proposto garante

```
saída_nova(ACOLHIMENTO) ⟺ RAMO_B ∨ REGISTRO_DE_PREPARACAO ∨ preparado_antes
```

Valor evidencial: **"ou não havia o que preparar, ou existe conteúdo que só se
produz consultando o material"**.

### 8.3 Tabela-verdade completa

| # | Situação | Atual | Proposto | Enfraquece? |
|---|---|---|---|---|
| 1 | Há material · Curador preparou e registrou | passa | **passa** | **Não** — mesma saída, evidência **maior** |
| 2 | Há material · Curador clicou sem ler | **passa** | **NÃO passa** | **Não — endurece** |
| 3 | Há material · Curador leu mas nada registrou | **passa** | **NÃO passa** | **Não — endurece** |
| 4 | Não há material | passa (2 cliques) | **passa** (derivado) | **Não** — mesma saída, sem cerimônia |
| 5 | Case novo, nada feito, há material | não passa | **não passa** | **Não** — idêntico |
| 6 | Case antigo já concluído no regime anterior | passa | **passa** (§7.3 regra 4) | **Não** — idêntico |
| 7 | Concluiu no ramo B, material chega depois | **passa** (checkbox não regride) | **NÃO passa** até haver registro | **Não — endurece** |

### 8.4 Conclusão formal

> O conjunto de estados que satisfazem a saída de ACOLHIMENTO é **subconjunto
> próprio** do conjunto atual: idêntico nas linhas 1, 4, 5 e 6; **estritamente
> menor** nas linhas 2, 3 e 7.
>
> **Um critério que aceita menos estados não enfraquece. Endurece.**

### 8.5 Efeito sobre HISTORIA

A entrada de HISTORIA deriva da saída de ACOLHIMENTO (§3.4). Como a saída
endurece, **a entrada de HISTORIA endurece na mesma medida**. Nenhuma outra fase
é afetada — varredura completa em `src/`.

### 8.6 Invariantes verificados

| Invariante | Situação |
|---|---|
| **I-7** — histórico é imutável | **preservado** — campos antigos permanecem; monotonicidade preservada |
| **I-8** — ausência de informação nunca vira ausência da característica | **preservado e reforçado** — ramo B declara "não há material", nunca "não foi revisado" |
| **I-9** — nenhuma frase automática conclui qualidade | **preservado** — nada aqui conclui sobre pessoa |
| **I-11** — guarda de navegação não pode ser mais rígido que o domínio | **reforçado** — hoje o gate é mais rígido que o domínio |
| **ADR-035** — autoridade decisória única | **preservado** — nenhuma decisão muda de dono |
| I-1 a I-6, I-10, I-12 | **não tocados** — nada alcança Motor, catálogo, escalas ou Base |

---

## 9. Especificação para Implementação

> **Instruções objetivas para o Agente 03. Nenhuma decisão de domínio permanece
> aberta nesta seção. Se algo abaixo exigir interpretação, é defeito deste
> documento — interrompa e reporte, não decida.**

### 9.1 Escopo autorizado

| # | Alteração | Arquivo |
|---|---|---|
| **E1** | Substituir os **dois** critérios de saída de ACOLHIMENTO por **um** critério `acolhimento-preparado` | `src/modules/curadoria/cos/phases.ts` |
| **E2** | Substituir o critério de entrada de HISTORIA pelo mesmo predicado | `src/modules/curadoria/cos/phases.ts` |
| **E3** | Expor em `AcolhimentoRecord` os dois fatos de material — presença de história enviada e presença de documento vinculado | `src/modules/curadoria/cos/types.ts` · `repository.ts` |
| **E4** | Retirar os dois checkboxes da superfície | `src/components/curadoria/acolhimento-workspace.tsx` |
| **E5** | Deixar de aceitar os dois booleanos na action e no schema | `src/modules/curadoria/actions.ts` · `schema.ts` |
| **E6** | Testes cobrindo as **sete linhas** da tabela §8.3 | suíte unitária do COS |

### 9.2 O predicado, pronto para codificar

```
acolhimento-preparado(record) =
       ( ¬record.acolhimento.hasSubmittedStory
       ∧ ¬record.acolhimento.hasLinkedDocument )                 -- ramo B
    ∨  ( naoVazio(record.acolhimento.knownFacts)
       ∨ naoVazio(record.acolhimento.openPendencies) )           -- ramo A
    ∨  record.acolhimento.preparedBefore                         -- monotonicidade

naoVazio(lista) = existe item em lista com item.trim() ≠ ""
```

### 9.3 Origem de cada fato — sem ambiguidade

| Fato | Origem exata |
|---|---|
| `hasSubmittedStory` | existe `patient_stories` do paciente do Case com `status = 'enviada'` |
| `hasLinkedDocument` | existe `patient_story_attachments` cujo `story_id` é a história do Case (o `document_id` referencia `patient_documents`) |
| `knownFacts` | `consultation_records.known_facts` (já exposto) |
| `openPendencies` | `consultation_records.open_pendencies` (já exposto) |
| `preparedBefore` | `context_reviewed ∧ documents_reviewed` **do regime anterior** — leitura exclusiva para monotonicidade (§7.3 regra 4) |

### 9.4 Proibições absolutas

| # | É proibido |
|---|---|
| **X1** | **Criar qualquer rastreio de leitura** — `viewed_at`, `opened_at`, log de acesso, telemetria de tela (§0) |
| **X2** | **Remover, renomear, zerar ou migrar** `context_reviewed` / `documents_reviewed` (§7.1) |
| **X3** | **Fazer backfill** de `known_facts` a partir dos booleanos antigos (§7.3 regra 2) |
| **X4** | **Contar documento órfão** — sem vínculo em `patient_story_attachments` (§4.2) |
| **X5** | **Contar história em `rascunho`** (§5.1) |
| **X6** | **Fazer o critério regredir** por edição de conteúdo (§6.2) |
| **X7** | **Concluir preparação no ramo B** — o ramo B afirma ausência de material, jamais preparo (§5.2) |
| **X8** | Alterar objetivo, ordem, rastreabilidade ou qualquer outra fase do COS |
| **X9** | Alterar Motor, catálogo, escalas, células, critérios médicos, Compatibilidade ou Avaliação Técnica |

### 9.5 Critério de aceite verificável

O pacote está pronto quando **as sete linhas da tabela §8.3 passam como teste**, e:

| # | Verificação |
|---|---|
| A1 | Case sem material conclui o Acolhimento **sem nenhum ato humano** |
| A2 | Case com material **não** conclui sem registro de preparação |
| A3 | Case do regime anterior já concluído **permanece concluído** |
| A4 | Case concluído no ramo B que recebe material **volta a exigir registro** |
| A5 | `known_facts` com apenas `""` ou `"   "` **não** satisfaz o predicado |
| A6 | Nenhuma leitura de `context_reviewed` / `documents_reviewed` sobrevive em regra de negócio |
| A7 | Nenhum campo, coluna ou evento de rastreio de leitura foi criado |

### 9.6 Rollback

Reverter o commit. Nenhum dado é destruído: o pacote **não escreve**, apenas
deixa de exigir escrita. As colunas antigas permanecem intactas em qualquer
cenário.

---

## 10. As três lacunas do Agente 03 — respostas diretas

| # | Lacuna | Resposta |
|---|---|---|
| **L-1** | *"`knownFacts` e/ou `openPendencies`" é ambíguo* | **Disjunção inclusiva:** `known_facts ≠ ∅ ∨ open_pendencies ≠ ∅`. Basta um (§2.1) |
| **L-2** | *`story_attachments` ou `patient_documents`?* | A pergunta estava mal posta: `patient_story_attachments` é **tabela de junção**. **Fonte:** `patient_documents`. **Pertencimento:** o vínculo. **Órfão não conta** (§4) |
| **L-3** | *Caso sem material não formalizado* | Ramo B formalizado: `¬história enviada ∧ ¬documento vinculado ⟹ preparado`, **sem ato humano**, com a exceção de monotonicidade quando o material chega depois (§5, §6.3) |

---

## DECISÃO

# **MÉTODO MATERIALIZADO**

Não exige ADR. Nenhum conceito, critério, escala, célula, peso, estado do Motor,
filtro ou leitura foi criado, alterado ou removido. As nove fases do COS, seus
objetivos, sua ordem e sua rastreabilidade permanecem idênticos. O que este
documento define é **qual fato evidencia a conclusão de uma etapa** — decisão de
Método, não de domínio.

**Ressalva de classificação:** se o DT-01 ou o Guardião entenderem que alterar
critério de saída do COS constitui *"alteração do processo da Curadoria"*
(Modelo §13), então **exige ADR** — e este documento serve de conteúdo normativo
pronto, sem retrabalho.

---

## 11. Correção documental pendente — não executada aqui

A frase *"o sistema sabe se a história e os documentos foram abertos"* aparece na
auditoria operacional §2.3 e é **falsa** (§0). **Nenhum documento foi corrigido
por esta missão.** Fica registrada como correção documental a executar em pacote
próprio, por quem tiver autoridade sobre aqueles arquivos.

---

*Fim do Método M-001. **Não implementa o Item 1.5.** Encaminhamento exclusivo:
**DT-01**, para validação documental e decisão de abertura do pacote pelo
Agente 03.*
