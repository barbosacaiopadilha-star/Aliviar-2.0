-- ============================================================================
-- CATÁLOGO CANÔNICO 1.0.0 (Release de Reconstrução, ETAPA 3)
--
-- Materializa o catálogo aprovado em docs/curadoria/CATALOGO_CANONICO_PROPOSTA.md
-- e docs/curadoria/CATALOGO_CANONICO_OPERACAO.md (§ Plano, item 1):
--   26 → 28 conceitos, 5 eixos.
--   + CONTINUIDADE_CANAIS, PRATICA_LIMITES_DE_ATUACAO (novos)
--   + VIABILIDADE_COBERTURA_E_CONVENIO, VIABILIDADE_CUSTO_E_PAGAMENTO (decisão
--     de Método de 2026-07-31; fora da matriz do Motor, cruzamento humano)
--   fusões: CASOS_SEMELHANTES + CONDICAO_OU_PROCEDIMENTO → EXPERIENCIA_NO_TIPO_DE_CASO
--           PRODUCAO_ACADEMICA + ENSINO_E_PESQUISA → HISTORICO_ATIVIDADE_ACADEMICA
--   remoção: HISTORICO_REGULARIDADE (duplicava registration_status)
--   renomeação: ACESSO_LOCALIZACAO → ACESSO_LOCAL_DE_ATENDIMENTO (código novo)
--   formalização: HISTORICO_AREAS_DE_ATUACAO (já existia como
--     professional_practice_areas; vira conceito do catálogo)
--
-- Regras de segurança de dados (ADR-039 item 6 e OPERACAO § Plano):
--   * NENHUM DELETE. Sair de circulação é active=false.
--   * Nenhum backfill automático de mapeamento: linhas de case_priority_map e
--     professional_subcriterion_map apontando para códigos desativados
--     permanecem legíveis como histórico (a ETAPA 4 da release migra com
--     proveniência, em passo próprio).
--   * Idempotente: reexecutar não duplica nem regride nada.
--
-- Rollback: nenhuma coluna ou linha é removida por esta migration; o retorno
-- ao estado anterior é `update ... set active = (catalog_version = '0.9.0')`
-- — o catálogo legado volta a ser o vigente e o 1.0.0 fica adormecido.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Estrutura: eixo, versão, contrato de pergunta e cruzamento
-- ----------------------------------------------------------------------------

alter table curadoria.method_subcriteria
  drop constraint if exists method_subcriteria_group_check;

alter table curadoria.method_subcriteria
  add constraint method_subcriteria_group_check check ("group" in (
    'FORMACAO', 'EXPERIENCIA', 'HISTORICO',
    'ACESSO', 'CONTINUIDADE_DO_CUIDADO', 'MODELO_DE_ATENDIMENTO',
    'VIABILIDADE'
  ));

alter table curadoria.method_subcriteria
  add column if not exists axis text,
  add column if not exists catalog_version text not null default '0.9.0',
  add column if not exists professional_question text,
  add column if not exists patient_question text,
  add column if not exists response_type text
    check (response_type in ('multipla_escolha', 'escolha_unica', 'estruturado', 'texto_guiado', 'reconhecida_pelo_curador')),
  add column if not exists cruzamento text
    check (cruzamento in ('automatico', 'humano', 'misto')),
  add column if not exists required boolean not null default false,
  add column if not exists conditional_rules jsonb not null default '[]'::jsonb,
  add column if not exists evidence_source text,
  add column if not exists review_months smallint;

comment on column curadoria.method_subcriteria.axis is
  'Um dos 5 eixos do Catalogo 1.0.0: ACESSO_AO_CUIDADO, CONTINUIDADE_DO_CUIDADO, MODELO_DE_ATENDIMENTO, PRATICA_E_TRAJETORIA, VIABILIDADE_DE_ACESSO. "group" permanece como subgrupo historico (Formacao/Experiencia/Historico dentro de Pratica e Trajetoria).';
comment on column curadoria.method_subcriteria.required is
  'Sempre false por Invariante 34: ausencia e lacuna declarada, nunca bloqueio de cadastro. A coluna existe para o contrato ser explicito, nao para ser ligada por conveniencia.';
comment on column curadoria.method_subcriteria.conditional_rules is
  'Regras condicionais declarativas: [{"when": {"field": "principal", "value": "X"}, "show": "campo"} | {"when": ..., "require_detail": true}]. A interface le daqui; nenhuma lista paralela em codigo.';
comment on column curadoria.method_subcriteria.cruzamento is
  'automatico = declaracao contra declaracao; humano = leitura do Curador, sempre; misto = automatico para parte do conceito (documentado na descricao). Viabilidade e todo o eixo Pratica e Trajetoria sao humanos por decisao de Metodo.';

alter table curadoria.method_subcriteria
  drop constraint if exists method_subcriteria_axis_check;

alter table curadoria.method_subcriteria
  add constraint method_subcriteria_axis_check check (axis is null or axis in (
    'ACESSO_AO_CUIDADO', 'CONTINUIDADE_DO_CUIDADO', 'MODELO_DE_ATENDIMENTO',
    'PRATICA_E_TRAJETORIA', 'VIABILIDADE_DE_ACESSO'
  ));

-- Alternativas e campos complementares dos dois lados, por conceito.
create table if not exists curadoria.method_subcriterion_options (
  id uuid primary key default gen_random_uuid(),
  subcriterion_code text not null references curadoria.method_subcriteria (code) on update cascade,
  side text not null check (side in ('profissional', 'paciente')),
  field text not null default 'principal',
  value text not null,
  label text not null check (length(btrim(label)) > 0),
  requires_detail boolean not null default false,
  detail_kind text,
  display_order smallint not null check (display_order > 0),
  active boolean not null default true,
  catalog_version text not null default '1.0.0',
  created_at timestamptz not null default now(),

  unique (subcriterion_code, side, field, value)
);

comment on table curadoria.method_subcriterion_options is
  'Alternativas fechadas do Catalogo Canonico, por conceito, lado (profissional/paciente) e campo (principal ou complementar, ex.: frequencia_habitual). Nenhum modulo mantem lista propria (ADR-039 item 1). requires_detail marca opcoes que exigem condicao/lista estruturada (ex.: CONVENIOS_SELECIONADOS sem lista de operadoras e invalido).';

alter table curadoria.method_subcriterion_options enable row level security;
grant select on curadoria.method_subcriterion_options to authenticated;
grant all on curadoria.method_subcriterion_options to service_role;

drop policy if exists "subcriterion_options_select_authenticated" on curadoria.method_subcriterion_options;
create policy "subcriterion_options_select_authenticated"
  on curadoria.method_subcriterion_options for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- 2. Marcar o legado e classificar o que permanece
-- ----------------------------------------------------------------------------

-- Tudo que existia pertence à versão 0.9.0 (o "catálogo dos 26").
update curadoria.method_subcriteria
  set catalog_version = '0.9.0'
  where catalog_version = '0.9.0';

-- Saem de circulação (nunca DELETE):
update curadoria.method_subcriteria set active = false, updated_at = now()
  where code in (
    'HISTORICO_REGULARIDADE',            -- duplicava registration_status
    'EXPERIENCIA_CASOS_SEMELHANTES',     -- fundido em EXPERIENCIA_NO_TIPO_DE_CASO
    'EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO',
    'HISTORICO_PRODUCAO_ACADEMICA',      -- fundido em HISTORICO_ATIVIDADE_ACADEMICA
    'HISTORICO_ENSINO_E_PESQUISA',
    'ACESSO_LOCALIZACAO'                 -- renomeado: ACESSO_LOCAL_DE_ATENDIMENTO
  );

-- Os que permanecem ganham eixo, versão 1.0.0 e o contrato de pergunta.
-- (Descrições estreitadas onde o catálogo estreitou — MODELO_COMUNICACAO,
-- MODELO_DECISAO_COMPARTILHADA, MODELO_PREFERENCIAS_E_RESTRICOES,
-- FORMACAO_COMPLEMENTAR.)
update curadoria.method_subcriteria set
  axis = 'ACESSO_AO_CUIDADO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'multipla_escolha',
  professional_question = 'Em quais formatos você atende hoje?',
  patient_question = 'Como você consegue ser atendida?',
  evidence_source = 'institucional', review_months = 6,
  conditional_rules = '[{"when":{"field":"principal","value":"PRIMEIRA_REMOTA_CONDICIONADA"},"require_detail":true},{"when":{"field":"principal","value":"HIBRIDO_CONFORME_O_CASO"},"require_detail":true}]'::jsonb,
  updated_at = now()
  where code = 'ACESSO_MODALIDADE';

update curadoria.method_subcriteria set
  axis = 'ACESSO_AO_CUIDADO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'multipla_escolha',
  professional_question = 'Em quais janelas você atende habitualmente?',
  patient_question = 'Quando você consegue ser atendida?',
  evidence_source = 'institucional', review_months = 3,
  updated_at = now()
  where code = 'ACESSO_DISPONIBILIDADE';

update curadoria.method_subcriteria set
  axis = 'ACESSO_AO_CUIDADO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'escolha_unica',
  name = 'Prazo para a primeira consulta',
  professional_question = 'Qual o prazo habitual para a primeira consulta?',
  patient_question = 'Em quanto tempo você precisa ser atendida?',
  evidence_source = 'institucional', review_months = 3,
  conditional_rules = '[{"when":{"field":"principal","value":"VARIA_CONFORME_O_CASO"},"require_detail":true}]'::jsonb,
  updated_at = now()
  where code = 'ACESSO_PRAZO_PARA_CONSULTA';

update curadoria.method_subcriteria set
  axis = 'CONTINUIDADE_DO_CUIDADO', catalog_version = '1.0.0', cruzamento = 'misto',
  response_type = 'multipla_escolha',
  professional_question = 'Após a primeira consulta, quais dessas condutas você costuma adotar?',
  patient_question = 'Como você gostaria que fosse o acompanhamento depois da primeira consulta?',
  evidence_source = 'institucional', review_months = 12,
  conditional_rules = '[{"when":{"field":"principal","value":"RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA"},"show":"frequencia_habitual"},{"when":{"field":"frequencia_habitual","value":"DEPENDE_DA_EVOLUCAO"},"require_detail":true}]'::jsonb,
  updated_at = now()
  where code = 'CONTINUIDADE_RETORNOS';

update curadoria.method_subcriteria set
  axis = 'CONTINUIDADE_DO_CUIDADO', catalog_version = '1.0.0', cruzamento = 'humano',
  response_type = 'multipla_escolha',
  professional_question = 'Após um procedimento que você realiza, quais condutas são habituais?',
  patient_question = null, -- reconhecida pelo Curador; a paciente raramente sabe formular antes
  evidence_source = 'entrevista', review_months = 12,
  conditional_rules = '[{"when":{"field":"principal","value":"NAO_REALIZA_PROCEDIMENTOS"},"hide":"duracao_habitual"}]'::jsonb,
  updated_at = now()
  where code = 'CONTINUIDADE_POS_PROCEDIMENTO';

update curadoria.method_subcriteria set
  axis = 'CONTINUIDADE_DO_CUIDADO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'multipla_escolha',
  professional_question = 'Quem mais acompanha as pessoas que você atende?',
  patient_question = 'Você precisa de acompanhamento de mais de um tipo de profissional?',
  evidence_source = 'institucional', review_months = 12,
  updated_at = now()
  where code = 'CONTINUIDADE_EQUIPE_DE_APOIO';

update curadoria.method_subcriteria set
  axis = 'CONTINUIDADE_DO_CUIDADO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'multipla_escolha',
  professional_question = 'Quando a pessoa já é acompanhada por outros profissionais, o que você costuma fazer?',
  patient_question = 'Você já é acompanhada por outros profissionais que precisariam conversar entre si?',
  evidence_source = 'entrevista', review_months = 12,
  updated_at = now()
  where code = 'CONTINUIDADE_COORDENACAO';

update curadoria.method_subcriteria set
  axis = 'MODELO_DE_ATENDIMENTO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'multipla_escolha',
  name = 'Como explica',
  description = 'Condutas observáveis de explicação, adaptação da linguagem e verificação de entendimento.',
  professional_question = 'Ao explicar um diagnóstico ou tratamento, quais dessas ações você costuma realizar?',
  patient_question = 'O que te ajudaria a entender melhor o que for explicado?',
  evidence_source = 'entrevista', review_months = 12,
  updated_at = now()
  where code = 'MODELO_COMUNICACAO';

update curadoria.method_subcriteria set
  axis = 'MODELO_DE_ATENDIMENTO', catalog_version = '1.0.0', cruzamento = 'humano',
  response_type = 'multipla_escolha',
  name = 'Como conduz decisões',
  description = 'Condutas observáveis diante de mais de uma alternativa adequada.',
  professional_question = 'Quando existem duas ou mais opções clinicamente adequadas, quais ações você costuma realizar antes da decisão?',
  patient_question = 'Quando houver mais de um caminho possível, como você gostaria de participar da decisão?',
  evidence_source = 'entrevista', review_months = 12,
  updated_at = now()
  where code = 'MODELO_DECISAO_COMPARTILHADA';

update curadoria.method_subcriteria set
  axis = 'MODELO_DE_ATENDIMENTO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'multipla_escolha',
  professional_question = 'Ao propor uma conduta, quais dessas você costuma apresentar?',
  patient_question = 'O que você precisa saber antes de aceitar um tratamento?',
  evidence_source = 'entrevista', review_months = 12,
  updated_at = now()
  where code = 'MODELO_ALTERNATIVAS';

update curadoria.method_subcriteria set
  axis = 'MODELO_DE_ATENDIMENTO', catalog_version = '1.0.0', cruzamento = 'automatico',
  response_type = 'multipla_escolha',
  name = 'Participação de acompanhantes',
  description = 'Abertura e condições para a presença de acompanhantes. Abertura à família não significa inclusão obrigatória.',
  professional_question = 'Como você conduz a presença de acompanhantes?',
  patient_question = 'Você quer que alguém participe das conversas?',
  evidence_source = 'entrevista', review_months = 12,
  updated_at = now()
  where code = 'MODELO_PARTICIPACAO_FAMILIAR';

update curadoria.method_subcriteria set
  axis = 'MODELO_DE_ATENDIMENTO', catalog_version = '1.0.0', cruzamento = 'humano',
  response_type = 'multipla_escolha',
  name = 'Respeito a recusas e restrições',
  description = 'Como o profissional lida com recusas explícitas e restrições pessoais, religiosas ou culturais. Texto livre da paciente nunca entra no Motor.',
  professional_question = 'Quando a pessoa recusa uma conduta ou tem restrição pessoal, religiosa ou cultural, o que você costuma fazer?',
  patient_question = 'Existe algo que você não aceita, ou que precisa ser respeitado no seu cuidado?',
  evidence_source = 'entrevista', review_months = 12,
  updated_at = now()
  where code = 'MODELO_PREFERENCIAS_E_RESTRICOES';

-- Prática e Trajetória (eixo 4) — cruzamento humano, sempre (P17).
update curadoria.method_subcriteria set
  axis = 'PRATICA_E_TRAJETORIA', catalog_version = '1.0.0', cruzamento = 'humano',
  response_type = 'estruturado',
  professional_question = case code
    when 'FORMACAO_GRADUACAO' then 'Instituição e ano de graduação'
    when 'FORMACAO_RESIDENCIA' then 'Residências concluídas'
    when 'FORMACAO_ESPECIALIZACAO' then 'Títulos de especialista'
    when 'FORMACAO_FELLOWSHIP' then 'Fellowships realizados'
    when 'FORMACAO_COMPLEMENTAR' then 'Outras formações relevantes'
    when 'HISTORICO_TRAJETORIA_INSTITUCIONAL' then 'Vínculos institucionais atuais e anteriores'
    else professional_question end,
  evidence_source = case code
    when 'FORMACAO_COMPLEMENTAR' then 'institucional'
    when 'HISTORICO_TRAJETORIA_INSTITUCIONAL' then 'oficial_primaria'
    else 'oficial_primaria' end,
  review_months = case code
    when 'FORMACAO_ESPECIALIZACAO' then 36
    when 'FORMACAO_COMPLEMENTAR' then 36
    when 'HISTORICO_TRAJETORIA_INSTITUCIONAL' then 12
    else 60 end,
  updated_at = now()
  where code in (
    'FORMACAO_GRADUACAO', 'FORMACAO_RESIDENCIA', 'FORMACAO_ESPECIALIZACAO',
    'FORMACAO_FELLOWSHIP', 'FORMACAO_COMPLEMENTAR', 'HISTORICO_TRAJETORIA_INSTITUCIONAL'
  );

update curadoria.method_subcriteria set
  description = 'Pós-graduação e cursos relevantes.',
  updated_at = now()
  where code = 'FORMACAO_COMPLEMENTAR';

update curadoria.method_subcriteria set
  axis = 'PRATICA_E_TRAJETORIA', catalog_version = '1.0.0', cruzamento = 'humano',
  response_type = 'escolha_unica',
  professional_question = 'Há quanto tempo atua na especialidade?',
  evidence_source = 'institucional', review_months = 12,
  updated_at = now()
  where code = 'EXPERIENCIA_TEMPO_DE_PRATICA';

update curadoria.method_subcriteria set
  axis = 'PRATICA_E_TRAJETORIA', catalog_version = '1.0.0', cruzamento = 'humano',
  response_type = 'escolha_unica',
  professional_question = 'Com que frequência atende esse tipo de caso?',
  evidence_source = 'institucional', review_months = 12,
  updated_at = now()
  where code = 'EXPERIENCIA_VOLUME_DE_ATUACAO';

-- ----------------------------------------------------------------------------
-- 3. Os conceitos novos do 1.0.0
-- ----------------------------------------------------------------------------

insert into curadoria.method_subcriteria
  (code, "group", name, description, display_order, active, axis, catalog_version,
   professional_question, patient_question, response_type, cruzamento,
   conditional_rules, evidence_source, review_months)
values
  ('ACESSO_LOCAL_DE_ATENDIMENTO', 'ACESSO', 'Local de atendimento',
   'Onde o profissional atende presencialmente. Substitui ACESSO_LOCALIZACAO: o juízo de deslocamento passa ao lado da paciente.',
   5, true, 'ACESSO_AO_CUIDADO', '1.0.0',
   'Em quais endereços você atende presencialmente?',
   'De onde você pode se deslocar, e até onde?',
   'estruturado', 'misto',
   '[]'::jsonb, 'institucional', 6),

  ('CONTINUIDADE_CANAIS', 'CONTINUIDADE_DO_CUIDADO', 'Canais entre consultas',
   'Por onde e em que condições a pessoa pode falar com o profissional ou a equipe entre consultas. NAO_HA_CANAL é fato declarado, não defeito.',
   5, true, 'CONTINUIDADE_DO_CUIDADO', '1.0.0',
   'Entre uma consulta e outra, como a pessoa consegue contato?',
   'Você precisa conseguir falar com alguém entre as consultas?',
   'multipla_escolha', 'automatico',
   '[{"when":{"field":"principal","value_not":"NAO_HA_CANAL_ENTRE_CONSULTAS"},"show":"prazo_de_resposta"}]'::jsonb,
   'institucional', 6),

  ('EXPERIENCIA_NO_TIPO_DE_CASO', 'EXPERIENCIA', 'Experiência no tipo de caso',
   'Experiência na condição/procedimento e em casos semelhantes. Fusão de EXPERIENCIA_CASOS_SEMELHANTES e EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO.',
   5, true, 'PRATICA_E_TRAJETORIA', '1.0.0',
   'Com quais condições e procedimentos você tem prática regular?',
   null,
   'estruturado', 'humano',
   '[]'::jsonb, 'institucional', 12),

  ('PRATICA_LIMITES_DE_ATUACAO', 'EXPERIENCIA', 'Limites de atuação',
   'O que o profissional NÃO atende e quando encaminha. Protege a paciente: sem ele, a incompatibilidade só aparece na consulta — depois da espera, do deslocamento e do custo. É a Área de Atuação em negativo, e alimenta o filtro eliminatório da Curadoria.',
   6, true, 'PRATICA_E_TRAJETORIA', '1.0.0',
   'Quais situações você não atende e encaminha?',
   null,
   'estruturado', 'humano',
   '[]'::jsonb, 'entrevista', 12),

  ('HISTORICO_ATIVIDADE_ACADEMICA', 'HISTORICO', 'Atividade acadêmica',
   'Produção científica, ensino e formação de outros. Fusão de HISTORICO_PRODUCAO_ACADEMICA e HISTORICO_ENSINO_E_PESQUISA.',
   5, true, 'PRATICA_E_TRAJETORIA', '1.0.0',
   'Atividade acadêmica',
   null,
   'multipla_escolha', 'humano',
   '[]'::jsonb, 'publica_secundaria', 24),

  ('HISTORICO_AREAS_DE_ATUACAO', 'HISTORICO', 'Áreas de atuação',
   'Áreas em que atua hoje. Formalização: já existia como professional_practice_areas; passa a ser conceito do catálogo.',
   6, true, 'PRATICA_E_TRAJETORIA', '1.0.0',
   'Áreas em que atua hoje',
   null,
   'estruturado', 'humano',
   '[]'::jsonb, 'institucional', 12),

  ('VIABILIDADE_COBERTURA_E_CONVENIO', 'VIABILIDADE', 'Cobertura e convênio',
   'Por quais formas de cobertura o profissional atende, e o que a pessoa precisa usar. Fora da matriz do Motor: sinaliza barreira objetiva, nunca elimina nem ranqueia.',
   1, true, 'VIABILIDADE_DE_ACESSO', '1.0.0',
   'Por quais formas de cobertura você atende hoje?',
   'Como você pretende usar sua cobertura?',
   'multipla_escolha', 'humano',
   '[{"when":{"field":"principal","value":"CONVENIOS_SELECIONADOS"},"require_detail":true},{"when":{"field":"principal","value":"SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA"},"require_detail":true}]'::jsonb,
   'institucional', 3),

  ('VIABILIDADE_CUSTO_E_PAGAMENTO', 'VIABILIDADE', 'Custo e pagamento',
   'O custo declarado do atendimento e as formas de pagá-lo. Fora da matriz do Motor: proibido comparar faixas entre profissionais ou ordenar por preço (ADR-041 item 4).',
   2, true, 'VIABILIDADE_DE_ACESSO', '1.0.0',
   'Qual o custo da primeira consulta e como pode ser pago?',
   'O que precisa ser verdade para você conseguir pagar?',
   'estruturado', 'humano',
   '[{"when":{"field":"faixa","value":"SUJEITO_A_CONFIRMACAO"},"require_detail":true},{"when":{"field":"formas","value":"CARTAO_PARCELADO"},"require_detail":true}]'::jsonb,
   'institucional', 3)
on conflict (code) do update set
  "group" = excluded."group",
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  active = excluded.active,
  axis = excluded.axis,
  catalog_version = excluded.catalog_version,
  professional_question = excluded.professional_question,
  patient_question = excluded.patient_question,
  response_type = excluded.response_type,
  cruzamento = excluded.cruzamento,
  conditional_rules = excluded.conditional_rules,
  evidence_source = excluded.evidence_source,
  review_months = excluded.review_months,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 4. Alternativas fechadas (lado do profissional e da paciente)
-- ----------------------------------------------------------------------------

insert into curadoria.method_subcriterion_options
  (subcriterion_code, side, field, value, label, requires_detail, detail_kind, display_order)
values
  -- ACESSO_MODALIDADE · profissional
  ('ACESSO_MODALIDADE','profissional','principal','PRESENCIAL','Presencial',false,null,1),
  ('ACESSO_MODALIDADE','profissional','principal','REMOTO','Remoto',false,null,2),
  ('ACESSO_MODALIDADE','profissional','principal','PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS','Primeira presencial, retornos remotos',false,null,3),
  ('ACESSO_MODALIDADE','profissional','principal','PRIMEIRA_REMOTA_CONDICIONADA','Primeira remota, sob condição',true,'condicao_estruturada',4),
  ('ACESSO_MODALIDADE','profissional','principal','HIBRIDO_CONFORME_O_CASO','Híbrido, conforme o caso',true,'condicao_estruturada',5),
  -- ACESSO_MODALIDADE · paciente
  ('ACESSO_MODALIDADE','paciente','principal','PRECISO_REMOTO','Preciso de atendimento remoto',false,null,1),
  ('ACESSO_MODALIDADE','paciente','principal','PREFIRO_REMOTO','Prefiro remoto',false,null,2),
  ('ACESSO_MODALIDADE','paciente','principal','PRECISO_PRESENCIAL','Preciso de atendimento presencial',false,null,3),
  ('ACESSO_MODALIDADE','paciente','principal','PREFIRO_PRESENCIAL','Prefiro presencial',false,null,4),
  ('ACESSO_MODALIDADE','paciente','principal','TANTO_FAZ','Tanto faz',false,null,5),
  ('ACESSO_MODALIDADE','paciente','principal','NAO_SEI_INFORMAR','Não sei informar',false,null,6),

  -- ACESSO_LOCAL_DE_ATENDIMENTO · profissional (tipo de local; cidade/UF são campos estruturados)
  ('ACESSO_LOCAL_DE_ATENDIMENTO','profissional','tipo_de_local','CONSULTORIO','Consultório',false,null,1),
  ('ACESSO_LOCAL_DE_ATENDIMENTO','profissional','tipo_de_local','HOSPITAL','Hospital',false,null,2),
  ('ACESSO_LOCAL_DE_ATENDIMENTO','profissional','tipo_de_local','CLINICA','Clínica',false,null,3),
  ('ACESSO_LOCAL_DE_ATENDIMENTO','profissional','tipo_de_local','AMBULATORIO','Ambulatório',false,null,4),
  -- ACESSO_LOCAL_DE_ATENDIMENTO · paciente
  ('ACESSO_LOCAL_DE_ATENDIMENTO','paciente','deslocamento','ATE_30_MIN','Até 30 minutos',false,null,1),
  ('ACESSO_LOCAL_DE_ATENDIMENTO','paciente','deslocamento','ATE_1H','Até 1 hora',false,null,2),
  ('ACESSO_LOCAL_DE_ATENDIMENTO','paciente','deslocamento','ATE_2H','Até 2 horas',false,null,3),
  ('ACESSO_LOCAL_DE_ATENDIMENTO','paciente','deslocamento','QUALQUER_DISTANCIA','Qualquer distância',false,null,4),
  ('ACESSO_LOCAL_DE_ATENDIMENTO','paciente','deslocamento','NAO_POSSO_ME_DESLOCAR','Não posso me deslocar',false,null,5),

  -- ACESSO_DISPONIBILIDADE · profissional
  ('ACESSO_DISPONIBILIDADE','profissional','principal','MANHA_DIAS_UTEIS','Manhã, dias úteis',false,null,1),
  ('ACESSO_DISPONIBILIDADE','profissional','principal','TARDE_DIAS_UTEIS','Tarde, dias úteis',false,null,2),
  ('ACESSO_DISPONIBILIDADE','profissional','principal','NOITE_APOS_18H','Noite, após 18h',false,null,3),
  ('ACESSO_DISPONIBILIDADE','profissional','principal','SABADO','Sábado',false,null,4),
  ('ACESSO_DISPONIBILIDADE','profissional','principal','DOMINGO_OU_FERIADO','Domingo ou feriado',false,null,5),
  ('ACESSO_DISPONIBILIDADE','profissional','principal','SOB_AGENDAMENTO_ESPECIFICO','Sob agendamento específico',false,null,6),

  -- ACESSO_PRAZO_PARA_CONSULTA · profissional
  ('ACESSO_PRAZO_PARA_CONSULTA','profissional','principal','ATE_7_DIAS','Até 7 dias',false,null,1),
  ('ACESSO_PRAZO_PARA_CONSULTA','profissional','principal','DE_8_A_15_DIAS','De 8 a 15 dias',false,null,2),
  ('ACESSO_PRAZO_PARA_CONSULTA','profissional','principal','DE_16_A_30_DIAS','De 16 a 30 dias',false,null,3),
  ('ACESSO_PRAZO_PARA_CONSULTA','profissional','principal','DE_31_A_60_DIAS','De 31 a 60 dias',false,null,4),
  ('ACESSO_PRAZO_PARA_CONSULTA','profissional','principal','MAIS_DE_60_DIAS','Mais de 60 dias',false,null,5),
  ('ACESSO_PRAZO_PARA_CONSULTA','profissional','principal','VARIA_CONFORME_O_CASO','Varia conforme o caso',true,'condicao_estruturada',6),

  -- CONTINUIDADE_RETORNOS · profissional
  ('CONTINUIDADE_RETORNOS','profissional','principal','RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA','Retorno programado na própria consulta',false,null,1),
  ('CONTINUIDADE_RETORNOS','profissional','principal','RETORNO_CONFORME_EVOLUCAO','Retorno conforme a evolução',false,null,2),
  ('CONTINUIDADE_RETORNOS','profissional','principal','RETORNO_APENAS_SE_SOLICITADO','Retorno apenas se solicitado',false,null,3),
  ('CONTINUIDADE_RETORNOS','profissional','principal','ENVIA_ORIENTACAO_ESCRITA','Envia orientação escrita',false,null,4),
  ('CONTINUIDADE_RETORNOS','profissional','principal','REAVALIA_EXAMES_ENTRE_CONSULTAS','Reavalia exames entre consultas',false,null,5),
  ('CONTINUIDADE_RETORNOS','profissional','frequencia_habitual','ATE_30_DIAS','Até 30 dias',false,null,1),
  ('CONTINUIDADE_RETORNOS','profissional','frequencia_habitual','DE_1_A_3_MESES','De 1 a 3 meses',false,null,2),
  ('CONTINUIDADE_RETORNOS','profissional','frequencia_habitual','DE_3_A_6_MESES','De 3 a 6 meses',false,null,3),
  ('CONTINUIDADE_RETORNOS','profissional','frequencia_habitual','ACIMA_DE_6_MESES','Acima de 6 meses',false,null,4),
  ('CONTINUIDADE_RETORNOS','profissional','frequencia_habitual','DEPENDE_DA_EVOLUCAO','Depende da evolução',true,'condicao_estruturada',5),

  -- CONTINUIDADE_CANAIS · profissional
  ('CONTINUIDADE_CANAIS','profissional','principal','MENSAGEM_DIRETA_COM_O_PROFISSIONAL','Mensagem direta com o profissional',false,null,1),
  ('CONTINUIDADE_CANAIS','profissional','principal','MENSAGEM_COM_A_EQUIPE_OU_SECRETARIA','Mensagem com a equipe ou secretaria',false,null,2),
  ('CONTINUIDADE_CANAIS','profissional','principal','TELEFONE_EM_HORARIO_COMERCIAL','Telefone em horário comercial',false,null,3),
  ('CONTINUIDADE_CANAIS','profissional','principal','PORTAL_OU_APLICATIVO','Portal ou aplicativo',false,null,4),
  ('CONTINUIDADE_CANAIS','profissional','principal','CONTATO_DE_URGENCIA_FORA_DO_HORARIO','Contato de urgência fora do horário',false,null,5),
  ('CONTINUIDADE_CANAIS','profissional','principal','APENAS_REAGENDAMENTO','Apenas reagendamento',false,null,6),
  ('CONTINUIDADE_CANAIS','profissional','principal','NAO_HA_CANAL_ENTRE_CONSULTAS','Não há canal entre consultas',false,null,7),
  ('CONTINUIDADE_CANAIS','profissional','prazo_de_resposta','MESMO_DIA','Mesmo dia',false,null,1),
  ('CONTINUIDADE_CANAIS','profissional','prazo_de_resposta','ATE_48H','Até 48h',false,null,2),
  ('CONTINUIDADE_CANAIS','profissional','prazo_de_resposta','ATE_5_DIAS_UTEIS','Até 5 dias úteis',false,null,3),
  ('CONTINUIDADE_CANAIS','profissional','prazo_de_resposta','SEM_PRAZO_DEFINIDO','Sem prazo definido',false,null,4),

  -- CONTINUIDADE_POS_PROCEDIMENTO · profissional
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','principal','ACOMPANHA_PESSOALMENTE_TODO_O_POS','Acompanha pessoalmente todo o pós',false,null,1),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','principal','ACOMPANHA_COM_EQUIPE','Acompanha com equipe',false,null,2),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','principal','ACOMPANHA_ATE_ALTA_E_ENCAMINHA','Acompanha até a alta e encaminha',false,null,3),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','principal','ENCAMINHA_PARA_OUTRO_PROFISSIONAL','Encaminha para outro profissional',false,null,4),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','principal','NAO_REALIZA_PROCEDIMENTOS','Não realiza procedimentos',false,null,5),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','duracao_habitual','ATE_30_DIAS','Até 30 dias',false,null,1),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','duracao_habitual','ATE_90_DIAS','Até 90 dias',false,null,2),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','duracao_habitual','ATE_6_MESES','Até 6 meses',false,null,3),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','duracao_habitual','ACIMA_DE_6_MESES','Acima de 6 meses',false,null,4),
  ('CONTINUIDADE_POS_PROCEDIMENTO','profissional','duracao_habitual','CONFORME_O_PROCEDIMENTO','Conforme o procedimento',false,null,5),

  -- CONTINUIDADE_EQUIPE_DE_APOIO · profissional
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','ENFERMAGEM','Enfermagem',false,null,1),
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','SECRETARIA_CLINICA','Secretaria clínica',false,null,2),
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','NUTRICAO','Nutrição',false,null,3),
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','PSICOLOGIA','Psicologia',false,null,4),
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','FISIOTERAPIA','Fisioterapia',false,null,5),
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','SERVICO_SOCIAL','Serviço social',false,null,6),
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','OUTRO_PROFISSIONAL_DA_EQUIPE','Outro profissional da equipe',false,null,7),
  ('CONTINUIDADE_EQUIPE_DE_APOIO','profissional','principal','ATUA_SEM_EQUIPE_FIXA','Atua sem equipe fixa',false,null,8),

  -- CONTINUIDADE_COORDENACAO · profissional
  ('CONTINUIDADE_COORDENACAO','profissional','principal','CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL','Contata diretamente o outro profissional',false,null,1),
  ('CONTINUIDADE_COORDENACAO','profissional','principal','ENVIA_RELATORIO_ESCRITO','Envia relatório escrito',false,null,2),
  ('CONTINUIDADE_COORDENACAO','profissional','principal','PARTICIPA_DE_DISCUSSAO_DE_CASO','Participa de discussão de caso',false,null,3),
  ('CONTINUIDADE_COORDENACAO','profissional','principal','ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO','Orienta a pessoa a levar a informação',false,null,4),
  ('CONTINUIDADE_COORDENACAO','profissional','principal','ATUA_DE_FORMA_INDEPENDENTE','Atua de forma independente',false,null,5),

  -- MODELO_COMUNICACAO · profissional
  ('MODELO_COMUNICACAO','profissional','principal','ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR','Adapta a linguagem ao interlocutor',false,null,1),
  ('MODELO_COMUNICACAO','profissional','principal','VERIFICA_SE_A_PESSOA_COMPREENDEU','Verifica se a pessoa compreendeu',false,null,2),
  ('MODELO_COMUNICACAO','profissional','principal','REEXPLICA_DE_OUTRA_FORMA_QUANDO_NECESSARIO','Reexplica de outra forma quando necessário',false,null,3),
  ('MODELO_COMUNICACAO','profissional','principal','USA_APOIO_VISUAL_OU_DESENHO','Usa apoio visual ou desenho',false,null,4),
  ('MODELO_COMUNICACAO','profissional','principal','ENVIA_RESUMO_ESCRITO','Envia resumo escrito',false,null,5),
  ('MODELO_COMUNICACAO','profissional','principal','RESERVA_TEMPO_PARA_PERGUNTAS','Reserva tempo para perguntas',false,null,6),
  ('MODELO_COMUNICACAO','profissional','principal','AUTORIZA_GRAVACAO_DA_CONSULTA','Autoriza gravação da consulta',false,null,7),

  -- MODELO_DECISAO_COMPARTILHADA · profissional
  ('MODELO_DECISAO_COMPARTILHADA','profissional','principal','APRESENTA_TODAS_AS_OPCOES_ADEQUADAS','Apresenta todas as opções adequadas',false,null,1),
  ('MODELO_DECISAO_COMPARTILHADA','profissional','principal','EXPLICA_RISCOS_E_BENEFICIOS_DE_CADA_UMA','Explica riscos e benefícios de cada uma',false,null,2),
  ('MODELO_DECISAO_COMPARTILHADA','profissional','principal','PERGUNTA_O_QUE_IMPORTA_PARA_A_PESSOA','Pergunta o que importa para a pessoa',false,null,3),
  ('MODELO_DECISAO_COMPARTILHADA','profissional','principal','OFERECE_TEMPO_PARA_DECIDIR','Oferece tempo para decidir',false,null,4),
  ('MODELO_DECISAO_COMPARTILHADA','profissional','principal','SUGERE_SEGUNDA_OPINIAO_QUANDO_PERTINENTE','Sugere segunda opinião quando pertinente',false,null,5),
  ('MODELO_DECISAO_COMPARTILHADA','profissional','principal','RECOMENDA_UMA_OPCAO_E_EXPLICA_O_PORQUE','Recomenda uma opção e explica o porquê',false,null,6),
  ('MODELO_DECISAO_COMPARTILHADA','profissional','principal','DECIDE_E_COMUNICA_A_CONDUTA','Decide e comunica a conduta',false,null,7),
  -- MODELO_DECISAO_COMPARTILHADA · paciente
  ('MODELO_DECISAO_COMPARTILHADA','paciente','principal','QUERO_DECIDIR_COM_ORIENTACAO','Quero decidir, com orientação',false,null,1),
  ('MODELO_DECISAO_COMPARTILHADA','paciente','principal','QUERO_QUE_O_MEDICO_RECOMENDE_E_EU_CONFIRMO','Quero que o médico recomende e eu confirmo',false,null,2),
  ('MODELO_DECISAO_COMPARTILHADA','paciente','principal','PREFIRO_QUE_O_MEDICO_DECIDA','Prefiro que o médico decida',false,null,3),
  ('MODELO_DECISAO_COMPARTILHADA','paciente','principal','NAO_SEI_AINDA','Não sei ainda',false,null,4),

  -- MODELO_ALTERNATIVAS · profissional
  ('MODELO_ALTERNATIVAS','profissional','principal','OPCOES_DE_TRATAMENTO_DISPONIVEIS','Opções de tratamento disponíveis',false,null,1),
  ('MODELO_ALTERNATIVAS','profissional','principal','OPCAO_DE_ACOMPANHAR_SEM_INTERVIR','Opção de acompanhar sem intervir',false,null,2),
  ('MODELO_ALTERNATIVAS','profissional','principal','RISCOS_DE_CADA_CAMINHO','Riscos de cada caminho',false,null,3),
  ('MODELO_ALTERNATIVAS','profissional','principal','O_QUE_ACONTECE_SE_NADA_FOR_FEITO','O que acontece se nada for feito',false,null,4),
  ('MODELO_ALTERNATIVAS','profissional','principal','LIMITES_DO_QUE_SE_SABE_HOJE','Limites do que se sabe hoje',false,null,5),
  ('MODELO_ALTERNATIVAS','profissional','principal','CUSTO_E_COBERTURA_DE_CADA_OPCAO','Custo e cobertura de cada opção',false,null,6),

  -- MODELO_PARTICIPACAO_FAMILIAR · profissional
  ('MODELO_PARTICIPACAO_FAMILIAR','profissional','principal','ACOMPANHANTE_BEM_VINDO_SEMPRE','Acompanhante bem-vindo sempre',false,null,1),
  ('MODELO_PARTICIPACAO_FAMILIAR','profissional','principal','ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA','Acompanhante mediante autorização da pessoa',false,null,2),
  ('MODELO_PARTICIPACAO_FAMILIAR','profissional','principal','PARTE_DA_CONSULTA_A_SOS','Parte da consulta a sós',false,null,3),
  ('MODELO_PARTICIPACAO_FAMILIAR','profissional','principal','CONTATO_COM_FAMILIA_ENTRE_CONSULTAS_SE_AUTORIZADO','Contato com a família entre consultas, se autorizado',false,null,4),
  ('MODELO_PARTICIPACAO_FAMILIAR','profissional','principal','ATENDIMENTO_APENAS_INDIVIDUAL','Atendimento apenas individual',false,null,5),
  -- MODELO_PARTICIPACAO_FAMILIAR · paciente
  ('MODELO_PARTICIPACAO_FAMILIAR','paciente','principal','QUERO_ACOMPANHANTE_SEMPRE','Quero acompanhante sempre',false,null,1),
  ('MODELO_PARTICIPACAO_FAMILIAR','paciente','principal','EM_ALGUMAS_CONVERSAS','Em algumas conversas',false,null,2),
  ('MODELO_PARTICIPACAO_FAMILIAR','paciente','principal','PREFIRO_SOZINHA','Prefiro sozinha',false,null,3),
  ('MODELO_PARTICIPACAO_FAMILIAR','paciente','principal','NAO_TENHO_PREFERENCIA','Não tenho preferência',false,null,4),

  -- MODELO_PREFERENCIAS_E_RESTRICOES · profissional
  ('MODELO_PREFERENCIAS_E_RESTRICOES','profissional','principal','REGISTRA_A_RESTRICAO_NO_PRONTUARIO','Registra a restrição no prontuário',false,null,1),
  ('MODELO_PREFERENCIAS_E_RESTRICOES','profissional','principal','BUSCA_ALTERNATIVA_COMPATIVEL','Busca alternativa compatível',false,null,2),
  ('MODELO_PREFERENCIAS_E_RESTRICOES','profissional','principal','EXPLICA_CONSEQUENCIAS_E_MANTEM_O_ACOMPANHAMENTO','Explica consequências e mantém o acompanhamento',false,null,3),
  ('MODELO_PREFERENCIAS_E_RESTRICOES','profissional','principal','ENCAMINHA_QUANDO_NAO_PODE_ATENDER_A_RESTRICAO','Encaminha quando não pode atender à restrição',false,null,4),
  ('MODELO_PREFERENCIAS_E_RESTRICOES','profissional','principal','NAO_ACOMPANHA_QUEM_RECUSA_A_CONDUTA_INDICADA','Não acompanha quem recusa a conduta indicada',false,null,5),

  -- EXPERIENCIA_TEMPO_DE_PRATICA · profissional
  ('EXPERIENCIA_TEMPO_DE_PRATICA','profissional','principal','ATE_2','Até 2 anos',false,null,1),
  ('EXPERIENCIA_TEMPO_DE_PRATICA','profissional','principal','3_A_5','De 3 a 5 anos',false,null,2),
  ('EXPERIENCIA_TEMPO_DE_PRATICA','profissional','principal','6_A_10','De 6 a 10 anos',false,null,3),
  ('EXPERIENCIA_TEMPO_DE_PRATICA','profissional','principal','11_A_20','De 11 a 20 anos',false,null,4),
  ('EXPERIENCIA_TEMPO_DE_PRATICA','profissional','principal','MAIS_DE_20','Mais de 20 anos',false,null,5),

  -- EXPERIENCIA_VOLUME_DE_ATUACAO · profissional
  ('EXPERIENCIA_VOLUME_DE_ATUACAO','profissional','principal','SEMANALMENTE','Semanalmente',false,null,1),
  ('EXPERIENCIA_VOLUME_DE_ATUACAO','profissional','principal','MENSALMENTE','Mensalmente',false,null,2),
  ('EXPERIENCIA_VOLUME_DE_ATUACAO','profissional','principal','ALGUMAS_VEZES_AO_ANO','Algumas vezes ao ano',false,null,3),
  ('EXPERIENCIA_VOLUME_DE_ATUACAO','profissional','principal','RARAMENTE','Raramente',false,null,4),

  -- PRATICA_LIMITES_DE_ATUACAO · profissional
  ('PRATICA_LIMITES_DE_ATUACAO','profissional','encaminhamento','ENCAMINHA_COM_INDICACAO','Encaminha com indicação',false,null,1),
  ('PRATICA_LIMITES_DE_ATUACAO','profissional','encaminhamento','ENCAMINHA_SEM_INDICACAO','Encaminha sem indicação',false,null,2),

  -- HISTORICO_ATIVIDADE_ACADEMICA · profissional
  ('HISTORICO_ATIVIDADE_ACADEMICA','profissional','principal','PUBLICA_REGULARMENTE','Publica regularmente',false,null,1),
  ('HISTORICO_ATIVIDADE_ACADEMICA','profissional','principal','PUBLICOU_NO_PASSADO','Publicou no passado',false,null,2),
  ('HISTORICO_ATIVIDADE_ACADEMICA','profissional','principal','LECIONA','Leciona',false,null,3),
  ('HISTORICO_ATIVIDADE_ACADEMICA','profissional','principal','ORIENTA_RESIDENTES','Orienta residentes',false,null,4),
  ('HISTORICO_ATIVIDADE_ACADEMICA','profissional','principal','SEM_ATIVIDADE_ACADEMICA','Sem atividade acadêmica',false,null,5),

  -- VIABILIDADE_COBERTURA_E_CONVENIO · profissional
  ('VIABILIDADE_COBERTURA_E_CONVENIO','profissional','principal','EXCLUSIVAMENTE_PARTICULAR','Exclusivamente particular',false,null,1),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','profissional','principal','CONVENIOS_SELECIONADOS','Convênios selecionados',true,'lista_operadoras',2),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','profissional','principal','EMITE_DOCUMENTACAO_PARA_REEMBOLSO','Emite documentação para reembolso',false,null,3),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','profissional','principal','NAO_EMITE_DOCUMENTACAO_PARA_REEMBOLSO','Não emite documentação para reembolso',false,null,4),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','profissional','principal','SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA','Sujeito a confirmação administrativa',true,'condicao_estruturada',5),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','profissional','principal','NAO_INFORMADO','Não informado',false,null,6),
  -- VIABILIDADE_COBERTURA_E_CONVENIO · paciente
  ('VIABILIDADE_COBERTURA_E_CONVENIO','paciente','principal','PRECISO_USAR_ESTE_CONVENIO','Preciso usar este convênio',true,'operadora',1),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','paciente','principal','POSSO_USAR_REEMBOLSO','Posso usar reembolso',false,null,2),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','paciente','principal','ACEITO_ATENDIMENTO_PARTICULAR','Aceito atendimento particular',false,null,3),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','paciente','principal','PRECISO_CONFIRMAR_MINHA_COBERTURA','Preciso confirmar minha cobertura',false,null,4),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','paciente','principal','SEM_RESTRICAO_DECLARADA','Sem restrição declarada',false,null,5),
  ('VIABILIDADE_COBERTURA_E_CONVENIO','paciente','principal','NAO_SE_APLICA','Não se aplica',false,null,6),

  -- VIABILIDADE_CUSTO_E_PAGAMENTO · profissional
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','faixa','ATE_300','Até R$ 300',false,null,1),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','faixa','DE_301_A_600','De R$ 301 a R$ 600',false,null,2),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','faixa','DE_601_A_1000','De R$ 601 a R$ 1.000',false,null,3),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','faixa','DE_1001_A_2000','De R$ 1.001 a R$ 2.000',false,null,4),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','faixa','ACIMA_DE_2000','Acima de R$ 2.000',false,null,5),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','faixa','SUJEITO_A_CONFIRMACAO','Sujeito a confirmação',true,'condicao_estruturada',6),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','faixa','NAO_INFORMADO','Não informado',false,null,7),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','formas','DINHEIRO_OU_PIX','Dinheiro ou Pix',false,null,1),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','formas','CARTAO_A_VISTA','Cartão à vista',false,null,2),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','formas','CARTAO_PARCELADO','Cartão parcelado',true,'numero_parcelas',3),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','formas','TRANSFERENCIA','Transferência',false,null,4),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','formas','BOLETO','Boleto',false,null,5),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','custos_adicionais','EXAMES_NAO_INCLUSOS','Exames não inclusos',false,null,1),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','custos_adicionais','RETORNO_COBRADO_A_PARTE','Retorno cobrado à parte',false,null,2),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','custos_adicionais','TAXA_DE_PROCEDIMENTO','Taxa de procedimento',false,null,3),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','custos_adicionais','SEM_CUSTOS_ADICIONAIS_CONHECIDOS','Sem custos adicionais conhecidos',false,null,4),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','profissional','custos_adicionais','NAO_INFORMADO','Não informado',false,null,5),
  -- VIABILIDADE_CUSTO_E_PAGAMENTO · paciente
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','paciente','principal','TENHO_LIMITE_FINANCEIRO','Tenho limite financeiro',true,'faixa',1),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','paciente','principal','PRECISO_SABER_O_VALOR_ANTES_DE_ESCOLHER','Preciso saber o valor antes de escolher',false,null,2),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','paciente','principal','ACEITO_ATE_ESTA_FAIXA','Aceito até esta faixa',true,'faixa',3),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','paciente','principal','PRECISO_DE_PARCELAMENTO','Preciso de parcelamento',false,null,4),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','paciente','principal','NAO_DECLAREI_RESTRICAO','Não declarei restrição',false,null,5),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','paciente','principal','PREFIRO_NAO_INFORMAR','Prefiro não informar',false,null,6),
  ('VIABILIDADE_CUSTO_E_PAGAMENTO','paciente','principal','NAO_SE_APLICA','Não se aplica',false,null,7)
on conflict (subcriterion_code, side, field, value) do update set
  label = excluded.label,
  requires_detail = excluded.requires_detail,
  detail_kind = excluded.detail_kind,
  display_order = excluded.display_order,
  active = excluded.active,
  catalog_version = excluded.catalog_version;

-- ----------------------------------------------------------------------------
-- 5. Prova de fechamento: exatamente 28 ativos, todos com eixo e versão 1.0.0
-- ----------------------------------------------------------------------------

do $$
declare
  ativos integer;
  sem_eixo integer;
begin
  select count(*) into ativos from curadoria.method_subcriteria where active;
  if ativos <> 28 then
    raise exception 'Catálogo 1.0.0 inconsistente: % ativos (esperado 28).', ativos;
  end if;

  select count(*) into sem_eixo
    from curadoria.method_subcriteria where active and (axis is null or catalog_version <> '1.0.0');
  if sem_eixo <> 0 then
    raise exception 'Catálogo 1.0.0 inconsistente: % conceitos ativos sem eixo ou fora da versão 1.0.0.', sem_eixo;
  end if;
end $$;
