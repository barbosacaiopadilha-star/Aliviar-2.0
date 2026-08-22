import { describe, expect, it } from "vitest";

import { resumoDaFormacao, type FormacaoPublica } from "@/modules/profiles/formacao-academica";

/**
 * ADR-077 · o resumo do card fechado: títulos na ordem da trajetória, "·"
 * entre eles, e NUNCA uma linha de ausência.
 */

function entrada(kind: FormacaoPublica["kind"], title: string, periodStart: number | null = null): FormacaoPublica {
  return { kind, title, institution: null, city: null, country: null, periodStart, periodEnd: null };
}

describe("resumoDaFormacao — a linha do card fechado (ADR-077)", () => {
  it("junta os títulos na ordem da trajetória, não na ordem de chegada", () => {
    const resumo = resumoDaFormacao([
      entrada("especializacao", "Título de especialista em Psiquiatria", 2010),
      entrada("graduacao", "Medicina", 1998),
      entrada("residencia", "Residência em Psiquiatria", 2005),
    ]);
    expect(resumo).toBe("Medicina · Residência em Psiquiatria · Título de especialista em Psiquiatria");
  });

  it("sem formação confirmada, não há linha — ausência nunca vira texto", () => {
    expect(resumoDaFormacao([])).toBeNull();
  });

  it("título em branco não vira separador solto", () => {
    expect(resumoDaFormacao([entrada("graduacao", "   ")])).toBeNull();
    expect(resumoDaFormacao([entrada("graduacao", "Medicina"), entrada("curso", "  ")])).toBe("Medicina");
  });
});
