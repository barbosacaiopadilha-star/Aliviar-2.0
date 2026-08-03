-- ============================================================================
-- BLOCO C / ETAPA 9 — REDECLARAÇÃO DE ÁREA VERSIONADA (juízo não se sobrescreve)
-- ============================================================================
--
-- FINALIDADE
--   A declaração de área é um JUÍZO clínico do Curador sobre o par (Case,
--   profissional) — e o upsert do repositório sobrescrevia esse juízo sem
--   histórico: COMPATIVEL virava INCOMPATIVEL na mesma linha, e a leitura
--   anterior (com sua justificativa e o texto que o Curador tinha diante dos
--   olhos) sumia para sempre. Correção de juízo declarado passa a ser
--   REDECLARAÇÃO VERSIONADA (ADR-048 + R4/R5 do B.5): nova linha vigente,
--   anterior preservada como histórico.
--
--   DESENHO MÍNIMO ESCOLHIDO (a primeira alternativa da matriz): a PK
--   composta (case_id, professional_profile_id) vira PK por `id` +
--   `superseded_at`/`superseded_by_declaration` na linha superada + índice
--   ÚNICO PARCIAL da vigente (par com superseded_at IS NULL) — concorrência
--   resolvida pelo próprio banco: nunca duas vigentes. Tabela de histórico
--   separada duplicaria schema e policies para o mesmo dado.
--
--   TERMINAL vs COMPLETÁVEL (decisão documentada, pedida pelo mandato):
--   - TERMINAIS: COMPATIVEL, PARCIALMENTE_COMPATIVEL e INCOMPATIVEL — juízo
--     declarado. UPDATE direto é recusado; correção = RPC
--     `redeclare_area_compatibility`. Exceção única e estreita: o flip
--     confirmed_by_curator false -> true com TODO o resto intacto (confirmar
--     a participação de um PARCIALMENTE_COMPATIVEL completa a decisão
--     prevista no DDL original — não reescreve juízo nenhum).
--   - COMPLETÁVEL: INFORMACAO_INSUFICIENTE — explicitamente "ninguém julgou
--     ainda". A linha vigente segue editável em lugar (o caminho atual do
--     repositório): completar uma pendência de verificação não é reescrever
--     juízo. Linha SUPERADA, em qualquer estado, é histórico imutável.
--
--   RPC `redeclare_area_compatibility` — padrão B (M150/M156): ator por
--   auth.uid(); autorização por RELAÇÃO (Curador DESIGNADO do Case ou
--   administrador — relação, não papel); motivo obrigatório; FOR UPDATE no
--   Case (eixo de serialização) e na vigente; supersede + insere a nova
--   vigente + vínculo + audit `area_redeclared` na MESMA transação, sob o
--   flag transacional `curadoria.redeclaracao_em_curso` (mesmo gabarito da
--   supersessão do Perfil).
--
--   IDEMPOTÊNCIA (decisão documentada): redeclarar é ATO — cada chamada abre
--   uma nova versão vigente e arquiva a anterior. Duas chamadas em paralelo
--   serializam no FOR UPDATE do Case: a segunda enxerga a nova vigente e a
--   supersede por sua vez (corrente de versões, sempre EXATAMENTE UMA
--   vigente). Nada é deduplicado em silêncio; o histórico mostra cada ato.
--
--   A REDE/CRUZAMENTO LÊ SÓ A VIGENTE: `listAreaDeclarations`
--   (src/modules/curadoria/area-repository.ts — único leitor da tabela em
--   src) passa a filtrar `superseded_at is null`; mesa-cruzamento,
--   relatório assistido e portão de área herdam o filtro por ele. NENHUMA
--   superfície nova (Bloco F).
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.area_compatibility_declarations` (20260727081000) com PK
--     composta (case_id, professional_profile_id), SEM nenhuma FK apontando
--     para ela (verificado no catálogo local em 2026-08-02) — a troca de PK
--     é segura.
--   - `curadoria.has_role`, `curadoria.audit_logs`, flag transacional via
--     set_config (gabarito 20260802156000).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - 35 declarações locais (21 COMPATIVEL, 7 INFORMACAO_INSUFICIENTE, 7
--     INCOMPATIVEL), TODAS de pares distintos (verificado 2026-08-02):
--     `id` nasce com gen_random_uuid() por linha (rewrite do PG 17),
--     `superseded_at` nasce NULL — todas viram vigentes, o índice parcial
--     único é satisfeito por construção. Nenhuma consolidação necessária;
--     se houvesse par duplicado, o CREATE UNIQUE INDEX abortaria a migration
--     com a lista no erro — nunca escolha silenciosa.
--   - Nenhum UPDATE/DELETE de dado. Aditivo + troca de constraint.
--
-- PROVA DE FECHAMENTO
--   - Gates novos (imutabilidade-frente2): juízo terminal não sobrescrevível
--     por UPDATE direto de sessão real; redeclaração oficial preserva o
--     histórico intacto e vinculado; só o Curador do Case (ou admin)
--     redeclara; 2 redeclarações em paralelo => exatamente 1 vigente;
--     INFORMACAO_INSUFICIENTE segue completável em lugar; INSERT direto de
--     segunda vigente morre no índice parcial; trilha area_redeclared.
--   - Ajuste de leitura/escrita SEM afrouxar nada:
--     src/modules/curadoria/area-repository.ts troca o upsert cego por
--     "insere a primeira / edita a vigente" (o erro de juízo terminal chega
--     à superfície como recusa real do banco) e filtra a vigente na leitura.
--
-- ROLLBACK
--   drop function if exists curadoria.redeclare_area_compatibility(
--     uuid, uuid, text, text, boolean, text, text, text);
--   drop trigger if exists assert_area_declaration_transition_trigger
--     on curadoria.area_compatibility_declarations;
--   drop function if exists curadoria.assert_area_declaration_transition();
--   drop index if exists curadoria.area_declarations_case_idx;
--   drop index if exists curadoria.area_declarations_one_vigente_per_pair;
--   alter table curadoria.area_compatibility_declarations
--     drop constraint if exists area_declaration_supersession_coherent,
--     drop constraint if exists area_declaration_supersession_link;
--   -- (recolar a PK composta exige antes remover as linhas SUPERADAS, que
--   --  duplicam o par; depois:)
--   alter table curadoria.area_compatibility_declarations
--     drop constraint if exists area_compatibility_declarations_pkey;
--   alter table curadoria.area_compatibility_declarations
--     add primary key (case_id, professional_profile_id);
--   alter table curadoria.area_compatibility_declarations
--     drop column if exists superseded_by_declaration,
--     drop column if exists superseded_at,
--     drop column if exists id;
--   -- O valor 'area_redeclared' em curadoria.audit_action não é removível
--   -- sem recriar o tipo; inofensivo sem uso (resíduo aceito).
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'area_redeclared';

-- ---------------------------------------------------------------------------
-- 1. Identidade por linha + vínculo de supersessão + unicidade da vigente
-- ---------------------------------------------------------------------------

alter table curadoria.area_compatibility_declarations
  add column id uuid not null default gen_random_uuid(),
  add column superseded_at timestamptz,
  add column superseded_by_declaration uuid;

alter table curadoria.area_compatibility_declarations
  drop constraint area_compatibility_declarations_pkey;

alter table curadoria.area_compatibility_declarations
  add primary key (id);

alter table curadoria.area_compatibility_declarations
  add constraint area_declaration_supersession_link
    foreign key (superseded_by_declaration)
    references curadoria.area_compatibility_declarations (id)
    on delete set null;

-- Vínculo só existe em linha superada (direção segura; a obrigatoriedade na
-- transição é do trigger, nunca retroativa).
alter table curadoria.area_compatibility_declarations
  add constraint area_declaration_supersession_coherent
    check (superseded_by_declaration is null or superseded_at is not null);

-- A concorrência da vigente é do banco: nunca duas vigentes do mesmo par.
create unique index area_declarations_one_vigente_per_pair
  on curadoria.area_compatibility_declarations (case_id, professional_profile_id)
  where superseded_at is null;

-- A PK composta antiga também servia de índice de leitura por Case.
create index area_declarations_case_idx
  on curadoria.area_compatibility_declarations (case_id, professional_profile_id);

comment on column curadoria.area_compatibility_declarations.superseded_at is
  'Quando esta declaracao deixou de ser a vigente (redeclaracao oficial). NULL = vigente. Linha superada e historico imutavel.';
comment on column curadoria.area_compatibility_declarations.superseded_by_declaration is
  'A declaracao que substituiu esta (redeclare_area_compatibility). Gravada pela propria operacao, no mesmo ato.';

-- ---------------------------------------------------------------------------
-- 2. Trigger de transição — juízo declarado não se reescreve
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_area_declaration_transition()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _redeclaracao_oficial boolean;
  _conteudo_intacto boolean;
begin
  if tg_op = 'INSERT' then
    if new.superseded_at is not null or new.superseded_by_declaration is not null then
      raise exception
        'Declaração de área não nasce histórica: toda declaração nova é a vigente do par.'
        using errcode = '23514';
    end if;
    return new;
  end if;

  -- UPDATE
  _redeclaracao_oficial :=
    current_setting('curadoria.redeclaracao_em_curso', true) = old.id::text;
  _conteudo_intacto :=
    new.compatibility = old.compatibility
    and new.confirmed_by_curator = old.confirmed_by_curator
    and new.rationale is not distinct from old.rationale
    and new.area_text_reviewed is not distinct from old.area_text_reviewed
    and new.case_requirement_reviewed is not distinct from old.case_requirement_reviewed
    and new.declared_by = old.declared_by
    and new.declared_at = old.declared_at
    and new.case_id = old.case_id
    and new.professional_profile_id = old.professional_profile_id;

  -- Linha superada é histórico: o único retoque legítimo é o vínculo com a
  -- sucessora, gravado pela própria operação oficial no mesmo ato.
  if old.superseded_at is not null then
    if _redeclaracao_oficial
       and _conteudo_intacto
       and new.superseded_at = old.superseded_at then
      return new;
    end if;
    raise exception
      'Declaração de área substituída é histórico: ela não muda nem volta. A leitura vigente é a sucessora.'
      using errcode = '23514';
  end if;

  -- Arquivar (superseded_at null -> valor) só dentro da operação oficial,
  -- com o conteúdo declarado intacto.
  if new.superseded_at is not null then
    if _redeclaracao_oficial and _conteudo_intacto then
      return new;
    end if;
    raise exception
      'Arquivar uma declaração de área acontece só pelo caminho oficial (redeclare_area_compatibility), com motivo e autor registrados.'
      using errcode = '42501';
  end if;

  -- Juízo declarado (terminal) não se reescreve em lugar. Exceção única:
  -- confirmar a participação (confirmed_by_curator false -> true) com todo o
  -- resto intacto — completa a decisão prevista no DDL, não reescreve juízo.
  if old.compatibility in ('COMPATIVEL', 'PARCIALMENTE_COMPATIVEL', 'INCOMPATIVEL') then
    if new.compatibility = old.compatibility
       and old.confirmed_by_curator = false
       and new.confirmed_by_curator = true
       and new.rationale is not distinct from old.rationale
       and new.area_text_reviewed is not distinct from old.area_text_reviewed
       and new.case_requirement_reviewed is not distinct from old.case_requirement_reviewed
       and new.declared_by = old.declared_by
       and new.declared_at = old.declared_at
       and new.case_id = old.case_id
       and new.professional_profile_id = old.professional_profile_id then
      return new;
    end if;
    if not _conteudo_intacto then
      raise exception
        'Juízo de área já declarado não se reescreve: corrigir é redeclarar (redeclare_area_compatibility), preservando o histórico.'
        using errcode = '23514';
    end if;
  end if;

  -- INFORMACAO_INSUFICIENTE vigente segue completável em lugar: "ninguém
  -- julgou ainda" vira juízo pela via normal de declaração.
  return new;
end;
$function$;

comment on function curadoria.assert_area_declaration_transition() is
  'Bloco C/Etapa 9 (ADR-048 + R4/R5): juizo de area declarado (COMPATIVEL/PARCIALMENTE_COMPATIVEL/INCOMPATIVEL) nao se reescreve em lugar — correcao e redeclaracao versionada pela RPC oficial (flag transacional curadoria.redeclaracao_em_curso). Excecao unica: flip confirmed_by_curator false->true com o resto intacto. INFORMACAO_INSUFICIENTE vigente segue completavel; linha superada e historico imutavel; declaracao nao nasce historica.';

revoke execute on function curadoria.assert_area_declaration_transition() from public;

drop trigger if exists assert_area_declaration_transition_trigger
  on curadoria.area_compatibility_declarations;
create trigger assert_area_declaration_transition_trigger
  before insert or update on curadoria.area_compatibility_declarations
  for each row execute function curadoria.assert_area_declaration_transition();

-- ---------------------------------------------------------------------------
-- 3. O caminho legítimo único — redeclare_area_compatibility
-- ---------------------------------------------------------------------------

create or replace function curadoria.redeclare_area_compatibility(
  _case_id uuid,
  _professional_profile_id uuid,
  _compatibility text,
  _reason text,
  _confirmed_by_curator boolean default false,
  _rationale text default null,
  _area_text_reviewed text default null,
  _case_requirement_reviewed text default null
)
returns curadoria.area_compatibility_declarations
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _case curadoria.cases;
  _vigente curadoria.area_compatibility_declarations;
  _nova curadoria.area_compatibility_declarations;
  _now timestamptz := now();
begin
  if _actor is null then
    raise exception 'Redeclaração exige ator autenticado' using errcode = '42501';
  end if;

  -- O Case é o eixo de serialização: duas redeclarações em paralelo esperam
  -- aqui, e a segunda enxerga (e supersede) a vigente que a primeira criou.
  select * into _case from curadoria.cases where id = _case_id for update;
  if not found then
    raise exception 'Case % não localizado', _case_id using errcode = 'P0002';
  end if;

  -- Autorização por RELAÇÃO com o objeto (R4): o Curador DESIGNADO deste
  -- Case, ou um administrador — nunca papel puro.
  if not (curadoria.has_role('administrador') or _case.assigned_curator_id = _actor) then
    raise exception
      'Só o Curador responsável pelo Case (ou um administrador) redeclara a área'
      using errcode = '42501';
  end if;

  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A redeclaração exige o motivo da correção' using errcode = '23514';
  end if;

  select * into _vigente
    from curadoria.area_compatibility_declarations
   where case_id = _case_id
     and professional_profile_id = _professional_profile_id
     and superseded_at is null
   for update;
  if not found then
    raise exception
      'Nenhuma declaração vigente deste par para redeclarar — a primeira declaração é pela via normal.'
      using errcode = 'P0002';
  end if;

  -- Arquiva + nova vigente + vínculo + auditoria: um único ato transacional.
  perform set_config('curadoria.redeclaracao_em_curso', _vigente.id::text, true);

  update curadoria.area_compatibility_declarations
     set superseded_at = _now
   where id = _vigente.id;

  -- A nova vigente nasce do ato: autor e carimbo são de quem redeclarou.
  -- CHECKs de conteúdo da tabela (justificativa de PARCIAL/INCOMPATIVEL)
  -- valem aqui como em qualquer declaração.
  insert into curadoria.area_compatibility_declarations
    (case_id, professional_profile_id, compatibility, confirmed_by_curator,
     rationale, area_text_reviewed, case_requirement_reviewed, declared_by, declared_at)
  values
    (_case_id, _professional_profile_id, _compatibility, coalesce(_confirmed_by_curator, false),
     _rationale, _area_text_reviewed, _case_requirement_reviewed, _actor, _now)
  returning * into _nova;

  update curadoria.area_compatibility_declarations
     set superseded_by_declaration = _nova.id
   where id = _vigente.id;

  perform set_config('curadoria.redeclaracao_em_curso', '', true);

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (_actor, 'area_redeclared', _case.patient_profile_id,
          jsonb_build_object(
            'case_id', _case.id,
            'professional_profile_id', _professional_profile_id,
            'superseded_declaration_id', _vigente.id,
            'new_declaration_id', _nova.id,
            'old_compatibility', _vigente.compatibility,
            'new_compatibility', _nova.compatibility,
            'reason', btrim(_reason),
            'redeclared_at', _now));

  return _nova;
end;
$function$;

comment on function curadoria.redeclare_area_compatibility(uuid, uuid, text, text, boolean, text, text, text) is
  'Redeclaracao oficial de compatibilidade de area (Bloco C/Etapa 9). Ator por auth.uid(); exige Curador designado do Case ou administrador (R4) e motivo; FOR UPDATE no Case (serializacao) e na vigente; arquiva a vigente (superseded_at/by, conteudo intacto), insere a nova vigente e grava audit area_redeclared na mesma transacao. Cada chamada e um ato: em paralelo, as redeclaracoes encadeiam — sempre exatamente uma vigente por par.';

revoke execute on function curadoria.redeclare_area_compatibility(uuid, uuid, text, text, boolean, text, text, text) from public;
grant execute on function curadoria.redeclare_area_compatibility(uuid, uuid, text, text, boolean, text, text, text) to authenticated;
