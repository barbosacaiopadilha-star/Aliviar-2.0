import { describe, expect, it } from "vitest";

import { CARDS } from "@/components/landing/faq-cards";
import {
  BOOK_SCROLL_VH,
  EXIT_DURATION_UNITS,
  FIRST_QUESTION_SETTLE_UNITS,
  FIRST_TURN_EMPHASIS,
  getAdjacentFaqCardIndex,
  getFaqCardTargetScroll,
  LAST_QUESTION_SETTLE_UNITS,
  MARK_PROGRESS,
  TRANSITION_EMPHASIS,
  TURN_DURATION_UNITS,
  TURN_TO_EXIT_GAP_UNITS,
} from "@/components/landing/faq-book-turn";

const CARDS_COUNT = CARDS.length;

describe("MARK_PROGRESS / TRANSITION_EMPHASIS (configuração)", () => {
  it("tem exatamente um marco por carta", () => {
    expect(MARK_PROGRESS).toHaveLength(CARDS_COUNT);
  });

  it("começa em 0; a última carta NÃO se acomoda em 1 — sobra um trecho de assentamento final sem marco de navegação (achado real, preservado)", () => {
    // A normalização usa `acc + LAST_QUESTION_SETTLE_UNITS` como total,
    // mas o próprio marco da última carta só guarda `acc` (sem o
    // assentamento final somado) — então ela fica em acc/total, sempre
    // menor que 1. Calculado aqui a partir das constantes reais, nunca
    // hardcoded, para continuar válido se os pesos mudarem.
    const lastEmphasisSum = TRANSITION_EMPHASIS.reduce(
      (sum, emphasis) =>
        sum +
        (TURN_DURATION_UNITS + TURN_TO_EXIT_GAP_UNITS + EXIT_DURATION_UNITS) *
          emphasis,
      FIRST_QUESTION_SETTLE_UNITS,
    );
    const expectedLastMark =
      lastEmphasisSum / (lastEmphasisSum + LAST_QUESTION_SETTLE_UNITS);

    expect(MARK_PROGRESS[0]).toBe(0);
    expect(MARK_PROGRESS[MARK_PROGRESS.length - 1]).toBeCloseTo(
      expectedLastMark,
      10,
    );
    expect(MARK_PROGRESS[MARK_PROGRESS.length - 1]).toBeLessThan(1);
  });

  it("é estritamente crescente (nenhuma carta assenta antes da anterior)", () => {
    for (let i = 1; i < MARK_PROGRESS.length; i++) {
      expect(MARK_PROGRESS[i]).toBeGreaterThan(MARK_PROGRESS[i - 1]);
    }
  });

  it("TRANSITION_EMPHASIS tem uma entrada a menos que o total de cartas (a última nunca vira)", () => {
    expect(TRANSITION_EMPHASIS).toHaveLength(CARDS_COUNT - 1);
  });

  it("só a primeira transição recebe o peso extra (FIRST_TURN_EMPHASIS)", () => {
    expect(TRANSITION_EMPHASIS[0]).toBe(FIRST_TURN_EMPHASIS);
    for (let i = 1; i < TRANSITION_EMPHASIS.length; i++) {
      expect(TRANSITION_EMPHASIS[i]).toBe(1);
    }
  });

  it("valores de peso preservados exatamente (mesmos números do código original)", () => {
    expect(FIRST_QUESTION_SETTLE_UNITS).toBe(1);
    expect(LAST_QUESTION_SETTLE_UNITS).toBe(1);
    expect(FIRST_TURN_EMPHASIS).toBe(1.3);
    expect(TURN_DURATION_UNITS).toBe(1);
    expect(TURN_TO_EXIT_GAP_UNITS).toBe(0.15);
    expect(EXIT_DURATION_UNITS).toBe(0.6);
    expect(BOOK_SCROLL_VH).toBe(390);
  });
});

describe("getAdjacentFaqCardIndex", () => {
  it("avança um índice por vez", () => {
    expect(getAdjacentFaqCardIndex(0, 1, CARDS_COUNT)).toBe(1);
    expect(getAdjacentFaqCardIndex(2, 1, CARDS_COUNT)).toBe(3);
  });

  it("volta um índice por vez", () => {
    expect(getAdjacentFaqCardIndex(3, -1, CARDS_COUNT)).toBe(2);
  });

  it("primeira carta: não existe índice anterior — nunca fica negativo", () => {
    expect(getAdjacentFaqCardIndex(0, -1, CARDS_COUNT)).toBe(0);
  });

  it("última carta: não existe índice seguinte — nunca ultrapassa o total", () => {
    expect(getAdjacentFaqCardIndex(CARDS_COUNT - 1, 1, CARDS_COUNT)).toBe(
      CARDS_COUNT - 1,
    );
  });

  it("nunca dá wrap-around (última + 1 não volta pra primeira, primeira - 1 não vai pra última)", () => {
    expect(getAdjacentFaqCardIndex(CARDS_COUNT - 1, 1, CARDS_COUNT)).not.toBe(
      0,
    );
    expect(getAdjacentFaqCardIndex(0, -1, CARDS_COUNT)).not.toBe(
      CARDS_COUNT - 1,
    );
  });

  it("interação repetida na mesma direção, no limite, é idempotente", () => {
    let index = CARDS_COUNT - 1;
    for (let i = 0; i < 5; i++) {
      index = getAdjacentFaqCardIndex(index, 1, CARDS_COUNT);
    }
    expect(index).toBe(CARDS_COUNT - 1);
  });

  it("entrada fora de faixa é tratada com segurança, sem lançar exceção", () => {
    expect(() => getAdjacentFaqCardIndex(NaN, 1, CARDS_COUNT)).not.toThrow();
    expect(() => getAdjacentFaqCardIndex(-50, 1, CARDS_COUNT)).not.toThrow();
    expect(() => getAdjacentFaqCardIndex(50, 1, CARDS_COUNT)).not.toThrow();
  });
});

describe("getFaqCardTargetScroll", () => {
  it("equivalência manual: reproduz exatamente o cálculo original de advance()", () => {
    const currentIndex = 2;
    const direction = 1;
    const scrollRangeStart = 1000;
    const scrollRangeEnd = 5000;

    const expectedTargetIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      CARDS_COUNT - 1,
    );
    const expectedTargetY =
      scrollRangeStart +
      MARK_PROGRESS[expectedTargetIndex] * (scrollRangeEnd - scrollRangeStart);

    const result = getFaqCardTargetScroll(
      currentIndex,
      direction,
      scrollRangeStart,
      scrollRangeEnd,
      CARDS_COUNT,
    );
    expect(result.targetIndex).toBe(expectedTargetIndex);
    expect(result.targetScrollY).toBeCloseTo(expectedTargetY, 10);
  });

  it("progresso 0 (primeira carta) mapeia para o início do intervalo de scroll", () => {
    const result = getFaqCardTargetScroll(0, -1, 1000, 5000, CARDS_COUNT);
    expect(result.targetScrollY).toBeCloseTo(1000, 10);
  });

  it("última carta mapeia para o marco real dela (< 1.0), nunca para o fim absoluto do intervalo — mesmo achado do bloco de configuração acima", () => {
    const result = getFaqCardTargetScroll(
      CARDS_COUNT - 1,
      1,
      1000,
      5000,
      CARDS_COUNT,
    );
    const expectedY = 1000 + MARK_PROGRESS[CARDS_COUNT - 1] * (5000 - 1000);
    expect(result.targetScrollY).toBeCloseTo(expectedY, 10);
    expect(result.targetScrollY).toBeLessThan(5000);
  });

  it("nunca produz NaN ou Infinity para entradas válidas", () => {
    for (let index = 0; index < CARDS_COUNT; index++) {
      const forward = getFaqCardTargetScroll(index, 1, 0, 3900, CARDS_COUNT);
      const backward = getFaqCardTargetScroll(index, -1, 0, 3900, CARDS_COUNT);
      expect(Number.isFinite(forward.targetScrollY)).toBe(true);
      expect(Number.isFinite(backward.targetScrollY)).toBe(true);
    }
  });

  it("progressão para frente, carta a carta, cobre exatamente os marcos configurados", () => {
    let index = 0;
    for (let step = 0; step < CARDS_COUNT - 1; step++) {
      const result = getFaqCardTargetScroll(index, 1, 0, 1, CARDS_COUNT);
      expect(result.targetScrollY).toBeCloseTo(MARK_PROGRESS[index + 1], 10);
      index = result.targetIndex;
    }
  });

  it("progressão reversa: função pura, sem memória — mesmo estado de entrada sempre produz o mesmo resultado", () => {
    const before = getFaqCardTargetScroll(3, -1, 0, 1, CARDS_COUNT);
    getFaqCardTargetScroll(5, 1, 0, 1, CARDS_COUNT); // chamada intermediária não deveria afetar nada
    const again = getFaqCardTargetScroll(3, -1, 0, 1, CARDS_COUNT);
    expect(again).toEqual(before);
  });

  it("interação repetida no limite superior é idempotente — sempre o mesmo índice e o mesmo marco real (não 1.0)", () => {
    let result = getFaqCardTargetScroll(CARDS_COUNT - 1, 1, 0, 1, CARDS_COUNT);
    const firstY = result.targetScrollY;
    for (let i = 0; i < 3; i++) {
      result = getFaqCardTargetScroll(result.targetIndex, 1, 0, 1, CARDS_COUNT);
    }
    expect(result.targetIndex).toBe(CARDS_COUNT - 1);
    expect(result.targetScrollY).toBeCloseTo(firstY, 10);
    expect(result.targetScrollY).toBeCloseTo(
      MARK_PROGRESS[CARDS_COUNT - 1],
      10,
    );
  });
});
