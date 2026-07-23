import {
  InMemoryDeliveryAccessRepository,
  InMemoryDeliveryRepository,
  InMemoryDeliveryVersionRepository,
} from "@/report-delivery";
import {
  InMemoryProcessRepository,
  InMemoryProcessVersionRepository,
  InMemoryResearchRepository,
} from "@/curation-process";
import {
  createCuratorWorkspaceStack,
  curationReportFullDeps,
  curationReportMutationDeps,
  type CuratorWorkspaceStack,
} from "@/curator-workspace";

import {
  VerticalSliceReportDeliveryLookup,
  VerticalSliceReportProcessLookup,
} from "../adapters/report-lookup-adapters";

export interface SystemIntegrationStack extends CuratorWorkspaceStack {
  processRepository: InMemoryProcessRepository;
  processVersionRepository: InMemoryProcessVersionRepository;
  researchRepository: InMemoryResearchRepository;
  deliveryRepository: InMemoryDeliveryRepository;
  deliveryAccessRepository: InMemoryDeliveryAccessRepository;
  deliveryVersionRepository: InMemoryDeliveryVersionRepository;
  reportProcessLookup: VerticalSliceReportProcessLookup;
  reportDeliveryLookup: VerticalSliceReportDeliveryLookup;
}

export async function createSystemIntegrationStack(
  fixedIso = "2026-07-22T12:00:00.000Z",
): Promise<SystemIntegrationStack> {
  const base = await createCuratorWorkspaceStack(fixedIso);
  const reportProcessLookup = new VerticalSliceReportProcessLookup(base.reportRepository);
  const reportDeliveryLookup = new VerticalSliceReportDeliveryLookup(base.reportRepository);

  return {
    ...base,
    processRepository: new InMemoryProcessRepository(),
    processVersionRepository: new InMemoryProcessVersionRepository(),
    researchRepository: new InMemoryResearchRepository(),
    deliveryRepository: new InMemoryDeliveryRepository(),
    deliveryAccessRepository: new InMemoryDeliveryAccessRepository(),
    deliveryVersionRepository: new InMemoryDeliveryVersionRepository(),
    reportProcessLookup,
    reportDeliveryLookup,
  };
}

export function curationProcessMutationDeps(stack: SystemIntegrationStack) {
  return {
    processRepository: stack.processRepository,
    versionRepository: stack.processVersionRepository,
    researchRepository: stack.researchRepository,
    reportLookup: stack.reportProcessLookup,
    ids: stack.ids,
    clock: stack.clock,
  };
}

export function reportDeliveryMutationDeps(stack: SystemIntegrationStack) {
  return {
    deliveryRepository: stack.deliveryRepository,
    versionRepository: stack.deliveryVersionRepository,
    accessRepository: stack.deliveryAccessRepository,
    reportLookup: stack.reportDeliveryLookup,
    ids: stack.ids,
    clock: stack.clock,
  };
}

export function kernelMutationDeps(stack: SystemIntegrationStack) {
  return {
    journeyRepository: stack.journeyRepository,
    timelineRepository: stack.timelineRepository,
    ids: stack.ids,
    clock: stack.clock,
  };
}

export { curationReportMutationDeps, curationReportFullDeps };
