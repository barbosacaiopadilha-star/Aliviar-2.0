"use client";

/**
 * Shell compartilhado dos Portais — Curador e Paciente.
 *
 * @metodo Experience §3 — um ambiente coerente reduz carga cognitiva
 * @metodo Fundamentos §2 — a interface serve ao Método, não o contrário
 *
 * Por que existe: o Curador precisa de um cabeçalho estável com identidade
 * autenticada real, navegação e área de conteúdo — nunca dados fictícios.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import "@/app/patient-dashboard.css";

import { PatientAmbientLayer } from "@/components/paciente/dashboard/patient-ambient-layer";
import { cn } from "@/components/ui/cn";

export type PortalNavItem = { href: string; label: string };

type PortalShellProps = {
  homeHref: string;
  subtitle: string;
  nav?: PortalNavItem[];
  userMenu?: React.ReactNode;
  variant?: "default" | "patient";
  children: React.ReactNode;
};

export function PortalShell({
  homeHref,
  subtitle,
  nav,
  userMenu,
  variant = "default",
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const isPatient = variant === "patient";

  return (
    <div className={cn("min-h-screen", isPatient ? "patient-dashboard" : "bg-canvas")}>
      {isPatient ? <PatientAmbientLayer /> : null}
      <header
        className={cn(
          "border-b",
          isPatient
            ? "relative z-10 border-[var(--color-border)]/60 bg-[var(--patient-linen)]/75"
            : "border-border bg-surface",
        )}
      >
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-8">
          <Link
            href={homeHref}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <p
              className={cn(
                "font-serif text-lg leading-none",
                isPatient ? "text-[var(--patient-forest)]" : "text-brand-primary",
              )}
            >
              Aliviar
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-ink-muted)]">
              {subtitle}
            </p>
          </Link>
          {userMenu}
        </div>

        {nav && nav.length > 0 ? (
          <nav aria-label="Seções" className="overflow-x-auto border-t border-[var(--color-border)]">
            <ul className="mx-auto flex w-full max-w-content gap-1 px-4 lg:px-8">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full px-4 text-sm transition-colors duration-300 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset",
                        active
                          ? "bg-[var(--patient-forest)] font-medium text-[var(--patient-linen)]"
                          : "text-[var(--color-ink-muted)] hover:text-[var(--patient-ink)]",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-content px-4 py-12 lg:px-8 lg:py-16">
        {children}
      </main>

      {/* Aviso de ambiente de trabalho: NUNCA em produção. Um Atendente real
          atendendo gente real não pode ler "dados de demonstração" no rodapé
          da própria ferramenta (Polimento 2026-07-24). Condicionado por
          código, não por CSS — em produção o nó não existe. */}
      {isPatient || process.env.NODE_ENV === "production" ? null : (
        <footer className="mx-auto w-full max-w-content px-4 pb-10 lg:px-8">
          <p className="border-t border-border pt-4 text-xs text-ink-muted">
            Ambiente de construção da experiência — dados de demonstração.
          </p>
        </footer>
      )}
    </div>
  );
}
