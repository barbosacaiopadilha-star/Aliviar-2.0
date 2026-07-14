import Link from "next/link";

// Multi-coluna (Landing V2) — nenhum canal de contato inventado (sem
// telefone/e-mail/endereço fictício): só navegação interna já existente
// no site e a assinatura institucional completa da marca, incluindo
// "Independente" (preservada mesmo sem o SVG oficial da logo — ver
// public-header.tsx e o relatório da Landing V2).
const FOOTER_LINKS = [
  { label: "Vídeo institucional", href: "#video-institucional" },
  { label: "Dúvidas frequentes", href: "#duvidas" },
  { label: "Contar minha história", href: "/sua-historia" },
  { label: "Entrar", href: "/login" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-content gap-10 px-4 py-14 lg:grid-cols-[1.3fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex flex-col items-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="font-serif text-lg font-semibold leading-none text-brand-primary">
              Aliviar
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand-sage">
              <span aria-hidden="true" className="h-px w-2.5 shrink-0 bg-brand-gold/60" />
              Curadoria Médica Independente
            </span>
          </Link>
          <p className="max-w-reading text-sm text-ink-muted">
            Curadoria médica independente, com acompanhamento humano em cada etapa — do primeiro
            contato à conversa que importa.
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
            Navegação
          </span>
          <ul className="mt-3 space-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-ink transition-colors duration-fast ease-standard hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-content px-4 py-4 text-xs text-ink-muted lg:px-8">
          © {new Date().getFullYear()} Aliviar. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
