import { ConnectorManager } from "@/alicia/connectors";
import { ProtocolEngine } from "@/alicia/protocol-engine";
import type { DoctorCandidate, Evidence } from "@/alicia/protocol-engine";

import { ChangeDetector } from "./change-detector";
import { decideVerification } from "./verification-decision";
import type {
  PublishedProfileSnapshot,
  VerificationProfile,
  VerificationRunResult,
} from "./types";
import { mockCurrentSnapshots } from "./mocks/published-profiles";

function runId(): string {
  return `vr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildCandidateFromSnapshot(
  profile: VerificationProfile,
  snapshot: PublishedProfileSnapshot,
): DoctorCandidate {
  return {
    id: profile.candidateId,
    caseId: `ALC-${snapshot.state}-2026-${profile.candidateId.slice(-5)}`,
    name: snapshot.doctorName,
    crm: snapshot.crm,
    crmStatus: snapshot.status === "inactive" ? "cancelled" : "active",
    rqe: snapshot.rqe,
    specialty: snapshot.specialty,
    city: snapshot.city,
    state: snapshot.state,
    graduation: snapshot.rqe
      ? { institution: "EMESCAM", verified: true }
      : undefined,
    residency: snapshot.residency.map((item) => ({
      institution: item.split("—")[1]?.trim() ?? item,
      program: snapshot.specialty,
      verified: true,
    })),
    currentInstitutions: snapshot.institutions.map((name) => ({
      name,
      role: snapshot.specialty,
    })),
    practiceAreas: [snapshot.specialty],
    collectedBy: "Verification Runner",
    collectedAt: new Date().toISOString(),
    hasIdentityConflict: false,
    duplicateCrm: false,
  };
}

function buildEvidenceFromSnapshot(
  snapshot: PublishedProfileSnapshot,
  sourcesConsulted: string[],
): Evidence[] {
  const evidence: Evidence[] = [
    {
      id: `ev-crm-${snapshot.profileId}`,
      name: snapshot.crm,
      type: "Registro profissional",
      level: 1,
      consultedAt: new Date().toISOString(),
      responsible: "Verification Runner",
      supportsFields: ["crm", "identity", "specialty", "city"],
    },
  ];

  if (snapshot.rqe) {
    evidence.push({
      id: `ev-rqe-${snapshot.profileId}`,
      name: snapshot.rqe,
      type: "Registro de qualificação de especialista",
      level: 1,
      consultedAt: new Date().toISOString(),
      responsible: "Verification Runner",
      supportsFields: ["rqe", "specialty"],
    });
  }

  for (const source of sourcesConsulted) {
    evidence.push({
      id: `ev-src-${source}-${snapshot.profileId}`,
      name: `${source} — ${snapshot.doctorName}`,
      type: "Fonte de verificação",
      level: 2,
      consultedAt: new Date().toISOString(),
      responsible: "Verification Runner",
      supportsFields: ["current_practice", "trajectory_milestone"],
    });
  }

  if (snapshot.institutions.length > 0) {
    evidence.push({
      id: `ev-inst-${snapshot.profileId}`,
      name: snapshot.institutions[0]!,
      type: "Instituição",
      level: 2,
      consultedAt: new Date().toISOString(),
      responsible: "Verification Runner",
      supportsFields: ["current_practice", "specialty"],
    });
  }

  return evidence;
}

function buildCurrentSnapshot(
  profile: VerificationProfile,
): PublishedProfileSnapshot {
  const override = mockCurrentSnapshots[profile.profileId] ?? {};

  return {
    profileId: profile.profileId,
    candidateId: profile.candidateId,
    doctorName: override.doctorName ?? profile.snapshot.doctorName,
    crm: override.crm ?? profile.snapshot.crm,
    rqe: override.rqe ?? profile.snapshot.rqe,
    institutions: override.institutions ?? profile.snapshot.institutions,
    residency: override.residency ?? profile.snapshot.residency,
    specialty: override.specialty ?? profile.snapshot.specialty,
    city: override.city ?? profile.snapshot.city,
    state: override.state ?? profile.snapshot.state,
    sources: override.sources ?? profile.snapshot.sources,
    status: override.status ?? profile.snapshot.status,
    publishedAt: profile.snapshot.publishedAt,
    version: profile.snapshot.version + 1,
  };
}

export type VerificationRunnerOptions = {
  connectorManager?: ConnectorManager;
};

export class VerificationRunner {
  private readonly connectorManager: ConnectorManager;
  private readonly changeDetector = new ChangeDetector();
  private readonly protocolEngine = new ProtocolEngine({ recordAudit: false });

  constructor(options: VerificationRunnerOptions = {}) {
    this.connectorManager = options.connectorManager ?? new ConnectorManager();
  }

  async run(
    profile: VerificationProfile,
    correlationId: string,
  ): Promise<VerificationRunResult> {
    const started = performance.now();
    const runIdentifier = runId();

    try {
      const connectorRun = await this.connectorManager.runAll();
      const sourcesConsulted = connectorRun.results
        .filter((result) => result.success)
        .map((result) => result.connectorId);

      const currentSnapshot = buildCurrentSnapshot(profile);
      const candidate = buildCandidateFromSnapshot(profile, currentSnapshot);
      const evidence = buildEvidenceFromSnapshot(currentSnapshot, sourcesConsulted);
      const protocolDecision = this.protocolEngine.evaluate(candidate, evidence);
      const change = this.changeDetector.detect(profile.snapshot, currentSnapshot);
      const verificationDecision = decideVerification(change, protocolDecision.outcome);

      return {
        runId: runIdentifier,
        profileId: profile.profileId,
        candidateId: profile.candidateId,
        status: "COMPLETED",
        decision: verificationDecision,
        change,
        sourcesConsulted,
        latencyMs: Math.round(performance.now() - started),
        correlationId,
      };
    } catch (error) {
      return {
        runId: runIdentifier,
        profileId: profile.profileId,
        candidateId: profile.candidateId,
        status: "FAILED",
        decision: {
          outcome: "REVIEW_REQUIRED",
          classification: "CONFLICT",
          protocolOutcome: "HUMAN_REVIEW",
          justification: "Falha na execução da verificação.",
        },
        change: { classification: "CONFLICT", changes: [] },
        sourcesConsulted: [],
        latencyMs: Math.round(performance.now() - started),
        correlationId,
        error: error instanceof Error ? error.message : "Falha desconhecida.",
      };
    }
  }
}
