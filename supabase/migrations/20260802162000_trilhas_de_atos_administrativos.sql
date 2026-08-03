-- ============================================================================
-- BLOCO C / ETAPA 10 — ATOS SENSÍVEIS DEIXAM RASTRO (gates C9a, C9b, C9c)
-- ============================================================================
--
-- FINALIDADE
--   Três atos administrativos aconteciam sem NENHUMA linha em audit_logs:
--   resetar a senha de uma paciente, despublicar/publicar um profissional e
--   apagar um documento de paciente. Três trilhas, cada uma pelo mecanismo
--   mais infalsificável disponível para o ato (decisão por caso, ADR-055):
--
--   (a) RESET DE SENHA — o ato acontece na Admin API do Auth, FORA do banco:
--       nenhum trigger o enxerga. A trilha nasce pela RPC
--       `log_admin_action`, chamada pelo repository (resetPatientPassword)
--       imediatamente após o ato. Restrições que impedem a RPC de virar
--       fábrica de trilha falsa: allowlist de ações (hoje SÓ
--       'password_reset'); ator autenticado precisa de papel autorizado para
--       o ato (administrador ou atendente — os dois papéis que hoje resetam
--       senha: ação admin e retomada de conversão de lead); sessão sem
--       auth.uid() só passa como service_role (bastidor/fixture); metadata
--       com chave de segredo (password/senha/token) é recusada — a trilha
--       nunca carrega credencial, nem por acidente.
--
--   (b) DESPUBLICAÇÃO/PUBLICAÇÃO — a escrita é UPDATE em
--       professional_profiles (TS+PostgREST): TRIGGER de tabela na transição
--       de publication_status, escolhido sobre a RPC porque é infalsificável
--       — vale para action, PostgREST direto e script; nenhum caminho novo
--       de escrita pode esquecer a trilha. O motivo entra pela coluna nova
--       OPCIONAL `publication_change_reason` (gravável no MESMO update;
--       nenhuma superfície nova — Bloco F decide se/como pedir o motivo).
--
--   (c) DELETE DE patient_documents — TRIGGER AFTER DELETE com tombstone
--       mínimo: ids, autor do upload, NOME e HASH do caminho do arquivo —
--       nunca o conteúdo (o arquivo em si vive no storage e não passa por
--       aqui). `target_profile_id` é guardado com EXISTS: no delete direto o
--       perfil está vivo e a FK aponta para ele; na cascata (conta removida
--       pela limpeza por inventário) o perfil já saiu e o alvo fica NULL —
--       o id sobrevive na metadata, e a FK nunca quebra a cascata.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.audit_logs` + enum `curadoria.audit_action` (stage 1);
--     `curadoria.has_role`; `professional_profiles` (stage 2, com o trigger
--     da porta de publicação `assert_publication_requirements` — BEFORE,
--     dispara antes desta trilha AFTER: publicação recusada nunca gera
--     linha); `patient_documents` (stage 3).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - `publication_change_reason` nasce NULL em todas as linhas — aditivo
--     puro; nenhuma linha é tocada.
--   - Os 158 profissionais publicados e os 27 documentos locais são estado
--     parado: as trilhas só nascem em TRANSIÇÕES/ATOS futuros.
--   - audit_logs só cresce (aditivo por definição).
--
-- PROVA DE FECHAMENTO
--   - Gate C9a (tests/remediacao/imutabilidade.integration.test.ts):
--     resetPatientPassword deixa linha em audit_logs.
--   - Gate C9b: despublicação por sessão real de administrador deixa linha.
--   - Gate C9c: delete de patient_documents por administrador deixa linha.
--   - Gates novos (imutabilidade-frente2): trilha sem a senha; tombstone com
--     ids e hash, sem conteúdo; log_admin_action recusada para paciente,
--     anon e ação fora da allowlist; trilha de despublicação carrega
--     autor + old->new.
--
-- ROLLBACK
--   drop function if exists curadoria.log_admin_action(text, uuid, jsonb);
--   drop trigger if exists log_patient_document_deleted_trigger
--     on curadoria.patient_documents;
--   drop function if exists curadoria.log_patient_document_deleted();
--   drop trigger if exists log_professional_publication_transition_trigger
--     on curadoria.professional_profiles;
--   drop function if exists curadoria.log_professional_publication_transition();
--   alter table curadoria.professional_profiles
--     drop column if exists publication_change_reason;
--   -- Os valores novos em curadoria.audit_action ('password_reset',
--   -- 'professional_unpublished', 'professional_published',
--   -- 'patient_document_deleted') não são removíveis sem recriar o tipo;
--   -- inofensivos sem uso (mesmo resíduo aceito de M150).
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'password_reset';
alter type curadoria.audit_action add value if not exists 'professional_unpublished';
alter type curadoria.audit_action add value if not exists 'professional_published';
alter type curadoria.audit_action add value if not exists 'patient_document_deleted';

-- ---------------------------------------------------------------------------
-- (a) Reset de senha — trilha por RPC, porque o ato vive fora do banco
-- ---------------------------------------------------------------------------

create or replace function curadoria.log_admin_action(
  _action text,
  _target_profile_id uuid,
  _metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _payload jsonb := coalesce(_metadata, '{}'::jsonb);
begin
  -- Allowlist: esta RPC registra atos que acontecem FORA do banco (Admin
  -- API). Cada ato novo entra aqui por migration própria — nunca vira
  -- registrador genérico de qualquer action.
  if _action <> 'password_reset' then
    raise exception 'Ação % não é registrável por log_admin_action', _action
      using errcode = '23514';
  end if;

  -- Quem registra: papel autorizado para o ATO (administrador, ou atendente
  -- na retomada de conversão de lead) — ou o bastidor service_role, que não
  -- tem auth.uid() (fixtures e operações de sistema).
  if _actor is null then
    if coalesce(auth.role(), '') <> 'service_role' then
      raise exception 'Registro de ato administrativo exige ator autenticado'
        using errcode = '42501';
    end if;
  elsif not (curadoria.has_role('administrador') or curadoria.has_role('atendente')) then
    raise exception 'Só administrador ou atendente registram este ato'
      using errcode = '42501';
  end if;

  -- A trilha NUNCA carrega credencial — nem por engano do chamador.
  if _payload ? 'password' or _payload ? 'senha' or _payload ? 'token' then
    raise exception 'A trilha de auditoria não carrega segredo nenhum'
      using errcode = '23514';
  end if;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (_actor, _action::curadoria.audit_action, _target_profile_id, _payload);
end;
$function$;

comment on function curadoria.log_admin_action(text, uuid, jsonb) is
  'Bloco C/C9a (ADR-055): trilha de atos que acontecem FORA do banco (Admin API do Auth). Allowlist restrita (hoje so password_reset); ator autenticado exige papel do ato (administrador/atendente), bastidor so como service_role; metadata com chave de segredo e recusada. Chamada pelo repository logo apos o ato.';

revoke execute on function curadoria.log_admin_action(text, uuid, jsonb) from public;
grant execute on function curadoria.log_admin_action(text, uuid, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- (b) Publicação/despublicação — trigger na transição, motivo em coluna opcional
-- ---------------------------------------------------------------------------

alter table curadoria.professional_profiles
  add column publication_change_reason text;

comment on column curadoria.professional_profiles.publication_change_reason is
  'Motivo declarado da ultima mudanca de publicacao (opcional). Gravavel no mesmo UPDATE que muda publication_status; o trigger de trilha o copia para a metadata do audit_log. Nenhuma superficie e obrigada a preenche-lo (Bloco F decide).';

create or replace function curadoria.log_professional_publication_transition()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  if new.publication_status is distinct from old.publication_status then
    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (
      auth.uid(),
      case when new.publication_status = 'publicado'
           then 'professional_published'::curadoria.audit_action
           else 'professional_unpublished'::curadoria.audit_action end,
      -- O alvo em profiles é a conta vinculada, quando existe; o perfil
      -- profissional em si fica na metadata (nem todo profissional tem conta).
      new.profile_id,
      jsonb_build_object(
        'professional_profile_id', new.id,
        'old_status', old.publication_status,
        'new_status', new.publication_status,
        'reason', new.publication_change_reason,
        'updated_by', new.updated_by));
  end if;
  return new;
end;
$function$;

comment on function curadoria.log_professional_publication_transition() is
  'Bloco C/C9b (ADR-055/064): toda transicao de publication_status grava professional_published/professional_unpublished em audit_logs com autor (auth.uid; nulo = bastidor), old->new, motivo (publication_change_reason) e updated_by. Trigger de tabela, nao RPC: infalsificavel — vale para action, PostgREST direto e script. A porta de publicacao (BEFORE) recusa antes: publicacao negada nunca gera linha.';

revoke execute on function curadoria.log_professional_publication_transition() from public;

drop trigger if exists log_professional_publication_transition_trigger
  on curadoria.professional_profiles;
create trigger log_professional_publication_transition_trigger
  after update on curadoria.professional_profiles
  for each row execute function curadoria.log_professional_publication_transition();

-- ---------------------------------------------------------------------------
-- (c) Delete de documento de paciente — tombstone mínimo, sem conteúdo
-- ---------------------------------------------------------------------------

create or replace function curadoria.log_patient_document_deleted()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _target uuid;
begin
  -- Na cascata (conta/perfil removidos), o perfil já não existe: o alvo da
  -- FK fica nulo e o id sobrevive na metadata — a trilha nunca quebra a
  -- remoção que a disparou.
  select p.id into _target from curadoria.profiles p where p.id = old.profile_id;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (auth.uid(), 'patient_document_deleted', _target,
          jsonb_build_object(
            'document_id', old.id,
            'profile_id', old.profile_id,
            'uploaded_by', old.uploaded_by,
            'file_name', old.file_name,
            'file_path_hash', md5(old.file_path),
            'content_type', old.content_type,
            'file_size', old.file_size,
            'uploaded_at', old.created_at));
  return old;
end;
$function$;

comment on function curadoria.log_patient_document_deleted() is
  'Bloco C/C9c (ADR-055): todo DELETE em patient_documents deixa tombstone em audit_logs — ids, autor do upload, nome e hash do caminho, tamanho e carimbos. Nunca o conteudo do arquivo. Alvo guardado com EXISTS para a cascata de remocao de conta nao quebrar na FK.';

revoke execute on function curadoria.log_patient_document_deleted() from public;

drop trigger if exists log_patient_document_deleted_trigger
  on curadoria.patient_documents;
create trigger log_patient_document_deleted_trigger
  after delete on curadoria.patient_documents
  for each row execute function curadoria.log_patient_document_deleted();
