-- CORREÇÃO DE DOMÍNIO — os três níveis humanos da operação Aliviar.
--
-- O papel Atendente (Nível 1) não existia no catálogo, apesar de ser quem
-- ABRE o Case. A tensão estava registrada cinco vezes em
-- docs/OPERATIONAL_ROLES_MODEL.md sem decisão. O Fundador decidiu.
--
-- Os três níveis, com responsabilidades disjuntas:
--   Nível 1 — Atendente:  recebe o contato, qualifica, ABRE o Case, encaminha
--   Nível 2 — Curador:    recebe o MESMO Case, conduz a Curadoria, encaminha
--   Nível 3 — Concierge:  recebe o MESMO Case após a Curadoria, acompanha
--
-- O CRM não é papel: é a plataforma que organiza a operação dos três.

insert into curadoria.roles (slug, name)
values ('atendente', 'Atendente')
on conflict (slug) do nothing;

comment on table curadoria.roles is 'Catálogo de papéis. Três níveis humanos operacionais — atendente (abre o Case), curador_medico (conduz a Curadoria), concierge (acompanha após a Curadoria) — mais administrador, paciente e profissional. O CRM é plataforma, nunca papel.';