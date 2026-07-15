import { PORTAL_SCENE_POSITIONS } from "@/components/landing/portal-scenes";

// Motor de Fotografia (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2,
// motor 4) — traduz o progresso bruto (0 a 1, do Motor de Progresso
// Bruto) em qual das direções de fotografia está em primeiro plano, qual
// está entrando, e a fração local do crossfade entre as duas. Função
// pura, sem memória: diferente do Motor de Ambiente, não existe
// suavização/damping aplicado à fotografia em si — o crossfade já é
// inteiramente determinado pela posição, recalculado do zero a cada
// quadro. Não desenha nada, não escreve estilo, não acessa DOM/refs, não
// conhece React, e não depende do Motor Narrativo nem do Motor de
// Ambiente — só de `PORTAL_SCENE_POSITIONS` (portal-scenes.ts, config
// pura já separada por decisão anterior, reaproveitada aqui sem
// duplicar).
//
// Extraído de portal-experience.tsx (Playbook, Etapa 4) — mesma
// matemática exata (índice por PORTAL_SCENE_POSITIONS, fração local,
// mesma ordem de operações, mesmo `|| 1`), com uma mudança de origem
// registrada abaixo, não de comportamento.
//
// Achado corrigido na extração (fronteira DOM → parâmetro): o código
// original limitava o índice de destino por `sceneRefs.current.length`
// — uma leitura de ref, proibida a este motor. Essa contagem é uma
// segmentação FÍSICA real (quantas fotografias existem de fato — pode
// ser menor que as 6 posições configuradas, ex.: nem todo asset
// existindo em disco), nunca uma decisão narrativa, então continua
// pertencendo a este motor — só que agora como parâmetro explícito
// (`scenesCount`), preenchido pela composição a partir de `scenes.length`
// (a prop já resolvida em disco), nunca de `sceneRefs.current.length`
// diretamente. `scenes.length` e `sceneRefs.current.length` são, por
// construção, sempre o mesmo número (um ref por item renderizado) — o
// valor final não muda, só a fonte deixa de ser uma leitura de DOM.
export type PhotographyFrame = {
  /** Índice da direção de fotografia em primeiro plano (equivalente a
   *  "s0"). */
  fromIndex: number;
  /** Índice da direção de fotografia entrando — igual a `fromIndex`
   *  quando `scenesCount <= 1`, nunca ultrapassa a última cena
   *  disponível (equivalente a "s1"). */
  toIndex: number;
  /** Fração local (0 a 1) do crossfade entre as duas direções
   *  (equivalente a "sceneT"). */
  localProgress: number;
};

export function computePhotographyFrame(
  overall: number,
  scenesCount: number,
): PhotographyFrame {
  const clamped = Number.isFinite(overall)
    ? Math.min(Math.max(overall, 0), 1)
    : 0;

  if (scenesCount <= 0) {
    return { fromIndex: 0, toIndex: 0, localProgress: 0 };
  }

  let s0 = 0;
  while (
    s0 < PORTAL_SCENE_POSITIONS.length - 2 &&
    PORTAL_SCENE_POSITIONS[s0 + 1] <= clamped
  )
    s0++;
  const s1 = Math.min(s0 + 1, scenesCount - 1);
  const span = PORTAL_SCENE_POSITIONS[s1] - PORTAL_SCENE_POSITIONS[s0] || 1;
  const localProgress = Math.min(
    Math.max((clamped - PORTAL_SCENE_POSITIONS[s0]) / span, 0),
    1,
  );

  return { fromIndex: s0, toIndex: s1, localProgress };
}
