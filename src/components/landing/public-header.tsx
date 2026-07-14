"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LinkButton } from "@/components/landing/link-button";
import { cn } from "@/components/ui/cn";

// Ícone isolado (public/brand/logo-aliviar-icon.png, recortado do
// logotipo oficial, fundo removido) — o lockup completo (ícone +
// "Aliviar" + tagline) fica ilegível em 56-64px; o header usa só a marca,
// o rodapé usa o logotipo completo (mais espaço disponível). Encolhe e
// ganha sombra ao rolar — reforço sutil de profundidade, nunca abrupto.
export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-sticky-header border-b-2 border-brand-gold/50 bg-canvas/95 backdrop-blur transition-shadow duration-base ease-standard",
        scrolled && "shadow-md",
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
          <span className="font-serif text-lg font-semibold text-brand-primary-deep lg:text-xl">
            Aliviar
          </span>
        </Link>

        <LinkButton href="/login" variant="secondary">
          Entrar
        </LinkButton>
      </div>
    </header>
  );
}
