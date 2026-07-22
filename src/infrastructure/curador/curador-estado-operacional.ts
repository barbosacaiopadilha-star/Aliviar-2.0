import type { EstadoOperacionalCurador } from "@/curator-flow/contracts/curador-view";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";

const ORDEM_ESTADO: Record<EstadoOperacionalCurador, number> = {
  BLOQUEADO: 0,
  AGUARDANDO: 1,
  EM_ANALISE: 2,
  PRONTO_PARA_ENTREGA: 3,
  ENTREGUE: 4,
  ACOMPANHAMENTO: 5,
};

export function derivarEstadoOperacionalCurador(
  view: JornadaDoPacienteView,
  opcoesRegistradas: boolean,
  entregaAprovada: boolean,
): EstadoOperacionalCurador {
  if (view.bloqueio) {
    return "BLOQUEADO";
  }

  if (view.etapa_atual === "ACOMPANHAMENTO" || view.etapa_atual === "RELACIONAMENTO") {
    return "ACOMPANHAMENTO";
  }

  if (view.etapa_atual === "ENTREGA" || view.etapa_atual === "ESCOLHA") {
    return "ENTREGUE";
  }

  if (view.etapa_atual === "CURADORIA") {
    if (opcoesRegistradas && entregaAprovada) {
      return "PRONTO_PARA_ENTREGA";
    }
    return "EM_ANALISE";
  }

  return "AGUARDANDO";
}

export function prioridadeOrdemEstado(estado: EstadoOperacionalCurador): number {
  return ORDEM_ESTADO[estado];
}
