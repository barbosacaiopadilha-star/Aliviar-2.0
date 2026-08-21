// ITEM 1.8 — A FICHA SOBRE A CADEIA REAL (R1 · A2).
//
// MUDANÇA DE CONTRATO LAVRADA (CONTRATO_1_8_R1 §9): esta suíte foi reescrita.
// A versão do `c3242ea` lia fatos do banco por psql e os REMONTAVA num modelo
// paralelo (`OrigemDoConceito`) antes de entregá-los à Ficha — e o teste de
// versão era um eco da própria entrada. Agora o caminho é o de produção:
//
//   banco → loadCadeiaDeProveniencia → CadeiaDeProveniencia → construirFicha
//
// O oráculo de versão por falseamento contra a proposta persistida é matéria
// da A3 (coerência), como lavrado.
//
// Fixtures explícitas com limpeza total; `afterAll` derruba a suíte se sobrar
// uma linha.

import { execFileSync } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { conferirCoerencia } from "@/modules/curadoria/cadeia-de-proveniencia";
import { loadCadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia-repository";
import { construirFicha, type EntradaDaFicha } from "@/modules/curadoria/ficha-de-explicacao";
import { paraMesa, paraPaciente, paraRelatorio } from "@/modules/curadoria/ficha-de-explicacao-vocabulario";
import { conceitosForaDoMotor } from "@/modules/curadoria/participacao-no-motor";
import { violatesPatientVocabulary } from "@/modules/paciente/experiencia";
import { containerDoBanco } from "../apoio/stack-local";

const CONTAINER = containerDoBanco();

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

const U = (s: string) => `'00000000-0000-4000-8000-0000000b${s}'::uuid`;
const ID = (s: string) => `00000000-0000-4000-8000-0000000b${s}`;
const PESSOA = U("0001");
const PROF = U("0f01");
const OUTRO_PROF = U("0f02");
const STORY = U("0002");
const CASO = U("0003");
const V1 = U("0e01");

const DERIVADO = "ACESSO_MODALIDADE"; // proposta real emitida pelo emissor
const MANUAL = "MODELO_COMUNICACAO"; // importância manual — sem regra
const SEM_DECLARACAO = "CONTINUIDADE_RETORNOS"; // importância sem case_needs

const service = createAdminSupabaseClient();

function opcaoValida(code: string): string {
  return psql(
    `select value from curadoria.method_subcriterion_options where subcriterion_code='${code}' and side='profissional' and active limit 1`,
  ).saida.split("\n")[0]!;
}

function idDoConceito(code: string): string {
  return psql(`select id from curadoria.method_subcriteria where code='${code}'`).saida;
}

beforeAll(() => {
  const r = psql(`
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
    values (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'ficha-a2@local', 'x', now(), now());
    insert into curadoria.professional_profiles (id, display_name, professional_identifier, crm_uf, status, created_by)
    values (${PROF}, 'Prof Ficha A2 (sintetico)', 'A2F-001', 'SP', 'ativo', ${PESSOA}),
           (${OUTRO_PROF}, 'Legado A2 (sintetico)', 'A2F-002', 'SP', 'ativo', ${PESSOA});
    insert into curadoria.patient_stories (id, profile_id, created_by) values (${STORY}, ${PESSOA}, ${PESSOA});
    insert into curadoria.cases (id, patient_profile_id, source_story_id, created_by)
    values (${CASO}, ${PESSOA}, ${STORY}, ${PESSOA});

    insert into curadoria.practice_evidence
      (id, professional_profile_id, subcriterion_code, catalog_version, version, options, details,
       source_tier, source, collected_at, collected_by, status)
    values (${V1}, ${PROF}, '${DERIVADO}', '1.1.0', 1, '{${opcaoValida(DERIVADO)}}', '{}',
            'OFICIAL_PRIMARIA', 'cadastro inicial', '2026-07-01T08:00:00Z', ${PESSOA}, 'nao_verificado');

    insert into curadoria.professional_subcriterion_map
      (professional_profile_id, subcriterion_id, status, declared_by, evidence_id)
    values (${PROF}, '${idDoConceito(DERIVADO)}'::uuid, 'CONFIRMADO', ${PESSOA}, ${V1});
    -- O legado: mesmo conceito, outro profissional, SEM vínculo (evidence_id).
    -- 'Legado' é ausência de VÍNCULO, não de autor: desde a migration
    -- 20260819230000 (mapa_exige_autor), linha nova sem declared_by é recusada.
    insert into curadoria.professional_subcriterion_map
      (professional_profile_id, subcriterion_id, status, declared_by)
    values (${OUTRO_PROF}, '${idDoConceito(DERIVADO)}'::uuid, 'CONFIRMADO', ${PESSOA});

    insert into curadoria.case_needs (case_id, subcriterion_code, catalog_version, options, degree, origin, declared_by)
    values (${CASO}, '${DERIVADO}', '1.1.0', '{A}', 'ESSENCIAL', 'DIRETO', ${PESSOA}),
           (${CASO}, '${MANUAL}', '1.1.0', '{A}', 'PESA_MUITO', 'DIRETO', ${PESSOA});

    insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence)
    values ('a2f-regra', 1, 'PROPOSTA', ${PESSOA}, 'fixture A2', 'nenhuma operacao real');
    insert into curadoria.derivation_rule_transitions (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
    values ('a2f-regra', 1, 1, null, 'PROPOSTA', ${PESSOA}, 'PAPEL_INTERNO', 'proposta inicial');
    insert into curadoria.derivation_rule_degree_map (rule_id, rule_version, subcriterion_code, degree, importance) values
      ('a2f-regra', 1, '${DERIVADO}', 'ESSENCIAL', 'MUITO_IMPORTANTE'),
      ('a2f-regra', 1, '${DERIVADO}', 'PESA_MUITO', 'IMPORTANTE'),
      ('a2f-regra', 1, '${DERIVADO}', 'DESEJAVEL', 'RELEVANTE'),
      ('a2f-regra', 1, '${DERIVADO}', 'SEM_PREFERENCIA', 'NAO_INFLUENCIA');
    insert into curadoria.derivation_rule_transitions
      (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
    values ('a2f-regra', 1, 2, 'PROPOSTA', 'VIGENTE', 1, ${PESSOA}, 'AUTORIDADE_DE_METODO', 'fixture', 'ADR-066');

    select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${DERIVADO}', ${PESSOA});

    -- Confirmações DEPOIS da emissão (a ordem do regime), inclusive uma
    -- importância órfã de declaração — o caso que bloqueia.
    insert into curadoria.case_priority_map (case_id, subcriterion_id, importance, declared_by)
    values (${CASO}, '${idDoConceito(DERIVADO)}'::uuid, 'MUITO_IMPORTANTE', ${PESSOA}),
           (${CASO}, '${idDoConceito(MANUAL)}'::uuid, 'IMPORTANTE', ${PESSOA}),
           (${CASO}, '${idDoConceito(SEM_DECLARACAO)}'::uuid, 'RELEVANTE', ${PESSOA});
  `);
  if (!r.ok) throw new Error(`fixture falhou:\n${r.saida}`);
  if (!r.saida.includes("DESFECHO:EMITIDA")) throw new Error(`proposta não emitida:\n${r.saida}`);
}, 60_000);

afterAll(() => {
  psql(`
    alter table curadoria.practice_evidence disable trigger practice_evidence_no_update;
    alter table curadoria.derivation_concept_vigencia disable trigger derivation_concept_vigencia_append_only;
    alter table curadoria.derivation_rule_transitions disable trigger derivation_rule_transitions_append_only;
    alter table curadoria.derivation_rule_degree_map disable trigger derivation_rule_degree_map_append_only;
    alter table curadoria.derivation_rules disable trigger derivation_rules_append_only;
    delete from curadoria.derivation_proposals where case_id = ${CASO};
    delete from curadoria.derivation_concept_vigencia where rule_id like 'a2f-%';
    delete from curadoria.derivation_rule_degree_map where rule_id like 'a2f-%';
    delete from curadoria.derivation_rule_transitions where rule_id like 'a2f-%';
    delete from curadoria.derivation_rules where rule_id like 'a2f-%';
    delete from curadoria.professional_subcriterion_map where professional_profile_id in (${PROF}, ${OUTRO_PROF});
    delete from curadoria.practice_evidence where professional_profile_id in (${PROF}, ${OUTRO_PROF});
    delete from curadoria.case_priority_map where case_id = ${CASO};
    delete from curadoria.case_needs where case_id = ${CASO};
    delete from curadoria.cases where id = ${CASO};
    delete from curadoria.patient_stories where id = ${STORY};
    delete from curadoria.professional_profiles where id in (${PROF}, ${OUTRO_PROF});
    delete from auth.users where id = ${PESSOA};
    alter table curadoria.practice_evidence enable trigger practice_evidence_no_update;
    alter table curadoria.derivation_concept_vigencia enable trigger derivation_concept_vigencia_append_only;
    alter table curadoria.derivation_rule_transitions enable trigger derivation_rule_transitions_append_only;
    alter table curadoria.derivation_rule_degree_map enable trigger derivation_rule_degree_map_append_only;
    alter table curadoria.derivation_rules enable trigger derivation_rules_append_only;
  `);
  // A sentinela conta O QUE ESTE TESTE CRIOU — nunca a tabela inteira. A
  // versão anterior exigia as cinco tabelas zeradas no banco todo, o que só
  // era verdade num banco recém-nascido: qualquer seed ou resto legítimo de
  // outra suíte a derrubava com "resíduo" que não era dela (a mesma lição da
  // fixture não-autossuficiente já registrada no projeto).
  const { saida } = psql(
    `select (select count(*) from curadoria.derivation_proposals where case_id = ${CASO}) || '|' ||
            (select count(*) from curadoria.derivation_rules where rule_id like 'a2f-%') || '|' ||
            (select count(*) from curadoria.practice_evidence where professional_profile_id in (${PROF}, ${OUTRO_PROF})) || '|' ||
            (select count(*) from curadoria.professional_subcriterion_map where professional_profile_id in (${PROF}, ${OUTRO_PROF})) || '|' ||
            (select count(*) from curadoria.cases where id = ${CASO})`,
  );
  if (saida !== "0|0|0|0|0") {
    throw new Error(`A2 deixou resíduo: propostas|regras|evidencias|map|cases = ${saida}`);
  }
});

const cadeiaReal = (code: string, prof = ID("0f01")) =>
  loadCadeiaDeProveniencia(service, {
    caseId: ID("0003"),
    professionalProfileId: prof,
    subcriterionCode: code,
  });

function entradaCom(
  cadeias: Awaited<ReturnType<typeof cadeiaReal>>[],
  rows: EntradaDaFicha["leitura"]["rows"],
): EntradaDaFicha {
  return {
    professionalProfileId: ID("0f01"),
    leitura: {
      rows,
      summary: {
        totalSubcriteria: rows.length,
        highCompatibility: rows.filter((r) => r.result === "ALTA_COMPATIBILIDADE").length,
        mediumCompatibility: 0,
        informationGaps: 0,
        notRelevant: 0,
        gapsWithoutAnyRecord: 0,
        notDeclaredByCase: 0,
      },
    },
    cadeias,
    foraDoMotorPorMetodo: conceitosForaDoMotor(),
  };
}

const ROW_DERIVADO = {
  subcriterionCode: DERIVADO,
  importance: "MUITO_IMPORTANTE",
  status: "CONFIRMADO",
  result: "ALTA_COMPATIBILIDADE",
} as const;

describe("A2 · banco real → repositório → cadeia → Ficha", () => {
  it("o caminho de produção fecha: a Ficha nasce da cadeia real e renderiza", async () => {
    const cadeia = await cadeiaReal(DERIVADO);
    expect(cadeia.completa, JSON.stringify(cadeia.lacunas)).toBe(true);

    const r = construirFicha(entradaCom([cadeia], [ROW_DERIVADO]));
    expect(r.integral, JSON.stringify(r.bloqueios)).toBe(true);

    // O grau veio de `case_needs` DO BANCO; a regra e a versão, da proposta
    // emitida pelo emissor canônico — nada foi afirmado pelo teste.
    expect(r.ficha.respostas.porQueFoiEscolhida).toEqual([
      {
        subcriterionCode: DERIVADO,
        degreeDela: "ESSENCIAL",
        estadoDele: "CONFIRMADO",
        resultado: "ALTA_COMPATIBILIDADE",
      },
    ]);
    expect(r.ficha.respostas.grauDeConfianca).toBe("LEITURA_COMPLETA");
    expect(r.ficha.cadeias[0]).toBe(cadeia); // o MESMO objeto — cadeia única

    const mesa = paraMesa(r.ficha);
    expect(mesa.proveniencia[0]).toContain("regra a2f-regra v1");
    expect(mesa.proveniencia[0]).toContain("case_needs(ESSENCIAL");
    expect(mesa.proveniencia[0]).toContain("evidência v1 (OFICIAL_PRIMARIA · cadastro inicial)");

    expect(paraRelatorio(r.ficha).porQueFoiEscolhida[0]).toContain("regra a2f-regra, versão 1");
  });

  it("importância manual: a cadeia real traz NAO_APLICAVEL e a Ficha explica sem regra", async () => {
    const cadeia = await cadeiaReal(MANUAL);
    const proposta = cadeia.ramos
      .find((rm) => rm.lado === "PESSOA")!
      .elos.find((e) => e.id === "PROPOSTA")!;
    expect(proposta.marca).toBe("NAO_APLICAVEL");

    const r = construirFicha(
      entradaCom(
        [cadeia],
        [{ subcriterionCode: MANUAL, importance: "IMPORTANTE", status: null, result: "LACUNA_DE_INFORMACAO" }],
      ),
    );
    expect(r.integral, "o caminho manual completo bloqueou").toBe(true);
    // Sem estado afirmado não há correspondência — o que se prova é a árvore:
    // a importância existe, e veio SEM regra, dito com todas as letras.
    expect(paraMesa(r.ficha).proveniencia[0]).toContain("declaração direta do Curador (sem regra)");
  });

  it("importância sem declaração original → bloqueio nomeado, nunca silêncio", async () => {
    const cadeia = await cadeiaReal(SEM_DECLARACAO);
    expect(cadeia.fatos.declaracao).toBeNull();

    const r = construirFicha(
      entradaCom(
        [cadeia],
        [{ subcriterionCode: SEM_DECLARACAO, importance: "RELEVANTE", status: null, result: "LACUNA_DE_INFORMACAO" }],
      ),
    );
    expect(r.integral).toBe(false);
    expect([...new Set(r.bloqueios.map((b) => b.motivo))]).toEqual(["SEM_DECLARACAO_ORIGINAL"]);
    expect([...new Set(r.bloqueios.map((b) => b.afirmacao))].sort()).toEqual([
      "R1",
      "R3",
      "R4",
      "R6",
    ]);
    expect(r.ficha.status.R5.exibivel, "R5 relata a lacuna e fica de pé").toBe(true);
  });

  it("legado sem vínculo (A3): R1/R3/R6 caem com SEM_EVIDENCIA_VINCULADA; R2/R5 ficam", async () => {
    const cadeia = await cadeiaReal(DERIVADO, ID("0f02"));
    const origem = cadeia.ramos
      .find((rm) => rm.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "DECLARACAO_ORIGINAL")!;
    expect(origem.marca).toBe("AUSENTE");

    const r = construirFicha(entradaCom([cadeia], [ROW_DERIVADO]));
    // MUDANÇA DE CONTRATO (A3, §6/§12): na A2 o legado renderizava por inteiro;
    // agora a afirmação que DEPENDE do ramo estado não é exibível — e o
    // bloqueio é por afirmação, não da Ficha inteira.
    expect(r.integral).toBe(false);
    expect([...new Set(r.bloqueios.map((b) => b.motivo))]).toEqual(["SEM_EVIDENCIA_VINCULADA"]);
    expect(r.ficha.status.R1.exibivel).toBe(false);
    expect(r.ficha.status.R2.exibivel).toBe(true);
    expect(r.ficha.status.R5.exibivel).toBe(true);
    // E a verdade continua viajando com a Ficha:
    expect(r.ficha.cadeias[0]!.completa).toBe(false);
    expect(r.ficha.cadeias[0]!.lacunas.map((l) => l.elo)).toContain("DECLARACAO_ORIGINAL");
  });

  it("a paciente lê a explicação real sem nenhum elo técnico", async () => {
    const cadeia = await cadeiaReal(DERIVADO);
    const r = construirFicha(entradaCom([cadeia], [ROW_DERIVADO]));
    expect(r.integral).toBe(true);

    const propostaId = cadeia.fatos.proposta!.propostaId;
    const texto = Object.values(paraPaciente(r.ficha)).flat().join(" ");
    expect(violatesPatientVocabulary(texto)).toBeNull();
    for (const elo of [DERIVADO, "a2f-regra", propostaId, ID("0e01"), "ESSENCIAL", "OFICIAL_PRIMARIA", "VIGENTE"]) {
      expect(texto, `vazou elo técnico para a paciente: ${elo}`).not.toContain(elo);
    }
  });

  it("nada da Ficha é persistido — o banco fica igual antes e depois", async () => {
    const foto = () =>
      psql(
        `select (select count(*) from curadoria.derivation_proposals) || '|' ||
                (select count(*) from curadoria.practice_evidence) || '|' ||
                (select count(*) from curadoria.professional_subcriterion_map)`,
      ).saida;

    const antes = foto();
    const cadeia = await cadeiaReal(DERIVADO);
    const r = construirFicha(entradaCom([cadeia], [ROW_DERIVADO]));
    {
      paraMesa(r.ficha);
      paraRelatorio(r.ficha);
      paraPaciente(r.ficha);
    }
    expect(foto(), "construir/verbalizar a Ficha escreveu no banco").toBe(antes);
  });
});

// ===========================================================================
// A3 · COERÊNCIA CONTRA O BANCO — o eco morreu, o confronto vive
// ===========================================================================

describe("A3 · falseamento de versão e origem, com fatos persistidos", () => {
  it("§8 · a versão afirmada é confrontada com a proposta REAL — N passa, N+1 cai", async () => {
    const cadeia = await cadeiaReal(DERIVADO);
    const persistida = cadeia.fatos.proposta!;
    expect(persistida.ruleId).toBe("a2f-regra");
    expect(persistida.ruleVersion).toBe(1);

    // Afirmação CORRETA: nada acontece. (O teste de eco morreu aqui: quem
    // afirma o que o banco diz não prova nada além do banco.)
    const correta = construirFicha({
      ...entradaCom([cadeia], [ROW_DERIVADO]),
      afirmacoes: [{ subcriterionCode: DERIVADO, ruleId: "a2f-regra", ruleVersion: 1 }],
    });
    expect(correta.integral, JSON.stringify(correta.bloqueios)).toBe(true);

    // Afirmação com N+1: PROPOSTA_DE_OUTRA_VERSAO, e a afirmação dependente
    // não renderiza — a autoridade é a proposta persistida.
    const adulterada = construirFicha({
      ...entradaCom([cadeia], [ROW_DERIVADO]),
      afirmacoes: [{ subcriterionCode: DERIVADO, ruleId: "a2f-regra", ruleVersion: 2 }],
    });
    expect(adulterada.integral).toBe(false);
    const contradicoes = adulterada.bloqueios.flatMap((b) =>
      b.motivo === "PROVENIENCIA_INCONSISTENTE" ? [b.contradicao] : [],
    );
    expect([...new Set(contradicoes)]).toEqual(["PROPOSTA_DE_OUTRA_VERSAO"]);
    expect(adulterada.ficha.status.R1.exibivel).toBe(false);
    expect(paraMesa(adulterada.ficha).porQueFoiEscolhida).toEqual([
      "AFIRMACAO_NAO_EXIBIVEL — ver bloqueios da leitura",
    ]);

    // E outra regra afirmada cai com o discriminador DELA.
    const outraRegra = construirFicha({
      ...entradaCom([cadeia], [ROW_DERIVADO]),
      afirmacoes: [{ subcriterionCode: DERIVADO, ruleId: "outra-regra" }],
    });
    expect(
      outraRegra.bloqueios.flatMap((b) =>
        b.motivo === "PROVENIENCIA_INCONSISTENTE" ? [b.contradicao] : [],
      ),
    ).toContain("PROPOSTA_DE_OUTRA_REGRA");
  });

  it("§10 · redeclaração DEPOIS da emissão → ORIGEM_SUPERADA, lida do banco", async () => {
    // A pessoa redeclara o grau depois de a proposta ter sido emitida. A
    // proposta guarda o grau da emissão (`origin_version`); a cadeia carrega a
    // declaração CORRENTE — e o confronto acusa a superação (S1, ADR-066 §9).
    const antes = await cadeiaReal(DERIVADO);
    expect(antes.fatos.proposta!.originVersion).toBe("ESSENCIAL");
    expect(conferirCoerencia(antes)).toEqual([]);

    const alterada = psql(`
      update curadoria.case_needs set degree = 'DESEJAVEL'
      where case_id = ${CASO} and subcriterion_code = '${DERIVADO}';
      select 'GRAU:' || degree from curadoria.case_needs
      where case_id = ${CASO} and subcriterion_code = '${DERIVADO}';
    `);
    expect(alterada.ok, alterada.saida).toBe(true);
    expect(alterada.saida).toContain("GRAU:DESEJAVEL");

    try {
      const depois = await cadeiaReal(DERIVADO);
      expect(depois.fatos.declaracao!.degree).toBe("DESEJAVEL");
      expect(conferirCoerencia(depois)).toContain("ORIGEM_SUPERADA");

      const r = construirFicha(entradaCom([depois], [ROW_DERIVADO]));
      expect(r.integral).toBe(false);
      expect(
        r.bloqueios.flatMap((b) =>
          b.motivo === "PROVENIENCIA_INCONSISTENTE" ? [b.contradicao] : [],
        ),
      ).toContain("ORIGEM_SUPERADA");
      expect(r.ficha.status.R1.exibivel).toBe(false);
    } finally {
      const restaurada = psql(`
        update curadoria.case_needs set degree = 'ESSENCIAL'
        where case_id = ${CASO} and subcriterion_code = '${DERIVADO}';
        select 'GRAU:' || degree from curadoria.case_needs
        where case_id = ${CASO} and subcriterion_code = '${DERIVADO}';
      `);
      if (!restaurada.saida.includes("GRAU:ESSENCIAL")) {
        throw new Error(`o grau não foi restaurado: ${restaurada.saida}`);
      }
    }

    // E restaurado, a coerência volta ao silêncio.
    expect(conferirCoerencia(await cadeiaReal(DERIVADO))).toEqual([]);
  });

  it("o discriminador nunca chega à paciente — nem em contradição real", async () => {
    const cadeia = await cadeiaReal(DERIVADO);
    const r = construirFicha({
      ...entradaCom([cadeia], [ROW_DERIVADO]),
      afirmacoes: [{ subcriterionCode: DERIVADO, ruleVersion: 99 }],
    });
    expect(r.integral).toBe(false);

    const texto = JSON.stringify(paraPaciente(r.ficha));
    for (const tecnico of ["PROPOSTA_DE_OUTRA_VERSAO", "PROVENIENCIA_INCONSISTENTE", "a2f-regra", "R1"]) {
      expect(texto, `vazou para a paciente: ${tecnico}`).not.toContain(tecnico);
    }
    expect(violatesPatientVocabulary(texto)).toBeNull();
  });
});
