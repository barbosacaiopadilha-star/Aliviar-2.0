-- ============================================================================
-- ITEM 2.6 RESIDUAL — G-10 · CAPABILITY NOMINAL READ-ONLY (OPÇÃO B, PA-14)
-- ============================================================================
--
-- CONTRATO_2_6 §11: a paciente autenticada, dona do Case, pode saber UMA coisa
-- de `curadoria.profiles`: o nome de exibição do Curador do próprio Case.
-- A RLS de `profiles` NÃO muda — o resultado degradado de antes era o gate
-- funcionando; esta capability é a authority boundary nova, mínima e nomeada.
--
-- REGIME (§11, ressalva do Guardião incorporada):
--   · GATE-FIRST — `is_patient_for_case(p_case_id)` é a PRIMEIRA e ÚNICA
--     authority boundary, avaliada antes de qualquer dado do Case ou do
--     Curador. Consequência deliberada: quem não é a dona NÃO DISTINGUE Case
--     inexistente de Case alheio.
--   · CATÁLOGO FECHADO EM TRÊS desfechos:
--       OK                    — dona do Case, Curador atribuído;
--       SEM_AUTORIDADE        — funde indistinguivelmente Case inexistente,
--                               Case de terceiro e chamador sem autoridade;
--       CURADOR_NAO_ATRIBUIDO — Case da chamadora, sem Curador.
--     `CASE_NAO_ENCONTRADO` NÃO EXISTE no domínio (removido pela ressalva).
--   · SAÍDA MÍNIMA — do perfil, SOMENTE `display_name`. Nenhum id, uuid,
--     e-mail, telefone, papel, avatar, timestamp ou metadado chega ao cliente.
--   · Read-only · STABLE · STRICT · zero SQL dinâmico · search_path fixo ·
--     referências qualificadas · nenhuma policy nova · nenhuma leitura
--     genérica de `profiles`.
--
-- ESCRITA DO MAPA: nada aqui toca `professional_subcriterion_map` — o recorte
-- da ADR-040 item 6 permanece intacto (ADR-068 §14.2); I-12 e o aceite por
-- papel são guardados por teste, não por objeto novo.
--
-- ROLLBACK (objeto a objeto): drop function
--   curadoria.nome_do_curador_do_caso(uuid);
-- — objeto único e aditivo; nenhuma policy alterada, nenhum dado tocado; a
-- superfície da paciente volta à degradação anterior (fallback genérico).
-- ============================================================================

create or replace function curadoria.nome_do_curador_do_caso(p_case_id uuid)
returns table (desfecho text, display_name text)
language plpgsql
stable
strict
security definer
set search_path = curadoria, pg_temp
as $$
declare
  v_curador_id uuid;
  v_display_name text;
begin
  -- GATE-FIRST (§11): a boundary decide antes de qualquer dado ser resolvido.
  -- Sem autoridade, a resposta é UMA — Case inexistente, Case de terceiro e
  -- chamador não autenticado recebem exatamente a mesma linha (§15).
  if not curadoria.is_patient_for_case(p_case_id) then
    return query select 'SEM_AUTORIDADE'::text, null::text;
    return;
  end if;

  -- Só a dona chega aqui. Agora — e apenas agora — o Case é lido.
  select c.assigned_curator_id
    into v_curador_id
    from curadoria.cases c
   where c.id = p_case_id;

  if v_curador_id is null then
    return query select 'CURADOR_NAO_ATRIBUIDO'::text, null::text;
    return;
  end if;

  -- A única leitura de `profiles`: uma linha, uma coluna, por chave.
  select p.display_name
    into v_display_name
    from curadoria.profiles p
   where p.id = v_curador_id;

  return query select 'OK'::text, v_display_name;
end;
$$;

comment on function curadoria.nome_do_curador_do_caso(uuid) is
  'CONTRATO_2_6 §11 (G-10, Opção B — PA-14): responde UMA pergunta — o nome de exibição do Curador do Case da chamadora. Gate-first (is_patient_for_case antes de qualquer dado); catálogo fechado em três desfechos (OK · SEM_AUTORIDADE · CURADOR_NAO_ATRIBUIDO); SEM_AUTORIDADE funde indistinguivelmente Case inexistente e Case alheio — a capability nunca confirma existência a quem não é a dona. Saída mínima: display_name somente. Read-only; nenhuma policy nova; RLS de profiles intacta.';

-- Grants — o padrão da superfície autorizada da paciente (acknowledge_case_need):
-- revoke amplo primeiro, EXECUTE só a authenticated; o gate REAL é interno.
revoke all on function curadoria.nome_do_curador_do_caso(uuid) from public;
revoke execute on function curadoria.nome_do_curador_do_caso(uuid) from anon;
grant execute on function curadoria.nome_do_curador_do_caso(uuid) to authenticated;
