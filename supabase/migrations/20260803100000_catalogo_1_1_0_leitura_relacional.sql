-- ============================================================================
-- CATALOGO 1.1.0 — LEITURA RELACIONAL (ADR-065)
-- ============================================================================
-- Documento normativo: docs/curadoria/DOMINIO_COMPATIBILIDADE_RELACIONAL.md
-- Modelo da Curadoria v2.0, §7.2-R. Aprovado e congelado em 2026-08-03.
--
-- O que esta migration faz, na ordem:
--   0. Pré-verificações que abortam (estado esperado: 28 conceitos ativos 1.0.0).
--   1. Coluna `satisfied_by` em method_subcriterion_options (correspondência
--      opção-a-opção declarada na fonte única) + guarda de integridade.
--   2. Materializa o lado da pessoa de MODELO_COMUNICACAO (6 opções) e
--      MODELO_ALTERNATIVAS (4 opções), com satisfied_by — fim das listas
--      provisórias relacionais (as assistenciais P3–P7 permanecem: Bloco F).
--   3. Preenche satisfied_by nas opções vigentes da pessoa de
--      MODELO_PARTICIPACAO_FAMILIAR.
--   4. Insere o 29º conceito: MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS
--      (cruzamento humano; opções fechadas dos dois lados; sem satisfied_by).
--   5. Vigência única 1.1.0: conteúdo dos 28 conceitos vigentes inalterado —
--      a atualização é de vigência; defaults passam a '1.1.0'.
--
-- Toda escrita passa pelo catalog_guard (justificativa transacional +
-- catalog_change_log). Rollback documentado ao fim. Nenhum dado é perdido.
-- ============================================================================

-- Justificativa transacional exigida pelo catalog_guard (20260802165000).
select set_config(
  'curadoria.catalog_change_rationale',
  'ADR-065: Catalogo 1.1.0 — leitura relacional: lado da pessoa de MODELO_COMUNICACAO/MODELO_ALTERNATIVAS, satisfied_by, conceito MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS, virada de vigencia',
  true
);

-- ----------------------------------------------------------------------------
-- 0. Pré-verificações — abortam com diagnóstico, nunca corrigem em silêncio
-- ----------------------------------------------------------------------------

do $$
declare
  ativos int;
  fora_de_versao int;
begin
  select count(*) into ativos
  from curadoria.method_subcriteria where active;

  if ativos <> 28 then
    raise exception
      'Estado inesperado: % conceitos ativos (esperados 28 do Catalogo 1.0.0). Investigue antes de migrar.', ativos;
  end if;

  select count(*) into fora_de_versao
  from curadoria.method_subcriteria
  where active and catalog_version <> '1.0.0';

  if fora_de_versao > 0 then
    raise exception
      'Estado inesperado: % conceitos ativos fora da versao 1.0.0. A vigencia deve ser unica antes da virada.', fora_de_versao;
  end if;

  if exists (
    select 1 from curadoria.method_subcriteria
    where code = 'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS'
  ) then
    raise exception
      'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS ja existe — esta migration ja foi aplicada?';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 1. satisfied_by — a correspondência mora na fonte única
-- ----------------------------------------------------------------------------

alter table curadoria.method_subcriterion_options
  add column if not exists satisfied_by jsonb;

comment on column curadoria.method_subcriterion_options.satisfied_by is
  'ADR-065: correspondencia opcao-a-opcao da leitura relacional. Presente APENAS em opcoes de lado paciente de conceitos com cruzamento automatico. Array JSON de values do lado profissional (field principal) do MESMO conceito, ou ["*"] = satisfeita por qualquer declaracao vigente do conceito. NULL = opcao fora do mecanismo (conceito humano, lado profissional, ou fora do cruzamento). A comparacao e por identidade de codigo, nunca por rotulo (ADR-041).';

create or replace function curadoria.satisfied_by_check()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  alvo text;
begin
  if new.satisfied_by is null then
    return new;
  end if;

  if new.side <> 'paciente' then
    raise exception
      'satisfied_by so existe no lado da pessoa (opcao %/% e do lado %).',
      new.subcriterion_code, new.value, new.side
      using errcode = 'check_violation';
  end if;

  if jsonb_typeof(new.satisfied_by) <> 'array'
     or jsonb_array_length(new.satisfied_by) = 0 then
    raise exception
      'satisfied_by deve ser um array JSON nao vazio (opcao %/%).',
      new.subcriterion_code, new.value
      using errcode = 'check_violation';
  end if;

  for alvo in select jsonb_array_elements_text(new.satisfied_by) loop
    if alvo = '*' then
      if jsonb_array_length(new.satisfied_by) <> 1 then
        raise exception
          'O marcador "*" deve ser o unico elemento de satisfied_by (opcao %/%).',
          new.subcriterion_code, new.value
          using errcode = 'check_violation';
      end if;
      continue;
    end if;

    if not exists (
      select 1 from curadoria.method_subcriterion_options o
      where o.subcriterion_code = new.subcriterion_code
        and o.side = 'profissional'
        and o.field = 'principal'
        and o.value = alvo
        and o.active
    ) then
      raise exception
        'satisfied_by orfao: "%" nao e opcao vigente do lado profissional de % (opcao da pessoa: %).',
        alvo, new.subcriterion_code, new.value
        using errcode = 'foreign_key_violation';
    end if;
  end loop;

  return new;
end;
$$;

revoke execute on function curadoria.satisfied_by_check() from public;
revoke execute on function curadoria.satisfied_by_check() from anon;

drop trigger if exists method_subcriterion_options_satisfied_by on curadoria.method_subcriterion_options;
create trigger method_subcriterion_options_satisfied_by
  before insert or update on curadoria.method_subcriterion_options
  for each row execute function curadoria.satisfied_by_check();

-- ----------------------------------------------------------------------------
-- 2. Lado da pessoa: MODELO_COMUNICACAO e MODELO_ALTERNATIVAS
--    (mesmos codigos das listas que ja operavam — nenhuma identidade nova)
-- ----------------------------------------------------------------------------

insert into curadoria.method_subcriterion_options
  (subcriterion_code, side, field, value, label, display_order, active, catalog_version, satisfied_by)
values
  ('MODELO_COMUNICACAO', 'paciente', 'principal', 'EXPLICACAO_SEM_TERMOS_TECNICOS',
   'Explicação sem termos técnicos', 1, true, '1.1.0',
   '["ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR", "REEXPLICA_DE_OUTRA_FORMA_QUANDO_NECESSARIO"]'::jsonb),
  ('MODELO_COMUNICACAO', 'paciente', 'principal', 'QUE_CONFIRMEM_SE_ENTENDI',
   'Que confirmem se eu entendi', 2, true, '1.1.0',
   '["VERIFICA_SE_A_PESSOA_COMPREENDEU"]'::jsonb),
  ('MODELO_COMUNICACAO', 'paciente', 'principal', 'ALGO_ESCRITO_PARA_LEVAR',
   'Algo escrito para levar', 3, true, '1.1.0',
   '["ENVIA_RESUMO_ESCRITO"]'::jsonb),
  ('MODELO_COMUNICACAO', 'paciente', 'principal', 'DESENHO_OU_IMAGEM',
   'Desenho ou imagem', 4, true, '1.1.0',
   '["USA_APOIO_VISUAL_OU_DESENHO"]'::jsonb),
  ('MODELO_COMUNICACAO', 'paciente', 'principal', 'TEMPO_PARA_PERGUNTAR',
   'Tempo para perguntar', 5, true, '1.1.0',
   '["RESERVA_TEMPO_PARA_PERGUNTAS"]'::jsonb),
  ('MODELO_COMUNICACAO', 'paciente', 'principal', 'PODER_GRAVAR_A_CONVERSA',
   'Poder gravar a conversa', 6, true, '1.1.0',
   '["AUTORIZA_GRAVACAO_DA_CONSULTA"]'::jsonb),

  ('MODELO_ALTERNATIVAS', 'paciente', 'principal', 'TODAS_AS_OPCOES_DISPONIVEIS',
   'Todas as opções disponíveis', 1, true, '1.1.0',
   '["OPCOES_DE_TRATAMENTO_DISPONIVEIS"]'::jsonb),
  ('MODELO_ALTERNATIVAS', 'paciente', 'principal', 'OPCAO_DE_NAO_FAZER_NADA',
   'A opção de não fazer nada', 2, true, '1.1.0',
   '["OPCAO_DE_ACOMPANHAR_SEM_INTERVIR", "O_QUE_ACONTECE_SE_NADA_FOR_FEITO"]'::jsonb),
  ('MODELO_ALTERNATIVAS', 'paciente', 'principal', 'RISCOS_DE_CADA_CAMINHO',
   'Os riscos de cada caminho', 3, true, '1.1.0',
   '["RISCOS_DE_CADA_CAMINHO"]'::jsonb),
  ('MODELO_ALTERNATIVAS', 'paciente', 'principal', 'CUSTOS_DE_CADA_CAMINHO',
   'Os custos de cada caminho', 4, true, '1.1.0',
   '["CUSTO_E_COBERTURA_DE_CADA_OPCAO"]'::jsonb);

-- ----------------------------------------------------------------------------
-- 3. satisfied_by nas opções vigentes da pessoa de MODELO_PARTICIPACAO_FAMILIAR
--    (PREFIRO_SOZINHA = "*": nenhuma conduta do catalogo impoe acompanhante;
--     NAO_TENHO_PREFERENCIA permanece NULL — fora do cruzamento)
-- ----------------------------------------------------------------------------

update curadoria.method_subcriterion_options
set satisfied_by = '["ACOMPANHANTE_BEM_VINDO_SEMPRE", "ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA"]'::jsonb
where subcriterion_code = 'MODELO_PARTICIPACAO_FAMILIAR'
  and side = 'paciente' and field = 'principal'
  and value = 'QUERO_ACOMPANHANTE_SEMPRE';

update curadoria.method_subcriterion_options
set satisfied_by = '["ACOMPANHANTE_BEM_VINDO_SEMPRE", "ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA", "PARTE_DA_CONSULTA_A_SOS"]'::jsonb
where subcriterion_code = 'MODELO_PARTICIPACAO_FAMILIAR'
  and side = 'paciente' and field = 'principal'
  and value = 'EM_ALGUMAS_CONVERSAS';

update curadoria.method_subcriterion_options
set satisfied_by = '["*"]'::jsonb
where subcriterion_code = 'MODELO_PARTICIPACAO_FAMILIAR'
  and side = 'paciente' and field = 'principal'
  and value = 'PREFIRO_SOZINHA';

-- ----------------------------------------------------------------------------
-- 4. O 29º conceito — MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS (humano)
-- ----------------------------------------------------------------------------

insert into curadoria.method_subcriteria
  (code, "group", axis, name, description, display_order, active,
   catalog_version, professional_question, patient_question,
   response_type, cruzamento, required, conditional_rules,
   evidence_source, review_months)
values
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'MODELO_DE_ATENDIMENTO', 'MODELO_DE_ATENDIMENTO',
   'Condução de notícias difíceis',
   'Condutas na comunicação de notícia grave: ritmo, preparo, companhia e continuidade imediata. Fronteira estreita (ADR-065): cobre somente a conduta na comunicação de notícia grave — explicação rotineira permanece em MODELO_COMUNICACAO; presença rotineira de acompanhante permanece em MODELO_PARTICIPACAO_FAMILIAR; este conceito não deve ser alargado para absorvê-las.',
   6, true, '1.1.0',
   'Ao comunicar um diagnóstico grave ou uma notícia difícil, quais dessas condutas você costuma adotar?',
   'Se houver uma notícia difícil, como você prefere recebê-la?',
   'multipla_escolha', 'humano', false, '[]'::jsonb,
   'entrevista', 12);

insert into curadoria.method_subcriterion_options
  (subcriterion_code, side, field, value, label, display_order, active, catalog_version)
values
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'profissional', 'principal',
   'RESERVA_TEMPO_DEDICADO_PARA_A_CONVERSA', 'Reserva tempo dedicado para a conversa', 1, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'profissional', 'principal',
   'PERGUNTA_O_QUANTO_A_PESSOA_QUER_SABER', 'Pergunta o quanto a pessoa quer saber', 2, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'profissional', 'principal',
   'COMUNICA_JUNTO_COM_OS_PROXIMOS_PASSOS', 'Comunica junto com os próximos passos', 3, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'profissional', 'principal',
   'OFERECE_PRESENCA_DE_ACOMPANHANTE', 'Oferece a presença de um acompanhante', 4, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'profissional', 'principal',
   'PROGRAMA_RECONTATO_PROXIMO_APOS_A_NOTICIA', 'Programa recontato próximo após a notícia', 5, true, '1.1.0'),

  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'paciente', 'principal',
   'DIRETA_E_COMPLETA', 'De forma direta e completa', 1, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'paciente', 'principal',
   'NO_MEU_RITMO_CONFORME_EU_PERGUNTAR', 'No meu ritmo, conforme eu perguntar', 2, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'paciente', 'principal',
   'COM_ALGUEM_QUE_EU_ESCOLHER_JUNTO', 'Com alguém que eu escolher junto', 3, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'paciente', 'principal',
   'JUNTO_COM_O_QUE_PODE_SER_FEITO', 'Junto com o que pode ser feito a respeito', 4, true, '1.1.0'),
  ('MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'paciente', 'principal',
   'NAO_SEI_AINDA', 'Não sei ainda', 5, true, '1.1.0');

-- ----------------------------------------------------------------------------
-- 5. Virada de vigência: 1.0.0 → 1.1.0 (conteúdo inalterado; só a vigência)
-- ----------------------------------------------------------------------------

update curadoria.method_subcriteria
set catalog_version = '1.1.0'
where active and catalog_version = '1.0.0';

update curadoria.method_subcriterion_options
set catalog_version = '1.1.0'
where active and catalog_version = '1.0.0';

alter table curadoria.method_subcriteria
  alter column catalog_version set default '1.1.0';

alter table curadoria.method_subcriterion_options
  alter column catalog_version set default '1.1.0';

-- A gravação nova de evidência sem versão explícita também nasce na vigente
-- (o trigger practice_evidence_validate_payload exige new.catalog_version =
-- versão do conceito; default defasado tornaria TODA gravação bare inválida).
alter table curadoria.practice_evidence
  alter column catalog_version set default '1.1.0';

-- Pós-verificação: a vigência voltou a ser única.
do $$
declare
  versoes int;
  ativos int;
begin
  select count(distinct catalog_version) into versoes
  from curadoria.method_subcriteria where active;

  select count(*) into ativos
  from curadoria.method_subcriteria where active;

  if versoes <> 1 or ativos <> 29 then
    raise exception
      'Pos-verificacao falhou: % versoes vigentes, % conceitos ativos (esperado: 1 versao, 29 conceitos).',
      versoes, ativos;
  end if;
end $$;

-- ============================================================================
-- ROLLBACK (ordem inversa; nenhum dado perdido):
--   1. alter table ... alter column catalog_version set default '1.0.0' (ambas);
--   2. update ... set catalog_version = '1.0.0' where active and catalog_version = '1.1.0'
--      (exceto as linhas de MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS e as opções
--       novas do lado da pessoa, que nasceram 1.1.0);
--   3. update curadoria.method_subcriteria set active = false
--      where code = 'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS'
--      (catálogo não se apaga: sair de circulação é active=false);
--      idem para as opções novas (active = false);
--   4. update ... set satisfied_by = null nas opções de PARTICIPACAO_FAMILIAR;
--   5. drop trigger method_subcriterion_options_satisfied_by;
--      drop function curadoria.satisfied_by_check();
--      (a coluna satisfied_by pode permanecer, inerte, para não perder rastro).
--   Toda operação de rollback também exige catalog_change_rationale.
-- ============================================================================
