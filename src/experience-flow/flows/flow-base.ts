import type { ProximoPassoView } from "../contracts/jornada-view";

export interface FlowAction {
  id: string;
  rotulo: string;
  tipo: "NAVEGAR" | "DISPARAR_API" | "INFORMAR";
  endpoint?: string;
  destino?: string;
}

export interface FlowModelBase {
  fluxo_id: string;
  ativo: boolean;
  proximo_passo: ProximoPassoView;
  acoes_permitidas: FlowAction[];
}

export function criarProximoPasso(
  titulo: string,
  descricao: string,
  dono: ProximoPassoView["dono"],
  acao_disponivel: boolean,
): ProximoPassoView {
  return { titulo, descricao, dono, acao_disponivel };
}
