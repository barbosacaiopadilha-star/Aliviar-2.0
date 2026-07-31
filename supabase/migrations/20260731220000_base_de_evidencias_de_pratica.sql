-- BASE DE EVIDÊNCIAS DE PRÁTICA — o repositório permanente do Protocolo da
-- Prática Profissional (Catálogo Canônico 1.0.0, congelado em 2026-07-31).
--
-- O que esta tabela guarda: a resposta estruturada de um profissional a um
-- conceito do catálogo, com proveniência completa (fonte, data, responsável)
-- e estado da informação. Uma evidência NUNCA é editada nem apagada — toda
-- mudança é uma versão nova, e a leitura corrente é a versão mais alta.
-- Histórico integral por construção, não por disciplina.
--
-- DECISÕES DE ARQUITETURA (e por quê):
--
-- 1. `subcriterion_code` (texto) + `catalog_version`, e NÃO FK para
--    `method_subcriteria`. Deliberado: o catálogo 1.0.0 tem 8 conceitos que
--    ainda não existem naquela tabela (CANAIS, LIMITES, fusões, VIABILIDADE),
--    e inseri-los ATIVOS ali mudaria imediatamente o universo do Motor e a
--    completude do Mapa — `listSubcriterionCatalog(active)` alimenta os dois,
--    e os gatilhos assert_subcriterion_active* validam por `active`. Alterar
--    o comportamento da Mesa/Motor é proibido nesta missão. A identidade por
--    `code` é a mesma que a ADR-039 declarou estável ("código estável
--    independente do texto visível"); a virada do catálogo no banco é missão
--    própria (inventário técnico, sequência 1-2), e quando acontecer uma
--    migration futura pode adicionar a FK sem reescrever dado nenhum.
--    A validação de código acontece na única porta de escrita (repositório),
--    contra a constante canônica congelada — mesmo desenho "o domínio recusa
--    primeiro, o banco garante o resto" das demais superfícies.
--
-- 2. Enum `curadoria.verification_status` REUTILIZADO (nao_verificado |
--    verificado | divergente | nao_localizado | desatualizado) — o mesmo da
--    área de atuação. "Declarado, ainda não verificado" = nao_verificado;
--    "validado" = verificado; "revisão pendente" não é estado gravado, é
--    derivação por validade (política de volatilidade por conceito, no
--    domínio). Nenhum enum paralelo: duplicar vocabulário de verificação foi
--    exatamente o defeito que a ADR-039 corrigiu em critérios.
--
-- 3. Append-only por TRIGGER, não por convenção. UPDATE e DELETE são
--    recusados pelo banco; "corrigir" é gravar versão nova. É o que torna
--    "nenhuma informação verificada pode ser perdida" uma propriedade, não
--    uma promessa.
--
-- 4. Proveniência por CHECK, como registro e área já exigem: coleta sem
--    fonte/data/responsável não entra; `verificado` sem verificador, data e
--    fonte de verificação não entra. Espelha
--    professional_registro_verificado_exige_proveniencia.
--
-- 5. Divergência REUTILIZA `curadoria.verification_divergences` (subject =
--    código do conceito). Nenhuma tabela paralela de divergência.
--
-- 6. RLS espelha o Mapa do Profissional (ADR-040 item 6): escrita
--    administrador; leitura administrador + curador_medico. Não é perfil
--    público, não alcança paciente nem o próprio profissional.

create table curadoria.practice_evidence (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null
    references curadoria.professional_profiles (id) on delete cascade,

  -- Identidade do conceito no Catálogo Canônico congelado.
  subcriterion_code text not null
    check (length(btrim(subcriterion_code)) > 0),
  catalog_version text not null default '1.0.0'
    check (length(btrim(catalog_version)) > 0),

  -- Versionamento append-only: a leitura corrente é max(version).
  version integer not null check (version > 0),

  -- A resposta estruturada do Protocolo: opções canônicas selecionadas e os
  -- campos estruturados (faixas, listas, condições por opção). Texto livre só
  -- nos dois campos curtos abaixo, nunca como conceito.
  options text[] not null default '{}',
  details jsonb not null default '{}'::jsonb,
  condition_note text
    check (condition_note is null or (length(btrim(condition_note)) between 1 and 280)),
  observation text
    check (observation is null or (length(btrim(observation)) between 1 and 280)),

  -- Proveniência da COLETA — obrigatória sempre.
  source_tier text not null check (source_tier in (
    'OFICIAL_PRIMARIA', 'INSTITUCIONAL', 'PUBLICA_SECUNDARIA', 'INADEQUADA'
  )),
  source text not null check (length(btrim(source)) > 0),
  collected_at timestamptz not null,
  collected_by uuid not null,

  -- Estado da informação — o enum vigente da Política de Fontes.
  status curadoria.verification_status not null default 'nao_verificado',

  -- Proveniência da VERIFICAÇÃO — obrigatória quando verificado.
  verified_at timestamptz,
  verified_by uuid,
  verification_source text
    check (verification_source is null or length(btrim(verification_source)) > 0),

  created_at timestamptz not null default now(),

  unique (professional_profile_id, subcriterion_code, version),

  constraint practice_evidence_verificacao_exige_proveniencia check (
    status <> 'verificado'
    or (verified_at is not null and verified_by is not null and verification_source is not null)
  )
);

comment on table curadoria.practice_evidence is
  'Base de Evidencias de Pratica (Catalogo Canonico 1.0.0). Append-only: toda mudanca e versao nova, leitura corrente = max(version). Resposta de protocolo nasce nao_verificado; verificado exige verificador, data e fonte. Dado OPERACIONAL INTERNO — nao e perfil publico, nao publica ninguem, nao entra no Motor por si.';

comment on column curadoria.practice_evidence.subcriterion_code is
  'Codigo canonico do conceito (Catalogo 1.0.0). Sem FK por decisao registrada: a virada do catalogo em method_subcriteria e missao propria; a identidade por code e a estavel da ADR-039.';

comment on column curadoria.practice_evidence.options is
  'Opcoes canonicas selecionadas. Marcar mais opcoes NUNCA significa melhor (P18). Validacao contra o catalogo congelado acontece na unica porta de escrita.';

create index practice_evidence_professional_idx
  on curadoria.practice_evidence (professional_profile_id, subcriterion_code, version desc);

create index practice_evidence_status_idx
  on curadoria.practice_evidence (status)
  where status in ('divergente', 'desatualizado');

-- ---------------------------------------------------------------------------
-- Append-only: o banco recusa reescrita e apagamento.
-- ---------------------------------------------------------------------------

create or replace function curadoria.practice_evidence_append_only()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  raise exception
    'Evidencia de pratica nao se edita nem se apaga: grave uma versao nova. Historico e propriedade, nao promessa.'
    using errcode = 'check_violation';
end;
$$;

revoke execute on function curadoria.practice_evidence_append_only() from public;
revoke execute on function curadoria.practice_evidence_append_only() from anon;

create trigger practice_evidence_no_update
  before update on curadoria.practice_evidence
  for each row execute function curadoria.practice_evidence_append_only();

create trigger practice_evidence_no_delete
  before delete on curadoria.practice_evidence
  for each row execute function curadoria.practice_evidence_append_only();

-- Versões em sequência, sem buracos e sem corrida: a versão N+1 só entra se a
-- corrente for N.
create or replace function curadoria.practice_evidence_version_sequence()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  corrente integer;
begin
  select coalesce(max(version), 0) into corrente
    from curadoria.practice_evidence
   where professional_profile_id = new.professional_profile_id
     and subcriterion_code = new.subcriterion_code;

  if new.version <> corrente + 1 then
    raise exception
      'Versao fora de sequencia para %: corrente e %, recebida %.',
      new.subcriterion_code, corrente, new.version
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function curadoria.practice_evidence_version_sequence() from public;
revoke execute on function curadoria.practice_evidence_version_sequence() from anon;

create trigger practice_evidence_version_check
  before insert on curadoria.practice_evidence
  for each row execute function curadoria.practice_evidence_version_sequence();

-- ---------------------------------------------------------------------------
-- RLS — o recorte do Mapa do Profissional (ADR-040 item 6).
-- ---------------------------------------------------------------------------

alter table curadoria.practice_evidence enable row level security;

create policy "practice_evidence_read_interno"
  on curadoria.practice_evidence for select
  to authenticated
  using (curadoria.has_role('administrador') or curadoria.has_role('curador_medico'));

create policy "practice_evidence_insert_admin"
  on curadoria.practice_evidence for insert
  to authenticated
  with check (curadoria.has_role('administrador'));

-- ---------------------------------------------------------------------------
-- BACKFILL: NENHUM, de propósito.
--
-- O dado existente mais próximo é professional_subcriterion_map — estados
-- (CONFIRMADO/NAO_CONFIRMADO/NAO_INFORMADO) sobre o catálogo ANTERIOR, sem
-- valor de característica, sem fonte, sem verificação. Convertê-lo em
-- evidência inventaria exatamente o que a evidência existe para não deixar
-- inventar: fato, fonte e proveniência. A ADR-039 já firmou o precedente
-- ("inventar o mapeamento seria pior que não migrar"), e a ADR-040 item 7
-- proíbe inferência de dado legado. O Mapa permanece intacto e legível; a
-- Base começa vazia e cresce pelo Protocolo. Correspondência inexistente
-- permanece inexistente — nunca "desconhecido" fabricado em massa.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   drop trigger if exists practice_evidence_version_check on curadoria.practice_evidence;
--   drop trigger if exists practice_evidence_no_delete on curadoria.practice_evidence;
--   drop trigger if exists practice_evidence_no_update on curadoria.practice_evidence;
--   drop function if exists curadoria.practice_evidence_version_sequence();
--   drop function if exists curadoria.practice_evidence_append_only();
--   drop table if exists curadoria.practice_evidence;
--
-- (Aditiva e isolada: nenhuma tabela existente foi tocada, nenhum dado
-- externo depende dela até a integração ser publicada.)
