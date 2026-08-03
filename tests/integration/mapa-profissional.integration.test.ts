import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SUBCRITERION_CATALOG } from "@/modules/curadoria/mapa-prioridades";
import { listSubcriterionCatalog } from "@/modules/curadoria/mapa-prioridades-repository";
import {
  loadProfessionalMap,
  saveProfessionalMapEntries,
} from "@/modules/curadoria/mapa-profissional-repository";

import { createCuradoriaClient } from "./curadoria-client";
import { seedPublishedProfessional } from "./rede-fixture";

/**
 * MAPA DO PROFISSIONAL — o que o banco garante.
 *
 * O domínio já recusa e explica. Aqui se prova a segunda trava, o isolamento,
 * e que registrar o Mapa não muda nada do estado editorial do profissional.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("Mapa do Profissional (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];
  let adminUserId: string;

  beforeAll(async () => {
    if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
    accounts = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
    adminUserId = (await entrarComo("administrador")).userId;
  });

  async function entrarComo(role: string) {
    const conta = accounts.find((entrada) => entrada.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: conta.email, password: conta.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  const novoProfissional = () =>
    seedPublishedProfessional(service, adminUserId, "Profissional Mapa");

  // -------------------------------------------------------------------------
  // Estados
  // -------------------------------------------------------------------------

  it("aceita os três estados", async () => {
    const id = await novoProfissional();

    const mapa = await saveProfessionalMapEntries(service, id, [
      { subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" },
      { subcriterionCode: "ACESSO_MODALIDADE", status: "NAO_CONFIRMADO" },
      { subcriterionCode: "HISTORICO_ATIVIDADE_ACADEMICA", status: "NAO_INFORMADO" },
    ]);

    expect(mapa.items).toHaveLength(3);
    expect(mapa.items.find((i) => i.subcriterionCode === "FORMACAO_RESIDENCIA")?.status).toBe("CONFIRMADO");
    expect(mapa.completion.status).toBe("IN_PROGRESS");
    expect(mapa.completion.declared, "NAO_INFORMADO conta como tratado").toBe(3);
  });

  it("o banco recusa estado fora do enum", async () => {
    const id = await novoProfissional();
    const catalogo = await listSubcriterionCatalog(service);

    const { error } = await service.from("professional_subcriterion_map").insert({
      professional_profile_id: id,
      subcriterion_id: catalogo[0]!.id,
      status: "EXCELENTE",
    });
    expect(error, "enum precisa recusar").not.toBeNull();
  });

  it("profissional inexistente é recusado", async () => {
    const catalogo = await listSubcriterionCatalog(service);
    const { error } = await service.from("professional_subcriterion_map").insert({
      professional_profile_id: "00000000-0000-0000-0000-000000000000",
      subcriterion_id: catalogo[0]!.id,
      status: "CONFIRMADO",
    });
    expect(error?.message ?? "").toMatch(/foreign key|violates/i);
  });

  it("subcritério inexistente é recusado", async () => {
    const id = await novoProfissional();
    const { error } = await service.from("professional_subcriterion_map").insert({
      professional_profile_id: id,
      subcriterion_id: "00000000-0000-0000-0000-000000000000",
      status: "CONFIRMADO",
    });
    expect(error, "recusado pelo gatilho de circulação ou pela FK").not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Unicidade e idempotência
  // -------------------------------------------------------------------------

  it("o banco impede duas declarações do mesmo subcritério no mesmo profissional", async () => {
    const id = await novoProfissional();
    const catalogo = await listSubcriterionCatalog(service);
    const alvo = catalogo.find((e) => e.code === "MODELO_COMUNICACAO")!;

    await service.from("professional_subcriterion_map").insert({
      professional_profile_id: id,
      subcriterion_id: alvo.id,
      status: "CONFIRMADO",
    });
    const { error } = await service.from("professional_subcriterion_map").insert({
      professional_profile_id: id,
      subcriterion_id: alvo.id,
      status: "NAO_CONFIRMADO",
    });
    expect(error?.message ?? "").toMatch(/duplicate|unique/i);
  });

  it("salvar de novo atualiza, nunca duplica", async () => {
    const id = await novoProfissional();

    await saveProfessionalMapEntries(service, id, [
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", status: "CONFIRMADO", note: "atende no centro" },
    ]);
    const depois = await saveProfessionalMapEntries(service, id, [
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", status: "NAO_CONFIRMADO" },
    ]);

    const doItem = depois.items.filter((i) => i.subcriterionCode === "ACESSO_LOCAL_DE_ATENDIMENTO");
    expect(doItem).toHaveLength(1);
    expect(doItem[0]!.status).toBe("NAO_CONFIRMADO");
    expect(doItem[0]!.note, "a observação foi substituída, não acumulada").toBeNull();
  });

  // -------------------------------------------------------------------------
  // Observação
  // -------------------------------------------------------------------------

  it("a observação é trimada e o vazio vira null — inclusive por fora do domínio", async () => {
    const id = await novoProfissional();
    const catalogo = await listSubcriterionCatalog(service);
    const alvo = catalogo.find((e) => e.code === "CONTINUIDADE_RETORNOS")!;

    await service.from("professional_subcriterion_map").insert({
      professional_profile_id: id,
      subcriterion_id: alvo.id,
      status: "CONFIRMADO",
      note: "   retorno em 30 dias   ",
    });

    const { data } = await service
      .from("professional_subcriterion_map")
      .select("note")
      .eq("professional_profile_id", id)
      .eq("subcriterion_id", alvo.id)
      .single();
    expect(data!.note).toBe("retorno em 30 dias");

    await service
      .from("professional_subcriterion_map")
      .update({ note: "    " })
      .eq("professional_profile_id", id)
      .eq("subcriterion_id", alvo.id);

    const { data: depois } = await service
      .from("professional_subcriterion_map")
      .select("note")
      .eq("professional_profile_id", id)
      .eq("subcriterion_id", alvo.id)
      .single();
    expect(depois!.note, "só-espaço vira null").toBeNull();
  });

  // -------------------------------------------------------------------------
  // Catálogo
  // -------------------------------------------------------------------------

  it("subcritério fora de circulação recusa declaração nova — e o aposentado real prova isso", async () => {
    // A virada do Catálogo 1.0.0 aposentou HISTORICO_ENSINO_E_PESQUISA de
    // verdade (migration 20260802100000). O teste não simula mais a saída de
    // circulação desativando um vigente — o catalog_guard da migration
    // 20260802165000 proíbe toque avulso no catálogo, inclusive da service
    // key — ele prova contra o aposentado REAL.
    const id = await novoProfissional();
    const catalogo = await listSubcriterionCatalog(service, { includeInactive: true });
    const alvo = catalogo.find((e) => e.code === "HISTORICO_ENSINO_E_PESQUISA")!;
    expect(alvo.active, "aposentado desde a virada").toBe(false);

    // A trava do banco…
    const { error } = await service.from("professional_subcriterion_map").insert({
      professional_profile_id: id,
      subcriterion_id: alvo.id,
      status: "CONFIRMADO",
    });
    expect(error?.message ?? "").toMatch(/fora de circulacao/i);

    // …a do domínio, que sabe explicar…
    await expect(
      saveProfessionalMapEntries(service, id, [
        { subcriterionCode: alvo.code, status: "CONFIRMADO" },
      ]),
    ).rejects.toThrow(/saiu de circulação/);

    // …e a completude, que não cobra o legado como pendência.
    const mapa = await loadProfessionalMap(service, id);
    expect(mapa.completion.total, "só os 29 vigentes contam").toBe(29);
    expect(mapa.completion.pendingCodes).not.toContain(alvo.code);

    // O registro aposentado permanece legível — e indeletável: sair de
    // circulação é active=false, nunca DELETE (ADR-039 item 6).
    const { error: erroDelete } = await service
      .from("method_subcriteria")
      .delete()
      .eq("id", alvo.id);
    expect(erroDelete?.message ?? "", "catálogo não se apaga").toMatch(
      /nao se apaga|foreign key|violates/i,
    );
  });

  it("o catálogo vigente tem 29 ativos e 35 registros ao todo, sem duplicação", async () => {
    // 28 ativos do Catálogo 1.0.0 + 6 aposentados do 0.9.0 (histórico
    // legível). Os ativos são exatamente os que o domínio publica.
    const catalogo = await listSubcriterionCatalog(service, { includeInactive: true });
    expect(catalogo).toHaveLength(35);

    const ativos = catalogo.filter((e) => e.active);
    expect(ativos).toHaveLength(29);
    expect(ativos.map((e) => e.code).sort()).toEqual(
      SUBCRITERION_CATALOG.map((e) => e.code).sort(),
    );

    expect(new Set(catalogo.map((e) => e.code)).size).toBe(catalogo.length);
  });

  // -------------------------------------------------------------------------
  // Autorização e exposição
  // -------------------------------------------------------------------------

  it("administrador escreve; Curador lê; paciente e profissional não alcançam", async () => {
    const id = await novoProfissional();
    const catalogo = await listSubcriterionCatalog(service);
    const alvo = catalogo.find((e) => e.code === "EXPERIENCIA_TEMPO_DE_PRATICA")!;

    const admin = await entrarComo("administrador");
    const { error: doAdmin } = await admin.client.from("professional_subcriterion_map").insert({
      professional_profile_id: id,
      subcriterion_id: alvo.id,
      status: "CONFIRMADO",
    });
    expect(doAdmin, "quem edita profissional gerencia o Mapa").toBeNull();

    const curador = await entrarComo("curador_medico");
    const { data: lidoPeloCurador } = await curador.client
      .from("professional_subcriterion_map")
      .select("status")
      .eq("professional_profile_id", id);
    expect((lidoPeloCurador ?? []).length, "o Curador precisa ler para a Mesa").toBeGreaterThan(0);

    // A RLS não devolve erro numa escrita que não alcança linha nenhuma: ela
    // simplesmente não altera nada. Por isso a prova é o EFEITO, não o
    // formato do erro.
    await curador.client
      .from("professional_subcriterion_map")
      .update({ status: "NAO_CONFIRMADO" })
      .eq("professional_profile_id", id);

    const { data: depoisDaTentativa } = await service
      .from("professional_subcriterion_map")
      .select("status")
      .eq("professional_profile_id", id)
      .eq("subcriterion_id", alvo.id)
      .single();
    expect(
      depoisDaTentativa!.status,
      "o Curador não declara sobre o profissional",
    ).toBe("CONFIRMADO");

    for (const papel of ["paciente", "profissional"]) {
      const conta = await entrarComo(papel);
      const { data } = await conta.client
        .from("professional_subcriterion_map")
        .select("status")
        .eq("professional_profile_id", id);
      expect(data ?? [], `${papel} não pode ler dado operacional interno`).toHaveLength(0);
    }
  });

  it("o anônimo não alcança o Mapa", async () => {
    const id = await novoProfissional();
    const anonimo = createCuradoriaClient(url, anonKey);
    const { data } = await anonimo
      .from("professional_subcriterion_map")
      .select("status")
      .eq("professional_profile_id", id);
    expect(data ?? []).toHaveLength(0);
  });

  it("registrar o Mapa não muda o estado editorial nem publica ninguém", async () => {
    const id = await novoProfissional();

    const { data: antes } = await service
      .from("professional_profiles")
      .select("status, publication_status, updated_at")
      .eq("id", id)
      .single();

    await saveProfessionalMapEntries(service, id, [
      { subcriterionCode: "MODELO_ALTERNATIVAS", status: "CONFIRMADO" },
      { subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", status: "NAO_INFORMADO" },
    ]);

    const { data: depois } = await service
      .from("professional_profiles")
      .select("status, publication_status, updated_at")
      .eq("id", id)
      .single();

    expect(depois!.status).toBe(antes!.status);
    expect(depois!.publication_status).toBe(antes!.publication_status);
    expect(depois!.updated_at, "o cadastro não foi tocado").toBe(antes!.updated_at);
  });

  // -------------------------------------------------------------------------
  // Ausência ≠ NAO_INFORMADO
  // -------------------------------------------------------------------------

  it("nada é preenchido automaticamente — ausência continua ausência", async () => {
    const id = await novoProfissional();

    const vazio = await loadProfessionalMap(service, id);
    expect(vazio.completion.status).toBe("NOT_STARTED");
    expect(vazio.items, "nenhuma linha nasce sozinha").toHaveLength(0);

    const { count } = await service
      .from("professional_subcriterion_map")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", id);
    expect(count).toBe(0);
  });
});
