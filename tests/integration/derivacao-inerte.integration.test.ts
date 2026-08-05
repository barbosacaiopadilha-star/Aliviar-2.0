// ITEM 2.1 — A ESTRUTURA EXISTE, E NÃO FAZ NADA.
//
// A Arquitetura §15.0 proíbe "derivação persistida ou consumida" antes das dez
// dependências existirem simultaneamente. `derivation_proposals` é a PRIMEIRA
// dessas dez: criá-la vazia não é persistir derivação — é fazer existir aquilo
// que, junto das outras nove, um dia autorizará a 2.C.
//
// O que este arquivo prova é a diferença entre as duas coisas. A estrutura está
// lá, com os doze itens da ADR-066 §14 e os cinco estados do §11; e ninguém a
// alcança: zero linha, zero policy, RLS ligada, nenhum grant a papel de
// aplicação.
//
// A leitura é por `psql` dentro do container, no idioma de
// `canonical-function-grants.integration.test.ts`: a tabela não tem grant nem
// para `service_role`, então nenhum cliente da aplicação consegue sequer
// contá-la — o que é, em si, a prova mais forte de inércia que se pode ter.

import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const CONTAINER = "supabase_db_aliviar-conexao";
const TABELA = "curadoria.derivation_proposals";

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

describe("2.1 · a estrutura existe", () => {
  it("a tabela foi criada", () => {
    const [linha] = consultar(`select to_regclass('${TABELA}') is not null`);
    expect(linha![0]).toBe("t");
  });

  it("carrega os doze itens obrigatórios da ADR-066 §14, todos not null", () => {
    const colunas = new Map(
      consultar(`
        select column_name, is_nullable
        from information_schema.columns
        where table_schema='curadoria' and table_name='derivation_proposals'
      `).map(([nome, anulavel]) => [nome!, anulavel!]),
    );

    // Itens 1, 3, 8, 9, 10, 11, 12 e o conceito/campo do item 2.
    for (const obrigatorio of [
      "id",
      "subcriterion_code",
      "target_field",
      "suggested_value",
      "origin_record",
      "origin_version",
      "origin_declared_at",
      "origin_author",
      "rule_id",
      "rule_version",
      "emitted_at",
      "catalog_version",
      "consequence_degree",
      "state",
    ]) {
      expect(colunas.has(obrigatorio), `falta a coluna ${obrigatorio}`).toBe(true);
      expect(colunas.get(obrigatorio), `${obrigatorio} aceita nulo`).toBe("NO");
    }

    // O alvo (item 2) é anulável por coluna porque é UM dos dois — a exclusão
    // mútua vive no CHECK, provado abaixo.
    expect(colunas.get("case_id")).toBe("YES");
    expect(colunas.get("professional_profile_id")).toBe("YES");
  });

  it("os cinco estados do §11 são a lista fechada — e PENDENTE não é estado", () => {
    const [linha] = consultar(`
      select pg_get_constraintdef(oid)
      from pg_constraint
      where conrelid = '${TABELA}'::regclass and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%state%'
    `);
    const check = linha![0]!;

    for (const estado of ["PROPOSTA", "CONFIRMADA", "RECUSADA", "SUPERADA", "RETIRADA"]) {
      expect(check, estado).toContain(estado);
    }
    // ADR-066 §11(a): "pendente" é leitura operacional de PROPOSTA, não estado.
    expect(check).not.toContain("PENDENTE");
  });

  it("o alvo é UM: ou o Case, ou o profissional — nunca os dois, nunca nenhum", () => {
    const alvo = consultar(`
      select pg_get_constraintdef(oid)
      from pg_constraint
      where conrelid = '${TABELA}'::regclass
        and conname = 'derivation_proposals_alvo_unico'
    `);
    expect(alvo).toHaveLength(1);
  });
});

describe("2.1 · e permanece INERTE", () => {
  it("zero linhas — a estrutura nasceu vazia e assim está", () => {
    const [linha] = consultar(`select count(*) from ${TABELA}`);
    expect(linha![0]).toBe("0");
  });

  it("zero policies, com RLS ligada: `anon` e `authenticated` não a alcançam", () => {
    const [rls] = consultar(`
      select relrowsecurity, (select count(*) from pg_policies where tablename='derivation_proposals')
      from pg_class where relname='derivation_proposals'
    `);

    expect(rls![0], "RLS não está habilitada").toBe("t");
    expect(rls![1], "alguém abriu uma policy antes das dez dependências").toBe("0");
  });

  it("nenhum grant a papel de aplicação — nem leitura, nem escrita", () => {
    const [privilegios] = consultar(`
      select
        has_table_privilege('anon', '${TABELA}', 'select'),
        has_table_privilege('anon', '${TABELA}', 'insert'),
        has_table_privilege('authenticated', '${TABELA}', 'select'),
        has_table_privilege('authenticated', '${TABELA}', 'insert'),
        has_table_privilege('service_role', '${TABELA}', 'select'),
        has_table_privilege('service_role', '${TABELA}', 'insert')
    `);

    for (const [indice, quem] of [
      "anon select",
      "anon insert",
      "authenticated select",
      "authenticated insert",
      "service_role select",
      "service_role insert",
    ].entries()) {
      expect(privilegios![indice], `${quem} alcança a estrutura`).toBe("f");
    }
  });

  it("zero escritor e zero leitor: nenhuma função do banco a menciona", () => {
    const [linha] = consultar(`
      select count(*) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'curadoria' and p.prosrc ilike '%derivation_proposals%'
    `);
    expect(linha![0], "uma função do banco já opera a estrutura").toBe("0");
  });

  it("zero trigger — nada dispara a partir dela", () => {
    const [linha] = consultar(`
      select count(*) from pg_trigger
      where tgrelid = '${TABELA}'::regclass and not tgisinternal
    `);
    expect(linha![0]).toBe("0");
  });
});
