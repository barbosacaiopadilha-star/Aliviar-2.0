-- CORREÇÃO DE BUG (produção, smoke test pós GO LIVE): o trigger único
-- track_patient_story_revision_trigger rodava BEFORE INSERT OR UPDATE e, no
-- próprio corpo, inseria uma linha em patient_story_versions referenciando
-- new.id. Em um INSERT, essa linha ainda não existe em patient_stories no
-- momento em que um trigger BEFORE executa — a foreign key
-- patient_story_versions_story_id_fkey quebra sempre, 100% reprodutível,
-- bloqueando todo paciente na primeira tentativa de iniciar "Sua História".
--
-- Correção: divide a responsabilidade em dois triggers. O BEFORE continua
-- ajustando revision/updated_at/submitted_at e bloqueando edição pós-envio
-- (precisa rodar antes, para poder alterar NEW). O snapshot em
-- patient_story_versions passa para um trigger AFTER, quando a linha de
-- patient_stories já existe de fato.

drop trigger track_patient_story_revision_trigger on public.patient_stories;

create or replace function public.track_patient_story_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.status = 'enviada' and new.data is distinct from old.data then
    raise exception 'Esta história já foi enviada e não pode mais ser editada.';
  end if;

  if tg_op = 'INSERT' then
    new.revision := 1;
  else
    new.revision := old.revision + 1;
  end if;
  new.updated_at := now();

  if new.status = 'enviada' and (tg_op = 'INSERT' or old.status <> 'enviada') then
    new.submitted_at := coalesce(new.submitted_at, now());
  end if;

  return new;
end;
$$;

comment on function public.track_patient_story_revision() is 'Garante revision monotônica (concorrência otimista) e bloqueia edição de dado após envio. Roda BEFORE — só ajusta a própria linha (NEW), nunca escreve em outra tabela (ver track_patient_story_version, que faz o snapshot em AFTER).';

create or replace function public.track_patient_story_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.current_step is distinct from old.current_step or new.status is distinct from old.status then
    insert into public.patient_story_versions (story_id, revision, data, current_step, status, created_by)
    values (new.id, new.revision, new.data, new.current_step, new.status, new.profile_id);
  end if;

  return new;
end;
$$;

comment on function public.track_patient_story_version() is 'Grava snapshot de versão a cada mudança de etapa/status. Roda AFTER — a linha de patient_stories já existe de verdade neste ponto, então a FK de patient_story_versions.story_id nunca quebra (era o bug corrigido por esta migration).';

create trigger track_patient_story_revision_trigger
  before insert or update on public.patient_stories
  for each row
  execute function public.track_patient_story_revision();

create trigger track_patient_story_version_trigger
  after insert or update on public.patient_stories
  for each row
  execute function public.track_patient_story_version();
