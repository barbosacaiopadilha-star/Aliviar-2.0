import Link from "next/link";

import { LinkButton } from "@/components/landing/link-button";

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
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand-sage">
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
