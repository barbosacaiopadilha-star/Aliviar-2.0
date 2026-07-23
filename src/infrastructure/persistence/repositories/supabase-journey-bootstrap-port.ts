import { randomUUID } from "node:crypto";

import type { BootstrapJourneyInput, JourneyBootstrapResult } from "@/journey-handoff/model/bootstrap-result";
import type { JourneyBootstrapPort } from "@/journey-handoff/ports/handoff-ports";
import type { SupabaseClient } from "@supabase/supabase-js";

import { criarProjecaoInicial } from "@/infrastructure/jornada/jornada-view-projection";
import { SupabaseJornadaProjection } from "@/infrastructure/jornada/supabase-jornada-projection";
import { emptyToNull, parsePriority } from "@/lib/validations/patient-journey";

import type { ClockPort } from "@/journey-handoff/ports/handoff-ports";

export class SupabaseJourneyBootstrapPort implements JourneyBootstrapPort {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly clock: ClockPort,
    private readonly defaultManagerId: string,
    private readonly projection = new SupabaseJornadaProjection(),
  ) {}

  async bootstrap(input: BootstrapJourneyInput): Promise<JourneyBootstrapResult> {
    const { data: result, error } = await this.supabase.rpc("create_patient_with_initial_journey", {
      p_full_name: input.patient.fullName,
      p_preferred_name: emptyToNull(input.patient.preferredName ?? undefined),
      p_birth_date: null,
      p_cpf: null,
      p_phone: emptyToNull(input.patient.phone ?? undefined),
      p_email: emptyToNull(input.patient.email ?? undefined),
      p_city: null,
      p_state: null,
      p_health_plan: null,
      p_journey_title: input.journeyTitle,
      p_journey_objective: emptyToNull(input.journeyObjective ?? undefined),
      p_manager_id: input.managerId ?? this.defaultManagerId,
      p_journey_priority: parsePriority("NORMAL"),
      p_opened_at: null,
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = Array.isArray(result) ? result[0] : result;
    const journeyId = row?.journey_id as string | undefined;
    const patientId = row?.patient_id as string | undefined;

    if (!journeyId || !patientId) {
      throw new Error("Bootstrap da jornada não retornou identificadores.");
    }

    const iniciadaEm = this.clock.now();
    await this.projection.salvar(
      criarProjecaoInicial({ jornadaId: journeyId, pacienteId: patientId, iniciadaEm }),
    );

    return {
      caseId: randomUUID(),
      patientId,
      journeyId,
      ownership: {
        managerId: input.managerId ?? this.defaultManagerId,
        assignedCuratorId: null,
      },
      bootstrappedAt: iniciadaEm,
    };
  }
}
