-- ============================================================================
-- REGRA 001 — PROMOÇÃO `PROPOSTA → VIGENTE`
-- ============================================================================
--
-- ORIGEM: ato da AUTORIDADE DE MÉTODO (DT-01), autorizado pela **ADR-070**,
-- aprovada e lavrada em `DECISIONS.md` (item 6: *"Fica autorizada a entrada em
-- VIGENTE pelo rito da ADR-069, e somente por ele, com approval_adr =
-- 'ADR-070'. Esta ADR autoriza; não executa."*). Pacote exatamente como
-- lavrado na ADR-070 §10, com o `reason` canônico do §10.1 — não reescrito.
--
-- UM ÚNICO INSERT, NA TABELA DE TRANSIÇÕES. É a doutrina da ADR-069: **a
-- versão é fato, a transição é ato, o estado é leitura derivada**. Por isso
-- este arquivo NÃO faz — e não pode fazer:
--   · UPDATE em `derivation_rules` (o trigger MR1.1 recusa para todo papel);
--   · alteração do `state` da linha do nascimento, que PERMANECE `PROPOSTA`
--     como registro histórico — e isso é o esperado, não inconsistência;
--   · preenchimento tardio de `approved_by` — a ADR-070 §10.2 provou que o
--     campo legado não é o registro vinculante: o aprovador é o `actor_id`
--     desta transição, com `authority = AUTORIDADE_DE_METODO` e
--     `approval_adr = ADR-070`;
--   · preenchimento de `effective_from` — o fato temporal vinculante é o
--     `occurred_at` desta linha. (Observação documental já conhecida: o
--     `effective_from` legado não possui leitor; isso não bloqueia a promoção
--     e NÃO é corrigido aqui.)
--
-- O QUE ESTE ATO NÃO FAZ, deliberadamente: não liga o emissor profissional
-- (DR3 intocado), não cria `derivation_rule_degree_map` (CD-1 intacta), não
-- emite proposta, não inicia R-1 e não cria Regra 002. Com a regra VIGENTE, o
-- emissor CONTINUA devolvendo `SEM_REGRA_VIGENTE` — resultado esperado, não
-- falha: a conexão é emenda própria, de missão separada.
--
-- ROLLBACK: não existe por desenho. Reverter vigência é ato do domínio
-- (`VIGENTE → SUSPENSA/REVOGADA`, com ADR própria), nunca apagamento — as duas
-- tabelas são append-only para todo papel.
-- ============================================================================

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
  2,               -- `valida_transicao_da_regra`: seq = anterior + 1
  'PROPOSTA',      -- cadeia: iguala o `to_state` da transição seq=1
  'VIGENTE',
  1,               -- `vigencia_seq_coerente`: obrigatório em VIGENTE;
                   -- vigências fechadas (0) + 1
  '54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b',  -- DT-01, identidade técnica lavrada
  'AUTORIDADE_DE_METODO',  -- `papel_interno_so_propoe` proíbe PAPEL_INTERNO
                           -- aqui; CURADOR_DO_CASE só freia
  -- reason canônico — ADR-070 §10.1, literal
  'Promocao da primeira regra material da Curadoria 2.0 a VIGENTE, por ato da Autoridade de Metodo sobre a ADR-070, que aprovou o conteudo da versao 1 nos termos da ficha REGRA_001_CONTINUIDADE_COORDENACAO.md v2.0. Maturidade metodologica PROVISORIA: vigente no ciclo, provisoria no Metodo. R-1 aberta e ainda nao iniciada — a promocao nao emite proposta alguma (§10.4). Revisao somente por versao nova; jamais por atualizacao silenciosa (MR1.1).',
  'ADR-070',       -- `adr_quando_exigida`: obrigatório na entrada em VIGENTE
  null             -- justificativa emergencial é exclusiva do freio do Curador
);
