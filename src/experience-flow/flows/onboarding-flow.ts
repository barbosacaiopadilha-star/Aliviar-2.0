import type { JornadaDoPacienteView } from "../contracts/jornada-view";
import type { FlowModelBase } from "./flow-base";
import { criarProximoPasso } from "./flow-base";

const ETAPAS_ONBOARDING = new Set([
  "PRIMEIRO_CONTATO",
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
]);

export interface OnboardingFlowModel extends FlowModelBase {
  superficie: "ONBOARDING";
  jornada_id: string;
  etapa_atual: JornadaDoPacienteView["etapa_atual"];
  progresso: { concluidas: number; total: number };
}

export function onboardingAplica(view: JornadaDoPacienteView): boolean {
  return ETAPAS_ONBOARDING.has(view.etapa_atual) && !view.concluida_em;
}

export function resolverOnboardingFlow(view: JornadaDoPacienteView): OnboardingFlowModel {
  const etapasOrdenadas = [
    "PRIMEIRO_CONTATO",
    "DESCOBERTA",
    "ENTENDIMENTO_METODO",
    "CONFIANCA",
    "CADASTRO",
    "HISTORIA",
  ] as const;

  const concluidas = etapasOrdenadas.filter((etapa) =>
    view.etapas_concluidas.includes(etapa),
  ).length;

  const acaoCadastro =
    view.etapa_atual === "CADASTRO"
      ? [
          {
            id: "registrar-caso",
            rotulo: "Confirmar cadastro",
            tipo: "DISPARAR_API" as const,
            endpoint: "POST /api/v1/casos",
          },
        ]
      : [];

  const acaoHistoria =
    view.etapa_atual === "HISTORIA"
      ? [
          {
            id: "compartilhar-historia",
            rotulo: "Compartilhar história",
            tipo: "INFORMAR" as const,
          },
        ]
      : [];

  return {
    fluxo_id: "onboarding",
    superficie: "ONBOARDING",
    ativo: onboardingAplica(view),
    jornada_id: view.jornada_id,
    etapa_atual: view.etapa_atual,
    progresso: { concluidas, total: etapasOrdenadas.length },
    proximo_passo:
      view.proximo_passo ??
      criarProximoPasso("Continuar onboarding", "Siga o passo indicado pela Aliviar.", "ALIVIAR", false),
    acoes_permitidas: [...acaoCadastro, ...acaoHistoria],
  };
}
