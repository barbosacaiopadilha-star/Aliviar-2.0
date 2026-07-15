import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

// Primitivo genérico de layout — movido de components/landing/ (PRODUTO DO
// PACIENTE, Fase 2): nunca teve semântica ou dependência específica da
// Landing (só padding responsivo + container centralizado), mas vivia lá
// por ter nascido junto com ela. Consumido pela Landing e pelo wizard
// "Sua História" — nenhum dos dois importa o outro por causa deste
// primitivo compartilhado.
type SectionContainerProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function SectionContainer({
  children,
  className,
  ...props
}: SectionContainerProps) {
  return (
    <section
      className={cn("px-4 py-12 lg:px-8 lg:py-20", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-content">{children}</div>
    </section>
  );
}
