-- patient_notifications
create table curadoria.patient_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references curadoria.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint patient_notifications_title_not_blank check (btrim(title) <> ''),
  constraint patient_notifications_body_not_blank check (btrim(body) <> '')
);
create index patient_notifications_profile_id_idx on curadoria.patient_notifications (profile_id);
create index patient_notifications_created_at_idx on curadoria.patient_notifications (created_at desc);
alter table curadoria.patient_notifications enable row level security;
grant select, insert, update on curadoria.patient_notifications to authenticated;
grant all on curadoria.patient_notifications to service_role;
create policy "patient_notifications_select_own_or_admin" on curadoria.patient_notifications for select to authenticated using (profile_id = auth.uid() or curadoria.has_role('administrador'));
create policy "patient_notifications_insert_admin_only" on curadoria.patient_notifications for insert to authenticated with check (curadoria.has_role('administrador'));
create policy "patient_notifications_update_own_or_admin" on curadoria.patient_notifications for update to authenticated using (profile_id = auth.uid() or curadoria.has_role('administrador')) with check (profile_id = auth.uid() or curadoria.has_role('administrador'));
create or replace function curadoria.protect_patient_notification_content()
returns trigger language plpgsql security definer set search_path = curadoria as $$
begin
  if not curadoria.has_role('administrador') then
    new.title := old.title; new.body := old.body; new.profile_id := old.profile_id; new.created_at := old.created_at;
  end if;
  return new;
end; $$;
create trigger protect_patient_notification_content_trigger before update on curadoria.patient_notifications for each row execute function curadoria.protect_patient_notification_content();
create or replace function curadoria.notify_patient_welcome()
returns trigger language plpgsql security definer set search_path = curadoria as $$
declare _role_slug text;
begin
  select slug into _role_slug from curadoria.roles where id = new.role_id;
  if _role_slug = 'paciente' then
    insert into curadoria.patient_notifications (profile_id, title, body)
    values (new.profile_id, 'Bem-vindo à Aliviar', 'Sua conta foi criada. A partir de agora você pode acompanhar sua jornada por aqui, no seu tempo — sem pressa.');
  end if;
  return new;
end; $$;
create trigger notify_patient_welcome_on_role_grant after insert on curadoria.user_roles for each row execute function curadoria.notify_patient_welcome();

-- patient_documents (+ bucket + storage policy)
create table curadoria.patient_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references curadoria.profiles (id) on delete cascade,
  file_path text not null unique,
  file_name text not null,
  content_type text,
  file_size bigint,
  uploaded_by uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),
  constraint patient_documents_file_name_not_blank check (btrim(file_name) <> '')
);
create index patient_documents_profile_id_idx on curadoria.patient_documents (profile_id);
alter table curadoria.patient_documents enable row level security;
grant select, insert, delete on curadoria.patient_documents to authenticated;
grant all on curadoria.patient_documents to service_role;
create policy "patient_documents_select_own_or_admin" on curadoria.patient_documents for select to authenticated using (profile_id = auth.uid() or curadoria.has_role('administrador'));
create policy "patient_documents_insert_own" on curadoria.patient_documents for insert to authenticated with check (profile_id = auth.uid() and uploaded_by = auth.uid());
create policy "patient_documents_delete_own_or_admin" on curadoria.patient_documents for delete to authenticated using (profile_id = auth.uid() or curadoria.has_role('administrador'));
insert into storage.buckets (id, name, public) values ('patient-documents','patient-documents',false) on conflict (id) do nothing;
create policy "curadoria_patient_documents_storage_own_or_admin" on storage.objects for all to authenticated
  using (bucket_id = 'patient-documents' and (curadoria.has_role('administrador') or (storage.foldername(name))[1] = auth.uid()::text))
  with check (bucket_id = 'patient-documents' and (curadoria.has_role('administrador') or (storage.foldername(name))[1] = auth.uid()::text));

-- patient_stories + versions
create table curadoria.patient_stories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references curadoria.profiles (id) on delete cascade,
  status text not null default 'rascunho' check (status in ('rascunho','enviada')),
  current_step text not null default 'para-quem',
  data jsonb not null default '{}'::jsonb,
  revision integer not null default 1,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null references curadoria.profiles (id)
);
create index patient_stories_profile_id_idx on curadoria.patient_stories (profile_id);
create index patient_stories_profile_id_status_idx on curadoria.patient_stories (profile_id, status);
create table curadoria.patient_story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references curadoria.patient_stories (id) on delete cascade,
  revision integer not null,
  data jsonb not null,
  current_step text not null,
  status text not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references curadoria.profiles (id)
);
create index patient_story_versions_story_id_idx on curadoria.patient_story_versions (story_id, revision);
alter table curadoria.patient_stories enable row level security;
alter table curadoria.patient_story_versions enable row level security;
grant select, insert, update on curadoria.patient_stories to authenticated;
grant select on curadoria.patient_story_versions to authenticated;
grant all on curadoria.patient_stories, curadoria.patient_story_versions to service_role;
create policy "patient_stories_select_own_or_admin" on curadoria.patient_stories for select to authenticated using (profile_id = auth.uid() or curadoria.has_role('administrador'));
create policy "patient_stories_insert_own" on curadoria.patient_stories for insert to authenticated with check (profile_id = auth.uid() and created_by = auth.uid());
create policy "patient_stories_update_own" on curadoria.patient_stories for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "patient_story_versions_select_own_or_admin" on curadoria.patient_story_versions for select to authenticated using (exists (select 1 from curadoria.patient_stories ps where ps.id = patient_story_versions.story_id and (ps.profile_id = auth.uid() or curadoria.has_role('administrador'))));
create or replace function curadoria.track_patient_story_revision()
returns trigger language plpgsql security definer set search_path = curadoria as $$
begin
  if tg_op = 'UPDATE' and old.status = 'enviada' and new.data is distinct from old.data then
    raise exception 'Esta história já foi enviada e não pode mais ser editada.';
  end if;
  if tg_op = 'INSERT' then new.revision := 1; else new.revision := old.revision + 1; end if;
  new.updated_at := now();
  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status <> 'enviada') then
    new.submitted_at := coalesce(new.submitted_at, now());
  end if;
  return new;
end; $$;
create or replace function curadoria.track_patient_story_version()
returns trigger language plpgsql security definer set search_path = curadoria as $$
begin
  if tg_op = 'INSERT' or new.current_step is distinct from old.current_step or new.status is distinct from old.status then
    insert into curadoria.patient_story_versions (story_id, revision, data, current_step, status, created_by)
    values (new.id, new.revision, new.data, new.current_step, new.status, new.profile_id);
  end if;
  return new;
end; $$;
create trigger track_patient_story_revision_trigger before insert or update on curadoria.patient_stories for each row execute function curadoria.track_patient_story_revision();
create trigger track_patient_story_version_trigger after insert or update on curadoria.patient_stories for each row execute function curadoria.track_patient_story_version();

-- patient_story_attachments
create table curadoria.patient_story_attachments (
  story_id uuid not null references curadoria.patient_stories (id) on delete cascade,
  document_id uuid not null references curadoria.patient_documents (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, document_id)
);
create index patient_story_attachments_document_id_idx on curadoria.patient_story_attachments (document_id);
alter table curadoria.patient_story_attachments enable row level security;
grant select, insert, delete on curadoria.patient_story_attachments to authenticated;
grant all on curadoria.patient_story_attachments to service_role;
create policy "patient_story_attachments_select_own_or_admin" on curadoria.patient_story_attachments for select to authenticated using (curadoria.has_role('administrador') or exists (select 1 from curadoria.patient_stories ps where ps.id = patient_story_attachments.story_id and ps.profile_id = auth.uid()));
create policy "patient_story_attachments_insert_own" on curadoria.patient_story_attachments for insert to authenticated with check (exists (select 1 from curadoria.patient_stories ps where ps.id = patient_story_attachments.story_id and ps.profile_id = auth.uid()) and exists (select 1 from curadoria.patient_documents pd where pd.id = patient_story_attachments.document_id and pd.profile_id = auth.uid()));
create policy "patient_story_attachments_delete_own" on curadoria.patient_story_attachments for delete to authenticated using (exists (select 1 from curadoria.patient_stories ps where ps.id = patient_story_attachments.story_id and ps.profile_id = auth.uid()));