import { FRAMES, type Frame } from "@/components/landing/portal-frames";

// Motor Narrativo (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2, motor 2)
// — traduz o progresso bruto (0 a 1, do Motor de Progresso Bruto) em qual
// parada narrativa está ativa e o quanto já se avançou em direção à
// próxima, respeitando paradas de platô (holdEntireSpan). Função pura:
// sem DOM, sem listener, sem requestAnimationFrame, sem leitura de
// viewport ou de preferência de movimento — só interpreta um número.
//
// Extraído de portal-experience.tsx (Playbook, Etapa 2) — mesma
// matemática exata (índice por FRAME_OFFSETS, fração local, platô),
// hoje usada apenas pelo laço ambiente (ainda inline, não extraído nesta
// etapa) para interpolar luz/calor/intensidade/compactação.
//
// Distinção deliberadamente preservada, não colapsada: este motor é o
// mecanismo CONTÍNUO (fração exata de scroll). O Portal também tem um
// mecanismo DISCRETO, independente (IntersectionObserver, threshold de
// visibilidade), que decide de fato qual conteúdo de parada fica visível
// e quando o Hero desaparece — esse mecanismo usa DOM e por isso nunca
// poderia viver aqui; ele continua em portal-experience.tsx,
// propositalmente não substituído por este motor nesta etapa (trocar o
// gatilho visual do Hero pelo `isHeroActive` contínuo abaixo mudaria o
// ponto exato de scroll em que ele desaparece — risco real, não assumido
// silenciosamente).

// Altura total do ambiente (soma de todas as paradas) — dado puro
// derivado de FRAMES, usado tanto para interpretar progresso (abaixo)
// quanto pela composição para o estilo de altura da seção.
export const TOTAL_HEIGHT_VH = FRAMES.reduce(
  (sum, frame) => sum + frame.heightVh,
  0,
);

// Fração acumulada (0 a 1) de onde cada parada começa.
export const FRAME_OFFSETS: number[] = (() => {
  const offsets: number[] = [0];
  let acc = 0;
  for (const f of FRAMES) {
    acc += f.heightVh;
    offsets.push(acc / TOTAL_HEIGHT_VH);
  }
  return offsets;
})();

export type NarrativeFrame = {
  /** Índice da parada de origem da transição atual (equivalente a "i0"). */
  fromIndex: number;
  /** Índice da parada de destino — igual a `fromIndex` durante um platô
   *  (holdEntireSpan), nunca ultrapassa a última parada. */
  toIndex: number;
  /** A própria parada de origem. */
  frame: Frame;
  /** A parada-alvo da interpolação — a mesma que `frame` durante um
   *  platô (equivalente a "b" no laço original). */
  targetFrame: Frame;
  /** Fração local (0 a 1) de avanço entre `frame` e `targetFrame` — 0
   *  durante um platô, mesmo que o progresso bruto continue variando
   *  (equivalente a "effectiveT"). */
  localProgress: number;
  /** Progresso bruto igual a 0 (ou abaixo, tratado com segurança). */
  isAtStart: boolean;
  /** Última parada alcançada e totalmente avançada. */
  isAtEnd: boolean;
  /** A parada de origem é a Chegada (Hero, índice 0). */
  isHeroActive: boolean;
  /** A Chegada é a origem, mas já há avanço em direção à próxima parada. */
  isLeavingHero: boolean;
};

// Mesma matemática do laço original, char por char — só relocada e
// protegida contra entrada fora de [0, 1] (o Motor de Progresso Bruto
// hoje sempre entrega um valor já contido nesse intervalo, mas esta
// função precisa ser segura sozinha para ser testável isoladamente).
export function computeNarrativeFrame(overall: number): NarrativeFrame {
  const clamped = Number.isFinite(overall)
    ? Math.min(Math.max(overall, 0), 1)
    : 0;

  let fromIndex = 0;
  while (
    fromIndex < FRAME_OFFSETS.length - 2 &&
    FRAME_OFFSETS[fromIndex + 1] <= clamped
  )
    fromIndex++;
  const toIndex = Math.min(fromIndex + 1, FRAMES.length - 1);
  const span = FRAME_OFFSETS[fromIndex + 1] - FRAME_OFFSETS[fromIndex] || 1;
  const localT = Math.min(
    Math.max((clamped - FRAME_OFFSETS[fromIndex]) / span, 0),
    1,
  );

  const frame = FRAMES[fromIndex];
  const holding = Boolean(frame.holdEntireSpan);
  const targetFrame = holding ? frame : FRAMES[toIndex];
  const localProgress = holding ? 0 : localT;

  return {
    fromIndex,
    toIndex,
    frame,
    targetFrame,
    localProgress,
    isAtStart: clamped <= 0,
    isAtEnd: toIndex === FRAMES.length - 1 && localProgress >= 1,
    isHeroActive: fromIndex === 0,
    isLeavingHero: fromIndex === 0 && localProgress > 0,
  };
}
