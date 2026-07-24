import { deduplicateCandidates, normalizeDiscoveryRecord } from "@/alicia/discovery/deduplicator";
import { DiscoveryEngine, DiscoveryQueue } from "@/alicia/discovery";
import { crmEstadualDiscoverySource } from "@/alicia/discovery/sources/mock-sources";
import type { DiscoveryCandidate, RawDiscoveryRecord } from "@/alicia/discovery/types";
import type { NormalizedConnectorRecord } from "@/alicia/connectors";
import { createCrmEstadualConnectorWithMetrics } from "../crm-estadual-connector";

import type { CrmDiscoveryCandidateSummary, CrmDiscoveryComparison } from "./types";

function summarize(candidates: DiscoveryCandidate[]): CrmDiscoveryCandidateSummary[] {
  return candidates.map((c) => ({
    candidateId: c.candidateId,
    nome: c.nome,
    crm: c.crm,
    especialidade: c.especialidade,
    cidade: c.cidade,
    confidence: c.confidence,
  }));
}

function crmKey(crm: string, crmUf: string): string {
  return `${crmUf}:${crm}`.replace(/\D/g, "");
}

function connectorRecordToRaw(record: NormalizedConnectorRecord): RawDiscoveryRecord {
  return {
    nome: record.nome,
    crm: record.crm,
    crmUf: record.crmUf,
    especialidade: record.especialidade,
    cidade: record.cidade,
    estado: record.estado,
    urlOrigem: record.urlOrigem,
    telefone: record.telefone,
    confidence: record.confidence,
  };
}

function normalizeFromConnectorRecords(
  records: NormalizedConnectorRecord[],
): DiscoveryCandidate[] {
  const discoveredAt = new Date().toISOString();
  const normalized: DiscoveryCandidate[] = [];

  for (const record of records) {
    const candidate = normalizeDiscoveryRecord(
      connectorRecordToRaw(record),
      "crm-estadual",
      discoveredAt,
    );
    if (candidate) {
      normalized.push(candidate);
    }
  }

  return deduplicateCandidates(normalized).unique;
}

export async function runMockCrmDiscovery(): Promise<{
  unique: DiscoveryCandidate[];
  duplicates: number;
  ignored: number;
  found: number;
}> {
  const engine = new DiscoveryEngine({
    sources: [crmEstadualDiscoverySource],
    queue: new DiscoveryQueue(),
  });
  const result = await engine.run();
  return {
    unique: result.candidates,
    duplicates: result.metrics.duplicates,
    ignored: result.metrics.ignored,
    found: result.metrics.candidatesFound,
  };
}

export async function runRealCrmDiscovery(
  _env: Record<string, string | undefined> = process.env,
): Promise<{
  unique: DiscoveryCandidate[];
  duplicates: number;
  ignored: number;
  found: number;
  fetchSuccess: boolean;
  error?: string;
}> {
  const connector = createCrmEstadualConnectorWithMetrics();
  const fetch = await connector.fetch();

  if (!fetch.success) {
    return {
      unique: [],
      duplicates: 0,
      ignored: 0,
      found: 0,
      fetchSuccess: false,
      error: fetch.error,
    };
  }

  const records: NormalizedConnectorRecord[] = [];
  for (const raw of fetch.data) {
    records.push(...connector.normalize(raw));
  }

  const unique = normalizeFromConnectorRecords(records);
  const rawCount = records.length;

  return {
    unique,
    duplicates: Math.max(0, rawCount - unique.length),
    ignored: Math.max(0, rawCount - unique.length),
    found: rawCount,
    fetchSuccess: true,
  };
}

export async function compareCrmDiscovery(
  env: Record<string, string | undefined> = process.env,
): Promise<CrmDiscoveryComparison> {
  const mock = await runMockCrmDiscovery();
  const real = await runRealCrmDiscovery(env);

  const mockByCrm = new Map(mock.unique.map((c) => [crmKey(c.crm, c.crmUf), c]));
  const realByCrm = new Map(real.unique.map((c) => [crmKey(c.crm, c.crmUf), c]));

  const onlyInMock: string[] = [];
  const onlyInReal: string[] = [];
  const inBoth: string[] = [];
  const inconsistencies: CrmDiscoveryComparison["inconsistencies"] = [];

  for (const [key, mockCandidate] of mockByCrm) {
    const realCandidate = realByCrm.get(key);
    if (!realCandidate) {
      onlyInMock.push(mockCandidate.crm || mockCandidate.nome);
      continue;
    }
    inBoth.push(mockCandidate.crm || mockCandidate.nome);
    if (mockCandidate.nome !== realCandidate.nome) {
      inconsistencies.push({
        crm: mockCandidate.crm,
        field: "nome",
        mock: mockCandidate.nome,
        real: realCandidate.nome,
      });
    }
    if (mockCandidate.especialidade !== realCandidate.especialidade) {
      inconsistencies.push({
        crm: mockCandidate.crm,
        field: "especialidade",
        mock: mockCandidate.especialidade,
        real: realCandidate.especialidade,
      });
    }
    if (mockCandidate.cidade !== realCandidate.cidade) {
      inconsistencies.push({
        crm: mockCandidate.crm,
        field: "cidade",
        mock: mockCandidate.cidade,
        real: realCandidate.cidade,
      });
    }
  }

  for (const [key, realCandidate] of realByCrm) {
    if (!mockByCrm.has(key)) {
      onlyInReal.push(realCandidate.crm || realCandidate.nome);
    }
  }

  return {
    mock: {
      candidatesFound: mock.found,
      unique: mock.unique.length,
      duplicates: mock.duplicates,
      ignored: mock.ignored,
      candidates: summarize(mock.unique),
    },
    real: {
      candidatesFound: real.found,
      unique: real.unique.length,
      duplicates: real.duplicates,
      ignored: real.ignored,
      candidates: summarize(real.unique),
      fetchSuccess: real.fetchSuccess,
      error: real.error,
    },
    onlyInMock,
    onlyInReal,
    inBoth,
    inconsistencies,
  };
}
