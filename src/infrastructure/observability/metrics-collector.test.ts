import { describe, expect, it } from "vitest";
import { derivarPainelOperacional } from "@/infrastructure/workflow/derivar-painel-operacional";
import type { CasoOperacionalInput } from "@/infrastructure/workflow/derivar-filas-operacionais";
import { readModelToView, criarProjecaoInicial } from "@/infrastructure/jornada/jornada-view-projection";

function buildCaso(etapa: "CURADORIA" | "ACOMPANHAMENTO"): CasoOperacionalInput {
  const readModel = criarProjecaoInicial({
    jornadaId: `j-${etapa}`,
    pacienteId: "p-1",
    iniciadaEm: "2026-01-01T10:00:00Z",
  });
  readModel.etapaAtual = etapa;
  const view = readModelToView(readModel);
  return {
    jornada_id: readModel.jornadaId,
    paciente_id: readModel.pacienteId,
    paciente_nome: "Paciente Métricas",
    titulo_jornada: "Caso métricas",
    view,
    curador_id: null,
    curador_nome: null,
    atualizado_em: readModel.atualizadaEm,
  };
}

describe("metrics collector contracts", () => {
  it("deriva casos bloqueados e SLA a partir do painel", () => {
    const casos = [buildCaso("CURADORIA"), buildCaso("ACOMPANHAMENTO")];
    const painel = derivarPainelOperacional(casos);

    expect(painel.gerado_em).toBeTruthy();
    expect(Array.isArray(painel.casos_bloqueados)).toBe(true);
    expect(Array.isArray(painel.slas_vencendo)).toBe(true);
  });
});
