-- ============================================================================
-- D-12.2 · O DEPÓSITO DA ALIVIAR DEIXA TRILHA.
--
-- A D-12.1 abriu a porta: o Curador do Case consegue gravar um documento PARA
-- a paciente. Faltava o registro de que ele o fez.
--
-- POR QUE UM VERBO PRÓPRIO, E NÃO TEXTO LIVRE
--
-- `curadoria.audit_action` é vocabulário controlado, e o projeto o estende
-- aditivamente desde a origem: este é o 16º `add value` da série, e o
-- TERCEIRO da própria família de documentos da paciente, ao lado de
-- `patient_document_orphaned` (20260802153000) e `patient_document_deleted`
-- (20260802162000). Seguir a convenção é o caminho barato; inventar trilha
-- nova é que seria desproporcional (§M do doc 25).
--
-- `add value` convive com transação no PG 12+ desde que o valor não seja
-- USADO na mesma transação — e não é: quem o usa é o corpo da função,
-- avaliado só em execução, depois desta migration commitar. Mesmo raciocínio
-- registrado em `case_discarded` (20260727140000).
--
-- POR QUE TRIGGER, E NÃO CHAMADA DO WRITER
--
-- Auditoria que depende de o código lembrar de chamá-la é auditoria que um
-- caminho novo esquece. O DELETE já é auditado por trigger
-- (`log_patient_document_deleted_trigger`); o depósito passa a ser pela mesma
-- forma. Nenhum writer — atual ou futuro, aplicação ou console — deposita sem
-- deixar rastro, porque quem grava a linha é o banco.
--
-- A COMPENSAÇÃO PRECISAVA DE UMA PORTA, E ELA NÃO EXISTIA
--
-- Descoberto ao escrever o writer: o Curador não podia desfazer o próprio
-- upload. A D-12.1 tirou o DELETE dele tanto da linha
-- (`patient_documents_delete_proprio_upload` exige `profile_id = auth.uid()`)
-- quanto do objeto (`..._storage_delete_proprio` exige a pasta ser a dele e
-- barra `received/`). Nenhuma ordem de escrita se autocompensava: falhando o
-- INSERT depois do upload, o arquivo ficava órfão na pasta da paciente —
-- visível para ela no storage, ausente da Central, e sem ninguém que pudesse
-- removê-lo. É o mesmo tipo de lacuna que a D-12.1 encontrou no SELECT.
--
-- Conceder DELETE ao Curador resolveria e criaria coisa pior: REVOGAÇÃO, que
-- o §N do doc 25 recusa explicitamente por falta de precedente. A policy
-- abaixo concede a compensação e nada além dela, pela cláusula que a define:
-- só apaga OBJETO SEM LINHA. Um documento corretamente depositado tem linha,
-- e por isso é intocável pelo depositante — a mesma garantia de antes.
--
-- ZERO coluna. ZERO tabela. Nenhuma policy existente é alterada ou removida.
--
-- ROLLBACK
--   drop policy if exists "curadoria_patient_documents_storage_compensacao_curador"
--     on storage.objects;
--   drop trigger if exists log_patient_document_provided_trigger
--     on curadoria.patient_documents;
--   drop function if exists curadoria.log_patient_document_provided();
--   -- O valor 'patient_document_provided' de audit_action NÃO é removível sem
--   -- recriar o tipo; é inofensivo sem uso (nenhuma função o referencia após o
--   -- rollback). Resíduo aceito, mesmo precedente de 'case_discarded',
--   -- 'curadoria_delivered' e 'patient_document_orphaned'.
--   -- Linhas já gravadas permanecem: auditoria é história real.
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'patient_document_provided';

-- ---------------------------------------------------------------------------
-- O gatilho — só o que a Aliviar deposita
-- ---------------------------------------------------------------------------

create or replace function curadoria.log_patient_document_provided()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  -- O upload da PRÓPRIA paciente não entra na trilha. Ele não é ato de
  -- terceiro sobre ela, a origem já é derivável da autoria
  -- (`uploaded_by = profile_id`), e auditar todo upload transformaria
  -- `audit_logs` numa cópia da tabela. O que precisa de trilha é o ato de
  -- alguém depositar algo NA vida dela.
  if new.uploaded_by is not distinct from new.profile_id then
    return new;
  end if;

  -- Ator é `new.uploaded_by`, não `auth.uid()`: a policy de INSERT já obriga
  -- os dois a coincidirem no caminho autenticado, e usar a coluna mantém a
  -- trilha correta também quando a escrita vem do bastidor `service_role`
  -- (fixtures e operações de sistema), onde `auth.uid()` é nulo.
  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (new.uploaded_by, 'patient_document_provided', new.profile_id,
          jsonb_build_object(
            'document_id', new.id,
            'case_id', new.case_id,
            'file_name', new.file_name,
            -- Hash, nunca o caminho: mesma escolha do tombstone de DELETE.
            -- O caminho é endereço do objeto, e trilha não é índice de acesso.
            'file_path_hash', md5(new.file_path),
            'content_type', new.content_type,
            'file_size', new.file_size,
            'provided_at', new.created_at));
  return new;
end;
$function$;

comment on function curadoria.log_patient_document_provided() is
  'D-12.2: todo documento depositado PELA ALIVIAR (uploaded_by <> profile_id) deixa entrada patient_document_provided em audit_logs — autor, paciente, Case que autorizou, nome, hash do caminho, tipo, tamanho e carimbo. Nunca o conteudo nem o caminho em claro. Upload da propria paciente nao entra: a origem ja e derivavel da autoria.';

revoke execute on function curadoria.log_patient_document_provided() from public;

drop trigger if exists log_patient_document_provided_trigger
  on curadoria.patient_documents;
create trigger log_patient_document_provided_trigger
  after insert on curadoria.patient_documents
  for each row execute function curadoria.log_patient_document_provided();

-- ---------------------------------------------------------------------------
-- S-2, respondido por experimento: o writer PRECISA enxergar o objeto
-- ---------------------------------------------------------------------------
--
-- A D-12.1F registrou S-2 em aberto — "o Curador depositante não tem SELECT
-- de storage sobre o objeto que gravou; será decidido na D-12.2, se o writer
-- precisar reler o objeto". A resposta veio de um teste que falhou, não de
-- argumento: `remove()` do Supabase Storage BUSCA o objeto sob a RLS de quem
-- chama antes de apagá-lo. Sem SELECT, o depositante nunca alcança o DELETE,
-- e a compensação da linha órfã não acontecia — silenciosamente, porque
-- `remove` também não levanta erro sem permissão.
--
-- Não é leitura "de conteúdo" que se concede aqui: é a visibilidade mínima
-- sem a qual o writer não consegue desfazer o próprio ato. O recorte é o
-- mesmo do INSERT — só `received/`, só o Case que ele conduz. Os uploads da
-- PRÓPRIA paciente ficam fora: eles vivem em `<dona>/<arquivo>`, sem o
-- segmento `received/`, e continuam invisíveis para o Curador por este
-- caminho. A leitura que ele já tinha sobre anexos da história (stage4a)
-- permanece o que era, e é mais ampla que esta.
create policy "curadoria_patient_documents_storage_select_curador_do_caso"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'patient-documents'
    and (storage.foldername(name))[2] = 'received'
    and curadoria.pode_depositar_no_caso(
      ((storage.foldername(name))[3])::uuid,
      ((storage.foldername(name))[1])::uuid
    )
  );

-- ---------------------------------------------------------------------------
-- A compensação do writer — apagar o próprio resíduo, e só ele
-- ---------------------------------------------------------------------------
--
-- Mesma forma da policy de INSERT do Curador (mesmo helper, mesma leitura do
-- path), com UMA cláusula a mais, que é a que separa compensação de
-- revogação: o objeto não pode ter linha em `patient_documents`.
--
-- O que isso permite:  upload gravou, INSERT falhou → o writer limpa o órfão.
-- O que isso NÃO permite: apagar documento entregue — ele tem linha, sempre.
create policy "curadoria_patient_documents_storage_compensacao_curador"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'patient-documents'
    and (storage.foldername(name))[2] = 'received'
    and curadoria.pode_depositar_no_caso(
      ((storage.foldername(name))[3])::uuid,
      ((storage.foldername(name))[1])::uuid
    )
    and not exists (
      select 1
        from curadoria.patient_documents pd
       where pd.file_path = storage.objects.name
    )
  );
