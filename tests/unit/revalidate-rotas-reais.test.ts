import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * REVALIDAÇÃO PRECISA APONTAR PARA A ROTA QUE EXISTE.
 *
 * Por que este teste existe: durante meses, todas as actions do módulo de Case
 * revalidavam `/curador/casos` e `/portal-curador` — endereços que viraram
 * apenas redirects. As rotas reais do Portal do Curador são `/coa/curadoria/*`.
 *
 * O sintoma em produção foi silencioso e caro de diagnosticar: o Curador
 * assumia uma Curadoria, o banco gravava corretamente, e a lista continuava sem
 * ela. Nada falhava, nada aparecia em log — só o dado certo atrás de uma tela
 * velha. Um `revalidatePath` para rota inexistente não é erro: é um no-op.
 *
 * Este guarda torna a próxima ocorrência barulhenta.
 */

const ROOT = process.cwd();

function readDir(dir: string): { file: string; source: string }[] {
  const full = path.join(ROOT, dir);
  return readdirSync(full)
    .filter((entry) => entry.endsWith(".ts"))
    .map((entry) => ({
      file: path.join(dir, entry),
      source: readFileSync(path.join(full, entry), "utf8"),
    }));
}

/** As rotas do Portal do Curador que de fato existem hoje. */
const ROTA_REAL_DO_CURADOR = "/coa/curadoria";

describe("actions revalidam a rota que existe", () => {
  const modulos = [
    ...readDir("src/modules/cases"),
    ...readDir("src/modules/curadoria"),
  ];

  it("nenhuma action revalida rota legada sem revalidar também a real", () => {
    for (const { file, source } of modulos) {
      const temLegada = /revalidatePath\(\s*[`"']\/(curador|portal-curador)/.test(source);
      if (!temLegada) continue;

      expect(
        source.includes(ROTA_REAL_DO_CURADOR),
        `${file} revalida rota legada do Curador sem revalidar ${ROTA_REAL_DO_CURADOR}. ` +
          "revalidatePath para rota inexistente é no-op silencioso: o dado grava e a tela não atualiza.",
      ).toBe(true);
    }
  });

  it("o módulo de Case centraliza a revalidação num lugar só", () => {
    const espalhadas = readDir("src/modules/cases").filter(
      ({ file, source }) =>
        !file.endsWith("revalidate.ts") && source.includes("revalidatePath("),
    );

    expect(
      espalhadas.map((entry) => entry.file),
      "cada action com a sua própria lista de rotas foi exatamente como o defeito nasceu",
    ).toEqual([]);
  });

  it("a lista central cobre a fila do Curador e a página do caso", () => {
    const central = readFileSync(path.join(ROOT, "src/modules/cases/revalidate.ts"), "utf8");
    expect(central).toContain(`revalidatePath("${ROTA_REAL_DO_CURADOR}", "layout")`);
    expect(central).toContain(`${ROTA_REAL_DO_CURADOR}/casos/`);
    expect(central).toContain('revalidatePath("/paciente")');
  });
});
