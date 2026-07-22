import type { CasoRepositoryPort } from "@/application/ports/caso-repository-port";
import type { CasoDeclarado } from "@/domain/caso/caso-declarado";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { criarProjecaoInicial } from "@/infrastructure/jornada/jornada-view-projection";
import { SupabaseJornadaProjection } from "@/infrastructure/jornada/supabase-jornada-projection";
import { createClient } from "@/lib/supabase/server";
import { emptyToNull, parsePriority } from "@/lib/validations/patient-journey";

const jornadaProjection = new SupabaseJornadaProjection();

export class SupabaseCasoRepository implements CasoRepositoryPort {
  async registrarCasoDeclarado(
    input: Parameters<CasoRepositoryPort["registrarCasoDeclarado"]>[0],
    _createdBy: string,
  ): Promise<CasoDeclarado> {
    const supabase = await createClient();

    const { data: result, error } = await supabase.rpc("create_patient_with_initial_journey", {
      p_full_name: input.fullName,
      p_preferred_name: emptyToNull(input.preferredName ?? undefined),
      p_birth_date: emptyToNull(input.birthDate ?? undefined),
      p_cpf: emptyToNull(input.cpf ?? undefined),
      p_phone: emptyToNull(input.phone ?? undefined),
      p_email: emptyToNull(input.email ?? undefined),
      p_city: emptyToNull(input.city ?? undefined),
      p_state: emptyToNull(input.state ?? undefined),
      p_health_plan: emptyToNull(input.healthPlan ?? undefined),
      p_journey_title: input.journeyTitle,
      p_journey_objective: emptyToNull(input.journeyObjective ?? undefined),
      p_manager_id: input.managerId,
      p_journey_priority: parsePriority(input.priority ?? "NORMAL"),
      p_opened_at: emptyToNull(input.openedAt ?? undefined),
    });

    if (error) {
      throw new BusinessRuleError(
        error.message.includes("Gestor inválido")
          ? "Selecione um Gestor ativo (ADMIN ou MANAGER)."
          : error.message,
      );
    }

    const row = Array.isArray(result) ? result[0] : result;
    const journeyId = row?.journey_id as string | undefined;
    const patientId = row?.patient_id as string | undefined;

    if (!journeyId || !patientId) {
      throw new BusinessRuleError(
        "Não foi possível concluir o cadastro. A Jornada inicial não foi criada.",
      );
    }

    const iniciadaEm = new Date().toISOString();
    await jornadaProjection.salvar(
      criarProjecaoInicial({ jornadaId: journeyId, pacienteId: patientId, iniciadaEm }),
    );

    return {
      casoId: journeyId,
      pacienteId: patientId,
      jornadaId: journeyId,
    };
  }
}
