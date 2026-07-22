import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("ACE legado — auditoria estática", () => {
  it("não existe SupabaseAnaliseRepository", () => {
    const legacyPath = join(ROOT, "src/infrastructure/analise/supabase-analise-repository.ts");
    expect(existsSync(legacyPath)).toBe(false);
  });

  it("composition-root usa improvedAceAnaliseAdapter", () => {
    const source = read("src/infrastructure/composition-root.ts");
    expect(source).toContain("improvedAceAnaliseAdapter");
    expect(source).not.toContain("SupabaseAnaliseRepository");
  });

  it("não há create_journey_event no pipeline de análise", () => {
    const aceService = read("src/infrastructure/ace/improved-ace-service.ts");
    expect(aceService).not.toContain("create_journey_event");
    expect(aceService).toContain("ace_analysis_runs");
  });

  it("handler de análise referencia pipeline v2", () => {
    const handler = read("api/analise/handlers/executar-analise-inicial.handler.ts");
    expect(handler).toContain("ace_melhorado");
    expect(handler).toContain("ACE_ANALISE_INICIO");
  });
});
