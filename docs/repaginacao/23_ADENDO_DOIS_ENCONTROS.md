# 23 · Adendo — os dois encontros com o Curador

| Campo | Valor |
|---|---|
| **Autor** | Agente 02 — Arquiteto |
| **Data** | 2026-08-10 |
| **Base** | `7b130d6` · árvore limpa exceto `?? AGENTS.md` e `?? docs/repaginacao/foundation/…`, **pré-existentes** |
| **Natureza** | adendo de domínio. **Zero código, zero migration aplicada, zero banco** |

---

## A · Estruturas existentes — a auditoria do §4

| Estrutura | O que é | Serve? |
|---|---|---|
| **`consultation_records.meeting_scheduled_at`** | `timestamptz`, na **mesma linha** de `understanding_confirmed_at`, uma por Caso | ✅ **serve — e já existe** |
| `consultation_records.understanding_confirmed_at` | reconhecimento, **acumulativo e irreversível** (P5) | produto, **não** evento |
| `validacao.validatedAt` | validação dos mapas | produto, **não** evento |
| `devolutiva.presentedAt` | apresentação realizada | ✅ Encontro 2 |
| `crm_appointments` | agenda com status e tipo | ❌ **outro domínio** — referencia `crm_contacts` e `crm_cases`, **não** `curadoria.cases` |
| `case_events` | linha do tempo do Caso | ❌ **enum fechado**: `created · status_changed · curator_assigned · note_updated` |

### O achado que muda o tamanho do problema

> **`meeting_scheduled_at` já existe, e está viva.** É lida pelo
> `repository.ts:275`, tipada em `types.ts:58` e povoada nos mocks.
>
> **O que falta não é a coluna — é o escritor.** Nenhuma das duas actions que
> gravam em `consultation_records` a toca: uma grava `known_facts` /
> `open_pendencies`, a outra `narrative` / `understanding_confirmed_at`.

**`crm_appointments` foi considerado e recusado.** Ele tem exatamente o vocabulário
pedido — `agendado · confirmado · concluido · cancelado · nao_compareceu` —, mas
pertence ao **CRM**, com FK para `crm_contacts` e `crm_cases`. Reutilizá-lo
acoplaria a Curadoria ao CRM por uma data. **Custa mais do que resolve.**

## B · GAP-1 — real, e menor do que parece

| Fato | Existe? |
|---|---|
| Encontro 1 **agendado** | ✅ **coluna existe**, sem escritor |
| Encontro 1 **realizado** | ❌ **não existe** |
| Encontro 1 **reagendado** | ⚠️ derivável — a coluna é mutável |
| Encontro 1 **cancelado** | ❌ não existe |
| **data efetiva** | ❌ não existe |

**Precisa persistência? Sim — para uma coisa só: *aconteceu*.**

**Por que `understanding_confirmed_at` não serve como prova de realização:**
ele é **acumulativo e não regride** (*"uma vez reconhecida, nunca regride (P5)"*),
e pode ser gravado **sem encontro** — o Curador pode confirmar entendimento lendo
a história. **Produto ≠ evento**, e é justamente o que a missão pede para não
confundir.

## C · Solução mínima — **uma coluna**

```sql
alter table curadoria.consultation_records
  add column meeting_held_at timestamptz;
```

| Por quê | |
|---|---|
| **na tabela certa** | é o registro da Consulta Inicial, e já guarda `meeting_scheduled_at` ao lado |
| **uma por Caso** | garantido pelo índice único existente |
| **par natural** | `meeting_scheduled_at` → `meeting_held_at` |
| **sem entidade nova** | nenhuma tabela, nenhum enum, nenhum estado |

**Mais o escritor que falta:** a action do Acolhimento passa a aceitar
`meeting_scheduled_at` e `meeting_held_at`. **Não é migration — é apresentação
sobre coluna existente**, exceto pela coluna nova.

### Os estados que **não** devem existir

| Estado | Decisão | Por quê |
|---|---|---|
| **reagendado** | ❌ **não criar** | reagendar é **atualizar** `meeting_scheduled_at`. A tabela tem `updated_at` com trigger. Histórico de reagendamentos é **outra pergunta** — e ninguém a fez |
| **cancelado** | ❌ **não criar** | cancelar-para-remarcar **é** reagendar. Cancelar em definitivo é abandono do Caso, que tem mecanismo próprio |
| **não compareceu** | ❌ **não criar** | não há operação que dependa disso hoje |

> **O §3.D pediu esses estados "somente se realmente necessários". Não são.**
> Duas datas respondem às seis perguntas do §5 — e um enum de status
> responderia às mesmas, cobrando manutenção para sempre.

## D · Migration

**NECESSÁRIA — e é a menor possível: uma coluna nullable, aditiva.**

**Classificação: nível E do §25 do Contrato Mestre ⇒ [ALTERAÇÃO DE DOMÍNIO —
APROVAÇÃO NECESSÁRIA].** Fica registrada como **[D-9]**, não implementada.

```
-- alto nível, não aplicar
alter table curadoria.consultation_records
  add column meeting_held_at timestamptz;

comment on column curadoria.consultation_records.meeting_held_at is
  'Encontro 1 (Alinhamento) REALIZADO. Evento, nunca produto:
   understanding_confirmed_at e a validacao dos mapas sao consequencias dele
   e nao o substituem. Nulo enquanto nao houver encontro.';
```

**Sem backfill.** Casos anteriores ficam com `null` — e `null` diz a verdade:
não sabemos a data.

## E · Encontro 1 — fatos e estados

| Estado derivado | Regra |
|---|---|
| **não agendado** | `meeting_scheduled_at is null` |
| **agendado** | `meeting_scheduled_at is not null and meeting_held_at is null` |
| **realizado** | **`meeting_held_at is not null`** |

**O fato que comprova conclusão do Encontro 1 é `meeting_held_at`.**

**F respondida:** a validação dos mapas **continua sendo consequência**.
`understanding_confirmed_at` e `validatedAt` **permanecem produtos** — a Mesa
continua exigindo-os, e nenhum deles ganha ou perde autoridade com este adendo.

## F · Encontro 2 — `presentedAt` é suficiente?

**Para o evento realizado: SIM. Preservar.**

`devolutiva.presentedAt` prova que a apresentação aconteceu, e a separação de
quatro fatos já está correta e **não é tocada**: `emittedAt` (preparada) ·
`presentedAt` (apresentada) · `deliveredAt` (disponibilizada) · `decision`.

**A lacuna que existe é outra, e é do agendamento:** não há como registrar
**quando será** o Encontro 2 — e o §5 pergunta *"a paciente sabe qual é seu
próximo encontro?"*.

> **Não crio simetria artificial (§7).** Se a operação precisar avisar a data do
> segundo encontro, **a mesma solução mínima serve** — uma coluna em
> `curadoria_reports`. **Enquanto ninguém precisar, não criar.**
>
> Registrado como **[D-10]**, não proposto.

## G · Handoff

**A derivação pela decisão permanece suficiente.** Os quatro critérios do §2 se
verificam: é imediato · não há etapa intermediária · não há recusa · não há
atraso próprio · não há necessidade autônoma de auditoria temporal.

**E o HEAD confirma que já opera assim:** `7b130d6 — "o Concierge deixa de
assumir o caso antes de existir decisão"`.

**Não encontrei razão material para persistir o handoff agora.**
`emittedAt`, `presentedAt` e `deliveredAt` **continuam sem** disparar a troca.

## H · Impactos

| Superfície | Impacto |
|---|---|
| **Domínio** | uma coluna. Nenhuma regra, nenhum enum, nenhuma autoridade |
| **Jornada (UX)** | ganha dois marcos reais: *"Primeiro encontro — [data]"* e *"Realizado em [data]"*. **Projeção, não enum de domínio** (§6) |
| **Home** | *"Seu primeiro encontro é em [data]"* passa a ser **fato lido**, não texto genérico |
| **Mesa** | o Acolhimento ganha dois campos de data. **Nada mais** — nenhuma etapa nova, nenhuma guarda |
| **Agenda** | **nenhum** — `crm_appointments` não é tocado, e o CRM segue independente |
| **Testes** | `acolhimento-preparado.test.ts` já carrega `meetingScheduledAt: null`; acrescentar `meetingHeldAt` ao fixture. **Nenhum oráculo muda** |
| **Estados (§13)** | duas linhas novas no catálogo, ambas nível **A/B** depois da coluna |

**O que NÃO muda:** M-001 e M-003 (Acolhimento preparado e seu registro) ·
`understanding_confirmed_at` acumulativo · a exigência de validação dos mapas ·
as seis etapas da Mesa · a regra do handoff.

## I · Critérios de aceite

| # | Critério |
|---|---|
| **E1** | com `meeting_scheduled_at` preenchido e `meeting_held_at` nulo, a paciente vê *"Seu primeiro encontro é em [data]"* e **não vê** *"realizado"* |
| **E2** | com `meeting_held_at` preenchido, a jornada mostra o marco **com a data efetiva** |
| **E3** | `understanding_confirmed_at` **sozinho não** marca o encontro como realizado |
| **E4** | reagendar **atualiza** `meeting_scheduled_at` e **não cria** registro novo |
| **E5** | Caso antigo, sem as datas, **não** exibe marco inventado — exibe ausência |
| **E6** | a Mesa não ganha etapa nova; o Acolhimento continua com as mesmas exigências |
| **E7** | `crm_appointments` **não é lido nem escrito** por nenhum caminho da Curadoria |
| **E8** | com decisão ausente o responsável é o Curador; com decisão presente, o Concierge — **inalterado** |

## J · Rollback

`alter table … drop column meeting_held_at`. **Aditiva e nullable: nada depende
dela para existir.** O escritor volta a não gravar; a leitura volta a `null`.
**Nenhum dado histórico se perde** — porque nenhum existia.

---

## Resposta final

**A.** `meeting_scheduled_at` **viva e sem escritor** · `crm_appointments`
recusada (outro domínio) · `case_events` recusada (enum fechado).

**B.** GAP-1 **é real**, e precisa de persistência **para um único fato**:
*o encontro aconteceu*.

**C.** Uma coluna: **`consultation_records.meeting_held_at`** — mais o escritor
que já faltava para a coluna que já existe.

**D.** **Migration necessária**, mínima e aditiva. **Nível E ⇒ [D-9], aprovação
do DT-01.**

**E.** Encontro 1: dois fatos, três estados derivados. **Sem enum, sem
cancelamento, sem reagendamento como estado.**

**F.** `presentedAt` **é suficiente** para o Encontro 2 realizado. O agendamento
do segundo encontro é lacuna **registrada [D-10], não proposta**.

**G.** Handoff derivado da decisão **permanece suficiente** — e o HEAD confirma
que já é assim.

**H.** Impacto restrito a duas datas, uma projeção de jornada e um fixture.

**I.** Oito critérios. **J.** Rollback de uma linha.

---

# ADENDO DOS DOIS ENCONTROS APTO PARA IMPLEMENTAÇÃO

**Condicionado a [D-9]** — a migration de uma coluna exige aprovação, como manda
o §25. **A parte de escritor e projeção não depende dela e pode ser preparada
junto.**

**Próximo destinatário:** **`DT-01`** para [D-9]; depois **`03 ENGENHEIRO`**.
