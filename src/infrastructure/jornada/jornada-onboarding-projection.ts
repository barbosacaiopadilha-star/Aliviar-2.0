import type { JornadaDoPacienteReadModel } from "@/application/jornada/jornada-do-paciente-read-model";
import type { EtapaCodigoView } from "@/experience-flow/contracts/jornada-view";
import {
  ESTADO_POR_ETAPA_ONBOARDING,
  PROXIMO_PASSO_POR_ETAPA,
  proximaEtapaOnboarding,
  RESPONSAVEL_POR_ETAPA,
} from "./jornada-projection-helpers";

const ETAPAS_ONBOARDING = new Set<EtapaCodigoView>([
  "PRIMEIRO_CONTATO",
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
]);

export function onboardingAplicaProjecao(etapaAtual: EtapaCodigoView): boolean {
  return ETAPAS_ONBOARDING.has(etapaAtual);
}

export function avancarProjecaoOnboarding(
  atual: JornadaDoPacienteReadModel,
  ocorridoEm: string,
): JornadaDoPacienteReadModel {
  const proxima = proximaEtapaOnboarding(atual.etapaAtual);
  if (!proxima) {
    return atual;
  }

  const etapaConcluida = atual.etapaAtual;

  return {
    ...atual,
    etapaAtual: proxima,
    etapasConcluidas: [...atual.etapasConcluidas, etapaConcluida],
    estadoVisivel: ESTADO_POR_ETAPA_ONBOARDING[proxima] ?? atual.estadoVisivel,
    proximoPasso: PROXIMO_PASSO_POR_ETAPA[proxima] ?? atual.proximoPasso,
    responsavel: RESPONSAVEL_POR_ETAPA[proxima] ?? atual.responsavel,
    timeline: [
      ...atual.timeline,
      {
        id: `${atual.jornadaId}-onboarding-${etapaConcluida}`,
        tipo: "PROGRESSO",
        titulo: `Etapa concluída: ${etapaConcluida}`,
        descricao: "Você avançou no onboarding.",
        ocorrido_em: ocorridoEm,
        etapa: etapaConcluida,
        visibilidade: "PUBLICO",
      },
    ],
    atualizadaEm: ocorridoEm,
  };
}
