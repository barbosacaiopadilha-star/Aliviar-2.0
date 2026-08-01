import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Toda classe de célula que a comparação emite precisa existir no CSS.
 *
 * Este teste nasce de um defeito real (Onda 4): `comparacao-premium.tsx`
 * emitia `mesa-celula--sem-dado` e `mesa-celula--neutro`, que nunca foram
 * definidas — as células de lacuna e de "não se aplica" saíam sem tratamento
 * nenhum, e ninguém percebia, porque classe inexistente não quebra nada.
 *
 * O teste é de fonte, e não de render, de propósito: o descasamento acontece
 * entre dois arquivos que nunca se encontram em tempo de execução.
 */

const ROOT = path.resolve(__dirname, "../..");

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), "utf-8");
}

describe("Mesa do Curador — classes de célula emitidas × definidas", () => {
  const css = read("src/app/mesa-curador.css");
  const componente = read("src/components/curadoria/mesa/comparacao-premium.tsx");

  const definidas = new Set(
    [...css.matchAll(/\.(mesa-celula--[a-z-]+)/g)].map((match) => match[1]!),
  );
  const emitidas = new Set(
    [...componente.matchAll(/"(mesa-celula--[a-z-]+)"/g)].map((match) => match[1]!),
  );

  it("o CSS define as classes que o componente emite", () => {
    expect(emitidas.size).toBeGreaterThan(0);
    for (const classe of emitidas) {
      expect(definidas, `classe emitida sem definição no CSS: ${classe}`).toContain(classe);
    }
  });

  it("cada um dos quatro resultados do Motor tem tratamento próprio", () => {
    // Quatro resultados, quatro classes distintas: se duas colidirem, dois
    // estados diferentes passam a parecer o mesmo na tela.
    const mapa = componente.slice(
      componente.indexOf("const CLASSE_RESULTADO"),
      componente.indexOf("export function ComparacaoPremium"),
    );
    const classesDoMapa = [...mapa.matchAll(/"(mesa-celula--[a-z-]+)"/g)].map((m) => m[1]!);

    expect(classesDoMapa).toHaveLength(4);
    expect(new Set(classesDoMapa).size, "dois resultados compartilham a mesma classe").toBe(4);
  });

  it("nenhuma classe de célula usa cor de semáforo", () => {
    // A célula distingue por textura e valor de fio; verde/vermelho como
    // par semântico está proibido em toda a casa (Sistema Visual R2).
    const bloco = css.slice(css.indexOf(".mesa-celula"), css.indexOf(".mesa-legenda"));
    for (const proibido of ["red", "green", "#f00", "#0f0", "crimson"]) {
      expect(bloco.toLowerCase(), `cor de semáforo na célula: ${proibido}`).not.toContain(proibido);
    }
  });
});
