// HISTÓRICO / OBSERVABILIDADE — Entrega Final da Curadoria (P010).
//
// Esta suíte NÃO valida o fluxo operacional atual. A ADR-035 removeu do ACE o
// papel de motor de Curadoria e a ADR-036 descontinuou as superfícies que
// acionavam P008/P009/P010: nenhum Caso novo produz entrega por este caminho.
// O que permanece — e o que estes testes observam — é o dado histórico já
// persistido, que as duas ADRs mandam preservar íntegro e legível.
//
// Por isso nada aqui chama `runAceExecution`, `submitHumanReview`,
// `deliverFinalCuradoria` ou `FakeAceLanguageModel`. O estado histórico é
// inserido diretamente por `seedLegacyFinalCuradoriaDelivery`, com payloads
// construídos pelos contratos e protocolos reais (P007/P008/P009/P010) — ver
// tests/integration/legacy-ace-chain-fixture.ts.
//
// OBSOLETO PELA ADR-036 — três testes saíram desta suíte e não foram
// migrados, porque sua única evidência era o valor de retorno do escritor
// `deliverFinalCuradoria`, e não um resíduo histórico observável:
//   - "uma segunda entrega para o mesmo caso é rejeitada": o invariante que
//     ele protegia sobrevive abaixo, re-expresso contra o índice único
//     `final_curadoria_deliveries_case_id_key` (A5);
//   - "rejeita entregar um caso sem decisão humana validada": guard de
//     pré-condição do escritor; não existe estado histórico que expresse uma
//     entrega que não aconteceu;
//   - "GO LIVE: falha do fornecedor na entrega nunca cai no modelo fake":
//     tratamento de falha do modelo de linguagem dentro do escritor, sem
//     nenhum resíduo persistido.
// Recriá-los com fixture significaria reintroduzir o escritor — exatamente o
// acoplamento que esta migração existe para remover.

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import {
  getFinalCuradoriaDeliveryForCase,
  getLatestFinalCuradoriaDeliveryForPatient,
} from "@/modules/concierge/delivery-repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import {
  cleanupLegacyAceChain,
  seedLegacyFinalCuradoriaDelivery,
  type LegacyFinalCuradoriaDeliveryFixture,
} from "./legacy-ace-chain-fixture";

type TestAccount = { role: string; email: string; password: string };

const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");

function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) {
    throw new Error(
      "test-users.local.json não existe. Rode `npm run bootstrap:test-users` antes dos testes de integração.",
    );
  }
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const PATIENT_GOAL = "Buscando apoio para ansiedade recorrente.";

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("Entrega da Curadoria — HISTÓRICO / OBSERVABILIDADE (P010, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  // Cada createPatientAccount() cria uma conta real (auth.users + profiles via
  // handle_new_user + user_roles). Junto com ela, cada Caso arrasta
  // patient_stories, cases e as tabelas derivadas por case_id. Rastreamos só o
  // profileId (= auth.users.id): o resto sai na ordem validada abaixo, para
  // não esbarrar em cases.source_story_id (NO ACTION contra patient_stories)
  // nem no trigger log_user_role_change (exige profiles ainda existente
  // quando o DELETE de user_roles dispara).
  let createdPatientProfileIds: string[] = [];
  let createdProfessionalIds: string[] = [];
  // A cadeia histórica é removida explicitamente, nunca por cascade: as FKs de
  // human_review_results e final_curadoria_deliveries para execução e
  // artefatos não têm `on delete cascade`.
  let createdFixtures: LegacyFinalCuradoriaDeliveryFixture[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();

    const cleanupFailures: string[] = [];
    for (const fixture of createdFixtures) {
      try {
        await cleanupLegacyAceChain(adminClient, fixture);
      } catch (error) {
        cleanupFailures.push((error as Error).message);
      }
    }
    createdFixtures = [];

    // Pacientes e Cases primeiro, profissionais depois: enquanto o Case vive,
    // FKs em tabelas derivadas impedem a remoção do profissional.
    if (createdPatientProfileIds.length > 0) {
      await adminClient.from("cases").delete().in("patient_profile_id", createdPatientProfileIds);
      await adminClient.from("patient_stories").delete().in("profile_id", createdPatientProfileIds);
      await adminClient.from("patient_profiles").delete().in("profile_id", createdPatientProfileIds);
      await adminClient.from("user_roles").delete().in("profile_id", createdPatientProfileIds);
      for (const profileId of createdPatientProfileIds) {
        await adminClient.auth.admin.deleteUser(profileId);
      }
      createdPatientProfileIds = [];
    }

    if (createdProfessionalIds.length > 0) {
      await adminClient
        .from("professional_competency_areas")
        .delete()
        .in("professional_profile_id", createdProfessionalIds);
      const { error } = await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
      // Falha silenciosa aqui foi a origem de um vazamento antigo de perfis
      // entre rodadas. Agora ela aparece.
      if (error) {
        throw new Error(`teardown: profissionais não removidos — ${error.message}`);
      }
      createdProfessionalIds = [];
    }

    if (cleanupFailures.length > 0) {
      throw new Error(`teardown: cadeia histórica não removida — ${cleanupFailures.join("; ")}`);
    }
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createCuradoriaClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function seedPresentableProfessional(
    adminClient: ReturnType<typeof createAdminSupabaseClient>,
    adminUserId: string,
  ) {
    const professional = await createProfessionalProfile(adminClient, {
      displayName: `Profissional Entrega ${unique("p")}`,
      professionalIdentifier: unique("ident"),
      crm: null,
      crmUf: null,
      professionalSummary: "Profissional com experiência em acolhimento e escuta ativa.",
      institutionName: null,
      createdBy: adminUserId,
    });

    await adminClient
      .from("professional_profiles")
      .update({
        experience_level: "experiente",
        intake_approach: "ambos",
        offers_continuous_care: true,
        availability_window: "flexible",
        practical_considerations: ["Atende também por telemedicina."],
      })
      .eq("id", professional.id);

    await adminClient
      .from("professional_competency_areas")
      .insert({ professional_profile_id: professional.id, domain: "nao_determinado", focus: "avaliacao" });

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  // Caso histórico já entregue: paciente real, história real, três
  // profissionais reais e a cadeia ACE completa inserida pela fixture. Os
  // profissionais são exatamente os três que atravessam a cadeia — o pool
  // global de professional_profiles não influencia mais o resultado, porque
  // nenhum protocolo de seleção roda aqui.
  async function createDeliveredHistoricalCase(assignCuratorId?: string) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("entrega") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente Entrega" },
      admin.userId,
    );
    createdPatientProfileIds.push(patientAccount.profileId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(patientClient, draft.id, draft.revision, { motivo: PATIENT_GOAL }, "motivo");
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, assignCuratorId, admin.userId);
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    const providerProfileIds = [
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
      await seedPresentableProfessional(adminClient, admin.userId),
    ];

    const fixture = await seedLegacyFinalCuradoriaDelivery({
      service: adminClient,
      caseId: created.id,
      patientProfileId: patientAccount.profileId,
      actorId: admin.userId,
      providerProfileIds,
      patientGoal: PATIENT_GOAL,
    });
    createdFixtures.push(fixture);

    return {
      admin,
      adminClient,
      caseId: created.id,
      patientProfileId: patientAccount.profileId,
      patientClient,
      fixture,
    };
  }

  // A1
  it("a entrega histórica é legível: três profissionais, Caso em DELIVERED e o paciente lê a própria entrega", async () => {
    const { admin, caseId, patientProfileId, patientClient, fixture } = await createDeliveredHistoricalCase();

    const delivery = await getFinalCuradoriaDeliveryForCase(admin.client, caseId);
    expect(delivery).not.toBeNull();
    expect(delivery!.caseId).toBe(caseId);
    expect(delivery!.providerPresentations).toHaveLength(3);
    // O invariante que atravessa toda a cadeia histórica: os mesmos três
    // profissionais, na mesma ordem neutra, da CompatibilityMatrix até a
    // apresentação entregue ao paciente.
    expect(delivery!.providerPresentations.map((presentation) => presentation.providerId)).toEqual(
      fixture.providerIds,
    );

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("DELIVERED");

    const patientDelivery = await getLatestFinalCuradoriaDeliveryForPatient(patientClient, patientProfileId);
    expect(patientDelivery?.caseId).toBe(caseId);
    expect(patientDelivery?.providerPresentations).toHaveLength(3);
  });

  // A2
  it("a entrega histórica é imutável — sem caminho de update/delete", async () => {
    const { admin, caseId } = await createDeliveredHistoricalCase();

    const delivery = await getFinalCuradoriaDeliveryForCase(admin.client, caseId);
    expect(delivery).not.toBeNull();

    const { error: updateError } = await admin.client
      .from("final_curadoria_deliveries")
      .update({ decision_summary: "adulterado" })
      .eq("id", delivery!.id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client
      .from("final_curadoria_deliveries")
      .delete()
      .eq("id", delivery!.id);
    expect(deleteError).not.toBeNull();
  });

  // A3
  it("RLS: curador não atribuído ao caso não lê a entrega; paciente de outro caso também não", async () => {
    const curador = await loginAs("curador_medico");
    const { caseId } = await createDeliveredHistoricalCase(); // não atribuído a este curador

    const { data: curadorView } = await curador.client
      .from("final_curadoria_deliveries")
      .select("id")
      .eq("case_id", caseId);
    expect(curadorView ?? []).toHaveLength(0);

    const outroPaciente = await createDeliveredHistoricalCase();
    const { data: crossPatientView } = await outroPaciente.patientClient
      .from("final_curadoria_deliveries")
      .select("id")
      .eq("case_id", caseId);
    expect(crossPatientView ?? []).toHaveLength(0);
  });

  // A4
  it("RLS: curador atribuído ao caso lê a entrega", async () => {
    const curador = await loginAs("curador_medico");
    const { caseId } = await createDeliveredHistoricalCase(curador.userId);

    const { data } = await curador.client.from("final_curadoria_deliveries").select("id").eq("case_id", caseId);
    expect(data ?? []).toHaveLength(1);
  });

  // A5 — substitui, sem o escritor, o antigo "uma segunda entrega é
  // rejeitada": o que garantia aquele comportamento nunca foi o código do
  // P010, e sim o índice único por Caso. É ele que é exercido aqui.
  it("no máximo uma entrega histórica por Caso — o índice único recusa uma segunda linha", async () => {
    const { adminClient, caseId, fixture } = await createDeliveredHistoricalCase();

    const { data: existing, error: readError } = await adminClient
      .from("final_curadoria_deliveries")
      .select("*")
      .eq("id", fixture.finalDeliveryId)
      .single();
    expect(readError).toBeNull();

    // Segunda linha íntegra em tudo, exceto no que o índice protege: mesmo
    // case_id.
    const duplicate: Record<string, unknown> = { ...(existing as Record<string, unknown>), id: randomUUID() };
    delete duplicate.created_at;
    const { error: insertError } = await adminClient.from("final_curadoria_deliveries").insert(duplicate);
    expect(insertError).not.toBeNull();
    expect(insertError!.code).toBe("23505");

    const { data: rows } = await adminClient.from("final_curadoria_deliveries").select("id").eq("case_id", caseId);
    expect(rows ?? []).toHaveLength(1);
    expect(rows![0]!.id).toBe(fixture.finalDeliveryId);
  });
});
