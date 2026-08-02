import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

type KpiCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
};

/**
 * Um indicador sem nada dentro não merece o peso de um indicador cheio.
 *
 * A tela executiva abria com doze caixas idênticas, cada uma com um "0" em
 * serifa grande e escura: o olho pousava, uma a uma, em doze ausências, e o
 * dado mais vazio da operação era o objeto mais pesado da tela. Hierarquia
 * invertida — quem opera precisa ver primeiro o que exige ação.
 *
 * O zero continua inteiro e legível (nunca escondido: a operação precisa
 * saber que é zero, e esconder ausência é a semente do dado que ninguém
 * confere). Ele só deixa de gritar — recua para a tinta suave e para o peso
 * regular, e devolve o primeiro ponto de atenção a quem tem algo a dizer.
 */
function ausente(value: ReactNode): boolean {
  return value === 0 || value === "0" || value === "—" || value == null;
}

export function KpiCard({ label, value, hint, href, className }: KpiCardProps) {
  const vazio = ausente(value);

  const content = (
    <Card
      padding="lg"
      className={cn(
        "h-full transition-shadow duration-fast ease-standard motion-reduce:transition-none",
        href && "hover:shadow-md",
        className,
      )}
    >
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-2 font-serif tabular-nums",
          vazio
            ? "text-2xl font-normal text-ink-muted"
            : "text-3xl font-semibold text-brand-primary-deep",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2">
        {content}
      </Link>
    );
  }

  return content;
}
