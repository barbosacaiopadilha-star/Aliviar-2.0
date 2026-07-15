import type { PatientCaseOverview } from "@/modules/cases";
import type { StoryStatus } from "@/modules/story/types";

export type PatientHomeState =
  | { kind: "no_story" }
  | { kind: "draft" }
  | { kind: "submitted_without_case" }
  | { kind: "case_available"; statusLabel: string };

type HomeStateInput = {
  storyStatuses?: StoryStatus[] | null;
  caseOverview?: Pick<PatientCaseOverview, "statusLabel"> | null;
};

// Deriva o estado de apresentação da Home a partir de dados já lidos —
// nunca busca, nunca interpreta o texto de statusLabel (fonte oficial,
// intocada). Prioridade quando os sinais coexistem (ex.: uma história em
// rascunho junto de um Caso já aberto por uma história anterior): Caso
// existente > rascunho > enviada sem Caso > nenhuma história — o Caso é o
// sinal mais avançado da jornada do paciente e domina a Home mesmo que um
// rascunho paralelo também exista.
export function derivePatientHomeState(input: HomeStateInput): PatientHomeState {
  const storyStatuses = input.storyStatuses ?? [];
  const caseOverview = input.caseOverview ?? null;

  if (caseOverview) {
    return { kind: "case_available", statusLabel: caseOverview.statusLabel };
  }

  if (storyStatuses.includes("rascunho")) {
    return { kind: "draft" };
  }

  if (storyStatuses.includes("enviada")) {
    return { kind: "submitted_without_case" };
  }

  return { kind: "no_story" };
}
