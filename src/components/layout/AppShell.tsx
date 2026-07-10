import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import { requireActiveStaffProfile } from "@/lib/auth/staff";

const navItems = [
  { href: "/workspace", label: "Workspace" },
  { href: "/patients", label: "Pacientes" },
  { href: "/journeys", label: "Jornadas" },
];

export async function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const profile = await requireActiveStaffProfile();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper-raised">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">Aliviar OS</p>
            <p className="text-sm text-ink-soft">Área operacional interna</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {(title || description || actions) && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              {title && <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>}
              {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-ink-soft">
        Logado como {profile.full_name}
      </footer>
    </div>
  );
}
