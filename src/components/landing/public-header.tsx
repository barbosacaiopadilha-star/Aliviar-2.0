import Image from "next/image";
import Link from "next/link";

import { LinkButton } from "@/components/landing/link-button";

// Logo oficial (public/brand/logo-aliviar.jpeg) — arquivo usado exatamente
// como fornecido, sem recriação/vetorização/alteração de cor. Fundo claro
// do arquivo se funde com o header (bg-surface), então não aparece como
// caixa branca.
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-sticky-header border-b border-brand-gold/20 bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-content items-center justify-between px-4 lg:px-8">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Image
            src="/brand/logo-aliviar.jpeg"
            alt="Aliviar — Curadoria Médica Independente"
            width={1254}
            height={1254}
            priority
            className="h-14 w-14 lg:h-16 lg:w-16"
          />
        </Link>

        <LinkButton href="/login" variant="secondary">
          Entrar
        </LinkButton>
      </div>
    </header>
  );
}
