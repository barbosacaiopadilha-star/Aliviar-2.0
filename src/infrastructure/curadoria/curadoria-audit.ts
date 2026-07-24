import type { EventoCuradoriaTipo } from "@/curadoria-flow/contracts/dossie-view";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActorRoleCuradoria = "STAFF" | "PATIENT" | "SYSTEM";

export interface AppendEventoCuradoriaInput {
  casoId: string;
  journeyId: string;
  tipo: EventoCuradoriaTipo;
  actorId?: string | null;
  actorRole: ActorRoleCuradoria;
  metadata?: Record<string, unknown>;
}

type CaseEventType = "created" | "status_changed" | "curator_assigned" | "note_updated";

function mapTipoToCaseEventType(tipo: EventoCuradoriaTipo): CaseEventType {
  switch (tipo) {
    case "CASO_ABERTO":
      return "created";
    default:
      return "status_changed";
  }
}

export async function appendEventoCuradoria(
  input: AppendEventoCuradoriaInput,
): Promise<string> {
  const supabase = createServiceRoleClient() ?? (await createClient());
  const ocorridoEm = new Date().toISOString();

  const reason = JSON.stringify({
    journey_id: input.journeyId,
    tipo: input.tipo,
    actor_role: input.actorRole,
    metadata: input.metadata ?? {},
    ocorrido_em: ocorridoEm,
  });

  const { error } = await supabase.schema("curadoria").from("case_events").insert({
    case_id: input.casoId,
    event_type: mapTipoToCaseEventType(input.tipo),
    actor_id: input.actorId ?? null,
    from_value: null,
    to_value: input.tipo,
    reason,
  });

  if (error) {
    throw new BusinessRuleError(error.message);
  }

  return ocorridoEm;
}
