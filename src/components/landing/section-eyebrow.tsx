import { cn } from "@/components/ui/cn";

type SectionEyebrowProps = {
  children: string;
  className?: string;
  align?: "center" | "left";
  /** "light" (padrão): seção de fundo claro, texto em sage escuro.
   *  "dark": seção de fundo escuro, texto em sage-light — mesmo contraste
   *  já validado no Hero contra o gradiente escuro. */
  tone?: "light" | "dark";
};

// Rótulo editorial (versalete, tracking largo) + um único marcador dourado
// mínimo — sem pílula, borda ou fundo (Capítulo 2, Direção de Arte: o selo
// preenchido lia como badge de interface, não como "acabamento editorial").
// O dourado aqui é o ponto de 1,5px, nunca uma área.
export function SectionEyebrow({ children, className, align = "center", tone = "light" }: SectionEyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]",
        tone === "light" ? "text-brand-primary-deep" : "text-surface",
        align === "left" && "lg:justify-start",
        className,
      )}
    >
      <span aria-hidden="true" className="gold-rule size-1.5 shrink-0 rounded-full bg-brand-gold" />
      {children}
    </span>
  );
}
