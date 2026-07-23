import { advanceJourney } from "@/kernel";
import {
  isOperationalStage,
  isTerminalStage,
  nextOperationalStage,
  type OperationalStage,
} from "@/kernel/jornada/operational-stage";
import type { KernelActor } from "@/kernel/rbac/authorization";
import { canAdvanceStage } from "@/kernel/rbac/permissions";

import type { SystemIntegrationStack } from "../composition/system-integration-stack";
import { kernelMutationDeps } from "../composition/system-integration-stack";

const STAGE_ACTORS: Partial<Record<OperationalStage, KernelActor>> = {
  ENTREGA: { id: "curator-profile-1", role: "CURATOR" },
  ACOMPANHAMENTO: { id: "manager-profile-1", role: "MANAGER" },
  RELACIONAMENTO: { id: "manager-profile-1", role: "MANAGER" },
};

export interface CloseJourneyAfterReadingInput {
  journeyId: string;
  patientId: string;
  patientActorId: string;
}

function actorForStage(
  stage: OperationalStage,
  input: CloseJourneyAfterReadingInput,
): KernelActor | null {
  if (stage === "ESCOLHA") {
    return { id: input.patientActorId, role: "PATIENT", patientId: input.patientId };
  }
  return STAGE_ACTORS[stage] ?? null;
}

export async function closeJourneyAfterReading(
  stack: SystemIntegrationStack,
  input: CloseJourneyAfterReadingInput,
): Promise<OperationalStage> {
  const deps = kernelMutationDeps(stack);
  const snapshot = await stack.journeyRepository.findById(input.journeyId);
  if (!snapshot) throw new Error("Jornada não encontrada.");

  let current = isOperationalStage(snapshot.currentStage)
    ? snapshot.currentStage
    : "CADASTRO";

  while (!isTerminalStage(current)) {
    const actor = actorForStage(current, input);
    if (!actor || !canAdvanceStage(actor.role, current)) {
      throw new Error(`Nenhum ator autorizado para avançar a etapa ${current}.`);
    }

    const advanced = await advanceJourney(deps, {
      journeyId: input.journeyId,
      actor,
    });
    if (!advanced.ok) throw new Error(advanced.error.message);

    const next = nextOperationalStage(current);
    current = isOperationalStage(advanced.value.toStage)
      ? (advanced.value.toStage as OperationalStage)
      : (next ?? current);

    if (isTerminalStage(current)) break;
  }

  return current;
}
