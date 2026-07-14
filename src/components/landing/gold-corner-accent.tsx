"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";

type GoldCornerAccentProps = {
  className?: string;
};

// Arco dourado fino no canto — o mesmo traço decorativo que emoldura a
// foto no material de referência da Aliviar Conecta (documentos +
// profissionais). Puramente ornamental, absolute + pointer-events-none,
// nunca interfere no conteúdo ou na leitura por teclado. `pathLength={1}`
// permite animar o traçado como "desenho progressivo" (stroke-dashoffset
// 1 → 0) assim que entra na viewport, em vez de só aparecer.
export function GoldCornerAccent({ className }: GoldCornerAccentProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <svg ref={ref} aria-hidden="true" viewBox="0 0 120 120" className={cn("pointer-events-none absolute", className)}>
      <path
        d="M28 2 C 82 2, 118 38, 118 94"
        fill="none"
        stroke="var(--color-brand-gold)"
        strokeWidth="1.5"
        pathLength={1}
        className={cn("gold-arc-path", drawn && "gold-arc-path-drawn")}
      />
    </svg>
  );
}
