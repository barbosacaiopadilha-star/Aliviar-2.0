import Image from "next/image";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      {/* Calor ambiente da PortalExperience — continuidade de iluminação
          na entrada do produto (ADR-031). Decorativo, atrás do cartão. */}
      <div
        aria-hidden="true"
        className="ambient-warmth pointer-events-none absolute inset-0"
      />
      <div className="animate-fade-up relative w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <header className="space-y-3 text-center">
          {/* A entrada do produto exibia só o nome em texto — a marca chegava
              à Landing e sumia na porta de quem entra. Mesma logo e mesmo alt
              do header público (`public-header.tsx`): a identidade não muda
              entre o site e o acesso. */}
          <Image
            src="/brand/logo-aliviar-icon.png"
            alt="Aliviar — Curadoria Médica Independente"
            width={363}
            height={372}
            priority
            className="mx-auto h-12 w-auto"
          />
          <p className="font-serif text-sm font-medium tracking-wide text-brand-primary">
            Aliviar Curadoria Médica
          </p>
          <h1 className="font-serif text-3xl font-semibold text-ink">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </header>
        {children}
        {footer ? (
          <footer className="border-t border-border pt-4 text-center text-sm">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
