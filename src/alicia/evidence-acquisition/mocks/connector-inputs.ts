import type { NormalizedConnectorRecord } from "@/alicia/connectors";
import { ACADEMIC_GRADUATION_MOCK } from "@/alicia/connectors/adapters/academic/mock-data";
import { createAcademicMockConnector } from "@/alicia/connectors/adapters/academic";

import type { ConnectorEvidenceInput } from "../types";

function record(
  overrides: Partial<NormalizedConnectorRecord> & Pick<NormalizedConnectorRecord, "recordId" | "nome">,
): NormalizedConnectorRecord {
  return {
    sourceId: "crm-estadual",
    sourceType: "crm-estadual",
    crm: "45210",
    crmUf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vitória",
    estado: "ES",
    urlOrigem: "https://crm.es.gov.br/mock/ricardo",
    confidence: 0.9,
    fetchedAt: "2026-07-23T00:00:00.000Z",
    ...overrides,
  };
}

export const mockCrmInput: ConnectorEvidenceInput = {
  connectorId: "crm-estadual",
  connectorVersion: "1.0.0",
  connectorName: "CRM Estadual (ES)",
  success: true,
  fetchedAt: "2026-07-23T00:00:00.000Z",
  records: [
    record({
      recordId: "crm-1",
      nome: "Dr. Ricardo Almeida",
      sourceId: "crm-estadual",
      sourceType: "crm-estadual",
      urlOrigem: "https://crm.es.gov.br/mock/ricardo",
    }),
  ],
};

export const mockCfmInput: ConnectorEvidenceInput = {
  connectorId: "cfm",
  connectorVersion: "1.0.0",
  connectorName: "CFM",
  success: true,
  fetchedAt: "2026-07-23T00:00:00.000Z",
  records: [
    record({
      recordId: "cfm-1",
      nome: "Dr. Ricardo Almeida",
      sourceId: "cfm",
      sourceType: "cfm",
      urlOrigem: "https://portal.cfm.org.br/mock/ricardo",
    }),
  ],
};

export const mockCfmConflictInput: ConnectorEvidenceInput = {
  connectorId: "cfm",
  connectorVersion: "1.0.0",
  connectorName: "CFM",
  success: true,
  fetchedAt: "2026-07-23T00:00:00.000Z",
  records: [
    record({
      recordId: "cfm-conflict",
      nome: "Dr. Ricardo Almeida",
      crm: "45210",
      crmUf: "ES",
      sourceId: "cfm",
      sourceType: "cfm",
      especialidade: "Neurocirurgia",
      cidade: "Serra",
      urlOrigem: "https://portal.cfm.org.br/mock/ricardo",
    }),
  ],
};

export const mockHospitalInput: ConnectorEvidenceInput = {
  connectorId: "hospital",
  connectorVersion: "1.0.0",
  connectorName: "Hospital",
  success: true,
  fetchedAt: "2026-07-23T00:00:00.000Z",
  records: [
    record({
      recordId: "hosp-1",
      nome: "Dra. Camila Rocha",
      crm: "29887",
      sourceId: "hospital",
      sourceType: "hospital",
      urlOrigem: "https://icot.org.br/corpo-clinico/camila",
    }),
  ],
};

export const mockFailedInput: ConnectorEvidenceInput = {
  connectorId: "failing",
  connectorVersion: "1.0.0",
  connectorName: "Failing",
  success: false,
  fetchedAt: "2026-07-23T00:00:00.000Z",
  records: [],
};

const academicGraduation = createAcademicMockConnector({
  id: "academic-graduation",
  name: "Graduação (Mock)",
  priority: 7,
  kind: "graduation",
  sourceType: "academic-graduation",
  records: ACADEMIC_GRADUATION_MOCK.filter((item) => item.nome === "Dr. Ricardo Almeida"),
});

export const mockAcademicGraduationInput: ConnectorEvidenceInput = {
  connectorId: "academic-graduation",
  connectorVersion: "1.0.0",
  connectorName: "Graduação (Mock)",
  success: true,
  fetchedAt: "2026-07-23T00:00:00.000Z",
  records: academicGraduation.normalize(ACADEMIC_GRADUATION_MOCK[0]!),
};
