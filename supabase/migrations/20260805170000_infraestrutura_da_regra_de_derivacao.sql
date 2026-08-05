-- ============================================================================
-- ITEM 2.2A — INFRAESTRUTURA DA REGRA DE DERIVAÇÃO
-- ============================================================================
--
-- FINALIDADE
--   Dar dono à regra. A Arquitetura §10.5 corrige o bloqueador B5 com uma frase
--   que é o ponto inteiro deste pacote: "uma regra sem dono é a pior forma de
--   automação — ninguém a propôs, ninguém a aprovou, ninguém pode suspendê-la,
--   e, quando errar, ninguém responde".
--
--   Esta migration cria a estrutura de governança dessa regra. Nada mais: ela
--   nasce vazia, sem policy, sem escritor, sem leitor e sem consumidor. Nenhuma
--   proposta pode nascer daqui, porque daqui não nasce nada.
--
-- OS DEZ ATRIBUTOS (§10.5 — "regra sem qualquer um deles NÃO PROPÕE")
--   identificador · versão · vigência · autor proponente · autoridade
--   aprovadora · justificativa · evidência utilizada · estado · histórico ·
--   data de suspensão ou revogação.
--
--   `evidence` nasce podendo ser a resposta honesta que o próprio §10.5
--   escreve: "nenhuma operação real". A Rede real não existe (RI10), e uma
--   regra que fingisse evidência seria pior do que uma que a declara ausente.
--
-- OS QUATRO ESTADOS (§10.5)
--   PROPOSTA · VIGENTE · SUSPENSA · REVOGADA. Lista fechada, em CHECK.
--
-- A3 — NENHUMA REGRA VIRA `VIGENTE` SEM AUTORIDADE DE MÉTODO
--   O CHECK `derivation_rules_vigente_exige_autoridade` recusa, no banco, uma
--   regra vigente sem autoridade aprovadora, sem a ADR que a aprovou e sem
--   início de vigência. Não é convenção nem revisão de código: é impossível
--   gravar. Aprovar é ato da Autoridade, por ADR — e o banco cobra os três.
--
-- HISTÓRICO APPEND-ONLY (§10.5 e I-7)
--   A chave é (identificador, versão). Alterar é criar VERSÃO NOVA, nunca
--   editar no lugar: a anterior permanece legível. O identificador é estável e
--   nunca reutilizado.
--
-- O QUE ESTA MIGRATION NÃO FAZ
--   Nenhum insert, nenhum seed, nenhuma regra de exemplo. Nenhuma policy —
--   RLS habilitada com ZERO políticas e nenhum grant a papel de aplicação, o
--   mesmo regime da estrutura da 2.1. Nenhum trigger: sem escritor, não há o
--   que impedir, e a imutabilidade pertence ao pacote que abrir a escrita.
--
--   Nenhuma tabela de VALORES (grau→importância). O §10.5 é explícito: forma e
--   governança podem ser decididas agora; VALORES, não — eles exigem Cases
--   reais, e a primeira versão de qualquer tabela desse tipo nasce marcada
--   PROVISÓRIA. Criá-la aqui seria decidir o que a Arquitetura reservou.
--
-- PRÉ-CONDIÇÕES
--   `curadoria.profiles`/`auth.users` para autoria; `pgcrypto`.
--
-- ROLLBACK
--   drop table curadoria.derivation_rules;
--   Nenhum dado é perdido: a tabela nasce vazia e assim permanece.
-- ============================================================================

create table curadoria.derivation_rules (
  -- Identificador ESTÁVEL, nunca reutilizado, + versão: juntos são a chave.
  -- Alterar uma regra é acrescentar versão, jamais editar a linha existente.
  rule_id text not null check (length(btrim(rule_id)) > 0),
  version integer not null check (version >= 1),

  -- Estado — os quatro do §10.5, lista fechada.
  state text not null default 'PROPOSTA' check (
    state in ('PROPOSTA', 'VIGENTE', 'SUSPENSA', 'REVOGADA')
  ),

  -- Vigência: início e fim. "Fora da vigência, não propõe" (§10.5).
  effective_from timestamptz,
  effective_to timestamptz,

  -- Autoria: quem sugeriu e quem respondeu por ela. São pessoas diferentes por
  -- desenho — propor é de qualquer papel interno; aprovar é da Autoridade.
  proposed_by uuid not null,
  approved_by uuid,
  /** A ADR que aprovou. Sem ela, aprovação é opinião. */
  approval_adr text,

  -- Justificativa: por que a regra existe.
  rationale text not null check (length(btrim(rationale)) > 0),

  -- Evidência utilizada. Hoje a resposta honesta pode ser "nenhuma operação
  -- real" — e dizê-lo é melhor do que omitir (§10.5).
  evidence text not null check (length(btrim(evidence)) > 0),

  -- Quando deixou de valer.
  suspended_or_revoked_at timestamptz,

  -- Histórico: cada versão é uma linha, e a data de nascimento fica.
  created_at timestamptz not null default now(),

  primary key (rule_id, version),

  -- A3 — VIGENTE exige autoridade, ADR e início de vigência. No banco, não na
  -- revisão de código: uma regra vigente sem dono não é gravável.
  constraint derivation_rules_vigente_exige_autoridade check (
    state <> 'VIGENTE'
    or (approved_by is not null and approval_adr is not null and effective_from is not null)
  ),

  -- Deixar de valer exige dizer quando.
  constraint derivation_rules_fim_tem_data check (
    state not in ('SUSPENSA', 'REVOGADA') or suspended_or_revoked_at is not null
  ),

  -- Vigência coerente: fim depois do início.
  constraint derivation_rules_vigencia_coerente check (
    effective_to is null or effective_from is null or effective_to > effective_from
  )
);

comment on table curadoria.derivation_rules is
  'Arquitetura §10.5 — a regra de derivacao como objeto de GOVERNANCA: dez atributos obrigatorios, quatro estados, historico append-only por (rule_id, version). Item 2.2A: INFRAESTRUTURA INERTE — nasce vazia, sem policy, sem escritor e sem leitor. Nenhuma proposta nasce daqui.';

comment on column curadoria.derivation_rules.state is
  'Os quatro estados do §10.5: PROPOSTA, VIGENTE, SUSPENSA, REVOGADA. VIGENTE exige autoridade aprovadora e ADR (constraint derivation_rules_vigente_exige_autoridade).';

comment on column curadoria.derivation_rules.evidence is
  'O que sustenta a regra. Hoje a resposta honesta pode ser "nenhuma operacao real" (§10.5) — a Rede real nao existe (RI10).';

comment on column curadoria.derivation_rules.approved_by is
  'A Autoridade de Metodo sobre Regras de Derivacao (§10.5) — funcao de governanca, nunca posto de trabalho. Quem a exerce e decisao do Fundador.';

create index derivation_rules_state_idx on curadoria.derivation_rules (state);
create index derivation_rules_vigencia_idx
  on curadoria.derivation_rules (effective_from, effective_to);

-- ---------------------------------------------------------------------------
-- A INÉRCIA, IMPOSTA PELO BANCO (A4 e A5)
-- ---------------------------------------------------------------------------
--
-- Mesmo regime da estrutura da 2.1: RLS habilitada, ZERO policies, nenhum grant
-- a papel de aplicação. Nenhuma proposta pode nascer porque nada aqui é
-- alcançável — nem para ler.
--
-- Quem escreve, quem lê e sob que autoridade é o que a 2.2B e as demais
-- dependências do §15.0 vão responder.
alter table curadoria.derivation_rules enable row level security;

revoke all on curadoria.derivation_rules from anon, authenticated;
