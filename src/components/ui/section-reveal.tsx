"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/components/ui/cn";

// Primitivo genérico de entrada — movido de components/landing/ (PRODUTO
// DO PACIENTE, Fase 2): usa só IntersectionObserver + uma classe CSS
// global (@keyframes fade-up, globals.css, não específica da Landing),
// nenhuma configuração narrativa ou motor da Landing. Consumido pela
// Landing e pelo wizard "Sua História" — nenhum dos dois importa o outro
// por causa deste primitivo compartilhado.
type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  /** Atraso do fade-up, em ms — permite escalonar cards vizinhos (cada um
   *  com seu próprio SectionReveal/observer) em vez de todos entrarem
   *  juntos. Omitido = sem atraso. */
  delayMs?: number;
};

// Entrada suave ao rolar até o elemento, uma única vez — CSS puro
// (@keyframes fade-up, globals.css) + IntersectionObserver simples, sem
// biblioteca. prefers-reduced-motion já é forçado globalmente em
// globals.css (duração ~0), então este componente nunca precisa checar a
// preferência por conta própria.
//
// Estado de repouso é SEMPRE visível (nenhuma classe de opacidade por
// padrão) — só ganha a classe de animação (que começa em opacity:0 e
// termina em opacity:1 via @keyframes) quando o observer confirma que o
// elemento entrou na viewport. Se o JS falhar por qualquer motivo
// (hidratação, observer indisponível), o conteúdo nunca fica preso
// invisível — CTAs e texto continuam sempre acessíveis.
export function SectionReveal({
  children,
  className,
  delayMs,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(animate && "animate-fade-up", className)}
      style={
        animate && delayMs ? { animationDelay: `${delayMs}ms` } : undefined
      }
    >
      {children}
    </div>
  );
}
