import type { CrmEstadualAdapterConfig } from "./types";

const DEFAULT_SERVICE_URL =
  "https://ws.cfm.org.br:8080/WebServiceConsultaMedicos/ServicoConsultaMedicos";

export function loadCrmEstadualConfig(
  env: Record<string, string | undefined> = process.env,
): CrmEstadualAdapterConfig {
  const seedRaw = env.ALICIA_CRM_ESTADUAL_SEED_CRMS ?? "";

  return {
    uf: (env.ALICIA_CRM_ESTADUAL_UF ?? "ES").toUpperCase(),
    apiKey: env.ALICIA_CFM_WS_CHAVE ?? env.CFM_WS_CHAVE ?? null,
    seedCrms: seedRaw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    serviceUrl: env.ALICIA_CFM_WS_URL ?? DEFAULT_SERVICE_URL,
    enabled: env.ALICIA_CRM_ESTADUAL_ENABLED !== "false",
    requestTimeoutMs: Number(env.ALICIA_CFM_WS_TIMEOUT_MS ?? 15_000),
  };
}

export function isCrmEstadualConfigured(config: CrmEstadualAdapterConfig): boolean {
  return config.enabled && Boolean(config.apiKey) && config.seedCrms.length > 0;
}
