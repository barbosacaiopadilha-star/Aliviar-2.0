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
  ConnectorAuthResult,
  ConnectorFetchResult,
  ConnectorHealthStatus,
  NormalizedConnectorRecord,
  RateLimitConfig,
  ValidationResult,
} from "../../types";
import { CfmSoapClient } from "./cfm-soap-client";
import { isCrmEstadualConfigured, loadCrmEstadualConfig } from "./config";
import { CrmEstadualAdapterMetrics } from "./metrics";
import type { CfmCrmRawRecord, CrmEstadualAdapterConfig } from "./types";

export type CrmEstadualConnectorOptions = {
  config?: CrmEstadualAdapterConfig;
  client?: CfmSoapClient;
  metrics?: CrmEstadualAdapterMetrics;
};

function recordId(nome: string, crm: string): string {
  const slug = nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
  return `crm-estadual-${slug}-${crm}`;
}

function mapSituacaoToConfidence(situacao: string): number {
  const normalized = situacao.toLowerCase();
  if (normalized.includes("ativo") || normalized.includes("regular")) {
    return 0.92;
  }
  if (normalized.includes("aposent")) {
    return 0.75;
  }
  return 0.6;
}

export function createCrmEstadualConnector(
  options: CrmEstadualConnectorOptions = {},
): SourceConnector<CfmCrmRawRecord> {
  const config = options.config ?? loadCrmEstadualConfig();
  const metrics = options.metrics ?? new CrmEstadualAdapterMetrics();
  const client =
    options.client ??
    new CfmSoapClient({
      serviceUrl: config.serviceUrl,
      timeoutMs: config.requestTimeoutMs,
    });

  metrics.setConfigured(isCrmEstadualConfigured(config));

  let runtimeHealth: ConnectorHealthStatus = isCrmEstadualConfigured(config)
    ? "UNKNOWN"
    : "DEGRADED";

  return {
    id: "crm-estadual",
    name: "CRM Estadual (ES) — CFM WS",
    version: "1.0.0",
    priority: 1,

    supports() {
      return config.enabled;
    },

    health() {
      return runtimeHealth;
    },

    async authenticate(): Promise<ConnectorAuthResult> {
      if (!config.enabled) {
        runtimeHealth = "OFFLINE";
        metrics.recordDegraded("Conector CRM Estadual desabilitado.");
        return {
          success: false,
          error: "Conector CRM Estadual desabilitado.",
          authenticatedAt: new Date().toISOString(),
        };
      }

      if (!config.apiKey) {
        runtimeHealth = "DEGRADED";
        metrics.recordDegraded("Chave CFM WS não configurada.");
        return {
          success: false,
          error: "Chave CFM WS não configurada (ALICIA_CFM_WS_CHAVE).",
          authenticatedAt: new Date().toISOString(),
        };
      }

      if (config.seedCrms.length === 0) {
        runtimeHealth = "DEGRADED";
        metrics.recordDegraded("Lista de CRMs seed vazia.");
        return {
          success: false,
          error: "Nenhum CRM seed configurado (ALICIA_CRM_ESTADUAL_SEED_CRMS).",
          authenticatedAt: new Date().toISOString(),
        };
      }

      runtimeHealth = "ONLINE";
      return {
        success: true,
        token: "cfm-ws",
        authenticatedAt: new Date().toISOString(),
      };
    },

    async fetch(): Promise<ConnectorFetchResult<CfmCrmRawRecord>> {
      const started = performance.now();
      const fetchedAt = new Date().toISOString();

      const auth = await this.authenticate();
      if (!auth.success) {
        const latencyMs = Math.round(performance.now() - started);
        metrics.recordFailure(auth.error ?? "Autenticação falhou.", latencyMs);
        return {
          success: false,
          data: [],
          error: auth.error,
          fetchedAt,
          latencyMs,
        };
      }

      const records: CfmCrmRawRecord[] = [];
      const errors: string[] = [];

      for (const crmNumber of config.seedCrms) {
        metrics.recordRequest();
        const requestStarted = performance.now();

        try {
          const response = await client.consultar({
            crm: crmNumber,
            uf: config.uf,
            chave: config.apiKey!,
          });

          const latencyMs = Math.round(performance.now() - requestStarted);

          if (!response) {
            metrics.recordNotFound(latencyMs);
            continue;
          }

          records.push({
            crm: response.crm,
            uf: response.uf,
            nome: response.nome,
            situacao: response.situacao,
            tipoInscricao: response.tipoInscricao,
            especialidades: response.especialidades,
            fetchedAt,
            sourceUrl: `https://crmvirtual.cfm.org.br/${config.uf}/medico/${response.crm}`,
          });

          metrics.recordSuccess(latencyMs);
        } catch (error) {
          const latencyMs = Math.round(performance.now() - requestStarted);
          const message = error instanceof Error ? error.message : "Falha na consulta CFM WS.";
          metrics.recordFailure(message, latencyMs);
          errors.push(`CRM ${crmNumber}: ${message}`);
        }
      }

      const latencyMs = Math.round(performance.now() - started);

      if (records.length === 0) {
        runtimeHealth = "DEGRADED";
        metrics.recordDegraded(errors[0] ?? "Nenhum registro retornado pelo CFM WS.");
        return {
          success: false,
          data: [],
          error: errors[0] ?? "Nenhum registro retornado pelo CFM WS.",
          fetchedAt,
          latencyMs,
        };
      }

      runtimeHealth = errors.length > 0 ? "DEGRADED" : "ONLINE";
      return {
        success: true,
        data: records,
        error: errors.length > 0 ? errors.join(" | ") : undefined,
        fetchedAt,
        latencyMs,
      };
    },

    normalize(raw: CfmCrmRawRecord): NormalizedConnectorRecord[] {
      const especialidade =
        raw.especialidades[0] ?? raw.tipoInscricao ?? "Medicina";

      return [
        {
          recordId: recordId(raw.nome, raw.crm),
          sourceId: "crm-estadual",
          sourceType: "crm-estadual",
          nome: raw.nome,
          crm: `CRM-${raw.uf} ${raw.crm}`,
          crmUf: raw.uf,
          especialidade,
          cidade: "Não informado pela fonte",
          estado: raw.uf,
          urlOrigem: raw.sourceUrl,
          confidence: mapSituacaoToConfidence(raw.situacao),
          fetchedAt: raw.fetchedAt,
        },
      ];
    },

    validate(record: NormalizedConnectorRecord): ValidationResult {
      const base = validateNormalizedRecord(record);
      const issues = [...base.issues];

      if (!record.crmUf) {
        issues.push({
          field: "crmUf",
          code: "REQUIRED",
          message: "UF do CRM é obrigatória.",
        });
      }

      return { valid: issues.length === 0, issues };
    },

    rateLimit(): RateLimitConfig {
      return {
        perMinute: 10,
        perHour: 120,
        maxRetries: DEFAULT_MAX_RETRIES,
        backoffBaseMs: DEFAULT_BACKOFF_BASE_MS,
        backoffMaxMs: DEFAULT_BACKOFF_MAX_MS,
      };
    },
  };
}

export function getCrmEstadualAdapterMetrics(
  connector: SourceConnector<CfmCrmRawRecord>,
): CrmEstadualAdapterMetrics | null {
  if (!("_crmEstadualMetrics" in connector)) {
    return null;
  }
  return (connector as SourceConnector<CfmCrmRawRecord> & {
    _crmEstadualMetrics: CrmEstadualAdapterMetrics;
  })._crmEstadualMetrics;
}

export function createCrmEstadualConnectorWithMetrics(
  options: CrmEstadualConnectorOptions = {},
): SourceConnector<CfmCrmRawRecord> {
  const metrics = options.metrics ?? new CrmEstadualAdapterMetrics();
  const connector = createCrmEstadualConnector({ ...options, metrics });
  Object.assign(connector, { _crmEstadualMetrics: metrics });
  return connector;
}
