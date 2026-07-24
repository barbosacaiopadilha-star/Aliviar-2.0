-- Correção de Domínio (docs/CORRECAO_DOMINIO_PAPEIS_E_CASE.md) — Fase 1.
-- O Case é único e percorre a jornada inteira. Muda de responsável, nunca de
-- identidade. Estas colunas registram DE QUEM o Case é agora.
--
-- `opened_by` do plano original foi descartado: `created_by` já registra quem
-- abriu o Case. Duas colunas para o mesmo fato seriam duas fontes de verdade.

alter table curadoria.cases
  add column if not exists responsible_id uuid references curadoria.profiles(id),
  add column if not exists responsible_role text
    check (responsible_role in ('atendente','curador_medico','concierge'));

comment on column curadoria.cases.responsible_id is
  'Responsável ATUAL pelo Case. Muda ao longo da jornada; a identidade do Case não. Histórico completo em curadoria.case_responsibility_changes.';

comment on column curadoria.cases.responsible_role is
  'Nível humano do responsável atual: atendente (abre o Case), curador_medico (conduz a Curadoria), concierge (acompanha após a Curadoria). O CRM é plataforma, nunca papel.';

comment on column curadoria.cases.created_by is
  'Quem abriu o Case — normalmente o Atendente (Nível 1). Imutável: é o nascimento do Case.';

comment on table curadoria.cases is
  'O Case. Fonte única de verdade da jornada do paciente, do primeiro contato ao encerramento. Proibido criar outra entidade Case para representar mudança de etapa.';

create index if not exists cases_responsible_idx
  on curadoria.cases (responsible_id, responsible_role);