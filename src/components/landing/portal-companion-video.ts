import { VIDEO_EXIT_AT_FRAME } from "@/components/landing/portal-frames";

// Motor de Vídeo Companheiro (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md
// §2, motor 5).
//
// Achado arquitetural real, registrado aqui e não corrigido: a saída do
// vídeo, na implementação real, nunca é calculada a partir do Progresso
// Bruto (`overall`) — é inteiramente conduzida por um `ScrollTrigger` do
// GSAP, em portal-experience.tsx, que tem seu próprio listener de scroll
// e seu próprio motor de interpolação internos, nunca expostos ao nosso
// código. Não existe, portanto, uma função real "progresso → estado do
// vídeo" para extrair — o que existe de fato, e é isso que este módulo
// contém, é (a) a configuração dos dois passos do tween de saída, hoje
// soltos inline, e (b) duas derivações puras e triviais a partir de
// `VIDEO_EXIT_AT_FRAME` e do índice discreto de parada ativa. Isso já é
// uma divergência entre a arquitetura-alvo (um único relógio para todos
// os motores contínuos) e o comportamento real — pré-existente a esta
// etapa, não introduzida por ela.
//
// Nenhuma das duas funções acessa DOM, refs, `HTMLVideoElement` ou o
// elemento GSAP em si — a composição continua sendo quem monta o
// ScrollTrigger de verdade, usando estes valores como dado.

export type CompanionVideoTweenStep = {
  opacity: number;
  scale?: number;
  filter?: string;
  ease: string;
  duration: number;
};

// Mesmos dois passos, mesmos valores, só nomeados e centralizados —
// hoje o único lugar que descreve como o vídeo se despede.
export const COMPANION_VIDEO_EXIT_TIMELINE: readonly CompanionVideoTweenStep[] =
  [
    { opacity: 0.8, ease: "none", duration: 1 },
    { opacity: 0, scale: 0.93, filter: "blur(6px)", ease: "none", duration: 1 },
  ];

export type CompanionVideoExitFrameRange = {
  /** Índice do elemento-sentinela onde a saída começa (equivalente a
   *  `VIDEO_EXIT_AT_FRAME - 1`). */
  startFrameIndex: number;
  /** Índice do elemento-sentinela onde a saída termina (equivalente a
   *  `VIDEO_EXIT_AT_FRAME`). */
  endFrameIndex: number;
};

// Torna explícito e testável o acoplamento leve já conhecido entre o
// vídeo e a configuração narrativa (VIDEO_EXIT_AT_FRAME, definido em
// portal-frames.tsx) — não o amplia, não o remove.
export function getCompanionVideoExitFrameRange(): CompanionVideoExitFrameRange {
  return {
    startFrameIndex: VIDEO_EXIT_AT_FRAME - 1,
    endFrameIndex: VIDEO_EXIT_AT_FRAME,
  };
}

// Mecanismo discreto e independente do GSAP: só controla `pointerEvents`
// do vídeo (nunca opacidade/escala), a partir do mesmo índice de parada
// ativa que já governa a Hero e o crossfade de conteúdo (Etapa 2,
// mecanismo "discreto" — deliberadamente não substituído pelo contínuo).
export function isCompanionVideoExiting(activeFrameIndex: number): boolean {
  return activeFrameIndex >= VIDEO_EXIT_AT_FRAME;
}
