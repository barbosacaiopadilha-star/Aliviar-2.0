import { beforeAll, describe, expect, it } from "vitest";

import { nomeDoCuradorDoCaso } from "@/modules/paciente/nome-do-curador";

import { casoComCurador, entrarComo, serviceClient, type CadeiaCuradoria, type Sessao } from "./apoio";

/**
 * =============================================================================
 * ITEM 2.6 / G-10 — A CAPABILITY NA BORDA REAL (PostgREST + sessão autenticada)
 * =============================================================================
 *
 * A suíte de integração prova a capability por dentro (psql, catálogo, RLS).
 * Esta prova é a que faltava: o MESMO caminho que a página da paciente usa —
 * cliente supabase-js autenticado → RPC → resposta serializada. O grant a
 * `authenticated` e a saída mínima são verificados NO TRANSPORTE, não no
 * catálogo; e o wrapper de produto (`nomeDoCuradorDoCaso`) é exercitado de
 * verdade, com a sessão real dela.
 */

const service = serviceClient();

let curador: Sessao;
let cadeiaA: CadeiaCuradoria;
let cadeiaB: CadeiaCuradoria;
let nomeRealDoCurador: string;

beforeAll(async () => {
  curador = await entrarComo("curador_medico");
  cadeiaA = await casoComCurador(service, curador.userId, "g10-a");
  cadeiaB = await casoComCurador(service, curador.userId, "g10-b");

  const { data } = await service
    .from("profiles")
    .select("display_name")
    .eq("id", curador.userId)
    .single();
  nomeRealDoCurador = data!.display_name as string;
});

describe("G-10 · a paciente vê o nome do Curador do próprio Case", () => {
  it("o wrapper do caminho da paciente devolve o nome real", async () => {
    const nome = await nomeDoCuradorDoCaso(cadeiaA.paciente.client, cadeiaA.caseId);
    expect(nome).toBe(nomeRealDoCurador);
  });

  it("a resposta do RPC tem SOMENTE desfecho e display_name — saída mínima no transporte", async () => {
    const { data, error } = await cadeiaA.paciente.client.rpc("nome_do_curador_do_caso", {
      p_case_id: cadeiaA.caseId,
    });
    expect(error).toBeNull();
    const linha = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    expect(Object.keys(linha).sort()).toEqual(["desfecho", "display_name"]);
    expect(linha.desfecho).toBe("OK");
    expect(linha.display_name).toBe(nomeRealDoCurador);
  });
});

describe("G-2.6-1 · e somente do próprio Case — o não-vazamento na borda real", () => {
  it("Case de outra paciente e Case inexistente: respostas IDÊNTICAS, sem nome, sem existência", async () => {
    const { data: alheio, error: erroAlheio } = await cadeiaB.paciente.client.rpc(
      "nome_do_curador_do_caso",
      { p_case_id: cadeiaA.caseId },
    );
    const { data: inexistente, error: erroInexistente } = await cadeiaB.paciente.client.rpc(
      "nome_do_curador_do_caso",
      { p_case_id: "00000000-0000-4000-8000-00000026face" },
    );

    expect(erroAlheio).toBeNull();
    expect(erroInexistente).toBeNull();
    // O oráculo de não-vazamento (§15) na resposta serializada de verdade:
    // shape, código e conteúdo — indistinguíveis.
    expect(alheio).toEqual(inexistente);
    const linha = (Array.isArray(alheio) ? alheio[0] : alheio) as Record<string, unknown>;
    expect(linha.desfecho).toBe("SEM_AUTORIDADE");
    expect(linha.display_name).toBeNull();
  });

  it("o wrapper degrada para null diante de SEM_AUTORIDADE — a superfície não distingue", async () => {
    const nome = await nomeDoCuradorDoCaso(cadeiaB.paciente.client, cadeiaA.caseId);
    expect(nome).toBeNull();
  });
});
