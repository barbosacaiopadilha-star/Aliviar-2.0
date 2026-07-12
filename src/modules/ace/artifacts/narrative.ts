// Narrative — artefato de saída do P001 (Intake).
// Ver docs/ace/04-specs/P001-intake/specification.md, seção "Saída".
//
// Artefato de Análise (Constituição, Princípio 9; Kernel, seção 6): nunca
// possui valor decisório — `decisional: false` é sempre estampado pela
// construção, nunca recebido como entrada.

import type { AnalysisArtifact } from "@/modules/ace/core/artifact-contract";
import { createInitialVersion } from "@/modules/ace/core/version-manager";

export type Narrative = AnalysisArtifact & {
  text: string;
  closingQuestionsAnswered: {
    historia: boolean;
    decisao: boolean;
    objetivo: boolean;
  };
};

export type CreateNarrativeInput = {
  text: string;
  closingQuestionsAnswered: Narrative["closingQuestionsAnswered"];
};

export function createNarrative(input: CreateNarrativeInput): Narrative {
  return createInitialVersion({ ...input, decisional: false, producedBy: "P001" }) as Narrative;
}
