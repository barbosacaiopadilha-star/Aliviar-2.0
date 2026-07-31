-- SOLICITAÇÕES DE ATUALIZAÇÃO — a pendência operacional da Base de Evidências.
--
-- Por que tabela nova (Etapa 9 manda procurar antes): `case_notes` pertence a
-- um Case e morre com ele — a solicitação é sobre o cadastro permanente;
-- `verification_divergences` registra desacordo entre declarado e encontrado
-- — solicitação de atualização não afirma desacordo, só pede resposta nova
-- (vencimento, prática que mudou, lacuna). Nenhuma das duas serve sem
-- entortar a semântica. Escopo mínimo: registrar e exibir a pendência.
-- NENHUMA automação: sem e-mail, sem mensagem externa — quem conversa com o
-- profissional é gente.

create table curadoria.practice_update_requests (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null
    references curadoria.professional_profiles (id) on delete cascade,

  -- Um ou mais conceitos do Catálogo 1.0.0, por código estável.
  subcriterion_codes text[] not null check (array_length(subcriterion_codes, 1) >= 1),

  reason text not null check (length(btrim(reason)) between 1 and 500),
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  -- Prazo sugerido é orientação operacional, nunca gatilho automático.
  due_hint date,

  status text not null default 'aberta' check (status in ('aberta', 'atendida', 'cancelada')),
  resolved_by uuid,
  resolved_at timestamptz,

  -- Fechar exige autor e data — pendência que fecha sozinha foi esquecida.
  constraint update_request_resolucao_completa check (
    status = 'aberta' or (resolved_by is not null and resolved_at is not null)
  )
);

comment on table curadoria.practice_update_requests is
  'Pendencia operacional: a operacao pede ao profissional uma resposta nova do Protocolo. Sem automacao, sem e-mail — registro e exibicao. Fechar exige autor e data.';

create index practice_update_requests_professional_idx
  on curadoria.practice_update_requests (professional_profile_id)
  where status = 'aberta';

alter table curadoria.practice_update_requests enable row level security;

-- Curador e administrador solicitam; administrador fecha; o profissional VÊ
-- as próprias pendências (é assim que ele descobre o que revisar, na rota
-- que já tem).
create policy "update_requests_select"
  on curadoria.practice_update_requests for select
  to authenticated
  using (
    curadoria.has_role('administrador')
    or curadoria.has_role('curador_medico')
    or exists (
      select 1 from curadoria.professional_profiles pp
       where pp.id = professional_profile_id and pp.profile_id = auth.uid()
    )
  );

create policy "update_requests_insert_operacao"
  on curadoria.practice_update_requests for insert
  to authenticated
  with check (curadoria.has_role('administrador') or curadoria.has_role('curador_medico'));

create policy "update_requests_update_admin"
  on curadoria.practice_update_requests for update
  to authenticated
  using (curadoria.has_role('administrador'))
  with check (curadoria.has_role('administrador'));

grant select, insert, update on curadoria.practice_update_requests to authenticated;
grant all on curadoria.practice_update_requests to service_role;
revoke all on curadoria.practice_update_requests from anon;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   drop table if exists curadoria.practice_update_requests;
