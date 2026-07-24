import {
  DEFAULT_BACKOFF_BASE_MS,
  DEFAULT_BACKOFF_MAX_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RATE_LIMIT_PER_HOUR,
  DEFAULT_RATE_LIMIT_PER_MINUTE,
} from "../../constants";
import type { SourceConnector } from "../../ports/source-connector";
import { validateNormalizedRecord } from "../../validation-layer";
import type {
  AcademicEvidenceRecord,
  ConnectorAuthResult,
  ConnectorFetchResult,
  ConnectorHealthStatus,
  ConnectorSourceType,
  NormalizedConnectorRecord,
  RateLimitConfig,
  ValidationResult,
} from "../../types";

import type { AcademicEvidenceKind, AcademicRawRecord } from "./types";

export type AcademicMockConnectorOptions = {
  id: string;
  name: string;
  version?: string;
  priority: number;
  kind: AcademicEvidenceKind;
  sourceType: ConnectorSourceType;
  health?: ConnectorHealthStatus;
  records: AcademicRawRecord[];
  shouldFail?: boolean;
  supported?: boolean;
  rateLimit?: Partial<RateLimitConfig>;
};

function recordId(sourceId: string, nome: string): string {
  const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  return `${sourceId}-${slug}`;
}

function toAcademicEvidence(
  raw: AcademicRawRecord,
  kind: AcademicEvidenceKind,
): AcademicEvidenceRecord {
  return {
    kind,
    institution: raw.institution,
    program: raw.program,
    degree: raw.degree,
    startYear: raw.startYear,
    endYear: raw.endYear,
    source: raw.source,
    confidence: raw.confidence ?? 0.8,
  };
}

/**
 * Cria um SourceConnector acadêmico mockado, compatível com ConnectorManager.
 * Preparado para substituição por implementação real via AcademicEvidenceConnector.
 */
export function createAcademicMockConnector(
  options: AcademicMockConnectorOptions,
): SourceConnector<AcademicRawRecord> {
  const version = options.version ?? "1.0.0";
  const health = options.health ?? "ONLINE";
  const supported = options.supported ?? true;

  return {
    id: options.id,
    name: options.name,
    version,
    priority: options.priority,

    supports() {
      return supported;
    },

    health() {
      return health;
    },

    async authenticate(): Promise<ConnectorAuthResult> {
      if (options.shouldFail && health === "OFFLINE") {
        return {
          success: false,
          error: `Autenticação falhou para ${options.name} (mock acadêmico).`,
          authenticatedAt: new Date().toISOString(),
        };
      }

      return {
        success: true,
        token: `mock-academic-token-${options.id}`,
        authenticatedAt: new Date().toISOString(),
      };
    },

    async fetch(): Promise<ConnectorFetchResult<AcademicRawRecord>> {
      const started = performance.now();

      if (options.shouldFail) {
        return {
          success: false,
          data: [],
          error: `Fetch falhou para ${options.name} (mock acadêmico).`,
          fetchedAt: new Date().toISOString(),
          latencyMs: Math.round(performance.now() - started),
        };
      }

      return {
        success: true,
        data: options.records.map((record) => ({ ...record })),
        fetchedAt: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - started),
      };
    },

    normalize(raw: AcademicRawRecord): NormalizedConnectorRecord[] {
      const crmUf = raw.crm_uf ?? raw.estado ?? "ES";
      const crm = raw.crm ? `CRM-${crmUf} ${raw.crm}` : "";
      const fetchedAt = new Date().toISOString();
      const academicEvidence = toAcademicEvidence(raw, options.kind);

      return [
        {
          recordId: recordId(options.id, raw.nome),
          sourceId: options.id,
          sourceType: options.sourceType,
          nome: raw.nome,
          crm,
          crmUf,
          especialidade: raw.especialidade ?? "Medicina",
          cidade: raw.cidade ?? "Vitória",
          estado: raw.estado ?? "ES",
          urlOrigem: raw.source,
          confidence: raw.confidence ?? 0.8,
          fetchedAt,
          academicEvidence: [academicEvidence],
        },
      ];
    },

    validate(record: NormalizedConnectorRecord): ValidationResult {
      return validateNormalizedRecord(record);
    },

    rateLimit(): RateLimitConfig {
      return {
        perMinute: options.rateLimit?.perMinute ?? DEFAULT_RATE_LIMIT_PER_MINUTE,
        perHour: options.rateLimit?.perHour ?? DEFAULT_RATE_LIMIT_PER_HOUR,
        maxRetries: options.rateLimit?.maxRetries ?? DEFAULT_MAX_RETRIES,
        backoffBaseMs: options.rateLimit?.backoffBaseMs ?? DEFAULT_BACKOFF_BASE_MS,
        backoffMaxMs: options.rateLimit?.backoffMaxMs ?? DEFAULT_BACKOFF_MAX_MS,
      };
    },
  };
}
