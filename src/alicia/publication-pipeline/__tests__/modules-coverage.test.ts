import { describe, expect, it } from "vitest";

import { createCandidate, createEvidence } from "@/alicia/protocol-engine/__tests__/fixtures";
import { evaluateEvidence, decidePublication } from "@/alicia/protocol-engine";

import { PublicationAuditTrail } from "../audit";
import { assertNoPrivateData, buildDoctorId, buildPublicationDraft } from "../draft-builder";
import { createImmutableSnapshot, freezeSnapshot } from "../snapshot";
import type { PublicCatalogRecord } from "../types";
import { buildStructuredDiff, classifyUpdate } from "../update-classifier";
import { runPreflightValidation } from "../preflight-validator";
import { publishSnapshotAtomically } from "../publisher";
import { executeRollback } from "../rollback";
import { collectPipelineReviewCases, runPipelineForAutoPublishCandidates } from "../studio-adapter";
import { PublicationPipeline, runPublicationPipeline } from "../pipeline";
import { InMemoryPublicationRepository } from "../infrastructure/in-memory-publication-repository";
import { createAutoPublishDecision, createPipelineInput } from "./fixtures";

describe("preflight-validator coverage", () => {
  function baseDraft() {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    return {
      decision,
      candidate,
      draft: buildPublicationDraft({
        candidate,
        evidence,
        evidenceReport: decision.evidenceReport,
        decision,
        protocolDecisionId: "pd",
        evidenceReportId: "er",
      }),
    };
  }

  it("bloqueia NOT_AUTO_PUBLISH, identidade, cidade, coordenadas e fontes", () => {
    const { decision, candidate, draft } = baseDraft();
    draft.payload.location.city = "  ";
    draft.payload.location.lat = 999;
    draft.payload.transparency.sources = [draft.payload.transparency.sources[0]!];

    const result = runPreflightValidation({
      decision: { ...decision, outcome: "HUMAN_REVIEW" },
      candidate: { ...candidate, hasIdentityConflict: true },
      draft,
      existingDoctorIds: new Set(),
      existingCrms: new Set(),
    });

    expect(result.status).toBe("PUBLICATION_BLOCKED");
    expect(result.blocks.map((block) => block.code)).toEqual(
      expect.arrayContaining([
        "NOT_AUTO_PUBLISH",
        "IDENTITY_CONFLICT",
        "INVALID_CITY",
        "INVALID_COORDINATES",
        "INSUFFICIENT_SOURCES",
      ]),
    );
  });

  it("bloqueia URL inválida, campos obrigatórios, estado e linguagem promocional", () => {
    const { decision, candidate, draft } = baseDraft();
    draft.payload.transparency.sources[0]!.url = "not-a-url";
    draft.payload.name = "";
    draft.payload.location.state = "RJ";
    draft.payload.trajectory = "Médico renomado e excelente referência.";

    const result = runPreflightValidation({
      decision,
      candidate,
      draft,
      existingDoctorIds: new Set(),
      existingCrms: new Set(),
    });

    expect(result.blocks.map((block) => block.code)).toEqual(
      expect.arrayContaining([
        "INVALID_URL",
        "REQUIRED_FIELD_MISSING",
        "SCHEMA_INVALID",
        "PROMOTIONAL_LANGUAGE",
      ]),
    );
  });

  it("bloqueia vazamento de dados privados", () => {
    const { decision, candidate, draft } = baseDraft();
    (draft.payload as unknown as { internalNotes: string }).internalNotes = "segredo";

    const result = runPreflightValidation({
      decision,
      candidate,
      draft,
      existingDoctorIds: new Set(),
      existingCrms: new Set(),
    });

    expect(result.blocks.some((block) => block.code === "PRIVATE_DATA_LEAK")).toBe(true);
    expect(assertNoPrivateData(draft.payload)).toHaveLength(1);
  });

  it("bloqueia especialidade fora do escopo", () => {
    const { decision, candidate, draft } = baseDraft();
    draft.payload.specialty = "Cardiologia";

    const result = runPreflightValidation({
      decision,
      candidate,
      draft,
      existingDoctorIds: new Set(),
      existingCrms: new Set(),
    });

    expect(result.blocks.some((block) => block.code === "SPECIALTY_OUT_OF_SCOPE")).toBe(true);
  });
});

describe("update-classifier coverage", () => {
  it("classifica REVIEW_REQUIRED quando há perda de fontes", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const current = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd",
      evidenceReportId: "er",
    }).payload;

    const next = structuredClone(current);
    next.location.city = "Serra";
    next.transparency.sources = next.transparency.sources.slice(0, 1);

    expect(classifyUpdate(current, next)).toBe("REVIEW_REQUIRED");
    expect(buildStructuredDiff(current, next).some((entry) => entry.field === "location.city")).toBe(
      true,
    );
  });
});

describe("draft-builder coverage", () => {
  it("extrai CRM/RQE das fontes e TEOT quando necessário", () => {
    const candidate = createCandidate({
      crm: "",
      rqe: undefined,
      teot: undefined,
      name: "Dra. Maria Neuro",
    });
    const evidence = [
      createEvidence({
        id: "crm-src",
        name: "CRM-ES 55.555",
        type: "Registro profissional",
        level: 1,
        supportsFields: ["crm"],
      }),
      createEvidence({
        id: "teot-src",
        name: "TEOT 1234",
        type: "Título de especialista",
        level: 1,
        supportsFields: ["teot"],
      }),
      createEvidence({
        id: "inst-src",
        name: "Hospital Estadual",
        type: "Instituição",
        level: 2,
        supportsFields: ["current_practice"],
      }),
    ];
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: report,
      decision,
      protocolDecisionId: "pd-teot",
      evidenceReportId: "er-teot",
    });

    expect(buildDoctorId(candidate)).toBeTruthy();
    expect(draft.payload.transparency.sources.some((source) => source.name.includes("TEOT"))).toBe(
      true,
    );
  });

  it("inclui RQE sintético quando ausente nas fontes", () => {
    const candidate = createCandidate({ rqe: "RQE 7.777" });
    const evidence = createMinimumEvidence().filter((item) => !item.name.includes("RQE"));
    const report = evaluateEvidence(candidate, evidence);
    const decision = decidePublication(candidate, evidence, report);

    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: report,
      decision,
      protocolDecisionId: "pd-rqe",
      evidenceReportId: "er-rqe",
    });

    expect(
      draft.payload.transparency.sources.some((source) => source.name.includes("RQE")),
    ).toBe(true);
  });

  it("rejeita draft sem AUTO_PUBLISH", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    expect(() =>
      buildPublicationDraft({
        candidate,
        evidence,
        evidenceReport: decision.evidenceReport,
        decision: { ...decision, outcome: "HUMAN_REVIEW" },
        protocolDecisionId: "pd",
        evidenceReportId: "er",
      }),
    ).toThrow(/AUTO_PUBLISH/);
  });
});

function createMinimumEvidence() {
  return [
    createEvidence({
      id: "src-crm",
      name: "CRM-ES 12.345",
      type: "Registro profissional",
      level: 1,
      supportsFields: ["crm", "identity"],
    }),
    createEvidence({
      id: "src-inst",
      name: "ICOT",
      type: "Instituição",
      level: 2,
      supportsFields: ["current_practice"],
    }),
  ];
}

describe("publisher and rollback coverage", () => {
  it("publica snapshot não staged previamente", () => {
    const repository = new InMemoryPublicationRepository();
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd",
      evidenceReportId: "er",
    });
    const snapshot = createImmutableSnapshot({ draft, profileVersion: 1 });

    const result = publishSnapshotAtomically(repository, snapshot);
    expect(result.record.id).toBe(draft.doctorId);
  });

  it("congela snapshot para imutabilidade", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd",
      evidenceReportId: "er",
    });
    const snapshot = createImmutableSnapshot({ draft, profileVersion: 1 });
    const frozen = freezeSnapshot(snapshot);
    expect(frozen.snapshotId).toBe(snapshot.snapshotId);
  });

  it("publica snapshot já publicado no mapa de snapshots", () => {
    const repository = new InMemoryPublicationRepository();
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd",
      evidenceReportId: "er",
    });
    const snapshot = createImmutableSnapshot({ draft, profileVersion: 1 });
    repository.stage(snapshot);
    repository.publish(snapshot.snapshotId);

    const result = publishSnapshotAtomically(repository, snapshot);
    expect(result.snapshotId).toBe(snapshot.snapshotId);
  });

  it("falha quando publicação não define publishedAt", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd",
      evidenceReportId: "er",
    });
    const snapshot = createImmutableSnapshot({ draft, profileVersion: 1 });

    class NoPublishedAtRepository extends InMemoryPublicationRepository {
      publish(snapshotId: string): PublicCatalogRecord {
        const staged = this.findSnapshotById(snapshotId);
        if (!staged) {
          throw new Error("missing");
        }
        return staged.payload;
      }

      findSnapshotById(snapshotId: string) {
        const found = super.findSnapshotById(snapshotId);
        return found ? { ...found, publishedAt: null } : undefined;
      }
    }

    const broken = new NoPublishedAtRepository();
    broken.stage(snapshot);
    expect(() => publishSnapshotAtomically(broken, snapshot)).toThrow(/publishedAt/);
  });

  it("rollback sem versão anterior remove publicação ativa", () => {
    const repository = new InMemoryPublicationRepository();
    const audit = new PublicationAuditTrail();
    const pipelineInput = createPipelineInput();
    const pipeline = runPublicationPipeline(pipelineInput, { repository, audit });
    expect(pipeline.status).toBe("PUBLISHED");

    const rollback = executeRollback({
      repository,
      audit,
      snapshotId: pipeline.snapshotId!,
      doctorId: pipeline.doctorId!,
      candidateId: pipelineInput.candidate.id,
      protocolDecisionId: pipelineInput.protocolDecisionId,
      reason: "teste",
      actor: "qa",
    });

    expect(rollback.success).toBe(false);
    expect(repository.findPublishedByDoctorId(pipeline.doctorId!)).toBeUndefined();
  });

  it("rollback com sucesso restaura versão anterior", () => {
    const repository = new InMemoryPublicationRepository();
    const audit = new PublicationAuditTrail();
    const pipeline = new PublicationPipeline({ repository, audit });
    const input = createPipelineInput();
    const first = pipeline.execute(input);
    const second = pipeline.execute({
      ...input,
      evidence: [
        ...input.evidence,
        createEvidence({
          id: "extra-rollback",
          name: "Fonte rollback",
          type: "Instituição",
          level: 2,
          supportsFields: ["trajectory_milestone"],
        }),
      ],
      protocolDecisionId: "pd-rb-ok",
      evidenceReportId: "er-rb-ok",
    });

    const rollback = executeRollback({
      repository,
      audit,
      snapshotId: second.snapshotId!,
      doctorId: second.doctorId!,
      candidateId: input.candidate.id,
      protocolDecisionId: "pd-rb-ok",
      reason: "restore",
    });

    expect(rollback.success).toBe(true);
    expect(rollback.message).toContain("restaurada");
    expect(repository.getActiveSnapshotId(first.doctorId!)).toBe(first.snapshotId);
  });
});

describe("audit trail", () => {
  it("lista eventos por médico", () => {
    const audit = new PublicationAuditTrail();
    audit.record({
      type: "PUBLICATION_DRAFTED",
      candidateId: "c1",
      doctorId: "d1",
      protocolDecisionId: "pd",
      outcome: "drafted",
      reasons: [],
      evidenceIds: [],
    });
    audit.record({
      type: "PROFILE_PUBLISHED",
      candidateId: "c1",
      doctorId: "d2",
      protocolDecisionId: "pd",
      outcome: "published",
      reasons: [],
      evidenceIds: [],
    });

    expect(audit.list()).toHaveLength(2);
    expect(audit.listByDoctor("d1")).toHaveLength(1);
  });
});

describe("repository edge cases", () => {
  it("rollback retorna undefined quando snapshot não existe", () => {
    const repository = new InMemoryPublicationRepository();
    expect(repository.rollback("missing")).toBeUndefined();
  });

  it("rollback com histórico restaura versão anterior", () => {
    const repository = new InMemoryPublicationRepository();
    const pipeline = new PublicationPipeline({ repository });
    const input = createPipelineInput();
    const first = pipeline.execute(input);
    const second = pipeline.execute({
      ...input,
      evidence: [
        ...input.evidence,
        createEvidence({
          id: "extra",
          name: "Fonte extra",
          type: "Instituição",
          level: 2,
          supportsFields: ["trajectory_milestone"],
        }),
      ],
      protocolDecisionId: "pd-rollback",
      evidenceReportId: "er-rollback",
    });

    const restored = repository.rollback(second.snapshotId!);
    expect(restored).toBeDefined();
    expect(repository.getActiveSnapshotId(first.doctorId!)).toBe(first.snapshotId);
  });
});

describe("pipeline error handling", () => {
  it("retorna REJECTED quando decisão não é AUTO_PUBLISH", () => {
    const pipeline = new PublicationPipeline();
    const input = createPipelineInput();
    input.decision = { ...input.decision, outcome: "HUMAN_REVIEW" };

    const result = pipeline.execute(input);
    expect(result.status).toBe("REJECTED");
  });
});

describe("public API", () => {
  it("exporta versão do pipeline", async () => {
    const api = await import("../index");
    expect(api.PIPELINE_VERSION).toBe("1.0");
    expect(typeof api.runPublicationPipeline).toBe("function");
  });
});

describe("studio-adapter coverage", () => {
  it("coleta review cases e executa lote", () => {
    const repository = new InMemoryPublicationRepository();
    const input = createPipelineInput();
    const pipeline = new PublicationPipeline({ repository });
    const first = pipeline.execute(input);
    const batch = runPipelineForAutoPublishCandidates(pipeline, [{ input }]);

    expect(collectPipelineReviewCases([first])).toEqual([]);
    expect(batch.results[0]?.status).toBe("ALREADY_PUBLISHED");
  });
});
