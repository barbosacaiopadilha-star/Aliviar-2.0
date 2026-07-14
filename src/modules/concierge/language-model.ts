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

// GO LIVE — o modelo fake nunca pode ser usado em produção, nem em
// silêncio nem por omissão de configuração. Esta é a ÚNICA definição de
// "estamos em produção?" do módulo — nunca duplicar este critério em
// outro arquivo (orchestrator.ts, delivery-repository.ts e o Health Check
// do dashboard importam esta função em vez de reimplementar o check).
function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export class AceLanguageModelConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AceLanguageModelConfigurationError";
  }
}

export type AceLanguageModelHealthStatus =
  | "ANTHROPIC_CONFIGURED"
  | "FAKE_MODEL_NON_PRODUCTION"
  | "MODEL_NOT_CONFIGURED";

export type AceLanguageModelHealth = {
  status: AceLanguageModelHealthStatus;
  healthy: boolean;
};

// Nunca faz uma chamada de rede — só inspeciona configuração. Usada tanto
// por getAceLanguageModel() (decide o que instanciar) quanto pelo Health
// Check do dashboard (decide o que mostrar) — as duas leituras da mesma
// verdade, nunca duas definições que podem divergir.
export function getAceLanguageModelHealth(): AceLanguageModelHealth {
  if (process.env.ANTHROPIC_API_KEY) {
    return { status: "ANTHROPIC_CONFIGURED", healthy: true };
  }

  if (isProductionEnvironment()) {
    return { status: "MODEL_NOT_CONFIGURED", healthy: false };
  }

  return { status: "FAKE_MODEL_NON_PRODUCTION", healthy: true };
}

// Seleção de fornecedor por ambiente. Nunca cai no FakeAceLanguageModel em
// produção — nem em silêncio, nem por omissão de configuração: se
// ANTHROPIC_API_KEY estiver ausente em produção, lança
// AceLanguageModelConfigurationError (o orquestrador/delivery-repository
// tratam isso como uma falha explícita da execução, nunca como um throw
// cru sem rastro). Em qualquer ambiente não-produtivo (dev, teste, CI),
// a ausência da chave sempre usa o modelo fake — nunca exige rede/
// credencial fora de produção.
export async function getAceLanguageModel(): Promise<AceLanguageModel> {
  const health = getAceLanguageModelHealth();

  if (health.status === "ANTHROPIC_CONFIGURED") {
    const { AnthropicAceLanguageModel } = await import("./anthropic-language-model");
    return new AnthropicAceLanguageModel();
  }

  if (health.status === "MODEL_NOT_CONFIGURED") {
    throw new AceLanguageModelConfigurationError(
      "ANTHROPIC_API_KEY não configurada em produção — o ACE nunca usa o modelo fake fora de desenvolvimento/teste.",
    );
  }

  const { FakeAceLanguageModel } = await import("./fake-language-model");
  return new FakeAceLanguageModel();
}
