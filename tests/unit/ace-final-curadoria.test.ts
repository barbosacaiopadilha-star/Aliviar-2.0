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

  it("rejeita a palavra 'percentual' mesmo sem o símbolo %", () => {
    const input = buildValidInput();
    input.comparisonSummary = "A avaliação percentual de compatibilidade foi alta.";

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("rejeita 'score' em qualquer texto", () => {
    const input = buildValidInput();
    input.methodExplanation = "Cada provider recebe um score de compatibilidade.";

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  it("rejeita 'o melhor profissional'", () => {
    const input = buildValidInput();
    input.providerPresentations[0].whyIncluded = "Este é o melhor profissional disponível.";

    expect(() => createFinalCuradoria(input)).toThrow(ProtocolError);
  });

  // GO LIVE (auditoria do Golden Set) — "ranking" negando sua própria
  // existência é exatamente o que specification.md do P010 exige
  // (comparisonSummary "explica que não há ranking entre os três") e o
  // que prompt.md pede ao modelo para escrever. Essas construções nunca
  // podem ser tratadas como violação.
  it.each([
    "Não existe ranking entre os profissionais apresentados.",
    "Sem ranking entre os profissionais.",
    "Nunca construímos um ranking de providers.",
    "A Aliviar não cria ranking algum entre os profissionais.",
    // CAL-001 — amostra real do Golden Set, não coberta pela primeira
    // correção (lista fechada de verbos): "funciona como" não estava
    // enumerado. A verificação por cláusula/gatilho cobre sem enumerar.
    "Não funciona como um ranking.",
    "Isso não é um ranking.",
    "Sem qualquer ranking entre eles.",
    "Nenhum ranking foi feito.",
    "Jamais apresentamos os profissionais como um ranking.",
    "As opções não devem ser interpretadas como um ranking.",
  ])("aceita negação explícita de ranking: %s", (comparisonSummary) => {
    const input = buildValidInput();
    input.comparisonSummary = comparisonSummary;

    expect(() => createFinalCuradoria(input)).not.toThrow();
  });

  it.each([
    "Este profissional ocupa o primeiro lugar no ranking.",
    "O ranking indica que este é o mais compatível.",
    "Confira o ranking de compatibilidade abaixo.",
    // CAL-001 — casos adversariais: uma negação real, mas de uma oração
    // anterior e não relacionada, nunca pode "alcançar" um ranking
    // afirmado em outra oração. Cada um destes teria sido erroneamente
    // aceito por um gatilho de negação sem delimitação de cláusula.
    "Não sei se você reparou, mas este é o primeiro no ranking.",
    "Não há garantia de resultado; porém, o ranking mostra o mais indicado.",
    "Não analisamos preço. Entretanto, este é o primeiro no ranking.",
    "Não existe empate: o ranking apresenta uma ordem definitiva.",
  ])("rejeita afirmação de ranking (sem negação): %s", (comparisonSummary) => {
    const input = buildValidInput();
    input.comparisonSummary = comparisonSummary;

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
