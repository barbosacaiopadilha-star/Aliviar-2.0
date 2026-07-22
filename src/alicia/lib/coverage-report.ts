import { ingestCatalogFromPayload } from "@/alicia/catalog-factory";
import { isProfileComplete } from "@/alicia/catalog-factory/quality/profile-quality";
import type { CatalogImportPayload } from "@/alicia/infrastructure/import/import-types";

import { ES_PRIORITY_CITY_NAMES } from "./es-cities";

export type DoctorCoverageRow = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  sourceCount: number;
  sources: string[];
  complete: boolean;
  pendingFields: string[];
  institutions: string[];
};

export type CoverageReport = {
  generatedAt: string;
  totalDoctors: number;
  cityCount: number;
  specialties: Record<string, number>;
  completeProfiles: number;
  profilesInVerification: number;
  averageSourcesPerDoctor: number;
  mappedInstitutions: string[];
  doctors: DoctorCoverageRow[];
  priorityCitiesCovered: string[];
  priorityCitiesWithoutDoctors: string[];
};

export function buildCoverageReport(payload: CatalogImportPayload): CoverageReport {
  const referenceDate = new Date().toISOString().slice(0, 10);
  const ingestion = ingestCatalogFromPayload(payload, "json", referenceDate);

  const doctors: DoctorCoverageRow[] = ingestion.operationalRecords.map((record) => {
    const institutions = [
      record.importRecord.mainInstitution,
      ...record.importRecord.institutions.map((item) => item.name),
    ];

    return {
      id: record.doctorId,
      name: record.importRecord.name,
      specialty: record.importRecord.specialty,
      city: record.importRecord.location.city,
      sourceCount: record.importRecord.transparency.sources.length,
      sources: record.importRecord.transparency.sources.map((source) => source.name),
      complete: isProfileComplete(record.quality),
      pendingFields: record.importRecord.transparency.unverifiedFields,
      institutions: [...new Set(institutions)],
    };
  });

  const citiesWithDoctors = new Set(doctors.map((doctor) => doctor.city));
  const mappedInstitutions = [
    ...new Set(doctors.flatMap((doctor) => doctor.institutions)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const priorityCitiesCovered = ES_PRIORITY_CITY_NAMES.filter((city) =>
    citiesWithDoctors.has(city),
  );
  const priorityCitiesWithoutDoctors = ES_PRIORITY_CITY_NAMES.filter(
    (city) => !citiesWithDoctors.has(city),
  );

  return {
    generatedAt: referenceDate,
    totalDoctors: ingestion.metrics.totalDoctors,
    cityCount: Object.keys(ingestion.metrics.coverageByCity).length,
    specialties: ingestion.metrics.coverageBySpecialty,
    completeProfiles: ingestion.metrics.completeProfiles,
    profilesInVerification: doctors.filter((doctor) => doctor.pendingFields.length > 0).length,
    averageSourcesPerDoctor: ingestion.metrics.averageSourcesPerDoctor,
    mappedInstitutions,
    doctors,
    priorityCitiesCovered,
    priorityCitiesWithoutDoctors,
  };
}

export function formatCoverageReportMarkdown(report: CoverageReport): string {
  const specialtyLines = Object.entries(report.specialties)
    .map(([name, count]) => `- ${name}: ${count}`)
    .join("\n");

  const doctorLines = report.doctors
    .map((doctor) => {
      const status = doctor.complete ? "completo" : "em verificação";
      return [
        `### ${doctor.name}`,
        `- Especialidade: ${doctor.specialty}`,
        `- Cidade: ${doctor.city}`,
        `- Status: ${status}`,
        `- Fontes (${doctor.sourceCount}): ${doctor.sources.join("; ")}`,
        doctor.pendingFields.length > 0
          ? `- Em verificação: ${doctor.pendingFields.join(", ")}`
          : "- Em verificação: nenhum campo pendente",
        `- Instituições: ${doctor.institutions.join("; ")}`,
      ].join("\n");
    })
    .join("\n\n");

  return `# AliCIA — Relatório de Cobertura Espírito Santo

Gerado em: ${report.generatedAt}

## Resumo

| Indicador | Valor |
|-----------|-------|
| Médicos no catálogo | ${report.totalDoctors} |
| Cidades com perfis | ${report.cityCount} |
| Perfis completos | ${report.completeProfiles} |
| Perfis com campos em verificação | ${report.profilesInVerification} |
| Média de fontes por perfil | ${report.averageSourcesPerDoctor} |
| Instituições mapeadas | ${report.mappedInstitutions.length} |

## Especialidades

${specialtyLines}

## Cidades prioritárias com cobertura

${report.priorityCitiesCovered.map((city) => `- ${city}`).join("\n") || "- Nenhuma"}

## Cidades prioritárias sem perfis ainda

${report.priorityCitiesWithoutDoctors.map((city) => `- ${city}`).join("\n") || "- Nenhuma"}

## Instituições mapeadas

${report.mappedInstitutions.map((name) => `- ${name}`).join("\n")}

## Perfis

${doctorLines}
`;
}
