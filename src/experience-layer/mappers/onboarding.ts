import type { EtapaCodigoView } from "@/experience-flow/contracts/jornada-view";
import { onboardingAplica } from "@/experience-flow/flows/onboarding-flow";
import type {
  EtapaFluxoOnboardingView,
  OnboardingExperienceModel,
} from "../contracts/experience-models";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";

const LABEL_POR_ETAPA: Record<EtapaCodigoView, string> = {
  PRIMEIRA_DUVIDA: "Primeira dúvida",
  PRIMEIRO_CONTATO: "Primeira conversa",
  DESCOBERTA: "Conhecendo a Aliviar",
  ENTENDIMENTO_METODO: "Como trabalhamos",
  CONFIANCA: "Construindo confiança",
  CADASTRO: "Seu cadastro",
  HISTORIA: "Sua história",
  ACE: "Acompanhamento",
  CURADORIA: "Curadoria",
  ENTREGA: "Entrega",
  ESCOLHA: "Escolha",
  ACOMPANHAMENTO: "Acompanhamento",
  RELACIONAMENTO: "Relacionamento",
};

const ETAPAS_FLUXO_ONBOARDING: EtapaCodigoView[] = [
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
];

function derivarEtapasFluxo(view: JornadaDoPacienteView): EtapaFluxoOnboardingView[] {
  return ETAPAS_FLUXO_ONBOARDING.map((codigo) => {
    if (view.etapas_concluidas.includes(codigo)) {
      return { codigo, label: LABEL_POR_ETAPA[codigo], status: "CONCLUIDA" as const };
    }
    if (view.etapa_atual === codigo) {
      return { codigo, label: LABEL_POR_ETAPA[codigo], status: "ATUAL" as const };
    }
    return { codigo, label: LABEL_POR_ETAPA[codigo], status: "FUTURA" as const };
  });
}

export function mapOnboardingExperienceModel(
  view: JornadaDoPacienteView,
): OnboardingExperienceModel | null {
  if (!onboardingAplica(view)) {
    return null;
  }

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

  const indiceConfianca = etapasOrdenadas.indexOf("CONFIANCA");
  const indiceAtual = etapasOrdenadas.indexOf(
    view.etapa_atual as (typeof etapasOrdenadas)[number],
  );
  const gestorVisivel =
    view.etapa_atual === "CONFIANCA" ||
    view.etapas_concluidas.includes("CONFIANCA") ||
    (indiceAtual >= 0 && indiceAtual >= indiceConfianca);

  const gestor = gestorVisivel
    ? view.responsavel.tipo === "GESTOR"
      ? view.responsavel
      : { tipo: "GESTOR" as const, nome_exibicao: "Equipe Aliviar", canal: "HUMANO" as const }
    : null;

  const pedido_atual =
    view.bloqueio && view.bloqueio.motivo_humano.toLowerCase().includes("documento")
      ? {
          titulo: "Documento solicitado",
          descricao: view.bloqueio.motivo_humano,
        }
      : null;

  return {
    jornada: view,
    etapa_atual_legivel: LABEL_POR_ETAPA[view.etapa_atual],
    progresso: {
      etapas_concluidas: concluidas,
      etapas_totais: etapasOrdenadas.length,
      percentual: Math.round((concluidas / etapasOrdenadas.length) * 100),
    },
    gestor,
    proximo_passo:
      view.proximo_passo ?? {
        titulo: "Continuar",
        descricao: "Siga o passo indicado pela Aliviar.",
        dono: "ALIVIAR",
        acao_disponivel: false,
      },
    pedido_atual,
    etapas_fluxo: derivarEtapasFluxo(view),
  };
}

export { LABEL_POR_ETAPA };
