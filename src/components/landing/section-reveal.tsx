"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
};

// Entrada suave ao rolar até o elemento, uma única vez — CSS puro
// (@keyframes fade-up, globals.css) + IntersectionObserver simples, sem
// biblioteca. prefers-reduced-motion já é forçado globalmente em
// globals.css (duração ~0), então este componente nunca precisa checar a
// preferência por conta própria.
export function SectionReveal({ children, className }: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(visible ? "animate-fade-up" : "opacity-0", className)}>
      {children}
    </div>
  );
}
