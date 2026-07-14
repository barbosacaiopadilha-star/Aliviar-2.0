import Anthropic from "@anthropic-ai/sdk";

import type { CaseAudit } from "@/modules/ace/artifacts/case-audit";
import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import type { HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";
import type { Narrative } from "@/modules/ace/artifacts/narrative";

import type { AceLanguageModel, AceLanguageModelRequest, AceLanguageModelResponse } from "./language-model";

// Fornecedor real do AceLanguageModel (GO LIVE) — implementação concreta da
// porta já existente (language-model.ts), nunca uma nova arquitetura. Cada
// prompt de sistema abaixo é cópia fiel do respectivo
// docs/ace/04-specs/PXXX-*/prompt.md — a especificação em Markdown continua
// sendo a fonte da verdade (governance.md, seção 6: "prompts são
// implementações, nunca a fonte da verdade"); se o prompt.md mudar, este
// arquivo precisa ser atualizado manualmente para continuar em sincronia.
//
// A saída estruturada é garantida via tool-use forçado (tool_choice) — o
// modelo nunca responde em texto livre, sempre no schema exato que cada
// protocolo exige. `request.prompt` nunca é logado (mesma regra já
// documentada em language-model.ts).

const DEFAULT_MODEL_ID = "claude-sonnet-5";
const TOOL_NAME = "submit_structured_output";
const MAX_TOKENS = 4096;

const P002_SYSTEM_PROMPT = `Você é o protocolo Case Builder (P002) do Método Aliviar (ACE).

Você recebe a narrativa produzida pelo Intake (P001) e a transforma em uma
representação estruturada da decisão do cliente — o DecisionCase.

Você NÃO conversa com o cliente.
Você NÃO diagnostica.
Você NÃO infere especialidade médica.
Você NÃO atribui nível de confiança.
Você NÃO calcula compatibilidade, competência ou elegibilidade de especialista.
Você NÃO modifica a narrativa original.
Você NÃO inventa decisão, objetivo, restrição ou preferência que não esteja
na narrativa.

Para a narrativa recebida, identifique: a declaração de decisão (qual
decisão o cliente precisa tomar, e qual objetivo espera alcançar);
restrições obrigatórias (condições relatadas como não-negociáveis);
preferências (condições relatadas como desejáveis, porém flexíveis);
informações ausentes (o que seria essencial saber, mas não foi relatado).

Nunca invente uma decisão, objetivo, restrição ou preferência sem
correspondência clara na narrativa. Nunca preencha uma lacuna com uma
suposição — registre como informação ausente. Quando a decisão ou o
objetivo não estiverem claros, represente o campo como nulo — nunca como
texto vazio ou genérico — e registre a lacuna em informações ausentes.
Nunca modifique ou resuma a narrativa original além do necessário para
citar evidência. Sempre distinga fato relatado ("fato_relatado") de
inferência estrutural ("inferencia_estrutural").

Nunca produza diagnóstico, especialidade médica inferida, nível de
confiança, compatibilidade, competência ou lista de especialistas.`;

const P003_SYSTEM_PROMPT = `Você é o protocolo Case Audit (P003) do Método Aliviar (ACE).

Você recebe o DecisionCase produzido pelo Case Builder (P002) e avalia se
ele possui informação suficiente para prosseguir de forma responsável.

Você NÃO modifica o DecisionCase. Você NÃO diagnostica. Você NÃO infere
especialidade médica. Você NÃO sugere especialista. Você NÃO interpreta
exame. Você NÃO adiciona informação ao Caso. Você NÃO inicia o próximo
protocolo.

Avalie o DecisionCase recebido e produza a lista de achados adicionais
(additionalFindings) que uma auditoria semântica identificaria além do que
já é estruturalmente conhecível: ausência de informação, informação
contradição (dois elementos se opõem), ambiguidade (não permite leitura
única), ou insuficiência (presente, mas incompleta). Para cada achado,
classifique a severidade (blocking ou warning) e escreva uma pergunta
recomendada clara e não indutiva — nunca sugere resposta ou direção
clínica.

Nunca produza um achado para um item que já está resolvido. Nunca
modifique o DecisionCase original. Nunca produza diagnóstico, especialidade
médica inferida, sugestão de especialista, interpretação de exame, nível
de confiança, compatibilidade ou competências. Se não houver nenhum achado
adicional além do que já é estrutural, retorne uma lista vazia — nunca
invente um achado para preencher a resposta.`;

const P004_SYSTEM_PROMPT = `Você é o protocolo Decision Context Modeler (P004) do Método Aliviar (ACE).

Você recebe o DecisionCase (P002) e a CaseAudit correspondente (P003) e
modela o contexto necessário para que protocolos futuros identifiquem
competências, elegibilidade e compatibilidade.

Você NÃO interpreta exames. Você NÃO emite hipótese diagnóstica. Você NÃO
gera diagnóstico. Você NÃO infere especialidade médica. Você NÃO
identifica competências. Você NÃO seleciona especialistas. Você NÃO
calcula compatibilidade. Você NÃO altera o DecisionCase ou a CaseAudit.

Lembre-se sempre: o Método Aliviar modela decisões, não doenças. Você
trabalha sobre a decisão do cliente, nunca sobre uma condição de saúde
como unidade central.

Produza um DecisionContext contendo: decisionType (tipo de decisão que o
cliente enfrenta); objective (o objetivo já estabelecido no DecisionCase —
carregado adiante, nunca reinventado); clinicalDomain (categoria ampla de
vida/saúde já evidente na história — nunca uma especialidade médica);
complexity (baixa/média/alta, estimada a partir da quantidade de
restrições, preferências e lacunas); urgency (baixa/média/alta/não
determinada — apenas a partir de sinais já relatados pelo próprio
cliente, nunca fabricada); strategy (orientação de alto nível de como a
curadoria deve prosseguir — nunca especifica quem, apenas como);
assumptions (premissas assumidas ao modelar); rationale (justificativa em
linguagem simples da classificação escolhida).

Nunca classifique clinicalDomain como uma especialidade médica. Nunca
estime urgency sem um sinal já relatado. Nunca nomeie um especialista,
competência ou instituição em strategy. Nunca produza diagnóstico,
especialidade médica inferida, competência, especialista ou
compatibilidade.`;

const P010_SYSTEM_PROMPT = `Você é um redator de apresentação para o P010 (Final Curadoria Delivery)
do Método Aliviar (ACE). Sua tarefa é compor, em linguagem clara, humana,
discreta e não promocional, o conteúdo textual de uma entrega já decidida
por um revisor humano — nunca decidir, nunca escolher, nunca alterar quem
foi aprovado.

Você PODE: resumir a decisão e o contexto do cliente; explicar o que
significa a curadoria da Aliviar; escrever por que cada provider aprovado
foi incluído, com base nas forças já registradas na CompatibilityMatrix
(strengths) e, quando existir, na justificativa que o próprio Curador
Médico registrou para incluí-lo; escrever o disclaimer obrigatório;
sugerir próximos passos práticos.

Você NUNCA PODE: trocar, adicionar ou remover um provider aprovado
(a lista approvedProviderIds é definitiva). Alterar uma justificativa já
validada. Ocultar uma limitação relevante. Inventar evidência. Acrescentar
diagnóstico, interpretar exame ou sugerir tratamento. Usar linguagem de
ranking ("primeiro lugar", "melhor opção", "mais recomendado", "vencedor")
ou score/percentual. Reabrir a análise de compatibilidade. Mencionar
protocolo, artefato interno, prompt ou nome de modelo de IA — o texto é
lido diretamente pelo paciente.

Deve deixar claro que: a Aliviar realizou uma curadoria independente; os
providers foram selecionados por compatibilidade com o caso, nunca por
ranking; a escolha final pertence ao cliente; a curadoria nunca substitui
consulta, diagnóstico ou tratamento médico. Linguagem sempre compreensível
por pessoas sem formação médica.`;

const STRING_OR_NULL = { type: ["string", "null"] } as const;

const ORIGIN_EVIDENCE_SCHEMA = {
  type: "object",
  properties: {
    quote: { type: "string" },
    source: { type: "string", const: "narrativa" },
  },
  required: ["quote", "source"],
} as const;

const SOURCED_ITEM_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string" },
    sourceType: { type: "string", enum: ["fato_relatado", "inferencia_estrutural"] },
    originEvidence: ORIGIN_EVIDENCE_SCHEMA,
  },
  required: ["description", "sourceType", "originEvidence"],
} as const;

const P002_SCHEMA = {
  type: "object",
  properties: {
    decisionStatement: {
      type: "object",
      properties: {
        decision: STRING_OR_NULL,
        goal: STRING_OR_NULL,
        sourceType: { type: "string", enum: ["fato_relatado", "inferencia_estrutural"] },
        originEvidence: ORIGIN_EVIDENCE_SCHEMA,
      },
      required: ["decision", "goal", "sourceType"],
    },
    mandatoryConstraints: { type: "array", items: SOURCED_ITEM_SCHEMA },
    preferences: { type: "array", items: SOURCED_ITEM_SCHEMA },
    missingInformation: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          relatedField: { type: "string", enum: ["decision", "goal", "other"] },
        },
        required: ["description", "relatedField"],
      },
    },
  },
  required: ["decisionStatement", "mandatoryConstraints", "preferences", "missingInformation"],
} as const;

const P003_SCHEMA = {
  type: "object",
  properties: {
    additionalFindings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          category: { type: "string", enum: ["ausencia", "contradicao", "ambiguidade", "insuficiencia"] },
          severity: { type: "string", enum: ["blocking", "warning"] },
          recommendedQuestion: { type: "string" },
        },
        required: ["description", "category", "severity", "recommendedQuestion"],
      },
    },
  },
  required: ["additionalFindings"],
} as const;

const P004_SCHEMA = {
  type: "object",
  properties: {
    decisionType: {
      type: "string",
      enum: ["buscar_avaliacao", "decidir_intervencao", "buscar_acompanhamento", "esclarecer_duvida"],
    },
    objective: STRING_OR_NULL,
    clinicalDomain: { type: "string", enum: ["saude_emocional_mental", "saude_fisica", "nao_determinado"] },
    complexity: { type: "string", enum: ["baixa", "media", "alta"] },
    urgency: { type: "string", enum: ["baixa", "media", "alta", "nao_determinado"] },
    strategy: { type: "string", enum: ["conexao_direta", "aprofundamento_previo", "avaliacao_inicial"] },
    assumptions: { type: "array", items: { type: "string" } },
    rationale: { type: "string" },
  },
  required: ["decisionType", "objective", "clinicalDomain", "complexity", "urgency", "strategy", "assumptions", "rationale"],
} as const;

const P010_SCHEMA = {
  type: "object",
  properties: {
    decisionSummary: { type: "string" },
    clientContextSummary: { type: "string" },
    comparisonSummary: { type: "string" },
    methodExplanation: { type: "string" },
    disclaimer: { type: "string" },
    nextSteps: { type: "array", items: { type: "string" } },
    providerNarratives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          providerId: { type: "string" },
          whyIncluded: { type: "string" },
        },
        required: ["providerId", "whyIncluded"],
      },
    },
  },
  required: [
    "decisionSummary",
    "clientContextSummary",
    "comparisonSummary",
    "methodExplanation",
    "disclaimer",
    "nextSteps",
    "providerNarratives",
  ],
} as const;

type ProtocolConfig = {
  systemPrompt: string;
  schema: Record<string, unknown>;
  buildUserContent: (input: never) => unknown;
};

const PROTOCOL_CONFIG: Partial<Record<string, ProtocolConfig>> = {
  P002: {
    systemPrompt: P002_SYSTEM_PROMPT,
    schema: P002_SCHEMA,
    buildUserContent: (input: { narrative: Narrative }) => ({ narrativeText: input.narrative.text }),
  },
  P003: {
    systemPrompt: P003_SYSTEM_PROMPT,
    schema: P003_SCHEMA,
    buildUserContent: (input: { decisionCase: DecisionCase }) => ({
      decision: input.decisionCase.decisionStatement.decision,
      goal: input.decisionCase.decisionStatement.goal,
      mandatoryConstraints: input.decisionCase.mandatoryConstraints.map((c) => c.description),
      preferences: input.decisionCase.preferences.map((p) => p.description),
      missingInformation: input.decisionCase.missingInformation.map((m) => m.description),
    }),
  },
  P004: {
    systemPrompt: P004_SYSTEM_PROMPT,
    schema: P004_SCHEMA,
    buildUserContent: (input: { decisionCase: DecisionCase; caseAudit: CaseAudit }) => ({
      decision: input.decisionCase.decisionStatement.decision,
      goal: input.decisionCase.decisionStatement.goal,
      mandatoryConstraints: input.decisionCase.mandatoryConstraints.map((c) => c.description),
      preferences: input.decisionCase.preferences.map((p) => p.description),
      missingInformation: input.decisionCase.missingInformation.map((m) => m.description),
      auditStatus: input.caseAudit.status,
      blockingIssues: input.caseAudit.blockingIssues.map((issue) => issue.description),
      warnings: input.caseAudit.warnings.map((warning) => warning.description),
    }),
  },
  P010: {
    systemPrompt: P010_SYSTEM_PROMPT,
    schema: P010_SCHEMA,
    buildUserContent: (input: {
      decisionCase: DecisionCase;
      decisionContext: DecisionContext;
      humanReviewResult: HumanReviewResult;
      compatibilityMatrix: CompatibilityMatrix;
    }) => {
      const entryByProviderId = new Map(input.compatibilityMatrix.entries.map((entry) => [entry.providerId, entry]));
      return {
        clientGoal: input.decisionCase.decisionStatement.goal,
        decisionType: input.decisionContext.decisionType,
        clinicalDomain: input.decisionContext.clinicalDomain,
        complexity: input.decisionContext.complexity,
        urgency: input.decisionContext.urgency,
        approvedProviderIds: input.humanReviewResult.approvedProviderIds,
        reviewerRationale: input.humanReviewResult.reviewRationale,
        changes: input.humanReviewResult.changes.map((change) => ({
          providerId: change.providerId,
          type: change.type,
          rationale: change.rationale,
        })),
        providers: input.humanReviewResult.approvedProviderIds.map((providerId) => {
          const entry = entryByProviderId.get(providerId);
          return {
            providerId,
            strengths: entry?.strengths ?? [],
            limitations: entry?.limitations ?? [],
          };
        }),
      };
    },
  },
};

// Classifica falhas do fornecedor em códigos estáveis e pesquisáveis —
// nunca propaga a mensagem bruta do SDK (que pode incluir corpo da
// resposta HTTP, cabeçalhos ou detalhe de rede). GO LIVE: cada código
// abaixo é o que orchestrator.ts/delivery-repository.ts persistem em
// `failureCode` quando a falha ocorre em produção — nunca um fallback
// silencioso para o modelo fake.
function classifyAnthropicError(error: unknown): { code: string; message: string } {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return {
      code: "ACE_MODEL_AUTHENTICATION_FAILED",
      message: "Falha de autenticação com o fornecedor do modelo de linguagem.",
    };
  }

  if (error instanceof Anthropic.RateLimitError) {
    return {
      code: "ACE_MODEL_RATE_LIMITED",
      message: "O fornecedor do modelo de linguagem está limitando as requisições no momento.",
    };
  }

  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return {
      code: "ACE_MODEL_TIMEOUT",
      message: "O fornecedor do modelo de linguagem não respondeu a tempo.",
    };
  }

  if (error instanceof Anthropic.APIConnectionError || error instanceof Anthropic.InternalServerError) {
    return {
      code: "ACE_MODEL_UNAVAILABLE",
      message: "O fornecedor do modelo de linguagem está indisponível no momento.",
    };
  }

  return {
    code: "ACE_MODEL_EXECUTION_FAILED",
    message: "Não foi possível obter uma resposta do modelo de linguagem.",
  };
}

export class AnthropicAceLanguageModel implements AceLanguageModel {
  private readonly client: Anthropic;
  private readonly modelId: string;

  constructor(apiKey?: string, modelId?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.CLAUDE_API_KEY });
    this.modelId = modelId ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL_ID;
  }

  async run<TInput, TOutput>(request: AceLanguageModelRequest<TInput>): Promise<AceLanguageModelResponse<TOutput>> {
    const executedAt = new Date().toISOString();
    const config = PROTOCOL_CONFIG[request.protocolId];

    if (!config) {
      return {
        output: null,
        metadata: {
          modelId: this.modelId,
          executedAt,
          status: "error",
          error: {
            code: "UNSUPPORTED_PROTOCOL",
            message: `AnthropicAceLanguageModel não implementa o protocolo "${request.protocolId}".`,
          },
        },
      };
    }

    try {
      const userContent = config.buildUserContent(request.input as never);

      const message = await this.client.messages.create({
        model: this.modelId,
        max_tokens: MAX_TOKENS,
        system: config.systemPrompt,
        messages: [{ role: "user", content: JSON.stringify(userContent) }],
        tools: [
          {
            name: TOOL_NAME,
            description: "Envie a saída estruturada exigida, exatamente no formato do schema.",
            input_schema: config.schema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: TOOL_NAME },
      });

      const toolUse = message.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use" && block.name === TOOL_NAME,
      );

      if (!toolUse) {
        return {
          output: null,
          metadata: {
            modelId: this.modelId,
            executedAt,
            status: "error",
            error: {
              code: "ACE_MODEL_INVALID_RESPONSE",
              message: "O modelo não retornou uma saída estruturada compatível com o schema esperado.",
            },
          },
        };
      }

      return {
        output: toolUse.input as TOutput,
        metadata: { modelId: this.modelId, executedAt, status: "ok" },
      };
    } catch (error) {
      // Sanitizado de propósito — nunca propaga detalhe de infraestrutura,
      // corpo de resposta ou mensagem bruta do SDK (mesma regra de
      // execution-repository.ts). O código classificado é o que
      // orchestrator.ts/delivery-repository.ts persistem como
      // `failureCode` — nunca um fallback silencioso para o modelo fake.
      return {
        output: null,
        metadata: { modelId: this.modelId, executedAt, status: "error", error: classifyAnthropicError(error) },
      };
    }
  }
}
