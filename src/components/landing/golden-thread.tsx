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

// Fio dourado — presença e continuidade, nunca progresso. O traçado fica
// sempre inteiramente visível (não "se desenha" conforme o scroll — isso
// seria lido como barra de progresso/timeline, proibido). O único
// movimento é ornamental: uma respiração muito lenta e de baixa amplitude
// (opacidade), independente da posição do scroll, mais o brilho
// percorrendo o traçado em loop (já existente) e, quando `glow` está
// ativo, uma intensidade de brilho reagindo à proximidade do scroll
// (não ao progresso total da página). Pausa fora da viewport.
export function GoldenThread({ d, viewBox = "0 0 400 800", className, glow = false }: GoldenThreadProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glintRef = useRef<SVGPathElement>(null);
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
        // Respiração — muito lenta, baixíssima amplitude, independente do
        // scroll: existe para o fio nunca parecer congelado, nunca para
        // indicar avanço. Pausa/retoma conforme a seção entra/sai de
        // vista (mesma disciplina de performance já usada no glint).
        const breatheTween = gsap.to(pathRef.current, {
          opacity: 0.75,
          duration: 5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
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

        // Brilho discreto percorrendo o traçado — um segmento curto (8%
        // do comprimento) deslizando em loop lento (7s), nunca "elétrico"
        // ou piscante. Só roda enquanto a seção está visível (pausa fora
        // de tela, sem gastar ciclo à toa).
        let glintTween: gsap.core.Tween | undefined;
        if (glintRef.current) {
          glintTween = gsap.fromTo(
            glintRef.current,
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 7, ease: "none", repeat: -1 },
          );
          glintTween.pause();
        }

        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => {
            glintTween?.play();
            breatheTween.play();
          },
          onEnterBack: () => {
            glintTween?.play();
            breatheTween.play();
          },
          onLeave: () => {
            glintTween?.pause();
            breatheTween.pause();
          },
          onLeaveBack: () => {
            glintTween?.pause();
            breatheTween.pause();
          },
        });
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
        className="golden-thread-path"
      />
      {!reduced && (
        <path
          ref={glintRef}
          aria-hidden="true"
          d={d}
          fill="none"
          stroke="color-mix(in srgb, var(--color-brand-gold) 45%, white)"
          strokeWidth="1.5"
          strokeLinecap="round"
          pathLength={1}
          className="golden-thread-glint"
        />
      )}
    </svg>
  );
}
