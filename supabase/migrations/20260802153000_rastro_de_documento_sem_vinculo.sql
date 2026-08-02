-- ============================================================================
-- BLOCO B / E8 — RASTRO OBSERVÁVEL PARA DOCUMENTO QUE SOBROU SEM VÍNCULO
-- ============================================================================
--
-- FINALIDADE
--   A operação documento+vínculo da história é uma saga em três sistemas
--   (storage, `patient_documents`, `patient_story_attachments`), sem transação
--   que os cubra. A compensação (remover o documento recém-criado quando o
--   vínculo é recusado) já existe no servidor — mas quando a PRÓPRIA
--   compensação falha, o resíduo ficava registrado apenas em log de servidor,
--   invisível ao ledger da casa (gate B16). Esta migration dá ao evento o seu
--   verbo no vocabulário controlado de auditoria e uma porta SECURITY DEFINER
--   para gravá-lo a partir da sessão real da paciente:
--
--   1. `audit_action` ganha o valor 'patient_document_orphaned' (aditivo,
--      mesmo precedente de 'case_discarded' e 'curadoria_delivered').
--   2. `register_patient_document_residue` — registra em `audit_logs` que um
--      documento ficou sem vínculo e a compensação não concluiu. Só o dono do
--      documento (ou a equipe administradora) registra; o rastro sobrevive à
--      remoção posterior do documento (audit_logs não tem FK para
--      patient_documents, de propósito — o mesmo desenho de 'case_discarded').
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.audit_logs` e o tipo `curadoria.audit_action` existentes
--     (20260723164021).
--   - `curadoria.patient_documents` existente (20260723164543).
--   - `curadoria.has_role` existente.
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada. Documentos órfãos anteriores a esta
--     migration não ganham rastro retroativo (não se inventa história) —
--     continuam detectáveis por `listarCandidatosAOrfao`.
--
-- PROVA DE FECHAMENTO
--   - Gate B16 (tests/remediacao/atomicidade.integration.test.ts): falha do
--     vínculo não deixa resíduo invisível — ou a compensação removeu o
--     documento, ou existe linha 'patient_document_orphaned' em audit_logs.
--   - Regressão em tests/integration/anexo-de-documento-a-historia:
--     retry reutiliza o vínculo, falha compensa, documento vinculado a outra
--     história nunca é removido pela compensação (guarda).
--
-- ROLLBACK
--   drop function if exists curadoria.register_patient_document_residue(uuid, text);
--   -- O valor 'patient_document_orphaned' de audit_action NÃO é removível sem
--   -- recriar o tipo; é inofensivo sem uso (nenhuma função o referencia após
--   -- o rollback). Documentado como resíduo aceito — mesmo precedente de
--   -- 'case_discarded' (20260727140000) e 'curadoria_delivered' (20260802150000).
--   -- Linhas de auditoria já gravadas permanecem: auditoria é história real.
-- ============================================================================

-- O verbo do evento no vocabulário controlado (aditivo; `add value` convive
-- com transação no PG 12+ desde que o valor não seja USADO na mesma transação
-- — e não é: quem o usa é o corpo da função, avaliado só em execução).
alter type curadoria.audit_action add value if not exists 'patient_document_orphaned';

create or replace function curadoria.register_patient_document_residue(
  _document_id uuid,
  _reason text
)
returns void
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _doc record;
begin
  if _actor is null then
    raise exception 'Registro de resíduo de documento exige ator autenticado' using errcode = '42501';
  end if;

  if coalesce(btrim(_reason), '') = '' then
    raise exception 'Registro de resíduo exige o motivo' using errcode = '23514';
  end if;

  select id, profile_id, file_name, file_path
    into _doc
    from curadoria.patient_documents
   where id = _document_id;
  if not found then
    -- Documento inexistente = não há resíduo a registrar. Recusa explícita de
    -- domínio, nunca um registro inventado sobre algo que não existe.
    raise exception 'Documento % não existe — nada a registrar como resíduo', _document_id
      using errcode = 'P0002';
  end if;

  -- Só o dono do documento (o fluxo real da história) ou a equipe
  -- administradora registram o resíduo — nunca um terceiro sobre o documento
  -- de outra pessoa.
  if not (_doc.profile_id = _actor or curadoria.has_role('administrador')) then
    raise exception 'Só o dono do documento ou o Administrador registram este resíduo'
      using errcode = '42501';
  end if;

  -- Validação de estado no servidor (nunca confiada ao cliente): um documento
  -- vinculado a uma história NÃO é resíduo — registrá-lo como órfão seria
  -- inventar um incidente que não existe.
  if exists (
    select 1 from curadoria.patient_story_attachments where document_id = _document_id
  ) then
    raise exception 'Documento % está vinculado a uma história — não é resíduo', _document_id
      using errcode = '23514';
  end if;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    _actor,
    'patient_document_orphaned',
    _doc.profile_id,
    jsonb_build_object(
      'document_id', _doc.id,
      'file_name', _doc.file_name,
      'file_path', _doc.file_path,
      'reason', _reason
    )
  );
end;
$function$;

comment on function curadoria.register_patient_document_residue(uuid, text) is
  'Grava em audit_logs que um documento ficou sem vínculo com a história e a compensação não concluiu (Bloco B/E8, gate B16). O rastro torna o resíduo visível e sobrevive à remoção posterior do documento. Chamada pelo servidor quando a compensação da saga documento+vínculo falha.';

revoke execute on function curadoria.register_patient_document_residue(uuid, text) from public;
grant execute on function curadoria.register_patient_document_residue(uuid, text) to authenticated;
grant execute on function curadoria.register_patient_document_residue(uuid, text) to service_role;
