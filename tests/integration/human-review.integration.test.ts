import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import { FakeAceLanguageModel } from "@/modules/concierge/fake-language-model";
import { getLatestArtifactByType, getLatestExecution } from "@/modules/concierge/execution-repository";
import { listHumanReviewResultsForCase, submitHumanReview } from "@/modules/concierge/human-review-repository";
import { runAceExecution } from "@/modules/concierge/orchestrator";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

// Mesmo texto de erro exposto pelos dois caminhos de human-review-repository.ts
// (pre-check em memória e colisão real via constraint de banco, 23505) —
// nunca deve divergir, nem vazar detalhe interno do Postgres.
const ALREADY_VALIDATED_MESSAGE = "Este caso já tem uma curadoria validada — não é possível registrar uma nova decisão.";

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

  // ADR-025: os testes de unicidade/concorrência abaixo criam Casos
  // completos (3 profissionais cada) em sequência — sem limpar entre eles,
  // o pool global ultrapassa 3 e a Shortlist deixa de ser COMPOSED
  // (AMBIGUOUS_COMPOSITION), quebrando os próprios testes desta garantia.
  // Registrado como afterEach próprio (Vitest aceita múltiplos por bloco)
  // para não depender do teardown mais amplo de contas/Casos.
  let createdProfessionalIds: string[] = [];

  afterEach(async () => {
    if (createdProfessionalIds.length === 0) {
      return;
    }
    const adminClient = createAdminSupabaseClient();
    await adminClient.from("professional_competency_areas").delete().in("professional_profile_id", createdProfessionalIds);
    await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
    createdProfessionalIds = [];
  });

  // Isolamento de dados entre testes: cada createPatientAccount() cria uma
  // conta real (auth.users + profiles via handle_new_user + user_roles) —
  // junto com ela, cada Caso criado a partir dela arrasta patient_stories,
  // cases, e (via cascade de case_id) ace_executions/ace_artifacts/
  // ace_execution_events/human_review_results/case_notes. Rastreamos só o
  // profileId (= auth.users.id): o resto é limpo por cascade de FK, na
  // ordem já validada nesta sessão (Etapa 3 do Go-Live) para não esbarrar
  // em cases.source_story_id (NO ACTION contra patient_stories) nem no
  // trigger log_user_role_change (exige profiles ainda existente quando o
  // DELETE de user_roles dispara).
  let createdPatientProfileIds: string[] = [];

  afterEach(async () => {
    if (createdPatientProfileIds.length === 0) {
      return;
    }
    const adminClient = createAdminSupabaseClient();
    // cases cascade automaticamente para ace_executions, ace_artifacts,
    // ace_execution_events, human_review_results e case_notes.
    await adminClient.from("cases").delete().in("patient_profile_id", createdPatientProfileIds);
    await adminClient.from("patient_stories").delete().in("profile_id", createdPatientProfileIds);
    await adminClient.from("patient_profiles").delete().in("profile_id", createdPatientProfileIds);
    await adminClient.from("user_roles").delete().in("profile_id", createdPatientProfileIds);
    for (const profileId of createdPatientProfileIds) {
      await adminClient.auth.admin.deleteUser(profileId);
    }
    createdPatientProfileIds = [];
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

    createdProfessionalIds.push(professional.id);
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
    createdPatientProfileIds.push(patientAccount.profileId);

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

  it("uma segunda revisão após já existir uma decisão VALIDATED é rejeitada pelo pre-check (mensagem pública sem detalhe interno)", async () => {
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
    expect(second.outcome === "error" && second.error).toBe(ALREADY_VALIDATED_MESSAGE);
    expect(second.outcome === "error" && second.error).not.toMatch(/23505|constraint|duplicate key|postgres/i);

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
  });

  it("ADR-024-style: colisão real na constraint de banco (23505) produz a mesma mensagem pública do pre-check", async () => {
    const { admin, caseId } = await createCaseInHumanReview();

    const execution = await getLatestExecution(admin.client, caseId);
    const shortlistArtifact = await getLatestArtifactByType(admin.client, caseId, "Shortlist");
    const compatibilityMatrixArtifact = await getLatestArtifactByType(admin.client, caseId, "CompatibilityMatrix");
    expect(execution).not.toBeNull();
    expect(shortlistArtifact).not.toBeNull();
    expect(compatibilityMatrixArtifact).not.toBeNull();

    const baseRow = {
      case_id: caseId,
      execution_id: execution!.id,
      reviewer_id: admin.userId,
      reviewed_at: new Date().toISOString(),
      review_action: "APPROVE" as const,
      original_shortlist_artifact_id: shortlistArtifact!.id,
      original_shortlist_artifact_version: shortlistArtifact!.version,
      compatibility_matrix_artifact_id: compatibilityMatrixArtifact!.id,
      compatibility_matrix_artifact_version: compatibilityMatrixArtifact!.version,
      approved_provider_ids: [],
      changes: [],
      review_rationale: "Linha inserida diretamente para provar a constraint de banco, sem passar por submitHumanReview.",
      evidence_references: [],
      return_to_protocol: null,
      method_version: "ACE-0.1",
      version: 1,
    };

    // Insere diretamente na tabela (não via submitHumanReview) — prova que a
    // proteção existe no PRÓPRIO banco, não só na camada de aplicação.
    const first = await admin.client
      .from("human_review_results")
      .insert({ id: randomUUID(), ...baseRow, review_status: "VALIDATED" })
      .select("id")
      .single();
    expect(first.error).toBeNull();

    const second = await admin.client
      .from("human_review_results")
      .insert({ id: randomUUID(), ...baseRow, review_status: "VALIDATED" })
      .select("id")
      .single();
    expect(second.error).not.toBeNull();
    expect(second.error?.code).toBe("23505");

    // Estados não bloqueados continuam permitidos livremente para o mesmo Caso
    // (o índice é parcial — só restringe review_status = 'VALIDATED').
    const rejected1 = await admin.client
      .from("human_review_results")
      .insert({ id: randomUUID(), ...baseRow, review_status: "REJECTED" })
      .select("id")
      .single();
    expect(rejected1.error).toBeNull();

    const rejected2 = await admin.client
      .from("human_review_results")
      .insert({ id: randomUUID(), ...baseRow, review_status: "REJECTED" })
      .select("id")
      .single();
    expect(rejected2.error).toBeNull();

    const infoRequested = await admin.client
      .from("human_review_results")
      .insert({ id: randomUUID(), ...baseRow, review_status: "INFORMATION_REQUESTED" })
      .select("id")
      .single();
    expect(infoRequested.error).toBeNull();

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
    expect(results.filter((r) => r.reviewStatus === "REJECTED")).toHaveLength(2);
    expect(results.filter((r) => r.reviewStatus === "INFORMATION_REQUESTED")).toHaveLength(1);
  });

  it("dois Casos diferentes têm seus próprios resultados VALIDATED, sem interferência mútua (índice é por case_id, não global)", async () => {
    const first = await createCaseInHumanReview();
    const firstResult = await submitHumanReview(first.admin.client, {
      caseId: first.caseId,
      reviewerId: first.admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Primeiro Caso.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });
    expect(firstResult.outcome).toBe("recorded");

    // Limpa os profissionais do primeiro Caso ANTES de criar o segundo,
    // dentro do mesmo teste — sem isso, os profissionais dos dois Casos se
    // somariam no pool global (nunca escopado por Caso) e a Shortlist do
    // segundo deixaria de ter exatamente 3 qualificados.
    const adminClient = createAdminSupabaseClient();
    await adminClient.from("professional_competency_areas").delete().in("professional_profile_id", createdProfessionalIds);
    await adminClient.from("professional_profiles").delete().in("id", createdProfessionalIds);
    createdProfessionalIds = [];

    const second = await createCaseInHumanReview();
    const secondResult = await submitHumanReview(second.admin.client, {
      caseId: second.caseId,
      reviewerId: second.admin.userId,
      reviewAction: "APPROVE",
      reviewRationale: "Segundo Caso, independente do primeiro.",
      evidenceReferences: ["Shortlist.compositionRationale"],
      changes: [],
      returnToProtocol: null,
    });
    expect(secondResult.outcome).toBe("recorded");

    const firstCaseResults = await listHumanReviewResultsForCase(first.admin.client, first.caseId);
    const secondCaseResults = await listHumanReviewResultsForCase(second.admin.client, second.caseId);
    expect(firstCaseResults.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
    expect(secondCaseResults.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
  });

  it("concorrência real: duas tentativas simultâneas de validar o mesmo Caso — exatamente uma sucede", async () => {
    const { admin, caseId } = await createCaseInHumanReview();

    const attempt = (rationale: string) =>
      submitHumanReview(admin.client, {
        caseId,
        reviewerId: admin.userId,
        reviewAction: "APPROVE",
        reviewRationale: rationale,
        evidenceReferences: ["Shortlist.compositionRationale"],
        changes: [],
        returnToProtocol: null,
      });

    // Promise.all dispara as duas chamadas verdadeiramente em paralelo — cada
    // uma faz seu próprio pre-check (SELECT) antes de qualquer uma ter
    // inserido, então ambas podem "ver" o caso como ainda não validado. Só a
    // constraint de banco decide qual das duas realmente vence.
    const [first, second] = await Promise.all([attempt("Primeira tentativa concorrente."), attempt("Segunda tentativa concorrente.")]);

    const outcomes = [first, second];
    const succeeded = outcomes.filter((o) => o.outcome === "recorded");
    const failed = outcomes.filter((o) => o.outcome === "error");

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].outcome === "error" && failed[0].error).toBe(ALREADY_VALIDATED_MESSAGE);
    expect(failed[0].outcome === "error" && failed[0].error).not.toMatch(/23505|constraint|duplicate key|postgres/i);

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
  });

  it("rejeita revisar um caso que não está em HUMAN_REVIEW", async () => {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("review-invalido") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(adminClient, admin.client, { email, displayName: "Paciente Estado Inválido" }, admin.userId);
    createdPatientProfileIds.push(patientAccount.profileId);
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
