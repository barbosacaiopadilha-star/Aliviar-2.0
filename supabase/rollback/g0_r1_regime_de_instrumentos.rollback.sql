-- G0-R1 — rollback executável e transacional
-- Remove somente os objetos criados por 20260818193600_g0_r1_regime_de_instrumentos.sql.
begin;

do $preflight$
begin
  if to_regtype('curadoria.legal_regime') is null
     or to_regclass('curadoria.legal_document_instances') is null
     or to_regclass('curadoria.legal_instance_signers') is null
     or to_regclass('curadoria.legal_instrument_terminations') is null then
    raise exception 'G0-R1 rollback: instalação completa não encontrada';
  end if;
end;
$preflight$;

drop function curadoria.criar_instancia_de_documento(uuid, uuid, uuid, jsonb, jsonb, uuid, timestamptz, jsonb, text);
drop function curadoria.assinar_instancia(uuid, uuid, text, text, text, text, jsonb, text, text);
drop function curadoria.revogar_por_escopo(uuid, text, text, text, text);
drop function curadoria.rescindir_instrumento(uuid, text, text, smallint, timestamptz, timestamptz, text);

drop index if exists curadoria.legal_acceptances_uma_assinatura_por_assinante;
drop index if exists curadoria.legal_acceptances_instance_idx;
alter table curadoria.legal_acceptances
  drop constraint if exists legal_acceptances_instrumento_coerente,
  drop constraint if exists legal_acceptances_nivel_sustentado,
  drop column if exists especie,
  drop column if exists instance_id,
  drop column if exists signer_id,
  drop column if exists instancia_hash,
  drop column if exists nivel,
  drop column if exists provedor,
  drop column if exists evidencia_externa,
  drop column if exists declaracao_de_vontade;

drop index if exists curadoria.legal_acceptance_revocations_unica;
alter table curadoria.legal_acceptance_revocations
  drop column if exists escopo,
  drop column if exists escopo_rotulo;
create unique index legal_acceptance_revocations_unica
  on curadoria.legal_acceptance_revocations (acceptance_id);

drop table curadoria.legal_instrument_terminations;
drop table curadoria.legal_instance_signers;
drop table curadoria.legal_document_instances;

drop function curadoria.enforce_legal_instance_insert();
drop function curadoria.enforce_legal_instance_congelada();
drop function curadoria.enforce_legal_signers_congelados();

alter table curadoria.legal_document_versions
  drop constraint if exists legal_document_versions_contratos_validos,
  drop column if exists variaveis_requeridas,
  drop column if exists assinantes_exigidos,
  drop column if exists escopos_revogaveis,
  drop column if exists nivel_exigido,
  drop column if exists aprovado_por,
  drop column if exists aprovado_em,
  drop column if exists motivo_da_mudanca;

alter table curadoria.legal_documents
  drop column if exists regime,
  drop column if exists categoria,
  drop column if exists ordem_de_apresentacao;

drop function curadoria.g0_r1_contratos_json_validos(jsonb, jsonb, jsonb);
drop type curadoria.legal_termination_cause;
drop type curadoria.legal_signer_role;
drop type curadoria.legal_signature_level;
drop type curadoria.legal_instance_status;
drop type curadoria.legal_regime;

commit;

-- Sentinela pós-rollback: deve retornar uma linha com todos os campos true.
select
  to_regtype('curadoria.legal_regime') is null as tipos_removidos,
  to_regclass('curadoria.legal_document_instances') is null as instancias_removidas,
  not exists (
    select 1 from information_schema.columns
    where table_schema='curadoria' and table_name='legal_document_versions'
      and column_name='nivel_exigido'
  ) as colunas_removidas,
  to_regclass('curadoria.legal_acceptance_revocations_unica') is not null as indice_baseline_restaurado;
