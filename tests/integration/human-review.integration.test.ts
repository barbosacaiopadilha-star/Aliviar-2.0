import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import { listHumanReviewResultsForCase, submitHumanReview } from "@/modules/concierge/human-review-repository";
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

describe("Fase Beta / Sprint P009 — Human Review (Supabase local)", () => {
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

  async function seedEligibleProfessional(adminClient: ReturnType<typeof createAdminSupabaseClient>, adminUserId: string) {
    const professional = await createProfessionalProfile(adminClient, {
      displayName: `Profissional Review ${unique("p")}`,
      professionalIdentifier: unique("ident"),
      crm: null,
      crmUf: null,
      professionalSummary: null,
      institutionName: null,
      createdBy: adminUserId,
    });

    await adminClient
      .from("professional_profiles")
      .update({ experience_level: "experiente", intake_approach: "ambos", offers_continuous_care: true, availability_window: "flexible" })
      .eq("id", professional.id);

    await adminClient
      .from("professional_competency_areas")
      .insert({ professional_profile_id: professional.id, domain: "nao_determinado", focus: "avaliacao" });

    return professional.id;
  }

  // Cria um Caso, roda P001->P008 com 3 profissionais elegíveis (Shortlist
  // COMPOSED garantida) e deixa o Caso em HUMAN_REVIEW — o ponto de partida
  // real para todo teste desta sprint.
  async function createCaseInHumanReview(assignCuratorId?: string) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("review") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Review" }, admin.userId);

    const patientClient = createClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(patientClient, draft.id, draft.revision, { motivo: "Buscando apoio para dor crônica." }, "motivo");
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, assignCuratorId, admin.userId);
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);
    await seedEligibleProfessional(adminClient, admin.userId);

    const result = await runAceExecution({
      supabase: admin.client,
      caseId: created.id,
      actorId: admin.userId,
      languageModel: new FakeAceLanguageModel(),
    });
    expect(result.outcome).toBe("completed");

    return { admin, caseId: created.id };
  }

  it("APPROVE em uma Shortlist COMPOSED gera reviewStatus VALIDATED e mantém o Caso em HUMAN_REVIEW", async () => {
    const { admin, caseId } = await createCaseInHumanReview();

    const result = await submitHumanReview(admin.client, {
      caseId,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada às necessidades relatadas na história.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });

    expect(result.outcome).toBe("recorded");
    expect(result.outcome === "recorded" && result.result.reviewStatus).toBe("VALIDATED");

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("HUMAN_REVIEW");
  });

  it("REJECT registra reviewStatus REJECTED e move o Caso para WAITING_FOR_INFORMATION", async () => {
    const { admin, caseId } = await createCaseInHumanReview();

    const result = await submitHumanReview(admin.client, {
      caseId,
      reviewerId: admin.userId,
      reviewAction: "REJECT",
      reviewRationale: "Faltam informações essenciais sobre a preferência do paciente.",
      evidenceReferences: [],
      changes: [],
      returnToProtocol: "P006",
    });

    expect(result.outcome).toBe("recorded");
    expect(result.outcome === "recorded" && result.result.reviewStatus).toBe("REJECTED");
    expect(result.outcome === "recorded" && result.result.returnToProtocol).toBe("P006");

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("WAITING_FOR_INFORMATION");
  });

  it("uma segunda revisão após já existir uma decisão VALIDATED é rejeitada", async () => {
    const { admin, caseId } = await createCaseInHumanReview();

    await submitHumanReview(admin.client, {
      caseId,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada às necessidades relatadas na história.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });

    const second = await submitHumanReview(admin.client, {
      caseId,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Tentando revisar de novo.",
      evidenceReferences: ["algo"],
      changes: [],
      returnToProtocol: null,
    });

    expect(second.outcome).toBe("error");
  });

  it("rejeita revisar um caso que não está em HUMAN_REVIEW", async () => {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("review-invalido") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Estado Inválido" }, admin.userId);
    const patientClient = createClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, draft.revision);
    const created = await createCase(admin.client, draft.id, undefined, admin.userId);

    const result = await submitHumanReview(admin.client, {
      caseId: created.id,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Não deveria ser aceito.",
      evidenceReferences: ["algo"],
      changes: [],
      returnToProtocol: null,
    });

    expect(result.outcome).toBe("error");
  });

  it("ADJUST removendo um provider que não estava na Shortlist original é rejeitado pelo P009 (mensagem propagada)", async () => {
    const { admin, caseId } = await createCaseInHumanReview();

    const result = await submitHumanReview(admin.client, {
      caseId,
      reviewerId: admin.userId,
      reviewAction: "ADJUST",
      reviewRationale: "Tentando remover alguém que nunca esteve na composição.",
      evidenceReferences: ["algo"],
      changes: [
        {
          type: "removed",
          providerId: "00000000-0000-0000-0000-000000000000",
          rationale: "Não fazia parte.",
          evidenceReferences: ["nenhuma"],
        },
      ],
      returnToProtocol: null,
    });

    expect(result.outcome).toBe("error");
    expect(result.outcome === "error" && result.error).toMatch(/não fazia parte da composição original/);
  });

  it("a decisão persistida é imutável — sem caminho de update/delete", async () => {
    const { admin, caseId } = await createCaseInHumanReview();

    await submitHumanReview(admin.client, {
      caseId,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada às necessidades relatadas na história.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results).toHaveLength(1);

    const { error: updateError } = await admin.client
      .from("human_review_results")
      .update({ review_rationale: "adulterado" })
      .eq("id", results[0].id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client.from("human_review_results").delete().eq("id", results[0].id);
    expect(deleteError).not.toBeNull();
  });

  it("RLS: curador não lê nem registra decisões de um caso que não é seu", async () => {
    const curador = await loginAs("curador_medico");
    const { admin, caseId } = await createCaseInHumanReview(); // não atribuído ao curador

    await submitHumanReview(admin.client, {
      caseId,
      reviewerId: admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Composição adequada às necessidades relatadas na história.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });

    const { data } = await curador.client.from("human_review_results").select("id").eq("case_id", caseId);
    expect(data ?? []).toHaveLength(0);

    const curadorResult = await submitHumanReview(curador.client, {
      caseId,
      reviewerId: curador.userId,
      reviewAction: "REJECT",
      reviewRationale: "Não deveria conseguir.",
      evidenceReferences: [],
      changes: [],
      returnToProtocol: null,
    });
    // getCase via RLS não encontra o caso para este curador -> "Caso não encontrado".
    expect(curadorResult.outcome).toBe("error");
  });
});
