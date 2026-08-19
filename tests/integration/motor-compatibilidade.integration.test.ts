import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SUBCRITERION_CATALOG } from "@/modules/curadoria/mapa-prioridades";
import { apenasConceitosDoMotor } from "@/modules/curadoria/participacao-no-motor";
import { createCase } from "@/modules/cases/repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { getOrCreateActiveStory, submitStory } from "@/modules/story/repository";
import { savePriorityMapEntries } from "@/modules/curadoria/mapa-prioridades-repository";
import { saveProfessionalMapEntries } from "@/modules/curadoria/mapa-profissional-repository";
import {
  crossCaseWithProfessional,
  crossCaseWithProfessionals,
} from "@/modules/curadoria/motor-compatibilidade-repository";

import { createCuradoriaClient } from "./curadoria-client";
import { seedPublishedProfessional } from "./rede-fixture";

/**
 * ITEM 1.1 — o universo do Motor é o Catálogo MENOS os quatro conceitos com
 * `MOTOR_PARTICIPATION = NUNCA`. Os oráculos abaixo fixavam 29 e 28 porque,
 * até a guarda existir, o Motor cruzava todos (achado P15). Derivado, nunca
 * literal: conceito que mude de participação move o número junto.
 */
const NO_MOTOR = apenasConceitosDoMotor(SUBCRITERION_CATALOG.map((s) => s.code)).length;

/**
 * MOTOR DE COMPATIBILIDADE — cruzamento sobre o banco real.
 *
 * O que se prova aqui não é a matriz (isso está no teste de domínio): é que
 * os dois mapas se encontram pelo MESMO subcritério, vindos de duas tabelas
 * diferentes, sem nenhuma comparação por nome.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

let semente = 0;
const unico = (prefixo: string) => `${prefixo}-${Date.now()}-${(semente += 1)}`;

describe("Motor de Compatibilidade (Supabase local)", () => {
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

  async function casoNovo() {
    const admin = await entrarComo("administrador");
    const curador = await entrarComo("curador_medico");
    const email = `${unico("motor")}@aliviar-conexao.local`;
    const paciente = await createPatientAccount(
      service,
      admin.client,
      { email, displayName: "Paciente Motor" },
      admin.userId,
    );
    const pacienteClient = createCuradoriaClient(url, anonKey);
    await pacienteClient.auth.signInWithPassword({ email, password: paciente.password });
    const rascunho = await getOrCreateActiveStory(pacienteClient, paciente.profileId);
    const historia = await submitStory(pacienteClient, rascunho.id, rascunho.revision);
    const kase = await createCase(admin.client, historia.id, curador.userId, admin.userId);
    return kase.id;
  }

  it("cruza os dois mapas pelo mesmo subcritério, vindos de tabelas diferentes", async () => {
    const caseId = await casoNovo();
    const profissional = await seedPublishedProfessional(service, adminUserId, "Motor");

    // Códigos do Catálogo 1.0.0 vigente (a virada aposentou
    // EXPERIENCIA_CASOS_SEMELHANTES→EXPERIENCIA_NO_TIPO_DE_CASO e
    // ACESSO_LOCALIZACAO→ACESSO_LOCAL_DE_ATENDIMENTO).
    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" },
      { subcriterionCode: "EXPERIENCIA_NO_TIPO_DE_CASO", importance: "RELEVANTE" },
      { subcriterionCode: "CONTINUIDADE_POS_PROCEDIMENTO", importance: "IMPORTANTE" },
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", importance: "NAO_INFLUENCIA" },
    ]);

    await saveProfessionalMapEntries(service, profissional, [
      { subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" },
      { subcriterionCode: "EXPERIENCIA_NO_TIPO_DE_CASO", status: "CONFIRMADO" },
      { subcriterionCode: "CONTINUIDADE_POS_PROCEDIMENTO", status: "NAO_INFORMADO" },
      { subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", status: "CONFIRMADO" },
    ], adminUserId);

    const leitura = await crossCaseWithProfessional(service, caseId, profissional);

    const porCodigo = new Map(leitura.rows.map((r) => [r.subcriterionCode, r.result]));
    expect(porCodigo.get("FORMACAO_RESIDENCIA")).toBe("ALTA_COMPATIBILIDADE");
    expect(porCodigo.get("EXPERIENCIA_NO_TIPO_DE_CASO")).toBe("MEDIA_COMPATIBILIDADE");
    expect(porCodigo.get("CONTINUIDADE_POS_PROCEDIMENTO")).toBe("LACUNA_DE_INFORMACAO");
    expect(porCodigo.get("ACESSO_LOCAL_DE_ATENDIMENTO")).toBe("NAO_RELEVANTE");

    expect(leitura.summary).toMatchObject({
      totalSubcriteria: 4,
      highCompatibility: 1,
      mediumCompatibility: 1,
      informationGaps: 1,
      notRelevant: 1,
    });
  });

  it("profissional sem mapa nenhum não é eliminado — vira lacuna", async () => {
    const caseId = await casoNovo();
    const profissional = await seedPublishedProfessional(service, adminUserId, "Motor sem mapa");

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "MODELO_COMUNICACAO", importance: "MUITO_IMPORTANTE" },
    ]);

    const leitura = await crossCaseWithProfessional(service, caseId, profissional);
    expect(leitura.rows).toHaveLength(1);
    expect(leitura.rows[0]!.result).toBe("LACUNA_DE_INFORMACAO");
    expect(leitura.rows[0]!.status, "ausência de registro, não NAO_INFORMADO").toBeNull();
    expect(leitura.summary.gapsWithoutAnyRecord).toBe(1);
  });

  it("Case sem Mapa de Prioridades não produz cruzamento", async () => {
    const caseId = await casoNovo();
    const profissional = await seedPublishedProfessional(service, adminUserId, "Motor sem case");

    await saveProfessionalMapEntries(service, profissional, [
      { subcriterionCode: "MODELO_COMUNICACAO", status: "CONFIRMADO" },
    ], adminUserId);

    const leitura = await crossCaseWithProfessional(service, caseId, profissional);
    expect(leitura.rows).toHaveLength(0);
    expect(leitura.summary.totalSubcriteria).toBe(0);
    // ITEM 1.1: o universo do Motor é o Catálogo MENOS os quatro NUNCA.
    expect(leitura.summary.notDeclaredByCase).toBe(NO_MOTOR);
  });

  it("subcritério fora de circulação não entra no cruzamento — o Motor fala só o vocabulário vigente", async () => {
    // A aposentadoria que este teste antes simulava (desativar um código no
    // meio do teste) aconteceu de verdade na virada do Catálogo 1.0.0 — e o
    // catalog_guard (migration 20260802165000) passou a proibir exatamente
    // aquele toque avulso no catálogo. A prova agora usa o aposentado REAL:
    // ele não entra em mapa novo por nenhuma das portas, e o cruzamento só
    // enxerga o vigente.
    const caseId = await casoNovo();
    const profissional = await seedPublishedProfessional(service, adminUserId, "Motor catalogo");

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" },
    ]);
    await saveProfessionalMapEntries(service, profissional, [
      { subcriterionCode: "MODELO_COMUNICACAO", status: "CONFIRMADO" },
    ], adminUserId);

    // Nenhum dos dois lados aceita o aposentado.
    await expect(
      savePriorityMapEntries(service, caseId, [
        { subcriterionCode: "HISTORICO_ENSINO_E_PESQUISA", importance: "IMPORTANTE" },
      ]),
    ).rejects.toThrow(/saiu de circulação/);
    await expect(
      saveProfessionalMapEntries(service, profissional, [
        { subcriterionCode: "HISTORICO_ENSINO_E_PESQUISA", status: "CONFIRMADO" },
      ], adminUserId),
    ).rejects.toThrow(/saiu de circulação/);

    const leitura = await crossCaseWithProfessional(service, caseId, profissional);
    expect(leitura.rows).toHaveLength(1);
    expect(leitura.rows[0]!.subcriterionCode).toBe("MODELO_COMUNICACAO");
    expect(leitura.summary.totalSubcriteria).toBe(1);
    // Universo do Motor − 1 declarado: aposentados e NUNCA não contam.
    expect(leitura.summary.notDeclaredByCase).toBe(NO_MOTOR - 1);
  });

  it("vários profissionais saem na ordem de entrada — o Motor não ordena por resultado", async () => {
    const caseId = await casoNovo();
    const fraco = await seedPublishedProfessional(service, adminUserId, "Motor A");
    const forte = await seedPublishedProfessional(service, adminUserId, "Motor B");

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "FORMACAO_RESIDENCIA", importance: "MUITO_IMPORTANTE" },
    ]);
    await saveProfessionalMapEntries(service, forte, [
      { subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" },
    ], adminUserId);
    await saveProfessionalMapEntries(service, fraco, [
      { subcriterionCode: "FORMACAO_RESIDENCIA", status: "NAO_CONFIRMADO" },
    ], adminUserId);

    const leituras = await crossCaseWithProfessionals(service, caseId, [fraco, forte]);

    expect(leituras.map((l) => l.professionalProfileId)).toEqual([fraco, forte]);
    expect(leituras[0]!.rows[0]!.result).toBe("MEDIA_COMPATIBILIDADE");
    expect(leituras[1]!.rows[0]!.result).toBe("ALTA_COMPATIBILIDADE");
  });

  it("é idempotente contra o banco — duas leituras, resultado idêntico", async () => {
    const caseId = await casoNovo();
    const profissional = await seedPublishedProfessional(service, adminUserId, "Motor idem");

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "ACESSO_DISPONIBILIDADE", importance: "IMPORTANTE" },
      { subcriterionCode: "MODELO_ALTERNATIVAS", importance: "POUCO_IMPORTANTE" },
    ]);
    await saveProfessionalMapEntries(service, profissional, [
      { subcriterionCode: "ACESSO_DISPONIBILIDADE", status: "NAO_CONFIRMADO" },
    ], adminUserId);

    const primeira = await crossCaseWithProfessional(service, caseId, profissional);
    const segunda = await crossCaseWithProfessional(service, caseId, profissional);
    expect(segunda).toEqual(primeira);
  });

  it("o Motor não escreve nada — cruzar é leitura", async () => {
    const caseId = await casoNovo();
    const profissional = await seedPublishedProfessional(service, adminUserId, "Motor leitura");

    await savePriorityMapEntries(service, caseId, [
      { subcriterionCode: "MODELO_COMUNICACAO", importance: "IMPORTANTE" },
    ]);

    const antes = await service
      .from("case_priority_map")
      .select("*", { count: "exact", head: true })
      .eq("case_id", caseId);
    const antesProf = await service
      .from("professional_subcriterion_map")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", profissional);

    await crossCaseWithProfessional(service, caseId, profissional);

    const depois = await service
      .from("case_priority_map")
      .select("*", { count: "exact", head: true })
      .eq("case_id", caseId);
    const depoisProf = await service
      .from("professional_subcriterion_map")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", profissional);

    expect(depois.count).toBe(antes.count);
    expect(depoisProf.count).toBe(antesProf.count);
  });
});
