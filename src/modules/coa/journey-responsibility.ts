import type { PipelineStage } from "@/modules/crm/pipeline";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";

import { resolveCoaLevelForPipelineStage, resolveJourneyPhase } from "./levels";
import type { CoaJourneyPhase, CoaResponsibleRole } from "./types";
import { COA_RESPONSIBLE_LABELS } from "./types";

export type CoaCurrentResponsible = {
  role: CoaResponsibleRole;
  roleLabel: string;
  name: string;
  levelLabel: string;
};

export type CoaJourneyResponsibilityInput = {
  pipelineStage?: PipelineStage | null;
  attendantName?: string | null;
  curatorName?: string | null;
  conciergeName?: string | null;
  curadoriaRecord?: CuradoriaRecord | null;
};

/**
 * Resolve quem o Assistido vê como responsável atual.
 * Mostra apenas um papel por vez — nunca departamentos.
 */
export function resolveCurrentResponsible(
  input: CoaJourneyResponsibilityInput,
): CoaCurrentResponsible {
  const stage = input.pipelineStage ?? null;
  const phase = stage ? resolveJourneyPhase(stage) : inferPhaseFromCuradoria(input.curadoriaRecord);

  if (phase === "acompanhamento" || phase === "encerramento" || phase === "escolha") {
    return {
      role: "concierge",
      roleLabel: COA_RESPONSIBLE_LABELS.concierge,
      name: input.conciergeName?.trim() || input.attendantName?.trim() || "Equipe Aliviar",
      levelLabel: "Concierge",
    };
  }

  if (
    phase === "curadoria" ||
    phase === "consulta_inicial" ||
    (input.curadoriaRecord && !input.curadoriaRecord.devolutiva.decision)
  ) {
    return {
      role: "curador",
      roleLabel: COA_RESPONSIBLE_LABELS.curador,
      name: input.curatorName?.trim() || input.curadoriaRecord?.curatorName || "Seu Curador",
      levelLabel: "Curadoria",
    };
  }

  return {
    role: "atendente",
    roleLabel: COA_RESPONSIBLE_LABELS.atendente,
    name: input.attendantName?.trim() || "Equipe Aliviar",
    levelLabel: "Atendimento",
  };
}

function inferPhaseFromCuradoria(record: CuradoriaRecord | null | undefined): CoaJourneyPhase {
  if (!record) return "lead";
  if (record.devolutiva.decision) {
    return record.devolutiva.decision.outcome === "CHOSEN" ? "acompanhamento" : "curadoria";
  }
  if (record.relatorio.emittedAt) return "escolha";
  if (record.validacao?.validatedAt) return "curadoria";
  if (record.historia.understandingConfirmedAt) return "consulta_inicial";
  return "assistido";
}

export function resolveResponsibleForPipelineStage(
  stage: PipelineStage,
  names: { attendant?: string | null; curator?: string | null; concierge?: string | null },
): CoaCurrentResponsible {
  return resolveCurrentResponsible({
    pipelineStage: stage,
    attendantName: names.attendant,
    curatorName: names.curator,
    conciergeName: names.concierge,
  });
}

export function resolveLevelForStage(stage: PipelineStage): ReturnType<typeof resolveCoaLevelForPipelineStage> {
  return resolveCoaLevelForPipelineStage(stage);
}
