import type { JornadaDoPacienteView } from "./contracts/jornada-view";
import { resolverAceFlow } from "./flows/ace-flow";
import { resolverCuradoriaFlow } from "./flows/curadoria-flow";
import { resolverEntregaFlow } from "./flows/entrega-flow";
import { resolverJourneyFlow } from "./flows/journey-flow";
import { resolverLandingFlow } from "./flows/landing-flow";
import { resolverOnboardingFlow } from "./flows/onboarding-flow";
import { resolverRelacionamentoFlow } from "./flows/relacionamento-flow";

export interface ExperienceFlowSnapshot {
  sem_jornada: boolean;
  landing: ReturnType<typeof resolverLandingFlow>;
  onboarding: ReturnType<typeof resolverOnboardingFlow> | null;
  journey: ReturnType<typeof resolverJourneyFlow> | null;
  ace: ReturnType<typeof resolverAceFlow> | null;
  curadoria: ReturnType<typeof resolverCuradoriaFlow> | null;
  entrega: ReturnType<typeof resolverEntregaFlow> | null;
  relacionamento: ReturnType<typeof resolverRelacionamentoFlow> | null;
}

/**
 * Resolve todos os Flow Models a partir da view pública.
 * Sem jornada → apenas LandingFlow ativo.
 */
export function resolverExperienceFlow(
  view: JornadaDoPacienteView | null,
): ExperienceFlowSnapshot {
  if (!view) {
    return {
      sem_jornada: true,
      landing: resolverLandingFlow(),
      onboarding: null,
      journey: null,
      ace: null,
      curadoria: null,
      entrega: null,
      relacionamento: null,
    };
  }

  return {
    sem_jornada: false,
    landing: { ...resolverLandingFlow(), ativo: false },
    onboarding: resolverOnboardingFlow(view),
    journey: resolverJourneyFlow(view),
    ace: resolverAceFlow(view),
    curadoria: resolverCuradoriaFlow(view),
    entrega: resolverEntregaFlow(view),
    relacionamento: resolverRelacionamentoFlow(view),
  };
}

export * from "./contracts/jornada-view";
export * from "./contracts/navigation";
export * from "./contracts/state-machine";
export * from "./navigation-graph";
export * from "./state-machine";
export * from "./flows/landing-flow";
export * from "./flows/onboarding-flow";
export * from "./flows/journey-flow";
export * from "./flows/ace-flow";
export * from "./flows/curadoria-flow";
export * from "./flows/entrega-flow";
export * from "./flows/relacionamento-flow";
