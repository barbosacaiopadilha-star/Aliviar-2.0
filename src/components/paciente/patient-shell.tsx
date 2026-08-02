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
              // Sem prefetch: "Minha história" resolve a história ativa no
              // servidor, e o prefetch do Next executaria essa resolução sem
              // clique nenhum — foi assim que uma paciente terminou com duas
              // histórias vazias. Navegação autenticada e curta não ganha nada
              // com prefetch; a corretude ganha tudo.
              prefetch={false}
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
  /**
   * Menu de usuário unificado (AuthenticatedUserMenu), resolvido no layout server.
   * Substitui o LogoutButton solto do desktop: a plataforma inteira tem UM
   * componente de usuário autenticado, não um por módulo.
   */
  userMenu?: ReactNode;
};

export function PatientShell({ children, userMenu }: PatientShellProps) {
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

      <header className="border-b border-[color-mix(in_srgb,var(--color-border)_60%,transparent)] bg-[var(--patient-linen)] print:hidden">
        <div className="mx-auto flex min-h-[4.5rem] w-full max-w-content items-center justify-between gap-4 px-4 lg:px-8">
          <Link
            href="/paciente"
            className="font-serif text-xl font-medium text-[var(--patient-acento)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
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
                    ? "bg-accent-soft text-accent"
                    : "text-[var(--color-ink-muted)] hover:bg-white/60 hover:text-[var(--patient-ink)]",
                )
              }
            />
          </nav>

          <div className="hidden lg:block">{userMenu ?? <LogoutButton className="w-auto" />}</div>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--patient-ink)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 lg:hidden"
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
                  ? "bg-accent-soft text-accent"
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
