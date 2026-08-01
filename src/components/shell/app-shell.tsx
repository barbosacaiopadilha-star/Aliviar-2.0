"use client";

import {
  Calendar,
  ChevronLeft,
  Contact,
  Filter,
  Home,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AuthenticatedUserMenu } from "@/components/auth/authenticated-user-menu";
import { CommandPaletteProvider, useCommandPalette } from "@/components/ads/command-palette-provider";
import { IconButton } from "@/components/ads/icon-button";
import { cn } from "@/components/ui/cn";
import { Drawer } from "@/components/ui/drawer";

import { getNavGroups, isNavItemActive, type NavGroup } from "./nav-items";

type AppShellProps = {
  role: string;
  displayName: string | null;
  basePath: string;
  systemLabel?: string;
  children: ReactNode;
};

const SIDEBAR_COLLAPSED_KEY = "aliviar-sidebar-collapsed";

const navIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  dashboard: LayoutDashboard,
  contacts: Contact,
  funnel: Filter,
  tasks: Calendar,
  agenda: Calendar,
  patients: Users,
  settings: Settings,
};

function formatRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    administrador: "Administrador",
    profissional: "Profissional",
    paciente: "Paciente",
    curador_medico: "Curador Médico",
    concierge: "Concierge",
  };
  return labels[role] ?? role;
}

function ShellNav({
  groups,
  pathname,
  basePath,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  basePath: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          {!collapsed ? (
            <p className="mb-2 px-3 text-[0.75rem] font-semibold tracking-[0.01em] text-ink-muted">
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href, basePath);
              const Icon = item.icon ? navIcons[item.icon] : LayoutDashboard;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                      active
                        ? "bg-brand-primary text-surface"
                        : "text-ink-muted hover:bg-canvas hover:text-ink",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {Icon ? <Icon className="size-4 shrink-0" aria-hidden="true" /> : null}
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AppShellContent({ role, displayName, basePath, systemLabel = "Curadoria Médica", children }: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { setOpen } = useCommandPalette();
  const navGroups = getNavGroups(role, basePath);
  const greeting = displayName ? `Olá, ${displayName}` : "Olá";

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

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
            groups={navGroups}
            pathname={pathname}
            basePath={basePath}
            collapsed={false}
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
          className={cn(
            "hidden shrink-0 border-r border-border bg-surface transition-[width] duration-base ease-standard motion-reduce:transition-none print:hidden lg:flex lg:flex-col",
            collapsed ? "w-[4.5rem]" : "w-64",
          )}
        >
          <div className={cn("border-b border-border px-4 py-5", collapsed && "px-2 text-center")}>
            <p className={cn("font-serif text-lg font-semibold leading-none text-brand-primary", collapsed && "text-base")}>
              {collapsed ? "A" : "Aliviar"}
            </p>
            {!collapsed ? (
              <p className="mt-1 text-[0.7rem] font-medium tracking-[0.02em] text-brand-primary">
                {systemLabel}
              </p>
            ) : null}
          </div>

          <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-5">
            <ShellNav groups={navGroups} pathname={pathname} basePath={basePath} collapsed={collapsed} />
          </nav>

          <div className="border-t border-border p-3">
            <IconButton
              label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
              variant="ghost"
              onClick={toggleCollapsed}
              className="w-full"
            >
              <ChevronLeft className={cn("size-4 transition-transform duration-fast", collapsed && "rotate-180")} />
            </IconButton>
            {!collapsed ? <LogoutButton className="mt-2 w-full" /> : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-sticky-header border-b border-border bg-surface print:hidden">
            <div className="flex min-h-[4.5rem] items-center gap-3 px-4 py-3 lg:px-8">
              <IconButton label="Abrir menu" className="lg:hidden" onClick={() => setDrawerOpen(true)}>
                <Menu className="size-5" />
              </IconButton>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="hidden min-h-11 min-w-[14rem] max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-canvas px-3 text-sm text-ink-muted transition-colors duration-fast ease-standard hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 md:flex"
                aria-label="Abrir busca global (Ctrl+K)"
              >
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">Buscar…</span>
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
              </button>

              <div className="ml-auto flex items-center gap-3">
                <IconButton label="Abrir busca global" className="md:hidden" onClick={() => setOpen(true)}>
                  <Search className="size-5" />
                </IconButton>
                {/* Menu de usuário unificado da plataforma (BUG CRÍTICO
                    2026-07-24): o avatar era estático — identidade sem saída.
                    Agora é o mesmo AuthenticatedUserMenu de todos os módulos. */}
                <AuthenticatedUserMenu displayName={displayName ?? greeting} roleLabel={formatRoleLabel(role)} />
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

export function AppShell({ role, displayName, basePath, systemLabel, children }: AppShellProps) {
  const navGroups = getNavGroups(role, basePath);

  return (
    <CommandPaletteProvider navGroups={navGroups} role={role} basePath={basePath}>
      <AppShellContent
        role={role}
        displayName={displayName}
        basePath={basePath}
        systemLabel={systemLabel}
      >
        {children}
      </AppShellContent>
    </CommandPaletteProvider>
  );
}
