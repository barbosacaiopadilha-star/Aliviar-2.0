import type { EtapaDaJornadaCodigo } from "@/domain/jornada/value-objects/etapa-da-jornada";
import type { EstadoFluxo } from "@/experience-flow/contracts/state-machine";
import type { PortalSurface } from "@/experience-layer/resolve-canonical-experience";

import type { JourneyHandoff } from "../model/journey-handoff";
import type { PublicChapter } from "../model/public-chapter";
import { mapPublicChapterToEtapa, resolveOperationalState } from "./narrative-mapping";

export interface PortalContinuationProjection {
  handoffId: string;
  journeyId: string | null;
  sessionId: string;
  resumeAt: {
    publicChapter: PublicChapter;
    etapaAtual: EtapaDaJornadaCodigo;
    estadoFluxo: EstadoFluxo;
    portalSurface: PortalSurface;
  };
  narrativeSummary: string;
  /** Sempre falso — a experiência nunca reinicia do zero. */
  shouldRestartExperience: false;
  projectedAt: string;
}

const ETAPAS_ONBOARDING = new Set<EtapaDaJornadaCodigo>([
  "PRIMEIRO_CONTATO",
  "DESCOBERTA",
  "ENTENDIMENTO_METODO",
  "CONFIANCA",
  "CADASTRO",
  "HISTORIA",
]);

function resolvePortalSurface(etapa: EtapaDaJornadaCodigo): PortalSurface {
  if (ETAPAS_ONBOARDING.has(etapa)) {
    return "onboarding";
  }
  if (etapa === "ACE") return "minha-jornada";
  if (etapa === "CURADORIA") return "curadoria";
  if (etapa === "ENTREGA") return "entrega";
  if (etapa === "ESCOLHA") return "escolha";
  if (etapa === "ACOMPANHAMENTO" || etapa === "RELACIONAMENTO") return "acompanhamento";
  return "onboarding";
}

function buildSummary(chapter: PublicChapter, etapa: EtapaDaJornadaCodigo): string {
  return `Continuação a partir de ${chapter} · etapa ${etapa}`;
}

export function projectPortalContinuation(
  handoff: JourneyHandoff,
  projectedAt: string,
): PortalContinuationProjection {
  const operational = resolveOperationalState(handoff.checkpoint.publicChapter, handoff.intention);
  const etapa = handoff.bootstrap
    ? mapPublicChapterToEtapa(handoff.checkpoint.publicChapter)
    : operational.etapa;

  return {
    handoffId: handoff.id,
    journeyId: handoff.bootstrap?.journeyId ?? null,
    sessionId: handoff.sessionId,
    resumeAt: {
      publicChapter: handoff.checkpoint.publicChapter,
      etapaAtual: etapa,
      estadoFluxo: operational.estadoFluxo,
      portalSurface: resolvePortalSurface(etapa),
    },
    narrativeSummary: buildSummary(handoff.checkpoint.publicChapter, etapa),
    shouldRestartExperience: false,
    projectedAt,
  };
}
