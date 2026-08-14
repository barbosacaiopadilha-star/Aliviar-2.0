-- ---------------------------------------------------------------------------
-- OPS-G5 · CORTE 7 — o privilégio das funções do ciclo, sem sobra
-- ---------------------------------------------------------------------------
--
-- A migration 20260814221743 revogou `EXECUTE` de `PUBLIC` em duas das quatro
-- funções que criou e deixou as outras duas com o privilégio padrão do
-- Postgres, que é justamente `EXECUTE` para `PUBLIC`. A inconsistência era
-- minha, não uma decisão.
--
-- Na prática nenhuma delas era chamável: são funções `returns trigger`, e o
-- Postgres recusa a invocação direta de qualquer uma delas com "trigger
-- functions can only be called as triggers". Mas privilégio concedido sem
-- necessidade é superfície que ninguém precisa manter, e a regra da casa é a
-- mesma para todas: quem não precisa executar, não pode.
--
-- Nenhuma delas muda de dono ou de modo: seguem `SECURITY INVOKER`, rodando
-- com o privilégio de quem escreve na tabela — que é o que torna a guarda
-- válida para qualquer writer, inclusive um que ainda não existe.

revoke execute on function curadoria.assert_ciclo_do_profissional() from public;
revoke execute on function curadoria.assert_exclusao_sem_historia() from public;

-- Quem sobra, e por quê:
--
--   curadoria.motivos_da_transicao(...)
--     authenticated  — o writer administrativo roda sob a sessão de quem
--                      opera, e o trigger de validação chama esta função como
--                      INVOKER: sem o privilégio, a recusa viria como
--                      `permission denied` em vez da regra real.
--     service_role   — o cliente administrativo e qualquer job autorizado.
--     ⛔ anon        — a porta pública não tem nada que ver com o vocabulário
--                      do ciclo, e nunca teve.
--
--   as quatro funções de trigger
--     ninguém        — rodam como gatilho, e só.
--
-- `postgres` mantém o privilégio de dono em todas, que é o que permite a
-- própria migration rodar.

comment on function curadoria.assert_ciclo_do_profissional() is
  'OPS-G5 C7: valida a transição de ciclo. SECURITY INVOKER, sem EXECUTE para PUBLIC.';

comment on function curadoria.assert_exclusao_sem_historia() is
  'OPS-G5 C7: recusa apagar profissional com história operacional. SECURITY INVOKER, sem EXECUTE para PUBLIC.';
