-- ============================================================================
-- REGRA 001 — NASCIMENTO EM `PROPOSTA`
-- ============================================================================
--
-- ORIGEM: ato do DT-01 (Fundador / Autoridade de Método), sobre a base
-- `8e49ce5`, com os quatro gates verdes: A (ADR-070 identificada como o
-- `approval_adr` da PROMOÇÃO, não deste nascimento) · B (identidade técnica do
-- DT-01 comprovada e lavrada) · C1 (as tabelas do ciclo existem em produção —
-- ledger 113) · C2 (o mecanismo: migration, ato administrativo controlado,
-- autoridade residual zero — `PREFLIGHT_MATERIALIZACAO_REGRA_001.md` §7B,
-- passo 6). D-13 comprovada por backup lógico com restauração ensaiada.
--
-- O QUE ESTE ARQUIVO FAZ, e nada além: grava a PRIMEIRA regra material da
-- Curadoria 2.0 no estado `PROPOSTA`, com sua transição de nascimento. Duas
-- linhas, uma transação.
--
-- O QUE ELE NÃO FAZ:
--   · não aprova a ADR-070 e não a usa como `approval_adr` (o nascimento não
--     exige ADR — o CHECK `adr_quando_exigida` só a cobra em VIGENTE/REVOGADA);
--   · não promove a `VIGENTE` (`PROPOSTA → VIGENTE` é ato próprio do DT-01,
--     com `seq=2`, `AUTORIDADE_DE_METODO` e `vigencia_seq=1`);
--   · não preenche `approved_by`, `approval_adr` nem `effective_from` na linha
--     da regra — permanecem NULOS PERMANENTEMENTE (o trigger append-only
--     recusa UPDATE), e é a transição de promoção que carrega a autoridade;
--   · não cria correspondência (`derivation_rule_degree_map`), não emite
--     proposta, não toca o Catálogo, não abre grant, não cria policy, RPC,
--     action nem writer permanente. CD-1 segue intacta; R-1 não começa.
--
-- APPEND-ONLY: as duas tabelas recusam UPDATE/DELETE para todo papel. Se algum
-- campo estivesse errado aqui, a correção seria uma VERSÃO NOVA — jamais uma
-- atualização silenciosa (MR1.1). Por isso nada é preenchido por inferência.
--
-- O PAR É INDIVISÍVEL: `derivation_rules_exige_transicao_inicial` é constraint
-- trigger DEFERIDO — a versão sem seu ato de nascimento é recusada no COMMIT.
-- Os dois INSERT abaixo nascem juntos ou não nascem.
--
-- ROLLBACK: não existe por desenho. Uma regra que existiu, existiu (I-7) — o
-- caminho de reversão do domínio é a transição de estado, não o apagamento.
-- ============================================================================

insert into curadoria.derivation_rules (
  rule_id,
  version,
  state,
  effective_from,
  effective_to,
  proposed_by,
  approved_by,
  approval_adr,
  rationale,
  evidence,
  suspended_or_revoked_at
)
values (
  'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA',
  1,
  'PROPOSTA',
  null,
  null,
  -- GATE B — identidade técnica real do DT-01, comprovada em `auth.users` de
  -- `aliviar-2-prod` e lavrada no REGISTRO_DE_GOVERNANCA §1.1. Nunca
  -- service_role, nunca postgres, nunca conta de agente ou fixture.
  '54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b',
  null,
  null,
  -- rationale — texto canônico do PREFLIGHT §5, sem reinterpretação
  'Primeira regra material da Curadoria 2.0, PROVISÓRIA. Alvo escolhido pelo DT-01 após a classificação por natureza funcional dos nove conceitos automáticos (CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md), que apontou CONTINUIDADE_COORDENACAO como candidato no 1 — conduta clinica do profissional, com negativa canonica explicita, independente do Case e do Concierge. Semantica deliberadamente CONSERVADORA: afirma CONFIRMADO so diante de conduta direta declarada, NAO_CONFIRMADO so diante da negativa explicita, e cala em todos os demais casos (P-04). Nasce para ser OBSERVADA sob R-1 — em especial a frequencia de ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO isolada. Revisao somente por versao nova; jamais por atualizacao silenciosa (MR1.1).',
  -- evidence — METODOLÓGICA (§6): justifica a existência da regra. Nunca a
  -- `practice_evidence` de um profissional concreto, que é vinculada proposta
  -- a proposta por `evidence_id`.
  'Catalogo Canonico 1.1.0, conceito CONTINUIDADE_COORDENACAO: cinco opcoes profissionais, negativa explicita ATUA_DE_FORMA_INDEPENDENTE, fonte entrevista, satisfied_by ausente. Protocolo da Pratica Profissional, Q9. Ficha REGRA_001_CONTINUIDADE_COORDENACAO.md v2.0 (autoridade material). CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md. CONTRATO_1_A (PA-13) e CONTRATO_2_C (PA-17). ADR-070. Nenhuma operacao real observada ate esta data — e dize-lo e melhor do que omitir.',
  null
);

insert into curadoria.derivation_rule_transitions (
  rule_id,
  rule_version,
  seq,
  from_state,
  to_state,
  vigencia_seq,
  actor_id,
  authority,
  reason,
  approval_adr,
  emergency_justification
)
values (
  'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA',
  1,
  1,
  null,          -- nascimento não tem origem (`nascimento_e_o_primeiro`)
  'PROPOSTA',
  null,          -- `vigencia_seq_coerente`: só existe quando to_state = VIGENTE
  '54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b',
  'PAPEL_INTERNO',  -- propor é de qualquer papel interno; a constraint
                    -- `papel_interno_so_propoe` o restringe ao nascimento
  -- A ACUMULAÇÃO É DECLARADA, NÃO SILENCIOSA (§3.6 do pré-flight; §1.1 do
  -- Registro de Governança): é esta declaração que impede que ela vire o normal.
  'Nascimento da primeira regra material da Curadoria 2.0, em PROPOSTA, por ato do DT-01 sobre a ficha REGRA_001_CONTINUIDADE_COORDENACAO.md v2.0. O DT-01 pratica tambem o ato de proposicao em ACUMULACAO TEMPORARIA DECLARADA, na forma do Registro de Governanca §1.1 e da ADR-068 item 6 / RA-1 do PA-2: hoje nao existe segundo vinculo tecnico interno lavrado, e nenhuma segunda identidade foi inventada para simular separacao de papeis. A aprovacao NAO acontece aqui — a entrada em VIGENTE exige ADR propria (ADR-070), transicao seq=2 e AUTORIDADE_DE_METODO.',
  null,          -- ADR só é exigida em VIGENTE/REVOGADA
  null           -- justificativa emergencial é exclusiva do freio do Curador
);
