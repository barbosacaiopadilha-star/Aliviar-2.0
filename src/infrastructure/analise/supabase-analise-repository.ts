import type { AnaliseRepositoryPort } from "@/application/ports/analise-repository-port";
import type { AnaliseInicial } from "@/domain/analise/analise-inicial";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { avancarProjecaoAposAnaliseInicial } from "@/infrastructure/jornada/jornada-view-projection";
import { SupabaseJornadaProjection } from "@/infrastructure/jornada/supabase-jornada-projection";
import { createClient } from "@/lib/supabase/server";

const jornadaProjection = new SupabaseJornadaProjection();

export class SupabaseAnaliseRepository implements AnaliseRepositoryPort {
  async executarAnaliseInicial(
    input: Parameters<AnaliseRepositoryPort["executarAnaliseInicial"]>[0],
    executadaPor: string,
  ): Promise<AnaliseInicial> {
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

    const description = [input.contexto, input.observacoes].filter(Boolean).join("\n\n");

    const { data: eventId, error } = await supabase.rpc("create_journey_event", {
      p_journey_id: input.jornadaId,
      p_category: "OBSERVATION",
      p_title: "Análise inicial",
      p_description: description || input.observacoes,
      p_journey_impact: null,
      p_next_step: null,
      p_occurred_at: new Date().toISOString(),
      p_is_highlighted: true,
    });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    const executadaEm = new Date().toISOString();
    const projecaoAtual = await jornadaProjection.obterPorId(input.jornadaId);
    if (projecaoAtual) {
      await jornadaProjection.salvar(
        avancarProjecaoAposAnaliseInicial(projecaoAtual, executadaEm),
      );
    }

    return {
      analiseId: eventId as string,
      jornadaId: input.jornadaId,
      observacoes: input.observacoes,
      contexto: input.contexto ?? null,
      executadaEm,
      executadaPor,
    };
  }
}
