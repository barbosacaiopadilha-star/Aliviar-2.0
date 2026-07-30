// GRANTS DAS FUNÇÕES CANÔNICAS — nenhuma delas é anônima.
//
// `create function` no PostgreSQL concede EXECUTE a PUBLIC por padrão, e
// PUBLIC alcança `anon`. As migrations da âncora canônica concederam EXECUTE a
// `authenticated` sem revogar esse padrão: as funções nasceram executáveis por
// quem não está autenticado, e isso só apareceu porque alguém foi conferir os
// privilégios reais em produção.
//
// Este teste existe para que não apareça de novo — e por isso pergunta ao
// PostgreSQL quem pode executar cada função, em vez de procurar `revoke` no
// texto das migrations. Uma migration futura que recrie qualquer uma destas
// funções volta a conceder EXECUTE a PUBLIC sem avisar; é essa regressão
// silenciosa que o teste precisa pegar.
//
// A leitura é feita por `psql` dentro do container do Postgres local: o
// PostgREST não expõe catálogo, e criar uma função de execução de SQL só para
// o teste seria abrir no banco justamente o tipo de porta que este arquivo
// existe para fechar.
//
// Escopo: apenas as funções criadas pela entrega canônica. As funções
// históricas do schema `curadoria` que ainda executam por `anon` são dívida
// anterior, com auditoria própria — este teste não as cobre e não deve ser
// ampliado para cobri-las sem que essa auditoria aconteça.

import { execFileSync } from "node:child_process";

import { beforeAll, describe, expect, it } from "vitest";

const CONTAINER = "supabase_db_aliviar-conexao";

// Assinatura completa: `has_function_privilege` precisa dela para desambiguar
// sobrecargas, e escrevê-la aqui documenta o contrato que o teste protege.
const FUNCOES_CANONICAS = [
  "curadoria.canonical_delivery_target(uuid)",
  "curadoria.canonical_delivery_matches(uuid, uuid, uuid)",
  "curadoria.canonical_delivery_has_professional(uuid, uuid)",
  "curadoria.create_connection_from_report(uuid, uuid, timestamptz, uuid, jsonb, timestamptz, timestamptz)",
  "curadoria.case_has_delivered_curadoria(uuid)",
] as const;

type Privilegios = { publico: boolean; anonimo: boolean; autenticado: boolean };

function consultarPrivilegios(): Map<string, Privilegios> {
  const consulta = FUNCOES_CANONICAS.map(
    (assinatura) => `select
        '${assinatura}' as f,
        has_function_privilege('public', '${assinatura}', 'execute'),
        has_function_privilege('anon', '${assinatura}', 'execute'),
        has_function_privilege('authenticated', '${assinatura}', 'execute')`,
  ).join(" union all ");

  const saida = execFileSync(
    "docker",
    ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-c", consulta],
    { encoding: "utf-8" },
  );

  const mapa = new Map<string, Privilegios>();
  for (const linha of saida.trim().split(/\r?\n/)) {
    const [f, publico, anonimo, autenticado] = linha.split("|");
    mapa.set(f, { publico: publico === "t", anonimo: anonimo === "t", autenticado: autenticado === "t" });
  }
  return mapa;
}

describe("Grants das funções canônicas (Supabase local)", () => {
  let privilegios: Map<string, Privilegios>;

  beforeAll(() => {
    privilegios = consultarPrivilegios();
    // Uma consulta que devolvesse menos linhas do que o esperado tornaria as
    // asserções abaixo vazias — e um teste vazio passa.
    expect(privilegios.size).toBe(FUNCOES_CANONICAS.length);
  });

  it("nenhuma função da entrega canônica é executável por PUBLIC", () => {
    for (const assinatura of FUNCOES_CANONICAS) {
      expect(privilegios.get(assinatura)!.publico, assinatura).toBe(false);
    }
  });

  it("nenhuma função da entrega canônica é executável por anon", () => {
    for (const assinatura of FUNCOES_CANONICAS) {
      expect(privilegios.get(assinatura)!.anonimo, assinatura).toBe(false);
    }
  });

  it("todas continuam executáveis pelo papel autenticado", () => {
    for (const assinatura of FUNCOES_CANONICAS) {
      expect(privilegios.get(assinatura)!.autenticado, assinatura).toBe(true);
    }
  });
});
