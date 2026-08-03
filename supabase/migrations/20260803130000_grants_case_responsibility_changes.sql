-- A tabela de auditoria da troca de responsável nasceu (Fase 2) com RLS e
-- policies, mas sem GRANT — no Postgres, privilégio de tabela é separado de
-- RLS, e sem ele toda leitura falha com 42501 antes mesmo de a policy rodar.
-- Efeito visível: o painel executivo do /admin (admin.dashboard.handoffs)
-- quebrava em toda visita (ERR-CRLGD859/ERR-D3P5RLRX/ERR-DDLJLE19).

grant select on curadoria.case_responsibility_changes to authenticated;

-- INSERT deliberadamente não é concedido a authenticated: a passagem de
-- bastão é operação de servidor via curadoria.transfer_case_responsibility()
-- (security definer, Fase 3b) — o cliente nunca escreve o rastro direto.
-- A policy de INSERT permanece como defesa em profundidade.

grant all on curadoria.case_responsibility_changes to service_role;
-- UPDATE/DELETE continuam bloqueados para todos pelo trigger append-only.
