// Congelamento profundo — garante que artefatos sejam imutáveis mesmo em
// campos aninhados (Object.freeze sozinho só congela o nível superior).

export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const key of Object.getOwnPropertyNames(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }

  return value;
}
