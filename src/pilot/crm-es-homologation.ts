import { ConnectorManager } from "@/alicia/connectors";
import { createCrmEstadualConnectorWithMetrics } from "@/alicia/connectors/adapters/crm-estadual";
import {
  buildCrmConfigReport,
  buildProblemsList,
  classifyCrmHomologation,
  compareCrmDiscovery,
  runCrmHomologationProbe,
} from "@/alicia/connectors/adapters/crm-estadual/homologation";
import type { CrmEsHomologationReport, CrmPipelineImpact } from "@/alicia/connectors/adapters/crm-estadual/homologation";
import { DiscoveryEngine, DiscoveryQueue } from "@/alicia/discovery";
import { EvidenceAcquisitionEngine } from "@/alicia/evidence-acquisition";
import type { ConnectorEvidenceInput } from "@/alicia/evidence-acquisition";
import { DryRunPublicationPipeline } from "@/alicia/factory/dry-run-publication-pipeline";
import { OperationsEngine } from "@/alicia/operations";
import { mockOperationsInputHealthy } from "@/alicia/operations/mocks/operations-input";
import { ProtocolEngine } from "@/alicia/protocol-engine";
import type { EvidenceField } from "@/alicia/protocol-engine";

import {
  mapDiscoveryToDoctorCandidate,
  registerDiscoveredCandidate,
  resetWorkflowContext,
  setCandidateEvidence,
} from "@/alicia/event-bus/integration/workflow-context";

import { runEsPilotCatalog } from "./es-pilot-catalog";

const BASELINE = {
  coverageAverage: 100,
  humanReview: 6,
  autoPublish: 0,
  source: "PILOT_ES_REPORT.md — Missão 008",
};

function toConnectorInput(
  connectorId: string,
  connectorName: string,
  connectorVersion: string,
  result: Awaited<ReturnType<ConnectorManager["runConnector"]>>,
  fetchedAt: string,
): ConnectorEvidenceInput {
  return {
    connectorId,
    connectorVersion,
    connectorName,
    success: result.success,
    records: result.records,
    fetchedAt,
  };
}

async function runCrmFocusedPipeline(): Promise<CrmPipelineImpact> {
  resetWorkflowContext();

  const discoveryEngine = new DiscoveryEngine({ queue: new DiscoveryQueue() });
  const discoveryResult = await discoveryEngine.run();

  const connectorManager = new ConnectorManager();
  const crmConnector = createCrmEstadualConnectorWithMetrics();
  connectorManager.register(crmConnector);

  const crmRun = await connectorManager.runConnector("crm-estadual");
  const fetchedAt = new Date().toISOString();

  const evidenceEngine = new EvidenceAcquisitionEngine();
  evidenceEngine.acquire([
    toConnectorInput("crm-estadual", crmConnector.name, crmConnector.version, crmRun, fetchedAt),
  ]);

  const protocolEngine = new ProtocolEngine({ recordAudit: false });
  const publicationPipeline = new DryRunPublicationPipeline();
  const operationsEngine = new OperationsEngine();

  let humanReview = 0;
  let autoPublish = 0;
  let publicationDryRun = 0;
  const verificationAttempted = 0;
  const coverageValues: number[] = [];

  for (const candidate of discoveryResult.candidates) {
    registerDiscoveredCandidate(candidate);
    const evidencePackage = evidenceEngine.getPackage(candidate.candidateId);
    const evidence = evidencePackage?.evidence.map((item) => ({
      id: item.id,
      name: item.value,
      type: item.category,
      level: 1 as const,
      consultedAt: fetchedAt,
      responsible: "crm-homologation",
      supportsFields: [item.field as EvidenceField],
    })) ?? [];

    setCandidateEvidence(candidate.candidateId, evidence);
    const doctor = mapDiscoveryToDoctorCandidate(candidate);
    const decision = protocolEngine.evaluate(doctor, evidence);

    if (decision.outcome === "AUTO_PUBLISH") {
      autoPublish += 1;
      const pub = publicationPipeline.execute({
        candidate: doctor,
        evidence,
        decision,
        protocolDecisionId: `pd-homolog-${candidate.candidateId}`,
        evidenceReportId: `er-homolog-${candidate.candidateId}`,
      });
      if (pub.status === "NO_CHANGE") {
        publicationDryRun += 1;
      }
    } else {
      humanReview += 1;
    }

    if (evidencePackage) {
      const avg =
        evidencePackage.coverage.reduce((sum, c) => sum + c.percentage, 0) /
        Math.max(evidencePackage.coverage.length, 1);
      coverageValues.push(avg);
    }
  }

  const opsSnapshot = operationsEngine.buildFromInput({
    ...mockOperationsInputHealthy,
    discovery: {
      metrics: {
        candidatesFound: discoveryResult.metrics.candidatesFound,
        readyForEvidence: discoveryResult.metrics.readyForEvidence,
        averageDurationMs: discoveryResult.metrics.averageDurationMs,
        sourcesExecuted: discoveryResult.metrics.sourcesExecuted,
        sourceFailures: discoveryResult.metrics.sourceFailures,
      },
      queueSize: discoveryResult.candidates.length,
    },
    evidence: {
      metrics: {
        packagesCreated: evidenceEngine.getPackages().length,
        packagesRejected: 0,
        candidatesProcessed: discoveryResult.candidates.length,
        averageCoverage:
          coverageValues.length === 0
            ? 0
            : Math.round(
                coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length,
              ),
      },
      packageCount: evidenceEngine.getPackages().length,
    },
    connectors: {
      metrics: {
        totalExecutions: 1,
        successfulExecutions: crmRun.success ? 1 : 0,
        failedExecutions: crmRun.success ? 0 : 1,
        retries: crmRun.retries,
        averageLatencyMs: crmRun.latencyMs,
        availability: crmRun.success ? 1 : 0,
      },
      connectors: [
        {
          connectorId: "crm-estadual",
          name: crmConnector.name,
          health: crmConnector.health(),
          availability: crmRun.success ? 1 : 0,
          averageLatencyMs: crmRun.latencyMs,
        },
      ],
      retryQueueSize: 0,
    },
    protocol: {
      auditCount: discoveryResult.candidates.length,
      approvedCount: autoPublish,
      rejectedCount: 0,
      reviewCaseCount: humanReview,
    },
    publication: {
      publishedCount: 0,
      failedCount: 0,
      reviewCaseCount: publicationDryRun,
    },
    workflow: {
      ...mockOperationsInputHealthy.workflow,
      events: [],
    },
  });

  const coverageAverage =
    coverageValues.length === 0
      ? 0
      : Math.round(coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length);

  return {
    coverageAverage,
    coverageDeltaVsBaseline: coverageAverage - BASELINE.coverageAverage,
    humanReview,
    humanReviewDelta: humanReview - BASELINE.humanReview,
    autoPublish,
    autoPublishDelta: autoPublish - BASELINE.autoPublish,
    publicationDryRun,
    verificationAttempted,
    operationsBottlenecks: opsSnapshot.bottlenecks.length,
  };
}

export async function runCrmEsHomologation(
  env: Record<string, string | undefined> = process.env,
): Promise<CrmEsHomologationReport> {
  const config = buildCrmConfigReport(env);
  const probe = await runCrmHomologationProbe(env);
  const discovery = await compareCrmDiscovery(env);
  const pipeline = await runCrmFocusedPipeline();
  const problems = buildProblemsList(config, probe);

  if (discovery.real.error) {
    problems.push(`Discovery real: ${discovery.real.error}`);
  }

  if (discovery.inconsistencies.length > 0) {
    problems.push(`${discovery.inconsistencies.length} inconsistência(s) mock vs real.`);
  }

  const { classification, reason } = classifyCrmHomologation({
    config,
    probe,
    pipeline,
    problems,
  });

  return {
    generatedAt: new Date().toISOString(),
    mission: "010",
    config,
    probe,
    discovery,
    pipeline,
    problems: [...new Set(problems)],
    classification,
    classificationReason: reason,
    baseline: BASELINE,
  };
}

/** Executa piloto completo em paralelo para métricas de referência (não altera classificação). */
export async function runFullPilotBaseline(): Promise<void> {
  await runEsPilotCatalog();
}
