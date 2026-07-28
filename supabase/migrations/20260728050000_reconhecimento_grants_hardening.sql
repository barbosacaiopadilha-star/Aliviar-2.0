-- ENDURECIMENTO DE GRANTS DO RECONHECIMENTO
--
-- `create function` no PostgreSQL concede EXECUTE a PUBLIC por padrão, e
-- PUBLIC alcança `anon`. A migration 20260728030000 revogou de `anon`
-- explicitamente — mas revogar de `anon` NÃO desfaz o grant herdado de
-- PUBLIC. As duas funções nasceram executáveis por quem não está autenticado.
--
-- Detectado na verificação pós-aplicação em produção
-- (`has_function_privilege('anon', ...)` devolveu true) e corrigido na mesma
-- janela. Mesmo defeito e mesmo remédio de
-- `canonical_function_grants_hardening`.
--
-- Impacto real era nulo: `acknowledge_priority_profile` começa por
-- `is_patient_for_case`, que devolve falso sem sessão. Mas postura de
-- segurança não se mede pelo dano que escapou.

revoke execute on function curadoria.acknowledge_priority_profile(uuid) from public;
revoke execute on function curadoria.priority_map_pending(uuid) from public;
grant execute on function curadoria.acknowledge_priority_profile(uuid) to authenticated;
