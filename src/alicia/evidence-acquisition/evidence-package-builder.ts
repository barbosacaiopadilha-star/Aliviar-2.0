import { createHash } from "node:crypto";

import { NORMALIZATION_VERSION } from "./constants";
import { buildPackageId } from "./hash";
import { mergeProvenanceLists } from "./evidence-provenance";
import type {
  EvidenceItem,
  EvidencePackage,
  EvidencePackageEducation,
  EvidencePackageFellowship,
  EvidencePackageInstitution,
  EvidencePackagePracticeLocation,
  EvidencePackageRegistration,
  EvidencePackageResidency,
  EvidencePackageSpecialty,
  EvidenceConflict,
  CoverageScore,
  NormalizedCandidateEvidence,
} from "./types";

function firstValue(merged: NormalizedCandidateEvidence, field: string): string | undefined {
  const entry = merged.fields.get(field);
  return entry?.values[0]?.value;
}

function allProvenance(merged: NormalizedCandidateEvidence, field: string) {
  const entry = merged.fields.get(field);
  if (!entry) {
    return [];
  }
  return mergeProvenanceLists(entry.values.map((item) => item.provenance));
}

function buildEvidenceItems(merged: NormalizedCandidateEvidence): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  for (const [field, entry] of merged.fields) {
    for (const value of entry.values) {
      const id = createHash("sha256")
        .update(`${merged.candidateId}:${field}:${value.value}`)
        .digest("hex")
        .slice(0, 12);

      items.push({
        id: `evi-${id}`,
        category: categorizeField(field),
        field,
        value: value.value,
        provenance: value.provenance,
      });
    }
  }

  return items;
}

function categorizeField(field: string): string {
  if (field.startsWith("education.")) {
    return "Education";
  }
  if (field.startsWith("residency.")) {
    return "Residency";
  }
  if (field.startsWith("fellowship.")) {
    return "Fellowship";
  }

  switch (field) {
    case "nome":
    case "crm":
    case "crmUf":
    case "telefone":
      return "Identity";
    case "especialidade":
    case "primary":
      return "Specialties";
    case "cidade":
    case "estado":
    case "city":
    case "state":
      return "PracticeLocations";
    case "urlOrigem":
    case "institutionName":
    case "name":
    case "url":
      return "Institutions";
    default:
      return "Other";
  }
}

function buildEducation(
  merged: NormalizedCandidateEvidence,
): EvidencePackageEducation[] {
  const institution = firstValue(merged, "education.institution");
  if (!institution) {
    return [];
  }

  return [
    {
      institution,
      degree: firstValue(merged, "education.degree"),
      graduationYear: firstValue(merged, "education.graduationYear"),
      startYear: firstValue(merged, "education.startYear"),
      endYear: firstValue(merged, "education.endYear"),
      source: firstValue(merged, "education.source"),
      provenance: mergeProvenanceLists([
        allProvenance(merged, "education.institution"),
        allProvenance(merged, "education.graduationYear"),
        allProvenance(merged, "education.degree"),
      ]),
    },
  ];
}

function buildResidency(
  merged: NormalizedCandidateEvidence,
): EvidencePackageResidency[] {
  const institution = firstValue(merged, "residency.institution");
  if (!institution) {
    return [];
  }

  return [
    {
      institution,
      program: firstValue(merged, "residency.program"),
      startYear: firstValue(merged, "residency.startYear"),
      endYear: firstValue(merged, "residency.endYear"),
      source: firstValue(merged, "residency.source"),
      provenance: mergeProvenanceLists([
        allProvenance(merged, "residency.institution"),
        allProvenance(merged, "residency.program"),
      ]),
    },
  ];
}

function buildFellowship(
  merged: NormalizedCandidateEvidence,
): EvidencePackageFellowship[] {
  const institution = firstValue(merged, "fellowship.institution");
  if (!institution) {
    return [];
  }

  return [
    {
      institution,
      program: firstValue(merged, "fellowship.program"),
      startYear: firstValue(merged, "fellowship.startYear"),
      endYear: firstValue(merged, "fellowship.endYear"),
      source: firstValue(merged, "fellowship.source"),
      provenance: mergeProvenanceLists([
        allProvenance(merged, "fellowship.institution"),
        allProvenance(merged, "fellowship.program"),
      ]),
    },
  ];
}

export class EvidencePackageBuilder {
  build(input: {
    merged: NormalizedCandidateEvidence;
    conflicts: EvidenceConflict[];
    coverage: CoverageScore[];
    runId: string;
    version: number;
    createdAt: string;
    updatedAt: string;
  }): EvidencePackage {
    const { merged, conflicts, coverage, runId, version, createdAt, updatedAt } = input;

    const connectorIds = new Set<string>();
    const sourceCount = new Set<string>();

    for (const item of buildEvidenceItems(merged)) {
      for (const prov of item.provenance) {
        connectorIds.add(prov.connectorId);
        sourceCount.add(`${prov.connectorId}:${prov.rawHash}`);
      }
    }

    const registrations: EvidencePackageRegistration[] = [];
    const crm = firstValue(merged, "crm");
    const crmUf = firstValue(merged, "crmUf");
    if (crm && crmUf) {
      registrations.push({
        crm,
        crmUf,
        provenance: mergeProvenanceLists([
          allProvenance(merged, "crm"),
          allProvenance(merged, "crmUf"),
        ]),
      });
    }

    const institutions: EvidencePackageInstitution[] = [];
    const institutionField = merged.fields.get("institutionName");
    if (institutionField) {
      for (const entry of institutionField.values) {
        institutions.push({
          name: entry.value,
          url: firstValue(merged, "urlOrigem"),
          provenance: entry.provenance,
        });
      }
    }

    const specialties: EvidencePackageSpecialty[] = [];
    const specialtyField = merged.fields.get("especialidade");
    if (specialtyField) {
      for (const entry of specialtyField.values) {
        specialties.push({
          primary: entry.value,
          provenance: entry.provenance,
        });
      }
    }

    const practiceLocations: EvidencePackagePracticeLocation[] = [];
    const city = firstValue(merged, "cidade");
    const state = firstValue(merged, "estado");
    if (city && state) {
      practiceLocations.push({
        city,
        state,
        provenance: mergeProvenanceLists([
          allProvenance(merged, "cidade"),
          allProvenance(merged, "estado"),
        ]),
      });
    }

    return {
      packageId: buildPackageId(merged.candidateId, version),
      candidateId: merged.candidateId,
      identity: {
        nome: firstValue(merged, "nome"),
        crm,
        crmUf,
        telefone: firstValue(merged, "telefone"),
      },
      registrations,
      education: buildEducation(merged),
      residency: buildResidency(merged),
      fellowship: buildFellowship(merged),
      institutions,
      specialties,
      practiceLocations,
      evidence: buildEvidenceItems(merged),
      conflicts,
      coverage,
      metadata: {
        createdAt,
        updatedAt,
        version,
        sourceCount: sourceCount.size,
        connectorIds: [...connectorIds],
        normalizationVersion: NORMALIZATION_VERSION,
        runId,
      },
    };
  }
}
