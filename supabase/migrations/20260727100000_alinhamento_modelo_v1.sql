-- ALINHAMENTO AO MODELO DA CURADORIA v1.0 (docs/curadoria/MODELO_CURADORIA_V1.md §11)
--
-- Três mudanças, todas de vocabulário e escala — nenhuma de regra:
--
-- 1. Critérios renomeados para o vocabulário oficial:
--      TRAJETORIA               → HISTORICO         (a pergunta muda junto:
--                                 "transmite segurança?", Modelo §4)
--      FORMA_DE_CUIDADO         → CONTINUIDADE_DO_CUIDADO
--      COMPATIBILIDADE_PESSOAL  → MODELO_DE_ATENDIMENTO
--
-- 2. Cada cruzamento passa a ter orçamento de 100 pontos (era 50+50 somados).
--    O peso individual pode ir a 100.
--
-- 3. Dados existentes são migrados, não descartados: as linhas gravadas com
--    os nomes antigos passam a falar a língua nova. Em produção as duas
--    tabelas estão vazias (verificado antes desta migration); localmente há
--    dados de fixture, e migrá-los preserva o comportamento de reexecução.

-- As constraints antigas saem antes do UPDATE — senão o valor novo é recusado
-- pela lista velha.
alter table curadoria.cruzamento_weights
  drop constraint cruzamento_weights_criterion_check,
  drop constraint cruzamento_weights_weight_check;

alter table curadoria.criterion_declarations
  drop constraint criterion_declarations_criterion_check;

update curadoria.cruzamento_weights set criterion = 'HISTORICO' where criterion = 'TRAJETORIA';
update curadoria.cruzamento_weights set criterion = 'CONTINUIDADE_DO_CUIDADO' where criterion = 'FORMA_DE_CUIDADO';
update curadoria.cruzamento_weights set criterion = 'MODELO_DE_ATENDIMENTO' where criterion = 'COMPATIBILIDADE_PESSOAL';

update curadoria.criterion_declarations set criterion = 'HISTORICO' where criterion = 'TRAJETORIA';
update curadoria.criterion_declarations set criterion = 'CONTINUIDADE_DO_CUIDADO' where criterion = 'FORMA_DE_CUIDADO';
update curadoria.criterion_declarations set criterion = 'MODELO_DE_ATENDIMENTO' where criterion = 'COMPATIBILIDADE_PESSOAL';

alter table curadoria.cruzamento_weights
  add constraint cruzamento_weights_criterion_check check (criterion in (
    'FORMACAO', 'EXPERIENCIA', 'HISTORICO',
    'ACESSO', 'CONTINUIDADE_DO_CUIDADO', 'MODELO_DE_ATENDIMENTO'
  )),
  add constraint cruzamento_weights_weight_check check (weight >= 0 and weight <= 100);

alter table curadoria.criterion_declarations
  add constraint criterion_declarations_criterion_check check (criterion in (
    'FORMACAO', 'EXPERIENCIA', 'HISTORICO',
    'ACESSO', 'CONTINUIDADE_DO_CUIDADO', 'MODELO_DE_ATENDIMENTO'
  ));

comment on table curadoria.cruzamento_weights is
  'Os pesos do Case no Modelo v1.0: dois cruzamentos independentes de 100 pontos cada (Avaliacao Tecnica e Compatibilidade Assistencial). O saldo por cruzamento e verificado no dominio; o banco garante intervalo e unicidade. Nunca existe um total de 200.';
