-- =============================================================================
-- PP-02 — AUTORIA NOS DOIS MAPAS
-- =============================================================================
--
-- Autoridades: parecer arquitetural PP-01 · Arquitetura da Curadoria 2.0 ·
-- modelo de proveniência (§11.4).
--
-- POR QUE EXISTE. As duas entradas do Motor — `case_priority_map` pelo lado do
-- Case e `professional_subcriterion_map` pelo lado do profissional — são as
-- únicas tabelas que decidem, e são justamente as duas que não registram QUEM
-- declarou. As tabelas com proveniência completa (`practice_evidence`,
-- `case_needs`) não alcançam o Motor; as que o alcançam não têm autoria
-- nenhuma. Esta migration corrige a metade que é infraestrutura: passa a
-- existir onde gravar o autor.
--
-- O QUE ESTA MIGRATION NÃO FAZ, DELIBERADAMENTE:
--
--   * não faz backfill — nenhum autor é inventado para linha antiga;
--   * não torna a coluna obrigatória — exigir autor de registro anterior
--     ao regime quebraria toda gravação existente;
--   * não altera nenhuma action, nenhuma escrita, nenhuma superfície;
--   * não toca RLS (ADR-040 item 6 permanece intacta, ADR-068 item 7);
--   * não muda escala, célula, estado, conceito ou qualquer regra do Motor.
--
-- SEMÂNTICA DO NULL, e ela é única: `declared_by IS NULL` significa **registro
-- anterior ao regime de autoria**. Não significa "sem autor", não significa
-- "autor desconhecido" e nunca deve ser lido como ausência de responsabilidade
-- (I-8: ausência de informação nunca vira ausência da característica).
--
-- ON DELETE: nenhuma cláusula, como em `curadoria_reports.approved_by` — o
-- comportamento padrão impede apagar um perfil que assinou declaração, e é o
-- que preserva o histórico (I-7).
--
-- ROLLBACK: `alter table … drop column declared_by` nas duas tabelas. Nenhum
-- dado preexistente é tocado por esta migration, logo nada se perde ao reverter
-- — o que existir na coluna terá sido gravado depois dela.
-- =============================================================================

-- Idempotente: reexecutar não falha nem duplica coluna.
alter table curadoria.case_priority_map
  add column if not exists declared_by uuid references curadoria.profiles (id);

comment on column curadoria.case_priority_map.declared_by is
  'Quem declarou esta importancia. NULL = registro anterior ao regime de autoria (PP-02); nunca "autor desconhecido". Nenhum backfill foi feito.';

alter table curadoria.professional_subcriterion_map
  add column if not exists declared_by uuid references curadoria.profiles (id);

comment on column curadoria.professional_subcriterion_map.declared_by is
  'Quem declarou este estado. NULL = registro anterior ao regime de autoria (PP-02); nunca "autor desconhecido". Nenhum backfill foi feito.';
