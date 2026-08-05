// ITEM 2.2A — A REGRA TEM DONO, E A ESTRUTURA NÃO FAZ NADA.
//
// A Arquitetura §10.5 corrige o bloqueador B5 com uma frase que é o pacote
// inteiro: "uma regra sem dono é a pior forma de automação — ninguém a propôs,
// ninguém a aprovou, ninguém pode suspendê-la, e, quando errar, ninguém
// responde".
//
// O que este arquivo prova é que a exigência virou impossibilidade de gravar,
// não recomendação: uma regra `VIGENTE` sem Autoridade de Método e sem ADR é
// RECUSADA PELO BANCO. E que, apesar de existir, a estrutura permanece inerte —
// zero linha, zero policy, nenhum grant, nem para `service_role`.
//
// A leitura é por `psql` no container, no idioma de
// `canonical-function-grants.integration.test.ts`: sem grant, nenhum cliente da
// aplicação alcança a tabela — o que é, em si, a prova de inércia.

import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const CONTAINER = "supabase_db_aliviar-conexao";
const TABELA = "curadoria.derivation_rules";

function consultar(sql: string): string[][] {
  const saida = execFileSync(
    "docker",
    ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-c", sql],
    { encoding: "utf-8" },
  );
  return saida
    .trim()
    .split(/\r?\n/)
    .filter((linha) => linha.length > 0)
    .map((linha) => linha.split("|"));
}

/** Tenta gravar e devolve o erro do banco, se houver. Sempre desfaz. */
function tentarGravar(colunas: string, valores: string): string | null {
  try {
    execFileSync(
      "docker",
      [
        "exec",
        CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        `begin; insert into ${TABELA} (${colunas}) values (${valores}); rollback;`,
      ],
      { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return null;
  } catch (erro) {
    return String((erro as { stderr?: Buffer }).stderr ?? erro);
  }
}

const AUTOR = "'00000000-0000-4000-8000-000000000001'::uuid";
const BASE_COLUNAS = "rule_id, version, state, proposed_by, rationale, evidence";

describe("2.2A · a estrutura da Regra existe", () => {
  it("a tabela foi criada", () => {
    const [linha] = consultar(`select to_regclass('${TABELA}') is not null`);
    expect(linha![0]).toBe("t");
  });

  it("carrega os dez atributos obrigatórios do §10.5", () => {
    const colunas = new Set(
      consultar(`
        select column_name from information_schema.columns
        where table_schema='curadoria' and table_name='derivation_rules'
      `).map(([nome]) => nome!),
    );

    for (const atributo of [
      "rule_id", // identificador
      "version", // versão
      "effective_from", // vigência (início)
      "effective_to", // vigência (fim)
      "proposed_by", // autor proponente
      "approved_by", // autoridade aprovadora
      "approval_adr", // a ADR que aprovou
      "rationale", // justificativa
      "evidence", // evidência utilizada
      "state", // estado
      "suspended_or_revoked_at", // data de suspensão/revogação
      "created_at", // histórico
    ]) {
      expect(colunas.has(atributo), `falta o atributo ${atributo}`).toBe(true);
    }
  });

  it("os QUATRO estados do §10.5 são a lista fechada", () => {
    // O Postgres reescreve `state in (...)` como `state = ANY (ARRAY[...])`.
    // O que se procura é o CHECK que fala de `state` e enumera valores.
    const [linha] = consultar(`
      select pg_get_constraintdef(oid) from pg_constraint
      where conrelid = '${TABELA}'::regclass and contype='c'
        and pg_get_constraintdef(oid) like '%PROPOSTA%'
    `);
    expect(linha, "nenhum CHECK enumera os estados da Regra").toBeTruthy();
    const check = linha![0]!;

    for (const estado of ["PROPOSTA", "VIGENTE", "SUSPENSA", "REVOGADA"]) {
      expect(check, estado).toContain(estado);
    }
    // Nem mais, nem menos: os estados da PROPOSTA (ADR-066 §11) não entram aqui.
    for (const alheio of ["CONFIRMADA", "SUPERADA", "RETIRADA"]) {
      expect(check, alheio).not.toContain(alheio);
    }
  });

  it("o histórico é append-only: a chave é (identificador, versão)", () => {
    const [linha] = consultar(`
      select pg_get_constraintdef(oid) from pg_constraint
      where conrelid = '${TABELA}'::regclass and contype='p'
    `);
    expect(linha![0]).toMatch(/PRIMARY KEY \(rule_id, version\)/i);
  });
});

describe("2.2A · A3 — nenhuma regra vigora sem Autoridade de Método", () => {
  it("VIGENTE sem autoridade aprovadora é RECUSADA pelo banco", () => {
    const erro = tentarGravar(
      `${BASE_COLUNAS}, effective_from`,
      `'r1', 1, 'VIGENTE', ${AUTOR}, 'porque sim', 'nenhuma operacao real', now()`,
    );
    expect(erro, "o banco aceitou uma regra vigente sem dono").not.toBeNull();
    expect(erro).toContain("derivation_rules_vigente_exige_autoridade");
  });

  it("VIGENTE sem a ADR que aprovou é RECUSADA — aprovação sem ADR é opinião", () => {
    const erro = tentarGravar(
      `${BASE_COLUNAS}, approved_by, effective_from`,
      `'r2', 1, 'VIGENTE', ${AUTOR}, 'porque sim', 'nenhuma operacao real', ${AUTOR}, now()`,
    );
    expect(erro).not.toBeNull();
    expect(erro).toContain("derivation_rules_vigente_exige_autoridade");
  });

  it("VIGENTE sem início de vigência é RECUSADA — fora da vigência, não propõe", () => {
    const erro = tentarGravar(
      `${BASE_COLUNAS}, approved_by, approval_adr`,
      `'r3', 1, 'VIGENTE', ${AUTOR}, 'porque sim', 'nenhuma operacao real', ${AUTOR}, 'ADR-999'`,
    );
    expect(erro).not.toBeNull();
    expect(erro).toContain("derivation_rules_vigente_exige_autoridade");
  });

  it("com autoridade, ADR e vigência, a estrutura aceita — a regra NASCE", () => {
    const erro = tentarGravar(
      `${BASE_COLUNAS}, approved_by, approval_adr, effective_from`,
      `'r4', 1, 'VIGENTE', ${AUTOR}, 'porque sim', 'nenhuma operacao real', ${AUTOR}, 'ADR-999', now()`,
    );
    expect(erro, "a estrutura recusa até o caminho legítimo — o CHECK está errado").toBeNull();
  });

  it("PROPOSTA nasce sem autoridade — é onde toda regra começa", () => {
    const erro = tentarGravar(
      BASE_COLUNAS,
      `'r5', 1, 'PROPOSTA', ${AUTOR}, 'sugerida por alguem', 'nenhuma operacao real'`,
    );
    expect(erro, "propor exigiria autoridade — mas propor é de qualquer papel interno").toBeNull();
  });

  it("suspender ou revogar exige dizer QUANDO deixou de valer", () => {
    for (const estado of ["SUSPENSA", "REVOGADA"]) {
      const erro = tentarGravar(
        BASE_COLUNAS,
        `'r6', 1, '${estado}', ${AUTOR}, 'motivo', 'nenhuma operacao real'`,
      );
      expect(erro, estado).not.toBeNull();
      expect(erro, estado).toContain("derivation_rules_fim_tem_data");
    }
  });
});

describe("2.2A · A4/A5 — e permanece INERTE", () => {
  it("zero linhas: nenhuma regra, nenhuma proposta, nenhum exemplo semeado", () => {
    const [linha] = consultar(`select count(*) from ${TABELA}`);
    expect(linha![0]).toBe("0");
  });

  it("zero policies com RLS ligada", () => {
    const [linha] = consultar(`
      select relrowsecurity, (select count(*) from pg_policies where tablename='derivation_rules')
      from pg_class where relname='derivation_rules'
    `);
    expect(linha![0], "RLS não está habilitada").toBe("t");
    expect(linha![1], "alguém abriu uma policy").toBe("0");
  });

  it("nenhum grant a papel de aplicação — nem `service_role` alcança", () => {
    const [p] = consultar(`
      select
        has_table_privilege('anon', '${TABELA}', 'select'),
        has_table_privilege('authenticated', '${TABELA}', 'select'),
        has_table_privilege('authenticated', '${TABELA}', 'insert'),
        has_table_privilege('service_role', '${TABELA}', 'select')
    `);
    for (const [i, quem] of [
      "anon select",
      "authenticated select",
      "authenticated insert",
      "service_role select",
    ].entries()) {
      expect(p![i], `${quem} alcança a Regra`).toBe("f");
    }
  });

  it("zero função do banco a menciona, zero trigger dispara dela", () => {
    const [funcoes] = consultar(`
      select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='curadoria' and p.prosrc ilike '%derivation_rules%'
    `);
    expect(funcoes![0], "uma função já opera a Regra").toBe("0");

    const [triggers] = consultar(`
      select count(*) from pg_trigger
      where tgrelid = '${TABELA}'::regclass and not tgisinternal
    `);
    expect(triggers![0]).toBe("0");
  });

  it("A4 · nenhuma proposta nasceu: a estrutura da 2.1 continua vazia", () => {
    const [linha] = consultar(`select count(*) from curadoria.derivation_proposals`);
    expect(linha![0], "uma proposta nasceu junto da infraestrutura da Regra").toBe("0");
  });
});
