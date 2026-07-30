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

export function PublicHeader({ portalCta = null }: PublicHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setScrolled(shouldCompactHeader(window.scrollY, HEADER_COMPACT_SCROLL_THRESHOLD));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "landing-header sticky top-0 z-sticky-header border-b border-[var(--color-border)] bg-[var(--color-bg-canvas)]/80 backdrop-blur-[6px] transition-[box-shadow,background-color] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        scrolled && "bg-[var(--color-bg-canvas)]/92 shadow-[0_1px_0_rgba(183,154,91,0.12),0_4px_20px_rgba(70,55,35,0.04)]",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-content items-center justify-between px-5 transition-[min-height] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] lg:px-10",
          scrolled ? "min-h-[3.25rem]" : "min-h-[4.25rem]",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-canvas)]"
        >
          <Image
            src="/brand/logo-aliviar-icon.png"
            alt="Aliviar — Curadoria Médica Independente"
            width={363}
            height={372}
            priority
            className={cn(
              "w-auto transition-[height] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
              scrolled ? "h-8" : "h-9 lg:h-10",
            )}
          />
          <span
            className={cn(
              "font-serif font-medium tracking-[-0.02em] text-[var(--color-brand-primary)] transition-[font-size] duration-[480ms]",
              scrolled ? "text-base" : "text-lg lg:text-xl",
            )}
          >
            Aliviar
          </span>
        </Link>

        {portalCta ? (
          <LinkButton href={portalCta.href} variant="secondary" className="min-h-10 px-5 py-2 text-sm">
            {portalCta.label}
          </LinkButton>
        ) : (
          <LinkButton href="/login" variant="secondary" className="min-h-10 px-5 py-2 text-sm">
            Entrar
          </LinkButton>
        )}
      </div>
    </header>
  );
}
