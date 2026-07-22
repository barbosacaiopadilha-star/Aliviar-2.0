import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { resolverExperienceFlow } from "@/experience-flow";
import { mapAceExperienceModel } from "./mappers/ace";
import { mapAcompanhamentoExperienceModel } from "./mappers/acompanhamento";
import { mapCuradoriaExperienceModel } from "./mappers/curadoria";
import { mapDocumentosExperienceModel } from "./mappers/documentos";
import { mapEntregaExperienceModel } from "./mappers/entrega";
import { mapEscolhaExperienceModel } from "./mappers/escolha";
import { mapLandingExperienceModel } from "./mappers/landing";
import { mapMinhaJornadaExperienceModel } from "./mappers/minha-jornada";
import { mapOnboardingExperienceModel } from "./mappers/onboarding";
import type { CanonicalExperienceSnapshot } from "./contracts/experience-models";

export function resolveCanonicalExperience(
  view: JornadaDoPacienteView | null,
): CanonicalExperienceSnapshot {
  const landing = mapLandingExperienceModel();

  return {
    landing,
    onboarding: view ? mapOnboardingExperienceModel(view) : null,
    minhaJornada: view ? mapMinhaJornadaExperienceModel(view) : null,
    ace: view ? mapAceExperienceModel(view) : null,
    curadoria: view ? mapCuradoriaExperienceModel(view) : null,
    entrega: view ? mapEntregaExperienceModel(view) : null,
    escolha: view ? mapEscolhaExperienceModel(view) : null,
    acompanhamento: view ? mapAcompanhamentoExperienceModel(view) : null,
    documentos: view ? mapDocumentosExperienceModel(view) : null,
  };
}

export type PortalSurface =
  | "landing"
  | "onboarding"
  | "documentos"
  | "minha-jornada"
  | "curadoria"
  | "entrega"
  | "escolha"
  | "acompanhamento";

export function resolvePortalSurface(view: JornadaDoPacienteView | null): PortalSurface {
  if (!view) {
    return "landing";
  }

  const flow = resolverExperienceFlow(view);
  const experience = resolveCanonicalExperience(view);

  if (experience.onboarding) {
    return "onboarding";
  }

  if (experience.documentos && view.estado_visivel === "AGUARDANDO_DOCUMENTOS") {
    return "documentos";
  }

  if (experience.curadoria) {
    return "curadoria";
  }

  if (experience.escolha) {
    return "escolha";
  }

  if (experience.entrega && view.etapa_atual === "ENTREGA") {
    return "entrega";
  }

  if (experience.acompanhamento) {
    return "acompanhamento";
  }

  if (flow.journey?.ativo) {
    return "minha-jornada";
  }

  return "minha-jornada";
}

export type CanonicalRoute = "/" | "/onboarding" | "/minha-jornada";

export function resolveCanonicalRoute(view: JornadaDoPacienteView | null): CanonicalRoute {
  if (!view) {
    return "/";
  }

  const flow = resolverExperienceFlow(view);
  if (flow.onboarding?.ativo) {
    return "/onboarding";
  }

  return "/minha-jornada";
}
