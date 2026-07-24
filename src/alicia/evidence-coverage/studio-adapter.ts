import { ConnectorManager, defaultConnectors } from "@/alicia/connectors";
import { DiscoveryEngine, DiscoveryQueue } from "@/alicia/discovery";
import { EvidenceAcquisitionEngine } from "@/alicia/evidence-acquisition";
import type { ConnectorEvidenceInput } from "@/alicia/evidence-acquisition";

import { EvidenceCoverageEngine } from "./evidence-coverage-engine";
import type { EvidenceCoverageSnapshot } from "./types";

let sessionEngine: EvidenceCoverageEngine | null = null;
let lastSnapshot: EvidenceCoverageSnapshot | null = null;

function getSession(): EvidenceCoverageEngine {
  if (!sessionEngine) {
    sessionEngine = new EvidenceCoverageEngine();
  }
  return sessionEngine;
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

export function resetEvidenceCoverageSession(): void {
  sessionEngine = null;
  lastSnapshot = null;
}

export async function getEvidenceCoverageSnapshot(
  options: { refresh?: boolean } = {},
): Promise<EvidenceCoverageSnapshot> {
  if (!options.refresh && lastSnapshot) {
    return lastSnapshot;
  }

  const discoveryEngine = new DiscoveryEngine({ queue: new DiscoveryQueue() });
  const discoveryResult = await discoveryEngine.run();

  const connectorManager = new ConnectorManager();
  for (const connector of defaultConnectors) {
    connectorManager.register(connector);
  }
  const connectorRun = await connectorManager.runAll();

  const evidenceEngine = new EvidenceAcquisitionEngine();
  const acquisition = evidenceEngine.acquire(toConnectorInputs(connectorManager, connectorRun));

  const metaByCandidate = new Map<string, { name: string; specialty: string; city: string }>();
  for (const candidate of discoveryResult.candidates) {
    metaByCandidate.set(candidate.candidateId, {
      name: candidate.nome,
      specialty: candidate.especialidade,
      city: candidate.cidade,
    });
  }

  for (const pkg of acquisition.packages) {
    if (!metaByCandidate.has(pkg.candidateId)) {
      metaByCandidate.set(pkg.candidateId, {
        name: pkg.identity.nome ?? pkg.candidateId,
        specialty: pkg.specialties[0]?.primary ?? "—",
        city: pkg.practiceLocations[0]?.city ?? "—",
      });
    }
  }

  const snapshot = getSession().analyze(acquisition.packages, metaByCandidate);
  lastSnapshot = snapshot;
  return snapshot;
}
