import Link from "next/link";

import type { Metadata } from "next";

import { cn } from "@/components/ui/cn";

export const metadata: Metadata = {
  title: { default: "Minha Jornada", template: "%s · Aliviar" },
  robots: { index: false, follow: false },
};

// MISSÃO 205 — JORNADA DO PACIENTE.
//
// Vive em rota própria (`/portal-paciente`) enquanto usa dados de
// demonstração — o `/paciente` atual exige autenticação real e lê o banco.
// Quando a integração acontecer, esta Jornada assume `/paciente`.
//
// A navegação é a própria jornada, não um menu de funcionalidades: os rótulos
// são o que o paciente vive ("Minha Jornada", "Minhas prioridades"), nunca o
// nome interno da entidade (Experience §7 — a voz do Portal).

const NAV = [
  { href: "/portal-paciente", label: "Minha Jornada" },
  { href: "/portal-paciente/prioridades", label: "Minhas prioridades" },
  { href: "/portal-paciente/como-funciona", label: "Como está sendo feita" },
] as const;

export default function PortalPacienteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-content px-4 py-4 lg:px-8">
          <Link href="/portal-paciente" className="inline-block">
            <p className="font-serif text-lg leading-none text-brand-primary">Aliviar</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-muted">
              Curadoria Médica
            </p>
          </Link>
        </div>
        {/* Navegação rola na horizontal no celular em vez de quebrar em duas
            linhas — o Portal é usado principalmente no telefone. */}
        <nav aria-label="Seções" className="overflow-x-auto border-t border-border">
          <ul className="mx-auto flex w-full max-w-content gap-1 px-4 lg:px-8">
            {NAV.map((item) => (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-11 items-center px-3 text-sm text-ink-muted",
                    "transition-colors duration-fast ease-standard hover:text-ink",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-content px-4 py-8 lg:px-8 lg:py-12">{children}</main>

      <footer className="mx-auto w-full max-w-content px-4 pb-10 lg:px-8">
        <p className="border-t border-border pt-4 text-xs text-ink-muted">
          Ambiente de construção da experiência — dados de demonstração.
        </p>
      </footer>
    </div>
  );
}
