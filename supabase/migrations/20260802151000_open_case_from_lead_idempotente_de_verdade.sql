-- ============================================================================
-- BLOCO B / E5 — open_case_from_lead: A IDEMPOTÊNCIA DECLARADA VIRA REAL
-- ============================================================================
--
-- FINALIDADE
--   A versão de 20260724200921 declarava "idempotente por lead", mas gravava
--   `active_case_id = null` ao abrir o Case (raiz confirmada do AT-03/gate
--   B13). A segunda chamada nunca reencontrava o Case, tentava criar história
--   e Case de novo e esbarrava no índice um-rascunho-por-paciente com um 23505
--   ininteligível para o Atendente. Esta migration substitui a função
--   (CREATE OR REPLACE em migration NOVA — a original não é editada) para:
--     1. gravar o id REAL do Case em `active_case_id`;
--     2. reencontrar Cases abertos antes da correção (vínculo perdido) pela
--       História que a própria função criou (data->>'lead_id') e refazer o
--       vínculo — retry legítimo devolve o MESMO Case;
--     3. traduzir a colisão de unicidade residual em erro de domínio claro.
--
-- PRÉ-CONDIÇÕES
--   - `crm_contacts.active_case_id` já aponta para `curadoria.cases`
--     (convergência B2, 20260725135924).
--   - `curadoria.record_crm_audit` existente.
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML nesta migration. Leads antigos com Case aberto e
--     `active_case_id` nulo (dano histórico do defeito) são REPARADOS de
--     forma incremental: na próxima chamada legítima da função para aquele
--     lead, o Case é reencontrado pela História e o vínculo é regravado.
--
-- CONCORRÊNCIA
--   - O `select ... for update` sobre o lead serializa chamadas simultâneas:
--     a segunda transação espera a primeira e enxerga o `active_case_id`
--     recém-gravado (read committed re-lê a linha após o lock).
--
-- PROVA DE FECHAMENTO
--   - Gate B13 (tests/remediacao/atomicidade.integration.test.ts): duas
--     chamadas para o mesmo lead devolvem o MESMO Case e a paciente segue
--     com exatamente 1 Case.
--
-- ROLLBACK
--   - Reaplicar o corpo da função de 20260724200921 (CREATE OR REPLACE com
--     aquele texto). Nenhum objeto novo é criado aqui; nada mais a desfazer.
--     Atenção: o rollback REINTRODUZ o defeito AT-03 documentado.
-- ============================================================================

create or replace function curadoria.open_case_from_lead(
  _contact_id uuid,
  _initial_story text default null
)
returns curadoria.cases
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _actor uuid := auth.uid();
  _c curadoria.crm_contacts;
  _existing curadoria.cases;
  _story uuid;
  _case curadoria.cases;
  _texto text;
begin
  if _actor is null then
    raise exception 'Abertura de Case exige ator autenticado' using errcode = '42501';
  end if;

  if not (curadoria.has_role('atendente') or curadoria.has_role('administrador')) then
    raise exception 'Quem abre o Case é o Atendente. O Curador recebe o Case já aberto; o Concierge acompanha depois.'
      using errcode = '42501';
  end if;

  -- Serializa o duplo clique: a segunda chamada espera esta transação e
  -- relê o lead já com o vínculo gravado.
  select * into _c from curadoria.crm_contacts where id = _contact_id for update;
  if not found then
    raise exception 'Lead % não existe', _contact_id using errcode = 'P0002';
  end if;

  if _c.patient_profile_id is null then
    raise exception 'Converta o lead em paciente antes de abrir o Case' using errcode = '23514';
  end if;

  -- Idempotência 1: o lead já aponta para um Case? Devolve o mesmo.
  if _c.active_case_id is not null then
    select * into _existing from curadoria.cases where id = _c.active_case_id;
    if found then
      return _existing;
    end if;
  end if;

  -- Idempotência 2 (reparo do dano histórico do AT-03): Cases abertos por
  -- esta função antes da correção ficaram sem vínculo, porque a versão
  -- anterior gravava `active_case_id = null`. A História criada junto com o
  -- Case carrega o lead de origem (data->>'lead_id') — é por ela que o Case
  -- é reencontrado, e o vínculo é refeito aqui. Retry legítimo devolve o
  -- MESMO Case em vez de um 23505 ininteligível.
  select k.* into _existing
    from curadoria.cases k
    join curadoria.patient_stories s on s.id = k.source_story_id
   where k.patient_profile_id = _c.patient_profile_id
     and s.data->>'lead_id' = _contact_id::text
     and k.status not in ('CLOSED', 'CANCELLED')
   order by k.created_at asc
   limit 1;
  if found then
    update curadoria.crm_contacts
       set active_case_id = _existing.id, updated_at = now()
     where id = _contact_id;
    return _existing;
  end if;

  _texto := coalesce(nullif(btrim(_initial_story), ''), nullif(btrim(_c.initial_reason), ''));
  if _texto is null then
    raise exception 'Registre o que a pessoa contou antes de abrir o Case' using errcode = '23514';
  end if;

  begin
    insert into curadoria.patient_stories (profile_id, status, current_step, data, created_by)
    values (
      _c.patient_profile_id, 'rascunho', 'motivo',
      jsonb_build_object(
        'motivo', _texto,
        'origem', 'atendimento_inicial',
        'lead_id', _contact_id,
        'registrado_por', _actor
      ),
      _actor
    )
    returning id into _story;

    insert into curadoria.cases (patient_profile_id, source_story_id, status, created_by, responsible_id, responsible_role)
    values (_c.patient_profile_id, _story, 'NEW', _actor, _actor, 'atendente')
    returning * into _case;
  exception when unique_violation then
    -- Colisão real de unicidade (rascunho de história ou Case ativo criados
    -- por OUTRA via para esta pessoa): erro de domínio claro, nunca o texto
    -- cru da constraint.
    raise exception
      'Não foi possível abrir o Case: esta pessoa já tem uma história em rascunho ou um Case ativo criado por outra via. Verifique a ficha dela antes de tentar de novo.'
      using errcode = '23505';
  end;

  -- A correção do defeito: o vínculo grava o id REAL do Case.
  update curadoria.crm_contacts
     set active_case_id = _case.id, updated_at = now()
   where id = _contact_id;

  perform curadoria.record_crm_audit(
    'case_opened_from_lead', 'case', _case.id, null,
    jsonb_build_object('case_id', _case.id, 'patient_profile_id', _c.patient_profile_id, 'opened_by', _actor),
    jsonb_build_object('lead_id', _contact_id, 'source', _c.source, 'story_id', _story));

  return _case;
end;
$function$;

comment on function curadoria.open_case_from_lead(uuid, text) is
  'Abre o Case a partir de um lead já convertido. Idempotente DE FATO por lead: grava active_case_id com o id real do Case, reencontra Cases com vínculo perdido pela História de origem (reparo do AT-03) e serializa o duplo clique com FOR UPDATE. O Case nasce com o Atendente como responsável — nunca sem dono.';

revoke execute on function curadoria.open_case_from_lead(uuid, text) from public;
grant execute on function curadoria.open_case_from_lead(uuid, text) to authenticated;
