import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  METHOD_ANNOTATION_PATTERN,
  METHOD_SOURCE_DOCUMENTS,
} from "@/modules/curadoria/portal/method-reference";

// MISSÃO 100 — rastreabilidade obrigatória.
//
// Todo componente do Portal do Curador precisa declarar de qual documento
// canônico ele nasceu. Um componente sem essa declaração quebra a suíte: é a
// mecanização da regra "nenhum componente existe apenas para preencher espaço".

const COMPONENTS_DIR = path.resolve(process.cwd(), "src/components/curadoria");

function componentFiles(): string[] {
  return readdirSync(COMPONENTS_DIR).filter((file) => file.endsWith(".tsx"));
}

describe("rastreabilidade dos componentes do Portal do Curador", () => {
  it("existe ao menos um componente para verificar", () => {
    expect(componentFiles().length).toBeGreaterThan(0);
  });

  it.each(componentFiles())("%s declara sua origem no Método", (file) => {
    const source = readFileSync(path.join(COMPONENTS_DIR, file), "utf8");
    expect(
      METHOD_ANNOTATION_PATTERN.test(source),
      `${file} não tem nenhuma anotação @metodo válida. Todo componente do Portal precisa citar o documento que justifica sua existência.`,
    ).toBe(true);
  });

  it.each(componentFiles())("%s explica por que existe", (file) => {
    const source = readFileSync(path.join(COMPONENTS_DIR, file), "utf8");
    expect(
      source.includes("Por que existe:"),
      `${file} não explica por que existe. A missão exige que cada componente responda qual problema do Curador ele resolve.`,
    ).toBe(true);
  });

  it("todas as fontes citadas apontam para um documento real", () => {
    for (const file of componentFiles()) {
      const source = readFileSync(path.join(COMPONENTS_DIR, file), "utf8");
      const cited = [...source.matchAll(/@metodo\s+(\p{L}+)/gu)].map((match) => match[1]);

      for (const citation of cited) {
        expect(
          Object.keys(METHOD_SOURCE_DOCUMENTS),
          `${file} cita a fonte desconhecida "${citation}".`,
        ).toContain(citation);
      }
    }
  });
});
