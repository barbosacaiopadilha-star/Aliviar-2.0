import { CfmSoapClient } from "../cfm-soap-client";
import { loadCrmEstadualConfig } from "../config";
import { createCrmEstadualConnectorWithMetrics, getCrmEstadualAdapterMetrics } from "../crm-estadual-connector";
import { CrmEstadualAdapterMetrics } from "../metrics";

import type { CrmHomologationProbeResult, CrmProbeAttempt, CrmProbeErrorKind } from "./types";

function classifyError(message: string): CrmProbeErrorKind {
  const lower = message.toLowerCase();
  if (lower.includes("chave") || lower.includes("auth") || lower.includes("401") || lower.includes("403")) {
    return "auth";
  }
  if (lower.includes("timeout") || lower.includes("abort")) {
    return "timeout";
  }
  if (lower.includes("soap") || lower.includes("fault")) {
    return "soap_fault";
  }
  if (lower.includes("http 4") || lower.includes("http 5") || lower.includes("rejeitou")) {
    return "http_error";
  }
  if (lower.includes("não configurada") || lower.includes("seed")) {
    return "config";
  }
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("econn")) {
    return "network";
  }
  return "unknown";
}

export async function runCrmHomologationProbe(
  env: Record<string, string | undefined> = process.env,
): Promise<CrmHomologationProbeResult> {
  const startedAt = new Date().toISOString();
  const config = loadCrmEstadualConfig(env);
  const metrics = new CrmEstadualAdapterMetrics();
  const connector = createCrmEstadualConnectorWithMetrics({ metrics });
  const attempts: CrmProbeAttempt[] = [];

  const auth = await connector.authenticate();
  if (!auth.success) {
    return {
      startedAt,
      completedAt: new Date().toISOString(),
      configured: false,
      attempts: [],
      averageLatencyMs: 0,
      successRate: 0,
      availability: 0,
      soapErrors: 0,
      timeouts: 0,
      retries: 0,
      health: "OFFLINE",
    };
  }

  const client = new CfmSoapClient({
    serviceUrl: config.serviceUrl,
    timeoutMs: config.requestTimeoutMs,
  });

  for (const crmNumber of config.seedCrms) {
    const attemptStarted = performance.now();
    const retries = 0;

    try {
      const response = await client.consultar({
        crm: crmNumber,
        uf: config.uf,
        chave: config.apiKey!,
      });

      const latencyMs = Math.round(performance.now() - attemptStarted);

      if (!response) {
        attempts.push({
          crm: crmNumber,
          success: false,
          latencyMs,
          errorKind: "not_found",
          errorMessage: "CRM consultado sem retorno.",
          retries,
        });
        continue;
      }

      attempts.push({
        crm: crmNumber,
        success: true,
        latencyMs,
        recordName: response.nome,
        retries,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido.";
      attempts.push({
        crm: crmNumber,
        success: false,
        latencyMs: Math.round(performance.now() - attemptStarted),
        errorKind: classifyError(message),
        errorMessage: message,
        retries,
      });
    }
  }

  const connectorFetch = await connector.fetch();
  const adapterMetrics = getCrmEstadualAdapterMetrics(connector)?.snapshot();

  const successes = attempts.filter((a) => a.success).length;
  const total = attempts.length || 1;
  const soapErrors = attempts.filter((a) => a.errorKind === "soap_fault").length;
  const timeouts = attempts.filter((a) => a.errorKind === "timeout").length;

  let health: CrmHomologationProbeResult["health"] = "ONLINE";
  if (!connectorFetch.success || successes === 0) {
    health = "OFFLINE";
  } else if (successes < total) {
    health = "DEGRADED";
  }

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    configured: true,
    attempts,
    averageLatencyMs:
      attempts.length === 0
        ? 0
        : Math.round(attempts.reduce((sum, a) => sum + a.latencyMs, 0) / attempts.length),
    successRate: Math.round((successes / total) * 100),
    availability: adapterMetrics
      ? Math.round((adapterMetrics.successes / Math.max(adapterMetrics.requests, 1)) * 100)
      : Math.round((successes / total) * 100),
    soapErrors,
    timeouts,
    retries: attempts.reduce((sum, a) => sum + a.retries, 0),
    health,
  };
}
