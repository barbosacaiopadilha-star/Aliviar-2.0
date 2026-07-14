import { cn } from "@/components/ui/cn";

type GoldCornerAccentProps = {
  className?: string;
};

// Arco dourado fino no canto — o mesmo traço decorativo que emoldura a
// foto no material de referência da Aliviar Conecta (documentos +
// profissionais). Puramente ornamental, absolute + pointer-events-none,
// nunca interfere no conteúdo ou na leitura por teclado.
export function GoldCornerAccent({ className }: GoldCornerAccentProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className={cn("pointer-events-none absolute", className)}>
      <path d="M28 2 C 82 2, 118 38, 118 94" fill="none" stroke="var(--color-brand-gold)" strokeWidth="1.5" />
    </svg>
  );
}
