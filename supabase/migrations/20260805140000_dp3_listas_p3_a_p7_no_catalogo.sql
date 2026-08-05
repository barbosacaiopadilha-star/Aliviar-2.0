-- ============================================================================
-- DP-3 — AS LISTAS P3–P7 PASSAM A EXISTIR NO CATÁLOGO
-- ============================================================================
--
-- FINALIDADE
--   Eliminar a única violação conhecida da regra de fonte única. Cinco listas
--   do lado da PESSOA viviam apenas em `protocolos.ts`, como constantes
--   `OPCOES_PROVISORIAS_*`: o código era a verdade, e o Catálogo não sabia
--   delas. P1, P2, P10, P11, P12 e P13 já liam do banco; estas cinco, não.
--
--   Consequência do ponto cego: o gate de paridade comparava código e banco
--   para os conceitos materializados e passava verde ignorando estes — uma
--   divergência aqui não teria como aparecer.
--
-- CONTAGEM — 21 CÓDIGOS, 22 LINHAS. Não é erro de nenhum dos dois lados.
--   `NAO_TENHO_PREFERENCIA` é o MESMO código e o MESMO rótulo em dois
--   conceitos (CONTINUIDADE_RETORNOS e CONTINUIDADE_CANAIS). A DM-1 conta
--   códigos distintos: 21. A tabela tem grão por conceito, então a mesma opção
--   em dois conceitos são duas linhas: 22. Nada foi fundido para "fechar" 21, e
--   nada foi descartado para "fechar" 22 — fundir seria decidir que a pessoa
--   responde a mesma coisa nas duas perguntas, e não é o Implementador quem
--   decide isso.
--
-- PRESERVAÇÃO ABSOLUTA (A3)
--   Os códigos, os rótulos, a ordem e a multiplicidade saem daqui exatamente
--   como estavam em `protocolos.ts`. Nada renomeado, reorganizado, melhorado ou
--   normalizado — inclusive onde a normalização seria tentadora (SIM/NAO de
--   CONTINUIDADE_COORDENACAO permanece SIM/NAO).
--
-- O QUE ESTA MIGRATION NÃO FAZ
--   Nenhum DDL. Nenhum `update`. Nenhum backfill. `case_needs` não é tocada:
--   respostas já dadas continuam exatamente como foram dadas, e materializar o
--   vocabulário não reinterpreta o que alguém disse com ele.
--
--   `satisfied_by` fica NULO em todas as 22 linhas, deliberadamente (A4).
--   Correspondência entre o que a pessoa quer e o que o profissional declara é
--   COMPORTAMENTO, não catalogação — e pertence a outro pacote. Preenchê-la
--   aqui criaria cruzamento novo por baixo de uma migração de vocabulário.
--
-- VERSIONAMENTO (A7)
--   `catalog_version = '1.1.0'`, a vigente para o lado da pessoa. Nenhuma
--   lógica nova de versionamento: evolução futura destas listas acontece por
--   versionamento do Catálogo, nunca editando esta migration (DT-111).
--
-- IDEMPOTÊNCIA
--   `on conflict do nothing` sobre a chave natural: reaplicar não duplica e não
--   sobrescreve. Se uma linha já existir, ela é a que vale — esta migration
--   acrescenta, nunca corrige.
--
-- ROLLBACK
--   delete from curadoria.method_subcriterion_options
--    where side = 'paciente' and catalog_version = '1.1.0'
--      and subcriterion_code in ('ACESSO_DISPONIBILIDADE', 'ACESSO_PRAZO_PARA_CONSULTA',
--        'CONTINUIDADE_RETORNOS', 'CONTINUIDADE_CANAIS', 'CONTINUIDADE_COORDENACAO');
--   Nenhuma resposta de paciente é afetada: `case_needs` guarda o CÓDIGO, e o
--   código não deixa de ser o que é por sair do vocabulário.
-- ============================================================================

-- O Catálogo é norma: `catalog_guard()` recusa qualquer mudança sem
-- justificativa registrada na MESMA transação. Não é burocracia — é o que
-- garante que nenhuma linha de vocabulário entre sem alguém ter dito por quê,
-- e é exatamente o tipo de fronteira que a DP-3 existe para respeitar.
select set_config(
  'curadoria.catalog_change_rationale',
  'DP-3 (DM-1 ratificada): materializacao das listas P3-P7 do lado da pessoa, que viviam apenas em protocolos.ts como OPCOES_PROVISORIAS_*. Preservacao absoluta — mesmos codigos, rotulos e ordem. Nenhum comportamento novo.',
  true
);

insert into curadoria.method_subcriterion_options
  (subcriterion_code, side, field, value, label, requires_detail, display_order, active, catalog_version)
values
  -- P3 · ACESSO_DISPONIBILIDADE — múltipla escolha (multi: true)
  ('ACESSO_DISPONIBILIDADE', 'paciente', 'principal', 'MANHA_DIAS_UTEIS', 'Manhã em dias úteis', false, 1, true, '1.1.0'),
  ('ACESSO_DISPONIBILIDADE', 'paciente', 'principal', 'TARDE_DIAS_UTEIS', 'Tarde em dias úteis', false, 2, true, '1.1.0'),
  ('ACESSO_DISPONIBILIDADE', 'paciente', 'principal', 'NOITE_APOS_18H', 'Noite, após as 18h', false, 3, true, '1.1.0'),
  ('ACESSO_DISPONIBILIDADE', 'paciente', 'principal', 'SABADO', 'Sábado', false, 4, true, '1.1.0'),
  ('ACESSO_DISPONIBILIDADE', 'paciente', 'principal', 'DOMINGO_OU_FERIADO', 'Domingo ou feriado', false, 5, true, '1.1.0'),

  -- P4 · ACESSO_PRAZO_PARA_CONSULTA — escolha única (multi: false)
  ('ACESSO_PRAZO_PARA_CONSULTA', 'paciente', 'principal', 'ATE_7_DIAS', 'Em até 7 dias', false, 1, true, '1.1.0'),
  ('ACESSO_PRAZO_PARA_CONSULTA', 'paciente', 'principal', 'ATE_15_DIAS', 'Em até 15 dias', false, 2, true, '1.1.0'),
  ('ACESSO_PRAZO_PARA_CONSULTA', 'paciente', 'principal', 'ATE_30_DIAS', 'Em até 30 dias', false, 3, true, '1.1.0'),
  ('ACESSO_PRAZO_PARA_CONSULTA', 'paciente', 'principal', 'SEM_URGENCIA_DECLARADA', 'Sem urgência declarada', false, 4, true, '1.1.0'),

  -- P5 · CONTINUIDADE_RETORNOS — múltipla escolha (multi: true)
  ('CONTINUIDADE_RETORNOS', 'paciente', 'principal', 'RETORNO_JA_MARCADO_AO_SAIR', 'Sair com o retorno já marcado', false, 1, true, '1.1.0'),
  ('CONTINUIDADE_RETORNOS', 'paciente', 'principal', 'RETORNO_CONFORME_EU_EVOLUIR', 'Retorno conforme eu evoluir', false, 2, true, '1.1.0'),
  ('CONTINUIDADE_RETORNOS', 'paciente', 'principal', 'PREFIRO_PROCURAR_QUANDO_PRECISAR', 'Prefiro procurar quando precisar', false, 3, true, '1.1.0'),
  ('CONTINUIDADE_RETORNOS', 'paciente', 'principal', 'QUERO_ORIENTACAO_ESCRITA_APOS_CONSULTA', 'Quero orientação escrita após a consulta', false, 4, true, '1.1.0'),
  -- Mesma opção de CONTINUIDADE_CANAIS, sob outro conceito: duas linhas, um código.
  ('CONTINUIDADE_RETORNOS', 'paciente', 'principal', 'NAO_TENHO_PREFERENCIA', 'Não tenho preferência', false, 5, true, '1.1.0'),

  -- P6 · CONTINUIDADE_CANAIS — múltipla escolha (multi: true)
  ('CONTINUIDADE_CANAIS', 'paciente', 'principal', 'PODER_MANDAR_MENSAGEM', 'Poder mandar mensagem', false, 1, true, '1.1.0'),
  ('CONTINUIDADE_CANAIS', 'paciente', 'principal', 'TELEFONE_PARA_LIGAR', 'Um telefone para ligar', false, 2, true, '1.1.0'),
  ('CONTINUIDADE_CANAIS', 'paciente', 'principal', 'CONTATO_PARA_URGENCIA_FORA_DO_HORARIO', 'Contato para urgência fora do horário', false, 3, true, '1.1.0'),
  ('CONTINUIDADE_CANAIS', 'paciente', 'principal', 'BASTA_REAGENDAR', 'Basta poder reagendar', false, 4, true, '1.1.0'),
  ('CONTINUIDADE_CANAIS', 'paciente', 'principal', 'NAO_TENHO_PREFERENCIA', 'Não tenho preferência', false, 5, true, '1.1.0'),

  -- P7 · CONTINUIDADE_COORDENACAO — escolha única (multi: false)
  ('CONTINUIDADE_COORDENACAO', 'paciente', 'principal', 'SIM', 'Sim', false, 1, true, '1.1.0'),
  ('CONTINUIDADE_COORDENACAO', 'paciente', 'principal', 'NAO', 'Não', false, 2, true, '1.1.0'),
  ('CONTINUIDADE_COORDENACAO', 'paciente', 'principal', 'NAO_SEI_INFORMAR', 'Não sei informar', false, 3, true, '1.1.0')
on conflict do nothing;
