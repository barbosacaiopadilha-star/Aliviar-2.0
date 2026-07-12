// FakeAceLanguageModel — implementação determinística do AceLanguageModel,
// usada nesta sprint no lugar de um fornecedor real (OpenAI, Anthropic ou
// outro). Nunca inventa informação clínica: onde uma classificação
// semântica real seria necessária (domínio clínico, complexidade,
// urgência), retorna sempre o valor mais conservador ("não determinado"),
// nunca um palpite. A escolha de fornecedor real é uma decisão futura
// separada (ÉPICO 1/SPRINT 3, seção "Provedor de LLM").

import type { P002ExtractedFields } from "@/modules/ace/protocols/p002-case-builder";
import type { P003AdditionalFinding } from "@/modules/ace/protocols/p003-case-audit";
import type { P004Modeling } from "@/modules/ace/protocols/p004-decision-context-modeler";
import type { P010Presentation } from "@/modules/ace/protocols/p010-final-curadoria-delivery";
import type { Narrative } from "@/modules/ace/artifacts/narrative";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { DecisionContext, DecisionType } from "@/modules/ace/artifacts/decision-context";
import type { HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";

import type { AceLanguageModel, AceLanguageModelRequest, AceLanguageModelResponse } from "./language-model";

const FAKE_MODEL_ID = "fake-deterministic-v1";

function deriveP002ExtractedFields(narrative: Narrative): P002ExtractedFields {
  const text = narrative.text.trim();
  const hasText = text.length > 0;

  return {
    decisionStatement: {
      decision: hasText ? text : null,
      goal: hasText ? text : null,
      sourceType: "fato_relatado",
      ...(hasText ? { originEvidence: { quote: text.slice(0, 280), source: "narrativa" as const } } : {}),
    },
    // Nunca inventadas — sem análise real de linguagem, não há como extrair
    // restrições ou preferências de texto livre com segurança.
    mandatoryConstraints: [],
    preferences: [],
    missingInformation: hasText
      ? []
      : [
          { description: "Decisão não descrita na história.", relatedField: "decision" },
          { description: "Objetivo não descrito na história.", relatedField: "goal" },
        ],
  };
}

function deriveP003AdditionalFindings(): P003AdditionalFinding[] {
  // O modelo fake nunca identifica contradição/ambiguidade semântica —
  // isso exigiria análise real de linguagem. "Nenhum achado adicional" é a
  // resposta honesta, nunca uma invenção.
  return [];
}

function deriveP004Modeling(decisionCase: DecisionCase): P004Modeling {
  return {
    decisionType: "buscar_avaliacao",
    objective: decisionCase.decisionStatement.goal,
    clinicalDomain: "nao_determinado",
    complexity: "media",
    urgency: "nao_determinado",
    strategy: "avaliacao_inicial",
    assumptions: [
      "Classificação preliminar gerada por um modelo de linguagem simulado (fake), sem análise semântica real.",
    ],
    rationale:
      "Classificação conservadora do modelo simulado: nenhuma inferência clínica foi feita a partir de texto livre; domínio, complexidade e urgência permanecem no valor mais neutro possível até haver um fornecedor real de linguagem ou revisão humana.",
  };
}

const DECISION_TYPE_LABELS: Record<DecisionType, string> = {
  buscar_avaliacao: "buscar uma avaliação inicial",
  decidir_intervencao: "decidir os próximos passos de cuidado",
  buscar_acompanhamento: "buscar acompanhamento contínuo",
  esclarecer_duvida: "esclarecer uma dúvida",
};

// Conteúdo em linguagem natural da entrega ao paciente (P010) — mesmo
// padrão de honestidade conservadora do restante do modelo fake: nunca
// interpreta a história além do que o próprio paciente escreveu
// (decisionCase.decisionStatement.goal, verbatim) nem além do que o
// Curador Médico já registrou (humanReviewResult.reviewRationale/changes).
// Nunca menciona protocolo, artefato ou modelo de IA — o
// assertNoForbiddenLanguage do próprio P010 ainda audita mecanicamente a
// ausência de vocabulário de ranking/vencedor sobre este texto.
function deriveP010Presentation(
  decisionCase: DecisionCase,
  decisionContext: DecisionContext,
  humanReviewResult: HumanReviewResult,
): P010Presentation {
  const goal = decisionCase.decisionStatement.goal;

  const providerNarratives = humanReviewResult.approvedProviderIds.map((providerId) => {
    const addedChange = humanReviewResult.changes.find(
      (change) => change.providerId === providerId && change.type === "added",
    );
    return {
      providerId,
      whyIncluded: addedChange ? addedChange.rationale : humanReviewResult.reviewRationale,
    };
  });

  return {
    decisionSummary: goal ? `Você nos contou: "${goal}"` : "Você compartilhou sua história com a equipe Aliviar.",
    clientContextSummary: `Você está buscando ${DECISION_TYPE_LABELS[decisionContext.decisionType]}.`,
    comparisonSummary:
      "As três pessoas profissionais abaixo estão organizadas em ordem alfabética, só para facilitar a leitura — a ordem não indica preferência. As três foram cuidadosamente validadas pela equipe Aliviar para o que você trouxe na sua história.",
    methodExplanation:
      "Esta Curadoria foi construída a partir da sua história, analisada pelo Método ACE e validada por um Curador Médico da equipe Aliviar.",
    disclaimer:
      "Esta Curadoria é uma orientação da equipe Aliviar para ajudar você a encontrar apoio adequado — ela nunca substitui uma consulta, diagnóstico ou tratamento médico. As decisões sobre sua saúde são sempre suas, em conversa direta com os profissionais indicados.",
    nextSteps: [
      "Entre em contato com um dos profissionais indicados quando se sentir pronto(a).",
      "Leve sua história e suas dúvidas para a primeira conversa.",
      "A equipe Aliviar continua disponível se você precisar de apoio neste processo.",
    ],
    providerNarratives,
  };
}

export class FakeAceLanguageModel implements AceLanguageModel {
  async run<TInput, TOutput>(
    request: AceLanguageModelRequest<TInput>,
  ): Promise<AceLanguageModelResponse<TOutput>> {
    const executedAt = new Date().toISOString();

    try {
      let output: unknown;

      switch (request.protocolId) {
        case "P002":
          output = deriveP002ExtractedFields((request.input as { narrative: Narrative }).narrative);
          break;
        case "P003":
          output = { additionalFindings: deriveP003AdditionalFindings() };
          break;
        case "P004":
          output = deriveP004Modeling((request.input as { decisionCase: DecisionCase }).decisionCase);
          break;
        case "P010": {
          const input = request.input as {
            decisionCase: DecisionCase;
            decisionContext: DecisionContext;
            humanReviewResult: HumanReviewResult;
          };
          output = deriveP010Presentation(input.decisionCase, input.decisionContext, input.humanReviewResult);
          break;
        }
        default:
          return {
            output: null,
            metadata: {
              modelId: FAKE_MODEL_ID,
              executedAt,
              status: "error",
              error: {
                code: "UNSUPPORTED_PROTOCOL",
                message: `FakeAceLanguageModel não implementa o protocolo "${request.protocolId}".`,
              },
            },
          };
      }

      return {
        output: output as TOutput,
        metadata: { modelId: FAKE_MODEL_ID, executedAt, status: "ok" },
      };
    } catch {
      return {
        output: null,
        metadata: {
          modelId: FAKE_MODEL_ID,
          executedAt,
          status: "error",
          error: { code: "EXECUTION_ERROR", message: "Não foi possível processar a entrada." },
        },
      };
    }
  }
}
