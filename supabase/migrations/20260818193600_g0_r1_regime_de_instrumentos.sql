-- G0-R1 — REGIME DE INSTRUMENTOS RECONSTRUÍDO CONTRA A MAIN 5d53b7d
-- Nova identidade de migration; a branch histórica foi usada somente como especificação e oráculo descartável.
-- Preflight: recusa schema incompleto ou presença parcial do regime.
do $preflight$
begin
  if to_regclass('curadoria.legal_documents') is null
     or to_regclass('curadoria.legal_document_versions') is null
     or to_regclass('curadoria.legal_acceptances') is null
     or to_regclass('curadoria.legal_acceptance_revocations') is null then
    raise exception 'G0-R1: baseline jurídica da main não está completa';
  end if;
  if to_regtype('curadoria.legal_regime') is not null
     or to_regtype('curadoria.legal_instance_status') is not null
     or to_regtype('curadoria.legal_signature_level') is not null
     or to_regtype('curadoria.legal_signer_role') is not null
     or to_regtype('curadoria.legal_termination_cause') is not null
     or to_regclass('curadoria.legal_document_instances') is not null
     or to_regclass('curadoria.legal_instance_signers') is not null
     or to_regclass('curadoria.legal_instrument_terminations') is not null
     or to_regprocedure('curadoria.g0_r1_contratos_json_validos(jsonb,jsonb,jsonb)') is not null
     or to_regprocedure('curadoria.criar_instancia_de_documento(uuid,uuid,uuid,jsonb,jsonb,uuid,timestamptz,jsonb,text)') is not null
     or to_regprocedure('curadoria.assinar_instancia(uuid,uuid,text,text,text,text,jsonb,text,text)') is not null
     or to_regprocedure('curadoria.revogar_por_escopo(uuid,text,text,text,text)') is not null
     or to_regprocedure('curadoria.rescindir_instrumento(uuid,text,text,smallint,timestamptz,timestamptz,text)') is not null
     or to_regprocedure('curadoria.enforce_legal_instance_insert()') is not null
     or to_regprocedure('curadoria.enforce_legal_instance_congelada()') is not null
     or to_regprocedure('curadoria.enforce_legal_signers_congelados()') is not null
     or exists (
       select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='curadoria' and c.relname in (
         'legal_instances_titular_idx','legal_instances_profissional_idx','legal_instances_version_idx',
         'legal_instances_case_idx','legal_instances_substituida_idx','legal_instances_idempotencia',
         'legal_instance_signers_instance_idx','legal_instance_signers_profile_idx',
         'legal_instance_signers_professional_idx','legal_acceptances_uma_assinatura_por_assinante',
         'legal_acceptances_instance_idx','legal_terminations_uma_por_instrumento',
         'legal_terminations_registrada_por_idx'
       )
     )
     or exists (
       select 1 from pg_constraint where conname in (
         'legal_document_versions_contratos_validos','legal_instances_um_titular',
         'legal_instances_assinatura_coerente','legal_instances_eficacia_coerente',
         'legal_instances_artefato_coerente','legal_instances_idempotencia_nao_vazia',
         'legal_instances_contexto_objeto','legal_instances_variaveis_objeto',
         'legal_acceptances_instrumento_coerente','legal_acceptances_nivel_sustentado',
         'legal_terminations_denuncia_exige_aviso'
       )
     )
     or exists (
       select 1 from information_schema.columns
       where table_schema = 'curadoria' and (
         (table_name = 'legal_documents' and column_name in ('regime','categoria','ordem_de_apresentacao'))
         or (table_name = 'legal_document_versions' and column_name in ('variaveis_requeridas','assinantes_exigidos','escopos_revogaveis','nivel_exigido','aprovado_por','aprovado_em','motivo_da_mudanca'))
         or (table_name = 'legal_acceptances' and column_name in ('instance_id','signer_id','instancia_hash','nivel','provedor','evidencia_externa','declaracao_de_vontade'))
         or (table_name = 'legal_acceptance_revocations' and column_name in ('escopo','escopo_rotulo'))
       )
     ) then
    raise exception 'G0-R1: presença prévia ou parcial do regime de instrumentos';
  end if;
end;
$preflight$;

--
-- O modelo publicado em 20260803140000/150000 prova aceite sobre um texto
-- ÚNICO, igual para todos. Os cinco documentos jurídicos recebidos não são
-- assim: cada um nomeia e qualifica o titular DENTRO do corpo assinado —
-- contratante com oito campos, outorgante da procuração, médico com CRM e
-- RQE. Duas pessoas assinam textos diferentes derivados do mesmo modelo.
--
-- Assinar a versão-modelo registraria concordância com um texto cheio de
-- marcadores: a prova apontaria para o documento errado. Daí a terceira
-- camada desta migration.
--
--   MODELO   (legal_documents)          o que o documento É
--   VERSÃO   (legal_document_versions)  o que está ESCRITO, e desde quando
--   INSTÂNCIA(legal_document_instances) o que ESTA pessoa assinou
--
-- Cinco regras que este arquivo protege, e por quê:
--
--  1. DOIS HASHES, nunca um. O da versão prova sob qual redação se assinou;
--     o da instância prova o que a pessoa leu, com os dados dela dentro.
--     Ambos gerados pelo BANCO — o cliente nunca informa hash.
--
--  2. EXPECTATIVA ≠ FATO. `legal_instance_signers` diz quem PRECISA assinar;
--     `legal_acceptances` — o livro único, o mesmo de sempre — diz quem
--     assinou. Nenhuma tabela paralela de assinatura: auditoria com dois
--     livros é auditoria com duas verdades.
--
--  3. ESTADO DERIVADO. `status` nunca é digitado: sai da comparação entre
--     assinantes exigidos e atos registrados. Coluna materializada existe
--     por desempenho e é mantida SÓ por função/trigger.
--
--  4. REVOGAÇÃO POR ESCOPO. Dois dos cinco documentos preveem revogar UMA
--     autorização (imagem, currículo) mantendo o resto vigente. O índice
--     atual permitia uma revogação por aceite; passa a permitir uma integral
--     E uma por escopo — sem enfraquecer a garantia original.
--
--  5. RESCISÃO NÃO É REVOGAÇÃO. Revogar é ato sobre consentimento; rescindir
--     é ato sobre o vínculo. Confundi-las faria o sistema afirmar que o
--     contrato nunca valeu, quando o que houve foi término.
--
-- O QUE ESTA MIGRATION NÃO FAZ: publicar documento, escrever texto jurídico,
-- gravar trilha em audit_logs (é o G2 — e criar valor de enum que ninguém
-- escreve foi exatamente o erro que deixou seis valores órfãos em 140000),
-- gerar PDF, registrar download, tocar no Protocolo da Prática.
--
-- COMPATIBILIDADE: estritamente aditivo, com UMA exceção declarada — a
-- substituição do índice único de revogações (item 4). Nenhuma função
-- existente é alterada: `register_legal_acceptances`, `revoke_legal_acceptance`,
-- `register_professional_acceptances`, `versao_vigente` e
-- `pendencias_legais_do_profissional` continuam sendo o que eram, com os
-- mesmos testes provando o mesmo comportamento.
--
-- Rollback (executado e verificado no banco local antes desta versão do
-- arquivo, nesta ordem — as duas primeiras linhas não são detalhe):
--   1. drop das 4 funções de porta e das 3 de trigger ANTES das tabelas: uma
--      função que retorna `curadoria.<tabela>` depende do tipo da tabela;
--   2. drop da coluna gerada `especie` ANTES de `instance_id`, de que ela
--      deriva;
--   3. drop das 3 tabelas novas e das colunas aditivas;
--   4. restaurar `legal_acceptance_revocations_unica (acceptance_id)`;
--   5. drop dos 5 tipos.
-- Nenhum valor é adicionado a enum pré-existente — nada aqui é irreversível
-- por desenho do Postgres.

-- ---------------------------------------------------------------------------
-- 1. Tipos
-- ---------------------------------------------------------------------------

-- A distinção que a revisão 2 da arquitetura corrigiu. Default 'adesao' na
-- coluna: todo documento que já existisse continua sendo o que era.
create type curadoria.legal_regime as enum ('adesao', 'instrumento');

-- Não existe 'rascunho': a instância nasce completa e imutável. Se um dado
-- estava errado, cria-se outra — a anterior expira e a trilha mostra as duas.
create type curadoria.legal_instance_status as enum (
  'aguardando_assinaturas', 'assinado', 'expirado', 'cancelado'
);

-- Os três níveis existem na estrutura; QUAL vale por documento é decisão do
-- jurídico (D-3), ainda pendente. O nível é sempre derivado pelo servidor do
-- caminho efetivamente percorrido — nunca informado pelo cliente.
create type curadoria.legal_signature_level as enum ('N1', 'N2', 'N3');

-- Existir o valor não decide nada: quem é exigido por documento é dado
-- publicado. 'testemunha' e 'representante_legal' existem para que as
-- respostas de D-6 e D-7 não obriguem a alterar tipo depois.
create type curadoria.legal_signer_role as enum (
  'titular', 'contratada', 'testemunha', 'representante_legal'
);

-- Espelha as hipóteses que o Contrato recebido enumera, sem interpretá-las.
-- Se o texto mudar, muda o dado publicado — não este tipo.
create type curadoria.legal_termination_cause as enum (
  'acordo', 'denuncia_imotivada', 'infracao', 'perda_de_objeto', 'inviabilidade'
);

-- ---------------------------------------------------------------------------
-- 2. Extensões aditivas no catálogo
-- ---------------------------------------------------------------------------

create or replace function curadoria.g0_r1_contratos_json_validos(_variaveis jsonb, _assinantes jsonb, _escopos jsonb)
returns boolean language plpgsql immutable set search_path = curadoria, pg_temp as $$
declare _e jsonb;
begin
  if jsonb_typeof(_variaveis) <> 'array' or jsonb_typeof(_assinantes) <> 'array' or jsonb_typeof(_escopos) <> 'array' then return false; end if;
  for _e in select value from jsonb_array_elements(_variaveis) loop
    if not ((jsonb_typeof(_e) = 'string' and length(btrim(_e #>> '{}')) > 0)
      or (jsonb_typeof(_e) = 'object' and jsonb_typeof(_e -> 'chave') = 'string'
          and length(btrim(_e ->> 'chave')) > 0 and (_e - 'chave' - 'rotulo') = '{}'::jsonb))
    then return false; end if;
  end loop;
  for _e in select value from jsonb_array_elements(_assinantes) loop
    if jsonb_typeof(_e) <> 'object' or jsonb_typeof(_e -> 'papel') <> 'string'
       or (_e ->> 'papel') not in ('titular','contratada','testemunha','representante_legal')
       or (_e ? 'ordem' and (
         jsonb_typeof(_e -> 'ordem') <> 'number'
         or (_e ->> 'ordem')::numeric < 1
         or (_e ->> 'ordem')::numeric <> trunc((_e ->> 'ordem')::numeric)
       ))
       or (_e ? 'obrigatorio' and jsonb_typeof(_e -> 'obrigatorio') <> 'boolean')
       or (_e ? 'profile_id' and (
         jsonb_typeof(_e -> 'profile_id') <> 'string'
         or (_e ->> 'profile_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       ))
       or (_e ? 'professional_profile_id' and (
         jsonb_typeof(_e -> 'professional_profile_id') <> 'string'
         or (_e ->> 'professional_profile_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       ))
       or (_e ? 'identificacao' and jsonb_typeof(_e -> 'identificacao') <> 'object')
       or (_e - 'papel' - 'ordem' - 'obrigatorio' - 'profile_id' - 'professional_profile_id' - 'identificacao') <> '{}'::jsonb
    then return false; end if;
  end loop;
  for _e in select value from jsonb_array_elements(_escopos) loop
    if jsonb_typeof(_e) <> 'object' or jsonb_typeof(_e -> 'codigo') <> 'string' or length(btrim(_e ->> 'codigo')) = 0
       or jsonb_typeof(_e -> 'rotulo') <> 'string' or length(btrim(_e ->> 'rotulo')) = 0
       or (_e - 'codigo' - 'rotulo') <> '{}'::jsonb
    then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

alter table curadoria.legal_documents
  add column regime curadoria.legal_regime not null default 'adesao',
  add column categoria text,
  add column ordem_de_apresentacao smallint;

comment on column curadoria.legal_documents.regime is
  'adesao = texto identico para todos (a prova e o par texto vigente + ato). instrumento = uma instancia personalizada por titular (a prova e o par instancia + ato). Regra objetiva: se o documento assinado contem QUALQUER campo do titular, e instrumento.';

-- O contrato de campos, assinantes e escopos vive na VERSÃO — é dado
-- publicado, não código. Documento novo passa a ser publicação, nunca deploy.
alter table curadoria.legal_document_versions
  -- Chaves que o corpo exige. Cada elemento é o nome da chave (texto) ou um
  -- objeto {"chave": "...", "rotulo": "..."} — o rótulo é para a tela.
  add column variaveis_requeridas jsonb not null default '[]'::jsonb,
  -- [{"papel": "titular", "ordem": 1, "obrigatorio": true}, ...]
  add column assinantes_exigidos jsonb not null default '[]'::jsonb,
  -- [{"codigo": "uso_de_imagem", "rotulo": "Uso de imagem"}, ...]
  -- NASCE VAZIO de propósito: enquanto o jurídico não delimitar os escopos
  -- revogáveis, só a revogação integral opera. O esquema não muda depois.
  add column escopos_revogaveis jsonb not null default '[]'::jsonb,
  add column nivel_exigido curadoria.legal_signature_level,
  add column aprovado_por uuid references curadoria.profiles (id) on delete set null,
  add column aprovado_em timestamptz,
  add column motivo_da_mudanca text,
  add constraint legal_document_versions_contratos_validos check (
    curadoria.g0_r1_contratos_json_validos(variaveis_requeridas, assinantes_exigidos, escopos_revogaveis)
  );

-- ---------------------------------------------------------------------------
-- 3. A instância — o que ESTA pessoa assinou
-- ---------------------------------------------------------------------------

create table curadoria.legal_document_instances (
  id uuid primary key default extensions.uuid_generate_v4(),

  -- A versão-modelo de origem. `restrict`: a procedência não se apaga.
  version_id uuid not null
    references curadoria.legal_document_versions (id) on delete restrict,

  -- O titular: uma conta OU um perfil profissional. Mesmo padrão de
  -- `legal_acceptances` — o profissional pode não ter conta nenhuma.
  profile_id uuid references curadoria.profiles (id) on delete restrict,
  professional_profile_id uuid
    references curadoria.professional_profiles (id) on delete restrict,

  -- Por que este instrumento existe. A Procuração é condicional a um caso
  -- concreto; o Contrato não é — por isso opcional, nunca obrigatório.
  case_id uuid references curadoria.cases (id) on delete set null,
  contexto jsonb not null default '{}'::jsonb,

  -- O CONTEÚDO CONGELADO. `corpo` é o que a pessoa leu e assinou.
  corpo text not null check (length(btrim(corpo)) > 0),
  -- O snapshot dos campos: permite responder "qual era o endereço declarado
  -- quando ela assinou?" sem reprocessar texto. O cadastro segue evoluindo;
  -- isto aqui não acompanha, e é essa a diferença que torna auditável
  -- qualquer divergência entre o perfil de hoje e o instrumento de então.
  variaveis jsonb not null default '{}'::jsonb,

  -- OS DOIS HASHES. O da instância é gerado pelo banco sobre o corpo; o da
  -- versão é copiado pelo servidor no ato da criação.
  instancia_hash text generated always as (
    encode(extensions.digest(corpo, 'sha256'), 'hex')
  ) stored,
  conteudo_hash text not null,

  -- Estado da ASSINATURA (derivado — ver função e trigger abaixo).
  status curadoria.legal_instance_status not null default 'aguardando_assinaturas',
  gerada_em timestamptz not null default now(),
  gerada_por uuid references curadoria.profiles (id) on delete set null,
  assinada_em timestamptz,
  -- Validade da OFERTA de assinatura — não confundir com eficácia.
  expira_em timestamptz,

  -- EFICÁCIA DO INSTRUMENTO — eixo independente do estado da assinatura.
  -- A Procuração vigora por prazo contado da assinatura: um instrumento pode
  -- estar assinado (fato) e ineficaz (prazo vencido) ao mesmo tempo.
  eficaz_de timestamptz,
  eficaz_ate timestamptz,

  -- Vínculo OPCIONAL com artefato que a instância declara. Referência opaca:
  -- este módulo guarda tipo, referência e hash, e não conhece o domínio do
  -- outro lado. A integração concreta (Protocolo da Prática) é o G0.2.
  artefato_tipo text,
  artefato_ref jsonb,
  artefato_versao text,
  artefato_hash text,

  -- Idempotência EXPLÍCITA: sem chave, cada chamada cria uma instância nova
  -- (duas propostas de contrato são dois documentos, não um repetido).
  idempotency_key text,

  -- Aditivos e substituições: a nova aponta para a anterior.
  instancia_substituida_id uuid
    references curadoria.legal_document_instances (id) on delete restrict,

  constraint legal_instances_um_titular check (
    (profile_id is not null and professional_profile_id is null)
    or (profile_id is null and professional_profile_id is not null)
  ),
  -- Estado terminal de assinatura exige a data; e não-assinado não pode
  -- carregar data de assinatura. Nenhum meio-termo silencioso.
  constraint legal_instances_assinatura_coerente check (
    (status = 'assinado' and assinada_em is not null)
    or (status <> 'assinado' and assinada_em is null)
  ),
  constraint legal_instances_eficacia_coerente check (
    eficaz_ate is null or eficaz_de is null or eficaz_ate >= eficaz_de
  ),
  -- Artefato é tudo ou nada: hash sem tipo não reconstitui coisa alguma.
  constraint legal_instances_artefato_coerente check (
    (artefato_tipo is null and artefato_ref is null and artefato_versao is null and artefato_hash is null)
    or (length(btrim(artefato_tipo)) > 0 and jsonb_typeof(artefato_ref) = 'object'
        and length(btrim(artefato_versao)) > 0 and artefato_hash ~ '^[0-9a-f]{64}$')
  ),
  constraint legal_instances_idempotencia_nao_vazia check (idempotency_key is null or length(btrim(idempotency_key)) > 0),
  constraint legal_instances_contexto_objeto check (jsonb_typeof(contexto) = 'object'),
  constraint legal_instances_variaveis_objeto check (jsonb_typeof(variaveis) = 'object')
);

create index legal_instances_titular_idx
  on curadoria.legal_document_instances (profile_id, gerada_em desc);
create index legal_instances_profissional_idx
  on curadoria.legal_document_instances (professional_profile_id, gerada_em desc);
create index legal_instances_version_idx
  on curadoria.legal_document_instances (version_id);
create index legal_instances_case_idx
  on curadoria.legal_document_instances (case_id) where case_id is not null;
create index legal_instances_substituida_idx
  on curadoria.legal_document_instances (instancia_substituida_id)
  where instancia_substituida_id is not null;
-- Idempotência só onde declarada.
create unique index legal_instances_idempotencia
  on curadoria.legal_document_instances (gerada_por, idempotency_key)
  where idempotency_key is not null;

comment on table curadoria.legal_document_instances is
  'Instancia documental: o instrumento renderizado para UM titular, imutavel desde o nascimento. Carrega os dois hashes (instancia e versao de origem) e o snapshot congelado dos campos. Nao existe rascunho: se um dado estava errado, cria-se outra instancia.';

-- ---------------------------------------------------------------------------
-- 4. Assinantes exigidos — a EXPECTATIVA (o fato mora no livro de atos)
-- ---------------------------------------------------------------------------

create table curadoria.legal_instance_signers (
  id uuid primary key default extensions.uuid_generate_v4(),
  instance_id uuid not null
    references curadoria.legal_document_instances (id) on delete restrict,
  papel curadoria.legal_signer_role not null,
  ordem smallint not null default 1 check (ordem > 0),
  obrigatorio boolean not null default true,

  -- Quem é esperado, quando já se sabe. Nulos nos dois quando o assinante
  -- não tem representação no sistema (testemunha externa) — caso que depende
  -- de D-6 e que, por isso, ainda não tem caminho de assinatura.
  profile_id uuid references curadoria.profiles (id) on delete set null,
  professional_profile_id uuid
    references curadoria.professional_profiles (id) on delete set null,
  identificacao_declarada jsonb not null default '{}'::jsonb,

  criado_em timestamptz not null default now(),
  unique (instance_id, papel, ordem)
);

create index legal_instance_signers_instance_idx
  on curadoria.legal_instance_signers (instance_id, ordem);
create index legal_instance_signers_profile_idx
  on curadoria.legal_instance_signers (profile_id) where profile_id is not null;
create index legal_instance_signers_professional_idx
  on curadoria.legal_instance_signers (professional_profile_id)
  where professional_profile_id is not null;

comment on table curadoria.legal_instance_signers is
  'Quem PRECISA assinar uma instancia, com papel e ordem. E expectativa: o ato efetivamente ocorrido mora em legal_acceptances (livro unico), ligado por signer_id. Status do assinante e derivado da existencia do ato — nunca gravado aqui.';

-- ---------------------------------------------------------------------------
-- 5. O livro único recebe a assinatura de instrumento
-- ---------------------------------------------------------------------------

alter table curadoria.legal_acceptances
  add column instance_id uuid
    references curadoria.legal_document_instances (id) on delete restrict,
  add column signer_id uuid
    references curadoria.legal_instance_signers (id) on delete restrict,
  -- Cópia carimbada: a prova não depende de juntar tabelas.
  add column instancia_hash text,
  add column nivel curadoria.legal_signature_level not null default 'N1',
  add column provedor text,
  add column evidencia_externa jsonb,
  -- N2: o nome digitado pela pessoa, conferido pelo servidor contra o
  -- cadastro antes de gravar.
  add column declaracao_de_vontade text,
  -- A espécie do ato, DERIVADA: aceite de adesão vs. assinatura de
  -- instrumento. Coluna gerada porque um discriminador digitado poderia
  -- divergir do fato — e o fato é a presença da instância.
  add column especie text generated always as (
    case when instance_id is null then 'aceite' else 'assinatura' end
  ) stored;

-- Assinatura de instrumento é tudo-ou-nada: instância, assinante e hash da
-- instância andam juntos. Meio-preenchido seria prova pela metade.
alter table curadoria.legal_acceptances
  add constraint legal_acceptances_instrumento_coerente check (
    (instance_id is null and signer_id is null and instancia_hash is null)
    or (instance_id is not null and signer_id is not null and instancia_hash is not null)
  );

-- O nível não é rótulo: cada um exige a evidência que o sustenta.
alter table curadoria.legal_acceptances
  add constraint legal_acceptances_nivel_sustentado check (
    (nivel <> 'N2' or declaracao_de_vontade is not null)
    and (nivel <> 'N3' or (provedor is not null and evidencia_externa is not null))
  );

-- Um assinante assina uma vez. A duplicidade é impedida na estrutura, não só
-- na função — é a diferença entre garantia e disciplina.
create unique index legal_acceptances_uma_assinatura_por_assinante
  on curadoria.legal_acceptances (signer_id) where signer_id is not null;

create index legal_acceptances_instance_idx
  on curadoria.legal_acceptances (instance_id) where instance_id is not null;

-- ---------------------------------------------------------------------------
-- 6. Revogação por escopo — a substituição controlada do índice
-- ---------------------------------------------------------------------------

alter table curadoria.legal_acceptance_revocations
  -- NULL = revogação integral (o que o caminho existente sempre gravou).
  -- Preenchido = revogação de UMA autorização declarada na versão assinada.
  add column escopo text,
  add column escopo_rotulo text;

-- O índice atual — `unique (acceptance_id)` — impede duas revogações do mesmo
-- aceite. Correto para a integral, impeditivo para a por escopo, que é plural
-- por natureza (imagem hoje, currículo depois). O novo preserva a garantia
-- original (uma integral por aceite, pois escopo NULL colapsa em '') e libera
-- a plural, uma por escopo. A tabela é append-only: a troca não altera linha.
drop index if exists curadoria.legal_acceptance_revocations_unica;

create unique index legal_acceptance_revocations_unica
  on curadoria.legal_acceptance_revocations (acceptance_id, coalesce(escopo, ''));

comment on column curadoria.legal_acceptance_revocations.escopo is
  'NULL = revogacao integral. Preenchido = codigo de escopo declarado em legal_document_versions.escopos_revogaveis da versao assinada. Escopo nao declarado e erro, nunca texto livre.';

-- ---------------------------------------------------------------------------
-- 7. Rescisão — ato sobre o VÍNCULO, nunca sobre o consentimento
-- ---------------------------------------------------------------------------

create table curadoria.legal_instrument_terminations (
  id uuid primary key default extensions.uuid_generate_v4(),
  instance_id uuid not null
    references curadoria.legal_document_instances (id) on delete restrict,
  causa curadoria.legal_termination_cause not null,
  motivo text,
  -- Denúncia imotivada tem aviso prévio contratual: registrar a causa sem o
  -- prazo seria registro incompleto do ato.
  aviso_previo_dias smallint check (aviso_previo_dias is null or aviso_previo_dias >= 0),
  comunicada_em timestamptz,
  efetivada_em timestamptz not null default now(),
  registrada_por uuid references curadoria.profiles (id) on delete set null,
  -- O que sobrevive ao término: confidencialidade, proteção de dados,
  -- prestação de contas. O término não apaga o que veio antes.
  efeitos_sobreviventes text,
  criada_em timestamptz not null default now(),

  constraint legal_terminations_denuncia_exige_aviso check (
    causa <> 'denuncia_imotivada' or aviso_previo_dias is not null
  )
);

-- Rescindir duas vezes o mesmo instrumento não significa nada.
create unique index legal_terminations_uma_por_instrumento
  on curadoria.legal_instrument_terminations (instance_id);
create index legal_terminations_registrada_por_idx
  on curadoria.legal_instrument_terminations (registrada_por)
  where registrada_por is not null;

comment on table curadoria.legal_instrument_terminations is
  'Rescisao/encerramento do VINCULO. NAO e revogacao: nao apaga, nao invalida e nao revoga a assinatura historica — apenas encerra a eficacia dali para frente. Confundir os dois faria o sistema afirmar que o contrato nunca valeu, quando o que houve foi termino.';

-- ---------------------------------------------------------------------------
-- 8. Triggers — a imutabilidade que não depende de disciplina
-- ---------------------------------------------------------------------------

-- Validação de nascimento: o que uma instância nunca pode ser, nem por
-- service_role, nem por caminho novo que alguém escreva amanhã.
create or replace function curadoria.enforce_legal_instance_insert()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _regime curadoria.legal_regime;
begin
  select d.regime into _regime
  from curadoria.legal_document_versions v
  join curadoria.legal_documents d on d.id = v.document_id
  where v.id = new.version_id;

  if _regime is distinct from 'instrumento' then
    raise exception 'Só documento de regime instrumento gera instância (documento é %)', coalesce(_regime::text, 'inexistente')
      using errcode = '23514';
  end if;

  -- Marcador não substituído significa que a pessoa assinaria um texto com
  -- lacuna. É recusa estrutural, não validação de formulário.
  if new.corpo ~ '\{\{\s*[^}]*\}\}' then
    raise exception 'Instrumento com marcador não resolvido não é assinável'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger legal_instances_valida_insercao
  before insert on curadoria.legal_document_instances
  for each row execute function curadoria.enforce_legal_instance_insert();

-- Imutabilidade com exceção NOMEADA. Sem a exceção, o estado da assinatura
-- não poderia evoluir; com ela irrestrita, o conteúdo assinado poderia ser
-- reescrito. As quatro colunas liberadas são todas derivadas de atos.
create or replace function curadoria.enforce_legal_instance_congelada()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'legal_document_instances é append-only: o instrumento assinado não se apaga'
      using errcode = '23514';
  end if;

  if new.version_id is distinct from old.version_id
     or new.profile_id is distinct from old.profile_id
     or new.professional_profile_id is distinct from old.professional_profile_id
     or new.case_id is distinct from old.case_id
     or new.contexto is distinct from old.contexto
     or new.corpo is distinct from old.corpo
     or new.variaveis is distinct from old.variaveis
     or new.conteudo_hash is distinct from old.conteudo_hash
     or new.gerada_em is distinct from old.gerada_em
     or new.gerada_por is distinct from old.gerada_por
     or new.expira_em is distinct from old.expira_em
     or new.artefato_tipo is distinct from old.artefato_tipo
     or new.artefato_ref is distinct from old.artefato_ref
     or new.artefato_versao is distinct from old.artefato_versao
     or new.artefato_hash is distinct from old.artefato_hash
     or new.idempotency_key is distinct from old.idempotency_key
     or new.instancia_substituida_id is distinct from old.instancia_substituida_id
  then
    raise exception 'Instância congelada: só status, data de assinatura e eficácia evoluem (e só por função)'
      using errcode = '23514';
  end if;

  -- Assinado é final: a eficácia expira, o ato não. Um instrumento assinado
  -- jamais volta a "aguardando", nem vira "cancelado".
  if old.status = 'assinado' and new.status is distinct from 'assinado' then
    raise exception 'Instância assinada não muda de estado — a eficácia expira, o ato não'
      using errcode = '23514';
  end if;
  if old.status in ('expirado', 'cancelado') and new.status is distinct from old.status then
    raise exception 'Estado terminal (%) não retrocede', old.status using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger legal_instances_congelada
  before update or delete on curadoria.legal_document_instances
  for each row execute function curadoria.enforce_legal_instance_congelada();

-- A lista de assinantes exigidos nasce com a instância e não muda depois:
-- alterar quem precisa assinar depois de alguém ter assinado mudaria a regra
-- no meio do ato. A única janela de escrita é a criação, antes de existir
-- qualquer assinatura.
create or replace function curadoria.enforce_legal_signers_congelados()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _status curadoria.legal_instance_status;
  _assinaturas integer;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    raise exception 'legal_instance_signers é imutável: a lista de assinantes exigidos nasce com a instância'
      using errcode = '23514';
  end if;

  select i.status into _status
  from curadoria.legal_document_instances i where i.id = new.instance_id;

  select count(*) into _assinaturas
  from curadoria.legal_acceptances a where a.instance_id = new.instance_id;

  if _status is distinct from 'aguardando_assinaturas' or _assinaturas > 0 then
    raise exception 'Assinante não entra em instrumento já assinado ou encerrado'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger legal_instance_signers_congelados
  before insert or update or delete on curadoria.legal_instance_signers
  for each row execute function curadoria.enforce_legal_signers_congelados();

-- ---------------------------------------------------------------------------
-- 9. criar_instancia_de_documento — a porta única de criação
-- ---------------------------------------------------------------------------

create or replace function curadoria.criar_instancia_de_documento(
  _version_id uuid,
  _profile_id uuid default null,
  _professional_profile_id uuid default null,
  _variaveis jsonb default '{}'::jsonb,
  _contexto jsonb default '{}'::jsonb,
  _case_id uuid default null,
  _expira_em timestamptz default null,
  _artefato jsonb default null,
  _idempotency_key text default null
)
returns curadoria.legal_document_instances
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _actor uuid := (select auth.uid());
  _versao curadoria.legal_document_versions;
  _vigente curadoria.legal_document_versions;
  _documento curadoria.legal_documents;
  _instancia curadoria.legal_document_instances;
  _corpo text;
  _chave text;
  _valor text;
  _requerida text;
  _elem jsonb;
  _assinante jsonb;
  _papel curadoria.legal_signer_role;
  _tem_assinante boolean := false;
begin
  if _actor is null then
    raise exception 'Criar instrumento exige sessão autenticada' using errcode = '42501';
  end if;

  if (_profile_id is null) = (_professional_profile_id is null) then
    raise exception 'Um titular, e apenas um: conta OU perfil profissional'
      using errcode = '23514';
  end if;

  select * into _versao from curadoria.legal_document_versions where id = _version_id;
  if not found then
    raise exception 'Versão % não existe', _version_id using errcode = 'P0002';
  end if;

  select * into _documento from curadoria.legal_documents where id = _versao.document_id;

  if _documento.regime <> 'instrumento' then
    raise exception 'Documento % é de regime adesão — não gera instância', _documento.slug
      using errcode = '23514';
  end if;

  -- Mesma regra do aceite: só se instrumenta o que está vigente. Gerar
  -- instância de versão superada produziria um documento que a pessoa não
  -- deveria estar assinando.
  _vigente := curadoria.versao_vigente(_versao.document_id);
  if _vigente.id is distinct from _versao.id then
    raise exception 'Versão % não é a vigente do documento', _versao.versao using errcode = '23514';
  end if;

  -- Quem pode instrumentar: o próprio titular (onboarding), o administrador,
  -- e a Curadoria quando o titular é um perfil profissional.
  if not (
    curadoria.has_role('administrador')
    or (_profile_id is not null and _profile_id = _actor)
    or (_professional_profile_id is not null and curadoria.has_role('curador_medico'))
  ) then
    raise exception 'Não autorizado a gerar este instrumento' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(_variaveis, '{}'::jsonb)) <> 'object' or jsonb_typeof(coalesce(_contexto, '{}'::jsonb)) <> 'object' then
    raise exception 'Variáveis e contexto do instrumento devem ser objetos' using errcode = '23514';
  end if;
  if _idempotency_key is not null and length(btrim(_idempotency_key)) = 0 then
    raise exception 'A chave de idempotência não pode ser vazia' using errcode = '23514';
  end if;
  if _artefato is not null and (
       jsonb_typeof(_artefato) <> 'object' or (_artefato - 'tipo' - 'ref' - 'versao' - 'hash') <> '{}'::jsonb
       or jsonb_typeof(_artefato -> 'tipo') <> 'string' or jsonb_typeof(_artefato -> 'ref') <> 'object'
       or jsonb_typeof(_artefato -> 'versao') <> 'string' or jsonb_typeof(_artefato -> 'hash') <> 'string'
       or length(btrim(_artefato ->> 'tipo')) = 0 or length(btrim(_artefato ->> 'versao')) = 0
       or (_artefato ->> 'hash') !~ '^[0-9a-f]{64}$'
     ) then
    raise exception 'Artefato inválido: tipo, ref-objeto, versão e hash SHA-256 são obrigatórios' using errcode = '23514';
  end if;

  -- Toda chave requerida presente e não vazia. Instrumento com lacuna não é
  -- oferecido para assinatura — a recusa acontece ANTES de existir qualquer
  -- coisa para a pessoa ler.
  for _elem in select value from jsonb_array_elements(_versao.variaveis_requeridas) loop
    _requerida := case
      when jsonb_typeof(_elem) = 'object' then _elem ->> 'chave'
      else _elem #>> '{}'
    end;
    if _requerida is null or btrim(_requerida) = '' then
      continue;
    end if;
    if coalesce(btrim(_variaveis #>> array[_requerida]), '') = '' then
      raise exception 'Campo obrigatório do instrumento não preenchido: %', _requerida
        using errcode = '23514';
    end if;
  end loop;

  -- Renderização: o marcador é {{chave}}. O texto do jurídico é publicado
  -- com marcadores nessa forma; nada aqui reinterpreta o que ele escreveu.
  _corpo := _versao.conteudo;
  for _chave, _valor in
    select key, value #>> '{}' from jsonb_each(coalesce(_variaveis, '{}'::jsonb))
  loop
    _corpo := replace(_corpo, '{{' || _chave || '}}', coalesce(_valor, ''));
  end loop;

  -- A guarda final é do trigger (vale para qualquer caminho de escrita),
  -- mas a mensagem daqui diz QUAL marcador ficou — isso é para quem opera.
  if _corpo ~ '\{\{\s*[^}]*\}\}' then
    raise exception 'Marcador não resolvido no instrumento: %',
      (regexp_match(_corpo, '\{\{\s*[^}]*\}\}'))[1]
      using errcode = '23514';
  end if;

  -- Idempotência é escopada pelo ator e só retorna depois de todas as guardas.
  if _idempotency_key is not null then
    select * into _instancia from curadoria.legal_document_instances
    where gerada_por = _actor and idempotency_key = _idempotency_key;
    if found then
      if _instancia.version_id is distinct from _versao.id or _instancia.profile_id is distinct from _profile_id
         or _instancia.professional_profile_id is distinct from _professional_profile_id or _instancia.case_id is distinct from _case_id
         or _instancia.contexto is distinct from coalesce(_contexto, '{}'::jsonb) or _instancia.variaveis is distinct from coalesce(_variaveis, '{}'::jsonb)
         or _instancia.corpo is distinct from _corpo or _instancia.expira_em is distinct from _expira_em
         or _instancia.artefato_tipo is distinct from (_artefato ->> 'tipo')
         or _instancia.artefato_ref is distinct from (case when _artefato ? 'ref' then _artefato -> 'ref' else null end)
         or _instancia.artefato_versao is distinct from (_artefato ->> 'versao') or _instancia.artefato_hash is distinct from (_artefato ->> 'hash')
      then raise exception 'Colisão de idempotência: a chave já representa outro contrato' using errcode = '23505'; end if;
      return _instancia;
    end if;
  end if;

  -- A corrida — duas chamadas simultâneas
  -- com a mesma chave — só o índice único resolve, e quem perde precisa
  -- receber a instância vencedora, nunca um erro: idempotência que falha sob
  -- concorrência não é idempotência. Sem estado parcial: ou a linha inteira
  -- entra com seus assinantes, ou a transação não deixa rastro.
  begin
  insert into curadoria.legal_document_instances (
    version_id, profile_id, professional_profile_id, case_id, contexto,
    corpo, variaveis, conteudo_hash, status, gerada_por, expira_em,
    artefato_tipo, artefato_ref, artefato_versao, artefato_hash, idempotency_key
  ) values (
    _versao.id,
    _profile_id,
    _professional_profile_id,
    _case_id,
    coalesce(_contexto, '{}'::jsonb),
    _corpo,
    coalesce(_variaveis, '{}'::jsonb),
    _versao.conteudo_hash,          -- do BANCO, sempre
    'aguardando_assinaturas',
    _actor,
    _expira_em,
    _artefato ->> 'tipo',
    case when _artefato ? 'ref' then _artefato -> 'ref' else null end,
    _artefato ->> 'versao',
    _artefato ->> 'hash',
    _idempotency_key
  )
  returning * into _instancia;
  exception when unique_violation then
    if _idempotency_key is not null then
      select * into _instancia
      from curadoria.legal_document_instances
      where gerada_por = _actor and idempotency_key = _idempotency_key;
      if found and _instancia.version_id is not distinct from _versao.id and _instancia.profile_id is not distinct from _profile_id
         and _instancia.professional_profile_id is not distinct from _professional_profile_id and _instancia.case_id is not distinct from _case_id
         and _instancia.contexto is not distinct from coalesce(_contexto, '{}'::jsonb) and _instancia.variaveis is not distinct from coalesce(_variaveis, '{}'::jsonb)
         and _instancia.corpo is not distinct from _corpo and _instancia.expira_em is not distinct from _expira_em
         and _instancia.artefato_tipo is not distinct from (_artefato ->> 'tipo')
         and _instancia.artefato_ref is not distinct from (case when _artefato ? 'ref' then _artefato -> 'ref' else null end)
         and _instancia.artefato_versao is not distinct from (_artefato ->> 'versao') and _instancia.artefato_hash is not distinct from (_artefato ->> 'hash')
      then return _instancia; end if;
      raise exception 'Colisão de idempotência: a chave já representa outro contrato' using errcode = '23505';
    end if;
    raise;
  end;

  -- Os assinantes exigidos vêm da VERSÃO — dado publicado. É aqui que as
  -- respostas de D-6 (testemunhas) e D-7 (representante) aterrissam sem
  -- alterar estrutura: muda quantas linhas nascem, não o esquema.
  for _assinante in
    select value from jsonb_array_elements(_versao.assinantes_exigidos)
  loop
    _papel := coalesce(_assinante ->> 'papel', 'titular')::curadoria.legal_signer_role;
    insert into curadoria.legal_instance_signers (
      instance_id, papel, ordem, obrigatorio,
      profile_id, professional_profile_id, identificacao_declarada
    ) values (
      _instancia.id,
      _papel,
      coalesce((_assinante ->> 'ordem')::smallint, 1),
      coalesce((_assinante ->> 'obrigatorio')::boolean, true),
      -- O titular é vinculado ao sujeito da instância. Os demais papéis
      -- (CONTRATADA, testemunha, representante) só podem ser vinculados se a
      -- versão publicada disser A QUEM — sem isso, não haveria como saber
      -- quem, do outro lado, tem legitimidade para assinar. Quando o papel
      -- não declara conta, o assinante nasce sem sujeito e o instrumento
      -- permanece aguardando: é a verdade enquanto D-6/D-7 não respondem.
      case
        when _papel = 'titular' then _profile_id
        else nullif(btrim(coalesce(_assinante ->> 'profile_id', '')), '')::uuid
      end,
      case
        when _papel = 'titular' then _professional_profile_id
        else nullif(btrim(coalesce(_assinante ->> 'professional_profile_id', '')), '')::uuid
      end,
      coalesce(_assinante -> 'identificacao', '{}'::jsonb)
    );
    _tem_assinante := true;
  end loop;

  -- Versão que não declara assinantes: o titular assina. Nunca zero — uma
  -- instância sem assinante exigido seria um instrumento que ninguém assina.
  if not _tem_assinante then
    insert into curadoria.legal_instance_signers (
      instance_id, papel, ordem, obrigatorio, profile_id, professional_profile_id
    ) values (
      _instancia.id, 'titular', 1, true, _profile_id, _professional_profile_id
    );
  end if;

  return _instancia;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. assinar_instancia — o ato, no livro único
-- ---------------------------------------------------------------------------

create or replace function curadoria.assinar_instancia(
  _instance_id uuid,
  _signer_id uuid,
  _declaracao_de_vontade text default null,
  _ip text default null,
  _user_agent text default null,
  _provedor text default null,
  _evidencia_externa jsonb default null,
  _forma_de_obtencao text default null,
  _origem text default 'primeiro_acesso'
)
returns curadoria.legal_acceptances
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _actor uuid := (select auth.uid());
  _instancia curadoria.legal_document_instances;
  _assinante curadoria.legal_instance_signers;
  _versao curadoria.legal_document_versions;
  _vigente curadoria.legal_document_versions;
  _nome_cadastro text;
  _nivel curadoria.legal_signature_level;
  _natureza curadoria.legal_acceptance_nature;
  _registrado_por uuid;
  _forma text;
  _aceite curadoria.legal_acceptances;
  _exigidos integer;
  _assinados integer;
  _meses integer;
  _eficaz_ate timestamptz;
begin
  if _actor is null then
    raise exception 'Assinar exige sessão autenticada' using errcode = '42501';
  end if;

  -- LOCK DA INSTÂNCIA, e ele é a correção de um defeito real: o estado é
  -- derivado da CONTAGEM de assinaturas, e sob `read committed` duas
  -- assinaturas simultâneas dos dois últimos assinantes não enxergariam uma à
  -- outra — cada transação contaria 1 de 2, nenhuma fecharia o instrumento, e
  -- ele ficaria "aguardando" para sempre com todos já tendo assinado.
  -- Serializar por instância custa nada (a disputa é entre poucos assinantes
  -- do MESMO documento) e é o que torna o estado derivado confiável.
  select * into _instancia
  from curadoria.legal_document_instances
  where id = _instance_id
  for update;

  if not found then
    raise exception 'Instrumento % não existe', _instance_id using errcode = 'P0002';
  end if;

  if _instancia.status <> 'aguardando_assinaturas' then
    raise exception 'Instrumento em estado % não recebe assinatura', _instancia.status
      using errcode = '23514';
  end if;

  if _instancia.expira_em is not null and _instancia.expira_em <= now() then
    raise exception 'A oferta de assinatura deste instrumento expirou em %', _instancia.expira_em
      using errcode = '23514';
  end if;

  if exists (
    select 1 from curadoria.legal_document_instances
    where instancia_substituida_id = _instancia.id
  ) then
    raise exception 'Instrumento substituído por outro não é assinável' using errcode = '23514';
  end if;

  if exists (
    select 1 from curadoria.legal_instrument_terminations where instance_id = _instancia.id
  ) then
    raise exception 'Instrumento rescindido não recebe assinatura' using errcode = '23514';
  end if;

  -- A versão de origem precisa continuar vigente: publicada uma redação
  -- nova, o instrumento em trânsito ficou velho e deve ser regerado. Mesma
  -- regra que o aceite de adesão já aplica.
  select * into _versao from curadoria.legal_document_versions where id = _instancia.version_id;
  _vigente := curadoria.versao_vigente(_versao.document_id);
  if _vigente.id is distinct from _versao.id then
    raise exception 'A versão-modelo deste instrumento foi superada — gere o instrumento novamente'
      using errcode = '23514';
  end if;

  select * into _assinante from curadoria.legal_instance_signers where id = _signer_id;
  if not found or _assinante.instance_id <> _instancia.id then
    raise exception 'Assinante não pertence a este instrumento' using errcode = '23514';
  end if;

  if exists (select 1 from curadoria.legal_acceptances where signer_id = _signer_id) then
    raise exception 'Este assinante já assinou — um ato por assinante' using errcode = '23505';
  end if;

  -- Quem pratica o ato define a NATUREZA, e a natureza é o que distingue
  -- pesos jurídicos diferentes. Nunca se registra como eletrônico do titular
  -- um ato que a equipe praticou.
  if _assinante.profile_id is not null then
    if _assinante.profile_id <> _actor then
      raise exception 'Só o próprio assinante pratica o ato eletrônico' using errcode = '42501';
    end if;
    _natureza := 'eletronico_pelo_titular';
    _registrado_por := null;
    _forma := null;
  elsif _assinante.professional_profile_id is not null then
    if not (curadoria.has_role('administrador') or curadoria.has_role('curador_medico')) then
      raise exception 'Só a Curadoria registra o aceite de um profissional' using errcode = '42501';
    end if;
    if length(btrim(coalesce(_forma_de_obtencao, ''))) = 0 then
      raise exception 'A forma como o aceite foi obtido é obrigatória — um registro sem ela não prova nada'
        using errcode = '23514';
    end if;
    _natureza := 'registrado_pela_equipe';
    _registrado_por := _actor;
    _forma := btrim(_forma_de_obtencao);
  else
    -- Testemunha ou representante sem representação no sistema. Assinar por
    -- ele seria inventar um ato: o caminho depende de D-6/D-7 e ainda não
    -- existe. O instrumento permanece aguardando, que é a verdade.
    raise exception 'Assinante sem sujeito no sistema (papel %) não tem caminho de assinatura nesta versão', _assinante.papel
      using errcode = '23514';
  end if;

  -- O NÍVEL É DO SERVIDOR. O cliente não o informa e não o escolhe: ele sai
  -- do caminho efetivamente percorrido.
  if _provedor is not null or _evidencia_externa is not null then
    raise exception 'N3 exige porta confiável de provedor; o caminho público não aceita evidência autodeclarada' using errcode = '42501';
  elsif _natureza = 'eletronico_pelo_titular'
        and _declaracao_de_vontade is not null then
    select btrim(coalesce(p.display_name, '')) into _nome_cadastro
    from curadoria.profiles p where p.id = _assinante.profile_id;
    -- Declaração de vontade só vale se conferir com o cadastro. Não
    -- conferindo, o ato acontece — mas como N1, e o registro diz a verdade.
    if _nome_cadastro <> ''
       and lower(btrim(_declaracao_de_vontade)) = lower(_nome_cadastro) then
      _nivel := 'N2';
    else
      _nivel := 'N1';
    end if;
  else
    _nivel := 'N1';
  end if;

  if _versao.nivel_exigido is not null and not (
       _versao.nivel_exigido = 'N1'
       or (_versao.nivel_exigido = 'N2' and _nivel in ('N2','N3'))
       or (_versao.nivel_exigido = 'N3' and _nivel = 'N3')
     ) then
    raise exception 'Nível de assinatura % inferior ao exigido % para o assinante %', _nivel, _versao.nivel_exigido, _assinante.id using errcode = '23514';
  end if;

  insert into curadoria.legal_acceptances (
    profile_id, professional_profile_id, version_id, conteudo_hash,
    instance_id, signer_id, instancia_hash,
    origem, idioma, ip, user_agent, contexto,
    natureza, registrado_por, forma_de_obtencao,
    nivel, provedor, evidencia_externa, declaracao_de_vontade
  ) values (
    _assinante.profile_id,
    _assinante.professional_profile_id,
    _instancia.version_id,
    _instancia.conteudo_hash,        -- hash da versão-modelo
    _instancia.id,
    _assinante.id,
    _instancia.instancia_hash,       -- hash do que a pessoa assinou
    _origem::curadoria.legal_acceptance_origin,
    _versao.idioma,
    nullif(btrim(coalesce(_ip, '')), '')::inet,
    nullif(btrim(coalesce(_user_agent, '')), ''),
    jsonb_build_object('papel_do_assinante', _assinante.papel),
    _natureza,
    _registrado_por,
    _forma,
    _nivel,
    _provedor,
    _evidencia_externa,
    -- N2 sem declaração seria rótulo sem lastro; a constraint recusaria.
    nullif(btrim(coalesce(_declaracao_de_vontade, '')), '')
  )
  returning * into _aceite;

  -- ESTADO DERIVADO: recontado do zero a cada ato, nunca incrementado.
  select
    count(*) filter (where s.obrigatorio),
    count(*) filter (where s.obrigatorio and a.id is not null)
  into _exigidos, _assinados
  from curadoria.legal_instance_signers s
  left join curadoria.legal_acceptances a on a.signer_id = s.id
  where s.instance_id = _instancia.id;

  if _exigidos > 0 and _assinados = _exigidos then
    -- Eficácia começa na última assinatura. O prazo, quando o documento tem
    -- um, veio congelado no snapshot — a Procuração é o caso concreto.
    _meses := nullif(btrim(coalesce(_instancia.variaveis ->> 'vigencia_meses', '')), '')::integer;
    _eficaz_ate := case when _meses is not null then now() + make_interval(months => _meses) else null end;

    update curadoria.legal_document_instances
    set status = 'assinado',
        assinada_em = now(),
        eficaz_de = now(),
        eficaz_ate = _eficaz_ate
    where id = _instancia.id;
  end if;

  return _aceite;
end;
$$;

-- ---------------------------------------------------------------------------
-- 11. revogar_por_escopo e rescindir_instrumento
-- ---------------------------------------------------------------------------

-- Revogar UMA autorização mantendo o documento vigente. Não substitui
-- `revoke_legal_acceptance` (integral): são atos distintos, e o índice único
-- garante uma integral e uma por escopo, sem duplicidade de nenhuma delas.
create or replace function curadoria.revogar_por_escopo(
  _acceptance_id uuid,
  _escopo text,
  _motivo text default null,
  _ip text default null,
  _user_agent text default null
)
returns curadoria.legal_acceptance_revocations
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _actor uuid := (select auth.uid());
  _aceite curadoria.legal_acceptances;
  _escopos jsonb;
  _rotulo text;
  _revogacao curadoria.legal_acceptance_revocations;
begin
  if _actor is null then
    raise exception 'Revogação exige sessão autenticada' using errcode = '42501';
  end if;
  if length(btrim(coalesce(_escopo, ''))) = 0 then
    raise exception 'Revogação por escopo exige o escopo — sem ele, use a revogação integral'
      using errcode = '23514';
  end if;

  select * into _aceite from curadoria.legal_acceptances where id = _acceptance_id;
  if not found then
    raise exception 'Aceite % não existe', _acceptance_id using errcode = 'P0002';
  end if;

  -- O titular revoga o próprio ato. Quando o titular é um perfil
  -- profissional (sem conta), quem registra é a Curadoria — mesma assimetria
  -- do registro do aceite.
  if _aceite.profile_id is not null then
    if _aceite.profile_id <> _actor then
      raise exception 'Só o titular revoga o próprio aceite' using errcode = '42501';
    end if;
  elsif not (curadoria.has_role('administrador') or curadoria.has_role('curador_medico')) then
    raise exception 'Só a Curadoria registra a revogação de um profissional' using errcode = '42501';
  end if;

  -- O escopo precisa estar DECLARADO na versão assinada. Escopo livre seria
  -- o sistema inventando categoria jurídica — e é justamente o que não pode.
  select v.escopos_revogaveis into _escopos
  from curadoria.legal_document_versions v where v.id = _aceite.version_id;

  select e ->> 'rotulo' into _rotulo
  from jsonb_array_elements(coalesce(_escopos, '[]'::jsonb)) e
  where e ->> 'codigo' = btrim(_escopo);

  if not found then
    raise exception 'Escopo % não é revogável nesta versão — a lista de escopos é dado publicado', _escopo
      using errcode = '23514';
  end if;

  insert into curadoria.legal_acceptance_revocations (
    acceptance_id, motivo, ip, user_agent, escopo, escopo_rotulo
  ) values (
    _acceptance_id,
    nullif(btrim(coalesce(_motivo, '')), ''),
    nullif(btrim(coalesce(_ip, '')), '')::inet,
    nullif(btrim(coalesce(_user_agent, '')), ''),
    btrim(_escopo),
    _rotulo
  )
  returning * into _revogacao;

  return _revogacao;
end;
$$;

-- Rescindir: encerra o vínculo, preserva integralmente a prova. A única
-- alteração no instrumento é a eficácia, que passa a terminar na data do
-- término — e nunca se estende, só se antecipa.
create or replace function curadoria.rescindir_instrumento(
  _instance_id uuid,
  _causa text,
  _motivo text default null,
  _aviso_previo_dias smallint default null,
  _comunicada_em timestamptz default null,
  _efetivada_em timestamptz default null,
  _efeitos_sobreviventes text default null
)
returns curadoria.legal_instrument_terminations
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _actor uuid := (select auth.uid());
  _instancia curadoria.legal_document_instances;
  _quando timestamptz := coalesce(_efetivada_em, now());
  _termino curadoria.legal_instrument_terminations;
begin
  if _actor is null then
    raise exception 'Rescisão exige sessão autenticada' using errcode = '42501';
  end if;

  select * into _instancia from curadoria.legal_document_instances where id = _instance_id;
  if not found then
    raise exception 'Instrumento % não existe', _instance_id using errcode = 'P0002';
  end if;

  -- Rescinde-se o que existe: um instrumento nunca assinado não constituiu
  -- vínculo nenhum — ele expira ou é cancelado, que é outra coisa.
  if _instancia.status <> 'assinado' then
    raise exception 'Só instrumento assinado se rescinde (estado atual: %)', _instancia.status
      using errcode = '23514';
  end if;

  if not (
    curadoria.has_role('administrador')
    or (_instancia.profile_id is not null and _instancia.profile_id = _actor)
    or (_instancia.professional_profile_id is not null and curadoria.has_role('curador_medico'))
  ) then
    raise exception 'Não autorizado a rescindir este instrumento' using errcode = '42501';
  end if;

  if _quando > now() then
    raise exception 'A rescisão não se efetiva no futuro' using errcode = '23514';
  end if;

  insert into curadoria.legal_instrument_terminations (
    instance_id, causa, motivo, aviso_previo_dias, comunicada_em,
    efetivada_em, registrada_por, efeitos_sobreviventes
  ) values (
    _instance_id,
    _causa::curadoria.legal_termination_cause,
    nullif(btrim(coalesce(_motivo, '')), ''),
    _aviso_previo_dias,
    _comunicada_em,
    _quando,
    _actor,
    nullif(btrim(coalesce(_efeitos_sobreviventes, '')), '')
  )
  returning * into _termino;

  -- A assinatura permanece intocada — é a prova de que o vínculo existiu.
  -- Só a eficácia se encerra, e só para frente.
  update curadoria.legal_document_instances
  set eficaz_ate = least(coalesce(eficaz_ate, _quando), _quando)
  where id = _instance_id;

  return _termino;
end;
$$;

-- ---------------------------------------------------------------------------
-- 12. RLS
-- ---------------------------------------------------------------------------

alter table curadoria.legal_document_instances enable row level security;
alter table curadoria.legal_instance_signers enable row level security;
alter table curadoria.legal_instrument_terminations enable row level security;

-- Instância NÃO é pública. `legal_document_versions` é legível por `anon`
-- porque documento publicado é público por natureza; repetir essa policy
-- aqui exporia contratos assinados com nome, CPF e endereço.
create policy legal_instances_leitura_do_titular
  on curadoria.legal_document_instances for select to authenticated
  using (
    profile_id = (select auth.uid())
    or curadoria.has_role('administrador')
    or (professional_profile_id is not null and curadoria.has_role('curador_medico'))
  );

create policy legal_instance_signers_leitura
  on curadoria.legal_instance_signers for select to authenticated
  using (
    profile_id = (select auth.uid())
    or curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.legal_document_instances i
      where i.id = legal_instance_signers.instance_id
        and (
          i.profile_id = (select auth.uid())
          or (i.professional_profile_id is not null and curadoria.has_role('curador_medico'))
        )
    )
  );

create policy legal_terminations_leitura
  on curadoria.legal_instrument_terminations for select to authenticated
  using (
    curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.legal_document_instances i
      where i.id = legal_instrument_terminations.instance_id
        and (
          i.profile_id = (select auth.uid())
          or (i.professional_profile_id is not null and curadoria.has_role('curador_medico'))
        )
    )
  );

-- Nenhuma policy de INSERT/UPDATE/DELETE, em nenhuma das três: a escrita
-- passa obrigatoriamente pelas funções acima.

-- ---------------------------------------------------------------------------
-- 13. GRANTs — o mínimo, e explícito
-- ---------------------------------------------------------------------------

grant select on curadoria.legal_document_instances to authenticated;
grant select on curadoria.legal_instance_signers to authenticated;
grant select on curadoria.legal_instrument_terminations to authenticated;

grant all on curadoria.legal_document_instances to service_role;
grant all on curadoria.legal_instance_signers to service_role;
grant all on curadoria.legal_instrument_terminations to service_role;

-- `anon` não lê instrumento, assinante nem rescisão: são dado pessoal.
revoke all on curadoria.legal_document_instances from anon;
revoke all on curadoria.legal_instance_signers from anon;
revoke all on curadoria.legal_instrument_terminations from anon;

-- CREATE FUNCTION concede EXECUTE a PUBLIC por padrão — e PUBLIC inclui
-- `anon`. Sem o revoke abaixo, um visitante sem sessão conseguiria CHAMAR
-- estas funções (elas recusariam por falta de (select auth.uid()), mas a superfície
-- exposta seria real). Privilégio é a camada anterior à validação.
revoke all on function curadoria.criar_instancia_de_documento(uuid, uuid, uuid, jsonb, jsonb, uuid, timestamptz, jsonb, text) from public, anon;
revoke all on function curadoria.assinar_instancia(uuid, uuid, text, text, text, text, jsonb, text, text) from public, anon;
revoke all on function curadoria.revogar_por_escopo(uuid, text, text, text, text) from public, anon;
revoke all on function curadoria.rescindir_instrumento(uuid, text, text, smallint, timestamptz, timestamptz, text) from public, anon;

grant execute on function curadoria.criar_instancia_de_documento(uuid, uuid, uuid, jsonb, jsonb, uuid, timestamptz, jsonb, text) to authenticated;
grant execute on function curadoria.assinar_instancia(uuid, uuid, text, text, text, text, jsonb, text, text) to authenticated;
grant execute on function curadoria.revogar_por_escopo(uuid, text, text, text, text) to authenticated;
grant execute on function curadoria.rescindir_instrumento(uuid, text, text, smallint, timestamptz, timestamptz, text) to authenticated;

-- As funções de trigger não são chamáveis por ninguém: só o Postgres as
-- dispara. Deixá-las com o EXECUTE padrão a PUBLIC seria superfície inútil.
revoke all on function curadoria.enforce_legal_instance_insert() from public, anon, authenticated;
revoke all on function curadoria.enforce_legal_instance_congelada() from public, anon, authenticated;
revoke all on function curadoria.enforce_legal_signers_congelados() from public, anon, authenticated;
revoke all on function curadoria.g0_r1_contratos_json_validos(jsonb, jsonb, jsonb) from public, anon, authenticated;
