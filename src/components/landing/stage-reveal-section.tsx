"use client";

import { useEffect, useRef, useState } from "react";

// Seção fixada durante a rolagem: um texto grande de duas linhas (fundo
// claro, tom suave — como visto na gravação real do site de referência
// em mobile, nunca um bloco escuro) troca de etapa conforme o progresso,
// com uma linha vertical + marcador indicando onde você está.
const STAGES: Array<[string, string]> = [
  ["Sua", "História"],
  ["Curadoria", "Criteriosa"],
  ["Conversa", "Acompanhada"],
  ["Cuidado", "Contínuo"],
];

export function StageRevealSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const progressRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(reduceMotion);
    setReady(true);
    if (reduceMotion) return;

    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.set(
          textRefs.current.filter((_, i) => i > 0),
          { opacity: 0 },
        );

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${STAGES.length * 100}%`,
            scrub: 1,
            pin: true,
          },
        });

        STAGES.forEach((_, index) => {
          if (index > 0) {
            timeline.to(textRefs.current[index - 1], { opacity: 0, duration: 0.3 }, index);
            timeline.to(textRefs.current[index], { opacity: 1, duration: 0.3 }, index);
          }
          timeline.to(
            progressRef.current,
            { height: `${((index + 1) / STAGES.length) * 100}%`, duration: 0.3 },
            index,
          );
          timeline.to(dotRef.current, { top: `${((index + 1) / STAGES.length) * 100}%`, duration: 0.3 }, index);
        });
      }, sectionRef);
    })();

    return () => ctx?.revert();
  }, []);

  if (ready && reduced) {
    return (
      <section className="bg-canvas px-4 py-16 lg:px-8">
        <div className="mx-auto flex max-w-content flex-col gap-8 sm:flex-row sm:flex-wrap sm:justify-between">
          {STAGES.map(([line1, line2]) => (
            <div key={line1 + line2} className="text-center">
              <p className="font-serif text-2xl font-medium leading-tight text-ink-muted">
                {line1}
                <br />
                {line2}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div ref={sectionRef} className="relative bg-canvas">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 lg:px-8">
        <div className="grid">
          {STAGES.map(([line1, line2], index) => (
            <div
              key={line1 + line2}
              ref={(el) => {
                textRefs.current[index] = el;
              }}
              className="col-start-1 row-start-1 text-center"
            >
              <p className="font-serif text-4xl font-medium leading-tight text-ink-muted/70 lg:text-6xl">
                {line1}
                <br />
                {line2}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-10 flex h-40 w-px flex-col items-center bg-border">
          <div ref={progressRef} className="w-px bg-brand-sage" style={{ height: "0%" }} />
          <div
            ref={dotRef}
            className="absolute left-1/2 size-3 -translate-x-1/2 rounded-full bg-brand-sage shadow-[0_0_0_4px_rgba(127,158,140,0.2)]"
            style={{ top: "0%" }}
          />
        </div>
      </div>
    </div>
  );
}
