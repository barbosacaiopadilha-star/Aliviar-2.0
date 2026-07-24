import { ConnectorManager, defaultConnectors } from "@/alicia/connectors";
import { DiscoveryEngine, DiscoveryQueue, SCOPED_SPECIALTIES, SCOPED_STATE } from "@/alicia/discovery";
import type { DiscoveryCandidate, DiscoveryRunResult } from "@/alicia/discovery";
import { EvidenceAcquisitionEngine } from "@/alicia/evidence-acquisition";
import type { ConnectorEvidenceInput, EvidencePackage } from "@/alicia/evidence-acquisition";
import { FactoryOrchestrator } from "@/alicia/factory";
import { buildCoverageReport } from "@/alicia/lib/coverage-report";
import catalogSeed from "@/alicia/infrastructure/seed/catalog.seed.json";
import type { CatalogImportPayload } from "@/alicia/infrastructure/import/import-types";
import { ProtocolEngine } from "@/alicia/protocol-engine";
import type { DoctorCandidate, Evidence, EvidenceField, PublicationDecision, RuleResult } from "@/alicia/protocol-engine";
import { PublicationPipeline } from "@/alicia/publication-pipeline";
import type { PipelineResult } from "@/alicia/publication-pipeline";
import { VerificationEngine } from "@/alicia/verification";
import { VerificationRunner } from "@/alicia/verification/verification-runner";
import type { VerificationProfile } from "@/alicia/verification";

import {
  mapDiscoveryToDoctorCandidate,
  registerDiscoveredCandidate,
  resetWorkflowContext,
  setCandidateEvidence,
} from "@/alicia/event-bus/integration/workflow-context";

export type PilotCandidateResult = {
  candidateId: string;
  name: string;
  specialty: string;
  city: string;
  crm: string;
  confidence: number;
  discoveryStatus: string;
  evidenceCount: number;
  conflictCount: number;
  coverageAverage: number;
  protocolOutcome: PublicationDecision["outcome"];
  suggestedNivel: string;
  pendingRules: string[];
  failedRules: string[];
  published: boolean;
  publicationStatus?: PipelineResult["status"];
  verified: boolean;
};

export type EsPilotCatalogReport = {
  generatedAt: string;
  scope: {
    state: typeof SCOPED_STATE;
    specialties: string[];
  };
  phases: {
    discoveryMs: number;
    evidenceMs: number;
    protocolMs: number;
    publicationMs: number;
    verificationMs: number;
    factoryMs: number;
  };
  discovery: {
    candidatesFound: number;
    uniqueCandidates: number;
    duplicates: number;
    ignored: number;
    readyForEvidence: number;
    discovered: number;
    sourceHealth: Record<string, string>;
    sourceFailures: number;
    bySpecialty: Record<string, number>;
    byCity: Record<string, number>;
  };
  evidence: {
    packagesCreated: number;
    packagesRejected: number;
    totalConflicts: number;
    averageCoverage: number;
    conflictsByType: Record<string, number>;
    conflictsByConnector: Record<string, number>;
    coverageBySection: Record<string, number>;
  };
  protocol: {
    autoPublish: number;
    humanReview: number;
    reject: number;
    reviewRules: Record<string, number>;
    failedRules: Record<string, number>;
    missingFields: Record<string, number>;
  };
  publication: {
    attempted: number;
    published: number;
    reviewCases: number;
    failed: number;
    noChange: number;
  };
  verification: {
    attempted: number;
    completed: number;
    failed: number;
    pendingReview: number;
  };
  connectors: {
    health: Record<string, string>;
    successCount: number;
    failureCount: number;
    averageLatencyMs: number;
  };
  factory: {
    runId: string | null;
    status: string | null;
    durationMs: number | null;
    published: number;
    reviewCases: number;
    errors: number;
  };
  curatedCatalog: ReturnType<typeof buildCoverageReport>;
  candidates: PilotCandidateResult[];
};

function buildEvidenceFromDiscovery(candidate: DiscoveryCandidate): Evidence[] {
  const evidence: Evidence[] = [];

  if (candidate.crm) {
    evidence.push({
      id: `ev-crm-${candidate.candidateId}`,
      name: `CRM-${candidate.crmUf} ${candidate.crm}`,
      type: "Registro profissional",
      level: 1,
      consultedAt: candidate.dataDescoberta,
      responsible: "Evidence Facade",
      supportsFields: ["crm", "identity", "specialty", "city"],
    });
  }

  if (candidate.urlOrigem) {
    evidence.push({
      id: `ev-url-${candidate.candidateId}`,
      name: candidate.urlOrigem,
      type: "Fonte institucional",
      level: 2,
      url: candidate.urlOrigem,
      consultedAt: candidate.dataDescoberta,
      responsible: "Evidence Facade",
      supportsFields: ["current_practice", "trajectory_milestone"],
    });
  }

  evidence.push({
    id: `ev-inst-${candidate.candidateId}`,
    name: `${candidate.especialidade} — ${candidate.cidade}`,
    type: "Instituição",
    level: 2,
    consultedAt: candidate.dataDescoberta,
    responsible: "Evidence Facade",
    supportsFields: ["specialty", "city"],
  });

  return evidence;
}

function enrichEvidenceFromPackage(
  base: Evidence[],
  pkg: EvidencePackage | undefined,
): Evidence[] {
  if (!pkg) {
    return base;
  }

  const extra: Evidence[] = pkg.evidence.map((item) => ({
    id: item.id,
    name: item.value,
    type: item.category,
    level: (item.provenance.some((p) => p.confidenceDaFonte >= 0.85) ? 1 : 2) as Evidence["level"],
    consultedAt: item.provenance[0]?.fetchTimestamp ?? new Date().toISOString(),
    responsible: item.provenance[0]?.connectorId ?? "evidence-acquisition",
    supportsFields: [item.field as EvidenceField],
    url: item.provenance[0]?.sourceUrl,
  }));

  const seen = new Set(base.map((e) => e.id));
  for (const item of extra) {
    if (!seen.has(item.id)) {
      base.push(item);
      seen.add(item.id);
    }
  }

  return base;
}

function toConnectorInputs(
  manager: ConnectorManager,
  runResults: Awaited<ReturnType<ConnectorManager["runAll"]>>,
): ConnectorEvidenceInput[] {
  return runResults.results.map((result) => {
    const connector = manager.getRegistry().get(result.connectorId);
    return {
      connectorId: result.connectorId,
      connectorVersion: connector?.version ?? "0.0.0",
      connectorName: connector?.name ?? result.connectorId,
      success: result.success,
      records: result.records,
      fetchedAt: runResults.completedAt,
    };
  });
}

function increment(map: Record<string, number>, key: string, amount = 1): void {
  map[key] = (map[key] ?? 0) + amount;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 1000) / 1000;
}

function trackRules(map: Record<string, number>, rules: RuleResult[]): void {
  for (const rule of rules) {
    increment(map, `${rule.id} — ${rule.name}`);
  }
}

function buildVerificationProfile(
  candidate: DoctorCandidate,
  pipelineResult: PipelineResult,
): VerificationProfile | null {
  const snapshotId = pipelineResult.snapshotId;
  if (!snapshotId || pipelineResult.status !== "PUBLISHED") {
    return null;
  }

  const publishedAt = new Date().toISOString();

  return {
    profileId: `profile-${candidate.id}`,
    candidateId: candidate.id,
    lastVerifiedAt: null,
    nextVerificationAt: publishedAt,
    verificationFrequency: "ON_DEMAND",
    neverVerified: true,
    sourceChanged: false,
    newEvidenceAvailable: false,
    recentlyPublished: true,
    snapshot: {
      profileId: `profile-${candidate.id}`,
      candidateId: candidate.id,
      doctorName: candidate.name,
      crm: candidate.crm,
      rqe: candidate.rqe,
      institutions: candidate.currentInstitutions?.map((i) => i.name) ?? [],
      residency: candidate.residency?.map((r) => r.program) ?? [],
      specialty: candidate.specialty,
      city: candidate.city,
      state: candidate.state,
      sources: ["discovery", "connectors"],
      status: "active",
      publishedAt,
      version: pipelineResult.profileVersion ?? 1,
    },
  };
}

async function waitForFactoryRun(
  factory: FactoryOrchestrator,
  runId: string,
  timeoutMs: number,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const run = factory.getRuns().find((r) => r.runId === runId);
    if (run?.finishedAt) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export async function runEsPilotCatalog(): Promise<EsPilotCatalogReport> {
  const generatedAt = new Date().toISOString();
  const phases = {
    discoveryMs: 0,
    evidenceMs: 0,
    protocolMs: 0,
    publicationMs: 0,
    verificationMs: 0,
    factoryMs: 0,
  };

  resetWorkflowContext();

  const discoveryStarted = performance.now();
  const discoveryEngine = new DiscoveryEngine({ queue: new DiscoveryQueue() });
  const discoveryResult: DiscoveryRunResult = await discoveryEngine.run();
  phases.discoveryMs = Math.round(performance.now() - discoveryStarted);

  const evidenceStarted = performance.now();
  const connectorManager = new ConnectorManager();
  for (const connector of defaultConnectors) {
    connectorManager.register(connector);
  }
  const connectorRun = await connectorManager.runAll();
  const evidenceEngine = new EvidenceAcquisitionEngine();
  const evidenceResult = evidenceEngine.acquire(toConnectorInputs(connectorManager, connectorRun));
  phases.evidenceMs = Math.round(performance.now() - evidenceStarted);

  const protocolEngine = new ProtocolEngine({ recordAudit: false });
  const publicationPipeline = new PublicationPipeline();
  const verificationEngine = new VerificationEngine({
    runner: new VerificationRunner({ connectorManager }),
  });

  const protocolStarted = performance.now();
  const publicationStarted = performance.now();
  let publicationMsAccum = 0;
  const verificationStarted = performance.now();
  let verificationMsAccum = 0;

  const candidateResults: PilotCandidateResult[] = [];
  const reviewRules: Record<string, number> = {};
  const failedRules: Record<string, number> = {};
  const missingFields: Record<string, number> = {};
  const conflictsByType: Record<string, number> = {};
  const conflictsByConnector: Record<string, number> = {};
  const coverageBySection: Record<string, number> = {};
  const coverageValues: number[] = [];

  let autoPublish = 0;
  let humanReview = 0;
  let reject = 0;
  let publicationAttempted = 0;
  let publicationPublished = 0;
  let publicationReviewCases = 0;
  let publicationFailed = 0;
  let publicationNoChange = 0;
  let verificationAttempted = 0;
  let verificationCompleted = 0;
  let verificationFailed = 0;

  const uniqueCandidates = discoveryResult.candidates;
  const queueByCandidate = new Map(
    discoveryResult.queueItems.map((item) => [item.candidate.candidateId, item]),
  );

  for (const candidate of uniqueCandidates) {
    registerDiscoveredCandidate(candidate);
    const queueItem = queueByCandidate.get(candidate.candidateId);
    const evidencePackage = evidenceEngine.getPackage(candidate.candidateId);
    const baseEvidence = buildEvidenceFromDiscovery(candidate);
    const evidence = enrichEvidenceFromPackage(baseEvidence, evidencePackage ?? undefined);
    setCandidateEvidence(candidate.candidateId, evidence);

    const doctor = mapDiscoveryToDoctorCandidate(candidate);
    const decision = protocolEngine.evaluate(doctor, evidence);

    if (decision.outcome === "AUTO_PUBLISH") {
      autoPublish += 1;
    } else if (decision.outcome === "REJECT") {
      reject += 1;
    } else {
      humanReview += 1;
    }

    trackRules(reviewRules, decision.pendingRules);
    trackRules(failedRules, decision.failedRules);

    for (const field of decision.evidenceReport.fields) {
      if (field.status === "pending" || field.status === "insufficient") {
        increment(missingFields, field.field);
      }
    }

    if (evidencePackage) {
      for (const conflict of evidencePackage.conflicts) {
        increment(conflictsByType, conflict.type);
        for (const value of conflict.values) {
          for (const source of value.sources) {
            increment(conflictsByConnector, source);
          }
        }
      }
      const covAvg = evidencePackage.coverage.reduce((sum, c) => sum + c.percentage, 0) /
        Math.max(evidencePackage.coverage.length, 1);
      coverageValues.push(covAvg);
      for (const section of evidencePackage.coverage) {
        increment(coverageBySection, section.section, section.percentage);
      }
    }

    let published = false;
    let publicationStatus: PipelineResult["status"] | undefined;
    let verified = false;

    if (decision.outcome === "AUTO_PUBLISH") {
      publicationAttempted += 1;
      const pubStart = performance.now();
      const pubResult = publicationPipeline.execute({
        candidate: doctor,
        evidence,
        decision,
        protocolDecisionId: `pd-${candidate.candidateId}`,
        evidenceReportId: `er-${candidate.candidateId}`,
      });
      publicationMsAccum += Math.round(performance.now() - pubStart);
      publicationStatus = pubResult.status;

      if (pubResult.status === "PUBLISHED" || pubResult.status === "ALREADY_PUBLISHED") {
        publicationPublished += 1;
        published = true;
      } else if (pubResult.status === "BLOCKED" || pubResult.reviewCase) {
        publicationReviewCases += 1;
      } else if (pubResult.status === "REJECTED" || pubResult.status === "VERIFICATION_FAILED") {
        publicationFailed += 1;
      } else {
        publicationNoChange += 1;
      }

      if (published) {
        const profile = buildVerificationProfile(doctor, pubResult);
        if (profile) {
          verificationEngine.registerProfile(profile);
          verificationAttempted += 1;
          const verStart = performance.now();
          try {
            await verificationEngine.runVerification(profile.profileId);
            verificationCompleted += 1;
            verified = true;
          } catch {
            verificationFailed += 1;
          }
          verificationMsAccum += Math.round(performance.now() - verStart);
        }
      }
    }

    candidateResults.push({
      candidateId: candidate.candidateId,
      name: candidate.nome,
      specialty: candidate.especialidade,
      city: candidate.cidade,
      crm: candidate.crm ? `CRM-${candidate.crmUf} ${candidate.crm}` : "",
      confidence: candidate.confidence,
      discoveryStatus: queueItem?.status ?? candidate.status,
      evidenceCount: evidence.length,
      conflictCount: evidencePackage?.conflicts.length ?? 0,
      coverageAverage: evidencePackage
        ? average(
            evidencePackage.coverage.map((c) => c.percentage),
          )
        : 0,
      protocolOutcome: decision.outcome,
      suggestedNivel: decision.suggestedNivel,
      pendingRules: decision.pendingRules.map((r) => r.id),
      failedRules: decision.failedRules.map((r) => r.id),
      published,
      publicationStatus,
      verified,
    });
  }

  phases.protocolMs = Math.round(performance.now() - protocolStarted - publicationMsAccum - verificationMsAccum);
  phases.publicationMs = publicationMsAccum;
  phases.verificationMs = verificationMsAccum;

  const factoryStarted = performance.now();
  const factory = new FactoryOrchestrator();
  const factoryRun = await factory.startRun({ schedule: "ON_DEMAND" });
  await waitForFactoryRun(factory, factoryRun.runId, 30_000);
  const factoryCompleted = factory.getRuns().find((r) => r.runId === factoryRun.runId);
  phases.factoryMs = Math.round(performance.now() - factoryStarted);

  const duplicates = discoveryResult.queueItems.filter((i) => i.status === "DUPLICATE").length;
  const ignored = discoveryResult.queueItems.filter((i) => i.status === "IGNORED").length;
  const readyForEvidence = discoveryResult.queueItems.filter(
    (i) => i.status === "READY_FOR_EVIDENCE",
  ).length;
  const discovered = discoveryResult.queueItems.filter((i) => i.status === "DISCOVERED").length;

  const bySpecialty: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  for (const candidate of uniqueCandidates) {
    increment(bySpecialty, candidate.especialidade);
    increment(byCity, candidate.cidade);
  }

  const connectorHealth: Record<string, string> = {};
  let successCount = 0;
  let failureCount = 0;
  let latencySum = 0;

  for (const result of connectorRun.results) {
    connectorHealth[result.connectorId] = connectorManager
      .getHealthMonitor()
      .getStatus(result.connectorId);
    if (result.success) {
      successCount += 1;
    } else {
      failureCount += 1;
    }
    latencySum += result.latencyMs;
  }

  const curatedCatalog = buildCoverageReport(catalogSeed as CatalogImportPayload);

  return {
    generatedAt,
    scope: {
      state: SCOPED_STATE,
      specialties: [...SCOPED_SPECIALTIES],
    },
    phases,
    discovery: {
      candidatesFound: discoveryResult.metrics.candidatesFound,
      uniqueCandidates: uniqueCandidates.length,
      duplicates,
      ignored,
      readyForEvidence,
      discovered,
      sourceHealth: discoveryResult.sourceHealth,
      sourceFailures: discoveryResult.metrics.sourceFailures,
      bySpecialty,
      byCity,
    },
    evidence: {
      packagesCreated: evidenceResult.packages.length,
      packagesRejected: evidenceResult.rejectedCount,
      totalConflicts: evidenceResult.conflictCount,
      averageCoverage: average(coverageValues),
      conflictsByType,
      conflictsByConnector,
      coverageBySection,
    },
    protocol: {
      autoPublish,
      humanReview,
      reject,
      reviewRules,
      failedRules,
      missingFields,
    },
    publication: {
      attempted: publicationAttempted,
      published: publicationPublished,
      reviewCases: publicationReviewCases,
      failed: publicationFailed,
      noChange: publicationNoChange,
    },
    verification: {
      attempted: verificationAttempted,
      completed: verificationCompleted,
      failed: verificationFailed,
      pendingReview: verificationEngine.getHistory().listPendingReview().length,
    },
    connectors: {
      health: connectorHealth,
      successCount,
      failureCount,
      averageLatencyMs: connectorRun.results.length
        ? Math.round(latencySum / connectorRun.results.length)
        : 0,
    },
    factory: {
      runId: factoryCompleted?.runId ?? null,
      status: factoryCompleted?.status ?? null,
      durationMs: factoryCompleted?.durationMs ?? null,
      published: factoryCompleted?.published ?? 0,
      reviewCases: factoryCompleted?.reviewCases ?? 0,
      errors: factoryCompleted?.errors.length ?? 0,
    },
    curatedCatalog,
    candidates: candidateResults,
  };
}
