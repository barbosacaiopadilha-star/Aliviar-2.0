import type { SourceConnector } from "./ports/source-connector";
import { createCrmEstadualConnectorWithMetrics } from "./adapters/crm-estadual";
import {
  academicFellowshipConnector,
  academicGraduationConnector,
  academicResidencyConnector,
} from "./adapters/academic";
import {
  cfmConnector,
  hospitalConnector,
  siteInstitucionalConnector,
  sociedadeMedicaConnector,
  universidadeConnector,
} from "./mocks";

export function createDefaultConnectors(): SourceConnector[] {
  return [
    createCrmEstadualConnectorWithMetrics(),
    cfmConnector,
    hospitalConnector,
    universidadeConnector,
    sociedadeMedicaConnector,
    siteInstitucionalConnector,
    academicGraduationConnector,
    academicResidencyConnector,
    academicFellowshipConnector,
  ];
}

export const defaultConnectors = createDefaultConnectors();
