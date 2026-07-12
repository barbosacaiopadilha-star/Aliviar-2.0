import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-2 px-4 py-8 text-center lg:px-8">
        <Link
          href="/"
          className="flex flex-col items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span className="font-serif text-base font-semibold leading-none text-brand-primary">
            Aliviar
          </span>
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand-sage">
            Curadoria Médica
          </span>
        </Link>
        <p className="text-sm text-ink-muted">Curadoria médica independente, com acompanhamento humano.</p>
        <p className="text-xs text-ink-muted">
          © {new Date().getFullYear()} Aliviar. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
