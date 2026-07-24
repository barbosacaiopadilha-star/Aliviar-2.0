import type {
  ConnectorAuthResult,
  ConnectorFetchResult,
  ConnectorHealthStatus,
  NormalizedConnectorRecord,
  RateLimitConfig,
  ValidationResult,
} from "../types";

export interface SourceConnector<TRaw = unknown> {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly priority: number;

  supports(): boolean;
  health(): ConnectorHealthStatus;
  authenticate(): Promise<ConnectorAuthResult>;
  fetch(): Promise<ConnectorFetchResult<TRaw>>;
  normalize(raw: TRaw): NormalizedConnectorRecord[];
  validate(record: NormalizedConnectorRecord): ValidationResult;
  rateLimit(): RateLimitConfig;
}
