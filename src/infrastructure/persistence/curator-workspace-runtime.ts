import { createClient } from "@/lib/supabase/server";
import { resolveStaffAccess } from "@/lib/auth/resolve-staff-access";
import type { CuratorWorkspaceStack } from "@/curator-workspace/composition/curator-workspace-stack";

import { createPersistenceStack, refreshPersistenceAuthorization } from "./create-persistence-stack";
import { PatientPortalFlowStore } from "./patient-portal-flow-store";

export class CuratorWorkspaceAccessError extends Error {
  constructor(
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "CuratorWorkspaceAccessError";
  }
}

export interface CuratorWorkspaceRuntime {
  stack: CuratorWorkspaceStack;
  flow: { journeyId: string; handoffId: string; patientId: string };
  curatorActorId: string;
}

export async function getCuratorWorkspaceRuntime(journeyId: string): Promise<CuratorWorkspaceRuntime> {
  const access = await resolveStaffAccess();

  if (access.status === "unauthenticated") {
    throw new CuratorWorkspaceAccessError("UNAUTHORIZED", "Autenticação necessária.");
  }
  if (access.status === "session_invalid") {
    throw new CuratorWorkspaceAccessError("UNAUTHORIZED", "Sessão inválida ou expirada.");
  }
  if (access.status !== "active_staff") {
    throw new CuratorWorkspaceAccessError("FORBIDDEN", "Acesso restrito a equipe ativa.");
  }

  const supabase = await createClient();
  const flowStore = new PatientPortalFlowStore(supabase);
  const flowRecord = await flowStore.findByJourneyId(journeyId);

  if (!flowRecord) {
    throw new CuratorWorkspaceAccessError("NOT_FOUND", "Jornada não encontrada.");
  }

  const stack = (await createPersistenceStack(supabase, {
    journeyId: flowRecord.journeyId,
    patientId: flowRecord.patientId,
    staffIdentity: {
      userId: access.profile.id,
      role: access.profile.role,
      isActive: true,
      staffProfileId: access.profile.id,
      displayName: access.profile.full_name,
    },
    email: null,
    defaultManagerId: access.profile.id,
  })) as unknown as CuratorWorkspaceStack;

  await refreshPersistenceAuthorization(stack as never);

  return {
    stack,
    flow: {
      journeyId: flowRecord.journeyId,
      handoffId: flowRecord.handoffId,
      patientId: flowRecord.patientId,
    },
    curatorActorId: access.profile.id,
  };
}
