import Link from "next/link";
import type { ReactNode } from "react";

import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";

/**
 * CuradoriaCard — o estado da Curadoria em uma frase e uma ação.
 *
 * Uma ideia principal, uma ação principal. A frase vem de `experiencia.ts`
 * (a mesma fonte da jornada), não é escrita aqui: se a etapa mudar, o cartão
 * muda junto, sem ninguém precisar lembrar de dois lugares.
 *
 * Quando não há para onde ir, o cartão diz o que está acontecendo e não
 * oferece botão nenhum — CTA que leva a lugar nenhum é pior que ausência de
 * CTA, porque promete movimento e entrega uma tela vazia.
 */
export function CuradoriaCard({
  message,
  action,
  aside,
}: {
  message: string;
  action?: { label: string; href: string };
  /** Uma linha discreta de contexto — responsável, último passo. */
  aside?: ReactNode;
}) {
  return (
    <PatientCard variant="note">
      <h2 className="patient-section-title">Minha Curadoria</h2>

      <p className="patient-body mt-4 max-w-md text-[1.0625rem] leading-relaxed text-[var(--patient-ink)]">
        {message}
      </p>

      {aside ? <p className="mt-3 text-sm text-[var(--color-ink-muted)]">{aside}</p> : null}

      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--patient-acento)] px-6 text-sm font-medium text-[var(--patient-linen)] shadow-md transition-all duration-300 ease-standard hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {action.label}
        </Link>
      ) : null}
    </PatientCard>
  );
}
