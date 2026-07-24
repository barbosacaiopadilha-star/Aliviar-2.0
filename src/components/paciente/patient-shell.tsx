"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import "@/app/patient-dashboard.css";

import { LogoutButton } from "@/components/auth/logout-button";
import { PatientAmbientLayer } from "@/components/paciente/dashboard/patient-ambient-layer";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/components/ui/cn";

import { PATIENT_NAV_ITEMS } from "./patient-nav-items";

function NavLinks({
  pathname,
  onNavigate,
  className,
  linkClassName,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
  linkClassName: (active: boolean) => string;
}) {
  return (
    <ul className={className}>
      {PATIENT_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={linkClassName(active)}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type PatientShellProps = {
  children: ReactNode;
};

export function PatientShell({ children }: PatientShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="patient-dashboard min-h-screen">
      <PatientAmbientLayer />

      <a
        href="#patient-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:shadow-md focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-[var(--color-border)]/60 bg-[var(--patient-linen)]/75 backdrop-blur-md print:hidden">
        <div className="mx-auto flex min-h-[4.5rem] w-full max-w-content items-center justify-between gap-4 px-4 lg:px-8">
          <Link
            href="/paciente"
            className="font-serif text-xl font-medium text-[var(--patient-forest)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Aliviar
          </Link>

          <nav aria-label="Navegação principal" className="hidden lg:block">
            <NavLinks
              pathname={pathname}
              className="flex items-center gap-1"
              linkClassName={(active) =>
                cn(
                  "flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-all duration-300 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  active
                    ? "bg-[var(--patient-forest)] text-[var(--patient-linen)] shadow-md shadow-emerald-950/10"
                    : "text-[var(--color-ink-muted)] hover:bg-white/60 hover:text-[var(--patient-ink)]",
                )
              }
            />
          </nav>

          <div className="hidden lg:block">
            <LogoutButton className="w-auto" />
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/80 text-[var(--patient-ink)] backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 lg:hidden"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="right">
        <nav aria-label="Navegação principal">
          <NavLinks
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
            className="space-y-1"
            linkClassName={(active) =>
              cn(
                "flex min-h-11 items-center rounded-xl px-4 text-sm font-medium transition-colors duration-300 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                active
                  ? "bg-[var(--patient-forest)] text-[var(--patient-linen)]"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--patient-linen)] hover:text-[var(--patient-ink)]",
              )
            }
          />
        </nav>
        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          <LogoutButton className="w-full" />
        </div>
      </Drawer>

      <main id="patient-main" className="mx-auto w-full max-w-content px-4 py-12 lg:px-8 lg:py-16">
        {children}
      </main>
    </div>
  );
}
