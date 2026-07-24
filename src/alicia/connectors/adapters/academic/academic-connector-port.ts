import type {
  ConnectorAuthResult,
  ConnectorFetchResult,
  ConnectorHealthStatus,
  NormalizedConnectorRecord,
  RateLimitConfig,
  ValidationResult,
} from "../../types";

import type { AcademicEvidenceKind, AcademicRawRecord } from "./types";

/**
 * Porta para adapters de evidência acadêmica.
 * Implementações mockadas hoje; preparadas para APIs reais (MEC, EMESCAM, CNRM, etc.).
 */
export interface AcademicEvidenceConnector {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly priority: number;
  readonly kind: AcademicEvidenceKind;

  supports(): boolean;
  health(): ConnectorHealthStatus;
  authenticate(): Promise<ConnectorAuthResult>;
  fetch(): Promise<ConnectorFetchResult<AcademicRawRecord>>;
  normalize(raw: AcademicRawRecord): NormalizedConnectorRecord[];
  validate(record: NormalizedConnectorRecord): ValidationResult;
  rateLimit(): RateLimitConfig;
}
