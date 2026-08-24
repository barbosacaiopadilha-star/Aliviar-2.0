import type { HTMLAttributes, ReactNode } from "react";

import { getInitials } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";

export function PatientCard({
  children,
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: "default" | "note" | "forest";
}) {
  return (
    <div
      className={cn(
        // `patient-veu`: a área da paciente passa a ser a continuação da
        // Landing (decisão do Fundador, 23/08) — o cartão é vidro e clareia
        // ao entrar na leitura, na mesma dinâmica da vitrine.
        "patient-card patient-veu p-6 lg:p-8",
        variant === "note" && "patient-card--note",
        variant === "forest" && "bg-[var(--patient-acento)] text-[var(--patient-linen)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PatientWelcome({
  name,
  subtitle = "Estamos cuidando de cada detalhe para você.",
}: {
  name: string;
  subtitle?: string;
}) {
  return (
    <header className="patient-fade-in space-y-3">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--color-brand-sage)]">
        Sua Jornada
      </p>
      <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight text-[var(--patient-ink)] lg:text-4xl">
        Olá, {name}.
      </h1>
      <p className="patient-body max-w-2xl text-lg text-[var(--color-ink-muted)]">{subtitle}</p>
    </header>
  );
}

export function PatientPageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <header className="patient-fade-in max-w-2xl space-y-3">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-sage)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-serif text-3xl font-medium leading-snug tracking-tight text-[var(--patient-ink)] lg:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="patient-body text-lg text-[var(--color-ink-muted)]">{description}</p>
      ) : null}
    </header>
  );
}

export function PatientEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <PatientCard className="mx-auto max-w-xl text-center">
      <h2 className="font-serif text-2xl font-medium text-[var(--patient-ink)]">{title}</h2>
      {description ? (
        <p className="patient-body mt-4 text-[var(--color-ink-muted)]">{description}</p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </PatientCard>
  );
}

export function CuratorAvatar({ name, className }: { name: string; className?: string }) {
  // Uma conta só de iniciais, em `ui/avatar`: esta cópia também deixava entrar
  // pedaço que não começa por letra.
  const initials = getInitials(name);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--patient-acento)] font-serif text-sm font-semibold text-[var(--patient-linen)] shadow-md",
        className,
      )}
    >
      {initials || "?"}
    </div>
  );
}
