// PACOTE 2.2C-R1 — PARTICIPAÇÃO DO MOTOR E UNICIDADE POR CONCEITO.
//
// F-1 · `MOTOR_PARTICIPATION` mora no Catálogo, é autoritativo no banco, e
//       conceito `NUNCA` não recebe correspondência nem emite — para qualquer
//       papel, inclusive escrita direta privilegiada.
// F-2 · Em qualquer instante, no máximo uma regra vigente cobre cada conceito.
//       Duas portas: promoção/reativação e correspondência em versão vigente.
// F-3 · `SEM_CORRESPONDENCIA` permanece no contrato como RESERVA NÃO
//       OPERACIONAL, e a prova é que ele é inalcançável hoje.
//
// ANTI-VACUIDADE. Cada recusa: cria o cenário → confirma as pré-condições →
// executa → exige a falha NOMEANDO a proteção → exclui as causas concorrentes
// → reverte → `afterAll` derruba a suíte se sobrar linha.
//
// FIXTURES SINTÉTICAS E TRANSACIONAIS. Nenhuma regra real é materializada;
// nenhuma identidade técnica da Autoridade de Método é inventada.

import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";

import { afterAll, describe, expect, it } from "vitest";
import { containerDoBanco } from "../apoio/stack-local";

const execFileAsync = promisify(execFile);

const CONTAINER = containerDoBanco();
const REGRAS = "curadoria.derivation_rules";
const TRANSICOES = "curadoria.derivation_rule_transitions";
const MAPA = "curadoria.derivation_rule_degree_map";
const OCUPACAO = "curadoria.derivation_concept_vigencia";
const PROPOSTAS = "curadoria.derivation_proposals";
const NEEDS = "curadoria.case_needs";

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

const emTransacaoRevertida = (corpo: string) => psql(`begin;\n${corpo}\nrollback;`);

const PESSOA = "'00000000-0000-4000-8000-00000000d001'::uuid";
const STORY = "'00000000-0000-4000-8000-00000000d002'::uuid";
const CASO = "'00000000-0000-4000-8000-00000000d003'::uuid";
const ATOR = "'00000000-0000-4000-8000-00000000d0a1'::uuid";
const C1 = "MODELO_COMUNICACAO";
const C2 = "MODELO_ALTERNATIVAS";

const CASE_FIXTURE = `
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'fixture-r1c@local', 'x', now(), now());
  insert into curadoria.patient_stories (id, profile_id, created_by) values (${STORY}, ${PESSOA}, ${PESSOA});
  insert into curadoria.cases (id, patient_profile_id, source_story_id, created_by)
  values (${CASO}, ${PESSOA}, ${STORY}, ${PESSOA});`;

const GRAU = (grau: string, code = C1) => `
  insert into ${NEEDS} (case_id, subcriterion_code, catalog_version, options, degree, origin, declared_by)
  values (${CASO}, '${code}', '1.1.0', '{A}', '${grau}', 'DIRETO', ${PESSOA});`;

const REGRA = (id: string, v = 1) => `
  insert into ${REGRAS} (rule_id, version, state, proposed_by, rationale, evidence)
  values ('${id}', ${v}, 'PROPOSTA', ${ATOR}, 'primeira versao, PROVISORIA', 'nenhuma operacao real');
  insert into ${TRANSICOES} (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
  values ('${id}', ${v}, 1, null, 'PROPOSTA', ${ATOR}, 'PAPEL_INTERNO', 'proposta inicial');`;

const TRANSICAO = (
  id: string, seq: number, de: string, para: string,
  extras: { v?: number; vigencia?: number | null } = {},
) => {
  const { v = 1, vigencia = para === "VIGENTE" ? 1 : null } = extras;
  const adr = para === "VIGENTE" || para === "REVOGADA" ? "'ADR-066'" : "null";
  return `insert into ${TRANSICOES}
    (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
    values ('${id}', ${v}, ${seq}, '${de}', '${para}', ${vigencia ?? "null"}, ${ATOR},
            'AUTORIDADE_DE_METODO', 'ato de governanca', ${adr});`;
};

const CORRESPONDENCIA = (id: string, code = C1, v = 1) => `
  insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance) values
    ('${id}', ${v}, '${code}', 'ESSENCIAL', 'MUITO_IMPORTANTE'),
    ('${id}', ${v}, '${code}', 'PESA_MUITO', 'IMPORTANTE'),
    ('${id}', ${v}, '${code}', 'DESEJAVEL', 'RELEVANTE'),
    ('${id}', ${v}, '${code}', 'SEM_PREFERENCIA', 'NAO_INFLUENCIA');`;

/** Regra vigente cobrindo um conceito — cobertura ANTES da promoção. */
const VIGENTE_COBRINDO = (id: string, code = C1) => `
  ${REGRA(id)}
  ${CORRESPONDENCIA(id, code)}
  ${TRANSICAO(id, 2, "PROPOSTA", "VIGENTE")}`;

const EMITIR = (code = C1) =>
  `select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${code}', ${ATOR});`;

afterAll(() => {
  const { saida } = psql(
    `select (select count(*) from ${REGRAS} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA') || '|' || (select count(*) from ${TRANSICOES} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA') || '|' ||
            (select count(*) from ${MAPA}) || '|' ||
            -- EMENDA DR3: a ocupação LAVRADA da Regra 001 não é resíduo desta
            -- suíte — sai por nome. Qualquer OUTRA ocupação sobrevivente derruba.
            (select count(*) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA') || '|' ||
            -- O Case da sentinela é o DESTA suíte (por ${PESSOA}): exigir a
            -- tabela inteira zerada derrubava a suíte por Cases legítimos do
            -- E2E ou de seed — resíduo que nunca foi dela.
            (select count(*) from ${PROPOSTAS}) || '|' || (select count(*) from curadoria.cases where patient_profile_id = ${PESSOA})`,
  );
  if (saida !== "0|0|0|0|0|0") {
    throw new Error(`2.2C-R1 deixou resíduo: regras|transicoes|mapa|ocupacao|propostas|cases = ${saida}`);
  }
});

// ===========================================================================
// F-1 · PARTICIPAÇÃO DO MOTOR NO CATÁLOGO
// ===========================================================================

describe("F-1 · o atributo mora no Catálogo, e é autoritativo", () => {
  it("a coluna existe, com os três valores fechados", () => {
    const { saida } = psql(`
      select pg_get_constraintdef(oid) from pg_constraint
      where conname = 'method_subcriteria_motor_participation_check'
    `);
    expect(saida, "a lista de valores deixou de ser fechada").toContain("DIRETO");
    expect(saida).toContain("INDIRETO");
    expect(saida).toContain("NUNCA");

    const quarto = psql(`
      select count(*) from curadoria.method_subcriteria
      where motor_participation is not null
        and motor_participation not in ('DIRETO','INDIRETO','NUNCA')
    `);
    expect(quarto.saida, "nasceu um quarto valor de participação").toBe("0");
  });

  it("todo conceito ATIVO declara participação — e é CHECK, não disciplina", () => {
    const semDeclarar = psql(`
      select count(*) from curadoria.method_subcriteria where active and motor_participation is null
    `);
    expect(semDeclarar.saida, "conceito ativo sem participação declarada").toBe("0");

    const check = psql(`
      select count(*) from pg_constraint where conname = 'method_subcriteria_ativo_declara_motor'
    `);
    expect(check.saida, "o CHECK que exige a declaração não existe").toBe("1");
  });

  it("os quatro conceitos NUNCA são exatamente os canônicos", () => {
    const { saida } = psql(`
      select string_agg(code, ',' order by code) from curadoria.method_subcriteria
      where motor_participation = 'NUNCA'
    `);
    expect(saida).toBe(
      [
        "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
        "MODELO_PREFERENCIAS_E_RESTRICOES",
        "VIABILIDADE_COBERTURA_E_CONVENIO",
        "VIABILIDADE_CUSTO_E_PAGAMENTO",
      ].join(","),
    );
  });

  it("DIRETO e INDIRETO continuam distintos, e INDIRETO não é NUNCA", () => {
    const r = psql(`
      select motor_participation || '=' || count(*)::text
      from curadoria.method_subcriteria where active
      group by motor_participation order by motor_participation
    `);
    expect(r.ok, r.saida).toBe(true);
    const { saida } = r;
    expect(
      saida.split("\n").map((l) => l.trim()).filter(Boolean).sort(),
    ).toEqual(["DIRETO=11", "INDIRETO=14", "NUNCA=4"]);

    // Prática e Trajetória participa por outra via — INDIRETO, jamais NUNCA.
    const pratica = psql(`
      select coalesce(string_agg(distinct motor_participation, ','), '(nenhum)')
      from curadoria.method_subcriteria where active and axis = 'PRATICA_E_TRAJETORIA'
    `);
    expect(pratica.saida, "Prática e Trajetória deixou de participar do Motor").toBe("INDIRETO");
  });

  it("`cruzamento` NÃO foi reutilizado: entre os `humano` há dois NUNCA e um INDIRETO", () => {
    const { saida } = psql(`
      select string_agg(code || '=' || motor_participation, ',' order by code)
      from curadoria.method_subcriteria where active and cruzamento = 'humano'
        and axis = 'MODELO_DE_ATENDIMENTO'
    `);
    // Se `cruzamento` servisse de substituto, os três seriam iguais.
    expect(saida).toContain("MODELO_DECISAO_COMPARTILHADA=INDIRETO");
    expect(saida).toContain("MODELO_PREFERENCIAS_E_RESTRICOES=NUNCA");
    expect(saida).toContain("MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS=NUNCA");
  });

  it("o gerado carrega o atributo, com os mesmos valores do banco", async () => {
    const { CATALOGO_GERADO } = await import("@/modules/curadoria/catalogo-gerado");
    const geradoNunca = CATALOGO_GERADO.filter((c) => c.motorParticipation === "NUNCA")
      .map((c) => c.code)
      .sort();
    const { saida } = psql(`
      select string_agg(code, ',' order by code) from curadoria.method_subcriteria
      where motor_participation = 'NUNCA'
    `);
    expect(geradoNunca.join(","), "o gerado divergiu do banco").toBe(saida);

    const ativosSemAtributo = CATALOGO_GERADO.filter((c) => c.active && !c.motorParticipation);
    expect(ativosSemAtributo, "conceito ativo sem participação no gerado").toEqual([]);
  });
});

describe("F-1 · conceito NUNCA não recebe correspondência — no banco", () => {
  /**
   * A ORDEM DAS CONDIÇÕES DO §16 IMPORTA, e o teste a respeita em vez de
   * escondê-la: a condição 1 (lado da pessoa) é verificada antes da 4
   * (participação). `MODELO_PREFERENCIAS_E_RESTRICOES` não tem lado da pessoa,
   * então é recusado pela primeira; os outros três têm, e caem na quarta.
   *
   * Afrouxar a asserção para "contém uma das duas" esconderia exatamente essa
   * ordem — e é ela que prova que a participação é consultada de verdade nos
   * casos em que nenhuma heurística estrutural alcançaria.
   */
  it.each([
    ["MODELO_PREFERENCIAS_E_RESTRICOES", "nao tem lado da pessoa"],
    ["MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS", "MOTOR_PARTICIPATION = NUNCA"],
    ["VIABILIDADE_COBERTURA_E_CONVENIO", "MOTOR_PARTICIPATION = NUNCA"],
    ["VIABILIDADE_CUSTO_E_PAGAMENTO", "MOTOR_PARTICIPATION = NUNCA"],
  ])("%s é recusado, nomeando a proteção que o alcança", (code, mensagem) => {
    const participacao = psql(
      `select motor_participation from curadoria.method_subcriteria where code='${code}'`,
    );
    expect(participacao.saida, "o conceito não estava marcado NUNCA").toBe("NUNCA");

    const r = emTransacaoRevertida(`
      ${REGRA(`nunca-${code.slice(0, 8).toLowerCase()}`)}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('nunca-${code.slice(0, 8).toLowerCase()}', 1, '${code}', 'ESSENCIAL', 'MUITO_IMPORTANTE');
    `);

    expect(r.ok, `${code} ganhou correspondência`).toBe(false);
    expect(r.saida, "a recusa não veio da proteção esperada").toContain(mensagem);
    // Exclusão das causas concorrentes: não foi a FK, nem a PK, nem a cobertura.
    for (const alheio of ["versao_fk", "conceito_fk", "_pkey", "Correspondencia incompleta"]) {
      expect(r.saida, `a recusa veio de ${alheio}`).not.toContain(alheio);
    }
  });

  it("conceito NUNCA COM lado da pessoa também é recusado — é o caso que só o atributo pega", () => {
    // `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` tem 5 opções da pessoa e não é
    // Viabilidade: nenhuma heurística estrutural o alcançaria.
    const lado = psql(`
      select count(*) from curadoria.method_subcriterion_options
      where subcriterion_code='MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS' and side='paciente' and active
    `);
    expect(Number(lado.saida), "o conceito perdeu o lado da pessoa").toBeGreaterThan(0);

    const r = emTransacaoRevertida(`
      ${REGRA("nunca-lado")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('nunca-lado', 1, 'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', 'ESSENCIAL', 'MUITO_IMPORTANTE');
    `);
    expect(r.ok).toBe(false);
    expect(r.saida).toContain("MOTOR_PARTICIPATION = NUNCA");
    expect(r.saida, "a recusa veio do lado da pessoa, não da participação").not.toContain(
      "nao tem lado da pessoa",
    );
  });

  it("conceito NUNCA não emite, com desfecho nomeado", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL", "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS")}
      select 'GRAU:' || count(*) from ${NEEDS} where case_id = ${CASO};
      select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(
        ${CASO}, 'MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS', ${ATOR});
      select 'PROPOSTAS:' || count(*) from ${PROPOSTAS};
    `);
    expect(r.saida, "o grau não nasceu — a recusa seria sobre o nada").toContain("GRAU:1");
    expect(r.saida).toContain("DESFECHO:CONCEITO_SEM_PONTE");
    expect(r.saida).toContain("PROPOSTAS:0");
  });

  it("a proteção é do BANCO: nem `service_role` nem escrita direta contornam", () => {
    // A recusa vem de trigger, que dispara para todo papel — inclusive o dono
    // da tabela, que é quem executa este teste. Se a proteção fosse policy ou
    // guarda de aplicação, este insert passaria.
    const r = emTransacaoRevertida(`
      set local role postgres;
      ${REGRA("bypass")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('bypass', 1, 'VIABILIDADE_CUSTO_E_PAGAMENTO', 'ESSENCIAL', 'MUITO_IMPORTANTE');
    `);
    expect(r.ok, "o dono da tabela contornou a proteção").toBe(false);
    expect(r.saida).toContain("MOTOR_PARTICIPATION = NUNCA");
  });
});

describe("F-1 · a fonte manual deixou de existir", () => {
  it("o `Record` manual não está mais em `evidencias-pratica.ts`", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync("src/modules/curadoria/evidencias-pratica.ts", "utf8");
    expect(
      /const MOTOR_PARTICIPATION\s*:\s*Record/.test(fonte),
      "o Record manual voltou — duas fontes para o mesmo fato de domínio.",
    ).toBe(false);
    expect(fonte, "o módulo deixou de consumir o valor gerado").toContain(
      "entry.motorParticipation",
    );
  });

  it("e o domínio continua lendo a mesma coisa que o banco", async () => {
    const { PRACTICE_CATALOG } = await import("@/modules/curadoria/evidencias-pratica");
    const doCodigo = PRACTICE_CATALOG.filter((c) => c.motor === "NUNCA").map((c) => c.code).sort();
    const { saida } = psql(`
      select string_agg(code, ',' order by code) from curadoria.method_subcriteria
      where motor_participation = 'NUNCA' and active
    `);
    expect(doCodigo.join(","), "o domínio divergiu do banco").toBe(saida);
  });
});

// ===========================================================================
// F-2 · UMA ÚNICA REGRA VIGENTE POR CONCEITO
// ===========================================================================

describe("F-2 · porta 1 — promoção e reativação", () => {
  it("uma regra cobre VÁRIOS conceitos, e ocupa todos de uma vez", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("multi")}
      ${CORRESPONDENCIA("multi", C1)}
      ${CORRESPONDENCIA("multi", C2)}
      ${TRANSICAO("multi", 2, "PROPOSTA", "VIGENTE")}
      select 'OCUPACOES:' || string_agg(subcriterion_code, ',' order by subcriterion_code) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA';
    `);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain(`OCUPACOES:${[C1, C2].sort().join(",")}`);
  });

  it("duas regras vigentes NÃO cobrem o mesmo conceito", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("dona", C1)}
      select 'DONA:' || curadoria.derivation_rule_state('dona', 1);
      ${REGRA("invasora")}
      ${CORRESPONDENCIA("invasora", C1)}
      ${TRANSICAO("invasora", 2, "PROPOSTA", "VIGENTE")}
    `);
    expect(r.saida, "a primeira não vigorou").toContain("DONA:VIGENTE");
    expect(r.ok, "duas regras vigentes cobriram o mesmo conceito").toBe(false);
    expect(r.saida).toContain("ja esta coberto por outra regra vigente");
    expect(r.saida, "a recusa veio do MR1.2, não da unicidade por conceito").not.toContain(
      "uma_vigente_por_regra",
    );
  });

  it("conceitos DISTINTOS podem ter regras vigentes distintas", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("dona-a", C1)}
      ${VIGENTE_COBRINDO("dona-b", C2)}
      select 'A:' || curadoria.derivation_rule_state('dona-a', 1);
      select 'B:' || curadoria.derivation_rule_state('dona-b', 1);
      select 'OCUPACOES:' || count(*) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA';
    `);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("A:VIGENTE");
    expect(r.saida).toContain("B:VIGENTE");
    expect(r.saida).toContain("OCUPACOES:2");
  });

  it("regra multiconceito com UM conceito em conflito é recusada ATOMICAMENTE", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("dona-c1", C1)}
      select 'OCUPADO:' || count(*) from ${OCUPACAO} where subcriterion_code = '${C1}';
      ${REGRA("parcial")}
      ${CORRESPONDENCIA("parcial", C1)}
      ${CORRESPONDENCIA("parcial", C2)}
      ${TRANSICAO("parcial", 2, "PROPOSTA", "VIGENTE")}
    `);
    expect(r.saida).toContain("OCUPADO:1");
    expect(r.ok, "a regra entrou em vigor com um conceito em conflito").toBe(false);
    expect(r.saida).toContain("ja esta coberto por outra regra vigente");
    expect(r.saida, "a recusa não nomeou a versão que ficaria parcialmente vigente").toContain(
      "A versao parcial/1 NAO entra em vigor",
    );
  });

  it("suspensão LIBERA o conceito para outra regra", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("sai", C1)}
      ${TRANSICAO("sai", 3, "VIGENTE", "SUSPENSA")}
      select 'ESTADO:' || curadoria.derivation_rule_state('sai', 1);
      ${REGRA("entra")}
      ${CORRESPONDENCIA("entra", C1)}
      ${TRANSICAO("entra", 2, "PROPOSTA", "VIGENTE")}
      select 'SUCESSORA:' || curadoria.derivation_rule_state('entra', 1);
      select 'OCUPACOES:' || count(*) from ${OCUPACAO} where subcriterion_code = '${C1}';
    `);
    expect(r.saida).toContain("ESTADO:SUSPENSA");
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("SUCESSORA:VIGENTE");
    // Duas ocupações: a encerrada e a nova. Nada é apagado.
    expect(r.saida).toContain("OCUPACOES:2");
  });

  it("revogação encerra a cobertura, e outra regra pode assumir", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("revog", C1)}
      ${TRANSICAO("revog", 3, "VIGENTE", "REVOGADA")}
      select 'ESTADO:' || curadoria.derivation_rule_state('revog', 1);
      ${REGRA("apos-revog")}
      ${CORRESPONDENCIA("apos-revog", C1)}
      ${TRANSICAO("apos-revog", 2, "PROPOSTA", "VIGENTE")}
      select 'NOVA:' || curadoria.derivation_rule_state('apos-revog', 1);
    `);
    expect(r.saida).toContain("ESTADO:REVOGADA");
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("NOVA:VIGENTE");
  });

  it("REATIVAÇÃO falha quando outra regra tomou o conceito", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("original", C1)}
      ${TRANSICAO("original", 3, "VIGENTE", "SUSPENSA")}
      ${VIGENTE_COBRINDO("tomou", C1)}
      select 'TOMOU:' || curadoria.derivation_rule_state('tomou', 1);
      select 'ORIGINAL:' || curadoria.derivation_rule_state('original', 1);
      ${TRANSICAO("original", 4, "SUSPENSA", "VIGENTE", { vigencia: 2 })}
    `);
    expect(r.saida).toContain("TOMOU:VIGENTE");
    expect(r.saida).toContain("ORIGINAL:SUSPENSA");
    expect(r.ok, "a reativação passou por cima da dona atual").toBe(false);
    expect(r.saida).toContain("ja esta coberto por outra regra vigente");
  });

  it("sucessão legítima funciona: suspende a dona, reativa a antiga", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("v-um", C1)}
      ${TRANSICAO("v-um", 3, "VIGENTE", "SUSPENSA")}
      ${VIGENTE_COBRINDO("v-dois", C1)}
      ${TRANSICAO("v-dois", 3, "VIGENTE", "SUSPENSA")}
      ${TRANSICAO("v-um", 4, "SUSPENSA", "VIGENTE", { vigencia: 2 })}
      select 'FINAL:' || curadoria.derivation_rule_state('v-um', 1) || '/' || curadoria.derivation_rule_state('v-dois', 1);
    `);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("FINAL:VIGENTE/SUSPENSA");
  });
});

describe("F-2 · porta 2 — correspondência em regra já vigente", () => {
  it("cobertura nova numa versão vigente ocupa o conceito na hora", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("depois", C1)}
      select 'ANTES:' || count(*) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA';
      ${CORRESPONDENCIA("depois", C2)}
      select 'DEPOIS:' || string_agg(subcriterion_code, ',' order by subcriterion_code) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA';
    `);
    expect(r.saida).toContain("ANTES:1");
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain(`DEPOIS:${[C1, C2].sort().join(",")}`);
  });

  it("e é RECUSADA quando outra regra vigente já é dona do conceito", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("dona-2", C1)}
      ${VIGENTE_COBRINDO("outra-2", C2)}
      select 'DUAS:' || count(*) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA';
      ${CORRESPONDENCIA("outra-2", C1)}
    `);
    expect(r.saida, "o cenário das duas vigentes não nasceu").toContain("DUAS:2");
    expect(r.ok, "promover primeiro e cobrir depois furou o invariante").toBe(false);
    expect(r.saida).toContain("porta 2");
  });

  it("as correspondências existentes são preservadas quando a nova é recusada", () => {
    // A recusa é uma exceção ordinária: capturada, ela desfaz apenas a linha
    // que a provocou. O bloco `exception` é o savepoint implícito — o teste não
    // pode usar `rollback to savepoint` porque `ON_ERROR_STOP` encerraria o
    // script antes de chegar lá, e a suíte mediria o próprio abandono.
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("preserva-a", C1)}
      ${VIGENTE_COBRINDO("preserva-b", C2)}
      select 'ANTES:' || count(*) from ${MAPA};
      create temp table recusa (mensagem text) on commit drop;
      do $tentativa$
      begin
        insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
        values ('preserva-b', 1, '${C1}', 'ESSENCIAL', 'MUITO_IMPORTANTE');
        insert into recusa values ('A CORRESPONDENCIA INVASORA PASSOU');
      exception when restrict_violation then
        insert into recusa values (sqlerrm);
      end
      $tentativa$;
      select 'RECUSA:' || mensagem from recusa;
      select 'PRESERVADAS:' || count(*) from ${MAPA};
      select 'OCUPACOES:' || count(*) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA';
    `);
    expect(r.ok, r.saida).toBe(true);
    // 4 graus × 2 regras = 8, antes e depois. A recusa não levou nada consigo.
    expect(r.saida).toContain("ANTES:8");
    expect(r.saida, "a recusa arrastou as correspondências legítimas").toContain("PRESERVADAS:8");
    expect(r.saida, "a recusa mexeu nas ocupações existentes").toContain("OCUPACOES:2");
    expect(r.saida).toContain("ja esta coberto por outra regra vigente");
  });

  it("cobertura em regra NÃO vigente não ocupa nada", () => {
    const r = emTransacaoRevertida(`
      ${REGRA("so-proposta")}
      ${CORRESPONDENCIA("so-proposta", C1)}
      select 'ESTADO:' || curadoria.derivation_rule_state('so-proposta', 1);
      select 'OCUPACOES:' || count(*) from ${OCUPACAO} where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA';
    `);
    expect(r.saida).toContain("ESTADO:PROPOSTA");
    expect(r.saida, "uma regra em PROPOSTA ocupou o conceito").toContain("OCUPACOES:0");
  });
});

describe("F-2 · concorrência e arbitragem", () => {
  it("duas ocupações do mesmo conceito com o mesmo ordinal colidem na PK", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE_COBRINDO("colide", C1)}
      insert into ${OCUPACAO} (subcriterion_code, ocupacao_seq, rule_id, rule_version)
      values ('${C1}', 1, 'colide', 1);
    `);
    expect(r.ok, "duas ocupações com o mesmo ordinal coexistiram").toBe(false);
    expect(r.saida).toContain("derivation_concept_vigencia_pkey");
  });

  it("disputa REAL: duas promoções simultâneas, uma vence", async () => {
    const cenario = (id: string) => `${REGRA(id)} ${CORRESPONDENCIA(id, C1)}`;
    psql(`begin; ${cenario("race-a")} ${cenario("race-b")} commit;`);

    try {
      const promover = (id: string) =>
        execFileAsync("docker", ARGS(`begin; ${TRANSICAO(id, 2, "PROPOSTA", "VIGENTE")} commit;`), {
          encoding: "utf-8",
        })
          .then(() => "OK")
          .catch(() => "RECUSADA");

      const desfechos = (await Promise.all([promover("race-a"), promover("race-b")])).sort();

      const vigentes = psql(`
        select count(*) from curadoria.derivation_rules r
        where exists (select 1 from ${MAPA} m where m.rule_id=r.rule_id and m.rule_version=r.version and m.subcriterion_code='${C1}')
          and curadoria.derivation_rule_state(r.rule_id, r.version) = 'VIGENTE'
      `);
      expect(vigentes.saida, "duas regras vigentes cobriram o mesmo conceito").toBe("1");
      expect(desfechos.join("|"), `desfechos inesperados: ${desfechos.join("|")}`).toBe("OK|RECUSADA");
    } finally {
      psql(`
        alter table ${OCUPACAO} disable trigger derivation_concept_vigencia_append_only;
        alter table ${TRANSICOES} disable trigger derivation_rule_transitions_append_only;
        alter table ${MAPA} disable trigger derivation_rule_degree_map_append_only;
        alter table ${REGRAS} disable trigger derivation_rules_append_only;
        delete from ${OCUPACAO} where rule_id in ('race-a','race-b');
        delete from ${MAPA} where rule_id in ('race-a','race-b');
        delete from ${TRANSICOES} where rule_id in ('race-a','race-b');
        delete from ${REGRAS} where rule_id in ('race-a','race-b');
        alter table ${OCUPACAO} enable trigger derivation_concept_vigencia_append_only;
        alter table ${TRANSICOES} enable trigger derivation_rule_transitions_append_only;
        alter table ${MAPA} enable trigger derivation_rule_degree_map_append_only;
        alter table ${REGRAS} enable trigger derivation_rules_append_only;
      `);
    }
  }, 30_000);
});

describe("F-2 · o emissor não arbitra por nome", () => {
  it("o corpo do emissor não contém `order by rule_id`", () => {
    const { saida } = psql(`
      select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='emitir_proposta_de_importancia'
    `);
    expect(saida.length, "o corpo do emissor não foi encontrado").toBeGreaterThan(500);
    // Sem os comentários: o corpo DOCUMENTA a remoção, e uma guarda que olhasse
    // a prosa cairia justamente sobre a frase que registra o cumprimento.
    const codigo = saida.replace(/^\s*--.*$/gm, "");
    expect(
      /order\s+by\s+r?\.?rule_id/i.test(codigo),
      "a arbitragem por nome voltou: escolher regra por ordem alfabética é o oposto de método.",
    ).toBe(false);
  });

  it("e LEVANTA se o invariante for violado, em vez de escolher em silêncio", () => {
    const { saida } = psql(`
      select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='emitir_proposta_de_importancia'
    `);
    expect(saida, "a contagem de candidatas sumiu — voltaria a degradar em silêncio").toContain(
      "INVARIANTE VIOLADO",
    );
    expect(saida).toContain("candidatas > 1");
  });

  it("com a regra vigente única, emite normalmente", () => {
    const r = emTransacaoRevertida(`
      ${CASE_FIXTURE}
      ${GRAU("ESSENCIAL")}
      ${VIGENTE_COBRINDO("emite", C1)}
      ${EMITIR()}
      select 'VALOR:' || suggested_value || '/' || rule_id from ${PROPOSTAS} where case_id = ${CASO};
    `);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("DESFECHO:EMITIDA");
    expect(r.saida).toContain("VALOR:MUITO_IMPORTANTE/emite");
  });
});

// ===========================================================================
// F-3 · `SEM_CORRESPONDENCIA` — RESERVA NÃO OPERACIONAL
// ===========================================================================

describe("F-3 · o desfecho permanece no contrato, e permanece reserva", () => {
  it("a cobertura total dos quatro graus continua OBRIGATÓRIA", () => {
    const trigger = psql(`
      select count(*) from pg_trigger
      where tgname = 'derivation_rule_degree_map_cobertura' and not tgisinternal
    `);
    expect(trigger.saida, "o trigger de cobertura total foi removido").toBe("1");

    const r = psql(`
      begin;
      ${REGRA("parcial-f3")}
      insert into ${MAPA} (rule_id, rule_version, subcriterion_code, degree, importance)
      values ('parcial-f3', 1, '${C1}', 'ESSENCIAL', 'MUITO_IMPORTANTE');
      set constraints all immediate;
      rollback;
    `);
    expect(r.ok, "cobertura parcial passou — o ramo deixaria de ser reserva").toBe(false);
    expect(r.saida).toContain("Correspondencia incompleta");
  });

  it("`SEM_CORRESPONDENCIA` continua no contrato do emissor", () => {
    const { saida } = psql(`
      select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='emitir_proposta_de_importancia'
    `);
    expect(saida, "o desfecho foi removido do contrato").toContain("SEM_CORRESPONDENCIA");
  });

  it("e está DECLARADO como reserva não operacional, não como fluxo atual", () => {
    const { saida } = psql(`
      select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='emitir_proposta_de_importancia'
    `);
    expect(saida, "a declaração de reserva sumiu do corpo").toMatch(/RESERVA N[AÃ]O OPERACIONAL/i);

    const comentario = psql(`
      select obj_description(p.oid, 'pg_proc') from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='emitir_proposta_de_importancia'
    `);
    expect(comentario.saida).toMatch(/RESERVA NAO OPERACIONAL/i);
  });

  it("é inalcançável sob as invariantes atuais — e a prova é construtiva", () => {
    // Regra vigente cobrindo o conceito ⇒ cobertura total ⇒ o grau declarado
    // SEMPRE tem correspondência. Percorrer os quatro graus e nunca obter
    // `SEM_CORRESPONDENCIA` é a prova de que o ramo não é alcançável.
    for (const grau of ["ESSENCIAL", "PESA_MUITO", "DESEJAVEL", "SEM_PREFERENCIA"]) {
      const r = emTransacaoRevertida(`
        ${CASE_FIXTURE}
        ${GRAU(grau)}
        ${VIGENTE_COBRINDO(`f3-${grau.toLowerCase()}`, C1)}
        ${EMITIR()}
      `);
      expect(r.saida, `${grau} alcançou SEM_CORRESPONDENCIA`).not.toContain(
        "DESFECHO:SEM_CORRESPONDENCIA",
      );
      expect(r.saida).toContain("DESFECHO:EMITIDA");
    }
  });

  it("DR3 não foi afrouxado para fabricar o ramo", () => {
    const { saida } = psql(`
      select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='emitir_proposta_de_importancia'
    `);
    // A verificação de regra vigente continua sendo a mesma pergunta.
    expect(saida).toContain("derivation_rule_state");
    expect(saida).toContain("SEM_REGRA_VIGENTE");
  });
});
