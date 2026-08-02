-- ============================================================================
-- MIGRAÇÃO DE DADOS LEGADOS → CATÁLOGO 1.0.0 (Release de Reconstrução, ETAPA 4)
--
-- Nenhum dado antigo é apagado: as linhas de case_priority_map e
-- professional_subcriterion_map que apontam para códigos desativados
-- permanecem intactas como histórico. Esta migration cria, ao lado delas,
-- as linhas equivalentes no vocabulário 1.0.0 — apenas onde a correspondência
-- é honesta:
--
--   * correspondência direta   → 20 códigos inalterados: nada a fazer.
--   * renomeação               → ACESSO_LOCALIZACAO ⇒ ACESSO_LOCAL_DE_ATENDIMENTO:
--                                cópia 1:1 preservando valor e datas.
--   * fusão (parcial)          → os 2 pares fundidos: cópia quando as fontes
--                                CONCORDAM (ou só uma existe). Divergência não
--                                é resolvida por código — vira revisão manual
--                                (ADR-039: mapeamento inventado é pior que não
--                                migrar).
--   * apenas histórico         → HISTORICO_REGULARIDADE: sem destino; o fato
--                                que ele carregava já vive em registration_status.
--   * sem correspondência      → conceitos novos do 1.0.0: não há dado legado.
--
-- Proveniência: curadoria.catalog_migration_log registra cada linha migrada ou
-- retida, com origem, destino, categoria e o valor original.
-- Idempotente: reexecutar não duplica (anti-joins e on conflict).
-- Rollback: delete das linhas de destino criadas aqui (rastreáveis pelo log);
-- as linhas legadas nunca foram tocadas.
-- ============================================================================

create table if not exists curadoria.catalog_migration_log (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check (source_table in ('case_priority_map', 'professional_subcriterion_map')),
  source_row_id uuid not null,
  legacy_code text not null,
  target_code text,
  categoria text not null check (categoria in (
    'correspondencia_direta', 'renomeacao', 'fusao_migrada', 'apenas_historico', 'revisao_manual'
  )),
  original_value text not null,
  observacao text,
  migrated_row_id uuid,
  created_at timestamptz not null default now(),

  unique (source_table, source_row_id)
);

comment on table curadoria.catalog_migration_log is
  'Proveniencia da migracao do catalogo 0.9.0 para o 1.0.0 (ETAPA 4 da Release de Reconstrucao). Uma linha por registro legado avaliado: para onde foi, por que categoria, e com que valor original. Linhas de revisao_manual aguardam decisao humana — nunca resolucao automatica.';

grant select on curadoria.catalog_migration_log to authenticated;
grant all on curadoria.catalog_migration_log to service_role;
alter table curadoria.catalog_migration_log enable row level security;
drop policy if exists "catalog_migration_log_admin_read" on curadoria.catalog_migration_log;
create policy "catalog_migration_log_admin_read"
  on curadoria.catalog_migration_log for select to authenticated
  using (curadoria.has_role('administrador'));

do $$
declare
  v_renomeacoes constant jsonb := '{"ACESSO_LOCALIZACAO": "ACESSO_LOCAL_DE_ATENDIMENTO"}'::jsonb;
  -- fusões: alvo <- [fontes]
  v_fusoes constant jsonb := '{
    "EXPERIENCIA_NO_TIPO_DE_CASO": ["EXPERIENCIA_CASOS_SEMELHANTES", "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO"],
    "HISTORICO_ATIVIDADE_ACADEMICA": ["HISTORICO_PRODUCAO_ACADEMICA", "HISTORICO_ENSINO_E_PESQUISA"]
  }'::jsonb;
  reg record;
  alvo_id uuid;
  novo_id uuid;
  legado record;
begin
  -- --------------------------------------------------------------------------
  -- 1. Renomeação — cópia 1:1 nos dois mapas
  -- --------------------------------------------------------------------------
  for reg in select key as legado_code, value #>> '{}' as alvo_code from jsonb_each(v_renomeacoes) loop
    select id into alvo_id from curadoria.method_subcriteria where code = reg.alvo_code;

    for legado in
      select cpm.* from curadoria.case_priority_map cpm
      join curadoria.method_subcriteria ms on ms.id = cpm.subcriterion_id and ms.code = reg.legado_code
      where not exists (select 1 from curadoria.catalog_migration_log l
                        where l.source_table = 'case_priority_map' and l.source_row_id = cpm.id)
    loop
      insert into curadoria.case_priority_map (case_id, subcriterion_id, importance, created_at, updated_at)
        values (legado.case_id, alvo_id, legado.importance, legado.created_at, legado.updated_at)
        on conflict (case_id, subcriterion_id) do nothing
        returning id into novo_id;
      insert into curadoria.catalog_migration_log
        (source_table, source_row_id, legacy_code, target_code, categoria, original_value, migrated_row_id)
        values ('case_priority_map', legado.id, reg.legado_code, reg.alvo_code, 'renomeacao',
                legado.importance::text, novo_id);
    end loop;

    for legado in
      select psm.* from curadoria.professional_subcriterion_map psm
      join curadoria.method_subcriteria ms on ms.id = psm.subcriterion_id and ms.code = reg.legado_code
      where not exists (select 1 from curadoria.catalog_migration_log l
                        where l.source_table = 'professional_subcriterion_map' and l.source_row_id = psm.id)
    loop
      insert into curadoria.professional_subcriterion_map
        (professional_profile_id, subcriterion_id, status, note, created_at, updated_at)
        values (legado.professional_profile_id, alvo_id, legado.status, legado.note,
                legado.created_at, legado.updated_at)
        on conflict (professional_profile_id, subcriterion_id) do nothing
        returning id into novo_id;
      insert into curadoria.catalog_migration_log
        (source_table, source_row_id, legacy_code, target_code, categoria, original_value, migrated_row_id)
        values ('professional_subcriterion_map', legado.id, reg.legado_code, reg.alvo_code, 'renomeacao',
                legado.status::text, novo_id);
    end loop;
  end loop;

  -- --------------------------------------------------------------------------
  -- 2. Fusões — migra quando as fontes concordam; divergência vira revisão manual
  -- --------------------------------------------------------------------------
  for reg in select key as alvo_code, value as fontes from jsonb_each(v_fusoes) loop
    select id into alvo_id from curadoria.method_subcriteria where code = reg.alvo_code;

    -- case_priority_map: agrupa por case, compara importâncias das fontes
    for legado in
      select cpm.case_id,
             array_agg(cpm.id order by ms.code) as row_ids,
             array_agg(distinct cpm.importance) as importancias,
             array_agg(ms.code order by ms.code) as codigos,
             min(cpm.created_at) as created_at, max(cpm.updated_at) as updated_at
      from curadoria.case_priority_map cpm
      join curadoria.method_subcriteria ms on ms.id = cpm.subcriterion_id
      where ms.code in (select jsonb_array_elements_text(reg.fontes))
        and not exists (select 1 from curadoria.catalog_migration_log l
                        where l.source_table = 'case_priority_map' and l.source_row_id = cpm.id)
      group by cpm.case_id
    loop
      if array_length(legado.importancias, 1) = 1 then
        insert into curadoria.case_priority_map (case_id, subcriterion_id, importance, created_at, updated_at)
          values (legado.case_id, alvo_id, legado.importancias[1], legado.created_at, legado.updated_at)
          on conflict (case_id, subcriterion_id) do nothing
          returning id into novo_id;
        insert into curadoria.catalog_migration_log
          (source_table, source_row_id, legacy_code, target_code, categoria, original_value, migrated_row_id)
        select 'case_priority_map', rid, legado.codigos[i], reg.alvo_code, 'fusao_migrada',
               legado.importancias[1]::text, novo_id
        from unnest(legado.row_ids) with ordinality as u(rid, i);
      else
        insert into curadoria.catalog_migration_log
          (source_table, source_row_id, legacy_code, target_code, categoria, original_value, observacao)
        select 'case_priority_map', rid, legado.codigos[i], reg.alvo_code, 'revisao_manual',
               array_to_string(legado.importancias, ' vs '),
               'Fontes da fusão divergem — decisão humana pendente; legado permanece legível.'
        from unnest(legado.row_ids) with ordinality as u(rid, i);
      end if;
    end loop;

    -- professional_subcriterion_map: mesmo critério, sobre status
    for legado in
      select psm.professional_profile_id,
             array_agg(psm.id order by ms.code) as row_ids,
             array_agg(distinct psm.status) as estados,
             array_agg(ms.code order by ms.code) as codigos,
             string_agg(psm.note, ' | ') as notas,
             min(psm.created_at) as created_at, max(psm.updated_at) as updated_at
      from curadoria.professional_subcriterion_map psm
      join curadoria.method_subcriteria ms on ms.id = psm.subcriterion_id
      where ms.code in (select jsonb_array_elements_text(reg.fontes))
        and not exists (select 1 from curadoria.catalog_migration_log l
                        where l.source_table = 'professional_subcriterion_map' and l.source_row_id = psm.id)
      group by psm.professional_profile_id
    loop
      if array_length(legado.estados, 1) = 1 then
        insert into curadoria.professional_subcriterion_map
          (professional_profile_id, subcriterion_id, status, note, created_at, updated_at)
          values (legado.professional_profile_id, alvo_id, legado.estados[1],
                  left(legado.notas, 280), legado.created_at, legado.updated_at)
          on conflict (professional_profile_id, subcriterion_id) do nothing
          returning id into novo_id;
        insert into curadoria.catalog_migration_log
          (source_table, source_row_id, legacy_code, target_code, categoria, original_value, migrated_row_id)
        select 'professional_subcriterion_map', rid, legado.codigos[i], reg.alvo_code, 'fusao_migrada',
               legado.estados[1]::text, novo_id
        from unnest(legado.row_ids) with ordinality as u(rid, i);
      else
        insert into curadoria.catalog_migration_log
          (source_table, source_row_id, legacy_code, target_code, categoria, original_value, observacao)
        select 'professional_subcriterion_map', rid, legado.codigos[i], reg.alvo_code, 'revisao_manual',
               array_to_string(legado.estados, ' vs '),
               'Fontes da fusão divergem — decisão humana pendente; legado permanece legível.'
        from unnest(legado.row_ids) with ordinality as u(rid, i);
      end if;
    end loop;
  end loop;

  -- --------------------------------------------------------------------------
  -- 3. Apenas histórico — HISTORICO_REGULARIDADE não tem destino
  -- --------------------------------------------------------------------------
  insert into curadoria.catalog_migration_log
    (source_table, source_row_id, legacy_code, target_code, categoria, original_value, observacao)
  select 'case_priority_map', cpm.id, 'HISTORICO_REGULARIDADE', null, 'apenas_historico',
         cpm.importance::text, 'O fato vive em registration_status; a linha permanece como histórico.'
  from curadoria.case_priority_map cpm
  join curadoria.method_subcriteria ms on ms.id = cpm.subcriterion_id and ms.code = 'HISTORICO_REGULARIDADE'
  where not exists (select 1 from curadoria.catalog_migration_log l
                    where l.source_table = 'case_priority_map' and l.source_row_id = cpm.id);

  insert into curadoria.catalog_migration_log
    (source_table, source_row_id, legacy_code, target_code, categoria, original_value, observacao)
  select 'professional_subcriterion_map', psm.id, 'HISTORICO_REGULARIDADE', null, 'apenas_historico',
         psm.status::text, 'O fato vive em registration_status; a linha permanece como histórico.'
  from curadoria.professional_subcriterion_map psm
  join curadoria.method_subcriteria ms on ms.id = psm.subcriterion_id and ms.code = 'HISTORICO_REGULARIDADE'
  where not exists (select 1 from curadoria.catalog_migration_log l
                    where l.source_table = 'professional_subcriterion_map' and l.source_row_id = psm.id);

  -- --------------------------------------------------------------------------
  -- 4. Relatório no log do banco
  -- --------------------------------------------------------------------------
  raise notice 'Migração de dados 0.9.0 → 1.0.0 concluída. Contagens por categoria:';
  for reg in
    select categoria, count(*) as total from curadoria.catalog_migration_log group by categoria order by categoria
  loop
    raise notice '  %: %', reg.categoria, reg.total;
  end loop;
end $$;
