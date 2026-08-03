-- ============================================================================
-- BLOCO C / ETAPA 3 — PERFIL RECONHECIDO É IMUTÁVEL; CORRIGIR É SUPERSESSÃO
-- (gates C3 e C10)
-- ============================================================================
--
-- FINALIDADE
--   O Perfil de Prioridades VALIDATED é o primeiro patrimônio construído em
--   conjunto com a paciente — e hoje o objeto vigente não tem proteção
--   nenhuma: a policy FOR ALL do Curador permitia VALIDATED -> DRAFT com
--   `validated_at = null` (a CHECK aceita o par), apagando o fato do
--   reconhecimento. E não existia NENHUM caminho para a correção legítima:
--   o índice `priority_profiles_one_active_per_case` sabia só bloquear o
--   segundo Perfil ativo.
--
--   Duas peças, na mesma direção (ADR-048/049):
--
--   1. TRIGGER DE TRANSIÇÃO `assert_priority_profile_transition`:
--      - VALIDATED nunca regride para DRAFT e nunca é editado;
--      - VALIDATED -> SUPERSEDED só dentro da operação oficial (flag de
--        transação `curadoria.supersessao_em_curso`), com carimbo, motivo e
--        autor obrigatórios e com o conteúdo reconhecido intacto;
--      - SUPERSEDED é histórico: não muda nem volta (exceto o vínculo
--        `superseded_by` gravado pela própria operação, no mesmo ato).
--
--   2. RPC `curadoria.supersede_priority_profile(_case_id, _reason)` — o
--      caminho legítimo único, no padrão da casa (deliver_curadoria/M150):
--      ator por auth.uid(); autorização por RELAÇÃO com o Case (Curador
--      designado ou administrador — R4 do B.5); FOR UPDATE no Case e no
--      Perfil ativo; transição + sucessor DRAFT + vínculo + auditoria na
--      MESMA transação.
--
--   DESENHO DO VÍNCULO (mínimo aditivo): quatro colunas novas na PRÓPRIA
--   linha superada — superseded_at, superseded_reason, superseded_actor_id e
--   superseded_by (aponta o sucessor). O sucessor é identificável sem coluna
--   própria: é o Perfil ativo apontado por um anterior via superseded_by.
--
--   IDEMPOTÊNCIA (decisão documentada): repetir a supersessão enquanto o
--   sucessor DRAFT está vivo devolve O MESMO sucessor — nunca cria segundo,
--   nunca erro. É o mesmo contrato de deliver_curadoria: repetir o ato
--   devolve o resultado do ato. Duas chamadas em paralelo serializam no
--   FOR UPDATE do Case: uma supersede, a outra encontra o sucessor e o
--   devolve. Supersessão de Perfil ainda DRAFT (nunca reconhecido) é recusa
--   explícita: rascunho se edita, não se supersede.
--
--   ÍNDICE DE UNICIDADE: `priority_profiles_one_active_per_case` tem
--   predicado `status <> 'SUPERSEDED'` (stage 7, linha 32) — o Perfil
--   superado SAI do predicado e o sucessor entra no lugar. Nenhum ajuste
--   necessário; verificado na definição original.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.priority_profiles` (stage 7) com CHECK
--     `priority_profile_validation_coherent` = ((status='VALIDATED') =
--     (validated_at is not null)). Essa igualdade bidirecional FORÇARIA a
--     supersessão a apagar `validated_at` — destruindo o carimbo histórico.
--     A CHECK é substituída por uma equivalente para DRAFT/VALIDATED que
--     LIBERA o carimbo no SUPERSEDED (ver corpo).
--   - `curadoria.has_role`, `curadoria.audit_logs` (stage 1) existentes.
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Colunas novas nascem NULL em todas as linhas — aditivo puro.
--   - CHECK substituída é equivalente para todos os pares hoje possíveis
--     (verificado na stack local em 2026-08-02: 15 VALIDATED com validated_at
--     preenchido, 2 DRAFT com validated_at nulo, 0 SUPERSEDED); linhas
--     SUPERSEDED legadas de outros ambientes (validated_at nulo pela CHECK
--     antiga) também passam na nova. Nenhuma linha é tocada.
--   - A CHECK nova de carimbo (`priority_profile_supersession_stamps`) só
--     exige coerência na DIREÇÃO segura: carimbos de supersessão apenas em
--     linha SUPERSEDED. Linhas SUPERSEDED legadas SEM carimbo continuam
--     válidas — a obrigatoriedade dos carimbos é do trigger, na transição
--     futura, nunca retroativa.
--
-- PROVA DE FECHAMENTO
--   - Gate C3: Curador com sessão real tenta VALIDATED -> DRAFT +
--     validated_at nulo; o banco recusa e o carimbo sobrevive.
--   - Gate C10: `supersede_priority_profile` marca o anterior SUPERSEDED e
--     devolve o sucessor DRAFT; exatamente um Perfil ativo depois do ato.
--   - Gates novos da Frente 1 (imutabilidade-frente1): idempotência,
--     concorrência (2 chamadas paralelas => 1 sucessor), autorização por
--     relação (curador não-atribuído recusado), motivo obrigatório,
--     auditoria profile_superseded.
--
-- ROLLBACK
--   drop function if exists curadoria.supersede_priority_profile(uuid, text);
--   drop trigger if exists assert_priority_profile_transition_trigger
--     on curadoria.priority_profiles;
--   drop function if exists curadoria.assert_priority_profile_transition();
--   drop index if exists curadoria.priority_profiles_superseded_by_idx;
--   alter table curadoria.priority_profiles
--     drop constraint if exists priority_profile_supersession_stamps;
--   alter table curadoria.priority_profiles
--     drop constraint if exists priority_profile_validation_coherent;
--   alter table curadoria.priority_profiles
--     add constraint priority_profile_validation_coherent
--     check ((status = 'VALIDATED') = (validated_at is not null));
--   -- (o add acima só recola se nenhum SUPERSEDED novo tiver mantido o
--   --  validated_at; caso contrário, anule validated_at dessas linhas antes)
--   alter table curadoria.priority_profiles
--     drop column if exists superseded_by,
--     drop column if exists superseded_actor_id,
--     drop column if exists superseded_reason,
--     drop column if exists superseded_at;
--   -- O valor 'profile_superseded' em curadoria.audit_action não é removível
--   -- sem recriar o tipo; inofensivo sem uso (mesmo resíduo aceito de M150).
-- ============================================================================

alter type curadoria.audit_action add value if not exists 'profile_superseded';

-- ---------------------------------------------------------------------------
-- 1. O vínculo da supersessão — quatro colunas na linha superada
-- ---------------------------------------------------------------------------

alter table curadoria.priority_profiles
  add column superseded_at timestamptz,
  add column superseded_reason text,
  add column superseded_actor_id uuid references curadoria.profiles (id),
  add column superseded_by uuid references curadoria.priority_profiles (id);

comment on column curadoria.priority_profiles.superseded_by is
  'O sucessor desta linha (ADR-049). Preenchido pela supersessão oficial, no mesmo ato que a transição para SUPERSEDED.';
comment on column curadoria.priority_profiles.superseded_reason is
  'Motivo declarado da nova rodada. Supersessão sem motivo não existe (trigger).';

create index priority_profiles_superseded_by_idx
  on curadoria.priority_profiles (superseded_by)
  where superseded_by is not null;

-- Carimbo de validação sobrevive à supersessão: a CHECK antiga (igualdade
-- bidirecional) obrigaria a apagar validated_at ao superseder.
alter table curadoria.priority_profiles
  drop constraint priority_profile_validation_coherent;
alter table curadoria.priority_profiles
  add constraint priority_profile_validation_coherent check (
    case status
      when 'VALIDATED' then validated_at is not null
      when 'DRAFT' then validated_at is null
      else true
    end
  );

-- Carimbos de supersessão só existem em linha SUPERSEDED (direção segura;
-- a obrigatoriedade na transição é do trigger, nunca retroativa).
alter table curadoria.priority_profiles
  add constraint priority_profile_supersession_stamps check (
    status = 'SUPERSEDED'
    or (superseded_at is null
        and superseded_reason is null
        and superseded_actor_id is null
        and superseded_by is null)
  );

-- ---------------------------------------------------------------------------
-- 2. Trigger de transição — VALIDATED não regride, SUPERSEDED é histórico
-- ---------------------------------------------------------------------------

create or replace function curadoria.assert_priority_profile_transition()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _supersessao_oficial boolean :=
    current_setting('curadoria.supersessao_em_curso', true) = old.id::text;
begin
  if old.status = 'SUPERSEDED' then
    -- O único retoque legítimo é o vínculo superseded_by, gravado pela
    -- própria operação oficial no mesmo ato da transição.
    if _supersessao_oficial and new.status = 'SUPERSEDED' then
      return new;
    end if;
    raise exception
      'Perfil substituído é histórico: ele não muda nem volta. O Perfil vigente é o sucessor.'
      using errcode = '23514';
  end if;

  if old.status = 'VALIDATED' then
    if new.status = 'DRAFT' then
      raise exception
        'Perfil reconhecido pela paciente não regride: corrigir é abrir nova rodada pela supersessão oficial (supersede_priority_profile).'
        using errcode = '23514';
    end if;

    if new.status = 'SUPERSEDED' then
      if not _supersessao_oficial then
        raise exception
          'A supersessão do Perfil acontece só pelo caminho oficial (supersede_priority_profile), com motivo e autor registrados.'
          using errcode = '42501';
      end if;
      if new.superseded_at is null
         or coalesce(btrim(new.superseded_reason), '') = ''
         or new.superseded_actor_id is null then
        raise exception
          'Supersessão sem carimbo, motivo e autor não existe.'
          using errcode = '23514';
      end if;
      if new.patient_history is distinct from old.patient_history
         or new.validated_at is distinct from old.validated_at
         or new.validation_note is distinct from old.validation_note
         or new.curator_id is distinct from old.curator_id
         or new.case_id is distinct from old.case_id
         or new.created_at is distinct from old.created_at then
        raise exception
          'A supersessão preserva o Perfil anterior intacto — o conteúdo reconhecido não muda ao virar histórico.'
          using errcode = '23514';
      end if;
      return new;
    end if;

    -- VALIDATED -> VALIDATED: nada do reconhecido muda.
    if new.patient_history is distinct from old.patient_history
       or new.validated_at is distinct from old.validated_at
       or new.validation_note is distinct from old.validation_note
       or new.curator_id is distinct from old.curator_id
       or new.case_id is distinct from old.case_id
       or new.created_at is distinct from old.created_at
       or new.superseded_at is distinct from old.superseded_at
       or new.superseded_reason is distinct from old.superseded_reason
       or new.superseded_actor_id is distinct from old.superseded_actor_id
       or new.superseded_by is distinct from old.superseded_by then
      raise exception
        'Este Perfil de Prioridades já foi reconhecido pela paciente e não pode mais ser alterado. Corrigir é supersessão (supersede_priority_profile).'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;

comment on function curadoria.assert_priority_profile_transition() is
  'Bloco C/C3 (ADR-048/049): Perfil VALIDATED nunca regride nem é editado; a única saída é SUPERSEDED, dentro da operação oficial (flag transacional curadoria.supersessao_em_curso), com carimbo/motivo/autor e conteúdo intacto. SUPERSEDED é histórico imutável. DRAFT segue livre (edição do Curador e reconhecimento da paciente).';

revoke execute on function curadoria.assert_priority_profile_transition() from public;

drop trigger if exists assert_priority_profile_transition_trigger
  on curadoria.priority_profiles;
create trigger assert_priority_profile_transition_trigger
  before update on curadoria.priority_profiles
  for each row execute function curadoria.assert_priority_profile_transition();

-- ---------------------------------------------------------------------------
-- 3. O caminho legítimo único — supersede_priority_profile
-- ---------------------------------------------------------------------------

create or replace function curadoria.supersede_priority_profile(_case_id uuid, _reason text)
returns curadoria.priority_profiles
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _case curadoria.cases;
  _ativo curadoria.priority_profiles;
  _novo curadoria.priority_profiles;
  _now timestamptz := now();
begin
  if _actor is null then
    raise exception 'Supersessão exige ator autenticado' using errcode = '42501';
  end if;

  -- O Case é o eixo de serialização: duas supersessões em paralelo esperam
  -- aqui, e a segunda enxerga o mundo já superado.
  select * into _case from curadoria.cases where id = _case_id for update;
  if not found then
    raise exception 'Case % não localizado', _case_id using errcode = 'P0002';
  end if;

  -- Autorização por RELAÇÃO com o objeto (R4): o Curador DESIGNADO deste
  -- Case, ou um administrador — nunca papel puro.
  if not (curadoria.has_role('administrador') or _case.assigned_curator_id = _actor) then
    raise exception
      'Só o Curador responsável pelo Case (ou um administrador) abre nova rodada do Perfil'
      using errcode = '42501';
  end if;

  if coalesce(btrim(_reason), '') = '' then
    raise exception 'A supersessão exige o motivo da nova rodada' using errcode = '23514';
  end if;

  select * into _ativo
    from curadoria.priority_profiles
   where case_id = _case_id and status <> 'SUPERSEDED'
   for update;
  if not found then
    raise exception 'Nenhum Perfil ativo neste Case para superseder' using errcode = 'P0002';
  end if;

  if _ativo.status = 'DRAFT' then
    -- Idempotência: se o ativo é o sucessor DRAFT de uma supersessão já
    -- feita, repetir o ato devolve O MESMO sucessor (contrato documentado).
    if exists (
      select 1 from curadoria.priority_profiles p where p.superseded_by = _ativo.id
    ) then
      return _ativo;
    end if;
    raise exception
      'O Perfil ativo ainda é rascunho: rascunho se edita, não se supersede. A supersessão substitui um Perfil reconhecido (VALIDATED).'
      using errcode = '23514';
  end if;

  -- Transição + sucessor + vínculo + auditoria: um único ato transacional.
  perform set_config('curadoria.supersessao_em_curso', _ativo.id::text, true);

  update curadoria.priority_profiles
     set status = 'SUPERSEDED',
         superseded_at = _now,
         superseded_reason = btrim(_reason),
         superseded_actor_id = _actor
   where id = _ativo.id;

  -- O sucessor herda o histórico da paciente (patrimônio que continua) e
  -- nasce DRAFT, do Curador designado — a nova rodada recomeça o
  -- reconhecimento, nunca o reaproveita.
  insert into curadoria.priority_profiles (case_id, curator_id, status, patient_history)
  values (_case_id, coalesce(_case.assigned_curator_id, _actor), 'DRAFT', _ativo.patient_history)
  returning * into _novo;

  update curadoria.priority_profiles
     set superseded_by = _novo.id
   where id = _ativo.id;

  perform set_config('curadoria.supersessao_em_curso', '', true);

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (_actor, 'profile_superseded', _case.patient_profile_id,
          jsonb_build_object(
            'case_id', _case.id,
            'superseded_profile_id', _ativo.id,
            'successor_profile_id', _novo.id,
            'reason', btrim(_reason),
            'superseded_at', _now));

  return _novo;
end;
$function$;

comment on function curadoria.supersede_priority_profile(uuid, text) is
  'Supersessão oficial do Perfil de Prioridades (Bloco C/ADR-049). Ator por auth.uid(); exige Curador designado do Case ou administrador (R4); FOR UPDATE no Case e no Perfil ativo; valida VALIDATED; marca SUPERSEDED com carimbo/motivo/autor, cria sucessor DRAFT vinculado (superseded_by) e grava audit_log profile_superseded na mesma transação. Idempotente: repetir com o sucessor DRAFT vivo devolve o mesmo sucessor.';

revoke execute on function curadoria.supersede_priority_profile(uuid, text) from public;
grant execute on function curadoria.supersede_priority_profile(uuid, text) to authenticated;
