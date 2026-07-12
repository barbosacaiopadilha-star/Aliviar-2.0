export type JsonDiffEntry = {
  path: string;
  before: unknown;
  after: unknown;
  kind: "added" | "removed" | "changed";
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Diff genérico e raso o suficiente para qualquer payload de artefato do
// ACE (Narrative..Shortlist) — nunca precisou conhecer os 8 formatos
// concretos, só percorrer chaves recursivamente. Arrays são tratados como
// objetos indexados por posição: suficiente para um diagnóstico de
// "o que mudou entre duas versões", não para um merge/patch real.
export function diffJson(before: unknown, after: unknown, path = ""): JsonDiffEntry[] {
  if (before === after) return [];
  if (Number.isNaN(before as number) && Number.isNaN(after as number)) return [];

  const bothObjects =
    (isPlainObject(before) || Array.isArray(before)) && (isPlainObject(after) || Array.isArray(after));

  if (!bothObjects) {
    return [
      { path: path || "(raiz)", before, after, kind: before === undefined ? "added" : after === undefined ? "removed" : "changed" },
    ];
  }

  const beforeRecord = before as Record<string, unknown>;
  const afterRecord = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);

  const entries: JsonDiffEntry[] = [];
  for (const key of keys) {
    const childPath = path ? `${path}.${key}` : key;
    entries.push(...diffJson(beforeRecord[key], afterRecord[key], childPath));
  }
  return entries;
}
