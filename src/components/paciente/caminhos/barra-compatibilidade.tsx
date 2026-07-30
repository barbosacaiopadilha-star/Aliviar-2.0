import {
  COMPATIBILITY_FILL,
  COMPATIBILITY_LABELS,
  type PatientDimension,
} from "@/modules/paciente/experiencia";
import { cn } from "@/components/ui/cn";

/**
 * Barra de compatibilidade — representação visual, jamais medida.
 *
 * Dez traços em degraus fixos por estado, nunca uma barra contínua: contínuo
 * convidaria a comparar comprimento como quem compara nota, e aqui não
 * existe nota. Nenhum percentual, nenhum número — o estado vem por extenso ao
 * lado, e é ele que informa.
 *
 * "Ainda precisamos confirmar" não preenche nada e recebe tratamento próprio:
 * vazio por falta de informação nunca deve parecer vazio por demérito. A
 * distinção é dita em texto, não só em cor (a cor é reforço).
 */
export function BarraCompatibilidade({
  dimension,
  compact = false,
}: {
  dimension: PatientDimension;
  /** Na comparação lado a lado, o rótulo já vem do cabeçalho da dimensão. */
  compact?: boolean;
}) {
  const preenchidos = COMPATIBILITY_FILL[dimension.level];
  const aConfirmar = dimension.level === "A_CONFIRMAR";

  return (
    <div className={cn("flex flex-col gap-1.5", compact ? "" : "sm:flex-row sm:items-center sm:gap-4")}>
      {compact ? null : (
        <span className="w-40 shrink-0 text-sm text-[var(--patient-ink)]">{dimension.label}</span>
      )}

      <div className="flex items-center gap-3">
        <span className="flex gap-[3px]" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-2.5 w-1.5 rounded-[2px] transition-colors duration-500 ease-standard",
                index < preenchidos ? "bg-[var(--patient-forest)]" : "bg-[rgb(26_46_38_/_0.10)]",
                aConfirmar && "bg-[rgb(138_115_85_/_0.22)]",
              )}
            />
          ))}
        </span>

        {/* O estado por extenso: quem não distingue a cor nem conta traços
            recebe a informação inteira. */}
        <span
          className={cn(
            "text-xs leading-tight",
            aConfirmar ? "text-[var(--color-brand-gold)]" : "text-[var(--color-ink-muted)]",
          )}
        >
          {COMPATIBILITY_LABELS[dimension.level]}
        </span>
      </div>

      <span className="sr-only">
        {dimension.label}: {COMPATIBILITY_LABELS[dimension.level]}.
      </span>
    </div>
  );
}
