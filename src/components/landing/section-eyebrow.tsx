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

// Selo dourado (borda + fundo translúcido) + rótulo — "acabamento"
// consistente repetido no início de cada seção da Landing, com presença
// de dourado bem mais forte do que um simples traço fino.
export function SectionEyebrow({ children, className, align = "center", tone = "light" }: SectionEyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand-gold bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]",
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
