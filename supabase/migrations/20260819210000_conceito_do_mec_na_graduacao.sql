-- ============================================================================
-- O CONCEITO DO MEC NA ENTRADA DE GRADUAÇÃO
-- ============================================================================
--
-- O QUE MUDA
--   `professional_education_entries` ganha dois campos opcionais:
--   `mec_conceito` (1 a 5) e `mec_conceito_ano`. Nenhuma linha existente é
--   tocada — ambos nascem nulos, e nulo é o estado normal.
--
-- POR QUE AQUI, E NÃO NUMA TABELA DE INSTITUIÇÕES
--   Porque a nota é LANÇADA pela equipe junto com a formação, no mesmo ato em
--   que o diploma é conferido — não importada de base externa nem casada por
--   nome de instituição. Quem lança já revisou; não há segunda verificação a
--   fazer, e não existe casamento aproximado que possa errar sobre um médico
--   real. O dado nasce onde o julgamento humano acontece.
--
-- POR QUE SÓ NA GRADUAÇÃO
--   O conceito do MEC avalia CURSO DE GRADUAÇÃO. Residência médica é
--   credenciada pela CNRM; fellowship, especialização e curso livre não têm
--   conceito do MEC. Permitir o campo neles convidaria a inventar um número
--   que não existe — e esse número seria lido por uma paciente. O CHECK abaixo
--   torna o engano impossível, em vez de confiá-lo à disciplina de quem digita.
--
-- POR QUE O ANO É SEPARADO E OPCIONAL
--   Conceito sem ano envelhece em silêncio: "conceito 4" continua na tela
--   depois do ciclo avaliativo seguinte, sem que ninguém perceba. O ano é
--   opcional para não travar o lançamento, mas quando existe ele é impresso —
--   e a paciente vê de quando é a informação.
--
-- O QUE ISTO NÃO AUTORIZA
--   Não cria ranking, não ordena opções e não entra em nenhum cálculo. O
--   conceito é impresso DENTRO da linha da instituição, como fato sobre a
--   escola, nunca como selo, cor ou número solto. A carta da paciente compara
--   caminhos, não notas.
--
-- ROLLBACK
--   alter table curadoria.professional_education_entries
--     drop column mec_conceito_ano,
--     drop column mec_conceito;
-- ============================================================================

alter table curadoria.professional_education_entries
  add column if not exists mec_conceito smallint,
  add column if not exists mec_conceito_ano smallint;

-- A escala oficial é 1 a 5, inteira. Fora dela não é conceito do MEC.
alter table curadoria.professional_education_entries
  drop constraint if exists mec_conceito_na_escala_oficial;
alter table curadoria.professional_education_entries
  add constraint mec_conceito_na_escala_oficial
  check (mec_conceito is null or mec_conceito between 1 and 5);

-- Conceito do MEC é de curso de graduação. Nos demais tipos, não existe.
alter table curadoria.professional_education_entries
  drop constraint if exists mec_conceito_so_na_graduacao;
alter table curadoria.professional_education_entries
  add constraint mec_conceito_so_na_graduacao
  check (mec_conceito is null or kind = 'graduacao');

-- Ano sem conceito é um ano sobre nada.
alter table curadoria.professional_education_entries
  drop constraint if exists mec_ano_exige_conceito;
alter table curadoria.professional_education_entries
  add constraint mec_ano_exige_conceito
  check (mec_conceito_ano is null or mec_conceito is not null);

alter table curadoria.professional_education_entries
  drop constraint if exists mec_ano_plausivel;
alter table curadoria.professional_education_entries
  add constraint mec_ano_plausivel
  check (mec_conceito_ano is null or mec_conceito_ano between 1990 and 2100);

comment on column curadoria.professional_education_entries.mec_conceito is
  'Conceito do MEC do curso de graduacao (1 a 5), lancado pela equipe junto com a formacao e ja revisado no ato. Somente para kind = graduacao. Impresso na linha da instituicao; nunca ordena, pontua ou compara opcoes.';

comment on column curadoria.professional_education_entries.mec_conceito_ano is
  'Ano do ciclo avaliativo do conceito. Opcional: existe para que o numero nao envelheca em silencio na tela da paciente.';
