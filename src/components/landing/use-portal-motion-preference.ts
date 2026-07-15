"use client";

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Motor de Preferências de Movimento
// (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2, motor 8) — única
// autoridade do Portal para saber se o visitante prefere movimento
// reduzido. Não conhece seções, Portal, vídeo ou FAQ; só expõe o estado
// necessário para quem consome.
//
// Extraído de portal-experience.tsx (Playbook, Etapa 1), consolidando três
// leituras independentes de `matchMedia` num único ponto — sem mudança de
// comportamento observável, já que as três liam exatamente o mesmo valor
// síncrono.
//
// `ready` existe pelo mesmo motivo de sempre: a preferência só pode ser
// lida no cliente, então a primeira renderização (servidor e hidratação)
// nunca pode presumir "reduzido" — o consumidor só decide a ramificação
// definitiva depois que `ready` for true.
//
// Preserva o comportamento atual: a preferência é lida uma única vez, na
// montagem — mudanças de preferência feitas pelo sistema operacional
// durante a sessão não são refletidas (não há listener de `change` na
// media query). Isso diverge do comportamento-alvo descrito em
// docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md (seção 5, "Ao reduzir
// movimento") — registrado aqui como divergência conhecida, não corrigida
// nesta etapa (docs/LANDING_IMPLEMENTATION_PLAYBOOK.md, Etapa 1: "primeiro
// preserve, depois evolui em etapa própria").
export function usePortalMotionPreference(): {
  prefersReducedMotion: boolean;
  ready: boolean;
} {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia(REDUCED_MOTION_QUERY).matches);
    setReady(true);
  }, []);

  return { prefersReducedMotion, ready };
}
