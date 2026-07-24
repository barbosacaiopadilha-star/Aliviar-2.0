// P002 — Case Builder.
// Ver docs/ace/04-specs/P002-case-builder/specification.md.
//
// Nesta fase, `extractedFields` já vem estruturado — equivalente ao que um
// modelo de linguagem produziria seguindo prompt.md. A extração real a
// partir do texto livre da Narrative depende do Orchestrator (Fase 3),
// fora do escopo deste ciclo (ver changelog.md do protocolo). O que este
// módulo implementa é o contrato do protocolo e a construção/validação
// determinística do DecisionCase a partir de campos já extraídos.

import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import type { Narrative } from "@/modules/ace/artifacts/narrative";
import {
  createDecisionCase,
  type CreateDecisionCaseInput,
  type DecisionCase,
} from "@/modules/ace/artifacts/decision-case";

import { applyP002Completeness } from "./p002-completeness";

export type P002ExtractedFields = Omit<CreateDecisionCaseInput, "sourceNarrativeId">;

export type P002Input = {
  narrative: Narrative;
  extractedFields: P002ExtractedFields;
};

export const p002CaseBuilder: ProtocolContract<P002Input, DecisionCase> = {
  id: "P002",
  name: "Case Builder",
  async execute(input: P002Input): Promise<DecisionCase> {
    const extractedFields = applyP002Completeness(input.narrative, input.extractedFields);

    return createDecisionCase({
      sourceNarrativeId: input.narrative.id,
      ...extractedFields,
    });
  },
};
