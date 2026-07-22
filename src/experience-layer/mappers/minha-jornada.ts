import type { EtapaCodigoView } from "@/experience-flow/contracts/jornada-view";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import type { MapaEtapaView, MinhaJornadaExperienceModel } from "../contracts/experience-models";
import { LABEL_POR_ETAPA } from "./onboarding";

const ETAPAS_MAPA: EtapaCodigoView[] = [
  "PRIMEIRA_DUVIDA",
  "PRIMEIRO_CONTATO",
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
  "ACE",
  "CURADORIA",
  "ENTREGA",
  "ESCOLHA",
  "ACOMPANHAMENTO",
  "RELACIONAMENTO",
];

function derivarMapaEtapas(view: JornadaDoPacienteView): MapaEtapaView[] {
  return ETAPAS_MAPA.map((codigo) => {
    if (view.bloqueio?.etapa === codigo) {
      return { codigo, label: LABEL_POR_ETAPA[codigo], status: "BLOQUEADA" };
    }
    if (view.etapas_concluidas.includes(codigo)) {
      return { codigo, label: LABEL_POR_ETAPA[codigo], status: "CONCLUIDA" };
    }
    if (view.etapa_atual === codigo) {
      return { codigo, label: LABEL_POR_ETAPA[codigo], status: "ATUAL" };
    }
    return { codigo, label: LABEL_POR_ETAPA[codigo], status: "FUTURA" };
  });
}

const ORDEM_ETAPA: Record<EtapaCodigoView, number> = Object.fromEntries(
  ETAPAS_MAPA.map((codigo, indice) => [codigo, indice]),
) as Record<EtapaCodigoView, number>;

export function mapMinhaJornadaExperienceModel(
  view: JornadaDoPacienteView,
): MinhaJornadaExperienceModel {
  const ace_disponivel =
    ORDEM_ETAPA[view.etapa_atual] >= ORDEM_ETAPA.ACE && view.concluida_em === null;

  return {
    jornada: view,
    estado_visivel: view.estado_visivel,
    timeline: view.timeline,
    proximo_passo:
      view.proximo_passo ?? {
        titulo: "Acompanhar jornada",
        descricao: "Veja onde você está na sua jornada.",
        dono: "NENHUM",
        acao_disponivel: false,
      },
    responsavel: view.responsavel,
    bloqueio: view.bloqueio,
    mapa_etapas: derivarMapaEtapas(view),
    ace_disponivel,
  };
}
