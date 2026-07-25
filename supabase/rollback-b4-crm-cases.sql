-- RESTAURAÇÃO EXTRAORDINÁRIA — Convergência de Domínio, B4
--
-- Escrito ANTES do drop (2026-07-25), a partir do export íntegro da estrutura
-- em produção. Reconstrói `curadoria.crm_cases` e `is_curator_for_crm_case`
-- exatamente como existiam.
--
-- NÃO EXECUTAR salvo incidente grave que exija voltar o modelo antigo. A
-- tabela foi removida com 0 linhas, 0 FKs entrantes, 0 dependências ativas e
-- 0 queries de aplicação (provado por pg_stat_statements na janela final).
--
-- ATENÇÃO: restaurar a ESTRUTURA não restaura o COMPORTAMENTO antigo — o
-- código da aplicação foi convergido no B3 e lê apenas `curadoria.cases`.
-- Voltar de verdade exigiria também reverter o código (git) e as migrations
-- convergencia_b2_* / crm_lead_*. Este arquivo cobre só a camada de banco.
--
-- Não contém dados pessoais nem segredos: a tabela foi removida vazia; as
-- únicas linhas que existiram eram fixtures de smoke test, exportadas no B1.

create table if not exists curadoria.crm_cases (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references curadoria.crm_contacts(id) on delete cascade,
  title text not null,
  summary text,
  status text not null default 'aberto',
  pipeline_stage text not null default 'new_contact',
  responsible_concierge_id uuid references curadoria.profiles(id) on delete set null,
  responsible_curator_id uuid references curadoria.profiles(id) on delete set null,
  priority text not null default 'media',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_cases_priority_check check (priority = any (array['baixa','media','alta','urgente'])),
  constraint crm_cases_status_check check (status = any (array['aberto','fechado','arquivado'])),
  constraint crm_cases_title_not_blank check (btrim(title) <> '')
);

create index if not exists crm_cases_contact_id_idx on curadoria.crm_cases using btree (contact_id);
create index if not exists crm_cases_responsible_concierge_idx on curadoria.crm_cases using btree (responsible_concierge_id);
create index if not exists crm_cases_responsible_curator_idx on curadoria.crm_cases using btree (responsible_curator_id);
create index if not exists crm_cases_pipeline_stage_idx on curadoria.crm_cases using btree (pipeline_stage);

drop trigger if exists set_crm_cases_updated_at on curadoria.crm_cases;
create trigger set_crm_cases_updated_at
  before update on curadoria.crm_cases
  for each row execute function curadoria.set_updated_at();

create or replace function curadoria.is_curator_for_crm_case(_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
  select exists (
    select 1
    from curadoria.crm_cases c
    where c.id = _case_id
      and c.responsible_curator_id = auth.uid()
  );
$function$;

alter table curadoria.crm_cases enable row level security;

create policy crm_cases_insert on curadoria.crm_cases for insert to authenticated
  with check (curadoria.has_role('administrador') or curadoria.has_role('concierge'));

create policy crm_cases_select on curadoria.crm_cases for select to authenticated
  using (
    curadoria.has_role('administrador')
    or (
      curadoria.has_role('concierge')
      and (
        responsible_concierge_id is null
        or responsible_concierge_id = auth.uid()
        or exists (
          select 1 from curadoria.crm_contacts c
          where c.id = crm_cases.contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())
        )
      )
    )
    or curadoria.is_curator_for_crm_case(id)
  );

create policy crm_cases_update on curadoria.crm_cases for update to authenticated
  using (
    curadoria.has_role('administrador')
    or (
      curadoria.has_role('concierge')
      and (
        responsible_concierge_id = auth.uid()
        or exists (
          select 1 from curadoria.crm_contacts c
          where c.id = crm_cases.contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())
        )
      )
    )
  )
  with check (
    curadoria.has_role('administrador')
    or (
      curadoria.has_role('concierge')
      and (
        responsible_concierge_id = auth.uid()
        or exists (
          select 1 from curadoria.crm_contacts c
          where c.id = crm_cases.contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())
        )
      )
    )
  );

-- As FKs dos dependentes NÃO são revertidas aqui: elas apontam para
-- curadoria.cases desde o B2 e assim devem permanecer. Reapontá-las para
-- crm_cases recriaria a dualidade que a Correção de Domínio eliminou.
