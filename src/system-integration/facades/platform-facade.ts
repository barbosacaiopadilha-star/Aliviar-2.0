import type { SystemIntegrationStack } from "../composition/system-integration-stack";
import {
  buildPlatformJourneyProjection,
  type BuildPlatformJourneyProjectionInput,
  type PlatformJourneyProjection,
} from "../projections/platform-journey-projection";
import { runFullPlatformFlow, type RunFullPlatformFlowInput, type RunFullPlatformFlowResult } from "../orchestrators/run-full-platform-flow";

export class PlatformFacade {
  constructor(private readonly stack: SystemIntegrationStack) {}

  async getJourneyProjection(
    input: BuildPlatformJourneyProjectionInput,
  ): Promise<PlatformJourneyProjection> {
    return buildPlatformJourneyProjection(this.stack, input);
  }

  async runFullLifecycle(input: RunFullPlatformFlowInput): Promise<RunFullPlatformFlowResult> {
    return runFullPlatformFlow(this.stack, input);
  }
}
