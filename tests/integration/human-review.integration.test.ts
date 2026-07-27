// HISTÓRICO / OBSERVABILIDADE — Human Review (P009).
//
// Esta suíte NÃO valida o fluxo operacional atual. A ADR-035 removeu do ACE o
// papel de motor de Curadoria e a ADR-036 descontinuou as superfícies que
// acionavam P008/P009/P010 — o `HumanReviewForm` e a Server Action
// `submitHumanReviewAction` deixaram de existir. Nenhum Caso novo produz
// revisão por este caminho. O que permanece — e o que estes testes observam —
// é o dado histórico já persistido, que as duas ADRs mandam preservar íntegro
// e legível.
//
// Por isso nada aqui chama `runAceExecution`, `submitHumanReview` ou
// `FakeAceLanguageModel`. O estado histórico é inserido diretamente por
// `seedLegacyHumanReview`, com payloads construídos pelos contratos e
// protocolos reais (P007/P008/P009) — ver
// tests/integration/legacy-ace-chain-fixture.ts.
//
// OBSOLETO PELA ADR-036 — cinco cenários saíram desta suíte e não foram
// migrados, porque sua única evidência era o valor de retorno do escritor
// `submitHumanReview`, e não um resíduo histórico observável:
//   - "uma segunda revisão após já existir uma decisão VALIDATED é rejeitada
//     pelo pre-check (mensagem pública sem detalhe interno)";
//   - "concorrência real: duas tentativas simultâneas de validar o mesmo Caso";
//     — o que ambos protegiam era o índice único parcial por Caso, que
//     sobrevive abaixo (A3), exercido diretamente contra o banco;
//   - "rejeita revisar um caso que não está em HUMAN_REVIEW": guard de
//     pré-condição do escritor;
//   - "ADJUST removendo um provider que não estava na Shortlist original":
//     validação estrutural do P009 propagada pelo escritor;
//   - a segunda metade de "RLS: curador não lê nem registra decisões de um
//     caso que não é seu" — a tentativa de REGISTRAR pelo curador. A metade
//     de LEITURA permanece (A6).
// Recriá-los com fixture significaria reintroduzir o escritor — exatamente o
// acoplamento que esta migração existe para remover.

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createCuradoriaClient } from "./curadoria-client";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { changeCaseStatus, createCase, getCase } from "@/modules/cases/repository";
import { getArtifactById } from "@/modules/concierge/execution-repository";
import { listHumanReviewResultsForCase } from "@/modules/concierge/human-review-repository";
import { createPatientAccount } from "@/modules/profiles/patient-account-repository";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";
import { getOrCreateActiveStory, saveStoryDraft, submitStory } from "@/modules/story/repository";

import {
  cleanupLegacyAceChain,
  seedLegacyHumanReview,
  type LegacyHumanReviewFixture,
  type LegacyReviewAction,
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

function unique(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

describe("Human Review — HISTÓRICO / OBSERVABILIDADE (P009, Supabase local)", () => {
  let accounts: TestAccount[];

  beforeAll(() => {
    accounts = loadTestAccounts();
  });

  // Isolamento de dados entre testes: cada createPatientAccount() cria uma
  // conta real (auth.users + profiles via handle_new_user + user_roles). Junto
  // com ela, cada Caso arrasta patient_stories, cases e as tabelas derivadas
  // por case_id. Rastreamos só o profileId (= auth.users.id): o resto sai na
  // ordem validada abaixo, para não esbarrar em cases.source_story_id (NO
  // ACTION contra patient_stories) nem no trigger log_user_role_change (exige
  // profiles ainda existente quando o DELETE de user_roles dispara).
  let createdPatientProfileIds: string[] = [];
  let createdProfessionalIds: string[] = [];
  // A cadeia histórica é removida explicitamente, nunca por cascade: as FKs de
  // human_review_results para execução e artefatos não têm `on delete cascade`.
  let createdFixtures: LegacyHumanReviewFixture[] = [];
  // Linhas de revisão inseridas diretamente por um teste (fora da fixture) para
  // exercer o índice único do banco — saem antes da cadeia que elas referenciam.
  let createdExtraReviewIds: string[] = [];

  afterEach(async () => {
    const adminClient = createAdminSupabaseClient();
    const cleanupFailures: string[] = [];

    if (createdExtraReviewIds.length > 0) {
      const { error } = await adminClient.from("human_review_results").delete().in("id", createdExtraReviewIds);
      if (error) {
        cleanupFailures.push(`human_review_results extras: ${error.message}`);
      }
      createdExtraReviewIds = [];
    }

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

  async function seedEligibleProfessional(
    adminClient: ReturnType<typeof createAdminSupabaseClient>,
    adminUserId: string,
  ) {
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
      .update({
        experience_level: "experiente",
        intake_approach: "ambos",
        offers_continuous_care: true,
        availability_window: "flexible",
      })
      .eq("id", professional.id);

    await adminClient
      .from("professional_competency_areas")
      .insert({ professional_profile_id: professional.id, domain: "nao_determinado", focus: "avaliacao" });

    createdProfessionalIds.push(professional.id);
    return professional.id;
  }

  // Caso histórico com uma decisão de revisão humana já registrada. Os três
  // profissionais são exatamente os que atravessam a cadeia — o pool global de
  // professional_profiles não influencia mais o resultado, porque nenhum
  // protocolo de seleção roda aqui.
  async function createCaseWithHistoricalReview(options?: {
    assignCuratorId?: string;
    reviewAction?: LegacyReviewAction;
    returnToProtocol?: "P006" | null;
  }) {
    const admin = await loginAs("administrador");
    const adminClient = createAdminSupabaseClient();
    const email = unique("review") + "@aliviar-conexao.local";
    const patientAccount = await createPatientAccount(
      adminClient,
      admin.client,
      { email, displayName: "Paciente Review" },
      admin.userId,
    );
    createdPatientProfileIds.push(patientAccount.profileId);

    const patientClient = createCuradoriaClient(url, anonKey);
    await patientClient.auth.signInWithPassword({ email, password: patientAccount.password });
    const draft = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await saveStoryDraft(
      patientClient,
      draft.id,
      draft.revision,
      { motivo: "Buscando apoio para dor crônica." },
      "motivo",
    );
    const refreshed = await getOrCreateActiveStory(patientClient, patientAccount.profileId);
    await submitStory(patientClient, draft.id, refreshed.revision);

    const created = await createCase(admin.client, draft.id, options?.assignCuratorId, admin.userId);
    await changeCaseStatus(admin.client, created.id, "IN_REVIEW", admin.userId);
    await changeCaseStatus(admin.client, created.id, "READY_FOR_CURATION", admin.userId);

    const providerProfileIds = [
      await seedEligibleProfessional(adminClient, admin.userId),
      await seedEligibleProfessional(adminClient, admin.userId),
      await seedEligibleProfessional(adminClient, admin.userId),
    ];

    const fixture = await seedLegacyHumanReview({
      service: adminClient,
      caseId: created.id,
      actorId: admin.userId,
      providerProfileIds,
      reviewAction: options?.reviewAction ?? "APPROVE",
      returnToProtocol: options?.returnToProtocol ?? null,
    });
    createdFixtures.push(fixture);

    return { admin, adminClient, caseId: created.id, providerProfileIds, fixture };
  }

  // A1
  it("a decisão VALIDATED histórica é legível, com proveniência íntegra, e o Caso permanece em HUMAN_REVIEW", async () => {
    const { admin, caseId, fixture } = await createCaseWithHistoricalReview();

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results).toHaveLength(1);

    const review = results[0];
    expect(review.id).toBe(fixture.humanReviewResultId);
    expect(review.reviewStatus).toBe("VALIDATED");
    expect(review.reviewAction).toBe("APPROVE");
    expect(review.returnToProtocol).toBeNull();
    expect(review.executionId).toBe(fixture.executionId);
    expect(review.methodVersion).toBe("ACE-0.1");

    // Proveniência: as duas referências apontam para linhas reais de
    // ace_artifacts, e o invariante dos profissionais atravessa a cadeia
    // inteira — matriz → shortlist → approved_provider_ids.
    expect(review.originalShortlistArtifactId).toBe(fixture.shortlistArtifactId);
    expect(review.compatibilityMatrixArtifactId).toBe(fixture.compatibilityMatrixArtifactId);
    expect(review.approvedProviderIds).toEqual(fixture.providerIds);

    const shortlistArtifact = await getArtifactById(admin.client, review.originalShortlistArtifactId);
    const matrixArtifact = await getArtifactById(admin.client, review.compatibilityMatrixArtifactId);
    expect(shortlistArtifact?.artifactType).toBe("Shortlist");
    expect(shortlistArtifact?.version).toBe(review.originalShortlistArtifactVersion);
    expect(matrixArtifact?.artifactType).toBe("CompatibilityMatrix");
    expect(matrixArtifact?.version).toBe(review.compatibilityMatrixArtifactVersion);

    const shortlistPayload = shortlistArtifact!.payload as { status: string; selectedProviderIds: string[] };
    expect(shortlistPayload.status).toBe("COMPOSED");
    expect(shortlistPayload.selectedProviderIds).toEqual(fixture.providerIds);

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("HUMAN_REVIEW");
  });

  // A2
  it("a decisão REJECTED histórica preserva o retorno de protocolo e deixa o Caso em WAITING_FOR_INFORMATION", async () => {
    const { admin, caseId } = await createCaseWithHistoricalReview({
      reviewAction: "REJECT",
      returnToProtocol: "P006",
    });

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results).toHaveLength(1);
    expect(results[0].reviewStatus).toBe("REJECTED");
    expect(results[0].returnToProtocol).toBe("P006");
    // Nenhuma composição foi validada — o histórico nunca registra aprovados
    // numa revisão que não validou.
    expect(results[0].approvedProviderIds).toEqual([]);

    const updatedCase = await getCase(admin.client, caseId);
    expect(updatedCase?.status).toBe("WAITING_FOR_INFORMATION");
  });

  // A3 — substitui, sem o escritor, tanto o antigo teste de "segunda revisão
  // rejeitada" quanto o de concorrência: o que garantia os dois nunca foi o
  // código do P009, e sim o índice único parcial por Caso. É ele que é
  // exercido aqui, diretamente contra o banco.
  it("no máximo uma decisão VALIDATED por Caso — o índice parcial recusa a segunda e ignora as demais", async () => {
    const { admin, caseId, fixture } = await createCaseWithHistoricalReview();

    const baseRow = {
      case_id: caseId,
      execution_id: fixture.executionId,
      reviewer_id: admin.userId,
      reviewed_at: new Date().toISOString(),
      review_action: "APPROVE" as const,
      original_shortlist_artifact_id: fixture.shortlistArtifactId,
      original_shortlist_artifact_version: 1,
      compatibility_matrix_artifact_id: fixture.compatibilityMatrixArtifactId,
      compatibility_matrix_artifact_version: 1,
      approved_provider_ids: [],
      changes: [],
      review_rationale: "Linha inserida diretamente para provar a constraint de banco, sem passar por nenhum escritor.",
      evidence_references: [],
      return_to_protocol: null,
      method_version: "ACE-0.1",
      version: 1,
    };

    // Já existe uma VALIDATED (a da fixture): uma segunda é recusada pelo
    // PRÓPRIO banco, não pela camada de aplicação.
    const duplicateValidatedId = randomUUID();
    const duplicate = await admin.client
      .from("human_review_results")
      .insert({ id: duplicateValidatedId, ...baseRow, review_status: "VALIDATED" })
      .select("id")
      .single();
    expect(duplicate.error).not.toBeNull();
    expect(duplicate.error?.code).toBe("23505");

    // Estados não validados continuam permitidos livremente para o mesmo Caso
    // — o índice é parcial, só restringe review_status = 'VALIDATED'.
    for (const status of ["REJECTED", "REJECTED", "INFORMATION_REQUESTED"]) {
      const id = randomUUID();
      const inserted = await admin.client
        .from("human_review_results")
        .insert({ id, ...baseRow, review_status: status })
        .select("id")
        .single();
      expect(inserted.error).toBeNull();
      createdExtraReviewIds.push(id);
    }

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
    expect(results.filter((r) => r.reviewStatus === "REJECTED")).toHaveLength(2);
    expect(results.filter((r) => r.reviewStatus === "INFORMATION_REQUESTED")).toHaveLength(1);
  });

  // A4
  it("dois Casos diferentes têm seus próprios resultados VALIDATED, sem interferência mútua (índice é por case_id, não global)", async () => {
    const first = await createCaseWithHistoricalReview();
    const second = await createCaseWithHistoricalReview();

    const firstResults = await listHumanReviewResultsForCase(first.admin.client, first.caseId);
    const secondResults = await listHumanReviewResultsForCase(second.admin.client, second.caseId);

    expect(firstResults.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
    expect(secondResults.filter((r) => r.reviewStatus === "VALIDATED")).toHaveLength(1);
    // Cada Caso valida os SEUS três profissionais — nenhum vazamento entre eles.
    expect(firstResults[0].approvedProviderIds).toEqual(first.fixture.providerIds);
    expect(secondResults[0].approvedProviderIds).toEqual(second.fixture.providerIds);
    expect(first.fixture.providerIds).not.toEqual(second.fixture.providerIds);
  });

  // A5
  it("a decisão persistida é imutável — sem caminho de update/delete", async () => {
    const { admin, caseId } = await createCaseWithHistoricalReview();

    const results = await listHumanReviewResultsForCase(admin.client, caseId);
    expect(results).toHaveLength(1);

    const { error: updateError } = await admin.client
      .from("human_review_results")
      .update({ review_rationale: "adulterado" })
      .eq("id", results[0].id);
    expect(updateError).not.toBeNull();

    const { error: deleteError } = await admin.client
      .from("human_review_results")
      .delete()
      .eq("id", results[0].id);
    expect(deleteError).not.toBeNull();
  });

  // A6
  it("RLS: curador não atribuído não lê as decisões de um caso que não é seu; o atribuído lê", async () => {
    const curador = await loginAs("curador_medico");

    const alheio = await createCaseWithHistoricalReview(); // não atribuído ao curador
    const { data: semVinculo } = await curador.client
      .from("human_review_results")
      .select("id")
      .eq("case_id", alheio.caseId);
    expect(semVinculo ?? []).toHaveLength(0);

    const proprio = await createCaseWithHistoricalReview({ assignCuratorId: curador.userId });
    const { data: comVinculo } = await curador.client
      .from("human_review_results")
      .select("id")
      .eq("case_id", proprio.caseId);
    expect(comVinculo ?? []).toHaveLength(1);
    expect(comVinculo![0]!.id).toBe(proprio.fixture.humanReviewResultId);
  });
});
