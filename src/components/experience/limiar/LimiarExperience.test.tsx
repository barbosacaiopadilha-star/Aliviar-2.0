import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  FILM_ASSIMILATION_MS,
  FILM_FALLBACK_POSTER_MS,
  FILM_OPENING_MS,
} from "./film-model";
import { LimiarExperience } from "./LimiarExperience";
import {
  THRESHOLD_GESTURE_HINT,
  THRESHOLD_GESTURE_READY_MS,
} from "./threshold-gesture";

describe("LimiarExperience", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLVideoElement.prototype.pause = vi.fn();
    HTMLVideoElement.prototype.load = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderLimiar(filmAvailable = false) {
    return render(
      <LimiarExperience filmSrc="/film/aliviar.mp4" filmAvailable={filmAvailable} />,
    );
  }

  function advanceGestureReady() {
    act(() => {
      vi.advanceTimersByTime(THRESHOLD_GESTURE_READY_MS);
    });
  }

  it("threshold inicial não avança sozinho", () => {
    renderLimiar(false);

    expect(screen.getByText("A luz ficou acesa.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(THRESHOLD_GESTURE_READY_MS - 1);
    });

    expect(screen.queryByText(THRESHOLD_GESTURE_HINT)).not.toBeInTheDocument();
    expect(screen.queryByText("Isso fica com você.")).not.toBeInTheDocument();
  });

  it("hint aparece quando gestureReady", () => {
    renderLimiar(false);
    advanceGestureReady();

    expect(screen.getByText(THRESHOLD_GESTURE_HINT)).toBeInTheDocument();
  });

  it("clique após o gate inicia opening", () => {
    const { container } = renderLimiar(false);
    advanceGestureReady();

    fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));

    expect(container.querySelector(".limiar--opening")).toBeTruthy();
    expect(screen.queryByText(THRESHOLD_GESTURE_HINT)).not.toBeInTheDocument();
  });

  // Enter/Espaço: a luz não tem handler de teclado próprio — é um <button>
  // nativo, e o navegador despacha click ao receber Enter (keydown) ou Espaço
  // (keyup). O contrato verificável que garante o teclado é ser um button real,
  // habilitado e sem aria-disabled quando liberado; a ativação abre o filme.
  it("Enter: a luz é um botão nativo operável e abre o filme ao ativar", () => {
    const { container } = renderLimiar(false);
    advanceGestureReady();

    const button = screen.getByRole("button", { name: "Tocar a luz" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-disabled");

    button.focus();
    expect(button).toHaveFocus();

    fireEvent.click(button); // ativação que o Enter produz nativamente
    expect(container.querySelector(".limiar--opening")).toBeTruthy();
  });

  it("Espaço: a luz permanece operável por teclado do início ao fim do gate", () => {
    const { container } = renderLimiar(false);

    // Antes do gate: focável e habilitado (aria-disabled apenas anuncia espera).
    const awaiting = screen.getByRole("button", { name: "Aguardando a luz" });
    expect(awaiting).toBeEnabled();
    awaiting.focus();
    expect(awaiting).toHaveFocus();

    advanceGestureReady();

    const ready = screen.getByRole("button", { name: "Tocar a luz" });
    expect(ready).toBeEnabled();
    fireEvent.click(ready); // ativação que o Espaço produz nativamente
    expect(container.querySelector(".limiar--opening")).toBeTruthy();
  });

  it("clique antecipado é preservado e executado no momento correto", () => {
    const { container } = renderLimiar(false);

    fireEvent.click(screen.getByRole("button", { name: "Aguardando a luz" }));

    expect(container.querySelector(".limiar--gesture-acknowledged")).toBeTruthy();
    expect(container.querySelector(".limiar--opening")).toBeFalsy();

    advanceGestureReady();

    expect(container.querySelector(".limiar--opening")).toBeTruthy();
  });

  it("clique duplicado não dispara duas transições", () => {
    const { container } = renderLimiar(false);
    advanceGestureReady();

    const button = screen.getByRole("button", { name: "Tocar a luz" });
    fireEvent.click(button);
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(
        FILM_OPENING_MS + FILM_FALLBACK_POSTER_MS + FILM_ASSIMILATION_MS + 500,
      );
    });

    expect(container.querySelectorAll(".limiar__continuation").length).toBe(1);
    expect(screen.getByText("Isso fica com você.")).toBeInTheDocument();
  });

  it("erro do vídeo não chama handleFilmEnded", () => {
    const { container } = renderLimiar(true);
    advanceGestureReady();

    fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));

    act(() => {
      vi.advanceTimersByTime(FILM_OPENING_MS);
    });

    const video = container.querySelector("video");
    expect(video).toBeTruthy();

    fireEvent.error(video!);

    expect(container.querySelector(".limiar--assimilation")).toBeTruthy();
  });

  it("término natural do vídeo avança para assimilation", () => {
    const { container } = renderLimiar(true);
    advanceGestureReady();

    fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));

    act(() => {
      vi.advanceTimersByTime(FILM_OPENING_MS);
    });

    fireEvent.ended(container.querySelector("video")!);

    expect(container.querySelector(".limiar--assimilation")).toBeTruthy();
  });

  it("fallback mantém acesso à continuação sem request de vídeo", () => {
    const { container } = renderLimiar(false);
    advanceGestureReady();

    fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));

    expect(container.querySelector("video source")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(
        FILM_OPENING_MS + FILM_FALLBACK_POSTER_MS + FILM_ASSIMILATION_MS + 500,
      );
    });

    expect(screen.getByText("Isso fica com você.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /podemos conversar/i })).toBeInTheDocument();
  });

  it("não carrega o vídeo antes do gesto", () => {
    const loadSpy = vi.spyOn(HTMLVideoElement.prototype, "load");
    renderLimiar(true);

    advanceGestureReady();

    expect(loadSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));

    expect(loadSpy).toHaveBeenCalled();
  });

  it("prefers-reduced-motion não altera o fluxo (movimento é puramente CSS)", () => {
    // O componente não ramifica em JS por reduced-motion — o respeito à
    // preferência é feito no CSS. Este teste garante que, mesmo com a query
    // ativa, o gate e o gesto continuam funcionando sem quebrar.
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    try {
      const { container } = renderLimiar(false);
      advanceGestureReady();

      fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));
      expect(container.querySelector(".limiar--opening")).toBeTruthy();
    } finally {
      window.matchMedia = original;
    }
  });

  it("play() bloqueado (autoplay) cai no fallback editorial sem travar", async () => {
    // Simula a política de autoplay do iOS: todo play() rejeita. O primer é
    // inofensivo e o play() real cai no catch → assimilação (a experiência
    // continua, sem hang e sem ficar presa no vídeo).
    HTMLVideoElement.prototype.play = vi.fn().mockRejectedValue(new Error("blocked"));

    const { container } = renderLimiar(true);
    advanceGestureReady();

    fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));

    // Avança a abertura e deixa as promessas rejeitadas (primer e play real)
    // assentarem dentro do act.
    await act(async () => {
      vi.advanceTimersByTime(FILM_OPENING_MS);
    });

    expect(container.querySelector(".limiar--assimilation")).toBeTruthy();
  });

  it("limpa os timers agendados ao desmontar", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { container, unmount } = renderLimiar(false);
    advanceGestureReady();

    // Agenda os timers do fluxo de filme (opening/poster/assimilação).
    fireEvent.click(screen.getByRole("button", { name: "Tocar a luz" }));
    expect(container.querySelector(".limiar--opening")).toBeTruthy();

    clearSpy.mockClear();
    unmount();

    // O cleanup do efeito limpa os timers pendentes em timersRef.
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
