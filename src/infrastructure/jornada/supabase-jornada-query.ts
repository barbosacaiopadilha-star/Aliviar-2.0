import type { JornadaQueryPort } from "@/application/ports/jornada-query-port";
import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { createClient } from "@/lib/supabase/server";
import { normalizarExtensoes } from "./jornada-view-extensoes";
import { viewToReadModel } from "./jornada-view-projection";
import { SupabaseJornadaProjection } from "./supabase-jornada-projection";

function parseViewData(raw: unknown): JornadaDoPacienteReadModel {
  const view = raw as JornadaDoPacienteView;
  return viewToReadModel({ ...view, extensoes: normalizarExtensoes(view.extensoes) });
}

export class SupabaseJornadaQuery implements JornadaQueryPort {
  constructor(private readonly projection = new SupabaseJornadaProjection()) {}

  obterPorId(jornadaId: string): Promise<JornadaDoPacienteReadModel | null> {
    return this.projection.obterPorId(jornadaId);
  }

  async obterPorPacienteId(pacienteId: string): Promise<JornadaDoPacienteReadModel | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("patient_journey_views")
      .select("view_data")
      .eq("patient_id", pacienteId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.view_data) {
      return null;
    }

    return parseViewData(data.view_data);
  }
}

export { SupabaseJornadaProjection };
