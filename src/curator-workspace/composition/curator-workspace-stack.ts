import {
  InMemoryReportRepository,
  InMemoryReportVersionRepository,
} from "@/curation-report";
import {
  createVerticalSliceStack,
  type VerticalSliceStack,
} from "@/vertical-slice";

import {
  VerticalSliceCaseLookup,
  VerticalSliceJourneyLookup,
  VerticalSlicePatientLookup,
} from "../adapters/curation-report-lookups";

export interface CuratorWorkspaceStack extends VerticalSliceStack {
  reportRepository: InMemoryReportRepository;
  versionRepository: InMemoryReportVersionRepository;
  caseLookup: VerticalSliceCaseLookup;
  journeyLookup: VerticalSliceJourneyLookup;
  patientLookup: VerticalSlicePatientLookup;
}

export async function createCuratorWorkspaceStack(
  fixedIso = "2026-07-22T12:00:00.000Z",
): Promise<CuratorWorkspaceStack> {
  const base = await createVerticalSliceStack(fixedIso);

  return {
    ...base,
    reportRepository: new InMemoryReportRepository(),
    versionRepository: new InMemoryReportVersionRepository(),
    caseLookup: new VerticalSliceCaseLookup(base.caseRepository),
    journeyLookup: new VerticalSliceJourneyLookup(base.journeyRepository),
    patientLookup: new VerticalSlicePatientLookup(base.patientRepository),
  };
}

export function curationReportMutationDeps(stack: CuratorWorkspaceStack) {
  return {
    reportRepository: stack.reportRepository,
    versionRepository: stack.versionRepository,
    ids: stack.ids,
    clock: stack.clock,
  };
}

export function curationReportContextDeps(stack: CuratorWorkspaceStack) {
  return {
    caseLookup: stack.caseLookup,
    journeyLookup: stack.journeyLookup,
    patientLookup: stack.patientLookup,
  };
}

export function curationReportFullDeps(stack: CuratorWorkspaceStack) {
  return {
    ...curationReportMutationDeps(stack),
    ...curationReportContextDeps(stack),
  };
}
