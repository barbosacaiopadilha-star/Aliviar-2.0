// Sanitização recursiva para os artefatos de diagnóstico locais do Golden
// Set (ver docs/ace/05-knowledge/golden-set-testing.md). Nunca confia que
// o conteúdo gerado pelo modelo ou o objeto de erro é seguro de gravar
// por si só — remove por nome qualquer campo potencialmente sensível
// (chave, token, prompt, header, credencial) e limita o tamanho de
// strings/arrays, independentemente do que a suíte golden vier a conter
// no futuro.

const SENSITIVE_KEY_PATTERN = /key|token|secret|password|credential|authoriza|prompt|header|cookie/i;
const MAX_STRING_LENGTH = 2000;
const MAX_ARRAY_ITEMS = 50;
const MAX_DEPTH = 6;

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return "[profundidade máxima excedida]";
  }

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncado]` : value;
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeForLog(item, depth + 1));
    if (value.length > MAX_ARRAY_ITEMS) {
      items.push(`…[+${value.length - MAX_ARRAY_ITEMS} itens omitidos]`);
    }
    return items;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redigido]" : sanitizeForLog(entryValue, depth + 1);
    }
    return result;
  }

  // function, symbol, bigint etc. — nunca serializados como estão.
  return `[tipo não serializável: ${typeof value}]`;
}
