// ITEM 1.8-R1 · A1.1 — A CADEIA CONTRA O BANCO REAL.
//
// O unitário provou que o CÓDIGO resolve pelo ponteiro. Aqui se prova o que ele
// não alcança: que o caminho inteiro — Mapa → `evidence_id` → `practice_evidence`
// — devolve a evidência APONTADA, mesmo existindo uma versão posterior e
// igualmente compatível ao lado dela.
//
// É a prova central do pacote. Se o repositório passasse a escolher "a mais
// recente", a cadeia afirmaria que uma confirmação de julho se apoiou numa
// evidência que só nasceu em agosto.
//
// As fixtures são criadas e removidas explicitamente: o repositório lê por
// PostgREST e não compartilha transação com o psql. `afterAll` derruba a suíte
// se sobrar uma linha.

import { execFileSync } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { loadCadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia-repository";
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

const U = (sufixo: string) => `'00000000-0000-4000-8000-0000000a${sufixo}'::uuid`;
const PESSOA = U("0001");
const PROF = U("0f01");
const OUTRO_PROF = U("0f02");
const STORY = U("0002");
const CASO = U("0003");
const V1 = U("0e01");
const V2 = U("0e02");
const CONCEITO = "ACESSO_MODALIDADE";
const OUTRO_CONCEITO = "MODELO_COMUNICACAO";

const service = createAdminSupabaseClient();

/** Uma opção que o Catálogo aceita para o conceito, do lado do profissional. */
function opcaoValida(code: string): string {
  const { saida } = psql(
    `select value from curadoria.method_subcriterion_options where subcriterion_code='${code}' and side='profissional' and active limit 1`,
  );
  return saida.split("\n")[0]!;
}

const evidencia = (id: string, versao: number, fonte: string, code = CONCEITO) => `
  insert into curadoria.practice_evidence
    (id, professional_profile_id, subcriterion_code, catalog_version, version, options, details,
     source_tier, source, collected_at, collected_by, status)
  values (${id}, ${PROF}, '${code}', '1.1.0', ${versao}, '{${opcaoValida(code)}}', '{}',
          'OFICIAL_PRIMARIA', '${fonte}', '2026-0${versao === 1 ? 1 : 8}-01T08:00:00Z', ${PESSOA}, 'nao_verificado');`;

function idDoConceito(code: string): string {
  return psql(`select id from curadoria.method_subcriteria where code='${code}'`).saida;
}

beforeAll(() => {
  const r = psql(`
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
    values (${PESSOA}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'a11-vinculo@local', 'x', now(), now());
    insert into curadoria.professional_profiles (id, display_name, professional_identifier, crm_uf, status, created_by)
    values (${PROF}, 'Prof A1.1 (sintetico)', 'A11-001', 'SP', 'ativo', ${PESSOA}),
           (${OUTRO_PROF}, 'Outro A1.1 (sintetico)', 'A11-002', 'SP', 'ativo', ${PESSOA});
    insert into curadoria.patient_stories (id, profile_id, created_by) values (${STORY}, ${PESSOA}, ${PESSOA});
    insert into curadoria.cases (id, patient_profile_id, source_story_id, created_by)
    values (${CASO}, ${PESSOA}, ${STORY}, ${PESSOA});

    ${evidencia(V1, 1, "cadastro inicial")}
    ${evidencia(V2, 2, "revisao posterior")}

    insert into curadoria.professional_subcriterion_map
      (professional_profile_id, subcriterion_id, status, declared_by, evidence_id)
    values (${PROF}, '${idDoConceito(CONCEITO)}'::uuid, 'CONFIRMADO', ${PESSOA}, ${V1});

    insert into curadoria.case_needs (case_id, subcriterion_code, catalog_version, options, degree, origin, declared_by)
    values (${CASO}, '${CONCEITO}', '1.1.0', '{A}', 'ESSENCIAL', 'DIRETO', ${PESSOA}),
           (${CASO}, '${OUTRO_CONCEITO}', '1.1.0', '{A}', 'PESA_MUITO', 'DIRETO', ${PESSOA});

    -- A PROPOSTA REAL (§18): regra sintética vigente cobrindo o CONCEITO, e o
    -- EMISSOR canônico do 2.2C emitindo — nada inserido à mão na tabela de
    -- propostas. O OUTRO_CONCEITO fica deliberadamente SEM regra: é o caminho
    -- manual, que prova o NAO_APLICAVEL.
    insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence)
    values ('a11-regra', 1, 'PROPOSTA', ${PESSOA}, 'fixture A1.1', 'nenhuma operacao real');
    insert into curadoria.derivation_rule_transitions (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
    values ('a11-regra', 1, 1, null, 'PROPOSTA', ${PESSOA}, 'PAPEL_INTERNO', 'proposta inicial');
    insert into curadoria.derivation_rule_degree_map (rule_id, rule_version, subcriterion_code, degree, importance) values
      ('a11-regra', 1, '${CONCEITO}', 'ESSENCIAL', 'MUITO_IMPORTANTE'),
      ('a11-regra', 1, '${CONCEITO}', 'PESA_MUITO', 'IMPORTANTE'),
      ('a11-regra', 1, '${CONCEITO}', 'DESEJAVEL', 'RELEVANTE'),
      ('a11-regra', 1, '${CONCEITO}', 'SEM_PREFERENCIA', 'NAO_INFLUENCIA');
    insert into curadoria.derivation_rule_transitions
      (rule_id, rule_version, seq, from_state, to_state, vigencia_seq, actor_id, authority, reason, approval_adr)
    values ('a11-regra', 1, 2, 'PROPOSTA', 'VIGENTE', 1, ${PESSOA}, 'AUTORIDADE_DE_METODO', 'fixture', 'ADR-066');

    select 'DESFECHO:' || curadoria.emitir_proposta_de_importancia(${CASO}, '${CONCEITO}', ${PESSOA});

    -- A CONFIRMAÇÃO vem DEPOIS da proposta — a ordem do regime real. Inserir a
    -- importância antes faria o próprio emissor recusar com
    -- DECLARACAO_MANUAL_VIGENTE, que é a guarda do 2.2C funcionando.
    insert into curadoria.case_priority_map (case_id, subcriterion_id, importance, declared_by)
    values (${CASO}, '${idDoConceito(CONCEITO)}'::uuid, 'MUITO_IMPORTANTE', ${PESSOA}),
           (${CASO}, '${idDoConceito(OUTRO_CONCEITO)}'::uuid, 'IMPORTANTE', ${PESSOA});
  `);
  if (!r.ok) throw new Error(`fixture falhou:\n${r.saida}`);
  if (!r.saida.includes("DESFECHO:EMITIDA")) {
    throw new Error(`a proposta real não foi emitida:\n${r.saida}`);
  }

  // As duas versões nasceram, e a mais nova é MESMO a mais nova.
  const versoes = psql(
    `select string_agg(version::text, ',' order by version) from curadoria.practice_evidence where professional_profile_id=${PROF}`,
  );
  expect(versoes.saida, "as duas evidências não nasceram").toBe("1,2");
}, 60_000);

afterAll(() => {
  psql(`
    alter table curadoria.practice_evidence disable trigger practice_evidence_no_update;
    alter table curadoria.derivation_concept_vigencia disable trigger derivation_concept_vigencia_append_only;
    alter table curadoria.derivation_rule_transitions disable trigger derivation_rule_transitions_append_only;
    alter table curadoria.derivation_rule_degree_map disable trigger derivation_rule_degree_map_append_only;
    alter table curadoria.derivation_rules disable trigger derivation_rules_append_only;
    delete from curadoria.derivation_proposals where case_id = ${CASO};
    delete from curadoria.derivation_concept_vigencia where rule_id like 'a11-%';
    delete from curadoria.derivation_rule_degree_map where rule_id like 'a11-%';
    delete from curadoria.derivation_rule_transitions where rule_id like 'a11-%';
    delete from curadoria.derivation_rules where rule_id like 'a11-%';
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

  const { saida } = psql(
    `select (select count(*) from curadoria.practice_evidence) || '|' ||
            (select count(*) from curadoria.professional_subcriterion_map) || '|' ||
            (select count(*) from curadoria.cases) || '|' ||
            (select count(*) from curadoria.case_priority_map) || '|' ||
            (select count(*) from curadoria.derivation_proposals) || '|' ||
            (select count(*) from curadoria.derivation_rules where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA') || '|' ||
            -- EMENDA DR3: a ocupacao LAVRADA da Regra 001 nao e residuo nem
-- cenario desta suite — sai da conta POR NOME. Qualquer OUTRA derruba.
            (select count(*) from curadoria.derivation_concept_vigencia where rule_id <> 'CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA')`,
  );
  if (saida !== "0|0|0|0|0|0|0") {
    throw new Error(
      `A1.1 deixou resíduo: evidencias|map|cases|prioridades|propostas|regras|vigencia = ${saida}`,
    );
  }
});

describe("A1.1 · o ramo estado usa o vínculo, nunca a evidência mais recente", () => {
  it("com v1 e v2 no banco, a cadeia devolve a v1 — a APONTADA", async () => {
    const cadeia = await loadCadeiaDeProveniencia(service, {
      caseId: "00000000-0000-4000-8000-0000000a0003",
      professionalProfileId: "00000000-0000-4000-8000-0000000a0f01",
      subcriterionCode: CONCEITO,
    });

    const origem = cadeia.ramos
      .find((r) => r.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "DECLARACAO_ORIGINAL")!;

    expect(origem.marca).toBe("PRESENTE");
    // Fatos inequívocos: versão E fonte, que distinguem as duas linhas.
    expect(origem.detalhe).toContain("v1");
    expect(origem.detalhe).toContain("cadastro inicial");
    expect(origem.detalhe, "a cadeia pulou para a evidência mais recente").not.toContain("v2");
    expect(origem.detalhe).not.toContain("revisao posterior");
    expect(origem.em).toBe("2026-01-01T08:00:00+00:00");
  });

  it("a confirmação do estado vem do Mapa do Profissional, sem inventar autor nem data", async () => {
    const confirmacao = (
      await loadCadeiaDeProveniencia(service, {
        caseId: "00000000-0000-4000-8000-0000000a0003",
        professionalProfileId: "00000000-0000-4000-8000-0000000a0f01",
        subcriterionCode: CONCEITO,
      })
    ).ramos
      .find((r) => r.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "CONFIRMACAO")!;

    expect(confirmacao.marca).toBe("PRESENTE");
    expect(confirmacao.detalhe).toBe("CONFIRMADO");
    expect(confirmacao.autor).toBe("00000000-0000-4000-8000-0000000a0001");
    expect(confirmacao.em, "a data da gravação sumiu").toBeTruthy();
  });

  it("a confirmação da importância vem do Mapa do Case", async () => {
    const confirmacao = (
      await loadCadeiaDeProveniencia(service, {
        caseId: "00000000-0000-4000-8000-0000000a0003",
        professionalProfileId: "00000000-0000-4000-8000-0000000a0f01",
        subcriterionCode: CONCEITO,
      })
    ).ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "CONFIRMACAO")!;

    expect(confirmacao.detalhe).toBe("MUITO_IMPORTANTE");
    expect(confirmacao.autor).toBe("00000000-0000-4000-8000-0000000a0001");
  });

  it("a proposta REAL chega pela capability até a cadeia — id, regra e versão exatos", async () => {
    // O caminho inteiro do §18: proposta emitida pelo emissor canônico →
    // capability → repositório → elo PROPOSTA presente.
    const { data, error } = await service.rpc("ler_proposta_para_proveniencia", {
      p_case_id: "00000000-0000-4000-8000-0000000a0003",
      p_subcriterion_code: CONCEITO,
    });
    expect(error, error?.message).toBeNull();
    const linhas = (data ?? []) as Record<string, unknown>[];
    expect(linhas).toHaveLength(1);

    // Projeção nominal (§21.3): exatamente as onze colunas, nem uma a mais.
    expect(Object.keys(linhas[0]!).sort()).toEqual([
      "case_id",
      "emitted_at",
      "id",
      "origin_author",
      "origin_declared_at",
      "origin_record",
      "origin_version",
      "rule_id",
      "rule_version",
      "subcriterion_code",
      "suggested_value",
    ]);
    expect(linhas[0]!.rule_id).toBe("a11-regra");
    expect(linhas[0]!.rule_version).toBe(1);
    expect(linhas[0]!.suggested_value).toBe("MUITO_IMPORTANTE");
    expect(linhas[0]!.origin_record, "a origem não veio").toBeTruthy();
    expect(linhas[0]!.origin_version, "a versão da origem não veio").toBeTruthy();
    expect(linhas[0]!.origin_declared_at, "a data da declaração não veio").toBeTruthy();
    expect(linhas[0]!.origin_author).toBe("00000000-0000-4000-8000-0000000a0001");

    const proposta = (
      await loadCadeiaDeProveniencia(service, {
        caseId: "00000000-0000-4000-8000-0000000a0003",
        professionalProfileId: "00000000-0000-4000-8000-0000000a0f01",
        subcriterionCode: CONCEITO,
      })
    ).ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "PROPOSTA")!;

    expect(proposta.marca).toBe("PRESENTE");
    expect(proposta.detalhe).toContain("regra a11-regra v1");
    expect(proposta.detalhe).toContain("MUITO_IMPORTANTE");
  });

  it("sem proposta persistida, a importância manual marca NAO_APLICAVEL — e não vira lacuna", async () => {
    // O OUTRO_CONCEITO tem declaração e importância, mas nenhuma regra o
    // cobre: é o caminho manual. E a prova de que nenhuma proposta "parecida"
    // é puxada: existe UMA proposta no banco — de outro conceito — e ela não
    // aparece aqui.
    const alvo = psql(
      `select count(*) from curadoria.derivation_proposals where subcriterion_code='${OUTRO_CONCEITO}'`,
    );
    expect(alvo.saida).toBe("0");
    expect(psql("select count(*) from curadoria.derivation_proposals").saida).toBe("1");

    const cadeia = await loadCadeiaDeProveniencia(service, {
      caseId: "00000000-0000-4000-8000-0000000a0003",
      professionalProfileId: "00000000-0000-4000-8000-0000000a0f01",
      subcriterionCode: OUTRO_CONCEITO,
    });
    const proposta = cadeia.ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "PROPOSTA")!;

    expect(proposta.marca).toBe("NAO_APLICAVEL");
    expect(proposta.detalhe).toBeNull();
    expect(cadeia.lacunas.map((l) => l.elo)).not.toContain("PROPOSTA");
  });

  it("legado sem vínculo fica AUSENTE, mesmo com duas evidências compatíveis no banco", async () => {
    // O outro profissional não tem linha de Mapa; criamos uma SEM vínculo.
    const criada = psql(`
      insert into curadoria.professional_subcriterion_map
        (professional_profile_id, subcriterion_id, status)
      values (${OUTRO_PROF}, '${idDoConceito(CONCEITO)}'::uuid, 'CONFIRMADO');
      select 'COMPATIVEIS:' || count(*) from curadoria.practice_evidence where subcriterion_code='${CONCEITO}';
    `);
    expect(criada.ok, criada.saida).toBe(true);
    expect(criada.saida, "não havia evidência compatível para tentar").toContain("COMPATIVEIS:2");

    const origem = (
      await loadCadeiaDeProveniencia(service, {
        caseId: "00000000-0000-4000-8000-0000000a0003",
        professionalProfileId: "00000000-0000-4000-8000-0000000a0f02",
        subcriterionCode: CONCEITO,
      })
    ).ramos
      .find((r) => r.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "DECLARACAO_ORIGINAL")!;

    expect(origem.marca).toBe("AUSENTE");
    expect(origem.detalhe, "uma evidência foi escolhida para tapar o buraco").toBeNull();
  });
});

describe("A1.1 · a migration segue arbitrando o vínculo", () => {
  it("evidência de outro profissional, de outro conceito e inexistente são recusadas", () => {
    const outroConceito = idDoConceito(OUTRO_CONCEITO);

    const deOutroProfissional = psql(`
      begin;
      insert into curadoria.professional_subcriterion_map (professional_profile_id, subcriterion_id, status, evidence_id)
      values (${OUTRO_PROF}, '${outroConceito}'::uuid, 'CONFIRMADO', ${V1});
      rollback;`);
    expect(deOutroProfissional.ok, "evidência de outro profissional passou").toBe(false);
    expect(deOutroProfissional.saida).toContain("professional_subcriterion_map_evidencia_fk");

    const deOutroConceito = psql(`
      begin;
      insert into curadoria.professional_subcriterion_map (professional_profile_id, subcriterion_id, status, evidence_id)
      values (${PROF}, '${outroConceito}'::uuid, 'CONFIRMADO', ${V1});
      set constraints all immediate;
      rollback;`);
    expect(deOutroConceito.ok, "evidência de outro conceito passou").toBe(false);
    expect(deOutroConceito.saida).toContain("Evidencia de outro conceito");

    const inexistente = psql(`
      begin;
      insert into curadoria.professional_subcriterion_map (professional_profile_id, subcriterion_id, status, evidence_id)
      values (${PROF}, '${outroConceito}'::uuid, 'CONFIRMADO', ${U("0eff")});
      rollback;`);
    expect(inexistente.ok, "evidência inexistente passou").toBe(false);
    expect(inexistente.saida).toContain("professional_subcriterion_map_evidencia_fk");
  });
});

describe("A1.1 · o contrato da capability, conferido no banco", () => {
  const FN = "curadoria.ler_proposta_para_proveniencia(uuid,text)";

  it("os dois aceites COEXISTEM: tabela fechada, capability aberta só a service_role", () => {
    const { saida } = psql(`
      select 'tabela_service=' || has_table_privilege('service_role','curadoria.derivation_proposals','select');
      select 'tabela_insert=' || has_table_privilege('service_role','curadoria.derivation_proposals','insert');
      select 'fn_service=' || has_function_privilege('service_role','${FN}','execute');
      select 'fn_anon=' || has_function_privilege('anon','${FN}','execute');
      select 'fn_auth=' || has_function_privilege('authenticated','${FN}','execute');
      select 'fn_public=' || has_function_privilege('public','${FN}','execute');
    `);
    // O aceite positivo permanente do R1 (§21.1) — proibido trocar
    // "sem SELECT" por "agora pode SELECT". Os dois valem juntos.
    expect(saida).toContain("tabela_service=false");
    expect(saida).toContain("tabela_insert=false");
    expect(saida).toContain("fn_service=true");
    expect(saida).toContain("fn_anon=false");
    expect(saida).toContain("fn_auth=false");
    expect(saida).toContain("fn_public=false");
  });

  it("SECURITY DEFINER, STABLE, STRICT, search_path fixo com pg_temp por último", () => {
    const { saida } = psql(`
      select 'def=' || prosecdef || '|vol=' || provolatile::text || '|strict=' || proisstrict
        || '|cfg=' || array_to_string(proconfig, ';') || '|owner=' || proowner::regrole::text
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='ler_proposta_para_proveniencia'
    `);
    expect(saida).toContain("def=true");
    // STABLE: o motor RECUSA escrita em execução — o read-only é do
    // PostgreSQL, não da disciplina (§21.4).
    expect(saida).toContain("vol=s");
    expect(saida).toContain("strict=true");
    expect(saida).toContain("cfg=search_path=curadoria, pg_temp");
    expect(saida).toContain("owner=postgres");
  });

  it("o corpo não escreve, não emite, não transiciona", () => {
    const { saida } = psql(`
      select prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='curadoria' and p.proname='ler_proposta_para_proveniencia'
    `);
    const corpo = saida.replace(/--.*$/gm, "");
    for (const escrita of [/\binsert\s+into\b/i, /\bupdate\s+curadoria/i, /\bdelete\s+from\b/i, /emitir_proposta/i]) {
      expect(escrita.test(corpo), `a capability passou a escrever: ${escrita}`).toBe(false);
    }
    expect(corpo, "a recusa de ambiguidade sumiu do corpo").toContain("PROPOSTA_AMBIGUA");
  });

  it("mais de uma proposta para o alvo LEVANTA PROPOSTA_AMBIGUA — ao vivo", () => {
    // Segunda proposta para o MESMO alvo, por outra regra, dentro de transação
    // revertida. A capability precisa recusar, nunca escolher.
    const r = psql(`
      begin;
      insert into curadoria.derivation_rules (rule_id, version, state, proposed_by, rationale, evidence)
      values ('a11-outra', 1, 'PROPOSTA', '00000000-0000-4000-8000-0000000a0001'::uuid, 'ambiguidade', 'nenhuma');
      insert into curadoria.derivation_rule_transitions (rule_id, rule_version, seq, from_state, to_state, actor_id, authority, reason)
      values ('a11-outra', 1, 1, null, 'PROPOSTA', '00000000-0000-4000-8000-0000000a0001'::uuid, 'PAPEL_INTERNO', 'p');
      insert into curadoria.derivation_proposals
        (case_id, subcriterion_code, target_field, suggested_value, origin_record, origin_version,
         origin_declared_at, origin_author, rule_id, rule_version, catalog_version, consequence_degree)
      select case_id, subcriterion_code, target_field, suggested_value, origin_record, origin_version,
             origin_declared_at, origin_author, 'a11-outra', 1, catalog_version, consequence_degree
      from curadoria.derivation_proposals where rule_id = 'a11-regra';
      select * from curadoria.ler_proposta_para_proveniencia(
        '00000000-0000-4000-8000-0000000a0003'::uuid, 'ACESSO_MODALIDADE');
      rollback;
    `);
    expect(r.ok, "a capability escolheu entre duas propostas").toBe(false);
    expect(r.saida).toContain("PROPOSTA_AMBIGUA");
  });
});
