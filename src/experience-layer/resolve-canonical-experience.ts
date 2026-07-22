import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { resolverExperienceFlow } from "@/experience-flow";
import { mapAceExperienceModel } from "./mappers/ace";
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
  };
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
