import type { DiscoverySourceResult, SourceHealthStatus } from "../types";

export interface DiscoverySource {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  discover(): Promise<DiscoverySourceResult> | DiscoverySourceResult;
  health(): Promise<SourceHealthStatus> | SourceHealthStatus;
}
