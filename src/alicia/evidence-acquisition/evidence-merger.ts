import type { NormalizedRecordFields } from "./evidence-normalizer";
import type { MergedEvidenceValue, NormalizedCandidateEvidence, NormalizedEvidenceField } from "./types";

function mergeValue(
  existing: MergedEvidenceValue | undefined,
  value: string,
  provenance: MergedEvidenceValue["provenance"][number],
): MergedEvidenceValue {
  if (!existing) {
    return { value, provenance: [provenance] };
  }

  if (existing.value === value) {
    const hasSource = existing.provenance.some(
      (item) =>
        item.connectorId === provenance.connectorId &&
        item.rawHash === provenance.rawHash,
    );
    if (!hasSource) {
      existing.provenance.push(provenance);
    }
    return existing;
  }

  return existing;
}

function upsertField(
  fields: Map<string, NormalizedEvidenceField>,
  field: string,
  value: string,
  provenance: MergedEvidenceValue["provenance"][number],
): void {
  if (!value) {
    return;
  }

  const current = fields.get(field);
  if (!current) {
    fields.set(field, {
      field,
      values: [{ value, provenance: [provenance] }],
    });
    return;
  }

  const existingValue = current.values.find((item) => item.value === value);
  if (existingValue) {
    const hasSource = existingValue.provenance.some(
      (item) =>
        item.connectorId === provenance.connectorId &&
        item.rawHash === provenance.rawHash,
    );
    if (!hasSource) {
      existingValue.provenance.push(provenance);
    }
    return;
  }

  current.values.push({ value, provenance: [provenance] });
}

/** Campos canônicos usados pelo EvidenceScoreCalculator (SECTION_FIELD_MAP). */
const COVERAGE_FIELD_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["primary", "especialidade"],
  ["city", "cidade"],
  ["state", "estado"],
  ["name", "institutionName"],
  ["url", "urlOrigem"],
];

function syncCoverageCanonicalFields(fields: Map<string, NormalizedEvidenceField>): void {
  for (const [canonical, source] of COVERAGE_FIELD_ALIASES) {
    const sourceField = fields.get(source);
    if (!sourceField) {
      continue;
    }

    for (const entry of sourceField.values) {
      for (const provenance of entry.provenance) {
        upsertField(fields, canonical, entry.value, provenance);
      }
    }
  }
}

export class EvidenceMerger {
  merge(
    candidateKey: string,
    candidateId: string,
    records: NormalizedRecordFields[],
  ): NormalizedCandidateEvidence {
    const fields = new Map<string, NormalizedEvidenceField>();

    for (const record of records) {
      const { provenance } = record;

      upsertField(fields, "nome", record.nome, provenance);
      upsertField(fields, "crm", record.crm, provenance);
      upsertField(fields, "crmUf", record.crmUf, provenance);
      upsertField(fields, "especialidade", record.especialidade, provenance);
      upsertField(fields, "cidade", record.cidade, provenance);
      upsertField(fields, "estado", record.estado, provenance);
      upsertField(fields, "urlOrigem", record.urlOrigem, provenance);
      upsertField(fields, "institutionName", record.institutionName, provenance);

      if (record.telefone) {
        upsertField(fields, "telefone", record.telefone, provenance);
      }

      for (const academic of record.academicFields) {
        upsertField(fields, academic.field, academic.value, provenance);
      }
    }

    syncCoverageCanonicalFields(fields);

    return {
      candidateKey,
      candidateId,
      fields,
      rawRecordCount: records.length,
    };
  }
}

// exported for coverage of mergeValue edge path via upsertField
export { mergeValue };
