# DOMAIN CONVERGENCE — Plano de Migração

**Estado**: **EXECUTADO E CONCLUÍDO** (2026-07-25) — ver §EXECUÇÃO no fim. Executou as Fases 3c/4 de `CORRECAO_DOMINIO_PAPEIS_E_CASE.md` §5.

## 1. Arquitetura atual

Duas representações de Case no schema `curadoria`, **sem nenhuma FK entre elas** (auditado em produção):

- **`cases`** — o Case do Método/Ontologia §3.2: `responsible_id/role` (transferência auditada via `transfer_case_responsibility`), 11+ tabelas do Método dependem dele; RLS `can_access_case()` por responsabilidade atual.
- **`crm_cases`** — o caso do CRM: `pipeline_stage` (17 etapas), `responsible_curator_id`/`responsible_concierge_id` próprios. Dependentes: FKs entrantes de `crm_contacts.active_case_id`, `crm_tasks.case_id`, `crm_interactions.case_id`, `crm_appointments.case_id`; funções de RLS `can_access_crm_contact` e `is_curator_for_crm_case`; 3 policies; trigger `updated_at`. **Zero referência no código deste repositório fora de `modules/crm`/telas `/coa/*`** (verificado por grep e pelo schema remoto — sem views, sem cron, sem webhooks).
- Dados atuais: `crm_cases` contém **apenas 2 fixtures de smoke test, duplicadas entre si** ("Ana Demonstração", e-mail `.invalid`); `cases` contém 2 Cases reais de demonstração.

## 2. Arquitetura proposta

**Um conceito, uma tabela**: `curadoria.cases` é O Case da jornada inteira (Lead → Atendimento → Curadoria → Concierge → Encerramento).

- A **plataforma CRM continua existindo** (contatos, tarefas, agenda, interações) — suas FKs de "case" passam a apontar para `cases`.
- `pipeline_stage` deixa de ser fonte de verdade de responsabilidade: quem responde é `responsible_role` + o histórico auditado. O funil do CRM passa a ser **projeção derivada** (view) do estado real do Case + etapa do lead, nunca um segundo estado editável.
- `crm_cases` deixa de existir como tabela editável; fica como **view de compatibilidade somente-leitura** durante a transição e é removida no fim.

## 3. Impacto em banco

| Passo | Objeto | Natureza |
|---|---|---|
| B1 | apagar as 2 fixtures de `crm_cases` (+ o `active_case_id` que aponta) | destrutivo, dados fictícios autodeclarados — export antes |
| B2 | `crm_contacts.active_case_id`, `crm_tasks.case_id`, `crm_interactions.case_id`, `crm_appointments.case_id` → re-FK para `curadoria.cases(id)` | aditivo/troca de constraint (tabelas com 0–1 linhas hoje) |
| B3 | view `crm_cases_compat` (leitura, derivada de `cases` + lead) | aditivo |
| B4 | drop tabela `crm_cases`, `is_curator_for_crm_case`, policies e trigger dela; `can_access_crm_contact` reescrita sem `crm_cases` (Atendente/admin por atribuição; Curador via Case real) | destrutivo estrutural — último passo |

Nenhuma alteração em `cases`, no histórico `case_responsibility_changes`, nem em qualquer tabela do Método.

## 4. Impacto em APIs / código

- `modules/crm/repository.ts|actions.ts|pipeline.ts`: trocar leituras/escritas de `crm_cases` por `cases` (+ join de responsabilidade); `changePipelineStage` vira derivação/registro de interação — **nunca** um segundo caminho de transferência (o único é `transfer_case_responsibility`).
- Telas `/coa/atendimento` e `/coa/concierge`: passam a ler a projeção; escrita de etapa de case desaparece (as ações reais já existem nas jornadas auditadas). Contratos públicos: inexistentes sobre `crm_cases` (site-lead grava `crm_contacts`) — sem impacto externo.

## 5. Impacto em RLS

- `cases`, `case_events`, histórico: **inalterados**.
- `can_access_crm_contact`: remove a cláusula que consulta `crm_cases`; Curador passa a alcançar o contato via Case real do paciente vinculado (`crm_contacts.patient_profile_id` → `cases`). Mesma intenção, fonte única.
- `crm_tasks/appointments/interactions`: policies atuais herdadas; onde citarem `crm_cases`, reescrever para `cases` (levantamento B0 confirma).

## 6. Estratégia de migração

Ordem **expand → migrate → contract**, cada passo commitável e reversível sozinho:

- **B0** (leitura): dump das policies/definições atuais dos 4 dependentes; contagens antes.
- **B1** dados: exportar e apagar fixtures (2 `crm_cases`, 1 contato duplicado órfão se decidido).
- **B2** expand: novas colunas/constraints FK → `cases` **em paralelo** às antigas onde necessário; código passa a escrever nas novas.
- **B3** migrate: código do CRM lê/escreve só `cases`; view de compatibilidade cobre qualquer leitor esquecido; janela de observação.
- **B4** contract: drop de `crm_cases` e funções órfãs.

Compatibilidade total durante B2–B3: nada quebra se parar no meio.

## 7. Rollback

- B1: restore do export CSV (dados fictícios — perda aceitável declarada).
- B2: drop das constraints novas; antigas nunca saíram.
- B3: reverter código (git); view continua servindo.
- B4: único ponto sem volta barata — só executa após critérios de aceite verdes e sua palavra final. Arquivo de rollback registrado antes, como nas fases 1–3b.

## 8. Riscos

1. **Sessão concorrente (Cursor)** escrevendo em `crm_*` durante a janela → congelar janela combinada (lição RC-2).
2. `can_access_crm_contact` reescrita é a mudança de RLS mais sensível → testes por papel com sessões distintas antes/depois (mesmo método provado nas fases 3a/3b).
3. Leitor desconhecido de `crm_cases` fora do repo → mitigado por B0 + view de compatibilidade + janela de observação.
4. Volume é trivial (unidades de linhas), risco de dados ≈ 0; o risco real é estrutural, coberto pela ordem expand/contract.

## 9. Ordem de execução

B0 → B1 → B2 → **suítes completas + 24 testes da Correção de Domínio re-rodados** → B3 → observação (mínimo 1 ciclo real de lead→case) → sua aprovação → B4 → suítes de novo.

## 10. Validações

Por passo: contagens antes/depois; 140 integração; jornada SQL das 3 pessoas (mesmo `case_id` ponta a ponta); RLS por papel via `set role authenticated`; smoke autenticado nas 5 superfícies; tsc/lint/build; zero mudança nos 24 hashes de migrations existentes (novas migrations são só aditivas ao histórico).

## 11. Critérios de aceite

☐ Uma única tabela editável representando Case ☐ CRM inteiro funcional apontando para ela ☐ `pipeline` = projeção, não estado ☐ RLS equivalente provada por papel ☐ zero regressão nas suítes ☐ nenhuma responsabilidade histórica inventada ☐ rollback documentado antes de B4 ☐ Guided Experience intacta (as jornadas não mudam de rota nem de linguagem).

---

# EXECUÇÃO — CONCLUÍDA EM 2026-07-25

Os quatro passos foram executados sob autorização explícita do Fundador, um por vez, cada um com relatório e testes verdes antes do seguinte.

| Passo | O que fez | Migration |
|---|---|---|
| **B0** | Levantamento: 1 único ponto de estrangulamento de RLS (`can_access_crm_contact`), 0 auditoria pendurada, 2 arquivos de código, endpoint público desligado. **Descoberta**: `createContact` criava Case automaticamente — violação de domínio (Lead ≠ Case) | — (leitura) |
| **B1** | 2 fixtures de smoke test exportadas e apagadas; ponteiros desanexados | — (dados) |
| **B2** | 4 FKs → `curadoria.cases`; RLS de contato sem `crm_cases`; projeção do pipeline (14 golden tests); `createContact` sem Case | `convergencia_b2_fks_para_case_canonico`, `convergencia_b2_rls_contato_sem_crm_cases` |
| **B3** | Aplicação convergida: `getCaseById`/`listCasesForContact`/`caseTitlesByIds` lendo o Case canônico; escrita de etapa e de responsabilidade removidas | — (código) |
| **Janela** | Sentinela de escrita armada durante ciclo completo + 140 testes: nunca disparou. `pg_stat_statements`: **0 queries DML de aplicação** | — (observação) |
| **B4** | Tabela, 3 policies, 1 trigger, 5 índices, 2 checks, 3 FKs de saída e `is_curator_for_crm_case` removidos, com pré-condições verificadas na própria migration | `convergencia_b4_remove_crm_cases` |

**Resultado**: existe **um único Case canônico**. O Lead é independente e nunca vira Case sozinho; o Case nasce apenas pela abertura autorizada do Atendente; Atendimento, Curadoria e Concierge compartilham o mesmo registro do início ao encerramento.

**Restauração extraordinária**: `supabase/rollback-b4-crm-cases.sql` (estrutura completa, escrita antes do drop).
