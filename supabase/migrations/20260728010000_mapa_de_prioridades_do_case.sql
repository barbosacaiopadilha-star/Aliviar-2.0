-- MAPA DE PRIORIDADES DO CASE — catálogo canônico de subcritérios
--
-- O Método define o que se avalia; o Case define quanto cada coisa importa.
--
-- Até aqui o Curador escolhia um critério de uma lista LEGADA
-- (`priority_weights.criterion`: EXPERIENCIA, AREA_DE_ATUACAO,
-- DISPONIBILIDADE, CONTINUIDADE, ABORDAGEM_INICIAL, LOCALIZACAO) e digitava
-- `target_value` e `evidence` em texto livre. O vocabulário do Método virava
-- prosa, e cada Case descrevia a mesma coisa com palavras diferentes.
--
-- Duas decisões estruturais, ambas para NÃO criar vocabulário paralelo:
--
--  1. O GRUPO de um subcritério é um critério do Modelo v1.0
--     (FORMACAO, EXPERIENCIA, HISTORICO, ACESSO, CONTINUIDADE_DO_CUIDADO,
--     MODELO_DE_ATENDIMENTO) — os mesmos seis de `criterion_declarations`.
--     Nenhum `historico_profissional` ao lado de `HISTORICO`.
--
--  2. Em FORMAÇÃO os subcritérios espelham `curadoria.education_kind`, que já
--     é a taxonomia oficial da formação no cadastro do profissional.
--
-- ADITIVA. Não altera, converte nem apaga `priority_weights`,
-- `priority_profiles`, `priority_profile_filters` ou `cruzamento_weights`. O
-- modelo anterior segue lido e escrito exatamente como antes — a convivência
-- é deliberada e termina na missão que substituir a Mesa.

-- ---------------------------------------------------------------------------
-- 1. A escala — cinco níveis, sem meio-termo
-- ---------------------------------------------------------------------------
--
-- O dado é o NÍVEL, a palavra que a pessoa reconheceria se ouvisse de volta.
-- O ordinal (5/4/3/2/0) é derivado no domínio (`importanceOrdinal`) e não
-- entra aqui de propósito: número guardado vira fonte, e fonte numérica é o
-- caminho mais curto para alguém somar o que o Método não manda somar.
create type curadoria.importance_level as enum (
  'MUITO_IMPORTANTE',
  'IMPORTANTE',
  'RELEVANTE',
  'POUCO_IMPORTANTE',
  'NAO_INFLUENCIA'
);

-- ---------------------------------------------------------------------------
-- 2. O catálogo canônico
-- ---------------------------------------------------------------------------

create table curadoria.method_subcriteria (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- O mesmo universo fechado de `cruzamento_weights.criterion`.
  "group" text not null check ("group" in (
    'FORMACAO', 'EXPERIENCIA', 'HISTORICO',
    'ACESSO', 'CONTINUIDADE_DO_CUIDADO', 'MODELO_DE_ATENDIMENTO'
  )),
  name text not null check (length(btrim(name)) > 0),
  description text not null check (length(btrim(description)) > 0),
  display_order smallint not null check (display_order > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique ("group", display_order)
);

comment on table curadoria.method_subcriteria is
  'Catalogo canonico de subcriterios do Metodo. O Curador nunca cria, renomeia nem descreve: ele so atribui importancia. Tirar de circulacao e active=false, nunca DELETE — o historico dos Cases referencia estas linhas.';

create index method_subcriteria_group_idx
  on curadoria.method_subcriteria ("group", display_order)
  where active;

-- ---------------------------------------------------------------------------
-- 3. O Mapa de Prioridades do Case
-- ---------------------------------------------------------------------------
--
-- Mínimo de propósito: Case, subcritério, nível. Sem justificativa, sem
-- evidência, sem fonte, sem anexo, sem nota, sem resultado. Cada campo livre
-- que entrasse aqui reabriria a porta que este modelo veio fechar.
create table curadoria.case_priority_map (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references curadoria.cases (id) on delete cascade,
  subcriterion_id uuid not null references curadoria.method_subcriteria (id) on delete restrict,
  importance curadoria.importance_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Uma classificação por subcritério, por Case. Salvar de novo atualiza.
  unique (case_id, subcriterion_id)
);

comment on table curadoria.case_priority_map is
  'Quanto cada subcriterio importa NESTE Case. Uma linha por (case, subcriterio). O ON DELETE RESTRICT do catalogo e deliberado: retirar um subcriterio de circulacao nunca apaga em silencio o que os Cases ja declararam.';

create index case_priority_map_case_idx on curadoria.case_priority_map (case_id);

-- Só subcritério em circulação recebe classificação NOVA. Reclassificar o que
-- já existe continua permitido: o Case não fica travado porque o catálogo
-- mudou depois.
create or replace function curadoria.assert_subcriterion_active()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  if tg_op = 'INSERT' and not exists (
    select 1 from curadoria.method_subcriteria m
     where m.id = new.subcriterion_id and m.active
  ) then
    raise exception 'Subcriterio fora de circulacao nao recebe nova classificacao.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger case_priority_map_subcriterion_active
  before insert on curadoria.case_priority_map
  for each row execute function curadoria.assert_subcriterion_active();

create trigger case_priority_map_touch
  before update on curadoria.case_priority_map
  for each row execute function curadoria.set_updated_at();

create trigger method_subcriteria_touch
  before update on curadoria.method_subcriteria
  for each row execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Acesso — o mesmo recorte das outras tabelas do Case
-- ---------------------------------------------------------------------------

alter table curadoria.method_subcriteria enable row level security;
alter table curadoria.case_priority_map enable row level security;

grant select on curadoria.method_subcriteria to authenticated;
grant all on curadoria.method_subcriteria to service_role;

grant select, insert, update, delete on curadoria.case_priority_map to authenticated;
grant all on curadoria.case_priority_map to service_role;

-- O catálogo é o vocabulário do Método: quem está autenticado lê; ninguém
-- escreve pela aplicação. Mudança de catálogo é migration, não operação.
create policy "method_subcriteria_read" on curadoria.method_subcriteria
  for select to authenticated
  using (true);

-- Mesmo recorte de `cruzamento_weights` e `criterion_declarations`: quem
-- conduz o Case escreve. Nenhum acesso novo, nenhuma RLS enfraquecida.
create policy "case_priority_map_curator_write" on curadoria.case_priority_map
  for all to authenticated
  using (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id))
  with check (curadoria.has_role('administrador') or curadoria.is_curator_for_case(case_id));

-- ---------------------------------------------------------------------------
-- 5. Seed do catálogo — vocabulário, não dado de ninguém
-- ---------------------------------------------------------------------------
--
-- Independente de ambiente e idempotente: `on conflict (code)` atualiza o
-- texto e a ordem sem tocar `id`, para que nenhum Mapa de Case perca a
-- referência quando o rótulo for melhorado.
insert into curadoria.method_subcriteria (code, "group", name, description, display_order) values
  ('FORMACAO_GRADUACAO',                  'FORMACAO', 'Graduação',                          'Onde e quando se formou em medicina.', 1),
  ('FORMACAO_RESIDENCIA',                 'FORMACAO', 'Residência médica',                  'Residência concluída na especialidade em questão.', 2),
  ('FORMACAO_ESPECIALIZACAO',             'FORMACAO', 'Especialização',                     'Título de especialista ou especialização formal na área.', 3),
  ('FORMACAO_FELLOWSHIP',                 'FORMACAO', 'Fellowship',                         'Formação avançada em subárea, no país ou fora.', 4),
  ('FORMACAO_COMPLEMENTAR',               'FORMACAO', 'Formação complementar',              'Pós-graduação e cursos relevantes para este caso.', 5),

  ('EXPERIENCIA_TEMPO_DE_PRATICA',        'EXPERIENCIA', 'Tempo de prática',                'Há quanto tempo atua na especialidade.', 1),
  ('EXPERIENCIA_CASOS_SEMELHANTES',       'EXPERIENCIA', 'Casos semelhantes',               'Experiência com situações parecidas com a desta pessoa.', 2),
  ('EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO','EXPERIENCIA', 'Condição ou procedimento',        'Experiência específica na condição ou no procedimento em questão.', 3),
  ('EXPERIENCIA_VOLUME_DE_ATUACAO',       'EXPERIENCIA', 'Volume de atuação',               'Com que frequência atende esse tipo de caso.', 4),

  ('HISTORICO_REGULARIDADE',              'HISTORICO', 'Regularidade profissional',         'Registro regular no conselho, sem pendência em aberto.', 1),
  ('HISTORICO_TRAJETORIA_INSTITUCIONAL',  'HISTORICO', 'Trajetória institucional',          'Serviços e instituições em que atuou.', 2),
  ('HISTORICO_PRODUCAO_ACADEMICA',        'HISTORICO', 'Produção acadêmica',                'Publicação e produção científica na área.', 3),
  ('HISTORICO_ENSINO_E_PESQUISA',         'HISTORICO', 'Ensino e pesquisa',                 'Participação em ensino, pesquisa ou formação de outros profissionais.', 4),

  ('ACESSO_LOCALIZACAO',                  'ACESSO', 'Localização',                          'Onde atende, e o quanto isso pesa no deslocamento.', 1),
  ('ACESSO_MODALIDADE',                   'ACESSO', 'Modalidade de atendimento',            'Presencial, remoto ou os dois.', 2),
  ('ACESSO_DISPONIBILIDADE',              'ACESSO', 'Disponibilidade',                      'Horários e janelas em que consegue atender.', 3),
  ('ACESSO_PRAZO_PARA_CONSULTA',          'ACESSO', 'Prazo para a consulta',                'Quanto tempo até conseguir ser atendido.', 4),

  ('CONTINUIDADE_RETORNOS',               'CONTINUIDADE_DO_CUIDADO', 'Retornos',                          'Como e com que frequência acontecem os retornos.', 1),
  ('CONTINUIDADE_POS_PROCEDIMENTO',       'CONTINUIDADE_DO_CUIDADO', 'Acompanhamento pós-procedimento',   'O que acontece depois do procedimento, e por quanto tempo.', 2),
  ('CONTINUIDADE_EQUIPE_DE_APOIO',        'CONTINUIDADE_DO_CUIDADO', 'Equipe de apoio',                   'Existência de equipe que acompanha junto com o profissional.', 3),
  ('CONTINUIDADE_COORDENACAO',            'CONTINUIDADE_DO_CUIDADO', 'Coordenação com outros profissionais', 'Como conversa com os outros profissionais que cuidam da pessoa.', 4),

  ('MODELO_COMUNICACAO',                  'MODELO_DE_ATENDIMENTO', 'Comunicação',                'Como explica, e o quanto se faz entender.', 1),
  ('MODELO_DECISAO_COMPARTILHADA',        'MODELO_DE_ATENDIMENTO', 'Decisão compartilhada',      'O quanto decide junto com a pessoa, e não por ela.', 2),
  ('MODELO_PARTICIPACAO_FAMILIAR',        'MODELO_DE_ATENDIMENTO', 'Participação da família',    'Abertura para a família participar das conversas.', 3),
  ('MODELO_ALTERNATIVAS',                 'MODELO_DE_ATENDIMENTO', 'Explicação de alternativas', 'Se apresenta os caminhos possíveis, inclusive o de não intervir.', 4),
  ('MODELO_PREFERENCIAS_E_RESTRICOES',    'MODELO_DE_ATENDIMENTO', 'Preferências e restrições',  'Como acolhe o que a pessoa quer e o que ela não aceita.', 5)
on conflict (code) do update set
  "group" = excluded."group",
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   drop table if exists curadoria.case_priority_map;
--   drop trigger if exists method_subcriteria_touch on curadoria.method_subcriteria;
--   drop table if exists curadoria.method_subcriteria;
--   drop function if exists curadoria.assert_subcriterion_active();
--   drop type if exists curadoria.importance_level;
--
-- Reverter descarta os Mapas já preenchidos — e nada mais: o modelo anterior
-- nunca foi tocado por esta migration.
