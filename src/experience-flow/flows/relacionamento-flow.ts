import type { JornadaDoPacienteView } from "../contracts/jornada-view";
import type { FlowModelBase } from "./flow-base";
import { criarProximoPasso } from "./flow-base";

export interface RelacionamentoFlowModel extends FlowModelBase {
  superficie: "RELACIONAMENTO";
  jornada_id: string;
  fase: "ACOMPANHAMENTO" | "RELACIONAMENTO" | "ENCERRADA";
}

export function relacionamentoAplica(view: JornadaDoPacienteView): boolean {
  return (
    view.etapa_atual === "ACOMPANHAMENTO" ||
    view.etapa_atual === "RELACIONAMENTO" ||
    view.concluida_em !== null
  );
}

export function resolverRelacionamentoFlow(view: JornadaDoPacienteView): RelacionamentoFlowModel {
  const fase: RelacionamentoFlowModel["fase"] = view.concluida_em
    ? "ENCERRADA"
    : view.etapa_atual === "ACOMPANHAMENTO"
      ? "ACOMPANHAMENTO"
      : "RELACIONAMENTO";

  return {
    fluxo_id: "relacionamento",
    superficie: "RELACIONAMENTO",
    ativo: relacionamentoAplica(view),
    jornada_id: view.jornada_id,
    fase,
    proximo_passo:
      view.proximo_passo ??
      criarProximoPasso(
        fase === "ENCERRADA" ? "Jornada concluída" : "Canal aberto",
        fase === "ENCERRADA"
          ? "Este capítulo fechou. A porta permanece aberta."
          : "Estamos aqui quando precisar.",
        "NENHUM",
        false,
      ),
    acoes_permitidas:
      fase === "ACOMPANHAMENTO"
        ? [
            {
              id: "sinalizar-acompanhamento",
              rotulo: "Registrar primeiro contato",
              tipo: "INFORMAR",
            },
          ]
        : [],
  };
}
