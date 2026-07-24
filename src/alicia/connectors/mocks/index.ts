import type { SourceConnector } from "../ports/source-connector";
import {
  CFM_MOCK,
  CRM_ESTADUAL_MOCK,
  HOSPITAL_MOCK,
  SITE_INSTITUCIONAL_MOCK,
  SOCIEDADE_MEDICA_MOCK,
  UNIVERSIDADE_MOCK,
} from "./mock-data";
import { createMockConnector } from "./mock-connector-factory";

export const crmEstadualMockConnector = createMockConnector({
  id: "crm-estadual",
  name: "CRM Estadual (ES) — Mock",
  priority: 1,
  sourceType: "crm-estadual",
  health: "ONLINE",
  records: CRM_ESTADUAL_MOCK,
});

export const cfmConnector = createMockConnector({
  id: "cfm",
  name: "CFM — Conselho Federal de Medicina",
  priority: 2,
  sourceType: "cfm",
  health: "ONLINE",
  records: CFM_MOCK,
});

export const hospitalConnector = createMockConnector({
  id: "hospital",
  name: "Hospital — Corpo Clínico",
  priority: 3,
  sourceType: "hospital",
  health: "ONLINE",
  records: HOSPITAL_MOCK,
});

export const universidadeConnector = createMockConnector({
  id: "universidade",
  name: "Universidade — Corpo Docente",
  priority: 4,
  sourceType: "universidade",
  health: "DEGRADED",
  records: UNIVERSIDADE_MOCK,
});

export const sociedadeMedicaConnector = createMockConnector({
  id: "sociedade-medica",
  name: "Sociedade Médica",
  priority: 5,
  sourceType: "sociedade-medica",
  health: "ONLINE",
  records: SOCIEDADE_MEDICA_MOCK,
});

export const siteInstitucionalConnector = createMockConnector({
  id: "site-institucional",
  name: "Site Institucional",
  priority: 6,
  sourceType: "site-institucional",
  health: "ONLINE",
  records: SITE_INSTITUCIONAL_MOCK,
});

export const defaultMockConnectors: SourceConnector[] = [
  crmEstadualMockConnector,
  cfmConnector,
  hospitalConnector,
  universidadeConnector,
  sociedadeMedicaConnector,
  siteInstitucionalConnector,
];

export function createFailingMockConnector(id = "failing-connector"): SourceConnector {
  return createMockConnector({
    id,
    name: "Conector com Falha (Mock)",
    priority: 99,
    sourceType: "cfm",
    health: "OFFLINE",
    records: [],
    shouldFail: true,
    supported: true,
    rateLimit: { maxRetries: 1, perMinute: 1, perHour: 1, backoffBaseMs: 1, backoffMaxMs: 1 },
  });
}
