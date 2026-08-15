import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * C7R · A FRONTEIRA SERVIDOR↔CLIENTE DO PAINEL DO CICLO.
 *
 * Uma seta em linha criada num Server Component NÃO é Server Action: o React
 * recusa serializá-la na fronteira RSC e a rota inteira cai no error boundary —
 * em todo render, para todo profissional, como o Verificador mediu (3/3). A
 * prova por contraste estava na própria página: os outros handlers usam
 * `.bind(null, id)` sobre actions "use server", e nunca quebraram.
 *
 * Este teste protege o PADRÃO no código-fonte: reintroduzir `={async (` em
 * qualquer um dos três props derruba aqui, antes de derrubar a rota.
 */

const PAGINA = path.resolve(
  __dirname,
  "..",
  "..",
  "src",
  "app",
  "admin",
  "profissionais",
  "[id]",
  "page.tsx",
);

describe("C7R · o painel do ciclo recebe actions vinculadas, nunca closures", () => {
  const fonte = readFileSync(PAGINA, "utf8");

  it.each(["preverImpacto", "mudarCiclo", "classificarLegado"])(
    "%s é passado por .bind(null, id)",
    (prop) => {
      const vinculado = new RegExp(prop + String.raw`=\{\w+\.bind\(null, id\)\}`);
      expect(fonte, `${prop} não usa o padrão bind da página`).toMatch(vinculado);
    },
  );

  it("nenhum dos três props volta a ser closure em linha", () => {
    for (const prop of ["preverImpacto", "mudarCiclo", "classificarLegado"]) {
      const emLinha = new RegExp(prop + String.raw`=\{async(\s|\()`);
      expect(
        emLinha.test(fonte),
        `${prop} voltou a ser uma seta em linha — isso não serializa na fronteira RSC e derruba a rota inteira no error boundary`,
      ).toBe(false);
    }
  });

  it("as três actions declaram o id como primeiro argumento posicional (o que torna o bind possível)", () => {
    const actions = readFileSync(
      path.resolve(__dirname, "..", "..", "src", "modules", "profiles", "ciclo-do-profissional-actions.ts"),
      "utf8",
    );
    for (const nome of [
      "preverImpactoDaTransicaoAction",
      "mudarCicloDoProfissionalAction",
      "classificarLegadoDoProfissionalAction",
    ]) {
      const assinatura = new RegExp(
        String.raw`export async function ` + nome + String.raw`\(\s*\r?\n?\s*profissionalId: string,`,
      );
      expect(actions, `${nome} não recebe profissionalId como primeiro argumento`).toMatch(assinatura);
    }
  });
});
