// P005 — Competency Profile Builder.
// Ver docs/ace/04-specs/P005-competency-profile-builder/specification.md.
//
// Diferente de P002-P004, este protocolo é inteiramente determinístico —
// não depende de nenhuma classificação semântica pré-computada (não há
// "modeling" simulando um LLM). Isso é possível porque sua entrada
// (DecisionContext) já reduziu tudo a enumerações fechadas; P005 apenas
// traduz essas enumerações para a linguagem de competência, por uma tabela
// de mapeamento auditável e reproduzível (Kernel, seção 4).

import type { ProtocolContract } from "@/modules/ace/core/protocol-contract";
import {
  createCompetencyProfile,
  type CompetencyFocus,
  type CompetencyProfile,
  type ExperienceLevel,
} from "@/modules/ace/artifacts/competency-profile";
import type {
  ComplexityLevel,
  DecisionContext,
  DecisionType,
} from "@/modules/ace/artifacts/decision-context";

const METHOD_VERSION = "ACE-0.1";

const FOCUS_BY_DECISION_TYPE: Record<DecisionType, CompetencyFocus> = {
  buscar_avaliacao: "avaliacao",
  decidir_intervencao: "intervencao",
  buscar_acompanhamento: "acompanhamento_continuo",
  esclarecer_duvida: "esclarecimento",
};

const EXPERIENCE_BY_COMPLEXITY: Record<ComplexityLevel, ExperienceLevel> = {
  baixa: "geral",
  media: "experiente",
  alta: "altamente_experiente",
};

export const p005CompetencyProfileBuilder: ProtocolContract<DecisionContext, CompetencyProfile> = {
  id: "P005",
  name: "Competency Profile Builder",
  async execute(decisionContext: DecisionContext): Promise<CompetencyProfile> {
    const focus = FOCUS_BY_DECISION_TYPE[decisionContext.decisionType];
    const experienceLevel = EXPERIENCE_BY_COMPLEXITY[decisionContext.complexity];

    return createCompetencyProfile({
      domain: decisionContext.clinicalDomain,
      focus,
      experienceLevel,
      rationale: `Derivado deterministicamente do Contexto de Decisão: foco "${focus}" a partir do tipo de decisão ("${decisionContext.decisionType}"), nível de experiência "${experienceLevel}" a partir da complexidade ("${decisionContext.complexity}").`,
      assumptions: [],
      sourceArtifacts: [
        {
          artifactId: decisionContext.id,
          artifactVersion: decisionContext.version,
          artifactType: "DecisionContext",
        },
      ],
      methodVersion: METHOD_VERSION,
    });
  },
};
