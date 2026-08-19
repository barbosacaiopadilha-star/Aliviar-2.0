-- ============================================================================
-- O MAPA DO PROFISSIONAL EXIGE AUTOR
-- ============================================================================
--
-- O QUE MUDA
--   `professional_subcriterion_map.declared_by` passa a ser obrigatório em
--   toda linha NOVA ou ATUALIZADA. Nada é preenchido retroativamente.
--
-- POR QUE
--   A coluna existia desde sempre, era LIDA pela tela — e nenhuma escrita a
--   preenchia. Havia até um comentário no repositório admitindo isso ("a
--   autoria e lida; nenhuma escrita a preenche neste pacote"). Resultado: toda
--   declaração do Mapa era anônima, e o Mapa é justamente o que a Aliviar
--   afirma sobre um médico real. Declaração sem autor é afirmação que ninguém
--   assinou.
--
-- POR QUE `NOT VALID`, E NÃO `SET NOT NULL`
--   `NOT VALID` faz o CHECK valer para INSERT e UPDATE a partir de agora, sem
--   varrer o passado. É deliberado: linhas antigas sem autor continuam
--   válidas e legíveis exatamente como estão.
--
--   A alternativa seria escolher alguém para assinar retroativamente
--   declarações que essa pessoa pode não ter feito. Isso não é migração de
--   dados — é falsificar autoria em registro sobre profissional real. Um
--   registro honestamente anônimo é melhor que um registro com autor errado,
--   e a diferença entre "ninguém assinou" e "fulano assinou" fica preservada.
--
--   Quando a operação quiser fechar o passado, o caminho é revisar linha a
--   linha e então `validate constraint` — ato deliberado, com decisão própria.
--
-- COMO CONFERIR O QUE FICOU PARA TRÁS
--   select count(*) from curadoria.professional_subcriterion_map
--    where declared_by is null;
--
-- ROLLBACK
--   alter table curadoria.professional_subcriterion_map
--     drop constraint mapa_exige_autor;
-- ============================================================================

alter table curadoria.professional_subcriterion_map
  drop constraint if exists mapa_exige_autor;

alter table curadoria.professional_subcriterion_map
  add constraint mapa_exige_autor
  check (declared_by is not null)
  not valid;

comment on constraint mapa_exige_autor on curadoria.professional_subcriterion_map is
  'Toda declaracao NOVA do Mapa tem autor, vindo da sessao e nunca do payload. NOT VALID de proposito: linhas anteriores a esta migration permanecem sem autor, porque escolher um assinante retroativo falsificaria autoria sobre profissional real.';
