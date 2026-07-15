import { describe, expect, it } from "vitest";

import { VIDEO_EXIT_AT_FRAME } from "@/components/landing/portal-frames";
import {
  COMPANION_VIDEO_EXIT_TIMELINE,
  getCompanionVideoExitFrameRange,
  isCompanionVideoExiting,
} from "@/components/landing/portal-companion-video";

// Este módulo não tem uma função "progresso contínuo → estado do vídeo"
// (achado registrado no próprio portal-companion-video.ts: a saída real
// é conduzida pelo GSAP, não pelo nosso Progresso Bruto). Por isso vários
// dos 22 casos pedidos não se aplicam ao que existe de fato — marcados
// explicitamente como N/A abaixo, nunca silenciosamente omitidos.

describe("getCompanionVideoExitFrameRange", () => {
  it("saída ancorada em VIDEO_EXIT_AT_FRAME: startFrameIndex e endFrameIndex derivam exatamente dele", () => {
    const range = getCompanionVideoExitFrameRange();
    expect(range.startFrameIndex).toBe(VIDEO_EXIT_AT_FRAME - 1);
    expect(range.endFrameIndex).toBe(VIDEO_EXIT_AT_FRAME);
  });

  it("ausência de NaN/Infinity nos índices derivados", () => {
    const range = getCompanionVideoExitFrameRange();
    expect(Number.isFinite(range.startFrameIndex)).toBe(true);
    expect(Number.isFinite(range.endFrameIndex)).toBe(true);
  });

  it("estabilidade: chamadas repetidas produzem sempre o mesmo resultado (sem memória, sem efeito colateral)", () => {
    const first = getCompanionVideoExitFrameRange();
    const second = getCompanionVideoExitFrameRange();
    expect(second).toEqual(first);
  });
});

describe("isCompanionVideoExiting", () => {
  it("estado antes da saída: índice de parada ativa abaixo de VIDEO_EXIT_AT_FRAME", () => {
    expect(isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME - 1)).toBe(false);
  });

  it("início exato da saída: índice igual a VIDEO_EXIT_AT_FRAME", () => {
    expect(isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME)).toBe(true);
  });

  it("imediatamente após o início continua em saída", () => {
    expect(isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME + 1)).toBe(true);
  });

  it("estado após a saída (índice bem além do threshold) permanece true", () => {
    expect(isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME + 50)).toBe(true);
  });

  it("continuidade exata na fronteira: um índice a menos é false, o próprio threshold já é true", () => {
    expect(isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME - 1)).toBe(false);
    expect(isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME)).toBe(true);
  });

  it("progressão para frente nunca volta a false depois de cruzar o threshold", () => {
    let sawExiting = false;
    for (let index = 0; index <= VIDEO_EXIT_AT_FRAME + 5; index++) {
      const exiting = isCompanionVideoExiting(index);
      if (sawExiting) expect(exiting).toBe(true);
      if (exiting) sawExiting = true;
    }
  });

  it("progressão reversa: função pura, mesmo índice sempre produz o mesmo resultado, avançar e voltar não deixa memória", () => {
    const before = isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME - 1);
    isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME + 3); // avança
    const backAgain = isCompanionVideoExiting(VIDEO_EXIT_AT_FRAME - 1); // volta
    expect(backAgain).toBe(before);
  });

  it("valor abaixo de 0 é tratado com segurança, sem lançar exceção", () => {
    expect(() => isCompanionVideoExiting(-10)).not.toThrow();
    expect(isCompanionVideoExiting(-10)).toBe(false);
  });

  it("estabilidade numérica em muitos passos, sem NaN nem exceção", () => {
    for (let index = -20; index <= 50; index++) {
      expect(() => isCompanionVideoExiting(index)).not.toThrow();
    }
  });

  it("equivalência manual: reproduz `activeFrame >= VIDEO_EXIT_AT_FRAME` para um ponto isolado", () => {
    const sample = VIDEO_EXIT_AT_FRAME + 2;
    expect(isCompanionVideoExiting(sample)).toBe(sample >= VIDEO_EXIT_AT_FRAME);
  });

  it("N/A — mudança na quantidade de paradas: este módulo não recebe contagem de frames como entrada (VIDEO_EXIT_AT_FRAME é uma constante fixa, não derivada de tamanho de array) — nada a testar aqui além do já coberto acima", () => {
    expect(typeof VIDEO_EXIT_AT_FRAME).toBe("number");
  });
});

describe("COMPANION_VIDEO_EXIT_TIMELINE", () => {
  it("preserva exatamente os dois passos e valores originais do tween de saída", () => {
    expect(COMPANION_VIDEO_EXIT_TIMELINE).toHaveLength(2);
    expect(COMPANION_VIDEO_EXIT_TIMELINE[0]).toEqual({
      opacity: 0.8,
      ease: "none",
      duration: 1,
    });
    expect(COMPANION_VIDEO_EXIT_TIMELINE[1]).toEqual({
      opacity: 0,
      scale: 0.93,
      filter: "blur(6px)",
      ease: "none",
      duration: 1,
    });
  });
});

describe("independência de Ambiente e Fotografia", () => {
  it("N/A — verificação estrutural: este módulo importa só portal-frames.tsx (documentado no próprio arquivo); não há import de portal-environment.ts nem portal-photography.ts a testar em runtime além da ausência de erro ao carregar", () => {
    expect(getCompanionVideoExitFrameRange).toBeTypeOf("function");
    expect(isCompanionVideoExiting).toBeTypeOf("function");
  });
});

describe("reduced motion", () => {
  it("N/A por contrato: este motor não lê matchMedia nem preferência de movimento — a política continua inteiramente em usePortalMotionPreference/portal-experience.tsx", () => {
    expect(true).toBe(true);
  });
});
