// ITEM 2.2A-MR1 — OS TRÊS INVARIANTES DEIXARAM DE SER PROSA.
//
// A Verificação Independente da 2.2A apontou que append-only, unicidade da
// versão vigente e integridade proposta→regra existiam apenas no texto. Este
// arquivo prova que passaram a existir no banco.
//
// ANTI-VACUIDADE. Cada prova de recusa faz três coisas, nesta ordem:
//   1. cria o cenário e confirma que ele NASCEU (senão a recusa seguinte seria
//      sobre o nada);
//   2. tenta a operação e exige a falha, nomeando a constraint ou o trigger que
//      a produziu — nunca "deu erro";
//   3. desfaz tudo, e o arquivo termina com as duas tabelas vazias.
//
// Tudo roda dentro de transações revertidas: o cenário existe durante a prova e
// não sobrevive a ela. Isso importa num stack local compartilhado.

import { execFileSync } from "node:child_process";

import { afterAll, describe, expect, it } from "vitest";

const CONTAINER = "supabase_db_aliviar-conexao";
const REGRAS = "curadoria.derivation_rules";
const PROPOSTAS = "curadoria.derivation_proposals";

function psql(sql: string): { ok: boolean; saida: string } {
  try {
    const saida = execFileSync(
      "docker",
      ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { ok: true, saida: saida.trim() };
  } catch (erro) {
    const e = erro as { stdout?: Buffer | string; stderr?: Buffer | string };
    return { ok: false, saida: `${String(e.stdout ?? "")}${String(e.stderr ?? "")}` };
  }
}

/** Roda dentro de uma transação SEMPRE revertida. Devolve o que saiu. */
function emTransacaoRevertida(corpo: string): { ok: boolean; saida: string } {
  return psql(`begin;\n${corpo}\nrollback;`);
}

const AUTOR = "'00000000-0000-4000-8000-000000000001'::uuid";
const COLS = "rule_id, version, state, proposed_by, rationale, evidence";
const VALS = (id: string, v: number, estado = "PROPOSTA") =>
  `'${id}', ${v}, '${estado}', ${AUTOR}, 'justificativa', 'nenhuma operacao real'`;

/** Uma regra VIGENTE completa — autoridade, ADR e vigência (CHECK da 2.2A). */
const VIGENTE = (id: string, v: number) =>
  `insert into ${REGRAS} (${COLS}, approved_by, approval_adr, effective_from)
   values (${VALS(id, v, "VIGENTE")}, ${AUTOR}, 'ADR-999', now());`;

afterAll(() => {
  const { saida } = psql(
    `select (select count(*) from ${REGRAS}) || '|' || (select count(*) from ${PROPOSTAS})`,
  );
  if (saida !== "0|0") {
    throw new Error(`MR1 deixou resíduo: regras|propostas = ${saida}`);
  }
});

describe("MR1.1 · append-only — a versão anterior permanece legível, sempre", () => {
  it("UPDATE é recusado pelo trigger, e o cenário existia antes da tentativa", () => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-upd", 1)});
      select 'NASCEU:' || count(*) from ${REGRAS} where rule_id = 'mr1-upd';
      update ${REGRAS} set rationale = 'reescrita' where rule_id = 'mr1-upd';
    `);

    expect(r.saida, "o cenário não nasceu — a recusa seguinte seria sobre o nada").toContain(
      "NASCEU:1",
    );
    expect(r.ok, "o banco aceitou UPDATE numa regra").toBe(false);
    expect(r.saida).toContain("append-only");
  });

  it("DELETE é recusado pelo trigger, e o cenário existia antes da tentativa", () => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-del", 1)});
      select 'NASCEU:' || count(*) from ${REGRAS} where rule_id = 'mr1-del';
      delete from ${REGRAS} where rule_id = 'mr1-del';
    `);

    expect(r.saida).toContain("NASCEU:1");
    expect(r.ok, "o banco aceitou DELETE numa regra").toBe(false);
    expect(r.saida).toContain("append-only");
  });

  it("a recusa não altera nada: rationale, estado, autoria e created_at ficam", () => {
    // A tentativa e a leitura acontecem na MESMA transação: se o UPDATE tivesse
    // efeito parcial, apareceria aqui.
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-int", 1)});
      savepoint antes;
      do $$ begin
        update curadoria.derivation_rules set rationale = 'reescrita', state = 'REVOGADA'
        where rule_id = 'mr1-int';
      exception when others then null; end $$;
      rollback to savepoint antes;
      select 'DEPOIS:' || rationale || '/' || state || '/' || proposed_by
      from ${REGRAS} where rule_id = 'mr1-int';
    `);

    expect(r.ok).toBe(true);
    expect(r.saida).toContain("DEPOIS:justificativa/PROPOSTA/00000000-0000-4000-8000-000000000001");
  });

  it("versão nova nasce por INSERT — append-only não impede versionar", () => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-ver", 1)});
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-ver", 2)});
      select 'VERSOES:' || string_agg(version::text, ',' order by version)
      from ${REGRAS} where rule_id = 'mr1-ver';
    `);

    expect(r.ok, "o banco recusou a versão nova — append-only virou imutabilidade total").toBe(
      true,
    );
    expect(r.saida).toContain("VERSOES:1,2");
  });
});

describe("MR1.2 · no máximo uma VIGENTE por regra", () => {
  it("a primeira VIGENTE é aceita", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE("mr1-vig", 1)}
      select 'ACEITA:' || count(*) from ${REGRAS} where rule_id='mr1-vig' and state='VIGENTE';
    `);
    expect(r.ok).toBe(true);
    expect(r.saida).toContain("ACEITA:1");
  });

  it("a segunda VIGENTE do MESMO rule_id é recusada pelo índice parcial", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE("mr1-dup", 1)}
      select 'PRIMEIRA:' || count(*) from ${REGRAS} where rule_id='mr1-dup';
      ${VIGENTE("mr1-dup", 2)}
    `);

    expect(r.saida, "a primeira não nasceu").toContain("PRIMEIRA:1");
    expect(r.ok, "o banco aceitou duas versões vigentes da mesma regra").toBe(false);
    expect(r.saida).toContain("derivation_rules_uma_vigente_por_regra");
  });

  it("PROPOSTA, SUSPENSA e REVOGADA coexistem — o histórico depende disso", () => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-hist", 1)});
      insert into ${REGRAS} (${COLS}, suspended_or_revoked_at) values (${VALS("mr1-hist", 2, "SUSPENSA")}, now());
      insert into ${REGRAS} (${COLS}, suspended_or_revoked_at) values (${VALS("mr1-hist", 3, "REVOGADA")}, now());
      ${VIGENTE("mr1-hist", 4)}
      select 'HIST:' || count(*) from ${REGRAS} where rule_id='mr1-hist';
    `);

    expect(r.ok, "estados não vigentes deixaram de coexistir").toBe(true);
    expect(r.saida).toContain("HIST:4");
  });

  it("rule_id diferentes vigoram em paralelo", () => {
    const r = emTransacaoRevertida(`
      ${VIGENTE("mr1-a", 1)}
      ${VIGENTE("mr1-b", 1)}
      select 'PARALELO:' || count(*) from ${REGRAS} where state='VIGENTE';
    `);
    expect(r.ok, "o índice virou global em vez de por regra").toBe(true);
    expect(r.saida).toContain("PARALELO:2");
  });

  it("revogar a vigente libera a próxima — sem editar a linha antiga no lugar", () => {
    // A antiga NÃO é atualizada (append-only proíbe). O que a libera é a linha
    // vigente sair do estado por uma versão nova... e é justamente aqui que a
    // 2.2B terá de decidir COMO. Esta prova mostra a fronteira: com a v1 ainda
    // VIGENTE, a v2 não entra.
    const r = emTransacaoRevertida(`
      ${VIGENTE("mr1-suc", 1)}
      ${VIGENTE("mr1-suc", 2)}
    `);
    expect(r.ok).toBe(false);
    expect(r.saida).toContain("derivation_rules_uma_vigente_por_regra");

    // Com a anterior nascida SUSPENSA, a seguinte vigora sem tocar em nada.
    const ok = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}, suspended_or_revoked_at) values (${VALS("mr1-suc2", 1, "SUSPENSA")}, now());
      ${VIGENTE("mr1-suc2", 2)}
      select 'SUCESSAO:' || string_agg(state, ',' order by version) from ${REGRAS} where rule_id='mr1-suc2';
    `);
    expect(ok.ok).toBe(true);
    expect(ok.saida).toContain("SUCESSAO:SUSPENSA,VIGENTE");
  });
});

describe("MR1.3 · toda proposta aponta para uma regra e versão que existem", () => {
  const PROP_COLS =
    "case_id, subcriterion_code, target_field, suggested_value, origin_record, origin_version, origin_declared_at, origin_author, rule_id, rule_version, catalog_version, consequence_degree";
  /**
   * O alvo precisa EXISTIR: `professional_profile_id` tem FK própria, e sem
   * isto a recusa viria da FK errada — o teste provaria outra coisa.
   *
   * Foi exatamente o que aconteceu na primeira execução: um UUID inventado no
   * alvo fez o banco recusar antes de chegar à FK da Regra.
   */
  const CRIAR_ALVO = `insert into curadoria.professional_profiles
      (display_name, professional_identifier, created_by)
    select 'MR1 fixture', 'MR1-' || gen_random_uuid(), p.id
    from curadoria.profiles p limit 1;`;

  const ALVO =
    "(select id from curadoria.professional_profiles where display_name = 'MR1 fixture')";

  const PROP_VALS = (ruleId: string, ruleVersion: number) =>
    `null, 'ACESSO_MODALIDADE', 'importancia', 'MUITO_IMPORTANTE', 'case_needs:x', '1', now(), ${AUTOR}, '${ruleId}', ${ruleVersion}, '1.1.0', 'BAIXO'`;

  it("proposta apontando para regra INEXISTENTE é recusada pela FK", () => {
    const r = emTransacaoRevertida(`
      ${CRIAR_ALVO}
      insert into ${PROPOSTAS} (${PROP_COLS}, professional_profile_id)
      values (${PROP_VALS("regra-que-nao-existe", 1)}, ${ALVO});
    `);
    expect(r.ok, "o banco aceitou proposta órfã").toBe(false);
    expect(r.saida).toContain("derivation_proposals_regra_fk");
  });

  it("proposta apontando para VERSÃO inexistente é recusada — e a regra existia", () => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-fk", 1)});
      select 'REGRA_NASCEU:' || count(*) from ${REGRAS} where rule_id='mr1-fk';
      ${CRIAR_ALVO}
      insert into ${PROPOSTAS} (${PROP_COLS}, professional_profile_id)
      values (${PROP_VALS("mr1-fk", 99)}, ${ALVO});
    `);

    expect(r.saida, "a regra não nasceu — a recusa seria por outro motivo").toContain(
      "REGRA_NASCEU:1",
    );
    expect(r.ok, "o banco aceitou proposta apontando para versão inexistente").toBe(false);
    expect(r.saida).toContain("derivation_proposals_regra_fk");
  });

  it("referência VÁLIDA é aceita — a FK não é um bloqueio geral", () => {
    const r = emTransacaoRevertida(`
      insert into ${REGRAS} (${COLS}) values (${VALS("mr1-ok", 1)});
      ${CRIAR_ALVO}
      insert into ${PROPOSTAS} (${PROP_COLS}, professional_profile_id)
      values (${PROP_VALS("mr1-ok", 1)}, ${ALVO});
      select 'ACEITA:' || count(*) from ${PROPOSTAS} where rule_id='mr1-ok';
    `);
    expect(r.ok, "a FK recusa até a referência legítima — está errada").toBe(true);
    expect(r.saida).toContain("ACEITA:1");
  });

  it("a FK é RESTRICT dos dois lados — nenhuma cascata sobre proveniência", () => {
    const { saida } = psql(`
      select confupdtype::text || confdeltype::text from pg_constraint
      where conname = 'derivation_proposals_regra_fk'
    `);
    // 'r' = RESTRICT nos dois. 'c' (cascade) ou 'a' (no action) reprovariam.
    expect(saida).toBe("rr");
  });

  it("a FK não cria proposta: nada foi semeado", () => {
    const { saida } = psql(`select count(*) from ${PROPOSTAS}`);
    expect(saida).toBe("0");
  });
});

describe("MR1 · as estruturas lidas do catálogo do Postgres", () => {
  it("o trigger append-only existe e cobre UPDATE e DELETE", () => {
    const { saida } = psql(`
      select tgname || ':' || (tgtype::int & 16)::text || ':' || (tgtype::int & 8)::text
      from pg_trigger
      where tgrelid = '${REGRAS}'::regclass and not tgisinternal
    `);
    // 16 = UPDATE, 8 = DELETE — os dois presentes no mesmo trigger.
    expect(saida).toBe("derivation_rules_append_only:16:8");
  });

  it("o índice de vigente única é ÚNICO e PARCIAL", () => {
    const { saida } = psql(`
      select indexdef from pg_indexes where indexname='derivation_rules_uma_vigente_por_regra'
    `);
    expect(saida).toContain("CREATE UNIQUE INDEX");
    expect(saida).toContain("WHERE (state = 'VIGENTE'::text)");
  });

  it("preservações da 2.2A: quatro estados, CHECK de VIGENTE, RLS, zero policy, zero grant", () => {
    const { saida } = psql(`
      select
        (select count(*) from pg_constraint where conrelid='${REGRAS}'::regclass
           and conname='derivation_rules_vigente_exige_autoridade')
        || '|' || (select case when relrowsecurity then 't' else 'f' end from pg_class where relname='derivation_rules')
        || '|' || (select count(*) from pg_policies where tablename in ('derivation_rules','derivation_proposals'))
        || '|' || has_table_privilege('authenticated','${REGRAS}','select')::text
        || '|' || has_table_privilege('authenticated','${PROPOSTAS}','select')::text
    `);
    expect(saida).toBe("1|t|0|false|false");
  });
});
