import type { JornadaDoPacienteView } from "../contracts/jornada-view";
import type { FlowModelBase } from "./flow-base";
import { criarProximoPasso } from "./flow-base";

export interface EntregaFlowModel extends FlowModelBase {
  superficie: "ENTREGA";
  jornada_id: string;
  modo_apresentacao: "CONVITE" | "SILENCIOSO" | "INDISPONIVEL";
}

export function entregaAplica(view: JornadaDoPacienteView): boolean {
  return view.etapa_atual === "ENTREGA" && !view.concluida_em;
}

export function resolverEntregaFlow(view: JornadaDoPacienteView): EntregaFlowModel {
  const entregaDisponivel = view.estado_visivel === "ENTREGA_DISPONIVEL";

  return {
    fluxo_id: "entrega",
    superficie: "ENTREGA",
    ativo: entregaAplica(view),
    jornada_id: view.jornada_id,
    modo_apresentacao: entregaDisponivel ? "CONVITE" : "INDISPONIVEL",
    proximo_passo:
      view.proximo_passo ??
      criarProximoPasso(
        entregaDisponivel ? "Sua curadoria está pronta" : "Preparando entrega",
        entregaDisponivel
          ? "Agende o momento para conhecer as opções."
          : "Ainda estamos finalizando.",
        entregaDisponivel ? "PACIENTE" : "NENHUM",
        entregaDisponivel,
      ),
    acoes_permitidas: entregaDisponivel
      ? [
          {
            id: "agendar-apresentacao",
            rotulo: "Agendar apresentação",
            tipo: "NAVEGAR",
            destino: "ENTREGA",
          },
        ]
      : [],
  };
}
