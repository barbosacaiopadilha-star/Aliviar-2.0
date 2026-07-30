"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Revelação por luz: o conteúdo de cada ambiente aparece conforme o
 * visitante caminha até ele. O estado oculto só é ativado depois da
 * hidratação (data-reveal-ready no wrapper) — sem JavaScript ou com
 * prefers-reduced-motion, tudo permanece visível desde o primeiro paint.
 */
export function RevealGroup({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>(".landing-reveal"));
    if (targets.length === 0) return;

    // Quem já está no campo de visão nunca é ocultado — evita qualquer
    // piscada no primeiro paint após a hidratação.
    const viewportHeight = window.innerHeight;
    const pending: HTMLElement[] = [];
    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (rect.top < viewportHeight * 0.92 && rect.bottom > 0) {
        target.setAttribute("data-inview", "true");
      } else {
        pending.push(target);
      }
    }

    root.setAttribute("data-reveal-ready", "true");
    if (pending.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-inview", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );

    for (const target of pending) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
