-- DOMAIN CONVERGENCE — B2 (expand), parte 1: as quatro FKs que apontavam
-- para crm_cases passam a apontar para o Case canônico (curadoria.cases).
-- Todas as colunas estão NULL após o B1 — troca de constraint sem dados
-- incompatíveis (se houvesse, este arquivo teria parado no B0).
-- NÃO remove crm_cases (isso é B4, sob autorização própria).

alter table curadoria.crm_contacts
  drop constraint if exists crm_contacts_active_case_fk;
alter table curadoria.crm_contacts
  add constraint crm_contacts_active_case_canonical_fk
  foreign key (active_case_id) references curadoria.cases(id) on delete set null;

alter table curadoria.crm_tasks
  drop constraint if exists crm_tasks_case_id_fkey;
alter table curadoria.crm_tasks
  add constraint crm_tasks_case_canonical_fkey
  foreign key (case_id) references curadoria.cases(id) on delete set null;

alter table curadoria.crm_interactions
  drop constraint if exists crm_interactions_case_id_fkey;
alter table curadoria.crm_interactions
  add constraint crm_interactions_case_canonical_fkey
  foreign key (case_id) references curadoria.cases(id) on delete set null;

alter table curadoria.crm_appointments
  drop constraint if exists crm_appointments_case_id_fkey;
alter table curadoria.crm_appointments
  add constraint crm_appointments_case_canonical_fkey
  foreign key (case_id) references curadoria.cases(id) on delete set null;

comment on column curadoria.crm_contacts.active_case_id is
  'Case canônico (curadoria.cases) ativo desta pessoa. NUNCA aponta para crm_cases (convergida em 2026-07-25). Nulo enquanto o Atendente não abrir o Case.';
