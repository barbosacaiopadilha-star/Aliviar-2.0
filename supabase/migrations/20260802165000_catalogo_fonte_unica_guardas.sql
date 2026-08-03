-- ============================================================================
-- CATÁLOGO CANÔNICO — FONTE ÚNICA E GUARDAS DE PARIDADE (BLOCO E / FRENTE 1)
--
-- Migration ADITIVA sobre o Catálogo 1.0.0 congelado (20260802100000/110000,
-- que esta migration NÃO reescreve). ADR-046 aprova o conteúdo; ADR-047 torna
-- o banco autoritativo. A AUDITORIA_03 §9 provou que o dado era mais
-- protegido que a norma: practice_evidence gravava subcriterion_code sem FK e
-- options[] sem validação (36 códigos divergentes graváveis em silêncio; duas
-- faixas de custo aceitas de bom grado), axis era NULLABLE, existiam dois
-- defaults de catalog_version, e a service key podia reescrever o catálogo
-- inteiro sem rastro.
--
-- O que entra aqui, na ordem:
--   0. Pré-verificações que ABORTAM NOMEANDO IDS em qualquer ambiguidade de
--      dado local (nenhuma correção silenciosa de dado).
--   1. FK practice_evidence.subcriterion_code → method_subcriteria(code).
--   2. Trigger de validação do payload de practice_evidence contra
--      method_subcriterion_options (opções vigentes; estrutura por campos;
--      UMA faixa de custo; escolha única respeitada; gravação nova só de
--      conceito vigente e na versão vigente do conceito).
--   3. Vigência do contrato: conceito ativo exige axis/response_type/
--      cruzamento/evidence_source válidos (CHECK).
--   4. Defaults de catalog_version unificados em '1.0.0'.
--   5. Imutabilidade/autoria do catálogo: mudanças em method_subcriteria e
--      method_subcriterion_options só com justificativa registrada (rastro em
--      catalog_change_log); DELETE nunca — sair de circulação é active=false.
--
-- Unicidade: `method_subcriteria.code` já é UNIQUE (alvo das FKs) e
-- `method_subcriterion_options (subcriterion_code, side, field, value)` já é
-- UNIQUE desde 20260802100000 — conferido, nada a adicionar.
--
-- CONTRATO PARA MIGRATIONS FUTURAS DO CATÁLOGO: qualquer mudança de linha em
-- method_subcriteria/method_subcriterion_options passa a exigir, na mesma
-- transação:
--   select set_config('curadoria.catalog_change_rationale',
--                     'ADR-XXX: motivo da mudança', true);
-- O trigger grava o rastro (quem, quando, por quê) em catalog_change_log.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Pré-verificações — abortar nomeando ids, nunca corrigir em silêncio
-- ----------------------------------------------------------------------------

do $$
declare
  orfaos text;
begin
  -- Evidência apontando para código que não existe no catálogo: FK impossível.
  select string_agg(pe.id::text || ' (' || pe.subcriterion_code || ')', ', ')
    into orfaos
    from curadoria.practice_evidence pe
   where not exists (
     select 1 from curadoria.method_subcriteria ms where ms.code = pe.subcriterion_code
   );
  if orfaos is not null then
    raise exception
      'AMBIGUIDADE DE DADO: practice_evidence com subcriterion_code órfão — decidir antes da FK. Linhas: %',
      orfaos;
  end if;

  -- Evidência de conceito ATIVO com opção fora do vocabulário vigente do
  -- campo principal: alinhar exigiria decidir POR QUAL código trocar — parada.
  select string_agg(distinct pe.id::text || ' (' || pe.subcriterion_code || ': ' || opcao || ')', ', ')
    into orfaos
    from curadoria.practice_evidence pe
    join curadoria.method_subcriteria ms on ms.code = pe.subcriterion_code and ms.active
    cross join lateral unnest(pe.options) as opcao
   where not exists (
     select 1
       from curadoria.method_subcriterion_options o
      where o.subcriterion_code = pe.subcriterion_code
        and o.side = 'profissional'
        and o.field = 'principal'
        and o.active
        and o.value = opcao
   );
  if orfaos is not null then
    raise exception
      'AMBIGUIDADE DE DADO: practice_evidence com opção fora do catálogo vigente — decidir antes da validação. Linhas: %',
      orfaos;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1. A FK que faltava — identidade de conceito passa a ser referencial
-- ----------------------------------------------------------------------------

alter table curadoria.practice_evidence
  drop constraint if exists practice_evidence_subcriterion_fk;

alter table curadoria.practice_evidence
  add constraint practice_evidence_subcriterion_fk
  foreign key (subcriterion_code)
  references curadoria.method_subcriteria (code)
  on update cascade;

comment on constraint practice_evidence_subcriterion_fk on curadoria.practice_evidence is
  'A decisao registrada em 20260731220000 ("sem FK ate a virada do catalogo") venceu: o Catalogo 1.0.0 vive em method_subcriteria desde 20260802100000, e a FK prometida entra aqui. on update cascade acompanha a identidade estavel da ADR-039.';

-- ----------------------------------------------------------------------------
-- 2. Validação do payload contra o catálogo vivo (as 166 opções deixam de ser
--    ornamentais — AUDITORIA_03 §9 "zero leituras")
-- ----------------------------------------------------------------------------

create or replace function curadoria.practice_evidence_validate_payload()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  conceito record;
  invalidas text;
  campo record;
  bruto jsonb;
  valores text[];
  invalidas_campo text;
begin
  select active, response_type, catalog_version
    into conceito
    from curadoria.method_subcriteria
   where code = new.subcriterion_code;

  -- FK garante existência; aqui garante-se VIGÊNCIA da gravação nova.
  if not conceito.active then
    raise exception
      'Gravacao nova e so de conceito vigente: % saiu de circulacao (historico permanece legivel).',
      new.subcriterion_code
      using errcode = 'check_violation';
  end if;

  -- Versão: nenhum modulo inventa — gravação nova carrega a versão vigente do
  -- conceito; o registro antigo mantém a versão de criação (não é tocado).
  if new.catalog_version is distinct from conceito.catalog_version then
    raise exception
      'Versao de catalogo divergente para %: vigente e %, recebida %.',
      new.subcriterion_code, conceito.catalog_version, new.catalog_version
      using errcode = 'check_violation';
  end if;

  if conceito.response_type = 'estruturado' then
    -- Estrutura por campos do aprovado: fato estruturado não usa options[] —
    -- foi o achatamento de options[] que gravava duas faixas de custo.
    if coalesce(array_length(new.options, 1), 0) > 0 then
      raise exception
        '%: fato estruturado nao usa options[] — a resposta vive nos campos estruturados (details).',
        new.subcriterion_code
        using errcode = 'check_violation';
    end if;
  else
    if coalesce(array_length(new.options, 1), 0) = 0 then
      raise exception
        '%: nenhuma opcao selecionada — ausencia de resposta nao e resposta.',
        new.subcriterion_code
        using errcode = 'check_violation';
    end if;

    if conceito.response_type = 'escolha_unica' and array_length(new.options, 1) > 1 then
      raise exception
        '%: escolha unica — % opcoes recebidas.',
        new.subcriterion_code, array_length(new.options, 1)
        using errcode = 'check_violation';
    end if;

    select string_agg(opcao, ', ')
      into invalidas
      from unnest(new.options) as opcao
     where not exists (
       select 1
         from curadoria.method_subcriterion_options o
        where o.subcriterion_code = new.subcriterion_code
          and o.side = 'profissional'
          and o.field = 'principal'
          and o.active
          and o.value = opcao
     );
    if invalidas is not null then
      raise exception
        '%: opcao fora do catalogo vigente (campo principal): %.',
        new.subcriterion_code, invalidas
        using errcode = 'check_violation';
    end if;
  end if;

  -- Campos complementares fechados: quando presentes em details, os valores
  -- são os códigos vigentes do campo — nunca rótulo, nunca cópia antiga.
  for campo in
    select distinct o.field
      from curadoria.method_subcriterion_options o
     where o.subcriterion_code = new.subcriterion_code
       and o.side = 'profissional'
       and o.field <> 'principal'
  loop
    if not (new.details ? campo.field) then
      continue;
    end if;

    bruto := new.details -> campo.field;
    if jsonb_typeof(bruto) = 'string' then
      valores := array[bruto #>> '{}'];
    elsif jsonb_typeof(bruto) = 'array' then
      select coalesce(array_agg(elem #>> '{}'), '{}') into valores
        from jsonb_array_elements(bruto) as elem;
    else
      raise exception
        '%: o campo % recebe codigo canonico (ou lista) — recebeu %.',
        new.subcriterion_code, campo.field, jsonb_typeof(bruto)
        using errcode = 'check_violation';
    end if;

    select string_agg(valor, ', ')
      into invalidas_campo
      from unnest(valores) as valor
     where not exists (
       select 1
         from curadoria.method_subcriterion_options o
        where o.subcriterion_code = new.subcriterion_code
          and o.side = 'profissional'
          and o.field = campo.field
          and o.active
          and o.value = valor
     );
    if invalidas_campo is not null then
      raise exception
        '%: valor fora do catalogo vigente no campo %: %.',
        new.subcriterion_code, campo.field, invalidas_campo
        using errcode = 'check_violation';
    end if;

    -- UMA faixa de custo: duas faixas simultaneas sao o estado impossivel do
    -- catalogo aprovado (AUDITORIA_01 D6 / AUDITORIA_03 §9).
    if new.subcriterion_code = 'VIABILIDADE_CUSTO_E_PAGAMENTO'
       and campo.field = 'faixa'
       and coalesce(array_length(valores, 1), 0) > 1 then
      raise exception
        'VIABILIDADE_CUSTO_E_PAGAMENTO: o campo faixa aceita UMA escolha — % recebidas (%).',
        array_length(valores, 1), array_to_string(valores, ', ')
        using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

revoke execute on function curadoria.practice_evidence_validate_payload() from public;
revoke execute on function curadoria.practice_evidence_validate_payload() from anon;

drop trigger if exists practice_evidence_payload_check on curadoria.practice_evidence;
create trigger practice_evidence_payload_check
  before insert on curadoria.practice_evidence
  for each row execute function curadoria.practice_evidence_validate_payload();

-- ----------------------------------------------------------------------------
-- 3. Vigência do contrato do conceito ativo (axis deixou de ser opcional)
-- ----------------------------------------------------------------------------

alter table curadoria.method_subcriteria
  drop constraint if exists method_subcriteria_ativo_com_contrato;

alter table curadoria.method_subcriteria
  add constraint method_subcriteria_ativo_com_contrato check (
    not active or (
      axis is not null
      and response_type is not null
      and cruzamento is not null
      and evidence_source in ('oficial_primaria', 'institucional', 'entrevista', 'publica_secundaria')
    )
  );

comment on constraint method_subcriteria_ativo_com_contrato on curadoria.method_subcriteria is
  'Conceito ativo sem eixo, tipo de resposta, forma de cruzamento ou fonte de evidencia valida era inserivel (axis NULLABLE — AUDITORIA_03 §9). O legado inativo permanece como esta: historico nao se reescreve.';

-- ----------------------------------------------------------------------------
-- 4. Defaults de versão unificados — nenhuma tabela "nasce" 0.9.0
-- ----------------------------------------------------------------------------

alter table curadoria.method_subcriteria
  alter column catalog_version set default '1.0.0';

-- ----------------------------------------------------------------------------
-- 5. Imutabilidade e autoria: a norma tão protegida quanto o dado
-- ----------------------------------------------------------------------------

create table if not exists curadoria.catalog_change_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_code text not null,
  action text not null check (action in ('INSERT', 'UPDATE')),
  rationale text not null check (length(btrim(rationale)) > 0),
  executed_by text not null default current_user,
  executed_at timestamptz not null default now()
);

comment on table curadoria.catalog_change_log is
  'Rastro obrigatorio de TODA mudanca no catalogo (method_subcriteria/method_subcriterion_options). Escrito pelo trigger catalog_guard; nenhuma mudanca de catalogo existe sem linha aqui. Contraste com o estado auditado: "a service key pode reescrever o catalogo inteiro sem rastro" (AUDITORIA_03 §9).';

alter table curadoria.catalog_change_log enable row level security;
grant select on curadoria.catalog_change_log to authenticated;

drop policy if exists "catalog_change_log_select_interno" on curadoria.catalog_change_log;
create policy "catalog_change_log_select_interno"
  on curadoria.catalog_change_log for select to authenticated
  using (curadoria.has_role('administrador'));

create or replace function curadoria.catalog_guard()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  justificativa text;
  codigo text;
begin
  if tg_op = 'DELETE' then
    raise exception
      'Catalogo nao se apaga: sair de circulacao e active=false, nunca DELETE (ADR-039 item 6).'
      using errcode = 'check_violation';
  end if;

  justificativa := nullif(btrim(coalesce(
    current_setting('curadoria.catalog_change_rationale', true), '')), '');

  if justificativa is null then
    raise exception
      'Catalogo e norma: mudanca so via migration ou servico com justificativa registrada — set_config(''curadoria.catalog_change_rationale'', ''ADR-XXX: motivo'', true) na mesma transacao.'
      using errcode = 'check_violation';
  end if;

  if tg_table_name = 'method_subcriteria' then
    codigo := new.code;
  else
    codigo := new.subcriterion_code || '/' || new.side || '/' || new.field || '/' || new.value;
  end if;

  insert into curadoria.catalog_change_log (table_name, row_code, action, rationale)
  values (tg_table_name, codigo, tg_op, justificativa);

  return new;
end;
$$;

revoke execute on function curadoria.catalog_guard() from public;
revoke execute on function curadoria.catalog_guard() from anon;

drop trigger if exists method_subcriteria_catalog_guard on curadoria.method_subcriteria;
create trigger method_subcriteria_catalog_guard
  before insert or update or delete on curadoria.method_subcriteria
  for each row execute function curadoria.catalog_guard();

drop trigger if exists method_subcriterion_options_catalog_guard on curadoria.method_subcriterion_options;
create trigger method_subcriterion_options_catalog_guard
  before insert or update or delete on curadoria.method_subcriterion_options
  for each row execute function curadoria.catalog_guard();

-- ----------------------------------------------------------------------------
-- ROLLBACK (executar na ordem; nenhum dado é perdido — tudo aqui é guarda):
--
--   drop trigger if exists method_subcriterion_options_catalog_guard
--     on curadoria.method_subcriterion_options;
--   drop trigger if exists method_subcriteria_catalog_guard
--     on curadoria.method_subcriteria;
--   drop function if exists curadoria.catalog_guard();
--   drop table if exists curadoria.catalog_change_log;
--   alter table curadoria.method_subcriteria
--     alter column catalog_version set default '0.9.0';
--   alter table curadoria.method_subcriteria
--     drop constraint if exists method_subcriteria_ativo_com_contrato;
--   drop trigger if exists practice_evidence_payload_check
--     on curadoria.practice_evidence;
--   drop function if exists curadoria.practice_evidence_validate_payload();
--   alter table curadoria.practice_evidence
--     drop constraint if exists practice_evidence_subcriterion_fk;
-- ----------------------------------------------------------------------------
