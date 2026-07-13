import { describe, expect, it, vi, beforeEach } from "vitest";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

import { createNarrative } from "@/modules/ace/artifacts/narrative";
import { AnthropicAceLanguageModel } from "@/modules/concierge/anthropic-language-model";

beforeEach(() => {
  createMock.mockReset();
});

function toolUseResponse(input: unknown) {
  return {
    content: [{ type: "tool_use", name: "submit_structured_output", input }],
  };
}

describe("AnthropicAceLanguageModel (GO LIVE — fornecedor real)", () => {
  it("P002: envia tool_choice forçado e retorna a saída estruturada do bloco tool_use", async () => {
    const expectedOutput = {
      decisionStatement: { decision: "x", goal: "y", sourceType: "fato_relatado" },
      mandatoryConstraints: [],
      preferences: [],
      missingInformation: [],
    };
    createMock.mockResolvedValue(toolUseResponse(expectedOutput));

    const model = new AnthropicAceLanguageModel("fake-key");
    const narrative = createNarrative({
      text: "Buscando apoio para ansiedade.",
      closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true },
    });

    const response = await model.run({
      protocolId: "P002",
      protocolVersion: "ACE-0.1",
      prompt: "p002",
      input: { narrative },
    });

    expect(response.metadata.status).toBe("ok");
    expect(response.output).toEqual(expectedOutput);

    const callArgs = createMock.mock.calls[0][0];
    expect(callArgs.tool_choice).toEqual({ type: "tool", name: "submit_structured_output" });
    expect(callArgs.tools[0].name).toBe("submit_structured_output");
    expect(JSON.parse(callArgs.messages[0].content)).toEqual({ narrativeText: narrative.text });
  });

  it("retorna erro estruturado para um protocolo não implementado, sem chamar a API", async () => {
    const model = new AnthropicAceLanguageModel("fake-key");
    const response = await model.run({ protocolId: "P005", protocolVersion: "ACE-0.1", prompt: "x", input: {} });

    expect(response.metadata.status).toBe("error");
    expect(response.metadata.error?.code).toBe("UNSUPPORTED_PROTOCOL");
    expect(createMock).not.toHaveBeenCalled();
  });

  it("retorna erro estruturado quando o modelo não retorna um bloco tool_use", async () => {
    createMock.mockResolvedValue({ content: [{ type: "text", text: "resposta em texto livre" }] });

    const model = new AnthropicAceLanguageModel("fake-key");
    const narrative = createNarrative({ text: "x", closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true } });
    const response = await model.run({ protocolId: "P002", protocolVersion: "ACE-0.1", prompt: "p002", input: { narrative } });

    expect(response.metadata.status).toBe("error");
    expect(response.output).toBeNull();
  });

  it("nunca lança exceção — falha de rede/API vira erro estruturado sanitizado", async () => {
    createMock.mockRejectedValue(new Error("connection reset by peer at internal socket 10.0.0.5:443"));

    const model = new AnthropicAceLanguageModel("fake-key");
    const narrative = createNarrative({ text: "x", closingQuestionsAnswered: { historia: true, decisao: true, objetivo: true } });
    const response = await model.run({ protocolId: "P002", protocolVersion: "ACE-0.1", prompt: "p002", input: { narrative } });

    expect(response.metadata.status).toBe("error");
    expect(response.metadata.error?.message).not.toContain("10.0.0.5");
    expect(response.metadata.error?.code).toBe("EXECUTION_ERROR");
  });

  it("P010: inclui os dados da CompatibilityMatrix (forças por profissional) no conteúdo enviado", async () => {
    createMock.mockResolvedValue(
      toolUseResponse({
        decisionSummary: "x",
        clientContextSummary: "x",
        comparisonSummary: "x",
        methodExplanation: "x",
        disclaimer: "x",
        nextSteps: ["x"],
        providerNarratives: [],
      }),
    );

    const model = new AnthropicAceLanguageModel("fake-key");
    const decisionCase = {
      decisionStatement: { decision: "x", goal: "meu objetivo" },
    } as never;
    const decisionContext = {
      decisionType: "buscar_avaliacao",
      clinicalDomain: "nao_determinado",
      complexity: "media",
      urgency: "nao_determinado",
    } as never;
    const humanReviewResult = {
      approvedProviderIds: ["p1"],
      reviewRationale: "justificativa",
      changes: [],
    } as never;
    const compatibilityMatrix = {
      entries: [{ providerId: "p1", strengths: ["Forte em X"], limitations: [] }],
    } as never;

    await model.run({
      protocolId: "P010",
      protocolVersion: "ACE-0.1",
      prompt: "p010",
      input: { decisionCase, decisionContext, humanReviewResult, compatibilityMatrix },
    });

    const callArgs = createMock.mock.calls[0][0];
    const sentContent = JSON.parse(callArgs.messages[0].content);
    expect(sentContent.providers).toEqual([{ providerId: "p1", strengths: ["Forte em X"], limitations: [] }]);
  });
});
