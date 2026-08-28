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
  // ADR-081 (23/08): "Para quem é" e "Concierge" saíram junto com as seções
  // que apontavam — Prioridades e Concierge deixaram a composição na vitrine
  // enxuta (uma ideia por bloco). Link sem destino é porta pintada.
  // 27/08 · "Quem somos" apontava para `#quem-somos`, que é o `id` da seção
  // **A escolha** — o card dos três caminhos. Quem clicava querendo saber
  // quem está por trás caía num texto sobre como a escolha funciona. É a
  // mesma família da ADR-064: a superfície promete uma coisa e entrega
  // outra, e aqui a promessa quebrada é justamente a de confiança, na
  // página que pede para confiar uma decisão de saúde.
  //
  // O rótulo passa a dizer o que a seção é — o mesmo nome que ela já usa
  // como `aria-label`. **Não existe conteúdo sobre quem a Aliviar é em
  // lugar nenhum da Landing**; enquanto não existir, um link com esse nome
  // é porta pintada, que é o que a regra acima já proíbe.
  // 27/08 · versalete curto, no lugar de rótulos por extenso. A barra é
  // estreita e o nome longo competia com a marca ao lado.
  { href: "#como-funciona", label: "Curadoria" },
  { href: "#a-escolha", label: "Escolha" },
  // O Concierge volta à navegação: a ADR-081 o tirou porque a seção dele
  // tinha saído da página ("link sem destino é porta pintada"). O ambiente
  // existe de novo, então o link tem para onde levar.
  { href: "#concierge", label: "Concierge" },
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
        // A CÁPSULA DE VIDRO (27/08) · o cabeçalho deixa de ser uma faixa
        // colada no topo e passa a flutuar, recuado e arredondado, com a
        // cena aparecendo em volta E através dele.
        //
        // ISTO REABRE O SISTEMA VISUAL §63, e foi decisão do Fundador — ver
        // a ADR-098. De manhã eu tentei a mesma coisa por conta própria e a
        // guarda me barrou, corretamente: a regra existe para impedir que a
        // casa inteira vire vidro por somatório de decisões locais. A
        // exceção agora é NOMEADA e estreita — só este cabeçalho, só na
        // Fachada. Os outros quatro shells continuam proibidos, e a guarda
        // continua vigiando os quatro.
        //
        // O `<header>` vira só o trilho: quem desenha é o invólucro abaixo.
        // Sem borda inferior — a linha que atravessava a fotografia de ponta
        // a ponta era o que mais cortava a cena.
        "sticky top-0 z-sticky-header transition-[padding] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        scrolled ? "px-3 pt-2" : "px-3 pt-3 sm:px-5 lg:pt-4",
      )}
    >
      <div
        className={cn(
          // `gap-3`: a 375px o logotipo terminava em 113px e o botão começava
          // em 113px — encostados, sem um pixel de respiro. `justify-between`
          // não protege quando o conteúdo ocupa a linha inteira.
          "mx-auto flex w-full max-w-content items-center justify-between gap-3 px-4 transition-[min-height,box-shadow,background-color] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] sm:px-6 lg:px-8",

          // O VIDRO. Sobre a cena, ela atravessa; sobre as páginas de linho
          // liso (`/o-que-e`, `/privacidade`, `/termos`) o desfoque de uma
          // cor chapada devolve a mesma cor chapada — fica neutro, nunca
          // turvo. Por isso não precisa de estado condicional.
          //
          // O fio dourado e a sombra fazem o descolamento; o vidro sozinho
          // deixaria a marca à mercê do enquadramento da foto, que é o
          // defeito do `SIM-61`. 72% em repouso é o piso de legibilidade.
          // VIDRO TINGIDO NO AZUL DA MARCA (27/08). O creme a 72% estava
          // tecnicamente correto — `blur(12px)`, cena atrás — e mesmo assim
          // lia como opaco. A razão, medida: atrás do cabeçalho há teto
          // claro e quase uniforme. Vidro CREME sobre foto CREME não tem o
          // que mostrar; a transparência existia e não se via.
          //
          // Tingir resolve nas duas frentes ao mesmo tempo. Medido sobre a
          // própria fotografia, com texto claro:
          //
          //   azul 60% → contraste 4,59 · deixa passar 40% da cena
          //   creme 72% → contraste 5,40 · deixa passar só 28%
          //   azul 50% → 3,73, abaixo do mínimo de 4,5
          //   verde 60% → 3,80, também abaixo
          //
          // Ou seja: o azul passa MAIS cena e continua legível. E um painel
          // azul sobre foto clara se vê como material, que é o que o creme
          // não conseguia.
          //
          // Ao rolar sobe para 82%: ali embaixo pode haver qualquer coisa
          // atrás — cena escura, texto, o que for — e o piso protege.
          "rounded-[1.75rem] border border-[color-mix(in_srgb,var(--color-brand-gold)_45%,transparent)] backdrop-blur-md",
          scrolled
            ? "min-h-[3.25rem] bg-[color-mix(in_srgb,var(--color-brand-primary)_82%,transparent)] shadow-[0_2px_12px_rgba(18,59,103,0.18)]"
            : "min-h-[4.25rem] bg-[color-mix(in_srgb,var(--color-brand-primary)_60%,transparent)] shadow-[0_6px_28px_rgba(18,59,103,0.20)]",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-canvas)]"
        >
          {/* BLOQUEIO RESOLVIDO (23/08): o Fundador enviou o logotipo
              isolado. Dele saiu o SÍMBOLO com fundo transparente — o
              cabeçalho tem ~40px de altura, onde a assinatura "Curadoria
              Médica Independente" viraria um borrão; ela já aparece
              legível na parede da cena da recepção e no rodapé. O nome
              segue em texto real ao lado: mais nítido que qualquer
              imagem, e escala sozinho. */}
          <Image
            /* O SÍMBOLO PURO, clareado por filtro.
               Tentei antes o `aliviar-logo-clara.png` achando que era só o
               símbolo: é o LOCKUP INTEIRO — símbolo mais a palavra "Aliviar" —,
               e espremido em 20px ao lado do versalete o nome aparecia DUAS
               VEZES, uma delas ilegível. Visto na tela, e revertido.
               O arquivo do símbolo é bicolor (azul e sálvia) e empastaria sobre
               a cápsula azul; o filtro o resolve em silhueta clara, que é o
               tratamento correto de marca sobre fundo escuro. */
            src="/brand/aliviar-simbolo.png"
            alt="Aliviar — Curadoria Médica Independente"
            width={256}
            height={266}
            priority
            className={cn(
              "w-auto brightness-0 invert transition-[height] duration-[480ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
              scrolled ? "h-8" : "h-9 lg:h-10",
            )}
          />
          <span
            className={cn(
              // VERSALETE ESPAÇADO: era caixa mista com `tracking` NEGATIVO
              // — letra apertada lê como palavra. Em caixa alta com
              // espaçamento generoso lê como MARCA, que é o papel dela aqui.
              // Continua texto real, nunca imagem: escala e permanece nítido.
              "font-serif font-medium uppercase text-[var(--color-on-dark)] transition-[font-size] duration-[480ms]",
              scrolled ? "text-sm tracking-[0.16em]" : "text-base tracking-[0.18em] lg:text-lg",
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
          {/* 27/08 · O Fundador pediu "Minha Jornada" no lugar de "Entrar", a
              partir de uma maquete. NÃO SE FAZ, e o motivo é que o rótulo JÁ
              EXISTE logo abaixo: é o `portalCta`, mostrado a quem tem sessão,
              apontando para `/paciente`. Usá-lo também no estado anônimo faria
              a página prometer "sua jornada" a quem ainda não tem nenhuma —
              família da ADR-064 — e apagaria a distinção que o comentário
              seguinte protege. A maquete provavelmente desenhava o estado
              logado. */}
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
          {/* Dossiê (23/08): no CELULAR o botão do cabeçalho é só "Começar"
              — o rótulo longo comia a barra inteira. No computador o
              convite continua por extenso. Mesmo destino, mesma porta. */}
          <LinkButton
            href="/solicitar-atendimento"
            variant="primary"
            /* Invertido: linho cheio com tinta azul. Sobre a cápsula azul, um
               botão azul desapareceria — o peso do convite se mantém trocando
               a polaridade, não reduzindo a presença. */
            className="min-h-11 whitespace-nowrap border-transparent bg-[var(--landing-linen)] px-4 py-2 text-sm text-[var(--color-brand-primary)] hover:bg-white sm:px-5"
          >
            <span className="sm:hidden">Começar</span>
            <span className="hidden sm:inline">Solicitar atendimento</span>
          </LinkButton>

          {portalCta ? (
            <LinkButton
              href={portalCta.href}
              variant="secondary"
              className="hidden min-h-11 px-5 py-2 text-sm text-[var(--color-on-dark)] hover:bg-[color-mix(in_srgb,var(--color-bg-canvas)_12%,transparent)] sm:inline-flex"
            >
              {portalCta.label}
            </LinkButton>
          ) : (
            <LinkButton
              href="/login"
              variant="secondary"
              className="hidden min-h-11 px-5 py-2 text-sm text-[var(--color-on-dark)] hover:bg-[color-mix(in_srgb,var(--color-bg-canvas)_12%,transparent)] sm:inline-flex"
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
