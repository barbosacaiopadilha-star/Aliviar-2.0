-- ============================================================================
-- ITEM 1.8-R1 — O VÍNCULO ENTRE O ESTADO E A EVIDÊNCIA QUE O SUSTENTA
--
-- Contrato lavrado: docs/curadoria/CONTRATO_1_8_R1.md §3, §4, §7.2, §15.
-- Base: 5afe937 (documental) sobre c3242ea (técnica).
--
-- O QUE ISTO RESOLVE
--   O Mapa do Profissional afirma um estado sobre alguém e não consegue dizer
--   em que se apoiou. A Ficha de Explicação (§11.4) precisa fechar o ramo do
--   estado até a linha exata de evidência — não até "a evidência mais recente",
--   que é justamente a semântica que este pacote existe para impedir.
--
-- POR QUE `evidence_id`, E NÃO `(profissional, conceito, versão)`
--   As duas tabelas identificam CONCEITO de formas diferentes: o Mapa por
--   `subcriterion_id uuid`, a evidência por `subcriterion_code text` (§3.1).
--   A forma sugerida exigiria acrescentar `subcriterion_code` ao Mapa —
--   segunda representação do mesmo fato na mesma linha, contra P-07.
--   `practice_evidence.id` já identifica exatamente uma tripla
--   (profissional, conceito, versão): apontar para a linha é apontar para a
--   versão, e é MAIS forte que guardar o número, porque não existe a
--   possibilidade de o número apontar para a linha errada (§3.3).
--
--   Nenhuma coluna `evidence_version` é criada. A versão se lê pelo vínculo.
--
-- O QUE ARBITRA O QUÊ (§3.4)
--   evidência existe .......... FK (declarativo)
--   mesmo profissional ........ FK COMPOSTA, sobre o unique habilitador
--   mesmo conceito ............ constraint trigger — exige a tradução
--                               `subcriterion_id → code`, que nenhuma FK
--                               alcança enquanto as convenções diferirem
--   versão exata .............. PK de `practice_evidence` (estrutural)
--   vínculo nunca obsoleto .... trigger BEFORE UPDATE (§7.2)
--
-- O QUE ISTO NÃO FAZ
--   Nenhum backfill. Nenhuma inferência retroativa. Nenhum `max(version)`.
--   Linha legada permanece sem vínculo e HONESTAMENTE não exibível (§6).
--   Nenhuma coluna `confirmed_at` (§5). Nenhuma policy, nenhum grant, nenhuma
--   alteração de RLS. Nenhum dado preexistente é tocado.
--
-- ROLLBACK — objeto a objeto, nesta ordem:
--   drop trigger professional_subcriterion_map_status_exige_vinculo on curadoria.professional_subcriterion_map;
--   drop trigger professional_subcriterion_map_evidencia_do_conceito on curadoria.professional_subcriterion_map;
--   drop function curadoria.exige_vinculo_ao_mudar_status();
--   drop function curadoria.valida_conceito_da_evidencia_vinculada();
--   alter table curadoria.professional_subcriterion_map
--     drop constraint professional_subcriterion_map_evidencia_fk;
--   alter table curadoria.professional_subcriterion_map drop column evidence_id;
--   drop index curadoria.practice_evidence_id_profissional_key;
--
--   Nada se perde: a coluna nasce NULA e nenhuma linha preexistente é
--   preenchida. Evidências, regras, propostas, Motor, `case_needs` e
--   `legal_acceptances` seguem intocados.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. O HABILITADOR DA FK COMPOSTA
--
-- Redundante com a chave primária, de propósito: existe SÓ para que a FK possa
-- carregar `professional_profile_id` junto e arbitrar o dono da evidência no
-- banco, em vez de por convenção. O custo é um índice a mais numa tabela
-- append-only (§3.4).
-- ---------------------------------------------------------------------------
create unique index if not exists practice_evidence_id_profissional_key
  on curadoria.practice_evidence (id, professional_profile_id);

comment on index curadoria.practice_evidence_id_profissional_key is
  'ADR-066 / 1.8-R1 §3.4 — habilitador da FK composta do Mapa do Profissional. Redundante com a PK por desenho: permite que a FK arbitre PROFISSIONAL, e nao so existencia.';

-- ---------------------------------------------------------------------------
-- 2. O VÍNCULO
--
-- NULL é permitido, e obrigatoriamente (§4): há registros anteriores ao regime
-- e o backfill é proibido. `NULL` significa REGISTRO SEM VÍNCULO DE EVIDÊNCIA
-- — nunca "sem evidência", nunca "evidência desconhecida" (I-8). É a mesma
-- disciplina que a PP-02 fixou para `declared_by`.
--
-- Vale nos TRÊS estados: `CONFIRMADO`, `NAO_CONFIRMADO` e `NAO_INFORMADO` são
-- afirmações sobre alguém, e os três pedem base. A nulidade é concessão ao
-- legado, nunca ao estado.
-- ---------------------------------------------------------------------------
alter table curadoria.professional_subcriterion_map
  add column if not exists evidence_id uuid;

comment on column curadoria.professional_subcriterion_map.evidence_id is
  'ADR-066 / 1.8-R1 §4 — a linha EXATA de practice_evidence que sustentava o status no momento da confirmacao. NUNCA "a evidencia mais recente": resolver por max(version) e proibido. NULL = registro sem vinculo (anterior ao regime ou gravado por fluxo que ainda nao informa a base), nunca "sem evidencia" nem "evidencia desconhecida" (I-8). Sem vinculo, o ramo estado e AUSENTE e a afirmacao dependente NAO e exibivel.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'professional_subcriterion_map_evidencia_fk'
  ) then
    alter table curadoria.professional_subcriterion_map
      add constraint professional_subcriterion_map_evidencia_fk
      foreign key (evidence_id, professional_profile_id)
      references curadoria.practice_evidence (id, professional_profile_id)
      on update restrict on delete restrict;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. COERÊNCIA DE CONCEITO — o que a FK não alcança
--
-- A FK garante que a evidência existe e é do mesmo profissional. Ela NÃO
-- consegue garantir que é do mesmo conceito, porque o Mapa guarda
-- `subcriterion_id uuid` e a evidência guarda `subcriterion_code text`: a
-- igualdade exige a tradução, e nenhuma chave estrangeira traduz.
--
-- DEFERIDO: o vínculo pode ser gravado na mesma transação que cria a evidência,
-- em qualquer ordem.
-- ---------------------------------------------------------------------------
create or replace function curadoria.valida_conceito_da_evidencia_vinculada()
returns trigger
language plpgsql
security invoker
set search_path = curadoria, public
as $$
declare
  codigo_do_mapa text;
  codigo_da_evidencia text;
begin
  if new.evidence_id is null then
    return null; -- sem vínculo não há coerência a conferir; o §6 cuida disso
  end if;

  select code into codigo_do_mapa
  from curadoria.method_subcriteria where id = new.subcriterion_id;

  select subcriterion_code into codigo_da_evidencia
  from curadoria.practice_evidence where id = new.evidence_id;

  if codigo_do_mapa is distinct from codigo_da_evidencia then
    raise exception
      'Evidencia de outro conceito: o Mapa afirma % e a evidencia % e sobre % (1.8-R1 §3.4).',
      coalesce(codigo_do_mapa, '(conceito inexistente)'),
      new.evidence_id,
      coalesce(codigo_da_evidencia, '(evidencia inexistente)')
      using errcode = 'restrict_violation';
  end if;

  return null;
end;
$$;

comment on function curadoria.valida_conceito_da_evidencia_vinculada() is
  'ADR-066 / 1.8-R1 §3.4 — arbitra CONCEITO entre o Mapa (subcriterion_id) e a evidencia (subcriterion_code). Nenhuma FK alcanca esta igualdade enquanto as duas convencoes diferirem (§3.1). Vale para qualquer papel, inclusive service_role.';

drop trigger if exists professional_subcriterion_map_evidencia_do_conceito
  on curadoria.professional_subcriterion_map;
create constraint trigger professional_subcriterion_map_evidencia_do_conceito
  after insert or update of evidence_id, subcriterion_id
  on curadoria.professional_subcriterion_map
  deferrable initially deferred
  for each row execute function curadoria.valida_conceito_da_evidencia_vinculada();

-- ---------------------------------------------------------------------------
-- 4. O VÍNCULO NÃO FICA OBSOLETO (§7.2 item 4)
--
-- Se o `status` muda e a linha JÁ TINHA vínculo, a gravação precisa reapresentar
-- a evidência. Sem isto, um vínculo válido passaria a sustentar um estado que
-- não é mais o dele — a explicação continuaria "completa" apontando para a base
-- do estado anterior.
--
-- Linha que NUNCA teve vínculo continua podendo mudar de status sem ele, e
-- permanece não exibível pelo §6: o fluxo existente não quebra.
-- ---------------------------------------------------------------------------
create or replace function curadoria.exige_vinculo_ao_mudar_status()
returns trigger
language plpgsql
security invoker
set search_path = curadoria, public
as $$
begin
  if new.status is distinct from old.status
     and old.evidence_id is not null
     and new.evidence_id is not distinct from old.evidence_id then
    raise exception
      'Mudanca de status (% -> %) sem reapresentar a evidencia: o vinculo % sustentava o estado anterior (1.8-R1 §7.2).',
      old.status, new.status, old.evidence_id
      using errcode = 'restrict_violation';
  end if;

  return new;
end;
$$;

comment on function curadoria.exige_vinculo_ao_mudar_status() is
  'ADR-066 / 1.8-R1 §7.2 — impede que um vinculo valido passe a sustentar um estado que nao e mais o dele. Linha que nunca teve vinculo nao e afetada: o fluxo legado continua funcionando e produz linhas honestamente nao exibiveis.';

drop trigger if exists professional_subcriterion_map_status_exige_vinculo
  on curadoria.professional_subcriterion_map;
create trigger professional_subcriterion_map_status_exige_vinculo
  before update on curadoria.professional_subcriterion_map
  for each row execute function curadoria.exige_vinculo_ao_mudar_status();

-- ---------------------------------------------------------------------------
-- 5. INÉRCIA
--
-- Nenhum grant, nenhuma policy, nenhuma alteracao de RLS. As funcoes nascem sem
-- privilegio publico, como todo o resto da 2.0.
-- ---------------------------------------------------------------------------
revoke execute on function curadoria.valida_conceito_da_evidencia_vinculada() from public;
revoke execute on function curadoria.exige_vinculo_ao_mudar_status() from public;
