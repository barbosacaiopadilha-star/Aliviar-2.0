import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VideoSection } from "@/components/landing/video-section";

// LANDING DO PACIENTE — Fase 2 (Hardening), Etapa 2: o vídeo institucional
// era o único elemento do Portal que ignorava `prefers-reduced-motion` —
// autoplay sempre ativo, independente da preferência (achado da Fase 1,
// Etapa 6/12). Este teste prova as duas pontas do comportamento corrigido:
// sem redução, autoplay real (nunca dependente do atributo `autoPlay`,
// sempre de um `.play()` disparado só depois que a preferência é
// conhecida); com redução, nada toca sozinho, e uma ação manual real
// continua disponível.

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: reduced,
    media: "",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

const SRC = "/videos/video-institucional-aliviar.webm";

describe("VideoSection — prefers-reduced-motion", () => {
  let playMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // jsdom não implementa reprodução de mídia real — sem este stub,
    // qualquer chamada a `.play()` lançaria "Not implemented".
    playMock = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.play = playMock;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sem redução de movimento: reproduz automaticamente, sem exigir ação manual", async () => {
    mockMatchMedia(false);
    render(<VideoSection src={SRC} />);

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByRole("button", { name: "Reproduzir vídeo" }),
    ).not.toBeInTheDocument();
  });

  it("com redução de movimento: nunca reproduz sozinho, e mantém uma ação manual real para tocar", async () => {
    mockMatchMedia(true);
    render(<VideoSection src={SRC} />);

    const playButton = await screen.findByRole("button", {
      name: "Reproduzir vídeo",
    });
    // Tempo suficiente para qualquer autoplay indevido já ter acontecido.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(playMock).not.toHaveBeenCalled();

    playButton.click();

    await waitFor(() => expect(playMock).toHaveBeenCalledTimes(1));
  });

  it("com redução de movimento, o botão manual some depois que a reprodução começa", async () => {
    mockMatchMedia(true);
    render(<VideoSection src={SRC} />);

    const playButton = await screen.findByRole("button", {
      name: "Reproduzir vídeo",
    });
    playButton.click();

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Reproduzir vídeo" }),
      ).not.toBeInTheDocument(),
    );
  });
});
