"use client";

import { useEffect, useRef } from "react";

/**
 * O FIO DE CUIDADO (Dossiê da Landing Responsiva, 23/08).
 *
 * A linha de luz champagne do Edifício sai das fotografias e vira a
 * costura entre os ambientes — separada da imagem, em SVG, para nunca
 * depender do que a cena mostra. A gramática é narrativa:
 *
 *   - `ramifica` (Recepção → Curadoria): os muitos caminhos possíveis se
 *     organizam em três;
 *   - `tres` (Curadoria → Escolha): exatamente três, lado a lado;
 *   - `converge` (Escolha → Concierge): os três se unem em um só — a
 *     decisão tomada, e a Aliviar seguindo junto.
 *
 * Cada passagem tem um "nó de cuidado": ponto dourado com halo sálvia.
 * A linha se desenha por `stroke-dashoffset` quando entra na tela, uma vez
 * só, sem loop e sem prender a rolagem. Com `prefers-reduced-motion`, ela
 * já nasce desenhada.
 */
type Forma = "ramifica" | "tres" | "converge";

const CAMINHOS: Record<Forma, string[]> = {
  // Muitos fios entrando, três saindo.
  ramifica: [
    "M 12 0 C 12 26, 30 34, 30 72",
    "M 38 0 C 38 24, 30 30, 30 72",
    "M 62 0 C 62 24, 70 30, 70 72",
    "M 88 0 C 88 26, 70 34, 70 72",
    "M 50 0 L 50 72",
  ],
  // Os três caminhos, paralelos e iguais — nenhum em destaque.
  tres: ["M 30 0 L 30 72", "M 50 0 L 50 72", "M 70 0 L 70 72"],
  // Três viram um.
  converge: ["M 30 0 C 30 40, 50 40, 50 72", "M 50 0 L 50 72", "M 70 0 C 70 40, 50 40, 50 72"],
};

/** Onde ficam os nós de cuidado em cada forma (x, y no viewBox 100×72). */
const NOS: Record<Forma, [number, number][]> = {
  ramifica: [
    [30, 72],
    [50, 72],
    [70, 72],
  ],
  tres: [
    [30, 36],
    [50, 36],
    [70, 36],
  ],
  converge: [[50, 72]],
};

export function FioDeCuidado({ forma }: { forma: Forma }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;

    // Sem observador (navegador antigo, ambiente de teste) ou com menos
    // movimento pedido, o fio já nasce desenhado: a informação é a mesma.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      svg.dataset.desenhado = "sim";
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          svg.dataset.desenhado = "sim";
          observador.disconnect();
        }
      },
      { rootMargin: "-10% 0px -20% 0px", threshold: 0 },
    );

    observador.observe(svg);
    return () => observador.disconnect();
  }, []);

  return (
    <div className="landing-fio" aria-hidden="true">
      <svg
        ref={ref}
        className="landing-fio-svg"
        viewBox="0 0 100 72"
        preserveAspectRatio="none"
        focusable="false"
      >
        {CAMINHOS[forma].map((d, i) => (
          <path key={d} d={d} className="landing-fio-linha" style={{ transitionDelay: `${i * 60}ms` }} />
        ))}
        {NOS[forma].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="3.2" className="landing-fio-halo" />
            <circle cx={x} cy={y} r="1.4" className="landing-fio-no" />
          </g>
        ))}
      </svg>
    </div>
  );
}
