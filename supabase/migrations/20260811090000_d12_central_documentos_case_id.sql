-- D-12.1R · CENTRAL DE DOCUMENTOS — autorização case-específica, na linha.
--
-- POR QUE ESTA COLUNA EXISTE
--
-- A RLS avalia a LINHA. Sem `case_id` nela, nenhuma policy conseguia exprimir
-- "este Case pertence a esta paciente E este Curador responde por este Case".
-- O máximo alcançável era "existe ALGUM Case da paciente atribuído ao ator" —
-- modelo expressamente rejeitado, porque com duas Curadorias simultâneas ele
-- deixa o Curador de um Case depositar no contexto do outro.
--
-- `case_id` NÃO torna a Central por Case: a leitura continua patient-level
-- (`profile_id`). Ele registra o CONTEXTO QUE AUTORIZOU o depósito.
--
-- ORIGEM continua derivada da autoria, nunca de coluna própria:
--   uploaded_by  = profile_id  → enviado pela paciente
--   uploaded_by != profile_id  → recebido da Aliviar
--
-- ZERO backfill: todo documento existente foi depositado pela própria
-- paciente, e para esses `case_id` é null por definição.

-- ---------------------------------------------------------------------------
-- 1 · A coluna
-- ---------------------------------------------------------------------------

-- `on delete set null`, nunca cascade: o documento é da PACIENTE. Apagar um
-- Case não pode apagar o que ela recebeu — só faz perder o contexto de
-- autorização. O projeto já usa esse comportamento em quatro vínculos.
alter table curadoria.patient_documents
  add column if not exists case_id uuid null references curadoria.cases (id) on delete set null;

comment on column curadoria.patient_documents.case_id is
  'Case que autorizou o depósito pela Aliviar. Null nos uploads da própria paciente. Não torna a Central por Case: é contexto de autorização.';

-- Consultado por toda policy de staff (tabela e storage) — o índice existe
-- para o plano dessas verificações, não por especulação.
create index if not exists patient_documents_case_id_idx
  on curadoria.patient_documents (case_id);

-- ---------------------------------------------------------------------------
-- 2 · O helper: ator → ESTE Case → ESTA paciente
-- ---------------------------------------------------------------------------

-- As três condições são conjuntas e nenhuma delas basta sozinha. Em
-- particular, `assigned_curator_id = auth.uid()` isolado seria "é curador de
-- algum caso", que é justamente o que não pode.
create or replace function curadoria.pode_depositar_no_caso(_case_id uuid, _profile_id uuid)
returns boolean
language sql
security definer
set search_path = curadoria
stable
as $$
  select exists (
    select 1
      from curadoria.cases c
     where c.id = _case_id
       and c.patient_profile_id = _profile_id
       and c.assigned_curator_id = auth.uid()
  );
$$;

comment on function curadoria.pode_depositar_no_caso(uuid, uuid) is
  'Prova que o ator autenticado responde por ESTE Case e que ESTE Case é desta paciente. Nunca "algum Case dela".';

-- ---------------------------------------------------------------------------
-- 3 · INSERT na tabela
-- ---------------------------------------------------------------------------

-- A paciente deposita só para si, como autora, e SEM Case: ela não associa o
-- próprio arquivo a uma Curadoria. `case_id is null` fecha essa porta.
drop policy if exists "patient_documents_insert_own" on curadoria.patient_documents;
create policy "patient_documents_insert_own"
  on curadoria.patient_documents for insert to authenticated
  with check (
    profile_id = auth.uid()
    and uploaded_by = auth.uid()
    and case_id is null
  );

-- A Aliviar deposita como si mesma (autoria real), para a paciente do Case, e
-- só no Case que ela conduz.
create policy "patient_documents_insert_curador_do_caso"
  on curadoria.patient_documents for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and profile_id <> auth.uid()
    and case_id is not null
    and curadoria.pode_depositar_no_caso(case_id, profile_id)
  );

-- A policy de SELECT que o Curador já tinha passa pelo ANEXO DA HISTÓRIA
-- (`patient_story_attachments`) — e um documento recém-depositado não tem
-- anexo nenhum. Sem esta, o depósito grava e o próprio depositante não
-- consegue lê-lo de volta: `insert().select()` falha com violação de RLS, e a
-- gravação parece ter sido recusada quando não foi.
--
-- Simétrica ao INSERT, e pelo MESMO helper: nada além dos documentos do Case
-- que ele conduz.
create policy "patient_documents_select_curador_do_caso"
  on curadoria.patient_documents for select to authenticated
  using (
    case_id is not null
    and curadoria.pode_depositar_no_caso(case_id, profile_id)
  );

-- ---------------------------------------------------------------------------
-- 4 · DELETE na tabela — narrowing, não policy nova ao lado
-- ---------------------------------------------------------------------------

-- RLS permissiva é OR: acrescentar uma policy restritiva ao lado da antiga não
-- restringiria nada. A antiga permitia `profile_id = auth.uid()`, ou seja, a
-- paciente apagando QUALQUER documento dela — inclusive o que a Aliviar
-- depositou. Ela é substituída.
drop policy if exists "patient_documents_delete_own_or_admin" on curadoria.patient_documents;
create policy "patient_documents_delete_proprio_upload"
  on curadoria.patient_documents for delete to authenticated
  using (
    -- Apaga o que ela mesma enviou. Documento recebido não é dela para apagar.
    (profile_id = auth.uid() and uploaded_by = auth.uid())
    or curadoria.has_role('administrador')
  );

-- ---------------------------------------------------------------------------
-- 5 · Storage — a linha não pode ser mais forte que o objeto
-- ---------------------------------------------------------------------------
--
-- Convenção do recebido:  <patient_profile_id>/received/<case_id>/<arquivo>
--   [1] dona · [2] namespace · [3] Case que autorizou
--
-- Uploads da paciente permanecem em <patient_profile_id>/<arquivo>. Nenhum
-- path existente é migrado.
--
-- A policy anterior era `for all` sobre a pasta da dona — o que deixava a
-- paciente apagar fisicamente um objeto recebido, mesmo com a linha
-- protegida. Ela é substituída por policies por operação.
drop policy if exists "curadoria_patient_documents_storage_own_or_admin" on storage.objects;

create policy "curadoria_patient_documents_storage_select_dona"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'patient-documents'
    and (
      curadoria.has_role('administrador')
      -- Lê tudo o que está sob a própria árvore: o que enviou e o que recebeu.
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "curadoria_patient_documents_storage_insert_dona"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'patient-documents'
    and (
      curadoria.has_role('administrador')
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        -- A própria paciente nunca escreve dentro de `received/`.
        and coalesce((storage.foldername(name))[2], '') <> 'received'
      )
    )
  );

create policy "curadoria_patient_documents_storage_delete_proprio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'patient-documents'
    and (
      curadoria.has_role('administrador')
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        -- Simétrico à policy da linha: recebido não se apaga.
        and coalesce((storage.foldername(name))[2], '') <> 'received'
      )
    )
  );

-- O Curador grava no caminho da paciente — nunca no próprio. O Case sai do
-- path e é verificado pelo mesmo helper da tabela: um só lugar decide.
create policy "curadoria_patient_documents_storage_insert_curador"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'patient-documents'
    and (storage.foldername(name))[2] = 'received'
    and curadoria.pode_depositar_no_caso(
      ((storage.foldername(name))[3])::uuid,
      ((storage.foldername(name))[1])::uuid
    )
  );

-- ---------------------------------------------------------------------------
-- 6 · UPDATE
-- ---------------------------------------------------------------------------
-- Nenhuma policy de UPDATE é criada, aqui ou no storage. Sem policy
-- permissiva, a RLS nega — autoria e contexto não se reescrevem depois da
-- criação. A ausência é a regra, e um teste a vigia.
