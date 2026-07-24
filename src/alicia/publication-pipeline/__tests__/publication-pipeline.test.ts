import { describe, expect, it } from "vitest";

import { createEvidence } from "@/alicia/protocol-engine/__tests__/fixtures";

import { PublicationAuditTrail } from "../audit";
import { buildPublicationDraft } from "../draft-builder";
import { hashPayload } from "../hash";
import { InMemoryPublicationRepository } from "../infrastructure/in-memory-publication-repository";
import { PublicationPipeline } from "../pipeline";
import { runPreflightValidation } from "../preflight-validator";
import { publishSnapshotAtomically } from "../publisher";
import { verifyPublishedProfile } from "../post-publish-verifier";
import { createImmutableSnapshot } from "../snapshot";
import type { PublicationRepository } from "../ports/publication-repository";
import type { ImmutableSnapshot, PublicCatalogRecord } from "../types";
import {
  createAutoPublishDecision,
  createHumanReviewInput,
  createPipelineInput,
  createRejectInput,
} from "./fixtures";

function createPipeline(repository?: PublicationRepository) {
  return new PublicationPipeline({
    repository: repository ?? new InMemoryPublicationRepository(),
    audit: new PublicationAuditTrail(),
  });
}

class FailingPublishRepository extends InMemoryPublicationRepository {
  publish(): PublicCatalogRecord {
    throw new Error("Falha simulada na publicação.");
  }
}

class CorruptingPublishRepository extends InMemoryPublicationRepository {
  publish(snapshotId: string, publishedAt?: string): PublicCatalogRecord {
    const record = super.publish(snapshotId, publishedAt);
    const internal = this as unknown as {
      published: Map<string, { snapshotId: string; record: PublicCatalogRecord; crm: string }>;
    };
    const entry = internal.published.get(record.id);
    if (entry) {
      entry.record = { ...entry.record, name: `${entry.record.name} CORRUPTED` };
    }
    return record;
  }
}

describe("Publication Pipeline 1.0", () => {
  it("1. AUTO_PUBLISH válido → publicado e verificado", () => {
    const pipeline = createPipeline();
    const result = pipeline.execute(createPipelineInput());

    expect(result.status).toBe("PUBLISHED");
    expect(result.doctorId).toBeDefined();
    expect(result.snapshotId).toBeDefined();
    expect(pipeline.getRepository().findPublishedByDoctorId(result.doctorId!)).toBeDefined();

    const events = pipeline.getAuditTrail().list().map((event) => event.type);
    expect(events).toContain("PUBLICATION_DRAFTED");
    expect(events).toContain("PREFLIGHT_PASSED");
    expect(events).toContain("SNAPSHOT_STAGED");
    expect(events).toContain("PROFILE_PUBLISHED");
    expect(events).toContain("POST_PUBLISH_VERIFIED");
  });

  it("2. HUMAN_REVIEW → pipeline rejeita entrada", () => {
    const result = createPipeline().execute(createHumanReviewInput());
    expect(result.status).toBe("REJECTED");
    expect(result.reviewCase?.reason).toBe("NOT_AUTO_PUBLISH");
  });

  it("3. REJECT → pipeline rejeita entrada", () => {
    const result = createPipeline().execute(createRejectInput());
    expect(result.status).toBe("REJECTED");
    expect(result.reviewCase?.reason).toBe("NOT_AUTO_PUBLISH");
  });

  it("4. CRM ausente → bloqueio", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    candidate.crm = "";
    const evidenceWithoutCrm = evidence.filter((item) => !item.name.includes("CRM"));

    const pipeline = createPipeline();
    const result = pipeline.execute({
      candidate,
      evidence: evidenceWithoutCrm,
      decision,
      protocolDecisionId: "pd-no-crm",
      evidenceReportId: "er-no-crm",
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.blocks?.some((block) => block.code === "CRM_MISSING")).toBe(true);
    expect(result.reviewCase?.reason).toBe("PUBLICATION_BLOCKED");
  });

  it("5. RQE ausente → bloqueio", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    candidate.rqe = undefined;
    const evidenceWithoutRqe = evidence.filter((item) => !item.name.includes("RQE"));

    const pipeline = createPipeline();
    const result = pipeline.execute({
      candidate,
      evidence: evidenceWithoutRqe,
      decision,
      protocolDecisionId: "pd-no-rqe",
      evidenceReportId: "er-no-rqe",
    });

    expect(result.status).toBe("BLOCKED");
    expect(result.blocks?.some((block) => block.code === "RQE_MISSING")).toBe(true);
  });

  it("6. CRM duplicado → bloqueio", () => {
    const repository = new InMemoryPublicationRepository();
    const pipeline = createPipeline(repository);
    const first = pipeline.execute(createPipelineInput({ name: "Dr. Primeiro CRM" }));

    expect(first.status).toBe("PUBLISHED");

    const second = pipeline.execute(
      createPipelineInput(
        { name: "Dr. Segundo CRM", id: "cand-2", caseId: "ALC-ES-2026-00002" },
        undefined,
        { protocolDecisionId: "pd-2", evidenceReportId: "er-2" },
      ),
    );

    expect(second.status).toBe("BLOCKED");
    expect(second.blocks?.some((block) => block.code === "DUPLICATE_CRM")).toBe(true);
  });

  it("7. Slug duplicado → tratamento determinístico", () => {
    const repository = new InMemoryPublicationRepository();
    const pipeline = createPipeline(repository);
    const first = pipeline.execute(createPipelineInput({ name: "Dr. Teste Protocolo" }));
    expect(first.status).toBe("PUBLISHED");

    const second = pipeline.execute(
      createPipelineInput(
        {
          name: "Dr. Teste Protocolo",
          id: "cand-dup-slug",
          caseId: "ALC-ES-2026-00999",
          crm: "CRM-ES 99.999",
        },
        [
          createEvidence({
            id: "src-crm-2",
            name: "CRM-ES 99.999",
            type: "Registro profissional",
            level: 1,
            supportsFields: ["crm", "identity"],
          }),
          createEvidence({
            id: "src-rqe-2",
            name: "RQE 8.888",
            type: "Registro de qualificação de especialista",
            level: 1,
            supportsFields: ["rqe"],
          }),
          createEvidence({
            id: "src-inst-2",
            name: "Hospital Meridional",
            type: "Instituição",
            level: 2,
            supportsFields: ["current_practice"],
          }),
        ],
        { protocolDecisionId: "pd-dup-slug", evidenceReportId: "er-dup-slug" },
      ),
    );

    expect(second.status).toBe("BLOCKED");
    expect(second.blocks?.some((block) => block.code === "DUPLICATE_SLUG")).toBe(true);
  });

  it("8. Sentinela interna → bloqueio", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd-sentinel",
      evidenceReportId: "er-sentinel",
    });
    draft.payload.mainInstitution = "__INTERNAL__";

    const preflight = runPreflightValidation({
      decision,
      candidate,
      draft,
      existingDoctorIds: new Set(),
      existingCrms: new Set(),
    });

    expect(preflight.status).toBe("PUBLICATION_BLOCKED");
    expect(preflight.blocks.some((block) => block.code === "INTERNAL_SENTINEL")).toBe(true);
  });

  it("9. Linguagem de ranking → bloqueio", () => {
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd-ranking",
      evidenceReportId: "er-ranking",
    });
    draft.payload.whoTheyAre = "Médico com ranking nacional e score elevado.";

    const preflight = runPreflightValidation({
      decision,
      candidate,
      draft,
      existingDoctorIds: new Set(),
      existingCrms: new Set(),
    });

    expect(preflight.status).toBe("PUBLICATION_BLOCKED");
    expect(preflight.blocks.some((block) => block.code === "RANKING_LANGUAGE")).toBe(true);
  });

  it("10. Mesma decisão duas vezes → ALREADY_PUBLISHED", () => {
    const pipeline = createPipeline();
    const input = createPipelineInput();

    const first = pipeline.execute(input);
    const second = pipeline.execute(input);

    expect(first.status).toBe("PUBLISHED");
    expect(second.status).toBe("ALREADY_PUBLISHED");
    expect(pipeline.getRepository().listHistory(first.doctorId!).length).toBe(1);
  });

  it("11. Atualização sem mudanças → NO_CHANGE", () => {
    const pipeline = createPipeline();
    const input = createPipelineInput();

    const first = pipeline.execute(input);
    expect(first.status).toBe("PUBLISHED");

    const second = pipeline.execute({
      ...input,
      protocolDecisionId: "pd-no-change",
      evidenceReportId: "er-no-change",
    });

    expect(second.status).toBe("NO_CHANGE");
    expect(second.updateClassification).toBe("NO_CHANGE");
  });

  it("12. Atualização menor → novo snapshot seguro", () => {
    const pipeline = createPipeline();
    const input = createPipelineInput();

    const first = pipeline.execute(input);
    expect(first.status).toBe("PUBLISHED");

    const updatedEvidence = [
      ...input.evidence,
      createEvidence({
        id: "src-extra",
        name: "Publicação científica adicional",
        type: "Publicação",
        level: 3,
        supportsFields: ["trajectory_milestone"],
      }),
    ];

    const second = pipeline.execute({
      ...input,
      evidence: updatedEvidence,
      protocolDecisionId: "pd-minor",
      evidenceReportId: "er-minor",
    });

    expect(second.status).toBe("PUBLISHED");
    expect(second.updateClassification).toBe("MINOR_UPDATE");
    expect(pipeline.getRepository().listHistory(first.doctorId!).length).toBe(2);
  });

  it("13. Atualização material → Review Case", () => {
    const pipeline = createPipeline();
    const input = createPipelineInput();

    const first = pipeline.execute(input);
    expect(first.status).toBe("PUBLISHED");

    const material = pipeline.execute(
      createPipelineInput(
        { city: "Serra" },
        undefined,
        { protocolDecisionId: "pd-material", evidenceReportId: "er-material" },
      ),
    );

    expect(material.status).toBe("BLOCKED");
    expect(material.updateClassification).toBe("MATERIAL_UPDATE");
    expect(material.reviewCase?.reason).toBe("MATERIAL_UPDATE");
  });

  it("14. Falha parcial → catálogo intacto", () => {
    const repository = new FailingPublishRepository();
    const pipeline = createPipeline(repository);
    const result = pipeline.execute(createPipelineInput());

    expect(result.status).toBe("BLOCKED");
    expect(repository.listPublishedDoctorIds()).toHaveLength(0);
    expect(repository.listHistory(result.doctorId ?? "x")).toHaveLength(0);
  });

  it("15. Publicação inconsistente → rollback", () => {
    const repository = new CorruptingPublishRepository();
    const audit = new PublicationAuditTrail();
    const pipeline = new PublicationPipeline({ repository, audit });
    const result = pipeline.execute(createPipelineInput());

    expect(result.status).toBe("ROLLBACK_EXECUTED");
    expect(result.reviewCase?.reason).toBe("PUBLICATION_INCONSISTENT");
    expect(audit.list().some((event) => event.type === "ROLLBACK_EXECUTED")).toBe(true);
  });

  it("16. Snapshot imutável", () => {
    const repository = new InMemoryPublicationRepository();
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd-immutable",
      evidenceReportId: "er-immutable",
    });
    const snapshot = createImmutableSnapshot({ draft, profileVersion: 1 });

    repository.stage(snapshot);
    expect(() => repository.stage(snapshot)).toThrow(/imutável/);

    const stored = repository.findSnapshotById(snapshot.snapshotId)!;
    expect(() => {
      (stored as { payload: PublicCatalogRecord }).payload = {
        ...stored.payload,
        name: "Alterado",
      };
    }).not.toThrow();
    expect(repository.findSnapshotById(snapshot.snapshotId)?.payload.name).toBe(draft.payload.name);
  });

  it("17. Histórico anterior preservado", () => {
    const repository = new InMemoryPublicationRepository();
    const pipeline = createPipeline(repository);
    const input = createPipelineInput();

    const first = pipeline.execute(input);
    const minor = pipeline.execute({
      ...input,
      evidence: [
        ...input.evidence,
        createEvidence({
          id: "src-history",
          name: "Fonte histórica",
          type: "Instituição",
          level: 2,
          supportsFields: ["trajectory_milestone"],
        }),
      ],
      protocolDecisionId: "pd-history-2",
      evidenceReportId: "er-history-2",
    });

    const history = repository.listHistory(first.doctorId!);
    expect(history.length).toBe(2);
    expect(history[0]?.snapshotId).toBe(first.snapshotId);
    expect(history[1]?.snapshotId).toBe(minor.snapshotId);
    expect(minor.status).toBe("PUBLISHED");
  });

  it("18. Dados privados nunca chegam ao payload público", () => {
    const pipeline = createPipeline();
    const result = pipeline.execute(createPipelineInput());

    expect(result.status).toBe("PUBLISHED");
    const published = pipeline.getRepository().findPublishedByDoctorId(result.doctorId!)!;
    const serialized = JSON.stringify(published);

    expect(serialized).not.toContain("__PRIVATE__");
    expect(serialized).not.toContain("internalNotes");
    expect(serialized).not.toContain("nivel");
    expect(serialized).not.toContain("operationalLevel");
  });
});

describe("publisher", () => {
  it("rejeita publicação com hash divergente", () => {
    const repository = new InMemoryPublicationRepository();
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd-hash",
      evidenceReportId: "er-hash",
    });
    const snapshot = createImmutableSnapshot({ draft, profileVersion: 1 });
    repository.stage(snapshot);

    const tampered: ImmutableSnapshot = {
      ...snapshot,
      deterministicHash: "hash-invalido",
    };

    expect(() => publishSnapshotAtomically(repository, tampered)).toThrow(/rollback/);
    expect(repository.findPublishedByDoctorId(draft.doctorId)).toBeUndefined();
  });
});

describe("post-publish verification", () => {
  it("detecta payload divergente do snapshot", () => {
    const repository = new InMemoryPublicationRepository();
    const { candidate, evidence, decision } = createAutoPublishDecision();
    const draft = buildPublicationDraft({
      candidate,
      evidence,
      evidenceReport: decision.evidenceReport,
      decision,
      protocolDecisionId: "pd-verify",
      evidenceReportId: "er-verify",
    });
    const snapshot = createImmutableSnapshot({ draft, profileVersion: 1 });
    repository.stage(snapshot);
    repository.publish(snapshot.snapshotId);

    const verification = verifyPublishedProfile(repository, {
      ...snapshot,
      publishedAt: new Date().toISOString(),
      deterministicHash: hashPayload({ ...snapshot.payload, name: "Nome divergente" }),
    });

    expect(verification.status).toBe("PUBLICATION_INCONSISTENT");
  });
});
