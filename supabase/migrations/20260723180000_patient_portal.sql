-- Portal do paciente: identidade, documentos e RLS segura

alter table public.patients
  add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;

create index if not exists patients_auth_user_id_idx on public.patients (auth_user_id);
create index if not exists patients_email_idx on public.patients (lower(email));

create or replace function public.is_patient_owner(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patients
    where patients.id = p_patient_id
      and patients.auth_user_id = auth.uid()
  );
$$;

revoke all on function public.is_patient_owner(uuid) from public;
grant execute on function public.is_patient_owner(uuid) to authenticated;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select patients.id
  from public.patients
  where patients.auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_patient_id() from public;
grant execute on function public.current_patient_id() to authenticated;

-- Remove leitura pública da projeção
drop policy if exists "patient_journey_views_select_public_by_journey" on public.patient_journey_views;

create policy "patient_journey_views_select_patient_owner"
  on public.patient_journey_views for select
  to authenticated
  using (public.is_patient_owner(patient_id));

-- Documentos do paciente
create type public.patient_document_status as enum (
  'RECEBIDO',
  'EM_ANALISE',
  'ACEITO',
  'REJEITADO'
);

create table public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  journey_id uuid not null references public.journeys (id) on delete cascade,
  nome_arquivo text not null check (char_length(trim(nome_arquivo)) > 0),
  tipo_mime text not null,
  tamanho_bytes integer not null check (tamanho_bytes > 0),
  status public.patient_document_status not null default 'RECEBIDO',
  storage_path text not null,
  recebido_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger patient_documents_set_updated_at
  before update on public.patient_documents
  for each row execute function public.set_updated_at();

create index patient_documents_patient_id_idx on public.patient_documents (patient_id);
create index patient_documents_journey_id_idx on public.patient_documents (journey_id);

alter table public.patient_documents enable row level security;

create policy "patient_documents_select_owner"
  on public.patient_documents for select
  to authenticated
  using (public.is_patient_owner(patient_id));

create policy "patient_documents_insert_owner"
  on public.patient_documents for insert
  to authenticated
  with check (public.is_patient_owner(patient_id));

create policy "patient_documents_select_staff"
  on public.patient_documents for select
  to authenticated
  using (public.is_active_staff());

create policy "patient_documents_update_staff"
  on public.patient_documents for update
  to authenticated
  using (public.is_active_staff())
  with check (public.is_active_staff());

-- Paciente pode ler próprio registro
create policy "patients_select_own"
  on public.patients for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "patients_update_own_link"
  on public.patients for update
  to authenticated
  using (email is not null and lower(email) = lower(auth.jwt() ->> 'email'))
  with check (auth_user_id = auth.uid() or auth_user_id is null);
