import type { EntregaRepositoryPort } from "@/application/ports/entrega-repository-port";
import type { EntregaAoPaciente } from "@/domain/entrega/entrega-paciente";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { avancarProjecaoAposEntrega } from "@/infrastructure/jornada/jornada-view-projection";
import { SupabaseJornadaProjection } from "@/infrastructure/jornada/supabase-jornada-projection";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const jornadaProjection = new SupabaseJornadaProjection();

export class SupabaseEntregaRepository implements EntregaRepositoryPort {
  async produzirEntrega(
    input: Parameters<EntregaRepositoryPort["produzirEntrega"]>[0],
    produzidaPor: string,
  ): Promise<EntregaAoPaciente> {
    const supabase = await createClient();

    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select("id")
      .eq("id", input.jornadaId)
      .maybeSingle();

    if (journeyError) {
      throw new BusinessRuleError(journeyError.message);
    }

    if (!journey) {
      throw new NotFoundError("Jornada");
    }

    const entregaId = randomUUID();
    const produzidaEm = new Date().toISOString();

    const { error } = await supabase.rpc("create_journey_event", {
      p_journey_id: input.jornadaId,
      p_category: "DECISION",
      p_title: `Entrega ao paciente (${input.formato})`,
      p_description: input.conteudo,
      p_journey_impact: `Entrega ${entregaId}`,
      p_next_step: null,
      p_occurred_at: produzidaEm,
      p_is_highlighted: true,
    });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const projecaoAtual = await jornadaProjection.obterPorId(input.jornadaId);
    if (projecaoAtual) {
      await jornadaProjection.salvar(avancarProjecaoAposEntrega(projecaoAtual, produzidaEm));
    }

    return {
      entregaId,
      jornadaId: input.jornadaId,
      formato: input.formato,
      conteudo: input.conteudo,
      produzidaEm,
      produzidaPor,
    };
  }
}
