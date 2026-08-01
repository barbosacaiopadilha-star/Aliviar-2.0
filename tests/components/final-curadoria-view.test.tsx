import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FinalCuradoriaView } from "@/components/patient/final-curadoria-view";
import type { FinalCuradoriaDeliveryRecord } from "@/modules/concierge/types";

afterEach(cleanup);

function buildDelivery(overrides: Partial<FinalCuradoriaDeliveryRecord> = {}): FinalCuradoriaDeliveryRecord {
  return {
    id: "delivery-1",
    caseId: "case-1",
    patientProfileId: "patient-1",
    humanReviewResultId: "review-1",
    validatedBy: "user-1",
    validatedByName: "Dra. Revisora",
    validatedAt: new Date("2026-07-12T10:00:00Z").toISOString(),
    deliveredBy: "user-1",
    deliveredByName: "Dra. Revisora",
    deliveredAt: new Date("2026-07-12T11:00:00Z").toISOString(),
    generatedAt: new Date("2026-07-12T11:00:00Z").toISOString(),
    decisionSummary: 'Você nos contou: "buscar apoio para ansiedade"',
    clientContextSummary: "Você está buscando uma avaliação inicial.",
    providerPresentations: [
      {
        providerId: "provider-a",
        displayName: "Ana Profissional",
        professionalSummary: "Psicóloga com experiência em ansiedade.",
        whyIncluded: "Justificativa da inclusão.",
        strengthsForThisCase: ["Forte alinhamento em experiência."],
        relevantLimitations: [],
        practicalConsiderations: ["Atende também por telemedicina."],
      },
    ],
    comparisonSummary: "Ordem alfabética, sem preferência entre os três.",
    relevantLimitations: [],
    relevantMissingInformation: [],
    nextSteps: ["Entre em contato quando se sentir pronto(a)."],
    methodExplanation:
      "Esta Curadoria foi construída a partir da sua história, analisada pelo Método ACE e validada por um Curador Médico da equipe Aliviar.",
    disclaimer: "Esta Curadoria nunca substitui uma consulta, diagnóstico ou tratamento médico.",
    methodVersion: "ACE-0.1",
    version: 1,
    createdAt: new Date("2026-07-12T11:00:00Z").toISOString(),
    ...overrides,
  };
}

describe("FinalCuradoriaView", () => {
  it("mostra o resumo da decisão, a explicação do método e o disclaimer", () => {
    render(<FinalCuradoriaView delivery={buildDelivery()} />);
    expect(screen.getByText('Você nos contou: "buscar apoio para ansiedade"')).toBeInTheDocument();
    expect(screen.getByText(/Método ACE/)).toBeInTheDocument();
    expect(screen.getByText(/nunca substitui uma consulta/)).toBeInTheDocument();
  });

  it("mostra os profissionais recomendados com capacidades e considerações práticas", () => {
    render(<FinalCuradoriaView delivery={buildDelivery()} />);
    expect(screen.getByText("Ana Profissional")).toBeInTheDocument();
    expect(screen.getByText("Forte alinhamento em experiência.")).toBeInTheDocument();
    expect(screen.getByText("Atende também por telemedicina.")).toBeInTheDocument();
    expect(screen.queryByText("Vale considerar")).not.toBeInTheDocument();
  });

  it("mostra limitações apenas quando existirem", () => {
    const delivery = buildDelivery({
      providerPresentations: [
        {
          providerId: "provider-a",
          displayName: "Ana Profissional",
          professionalSummary: "Psicóloga com experiência em ansiedade.",
          whyIncluded: "Justificativa da inclusão.",
          strengthsForThisCase: [],
          relevantLimitations: ["Agenda com espera de duas semanas."],
          practicalConsiderations: [],
        },
      ],
    });
    render(<FinalCuradoriaView delivery={delivery} />);
    expect(screen.getByText("Vale considerar")).toBeInTheDocument();
    expect(screen.getByText("Agenda com espera de duas semanas.")).toBeInTheDocument();
  });

  it("nenhum ordinal ou marca de colocação aparece junto aos caminhos (A_MESA N2)", () => {
    // "Primeiro caminho" lê como colocação, e posição nunca significa
    // preferência — mesmo no formato legado, recuado como documento histórico.
    const { container } = render(<FinalCuradoriaView delivery={buildDelivery()} />);
    const texto = (container.textContent ?? "").toLowerCase();
    for (const proibido of ["primeiro caminho", "segundo caminho", "terceiro caminho", "opção 1", "1ª", "2ª", "3ª"]) {
      expect(texto, `ordinal vazou: ${proibido}`).not.toContain(proibido);
    }
  });

  it("nunca exibe vocabulário de score, ranking ou protocolo", () => {
    const { container } = render(<FinalCuradoriaView delivery={buildDelivery()} />);
    const text = container.textContent!.toLowerCase();
    for (const forbidden of ["score", "ranking", "p001", "p008", "protocolo", "shortlist", "fake-deterministic"]) {
      expect(text).not.toContain(forbidden);
    }
  });
});
