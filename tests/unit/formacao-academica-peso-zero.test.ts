import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * PESO ZERO — decisão vinculante 10, congelada por sentinela.
 *
 * Instituição, país, fellowship ou prestígio acadêmico não geram nota, não
 * definem nível, não alteram ranking e não favorecem recomendação. A prova é
 * dupla: (1) NENHUM módulo que pontua, ordena ou recomenda conhece a tabela
 * de formação nem o módulo dela; (2) a ordem das opções do paciente continua
 * vindo exclusivamente de `position` (a escrita do Curador).
 */

const RAIZ = process.cwd();

/** Onde nota, nível, ordem e recomendação nascem — a superfície vigiada. */
const MODULOS_DE_RANKING = [
  "src/modules/curadoria/motor-compatibilidade.ts",
  "src/modules/curadoria/motor-relacional.ts",
  "src/modules/curadoria/mesa-cruzamento.ts",
  "src/modules/curadoria/mesa-cruzamento-view.ts",
  // A seleção passou a nascer do resumo pelas frases dela (ADR-093): é ali
  // que um ranking entraria disfarçado de "resumo".
  "src/modules/curadoria/composicao-dos-tres.ts",
  "src/modules/curadoria/cruzamento.ts",
  "src/modules/curadoria/mapa-prioridades.ts",
];

const PROIBIDOS = [
  "professional_education_entries",
  "formacao-academica",
  "FormacaoPublica",
  "listarFormacaoConfirmada",
];

describe("peso zero da formação no ranking", () => {
  it("nenhum módulo de pontuação/ordenação conhece a formação", () => {
    for (const modulo of MODULOS_DE_RANKING) {
      const codigo = readFileSync(join(RAIZ, modulo), "utf8");
      for (const proibido of PROIBIDOS) {
        expect(
          codigo.includes(proibido),
          `${modulo} passou a referenciar ${proibido} — formação virou insumo de ranking`,
        ).toBe(false);
      }
    }
  });

  it("varredura ampla: fora do próprio módulo, quem lê a tabela é só o rastro autorizado", () => {
    // A tabela pode ser lida por: o módulo de formação, o dossiê (apresentação
    // administrativa) e testes. Qualquer leitor NOVO precisa passar por esta
    // lista — o desvio favorito de um ranking futuro morre no review.
    const AUTORIZADOS = new Set([
      "src/modules/profiles/formacao-academica-repository.ts",
      "src/modules/profiles/formacao-academica-extracao.ts",
    ]);
    const varrer = (dir: string): string[] =>
      readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((e) => {
        const caminho = `${dir}/${e.name}`;
        if (e.isDirectory()) return varrer(caminho);
        return /\.tsx?$/.test(e.name) ? [caminho] : [];
      });
    const leitores = varrer("src").filter((arquivo) =>
      readFileSync(join(RAIZ, arquivo), "utf8").includes("professional_education_entries"),
    );
    expect(leitores.sort()).toEqual([...AUTORIZADOS].sort());
  });

  it("a ordem das opções do paciente segue sendo a posição escrita pelo Curador", () => {
    const loader = readFileSync(join(RAIZ, "src/modules/curadoria/patient-curadoria.ts"), "utf8");
    expect(loader).toContain('.order("position")');
    // E nenhum sort por formação entrou no loader.
    expect(/sort\([^)]*formacao/i.test(loader)).toBe(false);
  });
});
