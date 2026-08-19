import { describe, expect, it } from "vitest";

import { saveProfessionalMapEntries } from "@/modules/curadoria/mapa-profissional-repository";

/**
 * O MAPA EXIGE AUTOR.
 *
 * A coluna `declared_by` existia desde sempre e era LIDA pela tela — e nenhuma
 * escrita a preenchia. Havia até um comentário no repositório admitindo isso.
 * Toda declaração do Mapa era anônima, e o Mapa é justamente o que a Aliviar
 * afirma sobre um médico real.
 *
 * Estes testes são de fronteira: provam que a autoria CHEGA ao upsert e que a
 * recusa acontece ANTES de qualquer ida ao banco.
 */

/** Dois conceitos reais do Catálogo, o mínimo para a validação do domínio passar. */
const CATALOGO = [
  {
    id: "id-formacao-residencia",
    code: "FORMACAO_RESIDENCIA",
    group: "FORMACAO",
    name: "Residência médica",
    description: "",
    display_order: 2,
    active: true,
  },
  {
    id: "id-acesso-modalidade",
    code: "ACESSO_MODALIDADE",
    group: "ACESSO",
    name: "Modalidade",
    description: "",
    display_order: 1,
    active: true,
  },
];

function clienteFalso(capturado: { linhas?: unknown[] }) {
  const catalogoQuery = {
    select: () => catalogoQuery,
    eq: () => catalogoQuery,
    order: () => catalogoQuery,
    then: (resolve: (v: unknown) => unknown) => resolve({ data: CATALOGO, error: null }),
  };

  return {
    from(tabela: string) {
      if (tabela === "method_subcriteria") return catalogoQuery;
      if (tabela === "professional_subcriterion_map") {
        return {
          upsert(linhas: unknown[]) {
            capturado.linhas = linhas;
            return Promise.resolve({ error: null });
          },
          select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
        };
      }
      return {
        select: () => ({
          in: () => Promise.resolve({ data: [], error: null }),
          eq: () => Promise.resolve({ data: [], error: null }),
        }),
      };
    },
  } as never;
}

describe("autoria na escrita do Mapa", () => {
  it("recusa gravar sem autor — e recusa ANTES de tocar no banco", async () => {
    const capturado: { linhas?: unknown[] } = {};
    const supabase = clienteFalso(capturado);

    await expect(
      saveProfessionalMapEntries(
        supabase,
        "prof-1",
        [{ subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" }],
        "",
      ),
    ).rejects.toThrow(/autor/i);

    // Nada foi enviado: a recusa do domínio precede a do banco.
    expect(capturado.linhas).toBeUndefined();
  });

  it("a mensagem da recusa fala de gente, não de coluna", async () => {
    const supabase = clienteFalso({});
    await expect(
      saveProfessionalMapEntries(supabase, "prof-1", [
        { subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" },
      ], ""),
    ).rejects.toThrow(/a declaração é de alguém/i);
  });

  it("lista vazia não exige autor — não há declaração a assinar", async () => {
    const supabase = clienteFalso({});
    await expect(
      saveProfessionalMapEntries(supabase, "prof-1", [], ""),
    ).resolves.toBeDefined();
  });
});

describe("regressão: a autoria vinha vazia no upsert", () => {
  it("`declared_by` viaja em TODA linha gravada", async () => {
    const capturado: { linhas?: unknown[] } = {};
    const supabase = clienteFalso(capturado);

    await saveProfessionalMapEntries(
      supabase,
      "prof-1",
      [
        { subcriterionCode: "FORMACAO_RESIDENCIA", status: "CONFIRMADO" },
        { subcriterionCode: "ACESSO_MODALIDADE", status: "NAO_INFORMADO" },
      ],
      "autor-abc",
    );

    const linhas = (capturado.linhas ?? []) as { declared_by?: string }[];
    expect(linhas.length).toBeGreaterThan(0);
    for (const linha of linhas) {
      expect(linha.declared_by, "linha gravada sem autor").toBe("autor-abc");
    }
  });
});
