import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AceCard,
  BlockingCard,
  JourneyStatus,
  JourneyTimeline,
  NextStepCard,
} from "@/components/canonical";
import { LandingSurface } from "@/components/canonical/surfaces/LandingSurface";
import { MinhaJornadaSurface } from "@/components/canonical/surfaces/MinhaJornadaSurface";
import { OnboardingSurface } from "@/components/canonical/surfaces/OnboardingSurface";
import { JORNADA_FIXTURES } from "@/experience-layer/fixtures/jornada-fixtures";
import { mapLandingExperienceModel } from "@/experience-layer/mappers/landing";
import { mapAceExperienceModel } from "@/experience-layer/mappers/ace";
import { mapMinhaJornadaExperienceModel } from "@/experience-layer/mappers/minha-jornada";
import { mapOnboardingExperienceModel } from "@/experience-layer/mappers/onboarding";

describe("Canonical components", () => {
  it("renderiza LandingSurface sem estado interno", () => {
    render(<LandingSurface model={mapLandingExperienceModel()} />);
    expect(screen.getByTestId("landing-surface")).toBeInTheDocument();
    expect(screen.getByTestId("landing-cta")).toHaveAttribute("href", "/onboarding?fixture=primeiro-contato");
  });

  it("renderiza OnboardingSurface com progresso", () => {
    const model = mapOnboardingExperienceModel(JORNADA_FIXTURES.metodo);
    if (!model) throw new Error("model expected");
    render(<OnboardingSurface model={model} />);
    expect(screen.getByTestId("onboarding-surface")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-step-ENTENDIMENTO_METODO")).toHaveAttribute(
      "data-status",
      "ATUAL",
    );
  });

  it("renderiza timeline sem interpretar eventos", () => {
    const items = JORNADA_FIXTURES.ace.timeline;
    render(<JourneyTimeline items={items} />);
    expect(screen.getByTestId("journey-timeline")).toBeInTheDocument();
    expect(screen.getByText("Sua jornada começou")).toBeInTheDocument();
    expect(screen.getByText("História recebida")).toBeInTheDocument();
  });

  it("renderiza JourneyStatus a partir de estado visível", () => {
    render(<JourneyStatus estado_visivel="EM_CURADORIA" />);
    expect(screen.getByTestId("journey-status")).toHaveAttribute("data-estado", "EM_CURADORIA");
    expect(screen.getByText("Em curadoria")).toBeInTheDocument();
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
    const ace = mapAceExperienceModel(JORNADA_FIXTURES.entrega);
    if (!ace) throw new Error("ace expected");
    const { container } = render(<AceCard ace={ace} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("AceCard presente renderiza", () => {
    const ace = mapAceExperienceModel(JORNADA_FIXTURES.ace);
    if (!ace) throw new Error("ace expected");
    render(<AceCard ace={ace} />);
    expect(screen.getByTestId("ace-card")).toHaveAttribute("data-visibilidade", "PRESENTE");
  });

  it("BlockingCard renderiza bloqueio", () => {
    const bloqueio = JORNADA_FIXTURES["bloqueio-documento"].bloqueio;
    if (!bloqueio) throw new Error("bloqueio expected");
    render(<BlockingCard bloqueio={bloqueio} />);
    expect(screen.getByTestId("blocking-card")).toBeInTheDocument();
    expect(screen.getByText(bloqueio.motivo_humano)).toBeInTheDocument();
  });

  it("MinhaJornadaSurface integra componentes", () => {
    const model = mapMinhaJornadaExperienceModel(JORNADA_FIXTURES.ace);
    const ace = mapAceExperienceModel(JORNADA_FIXTURES.ace);
    render(<MinhaJornadaSurface model={model} ace={ace} />);
    expect(screen.getByTestId("minha-jornada-surface")).toBeInTheDocument();
    expect(screen.getByTestId("ace-card")).toBeInTheDocument();
    expect(screen.getByTestId("journey-timeline")).toBeInTheDocument();
  });
});
