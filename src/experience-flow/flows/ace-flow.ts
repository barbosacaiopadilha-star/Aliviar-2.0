import type { JornadaDoPacienteView } from "../contracts/jornada-view";
import type { FlowModelBase } from "./flow-base";
import { criarProximoPasso } from "./flow-base";

export interface AceFlowModel extends FlowModelBase {
  superficie: "ACE";
  jornada_id: string;
  responsavel: JornadaDoPacienteView["responsavel"];
  visibilidade: "ATIVO" | "SILENCIOSO" | "AUSENTE";
}

export function aceAplica(view: JornadaDoPacienteView): boolean {
  return view.etapa_atual === "ACE" && !view.concluida_em;
}

function resolverVisibilidadeAce(view: JornadaDoPacienteView): AceFlowModel["visibilidade"] {
  if (view.etapa_atual === "ENTREGA" || view.etapa_atual === "ESCOLHA") {
    return "AUSENTE";
  }
  if (view.etapa_atual === "CURADORIA") {
    return "SILENCIOSO";
  }
  return "ATIVO";
}

export function resolverAceFlow(view: JornadaDoPacienteView): AceFlowModel {
  return {
    fluxo_id: "ace",
    superficie: "ACE",
    ativo: aceAplica(view),
    jornada_id: view.jornada_id,
    responsavel: view.responsavel,
    visibilidade: resolverVisibilidadeAce(view),
    proximo_passo:
      view.proximo_passo ??
      criarProximoPasso(
        "Seu acompanhante",
        "A ACE está disponível para orientar você.",
        "ALIVIAR",
        true,
      ),
    acoes_permitidas: [
      {
        id: "falar-com-ace",
        rotulo: "Falar com a ACE",
        tipo: "NAVEGAR",
        destino: "ACE",
      },
    ],
  };
}
