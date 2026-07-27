-- ENDURECIMENTO DE GRANTS — FATO DA ENTREGA
--
-- Mesma razão da migration anterior de endurecimento, aplicada à função criada
-- por `fato_entrega_canonica`: `create function` concede EXECUTE a PUBLIC por
-- padrão, e PUBLIC alcança `anon`.
--
-- `case_has_delivered_curadoria` é SECURITY DEFINER. Ela já nega por padrão
-- quem não tem vínculo com o Case — devolve `false` inclusive para Case
-- inexistente, justamente para não permitir enumeração —, mas negar dentro da
-- função e negar na porta são coisas diferentes: sem privilégio, a chamada
-- anônima nem chega a executar.
--
-- Vive em migration própria, e não dentro de `fato_entrega_canonica`, porque
-- aquela migration já estava certificada e revisada; acrescentar linhas a ela
-- depois da revisão desfaria a própria certificação.
--
-- Idempotente: REVOKE de privilégio ausente e GRANT já concedido são no-ops.

revoke execute on function
  curadoria.case_has_delivered_curadoria(_case_id uuid)
  from public;

grant execute on function
  curadoria.case_has_delivered_curadoria(_case_id uuid)
  to authenticated;
