import type { NarrativeFrame } from "@/components/landing/portal-narrative";

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

// Inércia (nada reage instantaneamente) com constantes diferentes por
// canal — nunca sincronizados entre si, para nunca "denunciar" um efeito.
const DAMPING = {
  light: 0.045,
  intensidade: 0.035,
  warmth: 0.02,
  compact: 0.08,
};

export type EnvironmentState = {
  lightX: number;
  lightY: number;
  intensidade: number;
  warmth: number;
  compact: number;
};

export type EnvironmentEngine = {
  step(narrative: NarrativeFrame): EnvironmentState;
};

// Motor de Ambiente (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2,
// motor 3) — traduz o estado narrativo (Motor Narrativo) em parâmetros
// atmosféricos contínuos (luz, temperatura, intensidade de presença,
// compactação), cada canal perseguindo o alvo da parada corrente com sua
// própria inércia. Não desenha nada, não escreve estilo, não acessa DOM
// nem conhece React — só calcula um pequeno estado numérico.
//
// Extraído de portal-experience.tsx (Playbook, Etapa 3) — mesma
// matemática exata (lerp por canal + amortecimento independente), só
// relocada. Deliberadamente stateful: a suavização não existe sem
// memória do valor anterior (era assim antes, num objeto mutável em
// `useRef`) — por isso é uma fábrica com estado interno
// (`createEnvironmentEngine`), não uma função pura sem memória. O
// contrato de cada passo, porém, recebe só um `NarrativeFrame`.
//
// Deliberadamente fora deste motor: a respiração (`breath`, oscilação de
// tempo) e a "presença" da Transição de Saída (`handoff`) — nenhuma das
// duas deriva de NarrativeFrame, e a segunda pertence a um motor futuro
// ainda não extraído (Transição de Saída, fora de escopo desta etapa).
// Continuam calculadas em portal-experience.tsx, exatamente como antes,
// e só se combinam com o estado daqui no momento de escrever estilo —
// nunca dentro deste módulo.
export function createEnvironmentEngine(
  initial: EnvironmentState,
): EnvironmentEngine {
  const state: EnvironmentState = { ...initial };

  return {
    step(narrative) {
      const { frame: a, targetFrame: b, localProgress: t } = narrative;

      const targetLightX = lerp(a.lightX, b.lightX, t);
      const targetLightY = lerp(a.lightY, b.lightY, t);
      const targetIntensidade = lerp(a.intensidade, b.intensidade, t);
      const targetWarmth = lerp(a.warmth, b.warmth, t);
      const targetCompact = lerp(a.compact, b.compact, t);

      state.lightX += (targetLightX - state.lightX) * DAMPING.light;
      state.lightY += (targetLightY - state.lightY) * DAMPING.light;
      state.intensidade +=
        (targetIntensidade - state.intensidade) * DAMPING.intensidade;
      state.warmth += (targetWarmth - state.warmth) * DAMPING.warmth;
      state.compact += (targetCompact - state.compact) * DAMPING.compact;

      return state;
    },
  };
}
