import type { EtapaDaJornadaCodigo } from "@/domain/jornada/value-objects/etapa-da-jornada";
import type { EstadoFluxo } from "@/experience-flow/contracts/state-machine";
import { resolverEstadoFluxo } from "@/experience-flow/state-machine";
import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";

import type { PublicChapter } from "../model/public-chapter";
import type { VisitorIntention } from "../model/visitor-intention";

export interface OperationalStateMapping {
  etapa: EtapaDaJornadaCodigo;
  estadoFluxo: EstadoFluxo;
}

/** Fonte única: capítulo público → etapa de domínio. */
const PUBLIC_CHAPTER_TO_ETAPA: Record<PublicChapter, EtapaDaJornadaCodigo> = {
  LIMIAR_THRESHOLD: "PRIMEIRA_DUVIDA",
  LIMIAR_FILM: "PRIMEIRO_CONTATO",
  LIMIAR_CONTINUATION: "PRIMEIRO_CONTATO",
  LIMIAR_CRAFT: "DESCOBERTA",
  LIMIAR_PATH: "ENTENDIMENTO_METODO",
  LIMIAR_INVITE: "CONFIANCA",
  LIMIAR_FAREWELL: "CONFIANCA",
  CONVERSA_GREETING: "PRIMEIRO_CONTATO",
  CONVERSA_ASK_NAME: "PRIMEIRO_CONTATO",
  CONVERSA_ASK_STORY: "HISTORIA",
  CONVERSA_ASK_DURATION: "HISTORIA",
  CONVERSA_CLOSING: "CADASTRO",
};

/** Intenção reforça a etapa operacional quando o visitante declara um gesto explícito. */
const INTENTION_ETAPA_OVERRIDE: Partial<Record<VisitorIntention, EtapaDaJornadaCodigo>> = {
  INICIAR_CONVERSA: "PRIMEIRO_CONTATO",
  CONTAR_HISTORIA: "HISTORIA",
  ACEITAR_ACOMPANHAMENTO: "CADASTRO",
};

function viewFromEtapa(etapa: EtapaDaJornadaCodigo): JornadaDoPacienteView {
  return {
    jornada_id: "projection",
    paciente_id: "projection",
    etapa_atual: etapa,
    etapas_concluidas: [],
    estado_visivel: "EXPLORANDO",
    proximo_passo: null,
    responsavel: { tipo: "EQUIPE_ALIVIAR", nome_exibicao: "Aliviar", canal: "HUMANO" },
    bloqueio: null,
    timeline: [],
    iniciada_em: "2026-01-01T00:00:00.000Z",
    atualizada_em: "2026-01-01T00:00:00.000Z",
    concluida_em: null,
    extensoes: {
      tempo_estimado: null,
      documentos: [],
      entrega: null,
      escolha_registrada: null,
      ace_analise: null,
    },
  };
}

export function mapPublicChapterToEtapa(chapter: PublicChapter): EtapaDaJornadaCodigo {
  return PUBLIC_CHAPTER_TO_ETAPA[chapter];
}

export function mapIntentionToEtapa(intention: VisitorIntention): EtapaDaJornadaCodigo {
  return INTENTION_ETAPA_OVERRIDE[intention] ?? "PRIMEIRO_CONTATO";
}

export function resolveOperationalState(
  chapter: PublicChapter,
  intention?: VisitorIntention,
): OperationalStateMapping {
  const etapa =
    intention && INTENTION_ETAPA_OVERRIDE[intention]
      ? INTENTION_ETAPA_OVERRIDE[intention]!
      : PUBLIC_CHAPTER_TO_ETAPA[chapter];

  const estadoFluxo = resolverEstadoFluxo(viewFromEtapa(etapa));

  return { etapa, estadoFluxo };
}

export function narrativeMappingIsConsistent(): boolean {
  return Object.values(PUBLIC_CHAPTER_TO_ETAPA).every((etapa) => etapa.length > 0);
}
