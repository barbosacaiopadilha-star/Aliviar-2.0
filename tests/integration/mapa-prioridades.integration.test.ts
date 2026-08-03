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

    // Catálogo 1.0.0 vigente (ADR-046/047): 28 conceitos ativos. O número é
    // explícito de propósito — este teste é guarda de universo, não espelho.
    expect(doBanco).toHaveLength(28);
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

  it("o catálogo só usa os grupos do vocabulário vigente — os seis do Modelo v1.0 mais VIABILIDADE", async () => {
    // Catálogo 1.0.0: VIABILIDADE entrou no Mapa (a pessoa declara grau), mas
    // continua fora da matriz do Motor (ADR-041). O universo segue fechado.
    const doBanco = await listSubcriterionCatalog(service);
    for (const entry of doBanco) {
      expect(SUBCRITERION_GROUPS, entry.code).toContain(entry.group);
    }
  });

  it("o banco recusa grupo fora do universo fechado", async () => {
    // Desde a migration 20260802165000 a recusa vem ANTES do CHECK de grupo:
    // o catalog_guard barra qualquer escrita de catálogo sem justificativa
    // registrada — inclusive da service key. O CHECK segue lá como segunda
    // trava; quem barra primeiro não muda o resultado.
    const { error } = await service.from("method_subcriteria").insert({
      code: unico("INVENTADO"),
      group: "historico_profissional",
      name: "Vocabulário paralelo",
      description: "Não deve entrar.",
      display_order: 99,
    });
    expect(error, "escrita avulsa no catálogo precisa ser recusada").not.toBeNull();
    expect(error!.message).toMatch(/justificativa|check/i);
  });

  it("código duplicado é recusado pelo banco", async () => {
    const { error } = await service.from("method_subcriteria").insert({
      code: "ACESSO_MODALIDADE",
      group: "ACESSO",
      name: "Duplicata",
      description: "Não deve entrar.",
      display_order: 98,
    });
    // O catalog_guard (migration 20260802165000) recusa o INSERT antes de a
    // UNIQUE ser consultada — o catálogo não aceita escrita sem rastro, e
    // duplicar código é um caso particular disso.
    expect(error?.message ?? "").toMatch(/justificativa|duplicate|unique/i);
  });

  // -------------------------------------------------------------------------
  // Escrita
  // -------------------------------------------------------------------------

  it("o Case aceita uma classificação válida e a completude anda sozinha", async () => {
    const { caseId } = await casoNovo();

    const vazio = await loadCasePriorityMap(service, caseId);
    expect(vazio.completion.status).toBe("NOT_STARTED");

    const parcial = await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "MUITO_IMPORTANTE" },
      { subcriterionCode: "MODELO_COMUNICACAO", importance: "RELEVANTE" },
    ]);

    expect(parcial.completion.status).toBe("IN_PROGRESS");
    expect(parcial.completion.completed).toBe(2);
    // 28 ativos no Catálogo 1.0.0 — a completude conta o vigente, nunca o legado.
    expect(parcial.completion.total).toBe(28);
    expect(parcial.items).toContainEqual({
      subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO",
      importance: "MUITO_IMPORTANTE",
    });
  });

  it("salvar de novo substitui, nunca duplica — idempotente", async () => {
    const { caseId } = await casoNovo();

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "MUITO_IMPORTANTE" },
    ]);
    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "MUITO_IMPORTANTE" },
    ]);
    const depois = await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "POUCO_IMPORTANTE" },
    ]);

    const doCriterio = depois.items.filter((i) => i.subcriterionCode === "ACESSO_LOCAL_DE_ATENDIMENTO");
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
    // A virada do Catálogo 1.0.0 aconteceu de verdade: ACESSO_LOCALIZACAO
    // saiu de circulação por migration. O teste não simula mais a
    // aposentadoria desativando um código vigente (o catalog_guard da
    // migration 20260802165000 proíbe justamente esse tipo de toque avulso
    // no catálogo) — ele prova contra o aposentado REAL.
    const { caseId } = await casoNovo();
    const catalogo = await listSubcriterionCatalog(service, { includeInactive: true });
    const alvo = catalogo.find((e) => e.code === "ACESSO_LOCALIZACAO")!;
    expect(alvo.active, "ACESSO_LOCALIZACAO está aposentado desde a virada").toBe(false);

    // A trava do banco…
    const { error } = await service.from("case_priority_map").insert({
      case_id: caseId,
      subcriterion_id: alvo.id,
      importance: "IMPORTANTE",
    });
    expect(error?.message ?? "").toMatch(/fora de circulacao/i);

    // …e a do domínio, que sabe explicar.
    await expect(
      savePriorityMapEntries(service, caseId, [
        { subcriterionCode: "ACESSO_LOCALIZACAO", importance: "IMPORTANTE" },
      ]),
    ).rejects.toThrow(/saiu de circulação/);
  });

  it("a aposentadoria não reescreve o Case: o legado segue legível, fora da pendência e indeletável", async () => {
    // Os seis códigos aposentados do 0.9.0 continuam no catálogo (histórico
    // legível), mas nenhum deles entra na completude de um Case novo — e
    // nenhum pode ser apagado: sair de circulação é active=false, nunca
    // DELETE (ADR-039 item 6, agora garantido pelo catalog_guard).
    const { caseId } = await casoNovo();
    const todos = await listSubcriterionCatalog(service, { includeInactive: true });
    const aposentados = todos.filter((e) => !e.active).map((e) => e.code);
    expect(aposentados.sort()).toEqual([
      "ACESSO_LOCALIZACAO",
      "EXPERIENCIA_CASOS_SEMELHANTES",
      "EXPERIENCIA_CONDICAO_OU_PROCEDIMENTO",
      "HISTORICO_ENSINO_E_PESQUISA",
      "HISTORICO_PRODUCAO_ACADEMICA",
      "HISTORICO_REGULARIDADE",
    ]);

    const mapa = await loadCasePriorityMap(service, caseId);
    expect(mapa.completion.total, "a completude conta só os 28 vigentes").toBe(28);
    for (const codigo of aposentados) {
      expect(mapa.completion.pendingCodes, codigo).not.toContain(codigo);
    }

    // O catálogo não pode ser apagado — nem o legado, nem por service key.
    const alvo = todos.find((e) => e.code === "HISTORICO_PRODUCAO_ACADEMICA")!;
    const { error } = await service.from("method_subcriteria").delete().eq("id", alvo.id);
    expect(error?.message ?? "", "catálogo não se apaga").toMatch(
      /nao se apaga|foreign key|violates/i,
    );
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
      .eq("code", "ACESSO_MODALIDADE");
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
