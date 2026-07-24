import {
  DEFAULT_BACKOFF_BASE_MS,
  DEFAULT_BACKOFF_MAX_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RATE_LIMIT_PER_HOUR,
  DEFAULT_RATE_LIMIT_PER_MINUTE,
} from "../constants";
import type { SourceConnector } from "../ports/source-connector";
import { validateNormalizedRecord } from "../validation-layer";
import type {
  ConnectorAuthResult,
  ConnectorFetchResult,
  ConnectorHealthStatus,
  ConnectorSourceType,
  NormalizedConnectorRecord,
  RateLimitConfig,
  ValidationResult,
} from "../types";
import type { MockRawRecord } from "./mock-data";

export type MockConnectorOptions = {
  id: string;
  name: string;
  version?: string;
  priority: number;
  sourceType: ConnectorSourceType;
  health?: ConnectorHealthStatus;
  records: MockRawRecord[];
  shouldFail?: boolean;
  failUntilAttempt?: number;
  supported?: boolean;
  rateLimit?: Partial<RateLimitConfig>;
};

let attemptCounter = new Map<string, number>();

export function resetMockConnectorAttempts(): void {
  attemptCounter = new Map();
}

function recordId(sourceId: string, nome: string): string {
  const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  return `${sourceId}-${slug}`;
}

export function createMockConnector(options: MockConnectorOptions): SourceConnector<MockRawRecord> {
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
          error: `Autenticação falhou para ${options.name} (mock).`,
          authenticatedAt: new Date().toISOString(),
        };
      }

      return {
        success: true,
        token: `mock-token-${options.id}`,
        authenticatedAt: new Date().toISOString(),
      };
    },

    async fetch(): Promise<ConnectorFetchResult<MockRawRecord>> {
      const started = performance.now();
      const attempts = (attemptCounter.get(options.id) ?? 0) + 1;
      attemptCounter.set(options.id, attempts);

      if (options.shouldFail && (!options.failUntilAttempt || attempts <= options.failUntilAttempt)) {
        return {
          success: false,
          data: [],
          error: `Fetch falhou para ${options.name} (mock).`,
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

    normalize(raw: MockRawRecord): NormalizedConnectorRecord[] {
      const crmUf = raw.crm_uf ?? raw.estado ?? "ES";
      const crm = raw.crm ? `CRM-${crmUf} ${raw.crm}` : "";
      const fetchedAt = new Date().toISOString();

      return [
        {
          recordId: recordId(options.id, raw.nome),
          sourceId: options.id,
          sourceType: options.sourceType,
          nome: raw.nome,
          crm,
          crmUf,
          especialidade: raw.especialidade,
          cidade: raw.cidade,
          estado: raw.estado,
          urlOrigem: raw.url ?? `https://mock.alicia.local/${options.id}`,
          telefone: raw.telefone,
          confidence: raw.confidence ?? 0.75,
          fetchedAt,
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
