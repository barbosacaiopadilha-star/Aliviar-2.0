"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import "@/app/patient-dashboard.css";

import { LogoutButton } from "@/components/auth/logout-button";
import { PatientAmbientLayer } from "@/components/paciente/dashboard/patient-ambient-layer";
import { Drawer } from "@/components/ui/drawer";
import { cn } from "@/components/ui/cn";

import { PATIENT_NAV_ITEMS } from "./patient-nav-items";

/**
 * A2B · o item ativo passa a reconhecer os subpassos.
 *
 * A comparação era `pathname === item.href`. "Minha história" aponta para
 * `/sua-historia/continuar`, mas o wizard tem seis passos próprios
 * (`/motivo`, `/historia`, `/revisao`…) — e em nenhum deles o item acendia.
 * A paciente estava dentro da História com a navegação dizendo que não.
 *
 * `/paciente` é exato de propósito: é o Início, e prefixo faria dele o item
 * ativo de todas as outras rotas da casa.
 */
function secaoDe(caminho: string): string {
  const partes = caminho.split("/").filter(Boolean);
  // Dentro de `/paciente`, cada item é o SEGUNDO segmento — `/paciente` sozinho
  // é o Início. Fora dela (a História), a seção é o primeiro segmento, e os
  // passos do wizard pendem todos dele.
  if (partes[0] === "paciente") return `/paciente/${partes[1] ?? ""}`;
  return `/${partes[0] ?? ""}`;
}

function itemAtivo(pathname: string, href: string): boolean {
  return secaoDe(pathname) === secaoDe(href);
}

function NavLinks({
  pathname,
  onNavigate,
  className,
  linkClassName,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
  linkClassName: (active: boolean) => string;
}) {
  return (
    <ul className={className}>
      {PATIENT_NAV_ITEMS.map((item) => {
        const active = itemAtivo(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={linkClassName(active)}
              // Sem prefetch: "Minha história" resolve a história ativa no
              // servidor, e o prefetch do Next executaria essa resolução sem
              // clique nenhum — foi assim que uma paciente terminou com duas
              // histórias vazias. Navegação autenticada e curta não ganha nada
              // com prefetch; a corretude ganha tudo.
              prefetch={false}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type PatientShellProps = {
  children: ReactNode;
  /**
   * Menu de usuário unificado (AuthenticatedUserMenu), resolvido no layout server.
   * Substitui o LogoutButton solto do desktop: a plataforma inteira tem UM
   * componente de usuário autenticado, não um por módulo.
   */
  userMenu?: ReactNode;
};

export function PatientShell({ children, userMenu }: PatientShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="patient-dashboard min-h-screen">
      <PatientAmbientLayer />

      <a
        href="#patient-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-ink focus:shadow-md focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Pular para o conteúdo
      </a>

      {/* A2 · a moldura deixa de ser barra de aplicativo.
          O fundo sólido com borda cinza fazia o topo ler como painel: uma
          faixa opaca separando "sistema" de "conteúdo". Aqui ele passa a
          repousar SOBRE a atmosfera da casa — véu translúcido, sem corte —
          e a única linha que resta é um fio de dourado, que é o que a marca
          já usa lá fora. Nada foi acrescentado: é o mesmo header, com menos
          peso. */}
      {/* PAPEL, NÃO VIDRO. A primeira versão desta faixa usava `backdrop-blur`
          e a guarda de materiais derrubou — com razão: blur de fundo é
          proibido nesta casa (Sistema Visual §3), e o cartão dela já é
          superfície fosca. O efeito desejado nunca foi vidro: era o topo
          deixar de ser uma barra que corta a página. Papel opaco sobre a
          atmosfera, com fio de dourado no lugar da borda cinza, entrega isso
          sem material proibido. */}
      <header className="sticky top-0 z-20 border-b border-[color-mix(in_srgb,var(--color-brand-gold)_22%,transparent)] bg-[var(--patient-linen)] print:hidden">
        <div className="mx-auto flex min-h-[4.5rem] w-full max-w-content items-center justify-between gap-4 px-4 lg:px-8">
          <Link
            href="/paciente"
            className="font-serif text-xl font-medium tracking-[0.01em] text-[var(--patient-acento)] transition-opacity duration-300 ease-standard hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Aliviar
          </Link>

          <nav aria-label="Navegação principal" className="hidden lg:block">
            <NavLinks
              pathname={pathname}
              className="flex items-center gap-1"
              /* A pílula preenchida era a marca administrativa mais visível do
                 topo: seis cápsulas coloridas competindo entre si. O item
                 ativo passa a se distinguir por PESO e por um fio de dourado
                 sob ele — presença, não realce. */
              linkClassName={(active) =>
                cn(
                  "relative flex min-h-11 items-center px-3 text-sm transition-colors duration-300 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                  "after:absolute after:inset-x-3 after:bottom-2.5 after:h-px after:transition-opacity after:duration-300",
                  active
                    ? "font-medium text-[var(--patient-ink)] after:bg-[var(--color-brand-gold)] after:opacity-100"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--patient-ink)] after:bg-[var(--color-brand-gold)] after:opacity-0 hover:after:opacity-40",
                )
              }
            />
          </nav>

          <div className="hidden lg:block">{userMenu ?? <LogoutButton className="w-auto" />}</div>

          <button
            type="button"
            /* O botão era um círculo branco sólido com borda — objeto de
               interface. Passa a repousar sobre o mesmo véu do header. */
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-brand-gold)_28%,transparent)] text-[var(--patient-ink)] transition-colors duration-300 ease-standard hover:bg-[color-mix(in_srgb,var(--color-brand-gold)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 lg:hidden"
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="right">
        <nav aria-label="Navegação principal">
          <NavLinks
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
            className="space-y-1"
            linkClassName={(active) =>
              cn(
                "flex min-h-11 items-center rounded-xl px-4 text-sm font-medium transition-colors duration-300 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--patient-linen)] hover:text-[var(--patient-ink)]",
              )
            }
          />
        </nav>
        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          <LogoutButton className="w-full" />
        </div>
      </Drawer>

      {/* O conteúdo ganha respiro: era o topo da página colado no header
          opaco. Com o header translúcido e mais folga acima, a leitura começa
          num espaço, não numa borda. Largura e gutters permanecem — mexer
          neles moveria o conteúdo, e A2 é sobre a moldura. */}
      <main id="patient-main" className="mx-auto w-full max-w-content px-4 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
        {children}
      </main>
    </div>
  );
}
