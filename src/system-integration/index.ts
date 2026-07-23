export type { PlatformJourneyProjection, BuildPlatformJourneyProjectionInput } from "./projections/platform-journey-projection";
export { buildPlatformJourneyProjection } from "./projections/platform-journey-projection";

export {
  createSystemIntegrationStack,
  curationProcessMutationDeps,
  reportDeliveryMutationDeps,
  kernelMutationDeps,
  curationReportMutationDeps,
  curationReportFullDeps,
} from "./composition/system-integration-stack";
export type { SystemIntegrationStack } from "./composition/system-integration-stack";

export { VerticalSliceReportProcessLookup, VerticalSliceReportDeliveryLookup } from "./adapters/report-lookup-adapters";

export { runCurationLifecycle } from "./orchestrators/run-curation-lifecycle";
export type { RunCurationLifecycleInput, RunCurationLifecycleResult } from "./orchestrators/run-curation-lifecycle";

export { runDeliveryLifecycle } from "./orchestrators/run-delivery-lifecycle";
export type { RunDeliveryLifecycleInput, RunDeliveryLifecycleResult } from "./orchestrators/run-delivery-lifecycle";

export { closeJourneyAfterReading } from "./orchestrators/close-journey-after-reading";
export type { CloseJourneyAfterReadingInput } from "./orchestrators/close-journey-after-reading";

export { runFullPlatformFlow } from "./orchestrators/run-full-platform-flow";
export type { RunFullPlatformFlowInput, RunFullPlatformFlowResult } from "./orchestrators/run-full-platform-flow";

export { PlatformFacade } from "./facades/platform-facade";
