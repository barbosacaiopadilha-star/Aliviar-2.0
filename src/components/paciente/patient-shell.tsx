"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/components/ui/cn";

type PatientNavItem = {
  label: string;
  href: string;
};

// Navegação exclusiva do paciente — vive aqui, não em
// src/components/shell/nav-items.ts (que é compartilhado com admin/curador),
// para que este ambiente não misture sua estrutura com a deles.
const PATIENT_NAV_ITEMS: PatientNavItem[] = [
  { label: "Início", href: "/paciente" },
  { label: "Minha história", href: "/sua-historia" },
  { label: "Documentos", href: "/paciente/documentos" },
  { label: "Minha Curadoria", href: "/paciente/curadoria" },
  { label: "Perfil", href: "/paciente/perfil" },
];

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

// Ambiente exclusivo do paciente — não deriva nem reaproveita o AppShell
// (compartilhado com admin/curador). Só identidade visual e navegação:
// nenhuma leitura de história/Caso, nenhuma decisão de negócio acontece
// aqui.
export function PatientShell({ children }: PatientShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#patient-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:shadow-md focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Pular para o conteúdo
      </a>

      <header className="border-b border-border bg-surface print:hidden">
        <div className="mx-auto flex min-h-[4.5rem] w-full max-w-content items-center justify-between gap-4 px-4 lg:px-8">
          <Link
            href="/paciente"
            className="font-serif text-xl font-medium text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Aliviar
          </Link>

          <nav aria-label="Navegação principal" className="hidden lg:block">
            <NavLinks
              pathname={pathname}
              className="flex items-center gap-1"
              linkClassName={(active) =>
                cn(
                  "flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                  active ? "text-brand-primary" : "text-ink-muted hover:text-ink",
                )
              }
            />
          </nav>

          <div className="hidden lg:block">
            <LogoutButton className="w-auto" />
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:hidden"
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
                "flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                active ? "bg-brand-primary text-surface" : "text-ink-muted hover:bg-canvas hover:text-ink",
              )
            }
          />
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <LogoutButton className="w-full" />
        </div>
      </Drawer>

      <main id="patient-main" className="mx-auto w-full max-w-content px-4 py-10 lg:px-8 lg:py-14">
        {children}
      </main>
    </div>
  );
}
