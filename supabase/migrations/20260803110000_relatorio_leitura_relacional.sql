-- ============================================================================
-- RELATÓRIO — SEÇÃO DA LEITURA RELACIONAL (ADR-065)
-- ============================================================================
-- "Como esse caminho conversa com a forma como você quer ser cuidada."
--
-- Coluna aditiva em curadoria_report_options: o texto da seção relacional de
-- cada opção, gerado pelo rascunho assistido a partir das frases rastreadas
-- do motor relacional e revisado/validado pelo Curador no editor (as frases
-- dos conceitos humanos SÓ chegam ao paciente depois dessa validação —
-- documento normativo, Parte 6).
--
-- Nullable de propósito: Relatórios anteriores à ADR-065 não ganham seção
-- retroativa (entregue é imutável — ADR-048/050), e ausência é ausência.
--
-- ROLLBACK: a coluna pode permanecer, inerte (nenhum leitor quebra com ela);
-- remover exigiria confirmar que nenhum Relatório emitido a carrega.
-- ============================================================================

alter table curadoria.curadoria_report_options
  add column if not exists relational_reading text;

comment on column curadoria.curadoria_report_options.relational_reading is
  'ADR-065: secao "Como esse caminho conversa com a forma como voce quer ser cuidada". Nasce do rascunho assistido (frases rastreadas do motor relacional); a versao final e do Curador. NULL = Relatorio anterior a ADR-065 ou secao ainda nao escrita.';
