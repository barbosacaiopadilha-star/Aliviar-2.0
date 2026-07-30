import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { SUBCRITERION_CATALOG, SUBCRITERION_GROUPS } from "@/modules/curadoria/mapa-prioridades";
import {
  listSubcriterionCatalog,
  loadCasePriorityMap,
  savePriorityMapEntries,
} from "@/modules/curadoria/mapa-prioridades-repository";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * MAPA DE PRIORIDADES — o que o banco garante.
 *
 * O domínio já recusa e explica (`mapa-prioridades.test.ts`). Aqui se prova a
 * segunda trava: a que vale mesmo quando alguém escreve por fora do domínio.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

let semente = 0;
const unico = (prefixo: string) => `${prefixo}-${Date.now()}-${(semente += 1)}`;

describe("Mapa de Prioridades do Case (Supabase local)", () => {
  const service = createAdminSupabaseClient();
  let accounts: TestAccount[];

  beforeAll(() => {
    if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe.");
    accounts = JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
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

  async function casoNovo() {
    const admin = await entrarComo("administrador");
    const curador = await entrarComo("curador_medico");

    const email = `${unico("mapa")}@aliviar-conexao.local`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Mapa" },
      admin.userId,
    );
    const pacienteClient = createCuradoriaClient(url, anonKey);
    await pacienteClient.auth.signInWithPassword({ email, password: paciente.password });
    const rascunho = await getOrCreateActiveStory(pacienteClient, paciente.profileId);
    const historia = await submitStory(pacienteClient, rascunho.id, rascunho.revision);
    const kase = await createCase(admin.client, historia.id, curador.userId, admin.userId);

    return { caseId: kase.id, curador, admin };
  }

  // -------------------------------------------------------------------------
  // Catálogo
  // -------------------------------------------------------------------------

  it("o catálogo do banco é o mesmo do domínio — uma fonte, duas leituras", async () => {
    const doBanco = await listSubcriterionCatalog(service);

    expect(doBanco.length).toBe(SUBCRITERION_CATALOG.length);
    expect(doBanco.map((e) => e.code).sort()).toEqual(
      SUBCRITERION_CATALOG.map((e) => e.code).sort(),
    );
    for (const entry of doBanco) {
      const noDominio = SUBCRITERION_CATALOG.find((e) => e.code === entry.code)!;
      expect(entry.group, entry.code).toBe(noDominio.group);
      expect(entry.name, entry.code).toBe(noDominio.name);
    }
  });

  it("o catálogo só usa os seis grupos do Modelo v1.0", async () => {
    const doBanco = await listSubcriterionCatalog(service);
    for (const entry of doBanco) {
      expect(SUBCRITERION_GROUPS, entry.code).toContain(entry.group);
    }
  });

  it("o banco recusa grupo fora do universo fechado", async () => {
    const { error } = await service.from("method_subcriteria").insert({
      code: unico("INVENTADO"),
      group: "historico_profissional",
      name: "Vocabulário paralelo",
      description: "Não deve entrar.",
      display_order: 99,
    });
    expect(error, "CHECK do grupo precisa recusar").not.toBeNull();
  });

  it("código duplicado é recusado pelo banco", async () => {
    const { error } = await service.from("method_subcriteria").insert({
      code: "ACESSO_LOCALIZACAO",
      group: "ACESSO",
      name: "Duplicata",
      description: "Não deve entrar.",
      display_order: 98,
    });
    expect(error?.message ?? "").toMatch(/duplicate|unique/i);
  });

  // -------------------------------------------------------------------------
  // Escrita
  // -------------------------------------------------------------------------

  it("o Case aceita uma classificação válida e a completude anda sozinha", async () => {
    const { caseId } = await casoNovo();

    const vazio = await loadCasePriorityMap(service, caseId);
    expect(vazio.completion.status).toBe("NOT_STARTED");

    const parcial = await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCALIZACAO", importance: "MUITO_IMPORTANTE" },
      { subcriterionCode: "MODELO_COMUNICACAO", importance: "RELEVANTE" },
    ]);

    expect(parcial.completion.status).toBe("IN_PROGRESS");
    expect(parcial.completion.completed).toBe(2);
    expect(parcial.items).toContainEqual({
      subcriterionCode: "ACESSO_LOCALIZACAO",
      importance: "MUITO_IMPORTANTE",
    });
  });

  it("salvar de novo substitui, nunca duplica — idempotente", async () => {
    const { caseId } = await casoNovo();

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCALIZACAO", importance: "MUITO_IMPORTANTE" },
    ]);
    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCALIZACAO", importance: "MUITO_IMPORTANTE" },
    ]);
    const depois = await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCALIZACAO", importance: "POUCO_IMPORTANTE" },
    ]);

    const doCriterio = depois.items.filter((i) => i.subcriterionCode === "ACESSO_LOCALIZACAO");
    expect(doCriterio, "uma linha, não três").toHaveLength(1);
    expect(doCriterio[0]!.importance).toBe("POUCO_IMPORTANTE");
  });

  it("o banco recusa duas classificações do mesmo subcritério no mesmo Case", async () => {
    const { caseId } = await casoNovo();
    const catalogo = await listSubcriterionCatalog(service);
    const alvo = catalogo.find((e) => e.code === "ACESSO_MODALIDADE")!;

    await service.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: alvo.id,
      importance: "IMPORTANTE",
    });
    const { error } = await service.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: alvo.id,
      importance: "RELEVANTE",
    });

    expect(error?.message ?? "").toMatch(/duplicate|unique/i);
  });

  it("o banco recusa nível fora do enum", async () => {
    const { caseId } = await casoNovo();
    const catalogo = await listSubcriterionCatalog(service);

    const { error } = await service.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: catalogo[0]!.id,
      importance: "MUITISSIMO_IMPORTANTE",
    });
    expect(error, "enum precisa recusar").not.toBeNull();
  });

  it("Case inexistente é recusado", async () => {
    const catalogo = await listSubcriterionCatalog(service);
    const { error } = await service.from("case_priority_map").insert({
      case_id: "00000000-0000-0000-0000-000000000000",
      subcriterion_id: catalogo[0]!.id,
      importance: "IMPORTANTE",
    });
    expect(error?.message ?? "").toMatch(/foreign key|violates/i);
  });

  it("subcritério inexistente é recusado", async () => {
    const { caseId } = await casoNovo();
    const { error } = await service.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: "00000000-0000-0000-0000-000000000000",
      importance: "IMPORTANTE",
    });

    // Recusado pelo gatilho de circulação, que roda ANTES da checagem de FK:
    // um id que não existe também não está em circulação. A FK continua lá
    // como segunda trava — quem barra primeiro não muda o resultado.
    expect(error, "insert precisa ser recusado").not.toBeNull();
    expect(error!.message).toMatch(/fora de circulacao|foreign key|violates/i);
  });

  it("subcritério fora de circulação não recebe classificação nova", async () => {
    const { caseId } = await casoNovo();
    const catalogo = await listSubcriterionCatalog(service);
    const alvo = catalogo.find((e) => e.code === "HISTORICO_ENSINO_E_PESQUISA")!;

    await service.from("method_subcriteria").update({ active: false }).eq("id", alvo.id);
    try {
      const { error } = await service.from("case_priority_map").insert({
        case_id: caseId,
        subcriterion_id: alvo.id,
        importance: "IMPORTANTE",
      });
      expect(error?.message ?? "").toMatch(/fora de circulacao/i);
    } finally {
      await service.from("method_subcriteria").update({ active: true }).eq("id", alvo.id);
    }
  });

  it("retirar um subcritério de circulação não apaga o que os Cases declararam", async () => {
    const { caseId } = await casoNovo();
    const catalogo = await listSubcriterionCatalog(service);
    const alvo = catalogo.find((e) => e.code === "HISTORICO_PRODUCAO_ACADEMICA")!;

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: alvo.code, importance: "IMPORTANTE" },
    ]);

    await service.from("method_subcriteria").update({ active: false }).eq("id", alvo.id);
    try {
      const mapa = await loadCasePriorityMap(service, caseId);
      expect(
        mapa.items.some((i) => i.subcriterionCode === alvo.code),
        "o histórico do Case permanece",
      ).toBe(true);
      expect(mapa.completion.pendingCodes).not.toContain(alvo.code);

      // E o catálogo não pode ser apagado por baixo de um Case que o referencia.
      const { error } = await service.from("method_subcriteria").delete().eq("id", alvo.id);
      expect(error?.message ?? "", "ON DELETE RESTRICT").toMatch(/foreign key|violates/i);
    } finally {
      await service.from("method_subcriteria").update({ active: true }).eq("id", alvo.id);
    }
  });

  // -------------------------------------------------------------------------
  // Isolamento
  // -------------------------------------------------------------------------

  it("o Curador do Case escreve; outro Curador não alcança", async () => {
    const { caseId, curador } = await casoNovo();
    const catalogo = await listSubcriterionCatalog(service);
    const alvo = catalogo.find((e) => e.code === "ACESSO_DISPONIBILIDADE")!;

    const { error: doDono } = await curador.client.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: alvo.id,
      importance: "IMPORTANTE",
    });
    expect(doDono, "quem conduz o Case escreve").toBeNull();

    const outro = await entrarComo("concierge");
    const { error: deTerceiro } = await outro.client.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: catalogo.find((e) => e.code === "ACESSO_PRAZO_PARA_CONSULTA")!.id,
      importance: "IMPORTANTE",
    });
    expect(deTerceiro, "quem não conduz não escreve").not.toBeNull();
  });

  it("o catálogo é vocabulário: quem está autenticado lê, ninguém escreve pela aplicação", async () => {
    const curador = await entrarComo("curador_medico");

    const { data, error: erroLeitura } = await curador.client
      .from("method_subcriteria")
      .select("code")
      .limit(5);
    expect(erroLeitura).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);

    const { error: erroEscrita } = await curador.client
      .from("method_subcriteria")
      .update({ name: "Renomeado pelo Curador" })
      .eq("code", "ACESSO_LOCALIZACAO");
    expect(erroEscrita, "o Curador não renomeia critério").not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // Convivência com o modelo anterior
  // -------------------------------------------------------------------------

  it("o modelo anterior continua intacto e legível", async () => {
    for (const tabela of ["priority_profiles", "priority_weights", "priority_profile_filters", "cruzamento_weights"]) {
      const { error } = await service.from(tabela).select("*", { head: true, count: "exact" });
      expect(error, `${tabela} precisa continuar existindo`).toBeNull();
    }
  });
});
