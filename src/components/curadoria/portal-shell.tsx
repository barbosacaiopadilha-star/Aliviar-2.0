import Link from "next/link";

import { cn } from "@/components/ui/cn";

/**
 * Shell único dos Portais — Curador e Paciente (MISSÃO 206).
 *
 * @metodo Jornada §5 — o Portal deve desaparecer; a metodologia é que aparece
 * @metodo Experience §4 — a tecnologia nunca chama atenção para si; consistência é o que produz confiança
 * @metodo Experience §5 — UX2: sempre mostrar contexto; UX3: nunca esconder o próximo passo
 *
 * Por que existe: a MISSÃO 206 encontrou dois cabeçalhos escritos
 * separadamente fazendo a mesma coisa de formas diferentes — um com navegação,
 * outro sem; um com o nome de quem está logado, outro não. Dois shells
 * divergentes são exatamente a fronteira entre produtos que o paciente nunca
 * deve perceber. Este componente é a única casca dos dois Portais: mesma
 * marca, mesma tipografia, mesmo espaçamento, mesma navegação.
 *
 * O que nunca faz: mudar de gramática visual entre um papel e outro. O que
 * varia é o rótulo e os itens de navegação — nunca a estrutura.
 */

export type PortalNavItem = { href: string; label: string };

type PortalShellProps = {
  /** Para onde o logotipo leva — a home daquele papel. */
  homeHref: string;
  /** Qualificador sob a marca. Nunca o nome interno do sistema. */
  subtitle: string;
  nav?: PortalNavItem[];
  /** Quem está usando, quando faz sentido mostrar. */
  identity?: string | null;
  children: React.ReactNode;
};

export function PortalShell({ homeHref, subtitle, nav, identity, children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-3 px-4 py-4 lg:px-8">
          <Link
            href={homeHref}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <p className="font-serif text-lg leading-none text-brand-primary">Aliviar</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-muted">{subtitle}</p>
          </Link>
          {identity ? <p className="text-sm text-ink-muted">{identity}</p> : null}
        </div>

        {nav && nav.length > 0 ? (
          // Rola na horizontal no celular em vez de quebrar em duas linhas —
          // os dois Portais são usados no telefone, não só o do paciente.
          <nav aria-label="Seções" className="overflow-x-auto border-t border-border">
            <ul className="mx-auto flex w-full max-w-content gap-1 px-4 lg:px-8">
              {nav.map((item) => (
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
        ) : null}
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
