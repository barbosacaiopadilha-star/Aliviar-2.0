import Link from "next/link";

import { LinkButton } from "@/components/landing/link-button";

// Wordmark textual, fiel à hierarquia da logo oficial (serifado "Aliviar"
// em azul + versalete "Curadoria Médica" em sálvia) — o símbolo gráfico
// (mãos + coração) e o SVG oficial ainda não existem como arquivo no
// repositório; nenhuma vetorização aproximada foi criada para substituí-lo
// (ver relatório da Landing V2). Quando o SVG oficial existir, substituir
// só este bloco por <Image>, sem tocar no restante do header.
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-sticky-header border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-content items-center justify-between px-4 lg:px-8">
        <Link
          href="/"
          className="flex flex-col items-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span className="font-serif text-lg font-semibold leading-none text-brand-primary">
            Aliviar
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand-sage">
            <span aria-hidden="true" className="h-px w-2.5 shrink-0 bg-brand-gold/60" />
            Curadoria Médica
          </span>
        </Link>

        <LinkButton href="/login" variant="secondary">
          Entrar
        </LinkButton>
      </div>
    </header>
  );
}
