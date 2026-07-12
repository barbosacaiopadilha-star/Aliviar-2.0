import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import {
  deliverFinalCuradoria,
  getFinalCuradoriaDeliveryForCase,
  getLatestFinalCuradoriaDeliveryForPatient,
} from "@/modules/concierge/delivery-repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import { submitHumanReview } from "@/modules/concierge/human-review-repository";
import { runAceExecution } from "@/modules/concierge/orchestrator";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

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

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("Última sprint do MVP — Entrega da Curadoria (P010, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  async function loginAs(role: string) {
    const account = accounts.find((a) => a.role === role)!;
    const client = createClient(url, anonKey);
    await client.auth.signInWithPassword({ email: account.email, password: account.password });
    const {
      data: { user },
    } = await client.auth.getUser();
    return { client, userId: user!.id };
  }

  async function seedPresentableProfessional(adminClient: ReturnType<typeof createAdminSupabaseClient>, adminUserId: string) {
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

    return professional.id;
  }

  // Caso completo, com Shortlist COMPOSED e uma decisão VALIDATED — o
  // ponto de partida real para entregar a Curadoria.
  async function createValidatedCase(assignCuratorId?: string) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("entrega") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Entrega" }, admin.userId);

    const patientClient = createClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(patientClient, draft.id, draft.revision, { motivo: "Buscando apoio para ansiedade recorrente." }, "motivo");
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, assignCuratorId, admin.userId);
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    await seedPresentableProfessional(adminClient, admin.userId);
    await seedPresentableProfessional(adminClient, admin.userId);
    await seedPresentableProfessional(adminClient, admin.userId);

    const execution = await runAceExecution({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(execution.outcome).toBe("completed");

    const review = await submitHumanReview(admin.client, {
      caseId: created.id,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada às necessidades relatadas na história.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });
    expect(review.outcome).toBe("recorded");

    return { admin, caseId: created.id, patientProfileId: patientAccount.profileId, patientClient };
  }

  it("entrega a Curadoria: persiste a entrega, move o Caso para DELIVERED e o paciente consegue ler a própria entrega", async () => {
    const { admin, caseId, patientProfileId, patientClient } = await createValidatedCase();

    const result = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    expect(result.outcome).toBe("delivered");
    expect(result.outcome === "delivered" && result.delivery.providerPresentations).toHaveLength(3);

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("DELIVERED");

    const patientDelivery = await getLatestFinalCuradoriaDeliveryForPatient(patientClient, patientProfileId);
    expect(patientDelivery?.caseId).toBe(caseId);
    expect(patientDelivery?.providerPresentations).toHaveLength(3);
  });

  it("uma segunda entrega para o mesmo caso é rejeitada", async () => {
    const { admin, caseId } = await createValidatedCase();

    const first = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(first.outcome).toBe("delivered");

    const second = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(second.outcome).toBe("error");
  });

  it("rejeita entregar um caso sem decisão humana validada", async () => {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("sem-revisao") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Sem Revisão" }, admin.userId);
    const patientClient = createClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, draft.revision);
    const created = await createCase(admin.client, draft.id, undefined, admin.userId);

    const result = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    expect(result.outcome).toBe("error");
  });

  it("a entrega persistida é imutável — sem caminho de update/delete", async () => {
    const { admin, caseId } = await createValidatedCase();

    await deliverFinalCuradoria({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    const delivery = await getFinalCuradoriaDeliveryForCase(admin.client, caseId);
    expect(delivery).not.toBeNull();

    const { error: updateError } = await admin.client
      .from("final_curadoria_deliveries")
      .update({ decision_summary: "adulterado" })
      .eq("id", delivery!.id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client.from("final_curadoria_deliveries").delete().eq("id", delivery!.id);
    expect(deleteError).not.toBeNull();
  });

  it("RLS: curador não atribuído ao caso não lê a entrega; paciente de outro caso também não", async () => {
    const curador = await loginAs("curador_medico");
    const { admin, caseId } = await createValidatedCase(); // não atribuído a este curador

    await deliverFinalCuradoria({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    const { data: curadorView } = await curador.client.from("final_curadoria_deliveries").select("id").eq("case_id", caseId);
    expect(curadorView ?? []).toHaveLength(0);

    const outroPaciente = await createValidatedCase();
    const { data: crossPatientView } = await outroPaciente.patientClient
      .from("final_curadoria_deliveries")
      .select("id")
      .eq("case_id", caseId);
    expect(crossPatientView ?? []).toHaveLength(0);
  });

  it("RLS: curador atribuído ao caso lê a entrega", async () => {
    const curador = await loginAs("curador_medico");
    const { admin, caseId } = await createValidatedCase(curador.userId);

    await deliverFinalCuradoria({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });

    const { data } = await curador.client.from("final_curadoria_deliveries").select("id").eq("case_id", caseId);
    expect(data ?? []).toHaveLength(1);
  });
});
