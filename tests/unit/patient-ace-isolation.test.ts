import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Correção de regra de negócio (docs/PRODUCT_ARCHITECTURE.md, seção 22):
// antes da entrega da FinalCuradoria (P010), o paciente nunca pode
// visualizar nenhum artefato interno do ACE (CompetencyProfile,
// EligibleProviderSet, CompatibilityMatrix, Shortlist, HumanReviewResult).
// Hoje o ACE não tem nenhuma integração de aplicação (nenhuma página, nenhuma
// action) — este teste é o guardrail mecânico que impede essa integração
// de ser adicionada por engano, sem antes desenhar a fronteira de acesso
// correta (RLS + Server Action). Se este teste falhar no futuro, não é bug
// dele: é o sinal de que a integração precisa de desenho de acesso
// deliberado antes de prosseguir.

const PATIENT_AREA_ROOT = path.resolve(__dirname, "../../src/app/paciente");
const FORBIDDEN_IMPORT_SUBSTRING = "modules/ace";

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("isolamento do paciente em relação aos artefatos internos do ACE", () => {
  it("nenhum arquivo em src/app/paciente importa qualquer coisa de src/modules/ace", () => {
    const files = collectSourceFiles(PATIENT_AREA_ROOT);
    expect(files.length).toBeGreaterThan(0);

    const offendingFiles = files.filter((file) => {
      const content = readFileSync(file, "utf-8");
      return content.includes(FORBIDDEN_IMPORT_SUBSTRING);
    });

    expect(offendingFiles).toEqual([]);
  });

  it("nenhum arquivo em src/app/paciente menciona vocabulário interno do ACE (mesmo fora de import)", () => {
    const files = collectSourceFiles(PATIENT_AREA_ROOT);
    const forbiddenTerms = [
      "CompetencyProfile",
      "EligibleProviderSet",
      "CompatibilityMatrix",
      "HumanReviewResult",
      "compatibilityMatrix",
      "shortlist",
    ];

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const term of forbiddenTerms) {
        expect(
          content.includes(term),
          `${path.relative(process.cwd(), file)} não deveria mencionar "${term}" (artefato interno do ACE, restrito à equipe Aliviar).`,
        ).toBe(false);
      }
    }
  });
});
