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

  it("Enter inicia opening", () => {
    const { container } = renderLimiar(false);
    advanceGestureReady();

    const button = screen.getByRole("button", { name: "Tocar a luz" });
    fireEvent.click(button);

    expect(container.querySelector(".limiar--gesture-acknowledged")).toBeTruthy();
    expect(container.querySelector(".limiar--opening")).toBeTruthy();
  });

  it("Espaço inicia opening", () => {
    const { container } = renderLimiar(false);
    advanceGestureReady();

    const button = screen.getByRole("button", { name: "Tocar a luz" });
    fireEvent.keyDown(button, { key: " ", code: "Space" });
    fireEvent.click(button);

    expect(container.querySelector(".limiar--gesture-acknowledged")).toBeTruthy();
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
});
