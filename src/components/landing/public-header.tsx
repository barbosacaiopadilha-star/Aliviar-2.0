"use client";

import Image from "next/image";
import Link from "next/link";

import { useCallback, useEffect, useRef, useState } from "react";

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

/**
 * BLOCO 7 · a navegação da Landing.
 *
 * Antes o header tinha logo e `Entrar`, e mais nada: quem chegava pela
 * primeira vez só conseguia ler a página rolando-a inteira, e o único convite
 * era `Entrar` — que fala com quem já é de casa.
 *
 * Cada `href` aponta para um `id` que existe na página. Nenhum link é
 * decorativo, e T-7-2 confere a correspondência dos dois lados.
 */
// A ordem aqui é a ordem em que as seções aparecem ao rolar. Antes não era:
// os cinco itens caíam na 8ª, 5ª, 7ª, 4ª e 6ª seção da página, nessa sequência,
// e percorrer o menu da esquerda para a direita fazia a página saltar para
// trás e para frente. A ordem da página é contratada (contrato 34 §6) e não se
// mexe; o menu é que passa a segui-la.
const NAV_LINKS = [
  // "Nossa curadoria" aponta para a jornada desde que os quatro movimentos
  // saíram da página (decisão do Fundador, 22/08) — a jornada É a curadoria
  // contada em cartões. O item "Como funciona" separado saiu junto: dois
  // links para a mesma âncora seriam ruído.
  { href: "#como-funciona", label: "Nossa curadoria" },
  { href: "#para-quem", label: "Para quem é" },
  { href: "#concierge", label: "Concierge" },
  { href: "#quem-somos", label: "Quem somos" },
] as const;

export function PublicHeader({ portalCta = null }: PublicHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () =>
      setScrolled(shouldCompactHeader(window.scrollY, HEADER_COMPACT_SCROLL_THRESHOLD));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fechar = useCallback(() => {
    setDrawerAberto(false);
    botaoRef.current?.focus();
  }, []);

  /**
   * `Esc` fecha e o foco fica PRESO enquanto aberto. Sem isso, quem navega por
   * teclado sai do drawer para trás dele e não encontra o caminho de volta —
   * um menu que abre e some do alcance é pior do que menu nenhum.
   */
  useEffect(() => {
    if (!drawerAberto) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        fechar();
        return;
      }
      if (evento.key !== "Tab") return;

      const focaveis = drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!focaveis || focaveis.length === 0) return;
      const primeiro = focaveis[0]!;
      const ultimo = focaveis[focaveis.length - 1]!;

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", aoTeclar);
    drawerRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [drawerAberto, fechar]);

  return (
    <header
      className={cn(
        "sticky top-0 z-sticky-header border-b border-[var(--color-border)] bg-[var(--color-bg-canvas)] transition-[box-shadow,background-color] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        scrolled && "bg-[color-mix(in_srgb,var(--color-bg-canvas)_92%,transparent)] shadow-[0_1px_0_rgba(183,154,91,0.12),0_4px_20px_rgba(70,55,35,0.04)]",
      )}
    >
      <div
        className={cn(
          // `gap-3`: a 375px o logotipo terminava em 113px e o botão começava
          // em 113px — encostados, sem um pixel de respiro. `justify-between`
          // não protege quando o conteúdo ocupa a linha inteira.
          "mx-auto flex w-full max-w-content items-center justify-between gap-3 px-5 transition-[min-height] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] lg:px-10",
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

        <nav aria-label="Seções da página" className="landing-nav">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="landing-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 lg:gap-3">
          {/* `Começar` é a porta pública, e `Entrar` continua sendo o
              reconhecimento de quem já mora aqui. São gestos diferentes e
              nunca se substituem — foi por confundir os dois que a Landing
              ficou sem convite para quem chega. */}
          {/* `px-3` no celular devolve os 16px que o respiro do logotipo
              precisava; a partir de `sm` o botão volta ao peso original.

              O `whitespace-nowrap` só vale de 360px para cima. Abaixo disso não
              existe largura para "Solicitar atendimento" numa linha só: com
              logotipo, respiros e o botão do menu, sobram 119px para um rótulo
              que pede 174px. Proibir a quebra em 320px fazia a barra transbordar
              5px — o T-7-7 pegou. Nessa faixa o rótulo volta a ocupar duas
              linhas, como sempre ocupou. */}
          <LinkButton
            href="/solicitar-atendimento"
            variant="primary"
            className="min-h-11 px-3 py-2 text-sm min-[360px]:whitespace-nowrap sm:px-5"
          >
            Solicitar atendimento
          </LinkButton>

          {portalCta ? (
            <LinkButton
              href={portalCta.href}
              variant="secondary"
              className="hidden min-h-11 px-5 py-2 text-sm sm:inline-flex"
            >
              {portalCta.label}
            </LinkButton>
          ) : (
            <LinkButton
              href="/login"
              variant="secondary"
              className="hidden min-h-11 px-5 py-2 text-sm sm:inline-flex"
            >
              Entrar
            </LinkButton>
          )}

          <button
            ref={botaoRef}
            type="button"
            aria-expanded={drawerAberto}
            aria-controls="landing-drawer"
            onClick={() => setDrawerAberto((aberto) => !aberto)}
            className="landing-drawer-botao"
          >
            <span className="sr-only">
              {drawerAberto ? "Fechar menu de seções" : "Abrir menu de seções"}
            </span>
            <span aria-hidden="true">{drawerAberto ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile: os links vivem no drawer, e o CTA `Começar` NUNCA some — ele
          fica na barra, ao lado do botão. */}
      {drawerAberto ? (
        <div ref={drawerRef} id="landing-drawer" className="landing-drawer">
          <nav aria-label="Seções da página" className="landing-drawer-nav">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="landing-drawer-link"
                onClick={() => setDrawerAberto(false)}
              >
                {link.label}
              </a>
            ))}
            {portalCta ? (
              <a href={portalCta.href} className="landing-drawer-link" onClick={() => setDrawerAberto(false)}>
                {portalCta.label}
              </a>
            ) : (
              <a href="/login" className="landing-drawer-link" onClick={() => setDrawerAberto(false)}>
                Entrar
              </a>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
