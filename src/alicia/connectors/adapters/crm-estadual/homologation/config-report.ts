import { isCrmEstadualConfigured, loadCrmEstadualConfig } from "../config";

import type { CrmConfigCheck, CrmConfigReport } from "./types";

function maskSecret(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  if (value.length <= 4) {
    return "****";
  }
  return `${value.slice(0, 2)}${"*".repeat(Math.min(value.length - 4, 12))}${value.slice(-2)}`;
}

function checkVariable(
  variable: string,
  value: string | null | undefined,
  validate: (v: string | null | undefined) => boolean,
  messageWhenMissing: string,
): CrmConfigCheck {
  const present = value !== undefined && value !== null && value !== "";
  const valid = present && validate(value);
  return {
    variable,
    present,
    valid,
    maskedValue: variable.includes("CHAVE") ? maskSecret(value) : (value ?? "—"),
    message: !present ? messageWhenMissing : valid ? "OK" : "Valor inválido",
  };
}

export function buildCrmConfigReport(
  env: Record<string, string | undefined> = process.env,
): CrmConfigReport {
  const config = loadCrmEstadualConfig(env);
  const apiKey = env.ALICIA_CFM_WS_CHAVE ?? env.CFM_WS_CHAVE;
  const seedRaw = env.ALICIA_CRM_ESTADUAL_SEED_CRMS ?? "";

  const checks: CrmConfigCheck[] = [
    checkVariable(
      "ALICIA_CFM_WS_CHAVE",
      apiKey,
      (v) => typeof v === "string" && v.trim().length >= 8,
      "Chave CFM WS ausente — configure ALICIA_CFM_WS_CHAVE ou CFM_WS_CHAVE.",
    ),
    checkVariable(
      "ALICIA_CRM_ESTADUAL_UF",
      env.ALICIA_CRM_ESTADUAL_UF ?? "ES",
      (v) => typeof v === "string" && v.trim().length === 2,
      "UF não informada — padrão ES será usado.",
    ),
    checkVariable(
      "ALICIA_CRM_ESTADUAL_SEED_CRMS",
      seedRaw,
      (v) => typeof v === "string" && v.split(",").some((item) => item.trim().length > 0),
      "Lista de CRMs seed vazia — configure ALICIA_CRM_ESTADUAL_SEED_CRMS.",
    ),
  ];

  const configured = isCrmEstadualConfigured(config);

  return {
    generatedAt: new Date().toISOString(),
    configured,
    readyForProbe: configured,
    checks,
    uf: config.uf,
    seedCount: config.seedCrms.length,
    serviceUrl: config.serviceUrl,
    enabled: config.enabled,
    requestTimeoutMs: config.requestTimeoutMs,
  };
}
