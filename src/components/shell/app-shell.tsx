"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/components/ui/cn";

import type { NavItem } from "./nav-items";

type AppShellProps = {
  role: string;
  displayName: string | null;
  navItems: NavItem[];
  children: ReactNode;
};

function formatRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    administrador: "Administrador",
    profissional: "Profissional",
    paciente: "Paciente",
    curador_medico: "Curador Médico",
  };

  return labels[role] ?? role;
}

function ShellNav({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                active
                  ? "bg-brand-primary text-surface"
                  : "text-ink-muted hover:bg-canvas hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ role, displayName, navItems, children }: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const greeting = displayName ? `Olá, ${displayName}` : "Olá";

  return (
    <div className="min-h-screen bg-canvas">
      <a
        href="#appshell-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:shadow-md focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Pular para o conteúdo
      </a>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Menu">
        <nav aria-label="Navegação principal">
          <ShellNav
            navItems={navItems}
            pathname={pathname}
            onNavigate={() => setDrawerOpen(false)}
          />
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <LogoutButton className="w-full" />
        </div>
      </Drawer>

      <div className="flex min-h-screen">
        <aside
          aria-label="Barra lateral"
          className="hidden w-64 shrink-0 border-r border-border bg-surface print:hidden lg:flex lg:flex-col"
        >
          <div className="border-b border-border px-6 py-6">
            <p className="font-serif text-lg font-semibold leading-none text-brand-primary">Aliviar</p>
            <p className="mt-1 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand-sage">
              Curadoria Médica
            </p>
          </div>
          <nav aria-label="Navegação principal" className="flex-1 px-4 py-6">
            <ShellNav navItems={navItems} pathname={pathname} />
          </nav>
          <div className="border-t border-border px-4 py-4">
            <LogoutButton className="w-full" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-sticky-header border-b border-border bg-surface/95 backdrop-blur print:hidden">
            <div className="flex min-h-[4.5rem] items-center justify-between gap-4 px-4 py-3 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:hidden"
                  aria-label="Abrir menu"
                  onClick={() => setDrawerOpen(true)}
                >
                  <Menu className="size-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{greeting}</p>
                  <Badge variant="sage" className="mt-1 normal-case">
                    {formatRoleLabel(role)}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Avatar name={displayName ?? role} />
              </div>
            </div>
          </header>

          <main
            id="appshell-main"
            className="mx-auto w-full max-w-content flex-1 px-4 py-6 print:max-w-none print:p-0 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
