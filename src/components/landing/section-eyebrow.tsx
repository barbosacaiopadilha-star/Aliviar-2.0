import { cn } from "@/components/ui/cn";

type SectionEyebrowProps = {
  children: string;
  className?: string;
  align?: "center" | "left";
  /** "light" (padrão): seção de fundo claro, texto em sage escuro.
   *  "dark": seção de fundo navy, texto em sage-light — mesmo contraste
   *  já validado no Hero contra o gradiente escuro. */
  tone?: "light" | "dark";
};

// Traço dourado fino + rótulo — "acabamento" consistente repetido no
// início de cada seção da Landing (Hero já usava esse padrão; agora
// compartilhado em vez de duplicado em cada arquivo).
export function SectionEyebrow({ children, className, align = "center", tone = "light" }: SectionEyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]",
        tone === "light" ? "text-brand-sage" : "text-brand-sage-light",
        align === "left" && "lg:justify-start",
        className,
      )}
    >
      <span aria-hidden="true" className="gold-rule h-px w-8 bg-brand-gold" />
      {children}
    </span>
  );
}
