-- ============================================================================
-- ITEM 2.1 — ESTRUTURA INERTE DA CAMADA DE DERIVAÇÃO
-- ============================================================================
--
-- FINALIDADE
--   Criar a PRIMEIRA das dez dependências do §15.0 da Arquitetura, e nada além
--   dela. A tabela nasce vazia, sem policy, sem escritor, sem leitor e sem
--   consumidor — estrutura, não operação.
--
--   §15.0 é explícito: "Nenhuma derivação persistida ou consumida pode começar
--   antes de existirem, SIMULTANEAMENTE" as dez dependências. `derivation_proposals`
--   é a primeira da lista. Cria-la vazia NÃO é persistir derivação: é fazer
--   existir aquilo que, junto das outras nove, um dia autorizará a 2.C.
--
-- O QUE ESTA MIGRATION NÃO FAZ
--   Nenhum `insert`, `update`, `seed` ou backfill. Nenhuma policy — a tabela
--   fica com RLS habilitada e ZERO políticas, o que a torna inalcançável por
--   `anon` e por `authenticated`. Nenhum grant a papel de aplicação.
--
--   Isso é deliberado e é a prova operacional da inércia: enquanto não houver
--   decisão sobre quem escreve e quem lê uma proposta, ninguém escreve e
--   ninguém lê. A ausência de policy não é esquecimento — é a fronteira.
--
-- ESTRUTURA (ADR-066 §14 — os doze itens obrigatórios)
--   Proposta sem qualquer um deles não nasce (§10, etapa 2). Não há campo
--   opcional nessa lista, e a tabela reflete isso em `not null`.
--
-- ESTADOS (ADR-066 §11 — cinco, lista fechada)
--   PROPOSTA (único não terminal) · CONFIRMADA · RECUSADA · SUPERADA · RETIRADA.
--   `PENDENTE` NÃO é estado, por decisão expressa da ADR: é a leitura
--   operacional de uma proposta em `PROPOSTA`. Criá-lo abriria a porta para
--   "pendente há muito tempo → confirmar automaticamente", que o §6 proíbe.
--   `RETIRADA` distingue mudança na REGRA de mudança no FATO (`SUPERADA`) —
--   fundi-las apagaria a diferença entre "a pessoa corrigiu o que disse" e "a
--   Autoridade de Método suspendeu a regra".
--
-- IMUTABILIDADE (ADR-066 §12)
--   Tudo o que foi registrado na emissão é imutável. Esta migration NÃO cria o
--   trigger que o impõe: sem escritor, não há o que impedir, e o gatilho
--   pertence ao pacote que abrir a escrita. Fica registrado como pendência.
--
-- PRÉ-CONDIÇÕES
--   `curadoria.cases`, `curadoria.professional_profiles`, `pgcrypto`.
--
-- ROLLBACK
--   drop table curadoria.derivation_proposals;
--   Nenhum dado é perdido: a tabela nasce vazia e assim permanece.
-- ============================================================================

create table curadoria.derivation_proposals (
  -- Item 1 — identidade: referência estável e única, para que atos a citem
  -- sem ambiguidade.
  id uuid primary key default gen_random_uuid(),

  -- Item 2 — alvo: de quem é a autoridade para confirmar. Um dos dois lados,
  -- nunca os dois e nunca nenhum (constraint abaixo). O conceito entra por
  -- CÓDIGO canônico, jamais por rótulo (I-2).
  case_id uuid references curadoria.cases (id) on delete cascade,
  professional_profile_id uuid references curadoria.professional_profiles (id) on delete cascade,
  subcriterion_code text not null check (length(btrim(subcriterion_code)) > 0),
  target_field text not null check (length(btrim(target_field)) > 0),

  -- Item 3 — o oferecimento em si: um valor da escala fechada do campo.
  suggested_value text not null check (length(btrim(suggested_value)) > 0),

  -- Itens 4 a 7 — a origem: primeiro elo da cadeia de proveniência. Sem ela o
  -- oferecimento não vem de ninguém; é invenção (§1).
  origin_record text not null check (length(btrim(origin_record)) > 0),
  origin_version text not null check (length(btrim(origin_version)) > 0),
  origin_declared_at timestamptz not null,
  origin_author uuid not null,

  -- Itens 8 e 9 — a regra e sua versão. Sem elas, o valor é mágico; a versão é
  -- a chave da calibração e da auditoria retroativa.
  rule_id text not null check (length(btrim(rule_id)) > 0),
  rule_version text not null check (length(btrim(rule_version)) > 0),

  -- Item 10 — quando o SISTEMA ofereceu. Distinta da data da origem, e a
  -- diferença importa: uma é quando ela falou, a outra é quando se sugeriu.
  emitted_at timestamptz not null default now(),

  -- Item 11 — catálogo vigente na emissão: permite reler sem reinterpretar.
  catalog_version text not null check (length(btrim(catalog_version)) > 0),

  -- Item 12 — grau de consequência (régua da DP-5): define o regime a que a
  -- proposta está sujeita.
  consequence_degree text not null check (length(btrim(consequence_degree)) > 0),

  -- ADR-066 §11 — cinco estados, lista fechada. Estado fora daqui não existe
  -- no domínio.
  state text not null default 'PROPOSTA' check (
    state in ('PROPOSTA', 'CONFIRMADA', 'RECUSADA', 'SUPERADA', 'RETIRADA')
  ),

  -- O alvo é UM: ou um Case, ou um profissional. "Nenhum dos dois" seria
  -- proposta sem a quem oferecer; "os dois" seria autoridade ambígua, e §14.2
  -- é claro que o alvo define de quem é a autoridade para confirmar.
  constraint derivation_proposals_alvo_unico check (
    (case_id is not null and professional_profile_id is null)
    or (case_id is null and professional_profile_id is not null)
  )
);

comment on table curadoria.derivation_proposals is
  'ADR-066 — o registro imutavel de um OFERECIMENTO: o Metodo sugere um valor a quem tem autoridade sobre o campo. Nunca e declaracao (P-08). Item 2.1: ESTRUTURA INERTE — nasce vazia, sem policy, sem escritor e sem leitor. A escrita depende das dez dependencias do §15.0 e pertence a 2.C.';

comment on column curadoria.derivation_proposals.state is
  'ADR-066 §11 — cinco estados, lista fechada. PROPOSTA e o unico nao terminal. PENDENTE NAO e estado: e a leitura operacional de PROPOSTA.';

comment on column curadoria.derivation_proposals.origin_declared_at is
  'Quando a PESSOA declarou — nunca quando o sistema ofereceu. A Fronteira Humana mostra "voce respondeu isto em 10/03".';

comment on column curadoria.derivation_proposals.emitted_at is
  'Quando o SISTEMA ofereceu. Distinta de origin_declared_at, e a diferenca importa.';

-- Índices do que se consultará quando houver consulta: por alvo e por estado.
-- Nascem junto da tabela porque criar índice depois, com a tabela em uso, é
-- operação de manutenção — e aqui ela está vazia.
create index derivation_proposals_case_idx
  on curadoria.derivation_proposals (case_id, subcriterion_code);
create index derivation_proposals_professional_idx
  on curadoria.derivation_proposals (professional_profile_id, subcriterion_code);
create index derivation_proposals_state_idx on curadoria.derivation_proposals (state);

-- ---------------------------------------------------------------------------
-- A INÉRCIA, IMPOSTA PELO BANCO
-- ---------------------------------------------------------------------------
--
-- RLS habilitada e NENHUMA policy: `anon` e `authenticated` não leem nem
-- escrevem uma linha sequer. Nenhum grant é concedido a papel de aplicação.
--
-- Quem escreve, quem lê e sob que autoridade é decisão das dez dependências do
-- §15.0 — e enquanto ela não existir, a tabela permanece fechada por
-- construção, não por convenção.
alter table curadoria.derivation_proposals enable row level security;

revoke all on curadoria.derivation_proposals from anon, authenticated;
