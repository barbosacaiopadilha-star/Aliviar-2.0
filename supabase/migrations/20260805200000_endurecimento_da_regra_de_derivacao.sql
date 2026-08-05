-- ============================================================================
-- ITEM 2.2A-MR1 — ENDURECIMENTO ESTRUTURAL DA REGRA DE DERIVAÇÃO
-- ============================================================================
--
-- FINALIDADE
--   A Verificação Independente da 2.2A apontou três invariantes que a
--   arquitetura já exige e que existiam apenas em prosa. Esta migration os
--   transforma em garantias do banco — enquanto as duas tabelas estão vazias e
--   o custo é zero.
--
--   1. regras e versões são append-only;
--   2. no máximo uma versão VIGENTE por `rule_id`;
--   3. toda proposta referencia uma regra e versão que existem.
--
--   O momento importa: depois que houver escrita, cada um destes vira migração
--   de dados. Agora é uma constraint.
--
-- MR1.0 — O ALINHAMENTO QUE A FK REVELOU
--   `derivation_proposals.rule_version` nasceu `text` (migration 20260805090000)
--   e `derivation_rules.version` nasceu `integer` (20260805170000). A FK composta
--   é IMPOSSÍVEL entre tipos diferentes — e foi ela que expôs a divergência
--   entre duas migrations minhas que ninguém tinha motivo para notar.
--
--   O tipo correto é o da regra: a versão é ordinal e monotônica (`>= 1`), e é
--   ela que a proposta guarda (ADR-066 §14.9). Com zero linhas nas duas tabelas,
--   o `alter ... type` não converte nada e não perde nada.
--
-- MR1.1 — APPEND-ONLY POR TRIGGER, NÃO POR POLICY
--   A proteção precisa valer "independentemente do papel, da policy, do caminho
--   de aplicação e do estado da regra" — e é por isso que é TRIGGER, não RLS.
--   Policy é filtrada por papel e ignorada por `service_role`; trigger dispara
--   para todo mundo, inclusive para o dono da tabela.
--
--   Versão nova nasce por INSERT com `version` maior. Esta migration NÃO cria o
--   escritor que faz isso: ela apenas garante que, quando ele existir, não terá
--   como sobrescrever o passado (I-7, §10.5 "a anterior permanece legível").
--
-- MR1.2 — UMA VIGENTE POR REGRA, POR ÍNDICE PARCIAL
--   Índice único parcial `where state = 'VIGENTE'`: declarativo, mínimo e sem
--   procedimento. `PROPOSTA`, `SUSPENSA` e `REVOGADA` coexistem à vontade — o
--   histórico depende disso —, e `rule_id` diferentes vigoram em paralelo.
--
--   Suspender ou revogar a vigente libera a próxima a vigorar. Esta migration
--   NÃO cria a transição: ela impõe a unicidade e nada mais.
--
-- MR1.3 — FK COMPOSTA, RESTRITIVA, SEM CASCATA
--   `on delete restrict` e `on update restrict`: a regra referenciada não pode
--   ser apagada, e a versão referenciada não pode mudar. Cascata aqui apagaria
--   ou reescreveria proposta a partir de mexida na regra — exatamente o que a
--   proveniência da ADR-066 existe para impedir.
--
--   (O `on update restrict` é redundante com o trigger append-only, e isso é
--   deliberado: se alguém desabilitar o trigger um dia, a FK ainda segura.)
--
-- O QUE ESTA MIGRATION NÃO FAZ
--   Nenhum seed, backfill ou DML de produto. Nenhuma tabela, estado, policy,
--   grant, RPC ou action. Nenhuma transição automática, nenhuma
--   irreversibilidade de REVOGADA, nenhuma FK de autoria — tudo isso ficou
--   fora do escopo por decisão da própria Verificação.
--
-- ROLLBACK — EXECUTADO E CONFERIDO, nesta ordem exata, sem `db reset`:
--
--   alter table curadoria.derivation_proposals drop constraint derivation_proposals_regra_fk;
--   drop index curadoria.derivation_rules_uma_vigente_por_regra;
--   drop trigger derivation_rules_append_only on curadoria.derivation_rules;
--   drop function curadoria.recusa_alteracao_de_regra();
--   alter table curadoria.derivation_proposals drop constraint derivation_proposals_rule_version_check;
--   alter table curadoria.derivation_proposals alter column rule_version type text using rule_version::text;
--   alter table curadoria.derivation_proposals
--     add constraint derivation_proposals_rule_version_check check (length(btrim(rule_version)) > 0);
--
--   Os dois passos do CHECK NÃO são opcionais: o `alter ... type` falha com
--   "function btrim(integer) does not exist" se a constraint de texto ainda
--   estiver lá — do mesmo jeito que falhou na primeira aplicação desta
--   migration, e por isso ela também os executa na ida.
--
--   Verificado: volta exatamente ao estado de 30c6809 (zero trigger, zero
--   índice, zero FK, zero função, `rule_version` de novo `text`), com as duas
--   tabelas vazias e sem reset do banco.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- MR1.0 — alinhar o tipo, para que a FK seja possível
-- ---------------------------------------------------------------------------
-- O CHECK original era de TEXTO (`length(btrim(...)) > 0`) e não sobrevive à
-- conversão. Sai, e no lugar entra a mesma regra que a Regra já impõe sobre a
-- própria versão: ordinal, começando em 1.
alter table curadoria.derivation_proposals
  drop constraint derivation_proposals_rule_version_check;

alter table curadoria.derivation_proposals
  alter column rule_version type integer using rule_version::integer;

alter table curadoria.derivation_proposals
  add constraint derivation_proposals_rule_version_check check (rule_version >= 1);

comment on column curadoria.derivation_proposals.rule_version is
  'A versao da regra que gerou a proposta (ADR-066 §14.9). Integer, igual a derivation_rules.version — a FK composta exige o mesmo tipo dos dois lados.';

-- ---------------------------------------------------------------------------
-- MR1.1 — append-only: a versão anterior permanece legível, sempre
-- ---------------------------------------------------------------------------
create or replace function curadoria.recusa_alteracao_de_regra()
returns trigger language plpgsql as $$
begin
  raise exception
    'Regra de derivacao e append-only (Arquitetura §10.5, I-7): % recusado. Alterar uma regra e criar VERSAO NOVA por insert; a anterior permanece legivel.',
    tg_op
    using errcode = 'restrict_violation';
end;
$$;

comment on function curadoria.recusa_alteracao_de_regra() is
  'MR1.1 — recusa UPDATE e DELETE em derivation_rules. Trigger, e nao policy: precisa valer para todo papel, inclusive service_role e o dono da tabela.';

create trigger derivation_rules_append_only
  before update or delete on curadoria.derivation_rules
  for each row execute function curadoria.recusa_alteracao_de_regra();

-- ---------------------------------------------------------------------------
-- MR1.2 — no máximo uma VIGENTE por regra
-- ---------------------------------------------------------------------------
create unique index derivation_rules_uma_vigente_por_regra
  on curadoria.derivation_rules (rule_id)
  where state = 'VIGENTE';

comment on index curadoria.derivation_rules_uma_vigente_por_regra is
  'MR1.2 — no maximo UMA versao VIGENTE por rule_id. PROPOSTA, SUSPENSA e REVOGADA coexistem: o historico depende disso.';

-- ---------------------------------------------------------------------------
-- MR1.3 — toda proposta aponta para uma regra e versão que existem
-- ---------------------------------------------------------------------------
alter table curadoria.derivation_proposals
  add constraint derivation_proposals_regra_fk
  foreign key (rule_id, rule_version)
  references curadoria.derivation_rules (rule_id, version)
  on update restrict
  on delete restrict;

comment on constraint derivation_proposals_regra_fk on curadoria.derivation_proposals is
  'MR1.3 — proposta orfa nao nasce (ADR-066 §1: "sem regra nomeada e versionada nao se sabe o que transformou a origem no valor"). RESTRICT dos dois lados: nenhuma cascata destrutiva sobre proveniencia.';
