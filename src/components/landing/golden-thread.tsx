"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";

type GoldenThreadProps = {
  /** Path SVG (coordenadas do viewBox) — único por seção, sempre uma
   *  curva orgânica, nunca reta. Ver README de uso em cada seção que
   *  consome este componente para o ponto de entrada/saída combinado
   *  entre segmentos vizinhos (continuidade visual). */
  d: string;
  viewBox?: string;
  className?: string;
  /** Ativa um brilho sutil (drop-shadow) no ponto médio do traçado —
   *  reservado para poucos momentos de destaque (ex.: perto do CTA
   *  principal), nunca em toda seção. */
  glow?: boolean;
};

// Segmento do "fio de ouro" orgânico que atravessa a Landing — um SVG por
// seção (não um único path page-inteira: o fundo opaco de cada seção
// ocultaria o traço nas emendas, e a altura total mudaria a cada edição
// de conteúdo). O dashoffset é conduzido por ScrollTrigger (scrub) em vez
// da técnica de reveal único do GoldCornerAccent — o traço "se desenha"
// continuamente enquanto a seção rola, e cada segmento entra/sai em
// pontos de borda consistentes para parecer um fio contínuo.
export function GoldenThread({ d, viewBox = "0 0 400 800", className, glow = false }: GoldenThreadProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduceMotion);
    if (reduceMotion) return;

    const section = svgRef.current?.closest("section, div[data-thread-scope]");
    if (!section || !pathRef.current) return;

    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });

        if (glow) {
          gsap.fromTo(
            pathRef.current,
            { filter: "drop-shadow(0 0 0px rgba(176,141,87,0))" },
            {
              filter: "drop-shadow(0 0 6px rgba(176,141,87,0.55))",
              ease: "sine.inOut",
              scrollTrigger: {
                trigger: section,
                start: "top 40%",
                end: "bottom 60%",
                scrub: 1,
              },
            },
          );
        }
      }, section as Element);
    })();

    return () => ctx?.revert();
  }, [glow]);

  return (
    <svg
      ref={svgRef}
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
        pathLength={1}
        className="golden-thread-path"
        style={reduced ? { strokeDashoffset: 0 } : undefined}
      />
    </svg>
  );
}
