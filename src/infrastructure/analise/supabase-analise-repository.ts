import type { AnaliseRepositoryPort } from "@/application/ports/analise-repository-port";
import type { AnaliseInicial } from "@/domain/analise/analise-inicial";
import { improvedAceService } from "@/infrastructure/ace/improved-ace-service";

/**
 * Adapter canônico — delega exclusivamente ao ACE Melhorado (v2).
 * O pipeline legado (journey_events direto) foi substituído.
 */
export class SupabaseAnaliseRepository implements AnaliseRepositoryPort {
  async executarAnaliseInicial(
    input: Parameters<AnaliseRepositoryPort["executarAnaliseInicial"]>[0],
    executadaPor: string,
  ): Promise<AnaliseInicial> {
    const run = await improvedAceService.executarParaJornada({
      jornadaId: input.jornadaId,
      trigger: "STAFF",
      actorId: executadaPor,
      observacoesStaff: input.observacoes,
      contextoStaff: input.contexto ?? null,
      avancarProjecao: true,
    });

    return {
      analiseId: run.id,
      jornadaId: input.jornadaId,
      observacoes: input.observacoes,
      contexto: input.contexto ?? null,
      executadaEm: run.concluido_em ?? run.iniciado_em,
      executadaPor,
    };
  }
}
