-- ============================================================================
-- BLOCO C / ETAPA 8 — REMOÇÃO DE COMPETÊNCIAS SÓ COM AUTOR E MOTIVO
-- ============================================================================
--
-- FINALIDADE
--   O Bloco B fechou o apagamento IMPLÍCITO por código (gate B15: lista vazia
--   = no-op; esvaziar exige `esvaziamentoExplicito`) — mas a defesa era só de
--   servidor: um DELETE em massa via PostgREST, com sessão real de
--   administrador, ainda esvaziava as competências de um perfil PUBLICADO em
--   silêncio (o desastre dos 158-a-zero, repetível por outra porta). E o
--   próprio `esvaziamentoExplicito` era cosmético (achado C6 do B.5): um
--   flag booleano sem autor nomeado, sem motivo, sem trilha.
--
--   Duas peças, mesma direção (ADR-048/064):
--
--   1. DEFESA DE BANCO `assert_competency_removal_explicit` — trigger de
--      STATEMENT (transition table): um DELETE de sessão de usuário que
--      deixe um perfil PUBLICADO com ZERO competências é recusado, salvo
--      dentro da operação oficial (flag transacional). A EDIÇÃO LEGÍTIMA NÃO
--      VIRA IMUTÁVEL, por desenho: o padrão patch do B (aditivo primeiro,
--      subtrativo depois) nunca zera o conjunto — todo delete parcial passa.
--      Bastidor (auth.uid() nulo — limpeza por inventário, fixtures) passa;
--      cascata de remoção do perfil passa (o perfil já saiu — mesma passagem
--      documentada em 20260802157000/158000).
--
--   2. RPC `remove_professional_competencies(_professional_profile_id,
--      _reason)` — o caminho legítimo único do esvaziamento, padrão B
--      (M150/M156): ator por auth.uid() com papel administrador (o papel que
--      edita competências, policy da stage 2) ou bastidor service_role;
--      motivo obrigatório; FOR UPDATE no perfil; remove sob o flag e grava
--      audit `competencies_removed_explicit` com autor, motivo e a LISTA do
--      que saiu — nunca mais um esvaziamento anônimo.
--
--   IDEMPOTÊNCIA (decisão documentada): repetir sobre perfil já vazio é
--   no-op — devolve 0 e NÃO grava segunda trilha (nada foi removido; trilha
--   sem ato seria ruído de auditoria). A primeira execução leva a lista
--   completa na metadata.
--
--   `esvaziamentoExplicito` do repositório
--   (src/modules/profiles/professional-repository.ts) passa a DELEGAR para a
--   RPC, com motivo obrigatório — fecha o C6-cosmético sem superfície nova.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.professional_competency_areas` (stage 2) com policy de
--     escrita admin-only; `curadoria.professional_profiles` com
--     publication_status; `curadoria.has_role`; `curadoria.audit_logs`.
--   - PostgreSQL >= 10 (transition tables) — local em 17.
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada.
--   - Os 158 profissionais publicados SEM competência nenhuma (dado sujo
--     conhecido) são estado parado: o trigger examina só DELETEs futuros, e
--     um perfil que já está vazio nem tem o que deletar. A RPC sobre eles é
--     no-op documentado.
--
-- PROVA DE FECHAMENTO
--   - Gate novo (imutabilidade-frente2): DELETE em massa via PostgREST com
--     sessão real de administrador sobre perfil publicado é recusado e nada
--     some; a RPC com motivo remove e deixa competencies_removed_explicit
--     com autor + motivo + lista; sem motivo é recusada; papel sem direito
--     (curador) e anon são recusados.
--   - Gate B15 continua verde: a semântica de patch não zera conjunto — a
--     defesa nunca dispara no caminho legítimo.
--   - tests/integration/professional-profile.integration.test.ts (o teste do
--     esvaziamento explícito) ajustado para o novo contrato: motivo
--     obrigatório no esvaziamento — ampliação estrita do cenário, não
--     afrouxamento.
--
-- ROLLBACK
--   drop function if exists curadoria.remove_professional_competencies(uuid, text);
--   drop trigger if exists assert_competency_removal_explicit_trigger
--     on curadoria.professional_competency_areas;
--   drop function if exists curadoria.assert_competency_removal_explicit();
--   -- O valor 'competencies_removed_explicit' em curadoria.audit_action não
--   -- é removível sem recriar o tipo; inofensivo sem uso (resíduo aceito).
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'competencies_removed_explicit';

-- ---------------------------------------------------------------------------
-- 1. Defesa de banco — esvaziar perfil publicado exige contexto explícito
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_competency_removal_explicit()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _prof record;
begin
  -- Bastidor (service_role/limpeza por inventário): sem sessão de usuário,
  -- sem juízo — mesma passagem de 20260802158000.
  if auth.uid() is null then
    return null;
  end if;

  for _prof in
    select distinct professional_profile_id as id from linhas_removidas
  loop
    -- Dentro da operação oficial, a remoção total é o próprio ato.
    if current_setting('curadoria.remocao_de_competencias_em_curso', true) = _prof.id::text then
      continue;
    end if;

    -- Cascata (perfil já removido): a consulta não encontra o pai e as
    -- linhas caem junto, como nos demais gabaritos do Bloco C.
    if exists (
         select 1 from curadoria.professional_profiles pp
          where pp.id = _prof.id and pp.publication_status = 'publicado'
       )
       and not exists (
         select 1 from curadoria.professional_competency_areas a
          where a.professional_profile_id = _prof.id
       ) then
      raise exception
        'Remover TODAS as competências de um profissional publicado exige o ato explícito com autor e motivo (remove_professional_competencies). Edição de áreas continua livre — o que não existe é esvaziamento silencioso.'
        using errcode = '23514';
    end if;
  end loop;

  return null;
end;
$function$;

comment on function curadoria.assert_competency_removal_explicit() is
  'Bloco C/Etapa 8 (ADR-048/064): DELETE de sessao de usuario que deixe um perfil PUBLICADO com zero competencias e recusado fora da operacao oficial (flag curadoria.remocao_de_competencias_em_curso). Deletes parciais (padrao patch do B) passam sempre; bastidor sem auth.uid() e cascata do perfil passam. Edicao legitima nunca vira imutavel.';

revoke execute on function curadoria.assert_competency_removal_explicit() from public;

drop trigger if exists assert_competency_removal_explicit_trigger
  on curadoria.professional_competency_areas;
create trigger assert_competency_removal_explicit_trigger
  after delete on curadoria.professional_competency_areas
  referencing old table as linhas_removidas
  for each statement execute function curadoria.assert_competency_removal_explicit();

-- ---------------------------------------------------------------------------
-- 2. O caminho legítimo único — remove_professional_competencies
-- ---------------------------------------------------------------------------

create or replace function curadoria.remove_professional_competencies(
  _professional_profile_id uuid,
  _reason text
)
returns integer
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _profile curadoria.professional_profiles;
  _removidas text[];
  _quantidade integer;
begin
  -- Autor: administrador (o papel que edita competências — policy da stage
  -- 2) ou o bastidor service_role. Nunca papel qualquer, nunca anon.
  if _actor is null then
    if coalesce(auth.role(), '') <> 'service_role' then
      raise exception 'Remoção de competências exige ator autenticado' using errcode = '42501';
    end if;
  elsif not curadoria.has_role('administrador') then
    raise exception 'Só um administrador remove todas as competências de um profissional'
      using errcode = '42501';
  end if;

  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A remoção explícita exige o motivo' using errcode = '23514';
  end if;

  select * into _profile
    from curadoria.professional_profiles
   where id = _professional_profile_id
   for update;
  if not found then
    raise exception 'Profissional % não localizado', _professional_profile_id
      using errcode = 'P0002';
  end if;

  select array_agg(a.domain || '/' || a.focus order by a.domain, a.focus)
    into _removidas
    from curadoria.professional_competency_areas a
   where a.professional_profile_id = _profile.id;

  -- Idempotência documentada: perfil já vazio => no-op, sem segunda trilha
  -- (trilha registra ATO; aqui não houve ato nenhum).
  if _removidas is null then
    return 0;
  end if;

  perform set_config('curadoria.remocao_de_competencias_em_curso', _profile.id::text, true);

  delete from curadoria.professional_competency_areas
   where professional_profile_id = _profile.id;
  get diagnostics _quantidade = row_count;

  perform set_config('curadoria.remocao_de_competencias_em_curso', '', true);

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (_actor, 'competencies_removed_explicit', _profile.profile_id,
          jsonb_build_object(
            'professional_profile_id', _profile.id,
            'publication_status', _profile.publication_status,
            'removed', to_jsonb(_removidas),
            'reason', btrim(_reason)));

  return _quantidade;
end;
$function$;

comment on function curadoria.remove_professional_competencies(uuid, text) is
  'Remocao explicita de TODAS as competencias de um profissional (Bloco C/Etapa 8, ADR-064). Ator por auth.uid() com papel administrador (ou bastidor service_role); motivo obrigatorio; FOR UPDATE no perfil; remove sob o flag da defesa de banco e grava audit competencies_removed_explicit com autor, motivo e a lista removida. Perfil ja vazio = no-op (retorna 0, sem segunda trilha).';

revoke execute on function curadoria.remove_professional_competencies(uuid, text) from public;
grant execute on function curadoria.remove_professional_competencies(uuid, text) to authenticated, service_role;
