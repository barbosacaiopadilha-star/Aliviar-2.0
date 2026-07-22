import type { JornadaDoPacienteView } from "../contracts/jornada-view";
import type { FlowModelBase } from "./flow-base";
import { criarProximoPasso } from "./flow-base";

export interface JourneyFlowModel extends FlowModelBase {
  superficie: "MINHA_JORNADA";
  jornada_id: string;
  estado_visivel: JornadaDoPacienteView["estado_visivel"];
  timeline_resumo: string;
  bloqueio_ativo: boolean;
}

export function resolverJourneyFlow(view: JornadaDoPacienteView): JourneyFlowModel {
  const ultimoItem = view.timeline.at(-1);
  const resumo = ultimoItem?.titulo ?? view.proximo_passo?.titulo ?? "Sua jornada";

  return {
    fluxo_id: "journey",
    superficie: "MINHA_JORNADA",
    ativo: !view.concluida_em,
    jornada_id: view.jornada_id,
    estado_visivel: view.estado_visivel,
    timeline_resumo: resumo,
    bloqueio_ativo: view.bloqueio !== null,
    proximo_passo:
      view.proximo_passo ??
      criarProximoPasso("Acompanhar jornada", "Veja onde você está.", "NENHUM", false),
    acoes_permitidas: view.bloqueio
      ? [
          {
            id: "ver-bloqueio",
            rotulo: view.bloqueio.motivo_humano,
            tipo: "INFORMAR",
          },
        ]
      : [],
  };
}
