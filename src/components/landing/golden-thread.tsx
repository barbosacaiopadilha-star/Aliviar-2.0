"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

import { cn } from "@/components/ui/cn";

export type GoldenThreadHandle = {
  /** Escreve a opacidade do traçado diretamente (0-1) — chamado pelo
   *  Motor da Caminhada do Portal a cada quadro, reaproveitando o mesmo
   *  valor de respiração já calculado ali (Capítulos 4/5, unificação do
   *  pulso). Nunca cria um relógio próprio. */
  setPulse: (opacity: number) => void;
};

type GoldenThreadProps = {
  /** Path SVG (coordenadas do viewBox) — único por seção, sempre uma
   *  curva orgânica, nunca reta. Ver README de uso em cada seção que
   *  consome este componente para o ponto de entrada/saída combinado
   *  entre segmentos vizinhos (continuidade visual). */
  d: string;
  viewBox?: string;
  className?: string;
};

// Fio dourado — presença e continuidade, nunca progresso, nunca uma
// segunda fonte de luz independente da cena (Capítulo 5, Princípio da
// Fonte Única). O traçado é sempre inteiramente visível por padrão
// (opacity: 1, .golden-thread-path em globals.css) — nunca "se desenha"
// conforme o scroll (leria como barra de progresso/timeline, proibido) e
// nunca respira em relógio próprio. Quem está vivo é o ambiente que o
// contém: dentro do Portal, o Motor da Caminhada chama `setPulse` a cada
// quadro, reaproveitando o mesmo valor de respiração já calculado para o
// resto do ambiente — o Fio reflete a luz da sala, nunca acende a
// própria. Fora do Portal (Biblioteca "assentamento", CTA "abertura",
// Rodapé "repouso"), ninguém chama `setPulse`, e o traço permanece
// estático — presença material, sem vida animada própria.
export const GoldenThread = forwardRef<GoldenThreadHandle, GoldenThreadProps>(function GoldenThread(
  { d, viewBox = "0 0 400 800", className },
  ref,
) {
  const pathRef = useRef<SVGPathElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      setPulse(opacity: number) {
        if (pathRef.current) pathRef.current.style.opacity = String(opacity);
      },
    }),
    [],
  );

  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute", className)}
    >
      <path
        ref={pathRef}
        d={d}
        fill="none"
        stroke="var(--color-brand-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="golden-thread-path"
      />
    </svg>
  );
});
