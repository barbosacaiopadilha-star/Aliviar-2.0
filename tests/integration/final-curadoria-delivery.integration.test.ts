import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import {
  deliverFinalCuradoria,
  getFinalCuradoriaDeliveryForCase,
  getLatestFinalCuradoriaDeliveryForPatient,
} from "@/modules/concierge/delivery-repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import { submitHumanReview } from "@/modules/concierge/human-review-repository";
import type { AceLanguageModel, AceLanguageModelRequest, AceLanguageModelResponse } from "@/modules/concierge/language-model";
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

  // Isolamento de dados entre testes (mesmo achado/correção já aplicado a
  // concierge.integration.test.ts e human-review.integration.test.ts):
  // professional_profiles/professional_competency_areas são um recurso
  // global no Supabase local, nunca escopado por Caso — sem isto, cada
  // teste seguinte herda os profissionais já criados pelos anteriores,
  // ultrapassando o total de 3 que a Shortlist assume e tornando-a
  // AMBIGUOUS_COMPOSITION.
  let createdProfessionalIds: string[] = [];

  // Cada createPatientAccount() cria uma conta real (auth.users + profiles
  // via handle_new_user + user_roles). Junto com ela, cada Caso criado a
  // partir dela arrasta patient_stories, cases, e (via cascade de case_id)
  // ace_executions/ace_artifacts/ace_execution_events/human_review_results/
  // case_notes/final_curadoria_deliveries. Rastreamos só o profileId
  // (= auth.users.id): o resto é limpo por cascade de FK, na ordem já
  // validada nesta sessão (Etapa 3 do Go-Live / Human Review) para não
  // esbarrar em cases.source_story_id (NO ACTION contra patient_stories)
  // nem no trigger log_user_role_change (exige profiles ainda existente
  // quando o DELETE de user_roles dispara).
  let createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();

    if (createdProfessionalIds.length > 0) {
      await adminClient.from("professional_competency_areas").delete().in("professional_profile_id", createdProfessionalIds);
      await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
      createdProfessionalIds = [];
    }

    if (createdPatientProfileIds.length > 0) {
      // cases cascade automaticamente para ace_executions, ace_artifacts,
      // ace_execution_events, human_review_results, case_notes e
      // final_curadoria_deliveries.
      await adminClient.from("cases").delete().in("patient_profile_id", createdPatientProfileIds);
      await adminClient.from("patient_stories").delete().in("profile_id", createdPatientProfileIds);
      await adminClient.from("patient_profiles").delete().in("profile_id", createdPatientProfileIds);
      await adminClient.from("user_roles").delete().in("profile_id", createdPatientProfileIds);
      for (const profileId of createdPatientProfileIds) {
        await adminClient.auth.admin.deleteUser(profileId);
      }
      createdPatientProfileIds = [];
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

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  // Caso completo, com Shortlist COMPOSED e uma decisão VALIDATED — o
  // ponto de partida real para entregar a Curadoria.
  async function createValidatedCase(assignCuratorId?: string) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("entrega") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Entrega" }, admin.userId);
    createdPatientProfileIds.push(patientAccount.profileId);

    const patientClient = createCuradoriaClient(url, anonKey);
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
    createdPatientProfileIds.push(patientAccount.profileId);
    const patientClient = createCuradoriaClient(url, anonKey);
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

    // Limpa os profissionais do primeiro Caso ANTES de criar o segundo,
    // dentro do mesmo teste — sem isso, os profissionais dos dois Casos se
    // somariam no pool global (nunca escopado por Caso) e a Shortlist do
    // segundo deixaria de ter exatamente 3 qualificados.
    const adminClient = createAdminSupabaseClient();
    await adminClient.from("professional_competency_areas").delete().in("professional_profile_id", createdProfessionalIds);
    await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
    createdProfessionalIds = [];

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

  it("GO LIVE: falha do fornecedor na entrega nunca cai no modelo fake — retorna erro sanitizado, nenhuma entrega persistida", async () => {
    const { admin, caseId } = await createValidatedCase();

    class FailingLanguageModel implements AceLanguageModel {
      async run<TInput, TOutput>(_request: AceLanguageModelRequest<TInput>): Promise<AceLanguageModelResponse<TOutput>> {
        return {
          output: null,
          metadata: {
            modelId: "test-failing-model",
            executedAt: new Date().toISOString(),
            status: "error",
            error: { code: "ACE_MODEL_UNAVAILABLE", message: "Detalhe interno do fornecedor — nunca deveria vazar." },
          },
        };
      }
    }

    const result = await deliverFinalCuradoria({
      supabase: admin.client,
      caseId,
      actorId: admin.userId,
      languageModel: new FailingLanguageModel(),
    });

    expect(result.outcome).toBe("error");
    expect(result.outcome === "error" && result.error).not.toContain("Detalhe interno do fornecedor");

    const { data } = await admin.client.from("final_curadoria_deliveries").select("id").eq("case_id", caseId);
    expect(data ?? []).toHaveLength(0);
  });
});
