import type { FlowModelBase } from "./flow-base";
import { criarProximoPasso } from "./flow-base";

export interface LandingFlowModel extends FlowModelBase {
  superficie: "LANDING";
  convite: string;
  destino_ao_iniciar: "PRIMEIRO_CONTATO";
}

export function resolverLandingFlow(): LandingFlowModel {
  return {
    fluxo_id: "landing",
    superficie: "LANDING",
    ativo: true,
    convite: "Entrar em contato",
    destino_ao_iniciar: "PRIMEIRO_CONTATO",
    proximo_passo: criarProximoPasso(
      "Entrar em contato",
      "Fale com a Aliviar quando estiver pronto.",
      "PACIENTE",
      true,
    ),
    acoes_permitidas: [
      {
        id: "iniciar-contato",
        rotulo: "Começar",
        tipo: "NAVEGAR",
        destino: "PRIMEIRO_CONTATO",
      },
    ],
  };
}
