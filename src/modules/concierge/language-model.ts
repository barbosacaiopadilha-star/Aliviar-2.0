// AceLanguageModel — porta abstrata para as etapas do pipeline ACE que
// exigem classificação/extração semântica (P002, P003, P004 — ver
// comentários em src/modules/ace/protocols/p00{2,3,4}-*.ts: "equivalente ao
// que um modelo de linguagem produziria seguindo prompt.md"). O
// orquestrador (orchestrator.ts) conhece só esta interface, nunca um
// fornecedor concreto — a escolha de fornecedor (OpenAI, Anthropic, outro)
// é uma decisão separada, futura, depois que o fluxo completo estiver
// validado (ÉPICO 1/SPRINT 3).
//
// Nunca persista `request.prompt` em log ou artefato — é um parâmetro de
// execução em memória, nunca um dado armazenado (minimização de dados).

import type { ProtocolId } from "@/modules/ace/core/protocol-id";

export type AceLanguageModelRequest<TInput = unknown> = {
  protocolId: ProtocolId;
  protocolVersion: string;
  prompt: string;
  input: TInput;
  context?: Record<string, unknown>;
};

export type AceLanguageModelErrorInfo = {
  code: string;
  message: string;
};

export type AceLanguageModelMetadata = {
  modelId: string;
  executedAt: string;
  status: "ok" | "error";
  error?: AceLanguageModelErrorInfo;
};

export type AceLanguageModelResponse<TOutput = unknown> = {
  output: TOutput | null;
  metadata: AceLanguageModelMetadata;
};

export interface AceLanguageModel {
  run<TInput, TOutput>(request: AceLanguageModelRequest<TInput>): Promise<AceLanguageModelResponse<TOutput>>;
}

// GO LIVE — seleção de fornecedor por ambiente: usa o fornecedor real
// (Anthropic) quando a chave está configurada; nunca em testes/dev sem
// chave, para não exigir rede/credencial fora de produção. Os dois call
// sites que decidiam `new FakeAceLanguageModel()` (actions.ts,
// delivery-actions.ts) passam a chamar esta função em vez de escolher o
// fornecedor eles mesmos — nenhuma lógica nova, só centraliza a mesma
// decisão em um único lugar.
export async function getAceLanguageModel(): Promise<AceLanguageModel> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { AnthropicAceLanguageModel } = await import("./anthropic-language-model");
    return new AnthropicAceLanguageModel();
  }

  const { FakeAceLanguageModel } = await import("./fake-language-model");
  return new FakeAceLanguageModel();
}
