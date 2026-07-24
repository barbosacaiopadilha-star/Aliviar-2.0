import { createHash } from "node:crypto";

import type { NormalizedConnectorRecord } from "@/alicia/connectors";

export function hashRawRecord(record: NormalizedConnectorRecord): string {
  const payload = {
    recordId: record.recordId,
    sourceId: record.sourceId,
    nome: record.nome,
    crm: record.crm,
    crmUf: record.crmUf,
    especialidade: record.especialidade,
    cidade: record.cidade,
    estado: record.estado,
    urlOrigem: record.urlOrigem,
    fetchedAt: record.fetchedAt,
  };

  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildPackageId(candidateId: string, version: number): string {
  return `evp-${candidateId}-v${version}`;
}

export function buildConflictId(
  candidateId: string,
  type: string,
  field: string,
): string {
  const hash = createHash("sha256")
    .update(`${candidateId}:${type}:${field}`)
    .digest("hex")
    .slice(0, 8);
  return `evc-${hash}`;
}
