import {
  COMPATIBILITY_LABELS,
  type PatientDimension,
} from "@/modules/paciente/experiencia";
import { cn } from "@/components/ui/cn";

/**
 * Correspondência dita em frase, com textura de linha — jamais medida.
 *
 * A forma anterior (dez traços em degraus) ainda era quantidade aos olhos:
 * dez marcas contáveis com preenchimentos diferentes são magnitude, e
 * magnitude é nota. A gramática aprovada (Sistema Visual §11.3, Travessia
 * §9.3) codifica correspondência por NATUREZA, nunca por quantidade: o estado
 * vem por extenso, e sob a frase uma linha fina de textura própria —
 * contínua, tracejada ou pontilhada. Ninguém intui que tracejado "vale menos"
 * que contínuo, e ninguém totaliza tracejados.
 *
 * "Ainda não foi possível confirmar" é linha pontilhada — presente, com
 * outra textura: vazio por falta de informação nunca parece vazio por
 * demérito. "Não encontra este ponto" é dito apenas pela frase, sem linha e
 * sem cor de alerta: fato, não defeito — é disto que a frase de prontidão
 * ("escolho este, mesmo abrindo mão daquilo") se alimenta.
 */
const TEXTURA: Record<PatientDimension["level"], string> = {
  PLENO: "border-solid",
  PARCIAL: "border-dashed",
  A_CONFIRMAR: "border-dotted",
  NAO_ATENDE: "",
};

export function BarraCompatibilidade({
  dimension,
  compact = false,
}: {
  dimension: PatientDimension;
  /** Na comparação lado a lado, o rótulo já vem do cabeçalho da dimensão. */
  compact?: boolean;
}) {
  const textura = TEXTURA[dimension.level];

  return (
    <div className={cn("flex flex-col gap-1", compact ? "" : "sm:flex-row sm:items-baseline sm:gap-4")}>
      {compact ? null : (
        <span className="w-40 shrink-0 text-sm text-[var(--patient-ink)]">{dimension.label}</span>
      )}

      <span className="inline-flex flex-col self-start" aria-hidden="true">
        <span className="text-sm leading-relaxed text-[var(--patient-ink)]">
          {COMPATIBILITY_LABELS[dimension.level]}
        </span>
        {textura ? (
          <span className={cn("mt-1 w-full border-b border-[rgb(47_58_61_/_0.4)]", textura)} />
        ) : null}
      </span>

      {/* A informação inteira, para quem ouve em vez de ver. */}
      <span className="sr-only">
        {dimension.label}: {COMPATIBILITY_LABELS[dimension.level]}.
      </span>
    </div>
  );
}
