import { describe, expect, it } from "vitest";

import {
  createFinalCuradoria,
  type CreateFinalCuradoriaInput,
  type ProviderPresentation,
} from "@/modules/ace/artifacts/final-curadoria";
import { ProtocolError } from "@/modules/ace/core/error-contract";

function buildProviderPresentation(providerId: string, overrides: Partial<ProviderPresentation> = {}): ProviderPresentation {
  return {
    providerId,
    displayName: `Provider ${providerId}`,
    professionalSummary: "Psicólogo(a) com experiência em ansiedade.",
    whyIncluded: "Selecionado por atender aos requisitos essenciais do caso.",
    strengthsForThisCase: ["Forte alinhamento em competência."],
    relevantLimitations: [],
    practicalConsiderations: ["Atendimento por vídeo."],
    ...overrides,
  };
}

function buildValidInput(): CreateFinalCuradoriaInput {
  return {
    validatedBy: "reviewer-1",
    validatedAt: "2026-07-12T00:00:00.000Z",
    humanReviewReference: { artifactId: "review-1", artifactVersion: 1, artifactType: "HumanReviewResult" },
    caseReference: { artifactId: "case-1", artifactVersion: 1, artifactType: "DecisionCase" },
    generatedAt: "2026-07-12T00:00:00.000Z",
    decisionSummary: "Você busca um espaço de escuta para lidar com a ansiedade.",
    clientContextSummary: "O caso foi modelado como uma busca por acompanhamento contínuo, sem urgência sinalizada.",
    providerPresentations: [
      buildProviderPresentation("provider-A"),
      buildProviderPresentation("provider-B"),
      buildProviderPresentation("provider-C"),
    ],
    comparisonSummary: "Os três providers foram selecionados por compatibilidade com o caso; a ordem de apresentação é neutra.",
    relevantLimitations: [],
    relevantMissingInformation: [],
    nextSteps: ["Entre em contato com o provider de sua escolha."],
    methodExplanation: "A Aliviar realizou uma curadoria independente com base no seu caso.",
    disclaimer: "Esta curadoria não substitui consulta, diagnóstico ou tratamento médico.",
    methodVersion: "ACE-0.1",
  };
}

describe("FinalCuradoria", () => {
  it("é criada com decisional: false e producedBy: P010", () => {
    const curadoria = createFinalCuradoria(buildValidInput());

    expect(curadoria.decisional).toBe(false);
    expect(curadoria.producedBy).toBe("P010");
  });

  it("preserva a proveniência da decisão humana", () => {
    const curadoria = createFinalCuradoria(buildValidInput());

    expect(curadoria.validatedBy).toBe("reviewer-1");
    expect(curadoria.validatedAt).toBe("2026-07-12T00:00:00.000Z");
    expect(curadoria.humanReviewReference).toEqual({
      artifactId: "review-1",
      artifactVersion: 1,
      artifactType: "HumanReviewResult",
    });
  });

  it("exige exatamente três providerPresentations", () => {
    const input = buildValidInput();
    input.providerPresentations = input.providerPresentations.slice(0, 2);

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("rejeita providers duplicados", () => {
    const input = buildValidInput();
    input.providerPresentations[2] = { ...input.providerPresentations[0] };

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("rejeita ordem fora do padrão neutro (providerId)", () => {
    const input = buildValidInput();
    input.providerPresentations = [
      buildProviderPresentation("provider-C"),
      buildProviderPresentation("provider-A"),
      buildProviderPresentation("provider-B"),
    ];

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("rejeita expressões de ranking/vencedor (ex.: 'melhor opção')", () => {
    const input = buildValidInput();
    input.providerPresentations[0].whyIncluded = "Esta é a melhor opção para o seu caso.";

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("rejeita percentual em qualquer texto", () => {
    const input = buildValidInput();
    input.comparisonSummary = "Compatibilidade de 92% com o caso.";

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("aceita a menção a 'diagnóstico' no disclaimer obrigatório (nunca substitui, não é uma claim)", () => {
    const input = buildValidInput();
    input.disclaimer = "Esta curadoria não substitui consulta, diagnóstico ou tratamento médico.";

    expect(() => createFinalCuradoria(input)).not.toThrow();
  });

  it("exige disclaimer não vazio", () => {
    const input = buildValidInput();
    input.disclaimer = "";

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("exige ao menos um nextStep", () => {
    const input = buildValidInput();
    input.nextSteps = [];

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("rejeita campos proibidos do Kernel (ex.: finalDecision)", () => {
    const input = { ...buildValidInput(), finalDecision: "provider-A" } as unknown as CreateFinalCuradoriaInput;

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("nunca contém campo de score ou ranking", () => {
    const curadoria = createFinalCuradoria(buildValidInput());

    expect(curadoria).not.toHaveProperty("score");
    expect(curadoria).not.toHaveProperty("ranking");
  });

  it("é imutável após criada", () => {
    const curadoria = createFinalCuradoria(buildValidInput());

    expect(() => {
      (curadoria.providerPresentations as unknown as unknown[]).push({});
    }).toThrow();
  });

  it("resultado determinístico para as mesmas entradas", () => {
    const input = buildValidInput();
    const a = createFinalCuradoria(input);
    const b = createFinalCuradoria(input);

    const { id: _idA, ...restA } = a;
    const { id: _idB, ...restB } = b;
    expect(restA).toEqual(restB);
  });
});
