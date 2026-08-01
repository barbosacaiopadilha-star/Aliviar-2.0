-- GRAU DA PESSOA × IMPORTÂNCIA DO CASE — eliminando a colisão de vocabulário.
--
-- `case_needs.degree` aceitava 'IMPORTANTE', que é TAMBÉM um valor de
-- `curadoria.importance_level`. Mesmo texto, dois conceitos:
--
--   * importância — quanto o CASE declara que o subcritério pesa; cinco
--     níveis; única entrada do Motor pelo lado do Case (ADR-039/041);
--   * grau — quanto a PESSOA disse que aquilo pesa para ela, no Protocolo;
--     não entra no Motor.
--
-- Com o mesmo literal nos dois lados, a matriz do Motor aceitava um grau como
-- se fosse importância — provado por teste antes desta correção. O valor passa
-- a se chamar `PESA_MUITO`; o RÓTULO que a pessoa lê continua "Importante —
-- pesa muito, não impede". Nada muda para quem usa; muda o que o banco
-- consegue confundir.
--
-- Sem perda de dado: as linhas existentes são convertidas antes do CHECK novo.

alter table curadoria.case_needs
  drop constraint if exists case_needs_degree_check;

update curadoria.case_needs set degree = 'PESA_MUITO' where degree = 'IMPORTANTE';

alter table curadoria.case_needs
  add constraint case_needs_degree_check check (degree in (
    'ESSENCIAL', 'PESA_MUITO', 'DESEJAVEL', 'SEM_PREFERENCIA'
  ));

comment on column curadoria.case_needs.degree is
  'Quanto a PESSOA disse que isto pesa para ela. NAO e importancia do Case (case_priority_map.importance) e NAO entra no Motor. Nenhum valor coincide com importance_level, de proposito.';

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   alter table curadoria.case_needs drop constraint case_needs_degree_check;
--   update curadoria.case_needs set degree = 'IMPORTANTE' where degree = 'PESA_MUITO';
--   alter table curadoria.case_needs add constraint case_needs_degree_check
--     check (degree in ('ESSENCIAL', 'IMPORTANTE', 'DESEJAVEL', 'SEM_PREFERENCIA'));
