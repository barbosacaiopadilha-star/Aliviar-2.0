-- ENDURECIMENTO DE GRANTS DAS FUNÇÕES CANÔNICAS
--
-- `create function` no PostgreSQL concede EXECUTE a PUBLIC por padrão. As
-- migrations da âncora canônica concederam EXECUTE a `authenticated`
-- explicitamente, mas nunca revogaram esse padrão — e PUBLIC alcança todo
-- papel, inclusive `anon`.
--
-- O que isso significava na prática: `canonical_delivery_target` é
-- SECURITY DEFINER e devolve `case_id` e `patient_profile_id`. Quem soubesse o
-- identificador de um Relatório obteria o identificador do paciente sem
-- sequer estar autenticado. As outras três expõem menos — duas devolvem só um
-- booleano e `create_connection_from_report` é SECURITY INVOKER e barra
-- `anon` no próprio corpo, via auth.uid() —, mas a regra vale para as quatro:
-- nenhuma função desta entrega é anônima.
--
-- Escopo deliberadamente mínimo: apenas as quatro funções criadas pela
-- âncora canônica. As funções históricas do schema `curadoria` que também
-- executam por `anon` são dívida anterior e têm auditoria própria — misturar
-- as duas coisas transformaria uma correção verificável numa varredura sem
-- critério.
--
-- Nada além dos privilégios muda: corpo, parâmetros, retorno, volatilidade,
-- SECURITY DEFINER/INVOKER e search_path permanecem exatamente como estão.
--
-- Idempotente: REVOKE de privilégio ausente e GRANT de privilégio já
-- concedido são ambos no-ops no PostgreSQL.

revoke execute on function
  curadoria.canonical_delivery_target(p_report_id uuid)
  from public;

revoke execute on function
  curadoria.canonical_delivery_matches(p_report_id uuid, p_case_id uuid, p_patient_profile_id uuid)
  from public;

revoke execute on function
  curadoria.canonical_delivery_has_professional(p_report_id uuid, p_professional_profile_id uuid)
  from public;

revoke execute on function
  curadoria.create_connection_from_report(
    p_report_id uuid,
    p_professional_profile_id uuid,
    p_decided_at timestamptz,
    p_actor_id uuid,
    p_event_payload jsonb,
    p_occurred_at timestamptz,
    p_recorded_at timestamptz
  )
  from public;

-- `authenticated` é o único papel de cliente autorizado: as quatro funções
-- existem para o paciente autenticado registrar a própria escolha, e a
-- autorização real continua na RLS de connection_records.
grant execute on function
  curadoria.canonical_delivery_target(p_report_id uuid)
  to authenticated;

grant execute on function
  curadoria.canonical_delivery_matches(p_report_id uuid, p_case_id uuid, p_patient_profile_id uuid)
  to authenticated;

grant execute on function
  curadoria.canonical_delivery_has_professional(p_report_id uuid, p_professional_profile_id uuid)
  to authenticated;

grant execute on function
  curadoria.create_connection_from_report(
    p_report_id uuid,
    p_professional_profile_id uuid,
    p_decided_at timestamptz,
    p_actor_id uuid,
    p_event_payload jsonb,
    p_occurred_at timestamptz,
    p_recorded_at timestamptz
  )
  to authenticated;
