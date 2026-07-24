import type { NormalizedConnectorRecord, ValidationIssue, ValidationResult } from "./types";

const REQUIRED_FIELDS: Array<keyof NormalizedConnectorRecord> = [
  "recordId",
  "sourceId",
  "sourceType",
  "nome",
  "crm",
  "crmUf",
  "especialidade",
  "cidade",
  "estado",
  "urlOrigem",
  "confidence",
  "fetchedAt",
];

function issue(field: string, code: string, message: string): ValidationIssue {
  return { field, code, message };
}

export function validateNormalizedRecord(record: NormalizedConnectorRecord): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null || value === "") {
      issues.push(issue(String(field), "REQUIRED", `Campo obrigatório ausente: ${field}.`));
    }
  }

  if (typeof record.nome !== "string" || record.nome.trim().length < 3) {
    issues.push(issue("nome", "TYPE", "Nome deve ter ao menos 3 caracteres."));
  }

  if (typeof record.confidence !== "number" || record.confidence < 0 || record.confidence > 1) {
    issues.push(issue("confidence", "TYPE", "Confidence deve ser número entre 0 e 1."));
  }

  if (typeof record.estado !== "string" || record.estado.length !== 2) {
    issues.push(issue("estado", "CONSISTENCY", "Estado deve ter 2 caracteres (UF)."));
  }

  if (typeof record.crm !== "string" || !/\d/.test(record.crm)) {
    issues.push(issue("crm", "CONSISTENCY", "CRM deve conter ao menos um dígito."));
  }

  if (record.telefone !== undefined && typeof record.telefone !== "string") {
    issues.push(issue("telefone", "TYPE", "Telefone deve ser string quando informado."));
  }

  if (!record.urlOrigem.startsWith("http")) {
    issues.push(issue("urlOrigem", "CONSISTENCY", "URL de origem deve ser válida."));
  }

  return { valid: issues.length === 0, issues };
}

export function validateSchema(record: unknown): ValidationResult {
  if (!record || typeof record !== "object") {
    return {
      valid: false,
      issues: [issue("record", "SCHEMA", "Registro deve ser um objeto.")],
    };
  }

  return validateNormalizedRecord(record as NormalizedConnectorRecord);
}
