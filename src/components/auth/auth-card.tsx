import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <header className="space-y-3 text-center">
          <p className="font-serif text-sm font-medium tracking-wide text-brand-primary">
            Aliviar Curadoria Médica
          </p>
          <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
          {description ? (
            <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </header>
        {children}
        {footer ? (
          <footer className="border-t border-border pt-4 text-center text-sm">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
