"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  HEADER_COMPACT_SCROLL_THRESHOLD,
  shouldCompactHeader,
} from "@/components/landing/header-compaction";
import { LinkButton } from "@/components/landing/link-button";
import { cn } from "@/components/ui/cn";
import type { AuthenticatedPortalCta } from "@/modules/auth/role-home";

type PublicHeaderProps = {
  portalCta?: AuthenticatedPortalCta | null;
};

// Ícone isolado (public/brand/logo-aliviar-icon.png, recortado do
// logotipo oficial, fundo removido) — o lockup completo (ícone +
// "Aliviar" + tagline) fica ilegível em 56-64px; o header usa só a marca,
// o rodapé usa o logotipo completo (mais espaço disponível). Encolhe e
// ganha sombra ao rolar — reforço sutil de profundidade, nunca abrupto.
export function PublicHeader({ portalCta = null }: PublicHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setScrolled(
        shouldCompactHeader(window.scrollY, HEADER_COMPACT_SCROLL_THRESHOLD),
      );
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-sticky-header border-b border-[var(--color-border)]/50 bg-[var(--landing-linen)]/70 backdrop-blur-md transition-shadow duration-base ease-standard",
        scrolled && "shadow-sm",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-content items-center justify-between px-4 transition-[min-height] duration-base ease-standard lg:px-8",
          scrolled ? "min-h-14" : "min-h-16",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Image
            src="/brand/logo-aliviar-icon.png"
            alt="Aliviar — Curadoria Médica Independente"
            width={363}
            height={372}
            priority
            className="h-10 w-auto lg:h-12"
          />
          <span className="font-serif text-lg font-semibold text-[var(--landing-forest,var(--color-brand-primary-deep))] lg:text-xl">
            Aliviar
          </span>
        </Link>

        {portalCta ? (
          <LinkButton href={portalCta.href} variant="secondary">
            {portalCta.label}
          </LinkButton>
        ) : (
          <LinkButton href="/login" variant="secondary">
            Entrar
          </LinkButton>
        )}
      </div>
    </header>
  );
}
