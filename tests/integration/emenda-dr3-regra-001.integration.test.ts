import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";
import { containerDoBanco } from "../apoio/stack-local";

/**
 * =============================================================================
 * EMENDA DR3 — A REGRA 001 `VIGENTE` LIGADA AO EMISSOR PROFISSIONAL
 * =============================================================================
 *
 * `CONTRATO_EMENDA_DR3_REGRA_001.md` (Agente 02). O que se prova aqui, no
 * banco real:
 *
 *   · os DEZESSETE casos do §12 (A–Q), com o **Teste O** — a segunda regra
 *     profissional no mesmo conceito — como o mais importante;
 *   · o avaliador é GENÉRICO: lê papéis, e a contradição precede a afirmação;
 *   · a proveniência aponta para a evidência e a versão EXATAS da regra;
 *   · **CD-1 intacta**: `derivation_rule_degree_map` permanece vazio e fora
 *     do caminho profissional;
 *   · o lado Case NÃO regride: as portas antigas seguem idênticas.
 *
 * Fixtures sintéticas em transação revertida; resíduo zero.
 */

const CONTAINER = containerDoBanco();

function psql(script: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1"],
    { input: script, encoding: "utf8" },
  ).trim();
}

function emTransacaoRevertida(corpo: string): string {
  return psql(`begin;\n${corpo}\nrollback;`);
}

const ATOR = "'00000000-0000-4000-8000-0000000d3001'::uuid";
const PERFIL = "'00000000-0000-4000-8000-0000000d3002'::uuid";
const OUTRO_PERFIL = "'00000000-0000-4000-8000-0000000d3003'::uuid";
const CONCEITO = "CONTINUIDADE_COORDENACAO";
const REGRA = "CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA";

const POSITIVA = "CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL";
const POSITIVA_2 = "ENVIA_RELATORIO_ESCRITO";
const POSITIVA_3 = "PARTICIPA_DE_DISCUSSAO_DE_CASO";
const NEGATIVA = "ATUA_DE_FORMA_INDEPENDENTE";
const INSUFICIENTE = "ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO";

const FIXTURE = `
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values (${ATOR}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dr3-teste@local', 'x', now(), now());
insert into curadoria.professional_profiles (id, profile_id, display_name, professional_identifier, created_by) values
  (${PERFIL}, null, 'Prof DR3', 'CRM-DR3-1', ${ATOR}),
  (${OUTRO_PERFIL}, null, 'Outro DR3', 'CRM-DR3-2', ${ATOR});
`;

/** Evidência corrente do par, com as opções dadas. */
const EVIDENCIA = (opcoes: string[], extra: { versao?: number; status?: string; catalogo?: string; perfil?: string } = {}) => {
  const { versao = 1, status = "nao_verificado", catalogo = "1.1.0", perfil = PERFIL } = extra;
  return `
insert into curadoria.practice_evidence
  (professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status, catalog_version)
values (${perfil}, '${CONCEITO}', ${versao}, '{${opcoes.join(",")}}', 'INSTITUCIONAL', 'entrevista', now(), ${ATOR}, '${status}', '${catalogo}');`;
};

const EMITIR = (perfil = PERFIL, marcador = "D") =>
  `select '${marcador}=' || curadoria.emitir_proposta_de_estado(${perfil}, '${CONCEITO}', ${ATOR});`;

const RAIO_X = `
select 'PROPOSTAS=' || count(*) ||
       coalesce(' | ' || string_agg(suggested_value || '@' || rule_id || 'v' || rule_version, ','), '')
from curadoria.derivation_proposals;`;

afterAll(() => {
  const residuo = psql(`
select (select count(*) from curadoria.derivation_proposals)
  || '|' || (select count(*) from curadoria.practice_evidence where professional_profile_id in (${PERFIL}, ${OUTRO_PERFIL}))
  || '|' || (select count(*) from auth.users where email = 'dr3-teste@local')
  || '|' || (select count(*) from curadoria.derivation_rule_degree_map);`);
  expect(residuo, "a emenda DR3 deixou resíduo").toBe("0|0|0|0");
});

// ---------------------------------------------------------------------------
// §12 · Os dezessete casos
// ---------------------------------------------------------------------------

describe("§12 · a matriz da ficha, caso a caso", () => {
  it("A · positiva direta → proposta CONFIRMADO", () => {
    const saida = emTransacaoRevertida(FIXTURE + EVIDENCIA([POSITIVA]) + EMITIR() + RAIO_X);
    expect(saida).toContain("D=EMITIDA");
    expect(saida).toContain(`PROPOSTAS=1 | CONFIRMADO@${REGRA}v1`);
  });

  it("B · negativa explícita → proposta NAO_CONFIRMADO", () => {
    const saida = emTransacaoRevertida(FIXTURE + EVIDENCIA([NEGATIVA]) + EMITIR() + RAIO_X);
    expect(saida).toContain("D=EMITIDA");
    expect(saida).toContain(`PROPOSTAS=1 | NAO_CONFIRMADO@${REGRA}v1`);
  });

  it("C · insuficiente isolada → zero proposta, EVIDENCIA_INSUFICIENTE", () => {
    const saida = emTransacaoRevertida(FIXTURE + EVIDENCIA([INSUFICIENTE]) + EMITIR() + RAIO_X);
    expect(saida).toContain("D=EVIDENCIA_INSUFICIENTE");
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("D · insuficiente + positiva → CONFIRMADO, UMA só proposta", () => {
    const saida = emTransacaoRevertida(FIXTURE + EVIDENCIA([INSUFICIENTE, POSITIVA]) + EMITIR() + RAIO_X);
    expect(saida).toContain("D=EMITIDA");
    expect(saida).toContain("PROPOSTAS=1 | CONFIRMADO@");
  });

  it("E · insuficiente + negativa → NAO_CONFIRMADO", () => {
    const saida = emTransacaoRevertida(FIXTURE + EVIDENCIA([INSUFICIENTE, NEGATIVA]) + EMITIR() + RAIO_X);
    expect(saida).toContain("D=EMITIDA");
    expect(saida).toContain("PROPOSTAS=1 | NAO_CONFIRMADO@");
  });

  it("F · positiva + negativa → EVIDENCIA_CONTRADITORIA: contradição não vira afirmação", () => {
    const saida = emTransacaoRevertida(FIXTURE + EVIDENCIA([POSITIVA, NEGATIVA]) + EMITIR() + RAIO_X);
    expect(saida).toContain("D=EVIDENCIA_CONTRADITORIA");
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("G · sem evidência → SEM_EVIDENCIA, e ausência nunca vira negativo", () => {
    const saida = emTransacaoRevertida(FIXTURE + EMITIR() + RAIO_X);
    expect(saida).toContain("D=SEM_EVIDENCIA");
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("H · conceito sem regra vigente → SEM_REGRA_VIGENTE (outro conceito automático)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        `
insert into curadoria.practice_evidence
  (professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status)
select ${PERFIL}, 'MODELO_COMUNICACAO', 1,
       array[(select o.value from curadoria.method_subcriterion_options o where o.subcriterion_code='MODELO_COMUNICACAO' and o.side='profissional' and o.field='principal' and o.active order by o.display_order limit 1)],
       'INSTITUCIONAL', 'entrevista', now(), ${ATOR}, 'nao_verificado';
select 'D=' || curadoria.emitir_proposta_de_estado(${PERFIL}, 'MODELO_COMUNICACAO', ${ATOR});` +
        RAIO_X,
    );
    expect(saida).toContain("D=SEM_REGRA_VIGENTE");
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("I · regra SUSPENSA → zero proposta (estado lido a cada chamada)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        EVIDENCIA([POSITIVA]) +
        `
insert into curadoria.derivation_rule_transitions
  (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason)
values ('${REGRA}', 1, 3, 'VIGENTE', 'SUSPENSA', null, ${ATOR}, 'AUTORIDADE_DE_METODO', 'suspensao de teste');
select 'ESTADO=' || curadoria.derivation_rule_state('${REGRA}', 1);` +
        EMITIR() +
        RAIO_X,
    );
    expect(saida).toContain("ESTADO=SUSPENSA");
    expect(saida).toContain("D=SEM_REGRA_VIGENTE");
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("J · regra REVOGADA → zero proposta", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        EVIDENCIA([POSITIVA]) +
        `
insert into curadoria.derivation_rule_transitions
  (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
values ('${REGRA}', 1, 3, 'VIGENTE', 'REVOGADA', null, ${ATOR}, 'AUTORIDADE_DE_METODO', 'revogacao de teste', 'ADR-070');
select 'ESTADO=' || curadoria.derivation_rule_state('${REGRA}', 1);` +
        EMITIR() +
        RAIO_X,
    );
    expect(saida).toContain("ESTADO=REVOGADA");
    expect(saida).toContain("D=SEM_REGRA_VIGENTE");
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("K · evidência nao_verificado emite, e o status NÃO entra no valor sugerido (I-5)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        EVIDENCIA([POSITIVA], { status: "nao_verificado" }) +
        EMITIR() +
        `
select 'VALOR=' || suggested_value || ' | SEM_STATUS_NA_PROPOSTA=' ||
       (position('nao_verificado' in coalesce(origin_record,'') || coalesce(suggested_value,'')) = 0)::text ||
       ' | RASTREAVEL=' || (origin_record = 'practice_evidence:' || (select id::text from curadoria.practice_evidence where professional_profile_id = ${PERFIL}))::text
from curadoria.derivation_proposals;`,
    );
    expect(saida).toContain("VALOR=CONFIRMADO");
    expect(saida).toContain("SEM_STATUS_NA_PROPOSTA=true");
    expect(saida).toContain("RASTREAVEL=true");
  });

  it("L · opção fora das canônicas → EVIDENCIA_INCOMPATIVEL", () => {
    // A evidência entra com opção inválida por caminho de owner (o validador
    // do payload é do writer da Base); o que se prova aqui é o AVALIADOR.
    const saida = emTransacaoRevertida(
      FIXTURE +
        `select 'D=' || curadoria.avalia_semantica_da_evidencia('${REGRA}', 1, '${CONCEITO}', array['OPCAO_QUE_NAO_EXISTE']);`,
    );
    expect(saida).toContain("D=EVIDENCIA_INCOMPATIVEL");
  });

  it("M · três positivas juntas → UMA proposta CONFIRMADO, sem contagem", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + EVIDENCIA([POSITIVA, POSITIVA_2, POSITIVA_3]) + EMITIR() + RAIO_X,
    );
    expect(saida).toContain("D=EMITIDA");
    expect(saida).toContain("PROPOSTAS=1 | CONFIRMADO@");
  });

  it("N · segunda chamada idêntica → JA_EMITIDA, e continua UMA proposta", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + EVIDENCIA([POSITIVA]) + EMITIR(PERFIL, "D1") + EMITIR(PERFIL, "D2") + RAIO_X,
    );
    expect(saida).toContain("D1=EMITIDA");
    expect(saida).toContain("D2=JA_EMITIDA");
    expect(saida).toContain("PROPOSTAS=1");
  });

  it("P · catálogo divergente → CATALOGO_DIVERGENTE", () => {
    // A Base recusa evidência de catálogo divergente no próprio INSERT — por
    // isso a guarda do EMISSOR só é alcançável semeando com os triggers
    // desligados. É a guarda dele que se prova aqui, não a da Base.
    const saida = emTransacaoRevertida(
      FIXTURE +
        "set session_replication_role = replica;" +
        EVIDENCIA([POSITIVA], { catalogo: "1.0.0" }) +
        "set session_replication_role = origin;" +
        EMITIR() +
        RAIO_X,
    );
    expect(saida).toContain("D=CATALOGO_DIVERGENTE");
    expect(saida).toContain("PROPOSTAS=0");
  });

  it("Q · declaração manual no Mapa PREVALECE → DECLARACAO_MANUAL_VIGENTE", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        EVIDENCIA([POSITIVA]) +
        `
insert into curadoria.professional_subcriterion_map (professional_profile_id, subcriterion_id, status)
select ${PERFIL}, s.id, 'NAO_CONFIRMADO' from curadoria.method_subcriteria s where s.code = '${CONCEITO}';` +
        EMITIR() +
        RAIO_X,
    );
    expect(saida).toContain("D=DECLARACAO_MANUAL_VIGENTE");
    expect(saida).toContain("PROPOSTAS=0");
  });
});

// ---------------------------------------------------------------------------
// TESTE O — o invariante que a emenda existe para fechar
// ---------------------------------------------------------------------------

describe("TESTE O · uma regra vigente por conceito, agora TAMBÉM no lado profissional", () => {
  const SEGUNDA_REGRA = `
insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence)
values ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, 'PROPOSTA', ${ATOR}, 'fixture do Teste O', 'fixture do Teste O');
insert into curadoria.derivation_rule_transitions
  (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason)
values ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, 1, null, 'PROPOSTA', null, ${ATOR}, 'PAPEL_INTERNO', 'nascimento de fixture');`;

  const COBERTURA_DA_SEGUNDA = `
insert into curadoria.derivation_rule_option_semantics (rule_id, rule_version, subcriterion_code, option_value, papel)
values
  ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, '${CONCEITO}', '${POSITIVA}', 'POSITIVA_DIRETA'),
  ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, '${CONCEITO}', '${POSITIVA_2}', 'POSITIVA_DIRETA'),
  ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, '${CONCEITO}', '${POSITIVA_3}', 'POSITIVA_DIRETA'),
  ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, '${CONCEITO}', '${NEGATIVA}', 'NEGATIVA_EXPLICITA'),
  ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, '${CONCEITO}', '${INSUFICIENTE}', 'INSUFICIENTE');`;

  const PROMOVER_A_SEGUNDA = `
insert into curadoria.derivation_rule_transitions
  (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
values ('SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE', 1, 2, 'PROPOSTA', 'VIGENTE', 1, ${ATOR}, 'AUTORIDADE_DE_METODO', 'promocao de fixture', 'ADR-070');`;

  function TENTAR(sql: string): string {
    return `
do $tenta$
begin
  ${sql}
  perform set_config('t.out', 'PASSOU', true);
exception when others then
  perform set_config('t.out', 'RECUSADO:' || sqlstate, true);
end $tenta$;
select 'RESULTADO=' || current_setting('t.out', true);`;
  }

  it("PORTA 1 · promover uma segunda regra que cobre o mesmo conceito é RECUSADO", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + SEGUNDA_REGRA + COBERTURA_DA_SEGUNDA + TENTAR(PROMOVER_A_SEGUNDA) +
        `select 'OCUPANTE=' || rule_id from curadoria.derivation_concept_vigencia where subcriterion_code = '${CONCEITO}';`,
    );
    // A cobertura da segunda entra (ela ainda é PROPOSTA — porta 2 não ocupa),
    // mas a PROMOÇÃO colide na porta 1: o conceito já tem dona.
    expect(saida).toContain("RESULTADO=RECUSADO:");
    expect(saida).toContain(`OCUPANTE=${REGRA}`);
  });

  it("PORTA 2 · uma regra JÁ VIGENTE que ganha cobertura do conceito ocupado é RECUSADA", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        SEGUNDA_REGRA +
        // promove ANTES de ter cobertura: nada a ocupar, promoção passa
        PROMOVER_A_SEGUNDA +
        TENTAR(COBERTURA_DA_SEGUNDA) +
        `select 'OCUPANTE=' || rule_id from curadoria.derivation_concept_vigencia where subcriterion_code = '${CONCEITO}';
select 'SEMANTICAS_DA_SEGUNDA=' || count(*) from curadoria.derivation_rule_option_semantics where rule_id = 'SEGUNDA_REGRA_PROFISSIONAL_DE_TESTE';`,
    );
    expect(saida).toContain("RESULTADO=RECUSADO:");
    expect(saida).toContain(`OCUPANTE=${REGRA}`);
    // As existentes ficam intactas; a recusa é atômica.
    expect(saida).toContain("SEMANTICAS_DA_SEGUNDA=0");
  });

  it("sem desempate: o emissor LEVANTA se duas vigentes cobrissem o mesmo conceito", () => {
    // A garantia estrutural impede o cenário; o oráculo prova que o emissor
    // não tem ramo de escolha (alfabético, por versão, "primeira encontrada").
    const corpo = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='emitir_proposta_de_estado';`,
    );
    expect(corpo).toContain("INVARIANTE VIOLADO");
    expect(corpo.toLowerCase()).not.toMatch(/order by\s+s\.rule_id|limit 1\s*;?\s*$/);
  });
});

// ---------------------------------------------------------------------------
// §11 · As guardas permanentes
// ---------------------------------------------------------------------------

describe("§11 · as treze guardas", () => {
  const emissor = () =>
    psql(`select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='emitir_proposta_de_estado';`);
  const avaliador = () =>
    psql(`select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='avalia_semantica_da_evidencia';`);

  it("1 · o avaliador não menciona conceito nem opção — lê papéis", () => {
    const corpo = avaliador();
    for (const literal of [CONCEITO, POSITIVA, POSITIVA_2, POSITIVA_3, NEGATIVA, INSUFICIENTE]) {
      expect(corpo.includes(literal), `o avaliador hardcodeia ${literal}`).toBe(false);
    }
    for (const papel of ["POSITIVA_DIRETA", "NEGATIVA_EXPLICITA"]) {
      expect(corpo).toContain(papel);
    }
  });

  it("2 e 3 · só regra VIGENTE é consumida, pelo estado DERIVADO", () => {
    const corpo = emissor();
    expect(corpo).toContain("derivation_rule_state");
    expect(corpo).toContain("= 'VIGENTE'");
    expect(/derivation_rules\.state|r\.state/.test(corpo), "o emissor leu o state da tabela").toBe(false);
  });

  /** O CÓDIGO, sem os comentários — que citam legitimamente o que proíbem. */
  const semComentarios = (corpo: string) =>
    corpo
      .split("\n")
      .filter((linha) => !linha.trimStart().startsWith("--"))
      .join("\n");

  it("4 · versão exata, nunca max()", () => {
    const dr3 = semComentarios(emissor());
    const consulta = dr3.slice(
      dr3.indexOf("from curadoria.derivation_rule_option_semantics"),
      dr3.indexOf("avalia_semantica_da_evidencia"),
    );
    expect(consulta.length, "a consulta do DR3 sumiu").toBeGreaterThan(0);
    expect(dr3).toContain("s.rule_version");
    // Nenhuma chamada REAL a max() no código — a versão vem da linha de
    // cobertura. (O comentário do DR3 cita "max(version)" ao proibi-lo: por
    // isso a varredura é sobre o código, não sobre a documentação.)
    expect(/\bmax\s*\(/i.test(dr3), "a versão veio de max()").toBe(false);
  });

  it("6 e 7 · CD-1 intacta e `satisfied_by` fora do caminho profissional", () => {
    const corpo = semComentarios(emissor());
    // Referências REAIS ao lado Case. `consequence_degree` é coluna da própria
    // proposta (precedente vigente, §13 do contrato) e não é consulta à ponte.
    for (const proibido of [
      "derivation_rule_degree_map",
      "satisfied_by",
      "case_needs",
      "case_priority_map",
      "case_id",
      "m.degree",
      "m.importance",
      ".degree ",
    ]) {
      expect(corpo.includes(proibido), `o caminho profissional consultou ${proibido}`).toBe(false);
    }
    // E o único "degree" presente é o da coluna da proposta.
    expect(corpo.match(/degree/g)).toEqual(["degree"]);
    expect(corpo).toContain("consequence_degree");
    expect(psql(`select count(*) from curadoria.derivation_rule_degree_map;`)).toBe("0");
  });

  it("11 · ocupação única: o conceito tem exatamente uma dona, e é a Regra 001", () => {
    const saida = psql(`
select coalesce(string_agg(subcriterion_code || '->' || rule_id || 'v' || rule_version || '#' || ocupacao_seq, ',' order by subcriterion_code), '<nenhuma>')
from curadoria.derivation_concept_vigencia;`);
    expect(saida).toBe(`${CONCEITO}->${REGRA}v1#1`);
  });

  it("12 · cobertura total: opção sem papel impede a versão de vigorar", () => {
    const saida = emTransacaoRevertida(`
insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence)
values ('REGRA_INCOMPLETA_DE_TESTE', 1, 'PROPOSTA', ${ATOR}, 'fixture', 'fixture');
insert into curadoria.derivation_rule_transitions
  (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
values ('REGRA_INCOMPLETA_DE_TESTE', 1, 1, null, 'PROPOSTA', ${ATOR}, 'PAPEL_INTERNO', 'fixture');
do $tenta$
begin
  insert into curadoria.derivation_rule_option_semantics (rule_id, rule_version, subcriterion_code, option_value, papel)
  values ('REGRA_INCOMPLETA_DE_TESTE', 1, '${CONCEITO}', '${POSITIVA}', 'POSITIVA_DIRETA');
  -- a cobertura e DEFERIDA: so dispara no commit. Forcamos aqui.
  set constraints all immediate;
  perform set_config('t.out', 'PASSOU', true);
exception when others then
  perform set_config('t.out', 'RECUSADO', true);
end $tenta$;
select 'COBERTURA=' || current_setting('t.out', true);`);
    expect(saida).toContain("COBERTURA=RECUSADO");
  });

  it("13 · a tabela nova nasce INERTE: RLS ligada, zero policy, zero grant", () => {
    const saida = psql(`
select (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='curadoria' and c.relname='derivation_rule_option_semantics')
  || '|' || (select count(*) from pg_policies where schemaname='curadoria' and tablename='derivation_rule_option_semantics')
  || '|' || (select count(*) from information_schema.role_table_grants where table_schema='curadoria' and table_name='derivation_rule_option_semantics' and grantee in ('anon','authenticated'))
  || '|' || has_function_privilege('authenticated','curadoria.emitir_proposta_de_estado(uuid,text,uuid)','execute')::text
  || '|' || has_function_privilege('authenticated','curadoria.avalia_semantica_da_evidencia(text,integer,text,text[])','execute')::text;`);
    expect(saida).toBe("true|0|0|false|false");
  });

  it("append-only · a semântica é parte da versão: UPDATE e DELETE recusados", () => {
    const saida = emTransacaoRevertida(`
do $u$ begin
  update curadoria.derivation_rule_option_semantics set papel = 'INSUFICIENTE' where rule_id = '${REGRA}';
  perform set_config('t.u', 'PASSOU', true);
exception when others then perform set_config('t.u', 'RECUSADO', true); end $u$;
do $d$ begin
  delete from curadoria.derivation_rule_option_semantics where rule_id = '${REGRA}';
  perform set_config('t.d', 'PASSOU', true);
exception when others then perform set_config('t.d', 'RECUSADO', true); end $d$;
select 'UPDATE=' || current_setting('t.u', true) || ' DELETE=' || current_setting('t.d', true);`);
    expect(saida).toContain("UPDATE=RECUSADO DELETE=RECUSADO");
  });

  it("a opção declarada precisa ser canônica, profissional e ativa do conceito", () => {
    const saida = emTransacaoRevertida(`
do $tenta$
begin
  insert into curadoria.derivation_rule_option_semantics (rule_id, rule_version, subcriterion_code, option_value, papel)
  values ('${REGRA}', 1, '${CONCEITO}', 'OPCAO_INVENTADA', 'POSITIVA_DIRETA');
  perform set_config('t.out', 'PASSOU', true);
exception when others then perform set_config('t.out', 'RECUSADO', true); end $tenta$;
select 'OPCAO=' || current_setting('t.out', true);`);
    expect(saida).toContain("OPCAO=RECUSADO");
  });

  it("cobertura por DADO: a relação regra→conceito não vem de parsing do rule_id", () => {
    const corpo = emissor();
    // O emissor não pode inferir o conceito a partir do texto do rule_id.
    for (const proibido of ["like '%' ||", "position(", "strpos(", "split_part(_subcriterion_code"]) {
      expect(corpo.includes(proibido), `o emissor infere cobertura por texto: ${proibido}`).toBe(false);
    }
    expect(corpo).toContain("from curadoria.derivation_rule_option_semantics");
  });
});

// ---------------------------------------------------------------------------
// §24 · O lado Case não regride
// ---------------------------------------------------------------------------

describe("§24 · isolamento do lado Case — o pacote 2.2C-R1 não regride", () => {
  it("a ponte segue vazia e o emissor Case continua sem regra vigente", () => {
    const saida = psql(`
select (select count(*) from curadoria.derivation_rule_degree_map)
  || '|' || (select count(*) from curadoria.derivation_proposals where case_id is not null);`);
    expect(saida).toBe("0|0");
  });

  it("a porta 1 Case-side preserva o comportamento: união, nunca substituição", () => {
    const corpo = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='ocupa_conceitos_da_versao';`,
    );
    // O ramo Case-side original continua lá, agora unido ao profissional.
    expect(corpo).toContain("curadoria.derivation_rule_degree_map");
    expect(corpo).toContain("curadoria.derivation_rule_option_semantics");
    expect(corpo).toContain("union");
    // E a recusa atômica segue idêntica.
    expect(corpo).toContain("NAO entra em vigor");
  });

  it("a porta 2 Case-side segue existindo, intacta e separada da profissional", () => {
    const saida = psql(`
select string_agg(t.tgname, ',' order by t.tgname)
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='curadoria' and c.relname in ('derivation_rule_degree_map','derivation_rule_option_semantics')
  and not t.tgisinternal;`);
    expect(saida).toBe(
      "derivation_rule_degree_map_append_only,derivation_rule_degree_map_cobertura,derivation_rule_degree_map_conceito,derivation_rule_degree_map_ocupa_conceito," +
        "derivation_rule_option_semantics_append_only,derivation_rule_option_semantics_cobertura,derivation_rule_option_semantics_ocupa_conceito,derivation_rule_option_semantics_opcao",
    );
  });

  it("o ordinal da ocupação enxerga os dois lados — e o Case-side não muda de resultado", () => {
    const corpo = psql(
      `select prosrc from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='curadoria' and p.proname='proxima_ocupacao_do_conceito';`,
    );
    expect(corpo).toContain("derivation_rule_degree_map");
    expect(corpo).toContain("derivation_rule_option_semantics");
    // Conceito sem ocupação nenhuma continua devolvendo 1 (encerradas + 1).
    expect(psql(`select curadoria.proxima_ocupacao_do_conceito('MODELO_COMUNICACAO');`)).toBe("1");
  });
});
