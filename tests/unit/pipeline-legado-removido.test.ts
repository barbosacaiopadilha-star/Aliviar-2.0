import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import * as cruzamento from "@/modules/curadoria/cruzamento";
import * as method from "@/modules/curadoria/method";

/**
 * M5 — O PIPELINE LEGADO SAIU DO CÓDIGO EXECUTÁVEL (encerra a ADR-042).
 *
 * O critério não é "zero ocorrências no repositório": migrations, dados e
 * documentação histórica permanecem. É zero código operacional do modelo
 * aposentado em `src` — e nenhuma volta silenciosa por import esquecido.
 */

function fontes(dir: string): string[] {
  return readdirSync(join(process.cwd(), dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return fontes(caminho);
    return /\.(ts|tsx)$/.test(entrada.name) ? [caminho] : [];
  });
}

/** Comentário que EXPLICA a remoção cita o vocabulário antigo de propósito. */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linha) => !linha.trimStart().startsWith("//"))
    .join("\n");
}

const CODIGO = fontes("src").map((arquivo) => ({
  arquivo: arquivo.replace(/\\/g, "/"),
  texto: semComentarios(readFileSync(join(process.cwd(), arquivo), "utf8")),
}));

/**
 * `repository.ts` e `actions.ts` importam `server-only` e não podem ser
 * carregados aqui — são auditados pelo texto, como os demais guardas.
 */
const REPOSITORY = CODIGO.find((entrada) =>
  entrada.arquivo.endsWith("src/modules/curadoria/repository.ts"),
)!.texto;
const ACTIONS = CODIGO.find((entrada) =>
  entrada.arquivo.endsWith("src/modules/curadoria/actions.ts"),
)!.texto;

describe("Módulos e funções do pipeline legado", () => {
  it("o executor, o cálculo, a ordenação e as faixas não existem mais", () => {
    for (const removido of ["runCompatibility", "listCompatibilityAnalyses"]) {
      expect(REPOSITORY.includes(`function ${removido}`), removido).toBe(false);
    }
    for (const removido of [
      "computeCompatibility",
      "bandFor",
      "organizeForCurator",
      "passesMandatoryFilters",
      "validateWeightDistribution",
      "TOTAL_PRIORITY_POINTS",
    ]) {
      expect(removido in method, removido).toBe(false);
    }
    for (const removido of ["cruzar", "BLOCK_POINTS", "coverageSentence", "balanceOfBlock", "alignmentOf"]) {
      expect(removido in cruzamento, removido).toBe(false);
    }
  });

  it("o que o Método vigente ainda exerce permanece", () => {
    expect(typeof method.validateSelection).toBe("function");
    expect(method.REQUIRED_OPTION_COUNT).toBe(3);
    expect(typeof cruzamento.applyAreaGate).toBe("function");
    expect(cruzamento.ASSESSMENTS).toHaveLength(4);
    // A Rede operacional é regra vigente do Método, não peça do motor antigo.
    expect(REPOSITORY).toContain("export async function listApprovedProviders");
  });

  it("nenhuma action órfã do pipeline legado permanece exportada", () => {
    for (const removida of [
      "computeCompatibilityAction",
      "saveAllWeightsAction",
      "removeWeightAction",
      "validateProfileAction",
    ]) {
      expect(ACTIONS.includes(`function ${removida}`), removida).toBe(false);
    }
  });

  it("os módulos órfãos de pesos foram removidos do repositório", () => {
    for (const caminho of [
      "src/modules/curadoria/priority-validation-readiness.ts",
      "src/modules/curadoria/priority-targets.ts",
    ]) {
      expect(existsSync(join(process.cwd(), caminho)), caminho).toBe(false);
    }
  });
});

describe("Componentes legados", () => {
  it("os arquivos não existem mais", () => {
    for (const caminho of [
      "src/components/curadoria/compatibility-runner.tsx",
      "src/components/curadoria/mesa-comparison.tsx",
      "src/components/curadoria/mesa-doctor-card.tsx",
    ]) {
      expect(existsSync(join(process.cwd(), caminho)), caminho).toBe(false);
    }
  });

  it("nenhum arquivo de src os importa", () => {
    for (const { arquivo, texto } of CODIGO) {
      for (const removido of [
        "compatibility-runner",
        "mesa-comparison",
        "mesa-doctor-card",
        "priority-validation-readiness",
        "priority-targets",
      ]) {
        expect(texto.includes(removido), `${arquivo} → ${removido}`).toBe(false);
      }
    }
  });
});

describe("Tipos operacionais", () => {
  it("nenhum tipo vigente carrega score, banda, peso ou análise legada", () => {
    for (const { arquivo, texto } of CODIGO) {
      for (const removido of [
        "AnaliseRecord",
        "CompatibilityAnalysis",
        "COMPATIBILITY_BAND_LABELS",
        "COMPATIBILITY_BANDS",
        "internalScore",
        "coveredWeight",
        "PriorityWeight",
      ]) {
        // `experiencia.ts` mantém uma blocklist com estes nomes: é proteção
        // contra regressão, o oposto de uso operacional.
        if (arquivo.endsWith("src/modules/paciente/experiencia.ts")) continue;
        expect(texto.includes(removido), `${arquivo} → ${removido}`).toBe(false);
      }
    }
  });

  it("a banda histórica sobrevive isolada, com um único consumidor", () => {
    const consumidores = CODIGO.filter((entrada) =>
      entrada.texto.includes("HistoricalCompatibilityBand"),
    ).map((entrada) => entrada.arquivo);

    expect(consumidores.sort()).toEqual([
      "src/modules/curadoria/repository.ts",
      "src/modules/curadoria/types.ts",
    ]);
  });
});

describe("Tabelas históricas — preservadas, sem escritor nem leitor operacional", () => {
  it("nenhum código escreve ou lê as tabelas do motor antigo", () => {
    for (const { arquivo, texto } of CODIGO) {
      for (const tabela of [
        "priority_weights",
        "compatibility_analyses",
        "compatibility_criterion_results",
      ]) {
        expect(texto.includes(`from("${tabela}")`), `${arquivo} → ${tabela}`).toBe(false);
      }
    }
  });

  it("as migrations que as criaram continuam intactas — nenhuma remoção", () => {
    const migrations = readdirSync(join(process.cwd(), "supabase/migrations"))
      .map((nome) => readFileSync(join(process.cwd(), "supabase/migrations", nome), "utf8"))
      .join("\n");

    expect(migrations).toContain("create table curadoria.priority_weights");
    expect(migrations).toContain("compatibility_analyses");
    expect(migrations).toContain("curated_selection_options");
    for (const tabela of [
      "priority_weights",
      "compatibility_analyses",
      "compatibility_criterion_results",
    ]) {
      expect(migrations, tabela).not.toMatch(new RegExp(`drop table[\\s\\S]{0,40}${tabela}`, "i"));
    }
    // A coluna histórica `band` também permanece — anulável desde a M2.
    expect(migrations).not.toMatch(/alter table[\s\S]{0,80}drop column[\s\S]{0,20}band/i);
  });
});
