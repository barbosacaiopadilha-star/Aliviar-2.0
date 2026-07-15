"use client";

import { useEffect, useRef, type RefObject } from "react";

// Motor de Progresso Bruto (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §2,
// motor 1) — mede só o deslocamento físico real do visitante dentro de uma
// região (o elemento observado), normalizado entre 0 e 1. Não decide frame
// ativo, texto, fotografia, vídeo, atmosfera ou cabeçalho — só reporta o
// valor bruto, a cada quadro, para quem o consome.
//
// Extraído de portal-experience.tsx (Playbook, Etapa 1) — mesmo cálculo
// (rect/scrollable/scrolled/overall), mesmo relógio único
// (requestAnimationFrame), mesma pausa fora da área visível
// (IntersectionObserver), mesmo desligamento simétrico. O valor é
// entregue por callback, nunca por estado React: é escrito a cada quadro,
// e virar estado geraria dezenas de renderizações por segundo
// (docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md §6).
//
// Não lê preferência de movimento reduzido — nunca decide sozinho se deve
// rodar; quem o consome decide, via `enabled` (docs/LANDING_IMPLEMENTATION_
// ARCHITECTURE.md §1: "o Motor de Vídeo nunca decide física ambiente; o
// Motor Ambiente nunca sabe que existe um vídeo" — mesmo princípio aplicado
// aqui entre Progresso Bruto e Preferências de Movimento).
export function usePortalRawProgress(
  sectionRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onFrame: (overall: number, now: number) => void,
): void {
  // Sempre a versão mais recente do callback, sem fazer dele uma
  // dependência do efeito — do contrário, uma nova identidade de função a
  // cada renderização do consumidor reiniciaria o laço inteiro (observer +
  // rAF), o que não acontece hoje e não deveria passar a acontecer.
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled) return;

    const activeRef = { current: true };
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    if (sectionRef.current) visibilityObserver.observe(sectionRef.current);

    let rafId = 0;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!activeRef.current || !sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const scrollable = Math.max(rect.height - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      const overall = scrolled / scrollable;

      onFrameRef.current(overall, now);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      visibilityObserver.disconnect();
    };
  }, [enabled, sectionRef]);
}
