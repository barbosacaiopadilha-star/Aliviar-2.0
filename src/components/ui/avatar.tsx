import { cn } from "@/components/ui/cn";

type AvatarProps = {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

/**
 * As iniciais de um nome — só letras.
 *
 * Pegava a primeira letra da primeira e da última palavra, sem olhar o que era:
 * "Paciente de Validação (sintético)" virava `P(`, com um parêntese ocupando o
 * lugar de uma inicial. Qualquer nome com sufixo entre parênteses, aspas ou
 * travessão caía nisso. Agora só entram pedaços que começam por letra, e o
 * tratamento ("Dra.") é descartado — ele não é nome.
 *
 * Exportada porque havia quatro cópias desta mesma conta no projeto, cada uma
 * com um erro diferente.
 */
export function getInitials(name: string): string {
  const parts = name
    .trim()
    .replace(/^(Dra?\.|Sra?\.)\s*/iu, "")
    .split(/\s+/)
    .filter((part) => /^\p{L}/u.test(part));
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export function Avatar({ name, className, size = "md" }: AvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-brand-sage-light)_50%,transparent)] font-medium text-ink",
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
