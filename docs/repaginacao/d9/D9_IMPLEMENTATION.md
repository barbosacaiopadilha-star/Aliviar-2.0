# D-9 · Primeiro Encontro com o Curador

## A semântica

| fato | prova | pode ser inferido? |
|---|---|---|
| `meeting_scheduled_at` | data prevista do Primeiro Encontro | — já existia |
| **`meeting_held_at`** | **o Primeiro Encontro aconteceu** | **NUNCA** |

`null` significa *"não existe prova registrada"* — jamais *"não houve"*.

**A cláusula central é negativa:** produto do encontro não é prova do evento. O
Curador pode reconhecer a história lendo o que ela escreveu, e pode validar os
mapas sem que o encontro tenha ocorrido. Por isso `meeting_held_at` não é
derivado de `understanding_confirmed_at`, de `validated_at`, nem do próprio
agendamento.

## Migration

`20260810120000_d9_primeiro_encontro_realizado.sql` — **uma** coluna,
`timestamptz null`, sem default, sem backfill, sem trigger, sem enum, sem
tabela nova.

Aplicada pela CLI (ledger: **117 de 117**). A linha existente ficou `null`.

**Rollback:** `alter table curadoria.consultation_records drop column meeting_held_at;`

## Writers

**`meeting_held_at`** — `registrarPrimeiroEncontroRealizadoAction`, exposta no
Acolhimento do Curador como *"Registrar encontro como realizado"*. Exige Curador
autenticado.

**Idempotente e não destrutivo:** havendo prova, a data original permanece e o
retorno é sucesso — nada falhou, nada duplicou. A corrida entre dois cliques é
fechada no próprio `update`, com `.is("meeting_held_at", null)`: só grava quem
chegar com a coluna vazia.

O writer **não toca** em `understanding_confirmed_at`, `validated_at` nem
`meeting_scheduled_at`.

## GAP DE WRITER — agendamento do Primeiro Encontro

`meeting_scheduled_at` **continua sem quem a escreva**. `registerAcolhimentoAction`
grava apenas `known_facts` e `open_pendencies`; nenhuma outra action toca a
coluna. Não inventei um writer nem escrevi direto no banco para disfarçar.
**O ato real de agendar não existe no produto.**

## O que NÃO foi feito, de propósito

`handed_off_at` (§16) · cancelamento, no-show, `meeting_status` (§14) ·
agendamento formal do Segundo Encontro — **D-10 segue pendente** (§15), e
`presentedAt` continua sendo o fato de realização do Segundo Encontro.

O handoff continua dependendo **exclusivamente** da decisão: nem
`meeting_held_at`, nem `presentedAt`, nem `emittedAt`, nem `deliveredAt` o movem.
