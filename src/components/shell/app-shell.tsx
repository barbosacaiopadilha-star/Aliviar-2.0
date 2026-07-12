import type { ReactNode } from "react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

import type { NavItem } from "./nav-items";

type AppShellProps = {
  role: string;
  displayName: string | null;
  navItems: NavItem[];
  children: ReactNode;
};

/**
 * Estrutura compartilhada pelos três workspaces (/admin, /profissional,
 * /paciente) — TASK-005A. Semanticamente correta (aside/header/main/nav) e
 * funcional, mas deliberadamente sem estilo de marca: tokens, tipografia,
 * sidebar colapsável e drawer mobile de verdade são da TASK-005B, que
 * estiliza por dentro deste mesmo contrato sem precisar mudar suas props.
 */
export function AppShell({ role, displayName, navItems, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <a
        href="#appshell-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50"
      >
        Pular para o conteúdo
      </a>

      <aside aria-label="Barra lateral" className="w-56 shrink-0 border-r p-4">
        <nav aria-label="Navegação principal">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b p-4">
          <div>
            <p>{displayName ? `Olá, ${displayName}` : "Olá"}</p>
            <p className="text-xs uppercase" aria-label="Papel ativo">
              {role}
            </p>
          </div>
          <LogoutButton />
        </header>

        <main id="appshell-main" className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
