import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HumanReviewForm } from "@/components/ace/human-review-form";
import type { CompatibilityMatrix, DimensionResult } from "@/modules/ace/artifacts/compatibility-matrix";
import type { Shortlist } from "@/modules/ace/artifacts/shortlist";

const { submitHumanReviewActionMock } = vi.hoisted(() => ({
  submitHumanReviewActionMock: vi.fn(),
}));

vi.mock("@/modules/concierge/human-review-actions", () => ({
  submitHumanReviewAction: submitHumanReviewActionMock,
}));

afterEach(cleanup);

beforeEach(() => {
  submitHumanReviewActionMock.mockReset();
  vi.stubGlobal("location", { ...window.location, reload: vi.fn() });
});

const PROVIDER_A = "provider-a";
const PROVIDER_B = "provider-b";
const PROVIDER_C = "provider-c";
const PROVIDER_D = "provider-d";

function qualifiedDimensionResult(): DimensionResult {
  return { classification: "ADEQUATE", rationale: "Atende ao esperado.", evidence: ["registro"] };
}

function buildEntry(providerId: string, qualified = true) {
  return {
    providerId,
    dimensionResults: {
      competencyAlignment: qualified ? qualifiedDimensionResult() : { ...qualifiedDimensionResult(), classification: "INSUFFICIENT" as const },
      experienceAlignment: qualifiedDimensionResult(),
      contextAlignment: qualifiedDimensionResult(),
      strategyAlignment: qualifiedDimensionResult(),
      constraintAlignment: qualifiedDimensionResult(),
      continuityAlignment: qualifiedDimensionResult(),
    },
    strengths: [],
    limitations: [],
    missingInformation: [],
    rationale: "Avaliação geral registrada.",
    sourceArtifacts: [],
    producedBy: "P007" as const,
    version: 1,
    createdAt: new Date().toISOString(),
  };
}

function buildCompatibilityMatrix(): CompatibilityMatrix {
  return {
    id: "matrix-1",
    version: 1,
    createdAt: new Date().toISOString(),
    producedBy: "P007",
    decisional: false,
    entries: [buildEntry(PROVIDER_A), buildEntry(PROVIDER_B), buildEntry(PROVIDER_C), buildEntry(PROVIDER_D, false)],
    sourceArtifacts: [],
    methodVersion: "ACE-0.1",
  };
}

function buildComposedShortlist(): Shortlist {
  return {
    id: "shortlist-1",
    version: 1,
    createdAt: new Date().toISOString(),
    producedBy: "P008",
    decisional: false,
    status: "COMPOSED",
    blockedReason: null,
    selectedProviderIds: [PROVIDER_A, PROVIDER_B, PROVIDER_C],
    candidateProviderIds: [],
    providerRationales: [],
    compositionRationale: "Três profissionais qualificados selecionados.",
    relevantLimitations: [],
    missingInformation: [],
    sourceArtifact: { artifactId: "matrix-1", artifactVersion: 1, artifactType: "CompatibilityMatrix" },
    methodVersion: "ACE-0.1",
  };
}

const namesByProviderId = {
  [PROVIDER_A]: "Ana Profissional",
  [PROVIDER_B]: "Bruno Profissional",
  [PROVIDER_C]: "Carla Profissional",
  [PROVIDER_D]: "Diego Profissional",
};

describe("HumanReviewForm", () => {
  it("APPROVE é a ação padrão quando a Shortlist está COMPOSED", () => {
    render(
      <HumanReviewForm
        caseId="case-1"
        shortlist={buildComposedShortlist()}
        compatibilityMatrix={buildCompatibilityMatrix()}
        qualifiedProviderIds={[PROVIDER_A, PROVIDER_B, PROVIDER_C]}
        namesByProviderId={namesByProviderId}
      />,
    );
    expect((screen.getByLabelText("Aprovar integralmente") as HTMLInputElement).checked).toBe(true);
  });

  it("o botão de registrar decisão fica desabilitado até a justificativa e a evidência serem preenchidas", async () => {
    const user = userEvent.setup();
    render(
      <HumanReviewForm
        caseId="case-1"
        shortlist={buildComposedShortlist()}
        compatibilityMatrix={buildCompatibilityMatrix()}
        qualifiedProviderIds={[PROVIDER_A, PROVIDER_B, PROVIDER_C]}
        namesByProviderId={namesByProviderId}
      />,
    );

    const submit = screen.getByRole("button", { name: "Registrar decisão" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Justificativa da decisão"), "Composição adequada às necessidades.");
    expect(submit).toBeDisabled(); // ainda falta evidência (APPROVE exige)

    await user.type(screen.getByPlaceholderText("Nova evidência"), "Shortlist.compositionRationale");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(submit).not.toBeDisabled();
  });

  it("ao trocar para Rejeitar, evidência deixa de ser obrigatória e aparece o campo de retorno ao estágio", async () => {
    const user = userEvent.setup();
    render(
      <HumanReviewForm
        caseId="case-1"
        shortlist={buildComposedShortlist()}
        compatibilityMatrix={buildCompatibilityMatrix()}
        qualifiedProviderIds={[PROVIDER_A, PROVIDER_B, PROVIDER_C]}
        namesByProviderId={namesByProviderId}
      />,
    );

    await user.click(screen.getByLabelText("Rejeitar"));
    expect(screen.getByLabelText("Retornar a qual etapa? (opcional)")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Justificativa da decisão"), "Faltam informações essenciais do paciente.");
    expect(screen.getByRole("button", { name: "Registrar decisão" })).not.toBeDisabled();
  });

  it("em Ajustar, desmarcar um profissional da Shortlist original exige justificativa e evidência daquela alteração", async () => {
    const user = userEvent.setup();
    render(
      <HumanReviewForm
        caseId="case-1"
        shortlist={buildComposedShortlist()}
        compatibilityMatrix={buildCompatibilityMatrix()}
        qualifiedProviderIds={[PROVIDER_A, PROVIDER_B, PROVIDER_C]}
        namesByProviderId={namesByProviderId}
      />,
    );

    await user.click(screen.getByLabelText("Ajustar composição"));
    expect(screen.getByText(/Selecionados: 3 de 3\./)).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Ana Profissional/));
    expect(screen.getByText(/Selecionados: 2 de 3\./)).toBeInTheDocument();

    // Justificativa geral preenchida, mas a alteração específica ainda não —
    // o botão continua desabilitado.
    await user.type(screen.getByLabelText("Justificativa da decisão"), "Ana está indisponível no momento.");
    const globalEvidence = screen.getByPlaceholderText("Nova evidência");
    await user.type(globalEvidence, "Confirmação por telefone");
    await user.click(screen.getAllByRole("button", { name: "Adicionar" })[0]);
    expect(screen.getByRole("button", { name: "Registrar decisão" })).toBeDisabled();
  });

  it("um profissional com análise insuficiente e fora da Shortlist original não pode ser incluído", async () => {
    const user = userEvent.setup();
    render(
      <HumanReviewForm
        caseId="case-1"
        shortlist={buildComposedShortlist()}
        compatibilityMatrix={buildCompatibilityMatrix()}
        qualifiedProviderIds={[PROVIDER_A, PROVIDER_B, PROVIDER_C]}
        namesByProviderId={namesByProviderId}
      />,
    );

    await user.click(screen.getByLabelText("Ajustar composição"));
    const checkbox = screen.getByLabelText(/Diego Profissional/) as HTMLInputElement;
    expect(checkbox).toBeDisabled();
  });

  it("envia a decisão e recarrega a página em caso de sucesso", async () => {
    submitHumanReviewActionMock.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(
      <HumanReviewForm
        caseId="case-42"
        shortlist={buildComposedShortlist()}
        compatibilityMatrix={buildCompatibilityMatrix()}
        qualifiedProviderIds={[PROVIDER_A, PROVIDER_B, PROVIDER_C]}
        namesByProviderId={namesByProviderId}
      />,
    );

    await user.type(screen.getByLabelText("Justificativa da decisão"), "Composição adequada às necessidades.");
    await user.type(screen.getByPlaceholderText("Nova evidência"), "Shortlist.compositionRationale");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await user.click(screen.getByRole("button", { name: "Registrar decisão" }));

    expect(submitHumanReviewActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ caseId: "case-42", reviewAction: "APPROVE" }),
    );
    expect(window.location.reload).toHaveBeenCalled();
  });
});
