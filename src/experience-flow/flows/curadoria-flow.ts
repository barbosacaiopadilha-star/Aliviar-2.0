import type { JornadaDoPacienteView } from "../contracts/jornada-view";
import type { FlowModelBase } from "./flow-base";
import { criarProximoPasso } from "./flow-base";

export interface CuradoriaFlowModel extends FlowModelBase {
  superficie: "CURADORIA";
  jornada_id: string;
  status: "AGUARDANDO" | "EM_ANDAMENTO" | "CONCLUIDA";
}

export function curadoriaAplica(view: JornadaDoPacienteView): boolean {
  return view.etapa_atual === "CURADORIA" && !view.concluida_em;
}

export function resolverCuradoriaFlow(view: JornadaDoPacienteView): CuradoriaFlowModel {
  const status: CuradoriaFlowModel["status"] = view.bloqueio
    ? "AGUARDANDO"
    : view.etapas_concluidas.includes("CURADORIA")
      ? "CONCLUIDA"
      : "EM_ANDAMENTO";

  return {
    fluxo_id: "curadoria",
    superficie: "CURADORIA",
    ativo: curadoriaAplica(view),
    jornada_id: view.jornada_id,
    status,
    proximo_passo:
      view.proximo_passo ??
      criarProximoPasso(
        "Curadoria em andamento",
        "Estamos analisando com cuidado. A ACE avisa quando houver novidade.",
        "ALIVIAR",
        false,
      ),
    acoes_permitidas: [],
  };
}
