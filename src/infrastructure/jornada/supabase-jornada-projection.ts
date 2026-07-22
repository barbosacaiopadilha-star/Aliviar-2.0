import type { JornadaProjectionPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { createClient } from "@/lib/supabase/server";
import { normalizarExtensoes } from "./jornada-view-extensoes";
import { readModelToView, viewToReadModel } from "./jornada-view-projection";
import { journeyNotificationService } from "@/infrastructure/notifications/journey-notification-service";

function parseViewData(raw: unknown): JornadaDoPacienteReadModel {
  const view = raw as JornadaDoPacienteView;
  return viewToReadModel({ ...view, extensoes: normalizarExtensoes(view.extensoes) });
}

export class SupabaseJornadaProjection implements JornadaProjectionPort {
  async salvar(model: JornadaDoPacienteReadModel): Promise<void> {
    const supabase = await createClient();
    const anterior = await this.obterPorId(model.jornadaId);
    const viewData = readModelToView(model);

    const { error } = await supabase.from("patient_journey_views").upsert(
      {
        journey_id: model.jornadaId,
        patient_id: model.pacienteId,
        view_data: viewData,
        updated_at: model.atualizadaEm,
      },
      { onConflict: "journey_id" },
    );

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const anteriorView = anterior ? readModelToView(anterior) : null;
    await journeyNotificationService.sincronizarDaJornada({
      patientId: model.pacienteId,
      journeyId: model.jornadaId,
      anterior: anteriorView,
      atual: viewData,
    });
  }

  async obterPorId(jornadaId: string): Promise<JornadaDoPacienteReadModel | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("patient_journey_views")
      .select("view_data")
      .eq("journey_id", jornadaId)
      .maybeSingle();

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    if (!data?.view_data) {
      return null;
    }

    return parseViewData(data.view_data);
  }
}
