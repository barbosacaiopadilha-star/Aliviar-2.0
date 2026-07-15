import { describe, expect, it } from "vitest";

import {
  HEADER_COMPACT_SCROLL_THRESHOLD,
  shouldCompactHeader,
} from "@/components/landing/header-compaction";

describe("shouldCompactHeader", () => {
  it("abaixo do limiar: expandido", () => {
    expect(shouldCompactHeader(0, HEADER_COMPACT_SCROLL_THRESHOLD)).toBe(false);
    expect(shouldCompactHeader(5, HEADER_COMPACT_SCROLL_THRESHOLD)).toBe(false);
  });

  it("exatamente no limiar: ainda expandido (comparação original é `>`, nunca `>=`)", () => {
    expect(
      shouldCompactHeader(
        HEADER_COMPACT_SCROLL_THRESHOLD,
        HEADER_COMPACT_SCROLL_THRESHOLD,
      ),
    ).toBe(false);
  });

  it("imediatamente acima do limiar: compacto", () => {
    expect(
      shouldCompactHeader(
        HEADER_COMPACT_SCROLL_THRESHOLD + 1,
        HEADER_COMPACT_SCROLL_THRESHOLD,
      ),
    ).toBe(true);
  });

  it("bem acima do limiar: compacto", () => {
    expect(shouldCompactHeader(500, HEADER_COMPACT_SCROLL_THRESHOLD)).toBe(
      true,
    );
  });

  it("scrollY negativo (não deveria acontecer no navegador, mas tratado com segurança): expandido", () => {
    expect(shouldCompactHeader(-10, HEADER_COMPACT_SCROLL_THRESHOLD)).toBe(
      false,
    );
  });

  it("reversibilidade: função pura, sem memória — o mesmo valor de entrada sempre produz o mesmo resultado, independentemente de chamadas anteriores", () => {
    const before = shouldCompactHeader(3, HEADER_COMPACT_SCROLL_THRESHOLD);
    shouldCompactHeader(999, HEADER_COMPACT_SCROLL_THRESHOLD); // simula rolar bem para baixo
    const after = shouldCompactHeader(3, HEADER_COMPACT_SCROLL_THRESHOLD); // e voltar ao mesmo ponto
    expect(after).toBe(before);
  });

  it("nunca lança exceção nem produz resultado indefinido para entrada não finita", () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      expect(() =>
        shouldCompactHeader(value, HEADER_COMPACT_SCROLL_THRESHOLD),
      ).not.toThrow();
      expect(
        typeof shouldCompactHeader(value, HEADER_COMPACT_SCROLL_THRESHOLD),
      ).toBe("boolean");
    }
  });

  it("equivalência manual: reproduz exatamente `window.scrollY > 8` do código original", () => {
    expect(HEADER_COMPACT_SCROLL_THRESHOLD).toBe(8);
    for (const scrollY of [0, 7, 8, 9, 100]) {
      expect(
        shouldCompactHeader(scrollY, HEADER_COMPACT_SCROLL_THRESHOLD),
      ).toBe(scrollY > 8);
    }
  });

  it("limiar customizado (testabilidade do contrato, não comportamento novo do produto): a função respeita qualquer threshold dado", () => {
    expect(shouldCompactHeader(50, 100)).toBe(false);
    expect(shouldCompactHeader(150, 100)).toBe(true);
  });
});
