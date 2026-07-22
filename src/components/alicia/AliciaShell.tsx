import Link from "next/link";

const navItems = [
  { href: "/alicia", label: "Início" },
  { href: "/alicia/mapa", label: "Mapa" },
  { href: "/alicia/metodologia", label: "Como funciona" },
];

export function AliciaShell({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper-raised/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/alicia" className="group">
            <p className="font-serif text-xl font-semibold text-ink group-hover:text-coral">
              AliCIA
            </p>
            <p className="text-xs text-ink-soft">Clareza antes da escolha</p>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className={`mx-auto w-full flex-1 ${compact ? "max-w-3xl" : "max-w-6xl"} px-4 py-8`}>
        {children}
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-xs leading-relaxed text-ink-soft">
        <p>A AliCIA organiza informações públicas sobre formação médica.</p>
        <p className="mt-1">Não recomendamos médicos. A decisão é sempre sua.</p>
      </footer>
    </div>
  );
}
