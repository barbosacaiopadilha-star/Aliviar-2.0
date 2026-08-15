// PP-03B · D-2 — A GUARDA PERGUNTA AO POSTGRES, NÃO AO TEXTO DA MIGRATION.
//
// A guarda anterior (PP-03A) procurava `revoke ... from anon` no SQL e passava
// verde enquanto PUBLIC mantinha EXECUTE — porque `create function` concede
// EXECUTE a PUBLIC por padrão, e revogar de `anon` não desfaz o grant herdado.
// Ela provava que a migration DIZIA a coisa certa, não que o banco ESTAVA
// certo. É a diferença entre ler a placa e abrir a porta.
//
// Aqui a pergunta é feita ao catálogo do PostgreSQL, no mesmo idioma de
// `tests/integration/canonical-function-grants.integration.test.ts`: `psql`
// dentro do container, porque o PostgREST não expõe catálogo e criar uma
// função de execução de SQL só para o teste seria abrir no banco exatamente o
// tipo de porta que este arquivo existe para fechar.
//
// Uma migration futura que recrie a função sem revogar de PUBLIC volta a
// abri-la sem avisar. É essa regressão silenciosa que este teste pega.

import { execFileSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import { anonKey, url } from "./apoio";
import { containerDoBanco } from "../apoio/stack-local";

const CONTAINER = containerDoBanco();

const ESCRITA_DA_PACIENTE = "curadoria.acknowledge_case_need(uuid, text, text, text)";
/** O precedente obrigatório: a ACL da escrita dela tem de coincidir com a dele. */
const PRECEDENTE = "curadoria.acknowledge_priority_profile(uuid)";

type Privilegios = {
  publico: boolean;
  anonimo: boolean;
  autenticado: boolean;
  securityDefiner: boolean;
  searchPath: string;
};

function consultar(assinaturas: readonly string[]): Map<string, Privilegios> {
  const consulta = assinaturas
    .map(
      (assinatura) => `select
        '${assinatura}' as f,
        has_function_privilege('public', '${assinatura}', 'execute'),
        has_function_privilege('anon', '${assinatura}', 'execute'),
        has_function_privilege('authenticated', '${assinatura}', 'execute'),
        p.prosecdef,
        coalesce(array_to_string(p.proconfig, ','), '')
      from pg_proc p
      where p.oid = '${assinatura}'::regprocedure`,
    )
    .join(" union all ");

  const saida = execFileSync(
    "docker",
    ["exec", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-At", "-F", "|", "-c", consulta],
    { encoding: "utf-8" },
  );

  const mapa = new Map<string, Privilegios>();
  for (const linha of saida.trim().split(/\r?\n/)) {
    const [f, publico, anonimo, autenticado, definer, config] = linha.split("|");
    mapa.set(f!, {
      publico: publico === "t",
      anonimo: anonimo === "t",
      autenticado: autenticado === "t",
      securityDefiner: definer === "t",
      searchPath: config ?? "",
    });
  }
  return mapa;
}

describe("PP-03B · a ACL efetiva da escrita da paciente", () => {
  let acl: Map<string, Privilegios>;

  beforeAll(() => {
    acl = consultar([ESCRITA_DA_PACIENTE, PRECEDENTE]);
    // Consulta que devolvesse menos linhas tornaria as asserções vazias — e
    // teste vazio passa.
    expect(acl.size).toBe(2);
  });

  it("PUBLIC não executa a escrita da paciente", () => {
    expect(acl.get(ESCRITA_DA_PACIENTE)!.publico).toBe(false);
  });

  it("`anon` não executa — nem por grant direto, nem herdado de PUBLIC", () => {
    expect(acl.get(ESCRITA_DA_PACIENTE)!.anonimo).toBe(false);
  });

  it("`authenticated` executa — a autorização real é `is_patient_for_case`, no corpo", () => {
    expect(acl.get(ESCRITA_DA_PACIENTE)!.autenticado).toBe(true);
  });

  it("a ACL coincide EXATAMENTE com a do precedente obrigatório", () => {
    const dela = acl.get(ESCRITA_DA_PACIENTE)!;
    const dele = acl.get(PRECEDENTE)!;

    expect({ publico: dela.publico, anonimo: dela.anonimo, autenticado: dela.autenticado }).toEqual({
      publico: dele.publico,
      anonimo: dele.anonimo,
      autenticado: dele.autenticado,
    });
  });

  it("é SECURITY DEFINER com search_path fixo — lido do catálogo, não do texto", () => {
    const dela = acl.get(ESCRITA_DA_PACIENTE)!;
    expect(dela.securityDefiner).toBe(true);
    expect(dela.searchPath).toContain("search_path=curadoria");
    expect(dela.searchPath).toContain("pg_temp");
  });
});

/**
 * A mesma verdade, pela porta da frente: um cliente sem login. O catálogo diz
 * quem PODE; isto mostra o que ACONTECE. Se alguém reabrir a função a PUBLIC,
 * os dois caem juntos.
 */
describe("PP-03B · quem não se autenticou não alcança a função", () => {
  it("chamada anônima é recusada pelo banco, não pelo corpo da função", async () => {
    const anonimo = createClient(url(), anonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await anonimo.rpc("acknowledge_case_need", {
      _case_id: "11111111-1111-4111-8111-111111111111",
      _subcriterion_code: "MODELO_COMUNICACAO",
      _acknowledgment: "RECUSADA",
      _correction: "sem sessão",
    });

    expect(data).toBeNull();
    expect(error).not.toBeNull();

    // Sem EXECUTE, a função sequer aparece para o papel anônimo: o PostgREST
    // responde PGRST202 (não existe no schema cache dele) antes mesmo de o
    // Postgres ter chance de responder 42501. Os dois significam a mesma
    // coisa — não alcançou —, e qual deles chega depende da camada que barra
    // primeiro. O que este teste fixa é que ALGUMA barra, e que não é o corpo.
    expect(["42501", "PGRST202"]).toContain((error as { code?: string }).code);

    // O ponto: NÃO é 'NAO_AUTORIZADO'. Chegar ao corpo da função já seria
    // alcance demais para quem não se autenticou — esse retorno é a resposta
    // de posse para uma paciente REAL no Case errado, não para um anônimo.
    expect(data).not.toBe("NAO_AUTORIZADO");
  });
});
