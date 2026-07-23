import {
  advanceHandoffCheckpoint,
  bootstrapJourneyFromHandoff,
  completeHandoff,
  startHandoff,
} from "@/journey-handoff";

import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { registerJourneyInCatalog } from "../composition/vertical-slice-stack";

export interface PublicToPortalFlowInput {
  sessionId: string;
  patientFullName: string;
  patientPreferredName: string;
  patientEmail: string;
  journeyTitle: string;
}

export interface PublicToPortalFlowResult {
  handoffId: string;
  journeyId: string;
  patientId: string;
  sessionId: string;
}

/**
 * Simula o fluxo completo:
 * Landing (convite) → Conversa (história) → Handoff → Bootstrap operacional.
 */
export async function runPublicToPortalFlow(
  stack: VerticalSliceStack,
  input: PublicToPortalFlowInput,
): Promise<PublicToPortalFlowResult> {
  const handoffDeps = {
    handoffRepository: stack.handoff.handoffRepository,
    clock: stack.handoff.clock,
    idGenerator: stack.handoff.idGenerator,
  };

  const started = await startHandoff(handoffDeps, {
    sessionId: input.sessionId,
    intention: "INICIAR_CONVERSA",
    publicChapter: "LIMIAR_INVITE",
  });
  if (!started.ok) throw new Error(started.error.message);

  await advanceHandoffCheckpoint(handoffDeps, {
    handoffId: started.value.id,
    publicChapter: "CONVERSA_GREETING",
  });
  await advanceHandoffCheckpoint(handoffDeps, {
    handoffId: started.value.id,
    publicChapter: "CONVERSA_ASK_NAME",
  });
  await advanceHandoffCheckpoint(handoffDeps, {
    handoffId: started.value.id,
    publicChapter: "CONVERSA_ASK_STORY",
  });

  const completed = await completeHandoff(handoffDeps, {
    handoffId: started.value.id,
    publicChapter: "CONVERSA_ASK_STORY",
  });
  if (!completed.ok) throw new Error(completed.error.message);

  const bootstrapped = await bootstrapJourneyFromHandoff(
    {
      handoffRepository: stack.handoff.handoffRepository,
      bootstrapPort: stack.bootstrapPort,
      clock: stack.handoff.clock,
    },
    {
      handoffId: started.value.id,
      intention: "CONTAR_HISTORIA",
      patient: {
        fullName: input.patientFullName,
        preferredName: input.patientPreferredName,
        email: input.patientEmail,
      },
      journeyTitle: input.journeyTitle,
      managerId: "manager-profile-1",
    },
  );
  if (!bootstrapped.ok) throw new Error(bootstrapped.error.message);

  const bootstrap = bootstrapped.value.bootstrap;
  if (!bootstrap) throw new Error("Bootstrap ausente após handoff.");

  registerJourneyInCatalog(stack, {
    id: bootstrap.journeyId,
    patientId: bootstrap.patientId,
  });

  return {
    handoffId: bootstrapped.value.id,
    journeyId: bootstrap.journeyId,
    patientId: bootstrap.patientId,
    sessionId: input.sessionId,
  };
}
