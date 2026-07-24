"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/alicia/studio", label: "Dashboard", exact: true },
  { href: "/alicia/studio/inbox", label: "Inbox" },
  { href: "/alicia/studio/discovery", label: "Discovery" },
  { href: "/alicia/studio/workflow", label: "Workflow" },
  { href: "/alicia/studio/connectors", label: "Connectors" },
  { href: "/alicia/studio/evidence", label: "Evidence" },
  { href: "/alicia/studio/evidence-coverage", label: "Evidence Coverage" },
  { href: "/alicia/studio/operations", label: "Operations" },
  { href: "/alicia/studio/factory", label: "Factory" },
  { href: "/alicia/studio/verification", label: "Verification" },
];

export function AliciaStudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">AliCIA Studio</p>
            <p className="text-xs text-ink-soft">Workspace operacional interno · MVP</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-coral-soft text-coral"
                      : "text-ink-soft hover:bg-paper hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/alicia"
              className="btn-secondary text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Produto público ↗
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-ink-soft">
        Uso interno — não altera o catálogo público automaticamente.
      </footer>
    </div>
  );
}
