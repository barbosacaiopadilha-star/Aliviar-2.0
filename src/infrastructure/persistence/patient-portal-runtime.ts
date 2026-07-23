import { createClient } from "@/lib/supabase/server";
import { resolvePatientAccess } from "@/lib/auth/resolve-patient-access";
import { registerJourneyInCatalog, runPublicToPortalFlow } from "@/vertical-slice";
import type { PublicToPortalFlowResult } from "@/vertical-slice/services/run-public-to-portal-flow";
import type { VerticalSliceStack } from "@/vertical-slice/composition/vertical-slice-stack";

import { createPersistenceStack, refreshPersistenceAuthorization } from "./create-persistence-stack";
import { PatientPortalFlowStore } from "./patient-portal-flow-store";

export class PatientPortalAccessError extends Error {
  constructor(
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "PatientPortalAccessError";
  }
}

export interface PatientPortalRuntime {
  stack: VerticalSliceStack;
  userId: string;
  flow: PublicToPortalFlowResult;
}

async function resolvePatientJourneyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patientId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("journeys")
    .select("id")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function ensurePatientJourney(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patientId: string,
): Promise<string> {
  const existing = await resolvePatientJourneyId(supabase, patientId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("journeys")
    .insert({
      patient_id: patientId,
      title: "Minha jornada",
      status: "OPEN",
      priority: "NORMAL",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Não foi possível criar jornada do paciente.");
  }

  return data.id as string;
}

export async function getPatientPortalRuntime(): Promise<PatientPortalRuntime> {
  const access = await resolvePatientAccess();

  if (access.status === "unauthenticated") {
    throw new PatientPortalAccessError("UNAUTHORIZED", "Autenticação necessária.");
  }
  if (access.status === "session_invalid") {
    throw new PatientPortalAccessError("UNAUTHORIZED", "Sessão inválida ou expirada.");
  }
  if (access.status === "not_patient") {
    throw new PatientPortalAccessError("FORBIDDEN", "Acesso restrito a pacientes.");
  }

  const supabase = await createClient();
  const flowStore = new PatientPortalFlowStore(supabase);
  let flowRecord = await flowStore.findByPatientId(access.patientId);

  const stack = (await createPersistenceStack(supabase, {
    patientId: access.patientId,
    journeyId: flowRecord?.journeyId,
    patientIdentity: {
      userId: access.authUserId,
      role: "PATIENT",
      isActive: true,
      patientId: access.patientId,
      displayName: "Paciente",
    },
    email: access.email,
  })) as unknown as VerticalSliceStack;

  if (!flowRecord) {
    const patient = await stack.patientRepository.findById(access.patientId);
    if (!patient) {
      throw new PatientPortalAccessError("NOT_FOUND", "Paciente não encontrado.");
    }

    const journeyId = await ensurePatientJourney(supabase, access.patientId);
    const sessionId = `patient-${access.authUserId}`;
    let handoffId = journeyId;

    const existingHandoff = await stack.handoff.handoffRepository.findBySessionId(sessionId);
    if (!existingHandoff) {
      const bootstrapped = await runPublicToPortalFlow(stack, {
        sessionId,
        patientFullName: patient.fullName,
        patientPreferredName: patient.preferredName ?? patient.fullName,
        patientEmail: patient.email ?? access.email ?? "paciente@aliviar.com",
        journeyTitle: "Minha jornada",
      });
      handoffId = bootstrapped.handoffId;
    } else {
      handoffId = existingHandoff.id;
    }

    flowRecord = {
      patientId: access.patientId,
      authUserId: access.authUserId,
      journeyId,
      handoffId,
      sessionId,
    };

    await flowStore.upsert(flowRecord);
  }

  registerJourneyInCatalog(stack, {
    id: flowRecord.journeyId,
    patientId: flowRecord.patientId,
  });

  await refreshPersistenceAuthorization(stack as never);

  return {
    stack,
    userId: access.authUserId,
    flow: flowStore.toPublicFlow(flowRecord),
  };
}
