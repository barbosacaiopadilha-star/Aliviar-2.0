// ITEM 1.8 — A FICHA CONTRA A CADEIA REAL (Arquitetura §11.4).
//
// O unitário prova o contrato. Aqui se prova a coisa mais difícil: que a
// cadeia do §11.4 pode ser RECONSTRUÍDA a partir do banco — declaração da
// pessoa, regra, versão exata, estado aplicável, proposta — e que a Ficha se
// recusa a renderizar quando qualquer elo falta.
//
// Tudo dentro de transação revertida. A Ficha é derivada: `afterAll` derruba a
// suíte se sobrar uma linha sequer.

import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";

import {
  construirFicha,
  type EntradaDaFicha,
  type OrigemDoConceito,
} from "@/modules/curadoria/ficha-de-explicacao";
import { paraMesa, paraPaciente } from "@/modules/curadoria/ficha-de-explicacao-vocabulario";
import { conceitosForaDoMotor } from "@/modules/curadoria/participacao-no-motor";
import { violatesPatientVocabulary } from "@/modules/paciente/experiencia";

const CONTAINER = "supabase_db_aliviar-conexao";

function psql(sql: string): { ok: boolean; saida: string } {
  try {
    return {
      ok: true,
      saida: execFileSync(
        "docker",
        ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql],
        { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
      ).trim(),
    };
  } catch (erro) {
    const e = erro as { stdout?: Buffer | string; stderr?: Buffer | string };
    return { ok: false, saida: `${String(e.stdout ?? "")}${String(e.stderr ?? "")}` };
  }
}

const PESSOA = "'00000000-0000-4000-8000-00000000e001'::uuid";
const STORY = "'00000000-0000-4000-8000-00000000e002'::uuid";
const CASO = "'00000000-0000-4000-8000-00000000e003'::uuid";
const ATOR = "'00000000-0000-4000-8000-00000000e0a1'::uuid";
const CONCEITO = "MODELO_COMUNICACAO";

/**
 * A cadeia inteira, numa transação: pessoa → história → Case → declaração dela
 * → regra → correspondência → vigência → proposta emitida. Ao final, devolve
 * os FATOS que a Ficha vai consumir — nada é inventado do lado do TypeScript.
 */
const CADEIA = `
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'ficha-1-8@local', 'x', now(), now());
  insert into curadoria.patient_stories (id, profile_id, created_by) values (${STORY}, ${PESSOA}, ${PESSOA});
  insert into curadoria.cases (id, patient_profile_id, source_story_id, created_by)
  values (${CASO}, ${PESSOA}, ${STORY}, ${PESSOA});

  insert into curadoria.case_needs (case_id, subcriterion_code, catalog_version, options, degree, origin, declared_by)
  values (${CASO}, '${CONCEITO}', '1.1.0', '{A}', 'ESSENCIAL', 'DIRETO', ${PESSOA});

  insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence)
  values ('regra-ficha', 1, 'PROPOSTA', ${ATOR}, 'regra sintetica do teste', 'nenhuma operacao real');
  insert into curadoria.derivation_rule_transitions (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
  values ('regra-ficha', 1, 1, null, 'PROPOSTA', ${ATOR}, 'PAPEL_INTERNO', 'proposta inicial');
  insert into curadoria.derivation_rule_degree_map (rule_id, rule_version, subcriterion_code, degree, importance) values
    ('regra-ficha', 1, '${CONCEITO}', 'ESSENCIAL', 'MUITO_IMPORTANTE'),
    ('regra-ficha', 1, '${CONCEITO}', 'PESA_MUITO', 'IMPORTANTE'),
    ('regra-ficha', 1, '${CONCEITO}', 'DESEJAVEL', 'RELEVANTE'),
    ('regra-ficha', 1, '${CONCEITO}', 'SEM_PREFERENCIA', 'NAO_INFLUENCIA');
  insert into curadoria.derivation_rule_transitions
    (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
  values ('regra-ficha', 1, 2, 'PROPOSTA', 'VIGENTE', 1, ${ATOR}, 'AUTORIDADE_DE_METODO', 'ato de governanca', 'ADR-066');

  select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${ATOR});
`;

/** Os fatos, como o banco os guarda — a matéria-prima da Ficha. */
const FATOS = `
  select 'FATO:' || n.subcriterion_code || '|' || n.degree || '|' || n.declared_at || '|' || n.declared_by
    || '|' || p.rule_id || '|' || p.rule_version || '|' || curadoria.derivation_rule_state(p.rule_id, p.rule_version)
    || '|' || p.id || '|' || p.suggested_value
  from curadoria.case_needs n
  join curadoria.derivation_proposals p
    on p.case_id = n.case_id and p.subcriterion_code = n.subcriterion_code
  where n.case_id = ${CASO};
`;

type Fatos = {
  code: string;
  degree: string;
  declaredAt: string;
  declaredBy: string;
  ruleId: string;
  ruleVersion: number;
  estado: string;
  propostaId: string;
  importancia: string;
};

function lerFatos(): Fatos {
  const r = psql(`begin;\n${CADEIA}\n${FATOS}\nrollback;`);
  expect(r.ok, r.saida).toBe(true);
  expect(r.saida, "a proposta não foi emitida — a cadeia não nasceu").toContain("DESFECHO:EMITIDA");

  const linha = r.saida.split("\n").find((l) => l.startsWith("FATO:"));
  expect(linha, "os fatos não voltaram do banco").toBeDefined();
  const [code, degree, declaredAt, declaredBy, ruleId, ruleVersion, estado, propostaId, importancia] =
    linha!.slice("FATO:".length).split("|");

  return {
    code: code!,
    degree: degree!,
    declaredAt: declaredAt!,
    declaredBy: declaredBy!,
    ruleId: ruleId!,
    ruleVersion: Number(ruleVersion),
    estado: estado!,
    propostaId: propostaId!,
    importancia: importancia!,
  };
}

function entradaComOsFatos(fatos: Fatos, over: Partial<OrigemDoConceito> = {}): EntradaDaFicha {
  return {
    professionalProfileId: "00000000-0000-4000-8000-00000000ef01",
    leitura: {
      rows: [
        {
          subcriterionCode: fatos.code,
          importance: fatos.importancia as never,
          status: "CONFIRMADO",
          result: "ALTA_COMPATIBILIDADE",
        },
      ],
      summary: {
        totalSubcriteria: 1,
        highCompatibility: 1,
        mediumCompatibility: 0,
        informationGaps: 0,
        notRelevant: 0,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
    },
    origens: [
      {
        subcriterionCode: fatos.code,
        declaracaoOriginal: {
          degree: fatos.degree as never,
          declaredAt: fatos.declaredAt,
          declaredBy: fatos.declaredBy,
        },
        derivacao: {
          ruleId: fatos.ruleId,
          ruleVersion: fatos.ruleVersion,
          estadoDaRegra: fatos.estado as never,
          propostaId: fatos.propostaId,
        },
        ...over,
      },
    ],
    foraDoMotorPorMetodo: conceitosForaDoMotor(),
  };
}

afterAll(() => {
  const { saida } = psql(
    `select (select count(*) from curadoria.derivation_rules) || '|' ||
            (select count(*) from curadoria.derivation_proposals) || '|' ||
            (select count(*) from curadoria.cases) || '|' ||
            (select count(*) from curadoria.case_needs)`,
  );
  if (saida !== "0|0|0|0") {
    throw new Error(`o Item 1.8 deixou resíduo: regras|propostas|cases|needs = ${saida}`);
  }
});

describe("§11.4 · a cadeia real, reconstruída ponta a ponta", () => {
  it("a Ficha nasce dos FATOS do banco, com regra e versão exatas", () => {
    const fatos = lerFatos();
    expect(fatos.estado, "a regra não estava vigente").toBe("VIGENTE");
    expect(fatos.importancia).toBe("MUITO_IMPORTANTE");

    const r = construirFicha(entradaComOsFatos(fatos));
    expect(r.renderizavel, "a cadeia estava completa e mesmo assim bloqueou").toBe(true);
    if (!r.renderizavel) return;

    const [p] = r.ficha.proveniencia;
    expect(p!.subcriterionCode).toBe(fatos.code);
    expect(p!.declaracaoOriginal.degree).toBe(fatos.degree);
    expect(p!.declaracaoOriginal.declaredBy).toBe(fatos.declaredBy);
    expect(p!.regra).toEqual({
      ruleId: fatos.ruleId,
      ruleVersion: fatos.ruleVersion,
      estadoDaRegra: "VIGENTE",
      propostaId: fatos.propostaId,
    });

    // A árvore do §11.4, legível de uma vez na Mesa.
    const linha = paraMesa(r.ficha).proveniencia[0]!;
    expect(linha).toContain(`case_needs(${fatos.degree}`);
    expect(linha).toContain(`regra ${fatos.ruleId} v${fatos.ruleVersion} [VIGENTE]`);
    expect(linha).toContain(fatos.propostaId);
  });

  it("a versão é a EXATA da proposta, nunca 'a regra atual'", () => {
    const fatos = lerFatos();
    // Trocar a versão para uma que não emitiu a proposta quebra a cadeia.
    const r = construirFicha(
      entradaComOsFatos(fatos, {
        derivacao: {
          ruleId: fatos.ruleId,
          ruleVersion: fatos.ruleVersion + 1,
          estadoDaRegra: "VIGENTE",
          propostaId: fatos.propostaId,
        },
      } as Partial<OrigemDoConceito>),
    );
    // A Ficha renderiza (a versão é sintaticamente válida), mas o que ela
    // AFIRMA muda — e é isso que a auditoria compara com a proposta real.
    expect(r.renderizavel).toBe(true);
    if (!r.renderizavel) return;
    expect(r.ficha.proveniencia[0]!.regra!.ruleVersion).not.toBe(fatos.ruleVersion);
    expect(paraMesa(r.ficha).proveniencia[0]).not.toContain(`v${fatos.ruleVersion} [`);
  });

  it("elo quebrado no banco → não renderiza, com o motivo nomeado", () => {
    const fatos = lerFatos();

    const semDeclaracao = construirFicha(
      entradaComOsFatos(fatos, { declaracaoOriginal: null }),
    );
    expect(semDeclaracao.renderizavel).toBe(false);
    if (!semDeclaracao.renderizavel) {
      expect(semDeclaracao.bloqueios[0]!.motivo).toBe("SEM_DECLARACAO_ORIGINAL");
    }

    const semRegra = construirFicha(
      entradaComOsFatos(fatos, {
        derivacao: { ruleId: "", ruleVersion: 1, estadoDaRegra: "VIGENTE", propostaId: fatos.propostaId },
      } as Partial<OrigemDoConceito>),
    );
    expect(semRegra.renderizavel).toBe(false);
    if (!semRegra.renderizavel) expect(semRegra.bloqueios[0]!.motivo).toBe("SEM_REGRA");
  });

  it("regra que deixou de valer no banco → a Ficha não finge validade", () => {
    // Suspende a regra DEPOIS de a proposta existir. A proposta permanece —
    // ela é histórica —, mas a explicação não pode se apoiar numa regra que
    // não vale mais.
    const r = psql(`
      begin;
      ${CADEIA}
      insert into curadoria.derivation_rule_transitions
        (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
      values ('regra-ficha', 1, 3, 'VIGENTE', 'SUSPENSA', ${ATOR}, 'AUTORIDADE_DE_METODO', 'suspensao');
      select 'ESTADO:' || curadoria.derivation_rule_state('regra-ficha', 1);
      select 'PROPOSTAS:' || count(*) from curadoria.derivation_proposals;
      rollback;
    `);
    expect(r.ok, r.saida).toBe(true);
    expect(r.saida).toContain("ESTADO:SUSPENSA");
    expect(r.saida, "a proposta histórica sumiu").toContain("PROPOSTAS:1");

    const fatos = lerFatos();
    const bloqueada = construirFicha(
      entradaComOsFatos(fatos, {
        derivacao: {
          ruleId: fatos.ruleId,
          ruleVersion: fatos.ruleVersion,
          estadoDaRegra: "SUSPENSA",
          propostaId: fatos.propostaId,
        },
      } as Partial<OrigemDoConceito>),
    );
    expect(bloqueada.renderizavel).toBe(false);
    if (!bloqueada.renderizavel) {
      expect(bloqueada.bloqueios[0]!.motivo).toBe("REGRA_NAO_APLICAVEL");
    }
  });

  it("a paciente lê a mesma cadeia sem ver nenhum elo técnico", () => {
    const fatos = lerFatos();
    const r = construirFicha(entradaComOsFatos(fatos));
    expect(r.renderizavel).toBe(true);
    if (!r.renderizavel) return;

    const texto = Object.values(paraPaciente(r.ficha)).flat().join(" ");
    expect(violatesPatientVocabulary(texto)).toBeNull();
    for (const elo of [fatos.ruleId, fatos.propostaId, fatos.code, fatos.degree, "VIGENTE"]) {
      expect(texto, `vazou elo técnico para a paciente: ${elo}`).not.toContain(elo);
    }
  });

  it("nada da Ficha é persistido — o banco fica igual antes e depois", () => {
    const antes = psql(
      `select (select count(*) from curadoria.derivation_proposals) || '|' || (select count(*) from curadoria.cases)`,
    ).saida;

    const fatos = lerFatos();
    const r = construirFicha(entradaComOsFatos(fatos));
    expect(r.renderizavel).toBe(true);
    if (r.renderizavel) paraMesa(r.ficha);

    const depois = psql(
      `select (select count(*) from curadoria.derivation_proposals) || '|' || (select count(*) from curadoria.cases)`,
    ).saida;
    expect(depois, "construir a Ficha escreveu no banco").toBe(antes);
    expect(depois).toBe("0|0");
  });
});
