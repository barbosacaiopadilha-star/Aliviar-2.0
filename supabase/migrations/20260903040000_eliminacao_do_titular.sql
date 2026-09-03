-- ============================================================================
-- ELIMINAÇÃO DO TITULAR (03/09) · SIM-99 — a pessoa que não podia ser apagada
-- ============================================================================
--
-- A auditoria 2 (ciclo de vida do dado) provou, com uma pessoa sintética
-- completa, que `auth.admin.deleteUser` falha para qualquer assistida — e
-- falha com erro vazio. Três bloqueios estruturais, cada um suficiente:
--
--   1. `patient_story_versions.created_by → profiles` é NO ACTION, e a
--      checagem dispara antes de a cascata chegar às versões. O texto de
--      saúde da pessoa era exatamente o que segurava a conta.
--   2. Apagada a história antes, a cascata chega em `user_roles` e o trigger
--      `log_user_role_change()` insere em `audit_logs` apontando para o perfil
--      que está sendo apagado. FK viola; a transação aborta. Todo mundo tem
--      papel — logo ninguém podia ser apagado.
--   3. `crm_contacts.patient_profile_id` é NO ACTION: o lead convertido
--      segura o perfil.
--
-- E o storage não é alcançado por FK nenhuma: forçando a passagem, o arquivo
-- fica órfão — a fábrica dos "20 objetos sem dono" de julho.
--
-- Esta migration tem quatro seções. §2 e §3 desfazem os bloqueios 2 e 3 no
-- esquema. §1 alarga o conserto às FKs de proveniência NULÁVEIS (24 delas).
-- O bloqueio 1 NÃO se resolve por FK: `patient_story_versions.created_by` é
-- NOT NULL — SET NULL falharia no DELETE — e a linha morre junto com a
-- história. Ele se resolve pela ORDEM em §4: a função apaga as histórias
-- (versões cascateiam) ANTES de apagar a conta. O `deleteUser` avulso
-- continua falhando para quem tem história — e é assim que deve ser: a
-- eliminação tem uma porta só, e ela é auditada.
--
-- O QUE ELA NÃO FAZ, DE PROPÓSITO: não toca a cerca dos julgamentos do
-- Curador (`curator_judgments_sem_delete`, RESTRICT nas FKs — CONTRATO_2_4
-- §11, ADR-067 §10). Um julgamento que existiu, existiu. A função de
-- eliminação DETECTA a cerca e recusa com mensagem clara; conciliar
-- "julgamento imutável" com "direito à eliminação" é decisão de domínio, não
-- de migration.
--
-- ============================================================================
-- §1 · FKs de PROVENIÊNCIA para `profiles` passam a ON DELETE SET NULL
-- ============================================================================
--
-- "Quem fez" (created_by, uploaded_by, actor_id, verified_by, …) é rastro,
-- não posse: a linha não pertence à pessoa que a escreveu, e não deve segurá-la
-- no banco. Quando essa pessoa some, a coluna vira nulo — "alguém que já não
-- existe" — e a linha fica.
--
-- Só colunas NULÁVEIS entram: SET NULL numa coluna NOT NULL falharia no
-- momento do DELETE. As NOT NULL de proveniência (`case_notes.author_id`,
-- por exemplo) pertencem a linhas que morrem junto com o Case, que a função
-- descarta antes de apagar a pessoa.
--
-- Fora do padrão, e de propósito: `responsible_id`, `assigned_curator_id`,
-- `curator_id`, `patient_profile_id`. Isso é RESPONSABILIDADE e SUJEITO, não
-- proveniência. Apagar um Curador que ainda responde por Cases tem de ser
-- barrado — é o NO ACTION fazendo o trabalho dele.
--
-- O bloco é dinâmico porque a lista tem dezenas de constraints e cada uma
-- escrita à mão é uma chance de errar o nome. Ele imprime o que alterou; o
-- teste de integração confere o comportamento (a pessoa some), não a lista.
--
-- ROLLBACK: reaplicar `on delete no action` nas constraints listadas pelo
-- NOTICE desta migration. Nenhum dado é tocado.
-- ============================================================================

do $$
declare
  r record;
  n int := 0;
  def_sem_delete text;
begin
  for r in
    select k.conname,
           k.conrelid::regclass as tabela,
           a.attname as coluna,
           pg_get_constraintdef(k.oid) as def
      from pg_constraint k
      join pg_attribute a on a.attrelid = k.conrelid and a.attnum = k.conkey[1]
     where k.contype = 'f'
       and k.confrelid = 'curadoria.profiles'::regclass
       and k.confdeltype = 'a'                       -- NO ACTION
       and array_length(k.conkey, 1) = 1
       and not a.attnotnull
       and a.attname ~ ('^(created_by|updated_by|uploaded_by|actor_id|author_id|declared_by|verified_by|'
                     || 'registered_by|recorded_by|started_by|reviewer_id|presented_by|selected_by|'
                     || 'validated_by|delivered_by|approved_by|reviewed_by|corrigido_por|changed_by|'
                     || 'previous_responsible_id|new_responsible_id|superseded_actor_id|ciclo_alterado_por|'
                     || 'registration_verified_by|opened_by|resolved_by|read_by|archived_by|qualified_by|'
                     || 'converted_by|assigned_to|recipient_user_id)$')
     order by k.conrelid::regclass::text, a.attname
  loop
    def_sem_delete := regexp_replace(r.def, '\s+on\s+delete\s+[a-z ]+$', '', 'i');
    execute format('alter table %s drop constraint %I', r.tabela, r.conname);
    execute format('alter table %s add constraint %I %s on delete set null', r.tabela, r.conname, def_sem_delete);
    raise notice 'proveniência → SET NULL: %.% (%)', r.tabela, r.coluna, r.conname;
    n := n + 1;
  end loop;
  raise notice '§1: % constraints de proveniência passaram a ON DELETE SET NULL', n;
end $$;

-- ============================================================================
-- §2 · O trigger de auditoria de papel não pode apontar para quem está sumindo
-- ============================================================================
--
-- `audit_logs.target_profile_id` já é ON DELETE SET NULL — a coluna sabe
-- perder a referência. O problema era o INSERT feito DURANTE a cascata: o
-- perfil já não é visível quando `user_roles` é apagada, e a FK recusa a
-- linha nova. Agora o alvo só é gravado se o perfil ainda existir; o id vai
-- para `metadata`, que não tem FK, e o rastro sobrevive à pessoa — como
-- `discard_case_admin` já fazia com `case_id`.
--
-- ROLLBACK: reaplicar a versão de 20260723164021.
-- ============================================================================

create or replace function curadoria.log_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = curadoria
as $$
begin
  if tg_op = 'INSERT' then
    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (
      auth.uid(),
      'role_granted',
      new.profile_id,
      jsonb_build_object('role_id', new.role_id, 'profile_id', new.profile_id)
    );
    return new;
  elsif tg_op = 'DELETE' then
    insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
    values (
      auth.uid(),
      'role_revoked',
      -- Durante a cascata de eliminação o perfil já não existe: apontar para
      -- ele violaria a FK e abortaria a eliminação inteira (SIM-99, bloqueio 2).
      case when exists (select 1 from curadoria.profiles p where p.id = old.profile_id)
           then old.profile_id end,
      jsonb_build_object('role_id', old.role_id, 'profile_id', old.profile_id)
    );
    return old;
  end if;
  return null;
end;
$$;

-- ============================================================================
-- §3 · `crm_contacts.patient_profile_id` — o lead convertido não segura a pessoa
-- ============================================================================
--
-- O contato é o lead da própria pessoa (nome, e-mail, telefone). Na
-- eliminação ele vai junto — é dado dela. A função de §4 o apaga antes de
-- tocar o perfil, então a FK nunca chega a ser exercida; mas a FK deixa de
-- ser NO ACTION por coerência: se um dia alguém apagar o perfil por outro
-- caminho, o contato não pode ser o que impede. SET NULL aqui esbarraria no
-- CHECK `crm_contacts_conversao_coerente` ((patient_profile_id is null) =
-- (converted_at is null)); CASCADE é o que o dado pede.
--
-- ROLLBACK: alter table curadoria.crm_contacts drop constraint crm_contacts_patient_profile_id_fkey,
--           add constraint crm_contacts_patient_profile_id_fkey foreign key (patient_profile_id)
--           references curadoria.profiles(id);
-- ============================================================================

do $$
declare
  nome text;
begin
  select conname into nome
    from pg_constraint
   where conrelid = 'curadoria.crm_contacts'::regclass
     and contype = 'f'
     and confrelid = 'curadoria.profiles'::regclass
     and conkey = array[(select attnum from pg_attribute where attrelid = 'curadoria.crm_contacts'::regclass and attname = 'patient_profile_id')];
  if nome is null then
    raise exception 'FK crm_contacts.patient_profile_id → profiles não encontrada';
  end if;
  execute format('alter table curadoria.crm_contacts drop constraint %I', nome);
  execute format('alter table curadoria.crm_contacts add constraint %I foreign key (patient_profile_id) references curadoria.profiles(id) on delete cascade', nome);
  raise notice '§3: % → ON DELETE CASCADE', nome;
end $$;

-- ============================================================================
-- §4 · A porta: `eliminar_titular` — na ordem certa, auditada, só por serviço
-- ============================================================================
--
-- REGIME (espelha `discard_case_admin`, migration 20260727140000):
--   · `service_role` é transporte, não autorização: o executor é resolvido
--     como coalesce(auth.uid(), _executed_by) e verificado como administrador
--     dentro da função.
--   · Motivo obrigatório. Sem motivo não há auditoria.
--   · A AUDITORIA VEM PRIMEIRO, e o id da pessoa vai em `metadata` — a coluna
--     `target_profile_id` vira nulo com a pessoa, o metadata não.
--   · Só assistidas (papel `paciente`). Equipe interna tem responsabilidades
--     (Cases, julgamentos, verificações) que exigem reatribuição antes; é
--     outro procedimento.
--   · A CERCA DOS JULGAMENTOS É RESPEITADA — por ela mesma. Esta função não
--     lê `curator_judgments` (G-2.4-7 proíbe qualquer função fora das cinco
--     de alcançá-la); se um Case tem julgamento, o descarte esbarra na cerca
--     e a transação inteira volta. Não há "desjulgar".
--
-- O STORAGE: SQL não apaga arquivo do bucket — apagar linhas de
-- `storage.objects` deixaria o blob no backend. A função devolve os caminhos
-- (`storage_paths`) e o prefixo da pasta; QUEM CHAMA remove pela API e confere.
-- O teste de integração faz exatamente isso.
--
-- ORDEM: auditoria → contatos do CRM → Cases (pela porta auditada, que trata
-- o histórico append-only) → histórias (cascateia versões e anexos) →
-- documentos (linhas) → notificações → a conta (cascateia perfil, papéis,
-- ajustes, pedidos de titular, aceites).
--
-- ROLLBACK: drop function curadoria.eliminar_titular(uuid, text, uuid);
-- ============================================================================

create or replace function curadoria.eliminar_titular(
  _profile_id uuid,
  _reason text,
  _executed_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _executor uuid;
  _eh_paciente boolean;
  _casos uuid[];
  _caso uuid;
  _paths text[];
  _orfaos text[];
  _contatos int;
  _historias int;
  _documentos int;
  _resumo jsonb;
begin
  if _profile_id is null then
    raise exception 'Eliminação exige o identificador da pessoa.' using errcode = '22023';
  end if;
  if btrim(coalesce(_reason, '')) = '' then
    raise exception 'Eliminação exige motivo. Uma eliminação sem motivo não é auditável.' using errcode = '22023';
  end if;

  _executor := coalesce(auth.uid(), _executed_by);
  if _executor is null then
    raise exception 'Eliminação exige executor identificado.' using errcode = '42501';
  end if;
  if auth.uid() is not null and _executed_by is not null and _executed_by <> auth.uid() then
    raise exception 'Eliminação: o executor informado não é o usuário autenticado.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from curadoria.user_roles ur join curadoria.roles r on r.id = ur.role_id
     where ur.profile_id = _executor and r.slug = 'administrador'
  ) then
    raise exception 'Eliminação exige papel administrador.' using errcode = '42501';
  end if;

  if not exists (select 1 from curadoria.profiles where id = _profile_id) then
    raise exception 'Pessoa % não existe.', _profile_id using errcode = '02000';
  end if;
  select exists (
    select 1 from curadoria.user_roles ur join curadoria.roles r on r.id = ur.role_id
     where ur.profile_id = _profile_id and r.slug = 'paciente'
  ) into _eh_paciente;
  if not _eh_paciente then
    raise exception 'Eliminação pela porta do titular só alcança assistidas. Equipe interna tem responsabilidades a reatribuir antes — é outro procedimento.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(id), '{}') into _casos from curadoria.cases where patient_profile_id = _profile_id;

  -- A cerca dos julgamentos não é consultada aqui — nem por nome, nem em
  -- comentário: ver o cabeçalho de §4. Se um Case tem julgamento, o descarte
  -- esbarra na cerca, e esta função é uma transação só: nada do que veio
  -- antes fica, nem a auditoria.

  -- O que há para o chamador remover do storage: as linhas conhecidas e o
  -- que estiver na pasta da pessoa sem linha (órfãos).
  select coalesce(array_agg(file_path), '{}') into _paths from curadoria.patient_documents where profile_id = _profile_id;
  select coalesce(array_agg(o.name), '{}') into _orfaos
    from storage.objects o
   where o.bucket_id = 'patient-documents'
     and o.name like _profile_id::text || '/%'
     and o.name <> all(_paths);

  -- 1 · Auditoria primeiro. O id vai no metadata porque a coluna vira nulo.
  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    _executor,
    'data_subject_request_closed',
    _profile_id,
    jsonb_build_object(
      'profile_id', _profile_id,
      'reason', btrim(_reason),
      'cases_discarded', coalesce(array_length(_casos, 1), 0),
      'documents', coalesce(array_length(_paths, 1), 0),
      'storage_orphans', coalesce(array_length(_orfaos, 1), 0),
      'eliminated_at', now()
    )
  );

  -- 2 · O lead da própria pessoa.
  delete from curadoria.crm_contacts where patient_profile_id = _profile_id;
  get diagnostics _contatos = row_count;

  -- 3 · Cada Case pela porta auditada — é ela que sabe descartar o histórico
  --     append-only de responsabilidade.
  foreach _caso in array _casos loop
    perform curadoria.discard_case_admin(_caso, 'eliminação do titular: ' || btrim(_reason), _executor);
  end loop;

  -- 4 · Histórias (versões e anexos cascateiam), documentos, notificações.
  delete from curadoria.patient_stories where profile_id = _profile_id;
  get diagnostics _historias = row_count;
  delete from curadoria.patient_documents where profile_id = _profile_id;
  get diagnostics _documentos = row_count;
  delete from curadoria.patient_notifications where profile_id = _profile_id;

  -- 5 · A conta. Cascateia perfil → papéis (trigger de §2 já sabe), ajustes,
  --     pedidos de titular, aceites, perfil de assistida.
  delete from auth.users where id = _profile_id;

  _resumo := jsonb_build_object(
    'profile_id', _profile_id,
    'executed_by', _executor,
    'cases_discarded', coalesce(array_length(_casos, 1), 0),
    'contacts_removed', _contatos,
    'stories_removed', _historias,
    'documents_removed', _documentos,
    'storage_paths', to_jsonb(_paths || _orfaos),
    'storage_prefix', _profile_id::text || '/'
  );
  return _resumo;
end;
$$;

comment on function curadoria.eliminar_titular(uuid, text, uuid) is
  'Eliminação do titular (assistida) sob pedido — auditada primeiro, contatos, Cases pela porta auditada, histórias, documentos, conta. Devolve os caminhos do storage: quem chama remove pela API e confere. Recusa se houver julgamento do Curador (cerca do CONTRATO_2_4).';

revoke all on function curadoria.eliminar_titular(uuid, text, uuid) from public, anon, authenticated;
grant execute on function curadoria.eliminar_titular(uuid, text, uuid) to service_role;
