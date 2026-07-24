import { createAcademicMockConnector } from "./create-academic-mock-connector";
import {
  ACADEMIC_FELLOWSHIP_MOCK,
  ACADEMIC_GRADUATION_MOCK,
  ACADEMIC_RESIDENCY_MOCK,
} from "./mock-data";

export { createAcademicMockConnector } from "./create-academic-mock-connector";
export type { AcademicMockConnectorOptions } from "./create-academic-mock-connector";

export const academicGraduationConnector = createAcademicMockConnector({
  id: "academic-graduation",
  name: "Graduação Médica — MEC/Universidades (Mock)",
  priority: 7,
  kind: "graduation",
  sourceType: "academic-graduation",
  health: "ONLINE",
  records: ACADEMIC_GRADUATION_MOCK,
});

export const academicResidencyConnector = createAcademicMockConnector({
  id: "academic-residency",
  name: "Residência Médica — CNRM/Hospitais (Mock)",
  priority: 8,
  kind: "residency",
  sourceType: "academic-residency",
  health: "ONLINE",
  records: ACADEMIC_RESIDENCY_MOCK,
});

export const academicFellowshipConnector = createAcademicMockConnector({
  id: "academic-fellowship",
  name: "Fellowship — Programas Avançados (Mock)",
  priority: 9,
  kind: "fellowship",
  sourceType: "academic-fellowship",
  health: "ONLINE",
  records: ACADEMIC_FELLOWSHIP_MOCK,
});

export const defaultAcademicConnectors = [
  academicGraduationConnector,
  academicResidencyConnector,
  academicFellowshipConnector,
];
