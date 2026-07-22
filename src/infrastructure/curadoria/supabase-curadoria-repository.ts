import type { CuradoriaRepositoryPort } from "@/application/ports/curadoria-repository-port";
import type { SessaoCuradoria } from "@/domain/curadoria/sessao-curadoria";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule-error";
import { NotFoundError } from "@/domain/shared/errors/not-found-error";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export class SupabaseCuradoriaRepository implements CuradoriaRepositoryPort {
  async abrirSessao(
    input: Parameters<CuradoriaRepositoryPort["abrirSessao"]>[0],
    curadorId: string,
  ): Promise<SessaoCuradoria> {
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

    const sessaoId = randomUUID();
    const abertaEm = new Date().toISOString();

    const { error } = await supabase.rpc("create_journey_event", {
      p_journey_id: input.jornadaId,
      p_category: "OPERATIONAL",
      p_title: "Sessão de curadoria aberta",
      p_description: `Sessão ${sessaoId}`,
      p_journey_impact: null,
      p_next_step: null,
      p_occurred_at: abertaEm,
      p_is_highlighted: false,
    });

    if (error) {
      throw new BusinessRuleError(error.message);
    }

    return {
      sessaoId,
      jornadaId: input.jornadaId,
      curadorId,
      status: "ABERTA",
      abertaEm,
    };
  }
}
