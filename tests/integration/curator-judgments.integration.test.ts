import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";

/**
 * =============================================================================
 * ITEM 2.4 — `curator_judgments`: A INFRAESTRUTURA INERTE, PROVADA NO BANCO
 * =============================================================================
 *
 * CONTRATO_2_4 (PA-15) · ADR-067 §§7–13. O que se prova aqui, como owner —
 * porque a entidade nasce sem writer e as garantias têm de valer ANTES de
 * qualquer política de acesso:
 *
 *   · o domínio fechado (2 naturezas · 6 conceitos nos pares certos · 3
 *     estados · `AREA` impossível) é CHECK estrutural, não convenção;
 *   · a cadeia de versões é explícita, sequencial e de um alvo só — e a
 *     ordem é da cadeia, nunca do relógio;
 *   · os árbitros de concorrência são DECLARATIVOS: um `VIGENTE` por alvo,
 *     uma sucessora por versão-base, uma versão por posição na cadeia;
 *   · o ato é append-only: a única mudança possível é a transição
 *     `VIGENTE → SUPERADO | RETIRADO`; conteúdo não se reescreve; DELETE
 *     não existe;
 *   · evidência é ponteiro (id + version) com estado de verificação do ato,
 *     e a COMPATIBILIDADE da ressalva do PA-15 recusa família/código errado;
 *   · a entidade está INERTE: RLS sem policy, zero grant, zero juízo real.
 *
 * Fixtures sintéticas por UUID, transações revertidas, resíduo zero.
 */

const CONTAINER = "supabase_db_aliviar-conexao";

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

const CURADOR = "00000000-0000-4000-8000-000000240c01";
const OUTRO_CURADOR = "00000000-0000-4000-8000-000000240c02";
const PACIENTE = "00000000-0000-4000-8000-000000240a01";
const PROFISSIONAL_PERFIL = "00000000-0000-4000-8000-000000240d01";
const OUTRO_PERFIL = "00000000-0000-4000-8000-000000240d02";
const CASE_ID = "00000000-0000-4000-8000-000000241001";

const EV_FORMACAO_V1 = "00000000-0000-4000-8000-000000242001";
const EV_FORMACAO_V2 = "00000000-0000-4000-8000-000000242002";
const EV_EXPERIENCIA = "00000000-0000-4000-8000-000000242003";
const EV_HISTORICO = "00000000-0000-4000-8000-000000242004";
const EV_REL_DECISAO = "00000000-0000-4000-8000-000000242005";
const EV_REL_PREFERENCIAS = "00000000-0000-4000-8000-000000242006";
const EV_DE_OUTRO_PROFISSIONAL = "00000000-0000-4000-8000-000000242007";

const J1 = "00000000-0000-4000-8000-000000243001";
const J2 = "00000000-0000-4000-8000-000000243002";
const J3 = "00000000-0000-4000-8000-000000243003";

const FIXTURE = `
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('${CURADOR}',       '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '24-curador@local', 'x', now(), now()),
  ('${OUTRO_CURADOR}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '24-outro-curador@local', 'x', now(), now()),
  ('${PACIENTE}',      '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '24-paciente@local', 'x', now(), now());

insert into curadoria.patient_stories (id, profile_id, created_by, status) values
  ('00000000-0000-4000-8000-000000244001', '${PACIENTE}', '${PACIENTE}', 'enviada');

insert into curadoria.cases (id, patient_profile_id, source_story_id, assigned_curator_id, created_by) values
  ('${CASE_ID}', '${PACIENTE}', '00000000-0000-4000-8000-000000244001', '${CURADOR}', '${PACIENTE}');

insert into curadoria.professional_profiles (id, profile_id, display_name, professional_identifier, created_by) values
  ('${PROFISSIONAL_PERFIL}', null, 'Profissional Julgado 2.4', 'CRM-24-0001', '${CURADOR}'),
  ('${OUTRO_PERFIL}',        null, 'Outro Profissional 2.4',   'CRM-24-0002', '${CURADOR}');

insert into curadoria.practice_evidence
  (id, professional_profile_id, subcriterion_code, version, options, source_tier, source, collected_at, collected_by, status, verified_at, verified_by, verification_source)
values
  ('${EV_FORMACAO_V1}', '${PROFISSIONAL_PERFIL}', 'FORMACAO_GRADUACAO', 1, '{}', 'INSTITUCIONAL', 'diploma', now(), '${CURADOR}', 'nao_verificado', null, null, null),
  ('${EV_FORMACAO_V2}', '${PROFISSIONAL_PERFIL}', 'FORMACAO_GRADUACAO', 2, '{}', 'INSTITUCIONAL', 'diploma re-checado', now(), '${CURADOR}', 'verificado', now(), '${CURADOR}', 'conselho profissional'),
  ('${EV_EXPERIENCIA}', '${PROFISSIONAL_PERFIL}', 'EXPERIENCIA_TEMPO_DE_PRATICA', 1, '{ATE_2}', 'INSTITUCIONAL', 'registro', now(), '${CURADOR}', 'nao_verificado', null, null, null),
  ('${EV_HISTORICO}',   '${PROFISSIONAL_PERFIL}', 'HISTORICO_AREAS_DE_ATUACAO', 1, '{}', 'INSTITUCIONAL', 'curriculo', now(), '${CURADOR}', 'nao_verificado', null, null, null),
  ('${EV_REL_DECISAO}', '${PROFISSIONAL_PERFIL}', 'MODELO_DECISAO_COMPARTILHADA', 1, '{APRESENTA_TODAS_AS_OPCOES_ADEQUADAS}', 'INSTITUCIONAL', 'entrevista', now(), '${CURADOR}', 'nao_verificado', null, null, null),
  ('${EV_REL_PREFERENCIAS}', '${PROFISSIONAL_PERFIL}', 'MODELO_PREFERENCIAS_E_RESTRICOES', 1, '{REGISTRA_A_RESTRICAO_NO_PRONTUARIO}', 'INSTITUCIONAL', 'entrevista', now(), '${CURADOR}', 'nao_verificado', null, null, null),
  ('${EV_DE_OUTRO_PROFISSIONAL}', '${OUTRO_PERFIL}', 'FORMACAO_GRADUACAO', 1, '{}', 'INSTITUCIONAL', 'diploma alheio', now(), '${CURADOR}', 'nao_verificado', null, null, null);
`;

/** INSERT de um julgamento; campos com default sensato para o cenário. */
function JULGAR(opts: {
  id?: string;
  natureza?: string;
  conceito?: string;
  estado?: string;
  conclusao?: string;
  motivo?: string | null;
  fatos?: string;
  versao?: number;
  anterior?: string | null;
  actor?: string;
  caseId?: string;
  perfil?: string;
}): string {
  const {
    id = J1,
    natureza = "TECNICO",
    conceito = "FORMACAO",
    estado = "VIGENTE",
    conclusao = "Formação sólida e adequada ao Case.",
    motivo = null,
    fatos = '[{"registro": "practice_evidence:' + EV_FORMACAO_V1 + '", "versao": "1"}]',
    versao = 1,
    anterior = null,
    actor = CURADOR,
    caseId = CASE_ID,
    perfil = PROFISSIONAL_PERFIL,
  } = opts;
  return `
insert into curadoria.curator_judgments
  (id, case_id, professional_profile_id, subcriterion_code, natureza, state, conclusao, motivo, fatos_visiveis, catalog_version, versao, versao_anterior_id, actor_id)
values
  ('${id}', '${caseId}', '${perfil}', '${conceito}', '${natureza}', '${estado}', '${conclusao}',
   ${motivo === null ? "null" : `'${motivo}'`}, '${fatos}'::jsonb, '1.1.0', ${versao},
   ${anterior === null ? "null" : `'${anterior}'`}, '${actor}');`;
}

/** Roda um comando esperando erro; devolve 'SQLSTATE:<code>' ou 'PASSOU'. */
function TENTAR(sql: string): string {
  return `
do $tenta$
begin
  ${sql}
  perform set_config('t.resultado', 'PASSOU', true);
exception when others then
  perform set_config('t.resultado', 'SQLSTATE:' || sqlstate, true);
end $tenta$;
select 'RESULTADO=' || current_setting('t.resultado', true);`;
}

function resultado(saida: string): string {
  return saida.split("\n").find((linha) => linha.startsWith("RESULTADO="))!.replace("RESULTADO=", "");
}

afterAll(() => {
  const residuo = psql(`
select (select count(*) from curadoria.curator_judgments)
  || '|' || (select count(*) from curadoria.curator_judgment_evidence_refs)
  || '|' || (select count(*) from auth.users where email like '24-%@local');`);
  expect(residuo, "fixture do 2.4 vazou — a entidade deveria estar vazia e inerte").toBe("0|0|0");
});

// ---------------------------------------------------------------------------
// §8 · A estrutura no catálogo — a entidade é o que o contrato lavrou
// ---------------------------------------------------------------------------

describe("§8 · estrutura — colunas, CHECKs, FKs, índices e triggers, pinados", () => {
  it("as colunas do julgamento são EXATAMENTE as do contrato — e `AREA` não está entre elas (G-2.4-3)", () => {
    const colunas = psql(`
select string_agg(column_name, ',' order by ordinal_position)
from information_schema.columns
where table_schema = 'curadoria' and table_name = 'curator_judgments';`);
    expect(colunas).toBe(
      "id,case_id,professional_profile_id,subcriterion_code,natureza,state,conclusao,motivo,fatos_visiveis,catalog_version,versao,versao_anterior_id,actor_id,acted_at",
    );
    expect(colunas.toLowerCase().includes("area")).toBe(false);
  });

  it("as referências de evidência têm SÓ ponteiro+versão+estado — nenhuma coluna de texto copiado (G-2.4-5)", () => {
    const colunas = psql(`
select string_agg(column_name || ':' || data_type, ',' order by ordinal_position)
from information_schema.columns
where table_schema = 'curadoria' and table_name = 'curator_judgment_evidence_refs';`);
    expect(colunas).toBe(
      "judgment_id:uuid,professional_profile_id:uuid,evidence_id:uuid,evidence_version:integer,verification_status:USER-DEFINED",
    );
  });

  it("o conceito NÃO tem FK ao Catálogo — a lista é CHECK (PA-15, registro vinculante nº 1)", () => {
    const fks = psql(`
select string_agg(confrelid::regclass::text, ',' order by conname)
from pg_constraint
where conrelid = 'curadoria.curator_judgments'::regclass and contype = 'f';`);
    expect(fks).toBe(
      "curadoria.profiles,curadoria.cases,curadoria.professional_profiles,curadoria.curator_judgments",
    );
    expect(fks.includes("method_subcriteria"), "o conceito virou FK ao Catálogo — proibição expressa").toBe(
      false,
    );
  });

  it("os três árbitros declarativos existem: um VIGENTE por alvo · uma sucessora por base · versão única", () => {
    const indices = psql(`
select string_agg(indexname, ',' order by indexname)
from pg_indexes where schemaname = 'curadoria' and tablename = 'curator_judgments';`);
    for (const arbitro of [
      "curator_judgments_um_vigente_por_alvo",
      "curator_judgments_uma_sucessora_por_base",
      "curator_judgments_versao_unica_por_alvo",
    ]) {
      expect(indices).toContain(arbitro);
    }
  });

  it("os cinco triggers estruturais existem — cadeia, transição, sem-delete, validação e append das refs", () => {
    const triggers = psql(`
select string_agg(tgname, ',' order by tgname)
from pg_trigger t
where t.tgrelid in ('curadoria.curator_judgments'::regclass, 'curadoria.curator_judgment_evidence_refs'::regclass)
  and not t.tgisinternal;`);
    expect(triggers).toBe(
      "curator_judgment_evidence_refs_apenas_apendavel,curator_judgment_evidence_refs_valida_referencia,curator_judgments_cadeia_coerente,curator_judgments_sem_delete,curator_judgments_so_transicao_de_estado",
    );
  });
});

// ---------------------------------------------------------------------------
// §5–§7 · O domínio fechado — naturezas, conceitos, estados, conclusão
// ---------------------------------------------------------------------------

describe("§5–§7 · domínio fechado por CHECK — nada fora das listas entra", () => {
  it("julgamento TECNICO·FORMACAO válido nasce VIGENTE, com motivo ausente (oferecido, nunca exigido)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + JULGAR({}) + `select 'ESTADO=' || state || '/v' || versao from curadoria.curator_judgments where id = '${J1}';`,
    );
    expect(saida).toContain("ESTADO=VIGENTE/v1");
  });

  it("julgamento RELACIONAL·MODELO_DECISAO_COMPARTILHADA válido entra no par certo", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ natureza: "RELACIONAL", conceito: "MODELO_DECISAO_COMPARTILHADA", fatos: "[]" }) +
        `select 'OK=' || count(*) from curadoria.curator_judgments;`,
    );
    expect(saida).toContain("OK=1");
  });

  for (const [nome, mutante, sqlstate] of [
    ["terceira natureza (G-2.4-1)", JULGAR({ natureza: "MISTA" }), "23514"],
    ["sétimo conceito (G-2.4-2)", JULGAR({ conceito: "MODELO_COMUNICACAO" }), "23514"],
    ["`AREA` como conceito (G-2.4-3)", JULGAR({ conceito: "AREA" }), "23514"],
    ["par trocado: TECNICO com conceito relacional", JULGAR({ conceito: "MODELO_DECISAO_COMPARTILHADA" }), "23514"],
    ["par trocado: RELACIONAL com critério técnico", JULGAR({ natureza: "RELACIONAL", conceito: "FORMACAO" }), "23514"],
    ["quarto estado PENDENTE — ausência é ausência de registro", JULGAR({ estado: "PENDENTE" }), "23514"],
    ["estado RASCUNHO — juízo em elaboração não é juízo", JULGAR({ estado: "RASCUNHO" }), "23514"],
    ["conclusão vazia — 'ainda não sei' não produz julgamento", JULGAR({ conclusao: "   " }), "23514"],
    ["autor ausente (G-2.4-6)", JULGAR({ actor: "" }).replace("''", "null"), "23502"],
    ["fatos malformados: item sem versão", JULGAR({ fatos: '[{"registro": "practice_evidence:x"}]' }), "23514"],
    ["fatos malformados: não é lista", JULGAR({ fatos: '{"registro": "x", "versao": "1"}' }), "23514"],
    ["versão 2 sem anterior — a primeira não referencia nada", JULGAR({ versao: 2 }), "23514"],
  ] as const) {
    it(`${nome} → recusado pelo CHECK/NOT NULL`, () => {
      const saida = emTransacaoRevertida(FIXTURE + TENTAR(mutante));
      expect(resultado(saida)).toBe(`SQLSTATE:${sqlstate}`);
    });
  }
});

// ---------------------------------------------------------------------------
// §12 · Cadeia e vigência — a história de um alvo é uma só
// ---------------------------------------------------------------------------

describe("§12 · a cadeia é explícita, sequencial e de um alvo só", () => {
  it("JS1 completo: v1 SUPERADA, v2 nasce VIGENTE na mesma cadeia — e a cadeia se reconstrói inteira", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ id: J1 }) +
        `update curadoria.curator_judgments set state = 'SUPERADO' where id = '${J1}';` +
        JULGAR({ id: J2, versao: 2, anterior: J1, conclusao: "Revisto após novo diploma.", actor: OUTRO_CURADOR }) +
        `
select 'CADEIA=' || string_agg(versao || ':' || state || ':' || (versao_anterior_id is not null)::text, ' -> ' order by versao)
from curadoria.curator_judgments
where case_id = '${CASE_ID}' and professional_profile_id = '${PROFISSIONAL_PERFIL}' and subcriterion_code = 'FORMACAO';`,
    );
    // A autoria é da VERSÃO: a v2 é de outro Curador, e isso é legítimo (§9).
    expect(saida).toContain("CADEIA=1:SUPERADO:false -> 2:VIGENTE:true");
  });

  it("pós-RETIRADO: novo ato abre versão nova NA MESMA cadeia — a ausência entre os atos fica legível", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ id: J1 }) +
        `update curadoria.curator_judgments set state = 'RETIRADO' where id = '${J1}';` +
        JULGAR({ id: J2, versao: 2, anterior: J1, conclusao: "Novo juízo após a retirada." }) +
        `select 'FIM=' || state || '/v' || versao from curadoria.curator_judgments where id = '${J2}';`,
    );
    expect(saida).toContain("FIM=VIGENTE/v2");
  });

  it("sucessora apontando alvo diferente → recusada: julgamento não se move entre alvos", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ id: J1 }) +
        `update curadoria.curator_judgments set state = 'SUPERADO' where id = '${J1}';` +
        TENTAR(JULGAR({ id: J2, conceito: "EXPERIENCIA", versao: 2, anterior: J1 })),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23001" /* restrict_violation */);
  });

  it("versão fora de sequência (v3 sobre v1) → recusada: a ordem é da cadeia, nunca do relógio", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ id: J1 }) +
        `update curadoria.curator_judgments set state = 'SUPERADO' where id = '${J1}';` +
        TENTAR(JULGAR({ id: J2, versao: 3, anterior: J1 })),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });
});

// ---------------------------------------------------------------------------
// §14 · Concorrência — quem arbitra é o banco, declarativamente
// ---------------------------------------------------------------------------

describe("§14 · árbitros declarativos — o segundo ato simultâneo perde no índice", () => {
  it("dois VIGENTE para o mesmo alvo → o índice único parcial recusa (23505)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + JULGAR({ id: J1 }) + TENTAR(JULGAR({ id: J2, versao: 2, anterior: J1 })),
    );
    // A v2 chegou VIGENTE com a v1 ainda VIGENTE: o árbitro é
    // `curator_judgments_um_vigente_por_alvo` — nunca um check-then-write.
    expect(resultado(saida)).toBe("SQLSTATE:23505");
  });

  it("duas sucessoras da MESMA versão-base → a cadeia não bifurca (23505) — o CONFLITO_DE_VERSAO do 2.3", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ id: J1 }) +
        `update curadoria.curator_judgments set state = 'SUPERADO' where id = '${J1}';` +
        JULGAR({ id: J2, versao: 2, anterior: J1 }) +
        `update curadoria.curator_judgments set state = 'SUPERADO' where id = '${J2}';` +
        TENTAR(
          JULGAR({ id: J3, versao: 2, anterior: J1, conclusao: "Segunda sucessora da mesma base.", actor: OUTRO_CURADOR }),
        ),
    );
    // O outro ator diante de versão-base já sucedida cai AQUI — o writer do
    // 2.3 traduzirá exatamente este 23505 para CONFLITO_DE_VERSAO (§13),
    // jamais para sucesso idempotente por ato que ele não autorou.
    expect(resultado(saida)).toBe("SQLSTATE:23505");
  });

  it("retirada × nova versão: quem chega ao alvo já transicionado é recusado (a transição não repete)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ id: J1 }) +
        `update curadoria.curator_judgments set state = 'SUPERADO' where id = '${J1}';` +
        TENTAR(`update curadoria.curator_judgments set state = 'RETIRADO' where id = '${J1}';`),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });

  it("mesma posição da cadeia disputada por dois atos → versão única por alvo recusa (23505)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ id: J1 }) +
        `update curadoria.curator_judgments set state = 'RETIRADO' where id = '${J1}';` +
        JULGAR({ id: J2, versao: 2, anterior: J1 }) +
        `update curadoria.curator_judgments set state = 'RETIRADO' where id = '${J2}';` +
        TENTAR(JULGAR({ id: J3, versao: 2, anterior: J1, actor: OUTRO_CURADOR })),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23505");
  });
});

// ---------------------------------------------------------------------------
// §10 · Evidência — ponteiro exato, família certa, estado do ato
// ---------------------------------------------------------------------------

/** INSERT de uma referência de evidência para J1. */
function REFERENCIAR(evidenceId: string, version: number, status = "nao_verificado", perfil = PROFISSIONAL_PERFIL): string {
  return `
insert into curadoria.curator_judgment_evidence_refs
  (judgment_id, professional_profile_id, evidence_id, evidence_version, verification_status)
values ('${J1}', '${perfil}', '${evidenceId}', ${version}, '${status}');`;
}

describe("§10 · evidência referenciada — nunca solta, nunca de outra família", () => {
  it("referência válida FORMACAO_* em julgamento FORMACAO entra, com o estado real do ato", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({}) +
        REFERENCIAR(EV_FORMACAO_V1, 1) +
        `select 'REF=' || evidence_version || '/' || verification_status from curadoria.curator_judgment_evidence_refs;`,
    );
    expect(saida).toContain("REF=1/nao_verificado");
  });

  it("julgar apoiado em evidência não verificada é PERMITIDO e registrado como tal — sem contaminar a conclusão (I-5)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ conclusao: "Concluído sobre evidência ainda não verificada." }) +
        REFERENCIAR(EV_FORMACAO_V1, 1, "nao_verificado") +
        `select 'JUIZO=' || (select state from curadoria.curator_judgments where id = '${J1}')
          || '/' || (select verification_status::text from curadoria.curator_judgment_evidence_refs);`,
    );
    expect(saida).toContain("JUIZO=VIGENTE/nao_verificado");
  });

  it("PA-15 · família errada: EXPERIENCIA_* em julgamento FORMACAO → recusa nomeada", () => {
    const saida = emTransacaoRevertida(FIXTURE + JULGAR({}) + TENTAR(REFERENCIAR(EV_EXPERIENCIA, 1)));
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });

  it("PA-15 · família errada: HISTORICO_* em julgamento EXPERIENCIA → recusa", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ conceito: "EXPERIENCIA", conclusao: "Experiência longa." }) +
        TENTAR(REFERENCIAR(EV_HISTORICO, 1)),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });

  it("PA-15 · relacional: evidência do MESMO código entra; código divergente é recusado", () => {
    const ok = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ natureza: "RELACIONAL", conceito: "MODELO_DECISAO_COMPARTILHADA", fatos: "[]" }) +
        REFERENCIAR(EV_REL_DECISAO, 1) +
        `select 'OK=' || count(*) from curadoria.curator_judgment_evidence_refs;`,
    );
    expect(ok).toContain("OK=1");

    const divergente = emTransacaoRevertida(
      FIXTURE +
        JULGAR({ natureza: "RELACIONAL", conceito: "MODELO_DECISAO_COMPARTILHADA", fatos: "[]" }) +
        TENTAR(REFERENCIAR(EV_REL_PREFERENCIAS, 1)),
    );
    expect(resultado(divergente)).toBe("SQLSTATE:23001");
  });

  it("evidência inexistente → recusa pela FK (referência solta não existe)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + JULGAR({}) + TENTAR(REFERENCIAR("00000000-0000-4000-8000-00000024dead", 1)),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23503");
  });

  it("versão divergente da linha (v2 declarada numa linha v1) → recusa: o ponteiro é a linha exata", () => {
    const saida = emTransacaoRevertida(FIXTURE + JULGAR({}) + TENTAR(REFERENCIAR(EV_FORMACAO_V1, 2)));
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });

  it("evidência de OUTRO profissional → irrepresentável pela FK composta (padrão 1.8-R1)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + JULGAR({}) + TENTAR(REFERENCIAR(EV_DE_OUTRO_PROFISSIONAL, 1, "nao_verificado", OUTRO_PERFIL)),
    );
    // O perfil da ref divergiu do perfil do julgamento → a FK composta ao
    // julgamento recusa antes de qualquer validação de conteúdo.
    expect(resultado(saida)).toBe("SQLSTATE:23503");
  });

  it("estado de verificação diferente do real do momento → recusa (o ato registra o que É)", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + JULGAR({}) + TENTAR(REFERENCIAR(EV_FORMACAO_V1, 1, "verificado")),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });

  it("as referências são parte do ato: UPDATE e DELETE recusados", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({}) +
        REFERENCIAR(EV_FORMACAO_V1, 1) +
        TENTAR(`update curadoria.curator_judgment_evidence_refs set evidence_version = 2;`) +
        `select set_config('t.resultado', '', true);` +
        TENTAR(`delete from curadoria.curator_judgment_evidence_refs;`),
    );
    expect(saida.match(/RESULTADO=SQLSTATE:23001/g)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// §11 · Append-only — a única mudança é a transição de estado
// ---------------------------------------------------------------------------

describe("§11 · append-only — nem para vírgula", () => {
  for (const [nome, update] of [
    ["a conclusão não se reescreve", `set conclusao = 'Texto melhorado.'`],
    ["o autor não se troca", `set actor_id = '${OUTRO_CURADOR}'`],
    ["o instante não se ajusta", `set acted_at = now() + interval '1 hour'`],
    ["os fatos visíveis não se completam depois", `set fatos_visiveis = '[]'::jsonb`],
    ["o alvo não se move", `set subcriterion_code = 'EXPERIENCIA', natureza = 'TECNICO'`],
    ["a cadeia não se reescreve", `set versao = 7`],
  ] as const) {
    it(`${nome} → recusado`, () => {
      const saida = emTransacaoRevertida(
        FIXTURE + JULGAR({}) + TENTAR(`update curadoria.curator_judgments ${update} where id = '${J1}';`),
      );
      expect(resultado(saida)).toBe("SQLSTATE:23001");
    });
  }

  it("JS3 estruturalmente possível: VIGENTE → SUPERADO por si só, sem exigir versão nova simultânea", () => {
    // A supersessão por evidência nova (JS3) transiciona o estado e NOTIFICA;
    // a revisão vem depois, como versão nova. A estrutura não acopla os dois
    // atos — e não contém heurística de "mudaria materialmente".
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({}) +
        `update curadoria.curator_judgments set state = 'SUPERADO' where id = '${J1}';
select 'DEPOIS=' || state from curadoria.curator_judgments where id = '${J1}';`,
    );
    expect(saida).toContain("DEPOIS=SUPERADO");
  });

  it("VIGENTE → RETIRADO existe (ato do autor); terminais não transicionam para nada", () => {
    const retirada = emTransacaoRevertida(
      FIXTURE +
        JULGAR({}) +
        `update curadoria.curator_judgments set state = 'RETIRADO' where id = '${J1}';
select 'DEPOIS=' || state from curadoria.curator_judgments where id = '${J1}';`,
    );
    expect(retirada).toContain("DEPOIS=RETIRADO");

    for (const volta of ["VIGENTE", "SUPERADO"]) {
      const saida = emTransacaoRevertida(
        FIXTURE +
          JULGAR({}) +
          `update curadoria.curator_judgments set state = 'RETIRADO' where id = '${J1}';` +
          TENTAR(`update curadoria.curator_judgments set state = '${volta}' where id = '${J1}';`),
      );
      expect(resultado(saida)).toBe("SQLSTATE:23001");
    }
  });

  it("transição e reescrita no MESMO update → recusado: transição nunca é pretexto para editar", () => {
    const saida = emTransacaoRevertida(
      FIXTURE +
        JULGAR({}) +
        TENTAR(
          `update curadoria.curator_judgments set state = 'SUPERADO', conclusao = 'Aproveitando para melhorar.' where id = '${J1}';`,
        ),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });

  it("DELETE não existe — um julgamento que existiu, existiu", () => {
    const saida = emTransacaoRevertida(
      FIXTURE + JULGAR({}) + TENTAR(`delete from curadoria.curator_judgments where id = '${J1}';`),
    );
    expect(resultado(saida)).toBe("SQLSTATE:23001");
  });
});

// ---------------------------------------------------------------------------
// §15–16 · Inércia — e o Motor não julga
// ---------------------------------------------------------------------------

describe("§15–16 · a entidade nasce inerte (G-2.4-8) e o Motor não julga (G-2.4-7)", () => {
  it("RLS ligada e ZERO policy nas duas tabelas", () => {
    const saida = psql(`
select c.relname || ':' || c.relrowsecurity || ':' || (select count(*) from pg_policies p where p.schemaname = 'curadoria' and p.tablename = c.relname)
from pg_class c
where c.oid in ('curadoria.curator_judgments'::regclass, 'curadoria.curator_judgment_evidence_refs'::regclass)
order by c.relname;`);
    expect(saida).toBe(
      "curator_judgment_evidence_refs:true:0\ncurator_judgments:true:0",
    );
  });

  it("ZERO grant a papel de aplicação — nem leitura, nem escrita", () => {
    const saida = psql(`
select bool_or(has_table_privilege(papel, tabela, privilegio))
from (values ('anon'), ('authenticated')) as papeis(papel),
     (values ('curadoria.curator_judgments'), ('curadoria.curator_judgment_evidence_refs')) as tabelas(tabela),
     (values ('select'), ('insert'), ('update'), ('delete')) as privilegios(privilegio);`);
    expect(saida).toBe("f");
  });

  it("G-2.4-7 · nenhuma função FORA das cinco estruturais alcança a entidade — pipeline não julga", () => {
    // As cinco da própria entidade existem, nominais…
    const proprias = psql(`
select string_agg(p.proname, ',' order by p.proname)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'curadoria' and p.proname like 'curator_judgment%';`);
    expect(proprias).toBe(
      "curator_judgment_evidence_refs_apenas_apendavel,curator_judgment_evidence_refs_valida_referencia,curator_judgments_cadeia_coerente,curator_judgments_sem_delete,curator_judgments_so_transicao_de_estado",
    );
    // …e fora delas, SOMENTE as cinco operacionais lavradas pelo Item 2.3
    // (CONTRATO_2_3 §10/§12: as duas capabilities, a leitura da Mesa, o
    // comparador interno e o trigger JS3 — que supersede, nunca cria)
    // alcançam a tabela. Qualquer OUTRO nome (Motor, regra, pipeline
    // escrevendo juízo) derruba aqui.
    const externas = psql(`
select coalesce(string_agg(p.proname, ',' order by p.proname), '<nenhuma>')
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'curadoria' and p.prosrc ilike '%curator_judgment%'
  and p.proname not like 'curator_judgment%';`);
    expect(externas).toBe(
      // + `decidir_proposta` (ABERTURA 2.C — PA-17): a incompatibilidade da
      // ADR-068 §13.2 virou verificação executável — a decisora LÊ o juízo do
      // ator para recusar o confirmador-que-julga; jamais escreve na entidade.
      "decidir_proposta,js3_evidencia_nova_supersede_juizo,julgamento_tem_mesmo_conteudo,ler_julgamentos_para_avaliacao,registrar_julgamento,retirar_julgamento",
    );
  });

  it("G-2.4-7 · `derivation_proposals` NÃO recebeu alvo de julgamento — colunas inalteradas", () => {
    const colunas = psql(`
select string_agg(column_name, ',' order by ordinal_position)
from information_schema.columns
where table_schema = 'curadoria' and table_name = 'derivation_proposals';`);
    expect(colunas.toLowerCase().includes("judgment")).toBe(false);
    expect(colunas.toLowerCase().includes("juizo")).toBe(false);
  });
});
