import type { AcademicEvidenceRecord, NormalizedConnectorRecord } from "@/alicia/connectors";
import {
  extractCrmParts,
  normalizeCity,
  normalizeName,
  normalizePhone,
  normalizeSpecialty,
  normalizeUf,
  normalizeUrl,
} from "@/alicia/discovery/normalizer";

import { NORMALIZATION_VERSION } from "./constants";
import { hashRawRecord } from "./hash";
import type { ConnectorEvidenceInput, EvidenceProvenance } from "./types";

export type NormalizedRecordFields = {
  nome: string;
  crm: string;
  crmUf: string;
  especialidade: string;
  cidade: string;
  estado: string;
  urlOrigem: string;
  telefone?: string;
  institutionName: string;
  academicFields: Array<{ field: string; value: string }>;
  provenance: EvidenceProvenance;
};

function academicFieldsFromRecord(
  entries: AcademicEvidenceRecord[] | undefined,
): Array<{ field: string; value: string }> {
  if (!entries || entries.length === 0) {
    return [];
  }

  const fields: Array<{ field: string; value: string }> = [];

  for (const entry of entries) {
    const prefix =
      entry.kind === "graduation"
        ? "education"
        : entry.kind === "residency"
          ? "residency"
          : "fellowship";

    fields.push({ field: `${prefix}.institution`, value: entry.institution });

    if (entry.program) {
      fields.push({ field: `${prefix}.program`, value: entry.program });
    }
    if (entry.degree) {
      fields.push({ field: `${prefix}.degree`, value: entry.degree });
    }
    if (entry.startYear) {
      fields.push({ field: `${prefix}.startYear`, value: entry.startYear });
    }
    if (entry.endYear) {
      fields.push({ field: `${prefix}.endYear`, value: entry.endYear });
      if (entry.kind === "graduation") {
        fields.push({ field: "education.graduationYear", value: entry.endYear });
      }
    }
    if (entry.source) {
      fields.push({ field: `${prefix}.source`, value: entry.source });
    }
  }

  return fields;
}

function institutionFromUrl(url: string): string {
  if (!url) {
    return "";
  }

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return parts[parts.length - 2]!.charAt(0).toUpperCase() + parts[parts.length - 2]!.slice(1);
    }
    return hostname;
  } catch {
    return "";
  }
}

export class EvidenceNormalizer {
  normalize(
    record: NormalizedConnectorRecord,
    input: ConnectorEvidenceInput,
  ): NormalizedRecordFields {
    const { crm, crmUf } = extractCrmParts(record.crm, record.crmUf);
    const urlOrigem = normalizeUrl(record.urlOrigem);

    const provenance: EvidenceProvenance = {
      connectorId: input.connectorId,
      connectorVersion: input.connectorVersion,
      sourceName: input.connectorName,
      sourceUrl: urlOrigem || record.urlOrigem,
      fetchTimestamp: record.fetchedAt || input.fetchedAt,
      rawHash: hashRawRecord(record),
      normalizationVersion: NORMALIZATION_VERSION,
      confidenceDaFonte: record.confidence,
    };

    return {
      nome: normalizeName(record.nome),
      crm,
      crmUf: normalizeUf(crmUf),
      especialidade: normalizeSpecialty(record.especialidade),
      cidade: normalizeCity(record.cidade),
      estado: normalizeUf(record.estado),
      urlOrigem,
      telefone: normalizePhone(record.telefone),
      institutionName: institutionFromUrl(urlOrigem),
      academicFields: academicFieldsFromRecord(record.academicEvidence),
      provenance,
    };
  }
}
