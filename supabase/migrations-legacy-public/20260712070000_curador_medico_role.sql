-- SPRINT OPERACIONAL 1: adota o papel "Curador Médico" (docs/PRODUCT_ARCHITECTURE.md,
-- seção 17) no catálogo de papéis (ADR-006). É uma operação de dado — nenhuma
-- alteração estrutural em public.roles, exatamente o que o modelo de
-- catálogo + associação N:N foi desenhado para suportar. Não altera o ACE:
-- reviewerId (P009) já é uma string opaca, agnóstica a quem exerce o papel.
--
-- Papéis são cumulativos, não hierárquicos (ADR-006/docs/PRODUCT_ARCHITECTURE.md
-- seção 17) — uma pessoa pode acumular administrador e curador_medico ao
-- mesmo tempo.

insert into public.roles (slug, name) values
  ('curador_medico', 'Curador Médico');
