import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  AceCard,
  BlockingCard,
  JourneyStatus,
  JourneyTimeline,
  NextStepCard,
} from "@/components/canonical";
import { CanonicalExperiencePage } from "@/components/canonical/CanonicalExperiencePage";
import { LandingSurface } from "@/components/canonical/surfaces/LandingSurface";
import { MinhaJornadaSurface } from "@/components/canonical/surfaces/MinhaJornadaSurface";
import { OnboardingSurface } from "@/components/canonical/surfaces/OnboardingSurface";
import { mapLandingExperienceModel } from "@/experience-layer/mappers/landing";
import { mapAceExperienceModel } from "@/experience-layer/mappers/ace";
import { mapMinhaJornadaExperienceModel } from "@/experience-layer/mappers/minha-jornada";
import { mapOnboardingExperienceModel } from "@/experience-layer/mappers/onboarding";
import {
  buildJornadaViewAce,
  buildJornadaViewBloqueio,
  buildJornadaViewEntrega,
  buildJornadaViewMetodo,
} from "@/test/build-jornada-view";

vi.mock("@/experience-layer/api/jornada-client", () => ({
  fetchJornadaView: vi.fn(),
  JornadaApiError: class JornadaApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

import { fetchJornadaView } from "@/experience-layer/api/jornada-client";

const mockedFetch = vi.mocked(fetchJornadaView);

describe("Canonical components", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("renderiza LandingSurface sem estado interno", () => {
    render(<LandingSurface model={mapLandingExperienceModel()} />);
    expect(screen.getByTestId("landing-surface")).toBeInTheDocument();
    expect(screen.getByTestId("landing-cta")).toHaveAttribute("href", "/comecar");
  });

  it("renderiza OnboardingSurface com progresso", () => {
    const model = mapOnboardingExperienceModel(buildJornadaViewMetodo());
    if (!model) throw new Error("model expected");
    render(<OnboardingSurface model={model} />);
    expect(screen.getByTestId("onboarding-surface")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-step-ENTENDIMENTO_METODO")).toHaveAttribute(
      "data-status",
      "ATUAL",
    );
  });

  it("renderiza timeline sem interpretar eventos", () => {
    const items = buildJornadaViewAce().timeline;
    render(<JourneyTimeline items={items} />);
    expect(screen.getByTestId("journey-timeline")).toBeInTheDocument();
    expect(screen.getByText("Cadastro e jornada iniciados")).toBeInTheDocument();
  });

  it("renderiza JourneyStatus a partir de estado visível", () => {
    render(<JourneyStatus estado_visivel="EM_CURADORIA" />);
    expect(screen.getByTestId("journey-status")).toHaveAttribute("data-estado", "EM_CURADORIA");
  });

  it("renderiza NextStepCard", () => {
    render(
      <NextStepCard
        proximo_passo={{
          titulo: "Teste",
          descricao: "Descrição",
          dono: "PACIENTE",
          acao_disponivel: true,
        }}
      />,
    );
    expect(screen.getByTestId("next-step-card")).toBeInTheDocument();
    expect(screen.getByText("Teste")).toBeInTheDocument();
  });

  it("AceCard ausente não renderiza", () => {
    const ace = mapAceExperienceModel(buildJornadaViewEntrega());
    if (!ace) throw new Error("ace expected");
    const { container } = render(<AceCard ace={ace} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("AceCard presente renderiza", () => {
    const ace = mapAceExperienceModel(buildJornadaViewAce());
    if (!ace) throw new Error("ace expected");
    render(<AceCard ace={ace} />);
    expect(screen.getByTestId("ace-card")).toHaveAttribute("data-visibilidade", "PRESENTE");
  });

  it("BlockingCard renderiza bloqueio", () => {
    const bloqueio = buildJornadaViewBloqueio().bloqueio;
    if (!bloqueio) throw new Error("bloqueio expected");
    render(<BlockingCard bloqueio={bloqueio} />);
    expect(screen.getByTestId("blocking-card")).toBeInTheDocument();
  });

  it("MinhaJornadaSurface integra componentes", () => {
    const model = mapMinhaJornadaExperienceModel(buildJornadaViewAce());
    const ace = mapAceExperienceModel(buildJornadaViewAce());
    render(<MinhaJornadaSurface model={model} ace={ace} />);
    expect(screen.getByTestId("minha-jornada-surface")).toBeInTheDocument();
    expect(screen.getByTestId("ace-card")).toBeInTheDocument();
  });
});

describe("Experience Provider integration", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("carrega jornada via API", async () => {
    mockedFetch.mockResolvedValue(buildJornadaViewAce());
    render(<CanonicalExperiencePage jornadaId="j-1" surface="minha-jornada" />);

    expect(screen.getByTestId("experience-loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("minha-jornada-surface")).toBeInTheDocument();
    });

    expect(mockedFetch).toHaveBeenCalledWith("j-1");
  });

  it("exibe erro quando API falha", async () => {
    const { JornadaApiError } = await import("@/experience-layer/api/jornada-client");
    mockedFetch.mockRejectedValue(new JornadaApiError(404, "NOT_FOUND", "Jornada não encontrada"));

    render(<CanonicalExperiencePage jornadaId="missing" surface="onboarding" />);

    await waitFor(() => {
      expect(screen.getByTestId("experience-error")).toBeInTheDocument();
    });
  });

  it("exibe ausência de jornada sem id", () => {
    render(<CanonicalExperiencePage jornadaId={null} surface="onboarding" />);
    expect(screen.getByTestId("experience-no-jornada")).toBeInTheDocument();
  });
});
