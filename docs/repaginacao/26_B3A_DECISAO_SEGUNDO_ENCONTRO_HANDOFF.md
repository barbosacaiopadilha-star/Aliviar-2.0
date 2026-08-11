# 26 · B3-A — decisão, Segundo Encontro, handoff e Concierge

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-11 |
| **Natureza** | auditoria e contrato de domínio. **Zero código, zero migration, zero teste** |

## A · Pré-flight

| | |
|---|---|
| **Branch** | `d9-primeiro-encontro` |
| **HEAD** | `496d544` |
| **`origin/main`** | `dff4c86` — **49 commits atrás** |
| **Árvore** | limpa, exceto `?? AGENTS.md` e `?? docs/repaginacao/foundation/FOUNDATION_VERIFICATION.md`, **ambos pré-existentes e não tocados** |

---

## B · Inventário de fatos

| Fato | Fonte canônica | Writer | Ator | Consequência | Status |
|---|---|---|---|---|---|
| **emittedAt** | `curadoria_reports.emitted_at` | `report-repository` | Curador | congela o relatório | **canônico** |
| **presentedAt** | `devolutiva_records.presented_at` | `report-repository:325` | Curador | registra a **apresentação** | **canônico** |
| **deliveredAt** | `curadoria_reports.delivered_at` + `curated_selections.status='DELIVERED'` | `repository:367` | Curador | libera a Curadoria para ela · **pré-condição da decisão** | **canônico** |
| **2º encontro — agendado** | — | — | — | — | ❌ **não existe** (D-10) |
| **2º encontro — realizado** | **`presentedAt`** | idem | Curador | o encontro ocorreu | **canônico**, com ressalva §F |
| **decisão** | **`curadoria.patient_curadoria_decisions`** | `registerPatientDecision` | **a paciente** | **dispara o handoff** | **canônico** |
| **handoff** | *derivado* de `decision` | — | — | Curador → Concierge | **canônico, e já implementado** |
| **responsabilidade do Concierge** | `journey-responsibility.ts` | — | — | exibição | **canônico** |
| **assignment do Concierge** | — | — | — | — | ❌ **não existe** (GAP-D12-C1) |
| `connection_records` | domínio **de conexão**, máquina de estados própria | `connection/repository` | — | continuidade pós-decisão | **outro domínio — não é decisão** |

## C · O fato canônico de decisão — provado, não inferido

**`curadoria.patient_curadoria_decisions`**

```
case_id · curated_selection_id · chosen_option_id · outcome · note · decided_at
unique (curated_selection_id)
check (outcome = 'CHOSEN') = (chosen_option_id is not null)
grants: select, insert          ← sem UPDATE, sem DELETE
comment: "A escolha do paciente. NONE_OF_THEM e desfecho legitimo,
          nunca falha do paciente. Append-only."
```

**Não há fato concorrente.** `connection_records` pertence ao domínio de
**conexão/continuidade**, com máquina de estados e chave própria
(`connection_records_case_id_key`) — **não é decisão**.

## D · O writer, e a cadeia inteira

```
components/patient/curadoria-decision-panel.tsx
  → registerDecisionAction            requireRoleForAction("paciente")
    → gate: curated_selections.status === 'DELIVERED'
      → registerPatientDecision       insert em patient_curadoria_decisions
        → policy patient_decisions_insert_patient
```

**§6 respondido: A — a paciente.** E o Curador **não pode**, por RLS. O código
diz isso em texto, no `devolutiva-workspace`:

> *"O que NUNCA faz: registrar a decisão dela. A decisão é ato do paciente, e a
> RLS de `patient_curadoria_decisions` só aceita a própria pessoa — **o Curador
> acompanha, nunca decide em nome de ninguém**."*

## E · 🔎 A correção mais importante desta auditoria

A Rodada 2 concluiu (**B2-1/P5**) que *"a decisão da paciente não se registra"*,
observando `connection_records = 0` e *"o formulário volta ao estado inicial e
nenhuma mensagem aparece"*.

**As duas observações têm outra explicação, e o código a dá:**

```ts
if (result.success) router.refresh();
else setErro(result.error ?? "Não foi possível registrar sua decisão.");
```

| Observado | O que o código faz |
|---|---|
| *"formulário volta ao estado inicial"* | **é exatamente o que `router.refresh()` produz no SUCESSO** |
| *"nenhuma mensagem aparece"* | **no sucesso não há mensagem** — só o refresh |
| `connection_records = 0` | **tabela errada** — a decisão vai para `patient_curadoria_decisions` |

> ### Hipótese forte: a decisão **persistiu**, e o defeito é **silêncio**, não perda.
>
> Isso muda a natureza do problema — de **domínio** para **feedback**, e de
> P0-arquitetural para P0-de-UX. É violação do princípio **P2** (*toda ação
> visível tem consequência visível*), **não** de integridade.

**Verificação exata, de uma linha, antes de B3 assumir isto:**

```sql
select outcome, chosen_option_id, decided_at
from curadoria.patient_curadoria_decisions
where case_id = 'fc07b1a1-6242-41eb-b973-123bb1d8aba7';
```

**Não corrigi nem reclassifiquei nada** — a evidência da Rodada 2 fica como está.
**Se a linha existir, B2-1 é reclassificada de "não persiste" para "persiste sem
avisar".**

## F · `presentedAt` — semântica preservada

`presentedAt` = **houve apresentação/conversa**. Não é entrega digital, não é
decisão, não é handoff.

**Varredura por uso indevido: nenhum.** `resolveCurrentResponsible` decide por
`decision`, e `inferPhaseFromCuradoria` só usa `emittedAt` para a fase `escolha`
— **e a guarda de `decision` vem antes**, o que neutraliza o efeito.

**Ressalva honesta:** `presentedAt` é hoje **o único** fato do Segundo Encontro.
Ele prova que **houve apresentação**, e a operação o trata como prova de que
**o encontro ocorreu**. São quase a mesma coisa, mas não exatamente — igual à
distinção que a **D-9** fez para o Primeiro Encontro entre *produto* e *evento*.
**Não proponho corrigir agora** (§7 do adendo 23: sem simetria artificial).

## G · `deliveredAt` — semântica preservada

`deliveredAt` = conteúdo digital disponibilizado. **Não** significa escolha, fim
da responsabilidade do Curador nem entrada do Concierge.

**Uso legítimo e importante:** é **pré-condição** da decisão — a action recusa
com *"Esta Curadoria ainda não foi apresentada."* quando o status não é
`DELIVERED`. **Ser pré-condição não é ser handoff.**

## H · Segundo Encontro

| Item | Existe? |
|---|---|
| agendamento | ❌ **não** — D-10 |
| writer de agendamento | ❌ não |
| realizado | ✅ **`presentedAt`** |
| outcome próprio | ✅ parcial — `devolutiva_records`: `patientQuestions`, `observations`, `nextSteps` |
| vínculo com a decisão | ⚠️ **indireto** — ambos pendem do relatório/seleção, sem FK entre si |
| UI operacional | ✅ `DevolutivaWorkspace`, que **nunca** registra a decisão |

## I · D-10 — classificação

> **Categoria B — necessário para UX, não para integridade.**

A decisão **não depende** de agendamento; o handoff **não depende**; a
responsabilidade **não depende**. **D-10 não bloqueia B3.**

O que ele custa é a paciente **não saber quando é o segundo encontro** — dor de
experiência, registrada em §04 e no adendo 23.

## J · Handoff — o código **já faz** o que o contrato humano pede

`journey-responsibility.ts` tem a guarda explícita, **antes** de qualquer fase:

```ts
if (input.curadoriaRecord && !input.curadoriaRecord.devolutiva.decision) {
  return { role: "curador", ... };
}
```

E o próprio arquivo documenta o defeito que ela corrigiu: *"a paciente passava a
ver o Concierge como responsável no exato momento em que o trabalho ainda era
todo do Curador"*.

> **Nenhuma divergência.** O handoff **é** a decisão. `emittedAt`, `presentedAt`,
> `deliveredAt` e `meetingHeldAt` **não** disparam troca.

## K–L · Responsabilidade — os quatro cenários

| | Situação | Esperado | Real |
|---|---|---|---|
| **R1** | antes da entrega | Curador | ✅ |
| **R2** | entregue, sem decisão | Curador | ✅ |
| **R3** | apresentada, sem decisão | Curador | ✅ |
| **R4** | decisão registrada | Concierge | ✅ |

**Quatro de quatro. Nada a corrigir.**

*(Nuance: com `outcome = 'NONE_OF_THEM'`, `inferPhaseFromCuradoria` devolve
`curadoria` — mas a guarda já passou, então o papel é Concierge. **É o correto**:
recusar os três é decisão, e o acompanhamento segue.)*

## M · Assignment do Concierge — **não existe, e B3 não precisa**

`resolveCurrentResponsible` já resolve com
`conciergeName ?? attendantName ?? "Equipe Aliviar"`.

> **Separação do §13 confirmada:** *"o Concierge é a próxima responsável"* **existe**
> e é derivável. *"Qual pessoa Concierge"* **não existe** (GAP-D12-C1).
>
> **B3 usa o fallback honesto — "Equipe Aliviar" — e não inventa nome, foto nem
> telefone.**

## N · Journey e Home

A mudança de estado após a decisão **deriva do fato canônico**, não de proxy.
`inferPhaseFromCuradoria` consulta `decision` **primeiro**.

## O · Segurança

| Prova | Situação |
|---|---|
| paciente A não decide Case B | ✅ policy `patient_decisions_insert_patient` |
| Curador não decide | ✅ RLS, e declarado no código |
| decisão pertence ao Case certo | ✅ `case_id` vem da própria `curated_selections`, **nunca do cliente** |
| opção pertence àquela Curadoria | ✅ FK para `curated_selection_options` + constraint de coerência |
| uma decisão por seleção | ✅ índice único |
| concorrência | ✅ `23505` tratado como **idempotência**, devolvendo a existente |

**Nenhuma falha encontrada.**

## P · Auditoria — **a lacuna real desta missão**

> **A decisão não gera trilha.** Sem `audit_logs`, sem `case_events`, sem
> trigger.

**E a assimetria é gritante:** o **reconhecimento do Perfil** grava
`profile_recognized` em `audit_logs` com `actor_role`. **A decisão — fato
material do cuidado, e o gate do handoff — não grava nada.**

**Gravidade: média-alta.** A tabela é append-only, única por seleção e traz
`decided_at`, então **é auditável em si**. O que falta é aparecer na **trilha
unificada**, junto dos outros atos.

**Registrado como GAP-B3-1.** Custo estimado: **nível C** (uma inserção na
action existente), sem migration.

## Q · Reversibilidade — **definitiva, e provado no banco**

| Evidência | |
|---|---|
| grants | `select, insert` — **sem UPDATE, sem DELETE** |
| índice | único por `curated_selection_id` |
| writer | trata duplicata como **sucesso idempotente** |
| comentário da tabela | *"Append-only"* |

**§18 respondido: A — definitiva.** Não por conveniência técnica: **por
construção do banco**.

**E há caminho legítimo de mudança de rumo, sem editar decisão:** uma **nova
seleção curada** tem novo `curated_selection_id` e admite decisão nova. **Refazer
a Curadoria é a reversão; editar o ato, não.** Coerente com todo o Método.

## R · §16 — o comparador não tem efeito colateral

`comparisonIds` é **estado local de um reducer**. Abrir, comparar e marcar
**não** escrevem nada. **Confirmado.**

## S · Fluxo canônico, só com fatos existentes

```
CURADORIA PREPARADA
   └─ emittedAt                      (Curador · relatório congela)
        ↓
SEGUNDO ENCONTRO — AGENDAMENTO
   └─ ❌ nenhum fato                 D-10 · não bloqueia
        ↓
ENTREGA DIGITAL
   └─ deliveredAt + status DELIVERED (Curador · habilita a decisão)
        ↓
APRESENTAÇÃO / ENCONTRO 2
   └─ presentedAt                    (Curador · + devolutiva_records)
        ↓
DECISÃO
   └─ patient_curadoria_decisions    (A PACIENTE · append-only, definitiva)
        ↓
HANDOFF
   └─ derivado da decisão            (sem fato próprio — e está certo)
        ↓
CONCIERGE RESPONSÁVEL
   └─ journey-responsibility         (exibição · sem assignment)
```

**Duas setas sem fato próprio, e as duas por bom motivo:** o agendamento do 2º
encontro (**D-10**, não bloqueante) e o handoff (**derivado**, conforme decidido
no adendo 23).

## T · Gaps classificados

| Gap | Classificação |
|---|---|
| **GAP-A1** — `meeting_scheduled_at` sem writer | **outra track** — Encontro 1 |
| **D-10** — agendamento do 2º encontro | **não bloqueante B3** |
| **D-11 residual** — orquestração do 1º encontro | **outra track** |
| **GAP-D12-C1** — identidade do Concierge | **não bloqueante B3** — o fallback resolve |
| **GAP-B3-1** *(novo)* — decisão sem trilha de auditoria | **não bloqueante**, mas **recomendo fazer junto** |
| **GAP-B3-2** *(novo)* — decisão persiste **sem feedback** | **BLOQUEANTE de UX para B3** — é o coração do §21 |
| **GAP-B3-3** *(novo)* — `presentedAt` acumula *apresentação* e *encontro realizado* | **não bloqueante** — mesma classe da D-9, sem simetria artificial |

## U · Stop conditions do §29 — verificadas uma a uma

| Condição | Situação |
|---|---|
| nenhum fato canônico de decisão | ❌ **existe** |
| dois fatos concorrentes | ❌ **não** — `connection_records` é outro domínio |
| writers conflitantes | ❌ **não** — só a paciente escreve |
| handoff ligado a delivered/presented | ❌ **não** — já é a decisão |
| decisão reversível sem autoridade | ❌ **não** — sem UPDATE nem DELETE |
| exige identidade de Concierge | ❌ **não** — o fallback basta |

**Nenhuma disparou.**

## V · Recomendação para a implementação de B3

**O contrato existe e é suficiente. O que B3 precisa construir é experiência, não
domínio.**

| # | Item | Nível |
|---|---|---|
| 1 | **Feedback da decisão** — confirmar o que foi registrado, quando, e o que vem agora. **GAP-B3-2** | **A** |
| 2 | **Estado pós-decisão** na Home e na jornada, derivado do fato canônico | **A** |
| 3 | **"Agora o Concierge assume"** com o fallback honesto — sem nome, foto ou telefone inventados | **A** |
| 4 | **Trilha de auditoria** da decisão — **GAP-B3-1** | **C** |
| 5 | **Falar com a Aliviar** ao lado da decisão — §09 do Contrato Mestre | **A** |

**Não construir em B3:** agendamento do 2º encontro · identidade do Concierge ·
reversão da decisão · conceito de "preferência" (**§7: não existe, e não invento**) ·
integração de WhatsApp (§22 — **não há capacidade legítima hoje**; fica para
track posterior).

---

# B3-A CONCLUÍDA — CONTRATO EXISTENTE SUFICIENTE PARA IMPLEMENTAÇÃO

**O domínio já tem tudo o que B3 pede:** fato canônico de decisão, writer
correto, autorização provada, handoff pela decisão, responsabilidade nos quatro
cenários e fallback honesto para o Concierge.

**A descoberta que muda o plano:** o defeito de B2-1 provavelmente **não é
persistência — é silêncio**. Verificar com a consulta do §E antes de B3 começar;
**se confirmar, B3 vira uma missão de feedback, e menor do que se supunha.**

**Uma decisão permanece aberta, e é a mesma da D-11 em outra roupa:** o Método
descreve a decisão nascendo **no Segundo Encontro**, mas o domínio permite que
ela seja registrada **por ela, sozinha, a qualquer momento após a entrega**.
**Não são incompatíveis** — ela pode decidir durante o encontro. **Só não é
exigido.** Fechar essa folga condicionaria o ato dela ao registro do Curador —
**exatamente a questão da ADR-042**, e por isso **não a fecho aqui**.

**Próximo destinatário:** **`DT-01`** para a verificação do §E e a folga acima;
**`03 ENGENHEIRO`** para os itens 1, 2, 3 e 5 de §V, que **não dependem de
nenhuma resposta**.
