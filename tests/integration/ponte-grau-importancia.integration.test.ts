// ITEM 2.2C — A PONTE GRAU → IMPORTÂNCIA.
//
//   grau declarado pela pessoa → regra versionada e vigente → IMPORTÂNCIA
//   PROPOSTA
//
// O que sai daqui é sempre PROPOSTA: não é declaração, não entra no Pipeline
// de Leitura, não substitui valor manual, e não vira verdade por ter sido
// emitida. A ponte torna pública uma tradução que hoje acontece dentro da
// cabeça do Curador — e uma tradução mental é irrecuperável em auditoria.
//
// ANTI-VACUIDADE. Cada recusa faz sete coisas, nesta ordem:
//   1. cria o cenário e CONFIRMA que ele nasceu;
//   2. confirma a REGRA e o seu ESTADO — a recusa precisa ser sobre o caso certo;
//   3. executa a tentativa;
//   4. exige o desfecho NOMEADO (nunca "deu erro", nunca `toThrow` genérico);
//   5. exclui as causas concorrentes, nomeando-as;
//   6. reverte;
//   7. o `afterAll` derruba a suíte se sobrar uma linha.
//
// FIXTURES SINTÉTICAS E TRANSACIONAIS (exigência do escopo §5): os papéis são
// representados por UUIDs de fixture, dentro de transações revertidas. NENHUMA
// identidade técnica real da Autoridade de Método é inventada, e nenhuma regra
// vigente é semeada em dado permanente — esse é o impedimento declarado.

import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

const CONTAINER = "supabase_db_aliviar-conexao";
const REGRAS = "curadoria.derivation_rules";
const TRANSICOES = "curadoria.derivation_rule_transitions";
const MAPA = "curadoria.derivation_rule_degree_map";
const PROPOSTAS = "curadoria.derivation_proposals";
const NEEDS = "curadoria.case_needs";
/** Ocupação do conceito — nasceu no 2.2C-R1 e entrou na limpeza da corrida. */
const OCUPACAO = "curadoria.derivation_concept_vigencia";
const MAPA_MANUAL = "curadoria.case_priority_map";

const ARGS = (sql: string) => [
  "exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres",
  "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql,
];

function psql(sql: string): { ok: boolean; saida: string } {
  try {
    return {
      ok: true,
      saida: execFileSync("docker", ARGS(sql), { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim(),
    };
  } catch (erro) {
    const e = erro as { stdout?: Buffer | string; stderr?: Buffer | string };
    return { ok: false, saida: `${String(e.stdout ?? "")}${String(e.stderr ?? "")}` };
  }
}

function emTransacaoRevertida(corpo: string): { ok: boolean; saida: string } {
  return psql(`begin;\n${corpo}\nrollback;`);
}

// --- Fixtures sintéticas -----------------------------------------------------

const PESSOA = "'00000000-0000-4000-8000-00000000c001'::uuid";
const STORY = "'00000000-0000-4000-8000-00000000c002'::uuid";
const CASO = "'00000000-0000-4000-8000-00000000c003'::uuid";
/** Papel representado, nunca identidade real da Autoridade (escopo §5). */
const AUTORIDADE_FIXTURE = "'00000000-0000-4000-8000-00000000c0a1'::uuid";
const CONCEITO = "MODELO_COMUNICACAO";

/** A cadeia mínima até o Case. `auth.users` cria o profile por trigger. */
const CASE_FIXTURE = `
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'fixture-2-2c@local', 'x', now(), now());
  insert into curadoria.patient_stories (id, profile_id, created_by) values (${STORY}, ${PESSOA}, ${PESSOA});
  insert into curadoria.cases (id, patient_profile_id, source_story_id, created_by)
  values (${CASO}, ${PESSOA}, ${STORY}, ${PESSOA});`;

const GRAU = (grau: string, code = CONCEITO) => `
  insert into ${NEEDS} (case_id, subcriterion_code, catalog_version, options, degree, origin, declared_by)
  values (${CASO}, '${code}', '1.1.0', '{ADAPTA}', '${grau}', 'DIRETO', ${PESSOA});`;

/** Uma versão da regra, nascida em PROPOSTA com o seu ato de nascimento. */
const REGRA = (id: string, v = 1) => `
  insert into ${REGRAS} (rule_id, version, state, proposed_by, rationale, evidence)
  values ('${id}', ${v}, 'PROPOSTA', ${AUTORIDADE_FIXTURE}, 'primeira versao, PROVISORIA', 'nenhuma operacao real');
  insert into ${TRANSICOES} (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
  values ('${id}', ${v}, 1, null, 'PROPOSTA', ${AUTORIDADE_FIXTURE}, 'PAPEL_INTERNO', 'proposta inicial');`;

const TRANSICAO = (
  id: string,
  seq: number,
  de: string,
  para: string,
  extras: { v?: number; vigencia?: number | null; adr?: string | null; emergencia?: string | null; quem?: string } = {},
) => {
  const { v = 1, vigencia = para === "VIGENTE" ? 1 : null, adr = para === "VIGENTE" || para === "REVOGADA" ? "'ADR-066'" : "null", emergencia = null, quem = "AUTORIDADE_DE_METODO" } = extras;
  return `insert into ${TRANSICOES}
    (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr, emergency_justification)
    values ('${id}', ${v}, ${seq}, '${de}', '${para}', ${vigencia ?? "null"}, ${AUTORIDADE_FIXTURE},
            '${quem}', 'ato de governanca', ${adr}, ${emergencia === null ? "null" : `'${emergencia}'`});`;
};

/** Cobertura total dos quatro graus — sem ela o commit é recusado. */
const CORRESPONDENCIA = (id: string, v = 1, code = CONCEITO) => `
  insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance) values
    ('${id}', ${v}, '${code}', 'ESSENCIAL', 'MUITO_IMPORTANTE'),
    ('${id}', ${v}, '${code}', 'PESA_MUITO', 'IMPORTANTE'),
    ('${id}', ${v}, '${code}', 'DESEJAVEL', 'RELEVANTE'),
    ('${id}', ${v}, '${code}', 'SEM_PREFERENCIA', 'NAO_INFLUENCIA');`;

/** O caminho canônico: regra vigente com correspondência completa. */
const REGRA_VIGENTE = (id: string, code = CONCEITO) => `
  ${REGRA(id)}
  ${TRANSICAO(id, 2, "PROPOSTA", "VIGENTE")}
  ${CORRESPONDENCIA(id, 1, code)}`;

const EMITIR = (code = CONCEITO) =>
  `select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${code}', ${AUTORIDADE_FIXTURE});`;

afterAll(() => {
  const { saida } = psql(
    `select (select count(*) from ${REGRAS}) || '|' || (select count(*) from ${TRANSICOES}) || '|' ||
            (select count(*) from ${MAPA}) || '|' || (select count(*) from ${PROPOSTAS}) || '|' ||
            (select count(*) from ${NEEDS}) || '|' || (select count(*) from curadoria.cases)`,
  );
  if (!/^0\|0\|0\|0\|/.test(saida)) {
    throw new Error(`2.2C deixou resíduo: regras|transicoes|mapa|propostas|needs|cases = ${saida}`);
  }
});

// ---------------------------------------------------------------------------

describe("2.2C · correspondência versionada — a tabela que explica o resultado", () => {
  it("a correspondência pertence a uma VERSÃO EXATA, com RESTRICT dos dois lados", () => {
    const { saida } = psql(`
      select pg_get_constraintdef(oid) from pg_constraint
      where conname = 'derivation_rule_degree_map_versao_fk'
    `);
    expect(saida).toContain("FOREIGN KEY (rule_id, rule_version) REFERENCES curadoria.derivation_rules(rule_id, version)");
    expect(saida).toContain("ON UPDATE RESTRICT");
    expect(saida).toContain("ON DELETE RESTRICT");
  });

  it("as duas escalas são disjuntas: nenhum valor de grau é valor de importância", () => {
    const { saida } = psql(`
      select coalesce(string_agg(v, ','), '(nenhum)') from (
        select unnest(array['ESSENCIAL','PESA_MUITO','DESEJAVEL','SEM_PREFERENCIA']) v
        intersect
        select unnest(array['MUITO_IMPORTANTE','IMPORTANTE','RELEVANTE','POUCO_IMPORTANTE','NAO_INFLUENCIA'])
      ) x
    `);
    expect(saida, "as escalas voltaram a ter valor em comum").toBe("(nenhum)");
  });

  it("um grau não recebe dois destinos na mesma versão — é a PK", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("dup-grau")}
      ${CORRESPONDENCIA("dup-grau")}
      select 'NASCEU:' || count(*) from ${MAPA} where rule_id='dup-grau';
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('dup-grau', 1, '${CONCEITO}', 'ESSENCIAL', 'RELEVANTE');
    `);
    expect(r.saida).toContain("NASCEU:4");
    expect(r.ok, "um grau ganhou dois destinos").toBe(false);
    expect(r.saida).toContain("derivation_rule_degree_map_pkey");
  });

  it("grau fora da lista fechada é recusado", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("grau-mau")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('grau-mau', 1, '${CONCEITO}', 'MUITO_IMPORTANTE', 'IMPORTANTE');
    `);
    // `MUITO_IMPORTANTE` é IMPORTÂNCIA, não grau — o erro clássico que a
    // migration 20260801140000 existiu para impedir.
    expect(r.ok, "uma importância entrou como grau").toBe(false);
    expect(r.saida).toContain("degree_check");
  });

  it("importância fora da lista fechada é recusada", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("imp-ma")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('imp-ma', 1, '${CONCEITO}', 'ESSENCIAL', 'ESSENCIAL');
    `);
    expect(r.ok, "um grau entrou como importância").toBe(false);
    expect(r.saida).toContain("importance_check");
  });

  it("correspondência é append-only: não se reescreve o que gerou proposta", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("append")}
      ${CORRESPONDENCIA("append")}
      select 'NASCEU:' || count(*) from ${MAPA} where rule_id='append';
      update ${MAPA} set importance='NAO_INFLUENCIA' where rule_id='append';
    `);
    expect(r.saida).toContain("NASCEU:4");
    expect(r.ok, "a correspondência foi reescrita").toBe(false);
    expect(r.saida).toContain("append-only");
  });

  it("correspondência órfã não nasce — a versão precisa existir", () => {
    const r = emTransacaoRevertida(
      `insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
       values ('inexistente', 1, '${CONCEITO}', 'ESSENCIAL', 'MUITO_IMPORTANTE');`,
    );
    expect(r.ok, "correspondência nasceu sem versão").toBe(false);
    expect(r.saida).toContain("derivation_rule_degree_map_versao_fk");
  });
});

describe("2.2C · cobertura total — meia tabela não emite", () => {
  it("cobertura incompleta é recusada no commit, nomeando o grau que falta", () => {
    const r = psql(`
      begin;
      ${REGRA("parcial")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance) values
        ('parcial', 1, '${CONCEITO}', 'ESSENCIAL', 'MUITO_IMPORTANTE'),
        ('parcial', 1, '${CONCEITO}', 'PESA_MUITO', 'IMPORTANTE');
      select 'PARCIAL:' || count(*) from ${MAPA} where rule_id='parcial';
      set constraints all immediate;
      rollback;
    `);
    expect(r.saida, "o cenário parcial não nasceu").toContain("PARCIAL:2");
    expect(r.ok, "uma versão apta a emitir ficou com grau sem destino").toBe(false);
    expect(r.saida).toContain("Correspondencia incompleta");
    expect(r.saida).toContain("DESEJAVEL, SEM_PREFERENCIA");
  });

  it("cobertura total dos quatro graus é aceita", () => {
    const r = psql(`
      begin;
      ${REGRA("total")}
      ${CORRESPONDENCIA("total")}
      set constraints all immediate;
      select 'COBERTURA:' || count(*) from ${MAPA} where rule_id='total';
      rollback;
    `);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("COBERTURA:4");
  });

  it("correspondência de OUTRA versão não é usada", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA("outra-v", 1)}
      ${TRANSICAO("outra-v", 2, "PROPOSTA", "VIGENTE")}
      -- a v1 vigora, mas a correspondência é da v2: a ponte não empresta.
      ${REGRA("outra-v", 2)}
      ${CORRESPONDENCIA("outra-v", 2)}
      select 'V1:' || curadoria.derivation_rule_state('outra-v', 1);
      ${EMITIR()}
    `);
    expect(r.saida).toContain("V1:VIGENTE");
    expect(r.saida, "a ponte usou correspondência de outra versão").toContain("DESFECHO:SEM_REGRA_VIGENTE");
  });
});

describe("2.2C · quais conceitos podem ter ponte (ADR-066 §16)", () => {
  it("conceito SEM lado da pessoa é recusado — sem origem não há ponte", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("sem-lado")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('sem-lado', 1, 'FORMACAO_GRADUACAO', 'ESSENCIAL', 'MUITO_IMPORTANTE');
    `);
    expect(r.ok, "um conceito técnico ganhou ponte").toBe(false);
    expect(r.saida).toContain("nao tem lado da pessoa");
  });

  /**
   * MUDANÇA DE CONTRATO REGISTRADA — 2.2C-R1.
   *
   * A 2.2C recusava este conceito por HEURÍSTICA de eixo (`VIABILIDADE_DE_ACESSO`),
   * e a mensagem dizia "eixo Viabilidade". A 2.2C-R1 materializou
   * `MOTOR_PARTICIPATION` no Catálogo e trocou a heurística pela coluna
   * autoritativa — porque duas fontes para a mesma pergunta divergem em
   * silêncio, e o eixo nunca alcançaria os dois conceitos de juízo humano.
   *
   * A recusa é a mesma; a AUTORIDADE dela mudou, e o oráculo acompanha.
   */
  it("conceito fora do Motor é recusado — e a recusa cita o Catálogo", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("viab")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('viab', 1, 'VIABILIDADE_CUSTO_E_PAGAMENTO', 'ESSENCIAL', 'MUITO_IMPORTANTE');
    `);
    expect(r.ok, "Viabilidade ganhou ponte").toBe(false);
    expect(r.saida).toContain("MOTOR_PARTICIPATION = NUNCA");
    expect(
      r.saida,
      "a heurística de eixo voltou: ela é a segunda fonte que o 2.2C-R1 eliminou.",
    ).not.toContain("eixo Viabilidade");
  });

  it("o emissor recusa conceito sem ponte, com desfecho nomeado", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL", "VIABILIDADE_CUSTO_E_PAGAMENTO")}
      select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(${CASO}, 'VIABILIDADE_CUSTO_E_PAGAMENTO', ${AUTORIDADE_FIXTURE});
    `);
    expect(r.saida).toContain("DESFECHO:CONCEITO_SEM_PONTE");
  });
});

describe("2.2C · a quarta exclusão do §16 — MOTOR_PARTICIPATION = NUNCA", () => {
  /**
   * MUDANÇA DE CONTRATO REGISTRADA — 2.2C-R1.
   *
   * Na 2.2C o banco NÃO conhecia `MOTOR_PARTICIPATION`: a lista vivia num
   * `Record` manual em `evidencias-pratica.ts`, e a coerência era garantida
   * AQUI, por teste. Um teste é aviso depois do fato: ele constata a violação,
   * não a impede — e o conceito de juízo humano com lado da pessoa passava.
   *
   * A 2.2C-R1 moveu o atributo para o Catálogo, onde o fato de domínio já
   * morava, e a recusa virou trigger. Este bloco deixou de ser a garantia e
   * passou a ser a CONFERÊNCIA: o que o código lê é o que o banco declara.
   *
   * `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` continua sendo o caso decisivo —
   * tem lado da pessoa e não é Viabilidade, e mesmo assim é `NUNCA`.
   */
  it("nenhuma correspondência existe para conceito que não participa do Motor", async () => {
    const { PRACTICE_CATALOG } = await import("@/modules/curadoria/evidencias-pratica");
    const nunca = PRACTICE_CATALOG.filter((c) => c.motor === "NUNCA").map((c) => c.code);

    expect(nunca, "a lista de NUNCA esvaziou — a guarda ficaria vazia").not.toHaveLength(0);
    expect(nunca, "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS saiu da lista").toContain(
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
    );

    const { saida } = psql(`
      select coalesce(string_agg(distinct subcriterion_code, ','), '(nenhuma)')
      from ${MAPA} where subcriterion_code in (${nunca.map((c) => `'${c}'`).join(",")})
    `);
    expect(saida, "uma regra ganhou ponte para conceito que exige juízo humano").toBe("(nenhuma)");
  });

  it("o emissor recusa o conceito de juízo humano que TEM lado da pessoa", () => {
    // MUDANÇA DE CONTRATO — 2.2C-R1. Na 2.2C o desfecho era
    // `SEM_REGRA_VIGENTE`: o conceito atravessava a verificação de ponte (a
    // heurística de eixo não o alcançava) e só parava por falta de regra.
    // Recusa por acidente, não por método: no dia em que uma regra vigente
    // cobrisse o conceito, ele emitiria.
    //
    // Agora para na própria pergunta, com o nome certo.
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL", "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS")}
      select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(
        ${CASO}, 'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', ${AUTORIDADE_FIXTURE});
    `);
    expect(r.saida).toContain("DESFECHO:CONCEITO_SEM_PONTE");
    expect(
      r.saida,
      "voltou a parar por falta de regra: a recusa seria acidente, não método.",
    ).not.toContain("DESFECHO:SEM_REGRA_VIGENTE");
  });
});

describe("2.2C · emissão — o caminho canônico", () => {
  it("regra VIGENTE emite, com a proveniência inteira e a versão exata", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("emite")}
      select 'ESTADO:' || curadoria.derivation_rule_state('emite', 1);
      ${EMITIR()}
      select 'PROVENIENCIA:' || subcriterion_code || '/' || target_field || '/' || suggested_value
             || '/' || origin_record || '/' || origin_version || '/' || rule_id || '/v' || rule_version
             || '/' || catalog_version || '/' || consequence_degree || '/' || state
             || '/autor=' || (origin_author is not null)::text
             || '/momento=' || (emitted_at is not null)::text
             || '/declarado=' || (origin_declared_at is not null)::text
        from ${PROPOSTAS} where case_id = ${CASO};
    `);

    expect(r.saida, "a regra não estava vigente").toContain("ESTADO:VIGENTE");
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:EMITIDA");
    expect(r.saida).toContain(
      `PROVENIENCIA:${CONCEITO}/importance/MUITO_IMPORTANTE/case_needs:`,
    );
    expect(r.saida).toContain("/ESSENCIAL/emite/v1/1.1.0/ESTRUTURAL/PROPOSTA/autor=true/momento=true/declarado=true");
  });

  it("cada grau produz a importância que a correspondência declara — e só ela", () => {
    for (const [grau, importancia] of [
      ["ESSENCIAL", "MUITO_IMPORTANTE"],
      ["PESA_MUITO", "IMPORTANTE"],
      ["DESEJAVEL", "RELEVANTE"],
      ["SEM_PREFERENCIA", "NAO_INFLUENCIA"],
    ] as const) {
      const r = emTransacaoRevertida(`
        ${CASE_FIXTURE}
        ${GRAU(grau)}
        ${REGRA_VIGENTE(`g-${grau.toLowerCase()}`)}
        ${EMITIR()}
        select 'VALOR:' || suggested_value || '/origem=' || origin_version from ${PROPOSTAS} where case_id = ${CASO};
      `);
      expect(r.saida, `${grau} não emitiu`).toContain("DESFECHO:EMITIDA");
      expect(r.saida, `${grau} produziu importância errada`).toContain(`VALOR:${importancia}/origem=${grau}`);
    }
  });

  it("a proposta referencia (rule_id, rule_version) — nunca 'a regra atual'", () => {
    const { saida } = psql(`
      select pg_get_constraintdef(oid) from pg_constraint where conname='derivation_proposals_regra_fk'
    `);
    expect(saida).toContain("FOREIGN KEY (rule_id, rule_version)");
    const flutuante = psql(`
      select count(*) from information_schema.columns
      where table_schema='curadoria' and table_name='derivation_proposals'
        and (column_name ilike '%current%' or column_name ilike '%vigente%')
    `);
    expect(flutuante.saida, "nasceu referência flutuante à versão vigente").toBe("0");
  });
});

describe("2.2C · não emissão — sempre com desfecho nomeado", () => {
  it.each([
    ["PROPOSTA", "", "SEM_REGRA_VIGENTE"],
    ["SUSPENSA", TRANSICAO("estado", 3, "VIGENTE", "SUSPENSA"), "SEM_REGRA_VIGENTE"],
    ["REVOGADA", TRANSICAO("estado", 3, "VIGENTE", "REVOGADA"), "SEM_REGRA_VIGENTE"],
  ])("regra em %s não emite", (estadoFinal, saida, desfecho) => {
    const promocao = estadoFinal === "PROPOSTA" ? "" : TRANSICAO("estado", 2, "PROPOSTA", "VIGENTE");
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA("estado")}
      ${promocao}
      ${saida}
      ${CORRESPONDENCIA("estado")}
      select 'ESTADO:' || curadoria.derivation_rule_state('estado', 1);
      ${EMITIR()}
      select 'PROPOSTAS:' || count(*) from ${PROPOSTAS} where case_id = ${CASO};
    `);

    expect(r.saida, "o cenário não chegou ao estado esperado").toContain(`ESTADO:${estadoFinal}`);
    expect(r.saida).toContain(`DESFECHO:${desfecho}`);
    expect(r.saida, "emitiu sob regra não vigente").toContain("PROPOSTAS:0");
  });

  it("regra AUSENTE não emite", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      select 'REGRAS:' || count(*) from ${REGRAS};
      ${EMITIR()}
    `);
    expect(r.saida).toContain("REGRAS:0");
    expect(r.saida).toContain("DESFECHO:SEM_REGRA_VIGENTE");
  });

  it("sem grau declarado não emite", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${REGRA_VIGENTE("sem-grau")}
      select 'NEEDS:' || count(*) from ${NEEDS} where case_id = ${CASO};
      ${EMITIR()}
    `);
    expect(r.saida, "havia grau — a recusa seria por outro motivo").toContain("NEEDS:0");
    expect(r.saida).toContain("DESFECHO:SEM_GRAU");
  });

  it("sem correspondência para o grau declarado não emite", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("DESEJAVEL")}
      ${REGRA("sem-corr")}
      ${TRANSICAO("sem-corr", 2, "PROPOSTA", "VIGENTE")}
      -- correspondência de OUTRO conceito: a regra vigora, mas não para este.
      ${CORRESPONDENCIA("sem-corr", 1, "MODELO_ALTERNATIVAS")}
      select 'ESTADO:' || curadoria.derivation_rule_state('sem-corr', 1);
      ${EMITIR()}
    `);
    expect(r.saida).toContain("ESTADO:VIGENTE");
    expect(r.saida).toContain("DESFECHO:SEM_REGRA_VIGENTE");
  });

  it("DECLARAÇÃO MANUAL VIGENTE prevalece — a ponte não oferece onde o humano já declarou", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("manual")}
      insert into ${MAPA_MANUAL} (case_id, subcriterion_id, importance, declared_by)
      select ${CASO}, s.id, 'RELEVANTE', ${PESSOA} from curadoria.method_subcriteria s where s.code='${CONCEITO}';
      select 'MANUAL:' || count(*) from ${MAPA_MANUAL} where case_id = ${CASO};
      select 'ESTADO:' || curadoria.derivation_rule_state('manual', 1);
      ${EMITIR()}
      select 'PROPOSTAS:' || count(*) from ${PROPOSTAS} where case_id = ${CASO};
      select 'MANUAL_INTACTO:' || importance from ${MAPA_MANUAL} where case_id = ${CASO};
    `);

    expect(r.saida, "a declaração manual não nasceu").toContain("MANUAL:1");
    expect(r.saida, "a regra não estava vigente — a recusa seria por outro motivo").toContain("ESTADO:VIGENTE");
    expect(r.saida).toContain("DESFECHO:DECLARACAO_MANUAL_VIGENTE");
    expect(r.saida).toContain("PROPOSTAS:0");
    // A declaração humana atravessa a tentativa sem um caractere de diferença.
    expect(r.saida).toContain("MANUAL_INTACTO:RELEVANTE");
  });

  it("catálogo divergente entre os dois lados não emite", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      insert into ${NEEDS} (case_id, subcriterion_code, catalog_version, options, degree, origin, declared_by)
      values (${CASO}, '${CONCEITO}', '1.0.0', '{ADAPTA}', 'ESSENCIAL', 'DIRETO', ${PESSOA});
      ${REGRA_VIGENTE("cat")}
      select 'NEED_CAT:' || catalog_version from ${NEEDS} where case_id = ${CASO};
      ${EMITIR()}
    `);
    expect(r.saida).toContain("NEED_CAT:1.0.0");
    expect(r.saida).toContain("DESFECHO:CATALOGO_DIVERGENTE");
  });

  it("entrada nula não emite, e não explode", () => {
    const r = psql(`select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(null, '${CONCEITO}', ${AUTORIDADE_FIXTURE})`);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:ENTRADA_INVALIDA");
  });
});

describe("2.2C · ciclo de vida da regra × emissão", () => {
  it("SUSPENSÃO: emitiu, suspendeu, não emite mais — e a proposta anterior fica", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("susp")}
      ${EMITIR()}
      select 'ANTES:' || count(*) from ${PROPOSTAS} where case_id = ${CASO};
      ${TRANSICAO("susp", 3, "VIGENTE", "SUSPENSA")}
      select 'ESTADO:' || curadoria.derivation_rule_state('susp', 1);
      select 'SEGUNDA:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE});
      select 'DEPOIS:' || count(*) from ${PROPOSTAS} where case_id = ${CASO};
      select 'PRESERVADA:' || suggested_value || '/' || rule_id || '/v' || rule_version from ${PROPOSTAS} where case_id = ${CASO};
    `);

    expect(r.saida).toContain("DESFECHO:EMITIDA");
    expect(r.saida).toContain("ANTES:1");
    expect(r.saida).toContain("ESTADO:SUSPENSA");
    expect(r.saida).toContain("SEGUNDA:SEM_REGRA_VIGENTE");
    expect(r.saida, "a proposta anterior sumiu ou nasceu outra").toContain("DEPOIS:1");
    expect(r.saida, "a proveniência foi recalculada").toContain("PRESERVADA:MUITO_IMPORTANTE/susp/v1");
  });

  it("REATIVAÇÃO: suspensa não emite, reativada volta a emitir — sem tocar a antiga", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("reat")}
      ${EMITIR()}
      ${TRANSICAO("reat", 3, "VIGENTE", "SUSPENSA")}
      select 'SUSPENSA:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE});
      ${TRANSICAO("reat", 4, "SUSPENSA", "VIGENTE", { vigencia: 2 })}
      select 'ESTADO:' || curadoria.derivation_rule_state('reat', 1);
      select 'REATIVADA:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE});
      select 'TOTAL:' || count(*) from ${PROPOSTAS} where case_id = ${CASO};
      select 'ANTIGA:' || suggested_value || '/v' || rule_version from ${PROPOSTAS} where case_id = ${CASO};
    `);

    expect(r.saida).toContain("SUSPENSA:SEM_REGRA_VIGENTE");
    expect(r.saida).toContain("ESTADO:VIGENTE");
    // Mesma versão e mesma regra: a proposta já existe, e repetir é idempotente.
    expect(r.saida).toContain("REATIVADA:JA_EMITIDA");
    expect(r.saida, "a reativação duplicou a proposta").toContain("TOTAL:1");
    expect(r.saida).toContain("ANTIGA:MUITO_IMPORTANTE/v1");
  });

  it("REVOGAÇÃO: não emite, é terminal, e a proposta histórica permanece", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("revog")}
      ${EMITIR()}
      ${TRANSICAO("revog", 3, "VIGENTE", "REVOGADA")}
      select 'ESTADO:' || curadoria.derivation_rule_state('revog', 1);
      select 'DEPOIS_REVOG:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE});
      select 'HISTORICA:' || count(*) from ${PROPOSTAS} where case_id = ${CASO};
      select 'INTACTA:' || suggested_value || '/' || rule_id || '/v' || rule_version || '/' || state from ${PROPOSTAS} where case_id = ${CASO};
    `);

    expect(r.saida).toContain("ESTADO:REVOGADA");
    expect(r.saida).toContain("DEPOIS_REVOG:SEM_REGRA_VIGENTE");
    expect(r.saida).toContain("HISTORICA:1");
    // Nada é recalculado, nada é apagado: a proposta segue apontando a versão.
    expect(r.saida).toContain("INTACTA:MUITO_IMPORTANTE/revog/v1/PROPOSTA");
  });
});

describe("2.2C · A2 — a proposta não entra no Pipeline de Leitura", () => {
  it("emitir NÃO cria, altera nem apaga declaração no Mapa de Prioridades", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("a2")}
      select 'MAPA_ANTES:' || count(*) from ${MAPA_MANUAL} where case_id = ${CASO};
      ${EMITIR()}
      select 'MAPA_DEPOIS:' || count(*) from ${MAPA_MANUAL} where case_id = ${CASO};
      select 'NEEDS_INTACTO:' || degree from ${NEEDS} where case_id = ${CASO};
    `);

    expect(r.saida).toContain("DESFECHO:EMITIDA");
    expect(r.saida).toContain("MAPA_ANTES:0");
    // A proposta existe; a declaração que o Motor lê continua não existindo.
    expect(r.saida, "a emissão escreveu no Mapa que o Motor lê").toContain("MAPA_DEPOIS:0");
    expect(r.saida, "a emissão alterou case_needs").toContain("NEEDS_INTACTO:ESSENCIAL");
  });

  it("o emissor é o ÚNICO escritor de derivation_proposals no banco", () => {
    const { saida } = psql(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhuma)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ~* '(insert|update|delete)[[:space:]]+(into[[:space:]]+)?curadoria\\.derivation_proposals'
    `);
    expect(saida, "nasceu um segundo escritor de propostas").toBe("emitir_proposta_de_importancia");
  });

  it("além do emissor, só os leitores lavrados alcançam as propostas", () => {
    // MUDANÇA DE CONTRATO — 1.8-R1 §21 (`78e261c`) e CONTRATO_1_11 §3
    // (`ca49293`). O A2 continua intacto: nenhuma função produz leitura
    // canônica a partir de propostas. O que as lavraturas criaram foram dois
    // leitores de capability, ambos SECURITY DEFINER/STABLE com EXECUTE só de
    // service_role: `ler_proposta_para_proveniencia` (auditoria individual,
    // §11.4) e `contar_propostas_por_desfecho` (agregação observacional do
    // Painel de Discordância, sem dimensão pessoal). O conjunto é fechado em
    // TRÊS nomes, e um quarto derruba este oráculo como sempre derrubou.
    const { saida } = psql(`
      select coalesce(string_agg(p.proname, ',' order by p.proname), '(nenhuma)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria'
        and p.prosrc ilike '%derivation_proposals%'
        and p.proname <> 'emitir_proposta_de_importancia'
    `);
    expect(saida, "nasceu função além do trio lavrado escritor/leitores").toBe(
      "contar_propostas_por_desfecho,ler_proposta_para_proveniencia",
    );
  });
});

describe("2.2C · idempotência e concorrência", () => {
  it("repetir a mesma emissão é idempotente — uma proposta, desfecho explícito", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("idem")}
      ${EMITIR()}
      select 'SEGUNDA:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE});
      select 'TERCEIRA:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE});
      select 'TOTAL:' || count(*) from ${PROPOSTAS} where case_id = ${CASO};
    `);
    expect(r.saida).toContain("DESFECHO:EMITIDA");
    expect(r.saida).toContain("SEGUNDA:JA_EMITIDA");
    expect(r.saida).toContain("TERCEIRA:JA_EMITIDA");
    expect(r.saida, "duplicou em silêncio").toContain("TOTAL:1");
  });

  it("a proteção é do BANCO: inserir a duplicata direto colide no índice", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${REGRA_VIGENTE("indice")}
      ${EMITIR()}
      insert into ${PROPOSTAS}
        (case_id, subcriterion_code, target_field, suggested_value, origin_record, origin_version,
         origin_declared_at, origin_author, rule_id, rule_version, catalog_version, consequence_degree)
      values (${CASO}, '${CONCEITO}', 'importance', 'RELEVANTE', 'case_needs:x', 'ESSENCIAL',
              now(), ${PESSOA}, 'indice', 1, '1.1.0', 'ESTRUTURAL');
    `);
    expect(r.ok, "a duplicata entrou por fora do emissor").toBe(false);
    expect(r.saida).toContain("derivation_proposals_uma_por_alvo_regra_versao");
  });

  it("disputa REAL: duas emissões simultâneas, uma proposta só", async () => {
    // Duas conexões de verdade, ambas commitando: sem isso a colisão não
    // acontece. A limpeza é explícita e usa o mesmo caminho de sempre.
    const cenario = `${CASE_FIXTURE} ${GRAU("ESSENCIAL")} ${REGRA_VIGENTE("race")}`;
    psql(`begin; ${cenario} commit;`);

    try {
      const chamada = () =>
        execFileAsync("docker", ARGS(`select curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${AUTORIDADE_FIXTURE})`), {
          encoding: "utf-8",
        }).catch((e: { stdout?: string; stderr?: string }) => ({ stdout: `${e.stdout ?? ""}${e.stderr ?? ""}` }));

      const [a, b] = await Promise.all([chamada(), chamada()]);
      const desfechos = [String(a.stdout).trim(), String(b.stdout).trim()].sort();

      const total = psql(`select count(*) from ${PROPOSTAS} where case_id = ${CASO}`).saida;
      expect(total, "duas propostas nasceram para o mesmo alvo, regra e versão").toBe("1");
      // Determinístico: uma emite, a outra recebe desfecho canônico. Nunca duas
      // emissões, nunca erro sem nome.
      expect(desfechos.join("|"), `desfechos inesperados: ${desfechos.join("|")}`).toMatch(
        /^(EMITIDA\|JA_EMITIDA|JA_EMITIDA\|EMITIDA)$/,
      );
    } finally {
      // Limpeza explícita: propostas e transições são append-only por trigger,
      // então a remoção passa por desabilitá-los — no cenário de teste, e com
      // restauração imediata. `cases` cascateia para a proposta.
      //
      // A OCUPAÇÃO DO CONCEITO entrou nesta lista no 2.2C-R1: promover a regra
      // passou a ocupar `MODELO_COMUNICACAO`, e essa linha tem FK RESTRICT para
      // a versão. Sem apagá-la primeiro, o `delete` da regra é recusado, a
      // limpeza morre no meio e o resíduo derruba a suíte inteira na corrida
      // seguinte — foi exatamente o que aconteceu.
      psql(`
        alter table ${OCUPACAO} disable trigger derivation_concept_vigencia_append_only;
        alter table ${TRANSICOES} disable trigger derivation_rule_transitions_append_only;
        alter table ${MAPA} disable trigger derivation_rule_degree_map_append_only;
        alter table ${REGRAS} disable trigger derivation_rules_append_only;
        delete from ${PROPOSTAS} where case_id = ${CASO};
        delete from ${OCUPACAO} where rule_id = 'race';
        delete from ${MAPA} where rule_id = 'race';
        delete from ${TRANSICOES} where rule_id = 'race';
        delete from ${REGRAS} where rule_id = 'race';
        delete from ${NEEDS} where case_id = ${CASO};
        delete from curadoria.cases where id = ${CASO};
        delete from curadoria.patient_stories where id = ${STORY};
        delete from auth.users where id = ${PESSOA};
        alter table ${TRANSICOES} enable trigger derivation_rule_transitions_append_only;
        alter table ${MAPA} enable trigger derivation_rule_degree_map_append_only;
        alter table ${REGRAS} enable trigger derivation_rules_append_only;
      `);
    }
  }, 30_000);
});

describe("2.2C · segurança — a estrutura continua inerte", () => {
  it("o emissor é SECURITY INVOKER, com search_path fixo e sem PUBLIC", () => {
    const { saida } = psql(`
      select p.prosecdef::text || '|' || coalesce(array_to_string(p.proconfig, ','), '(nenhum)')
             || '|' || coalesce(p.proacl::text, '(null=default)')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='emitir_proposta_de_importancia'
    `);
    const [secdef, config, acl] = saida.split("|");
    expect(secdef, "o emissor virou SECURITY DEFINER — elevaria autoridade").toBe("false");
    expect(config, "o search_path não está fixo").toBe("search_path=curadoria, pg_temp");
    expect(acl, "a ACL voltou ao padrão, que concede EXECUTE a PUBLIC").not.toBe("(null=default)");
    expect(acl, "PUBLIC executa o emissor").not.toMatch(/(^|,)\{?=X\//);
  });

  it("nenhum papel de aplicação executa o emissor nem alcança a correspondência", () => {
    for (const papel of ["anon", "authenticated", "service_role"]) {
      const exec = psql(
        `select has_function_privilege('${papel}','curadoria.emitir_proposta_de_importancia(uuid,text,uuid)','EXECUTE')::text`,
      );
      expect(exec.saida, `${papel} executa o emissor`).toBe("false");

      for (const privilegio of ["select", "insert", "update", "delete"]) {
        const tab = psql(`select has_table_privilege('${papel}','${MAPA}','${privilegio}')::text`);
        expect(tab.saida, `${papel} tem ${privilegio} na correspondência`).toBe("false");
      }
    }
  });

  it("RLS habilitada e zero policies na correspondência", () => {
    const { saida } = psql(`
      select (select case when relrowsecurity then 't' else 'f' end from pg_class where oid='${MAPA}'::regclass)
             || '|' || (select count(*) from pg_policies where schemaname='curadoria' and tablename='derivation_rule_degree_map')
    `);
    expect(saida).toBe("t|0");
  });
});
