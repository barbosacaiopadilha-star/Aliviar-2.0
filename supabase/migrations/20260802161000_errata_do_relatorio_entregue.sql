-- ============================================================================
-- BLOCO C / ETAPA 6 — ERRATA: O CAMINHO LEGÍTIMO DA CORREÇÃO PÓS-ENTREGA
-- (ADR-050, modelo mínimo)
-- ============================================================================
--
-- FINALIDADE
--   Com 20260802160000, o Relatório emitido/entregue virou documento
--   congelado de verdade — e imutabilidade sem caminho de correção é uma
--   armadilha: erro real descoberto depois da entrega precisaria de gambiarra
--   ou ficaria eterno. A ERRATA é esse caminho (ADR-050): um documento NOVO,
--   versionado, vinculado ao Relatório original — que permanece byte-intacto,
--   porque é o que a paciente viu.
--
--   DESENHO MÍNIMO ESCOLHIDO (e por quê): tabela `curadoria_report_erratas`
--   com linha versionada por Relatório — report_id + version + reason (NOT
--   NULL) + author + content jsonb + created_at. Entre as duas alternativas
--   aditivas ("content jsonb mínimo" vs "referência a um novo Relatório
--   inteiro"), o jsonb é o mínimo que dá caminho legítimo: uma errata corrige
--   PONTOS de um documento que continua valendo; duplicar o Relatório inteiro
--   criaria dois documentos concorrentes pela mesma seleção (o índice
--   one_per_selection existe exatamente para impedir isso) e reabriria a
--   pergunta "qual dos dois a paciente viu". O formato interno do jsonb fica
--   com a superfície futura (Bloco F); o banco garante o que é estrutural:
--   vínculo, versão, motivo, autor e imutabilidade.
--
--   RPC `create_report_errata(_report_id, _reason, _content)` — padrão B
--   (gabarito deliver_curadoria/M150 e supersede_priority_profile/M156):
--   ator por auth.uid(); autorização por RELAÇÃO (Curador designado do Case
--   do Relatório, ou administrador — R4); exige Relatório ENTREGUE; FOR
--   UPDATE no Relatório serializa o número de versão; original intocado (a
--   RPC só INSERE); audit `report_errata_created` no mesmo ato.
--
--   IDEMPOTÊNCIA (decisão documentada, alternativa à recusa): cada chamada
--   cria uma NOVA errata numerada — errata é ATO de correção (documento
--   emitido), não estado convergível. Repetir a chamada produz a versão
--   seguinte, visível e auditada; nada é sobrescrito nem deduplicado em
--   silêncio. É o mesmo contrato de um documento com numeração oficial:
--   emitir duas vezes são duas erratas, e o histórico mostra as duas.
--
--   A PRÓPRIA ERRATA É IMUTÁVEL: UPDATE recusado para qualquer sessão;
--   DELETE recusado para sessão de usuário com o Relatório vivo (bastidor
--   auth.uid() nulo e cascata do descarte passam — mesmas duas passagens
--   documentadas em 20260802157000/158000). Corrigir uma errata é emitir a
--   próxima.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.curadoria_reports` congelado por 20260802160000 (esta
--     migration depende daquele congelamento para a frase "original
--     intacto" ser garantia de banco, não promessa de código).
--   - `curadoria.has_role`, `curadoria.is_curator_for_case`,
--     `curadoria.is_patient_for_case`, `curadoria.audit_logs` existentes.
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Tabela nova, nasce vazia. Nenhuma linha existente é tocada.
--   - Cascata: a errata morre com o Relatório (on delete cascade) — no
--     descarte administrativo do Case, tudo cai junto, como os demais
--     artefatos da Curadoria.
--
-- PROVA DE FECHAMENTO
--   - Gates novos (tests/remediacao/imutabilidade-frente2.integration.test.ts):
--     errata válida criada pelo Curador designado sobre Relatório ENTREGUE,
--     com versão 1 e depois 2; original byte-intacto (todas as colunas);
--     autoria + motivo gravados; recusa para Relatório não-entregue; recusa
--     para curador não-atribuído, paciente e anon; INSERT/UPDATE/DELETE
--     diretos via PostgREST recusados; trilha report_errata_created presente
--     e sem conteúdo clínico.
--
-- ROLLBACK
--   drop function if exists curadoria.create_report_errata(uuid, text, jsonb);
--   drop trigger if exists assert_report_errata_immutable_trigger
--     on curadoria.curadoria_report_erratas;
--   drop function if exists curadoria.assert_report_errata_immutable();
--   drop table if exists curadoria.curadoria_report_erratas;
--   -- O valor 'report_errata_created' em curadoria.audit_action não é
--   -- removível sem recriar o tipo; inofensivo sem uso (resíduo aceito).
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'report_errata_created';

-- ---------------------------------------------------------------------------
-- 1. A tabela — nova linha versionada, vinculada ao Relatório original
-- ---------------------------------------------------------------------------

create table curadoria.curadoria_report_erratas (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references curadoria.curadoria_reports (id) on delete cascade,
  version integer not null check (version >= 1),
  reason text not null,
  content jsonb not null default '{}'::jsonb,
  author_id uuid not null references curadoria.profiles (id),
  created_at timestamptz not null default now(),

  constraint report_errata_reason_not_blank check (btrim(reason) <> ''),
  constraint report_errata_version_unique unique (report_id, version)
);

comment on table curadoria.curadoria_report_erratas is
  'Errata de Relatorio entregue (ADR-050/Bloco C). Documento NOVO, versionado por report_id, com motivo e autor obrigatorios — o Relatorio original permanece intacto (congelado por 20260802160000). Nasce apenas pela RPC create_report_errata; a propria errata e imutavel: corrigir uma errata e emitir a proxima.';
comment on column curadoria.curadoria_report_erratas.content is
  'Conteudo minimo da correcao (jsonb). O formato interno pertence a superficie (Bloco F); o banco garante vinculo, versao, motivo, autor e imutabilidade.';

alter table curadoria.curadoria_report_erratas enable row level security;

grant select on curadoria.curadoria_report_erratas to authenticated;
grant all on curadoria.curadoria_report_erratas to service_role;

-- Leitura espelha o Relatório: quem conduz o Case (e o administrador) lê;
-- a paciente do Case lê — a errata só existe para Relatório que ela recebeu.
create policy "report_erratas_select_curator" on curadoria.curadoria_report_erratas
  for select to authenticated
  using (
    curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.curadoria_reports r
       where r.id = curadoria_report_erratas.report_id
         and curadoria.is_curator_for_case(r.case_id)
    )
  );

create policy "report_erratas_select_patient" on curadoria.curadoria_report_erratas
  for select to authenticated
  using (
    exists (
      select 1 from curadoria.curadoria_reports r
       where r.id = curadoria_report_erratas.report_id
         and curadoria.is_patient_for_case(r.case_id)
    )
  );

-- Nenhuma policy de escrita, de propósito: sem grant de INSERT/UPDATE/DELETE
-- para authenticated, o único caminho de escrita é a RPC (security definer).

-- ---------------------------------------------------------------------------
-- 2. Errata é imutável — corrigir uma errata é emitir a próxima
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_report_errata_immutable()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
begin
  if tg_op = 'UPDATE' then
    raise exception
      'Errata e documento emitido: ela nao se edita. Corrigir uma errata e criar a proxima (create_report_errata).'
      using errcode = '23514';
  end if;

  -- DELETE: recusado para sessão de usuário com o Relatório vivo; bastidor
  -- (auth.uid() nulo — limpeza por inventário) e cascata (Relatório já
  -- removido) passam — mesmas duas passagens de 20260802157000/158000.
  if old.id is not null
     and auth.uid() is not null
     and exists (select 1 from curadoria.curadoria_reports r where r.id = old.report_id) then
    raise exception
      'Errata emitida e fato: a linha nao e apagavel.'
      using errcode = '23514';
  end if;
  return old;
end;
$function$;

revoke execute on function curadoria.assert_report_errata_immutable() from public;

drop trigger if exists assert_report_errata_immutable_trigger
  on curadoria.curadoria_report_erratas;
create trigger assert_report_errata_immutable_trigger
  before update or delete on curadoria.curadoria_report_erratas
  for each row execute function curadoria.assert_report_errata_immutable();

-- ---------------------------------------------------------------------------
-- 3. O caminho legítimo único — create_report_errata
-- ---------------------------------------------------------------------------

create or replace function curadoria.create_report_errata(
  _report_id uuid,
  _reason text,
  _content jsonb default '{}'::jsonb
)
returns curadoria.curadoria_report_erratas
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _report curadoria.curadoria_reports;
  _case curadoria.cases;
  _errata curadoria.curadoria_report_erratas;
  _version integer;
begin
  if _actor is null then
    raise exception 'Errata exige ator autenticado' using errcode = '42501';
  end if;

  -- FOR UPDATE no Relatório: serializa a numeração da versão — duas erratas
  -- em paralelo saem 1 e 2, nunca duas "1".
  select * into _report
    from curadoria.curadoria_reports
   where id = _report_id
   for update;
  if not found then
    raise exception 'Relatório % não localizado', _report_id using errcode = 'P0002';
  end if;

  select * into _case from curadoria.cases where id = _report.case_id;
  if not found then
    raise exception 'Case % não localizado', _report.case_id using errcode = 'P0002';
  end if;

  -- Autorização por RELAÇÃO com o objeto (R4): o Curador DESIGNADO deste
  -- Case, ou um administrador — nunca papel puro.
  if not (curadoria.has_role('administrador') or _case.assigned_curator_id = _actor) then
    raise exception
      'Só o Curador responsável pelo Case (ou um administrador) emite errata do Relatório'
      using errcode = '42501';
  end if;

  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A errata exige o motivo da correção' using errcode = '23514';
  end if;

  -- Errata é correção de documento ENTREGUE. Antes da entrega não existe o
  -- que corrigir por errata: o documento ainda não chegou à paciente.
  if _report.delivered_at is null then
    raise exception
      'Errata só existe para Relatório entregue. Antes da entrega, o caminho é revisar e reemitir o documento.'
      using errcode = '23514';
  end if;

  select coalesce(max(version), 0) + 1 into _version
    from curadoria.curadoria_report_erratas
   where report_id = _report.id;

  -- O ato: só INSERT — o Relatório original não é tocado (e o congelamento
  -- de 20260802160000 garante isso contra qualquer regressão futura daqui).
  insert into curadoria.curadoria_report_erratas (report_id, version, reason, content, author_id)
  values (_report.id, _version, btrim(_reason), coalesce(_content, '{}'::jsonb), _actor)
  returning * into _errata;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (_actor, 'report_errata_created', _case.patient_profile_id,
          jsonb_build_object(
            'report_id', _report.id,
            'case_id', _case.id,
            'errata_id', _errata.id,
            'version', _version,
            'reason', btrim(_reason)));

  return _errata;
end;
$function$;

comment on function curadoria.create_report_errata(uuid, text, jsonb) is
  'Errata oficial do Relatorio entregue (ADR-050/Bloco C). Ator por auth.uid(); exige Curador designado do Case ou administrador (R4); exige Relatorio ENTREGUE e motivo; FOR UPDATE no Relatorio serializa a versao; so INSERE (original intacto) e grava audit report_errata_created no mesmo ato. Cada chamada e um ato novo: gera a proxima versao, visivel e auditada — nunca sobrescreve nem deduplica em silencio.';

revoke execute on function curadoria.create_report_errata(uuid, text, jsonb) from public;
grant execute on function curadoria.create_report_errata(uuid, text, jsonb) to authenticated;
