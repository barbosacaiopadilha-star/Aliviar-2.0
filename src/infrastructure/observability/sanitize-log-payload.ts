const SENSITIVE_KEYS = new Set([
  "password",
  "senha",
  "token",
  "secret",
  "authorization",
  "conteudo_base64",
  "conteudoBase64",
  "base64",
  "email",
  "phone",
  "telefone",
  "cpf",
  "observacao",
  "conteudo",
  "body",
  "cookie",
]);

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function sanitizeLogValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 256) return `[string:${value.length}]`;
    return value.replace(EMAIL_PATTERN, "[email]");
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(sanitizeLogValue);
  if (typeof value === "object") return sanitizeLogPayload(value as Record<string, unknown>);
  return "[redacted]";
}

export function sanitizeLogPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[redacted]";
      continue;
    }
    sanitized[key] = sanitizeLogValue(value);
  }
  return sanitized;
}

export function containsSensitiveData(payload: Record<string, unknown>): boolean {
  for (const key of Object.keys(payload)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) return true;
  }
  const serialized = JSON.stringify(payload);
  return EMAIL_PATTERN.test(serialized) || serialized.includes("base64");
}
