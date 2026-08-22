import Image from "next/image";
import Link from "next/link";

import { SectionReveal } from "@/components/ui/section-reveal";

// Multi-coluna (Landing V2) — nenhum canal de contato inventado (sem
// telefone/e-mail/endereço fictício): só navegação interna já existente
// no site. Logo oficial em public/brand/logo-aliviar-transparent.png
// (fundo removido, ver public-header.tsx). Fundo navy escuro (não mais
// branco) — fecha a Landing no mesmo tom do Hero/CTA final, reduzindo o
// branco geral da página.
//
// O rodapé é o último capítulo da narrativa contínua da Landing (V7): a
// entrada em SectionReveal (mesmo fade-up já usado no resto da página)
// evita que a experiência termine "seca" — é a única seção que antes não
// tinha nenhum tratamento de entrada.
const FOOTER_LINKS = [
  { label: "Início", href: "/" },
  { label: "Dúvidas frequentes", href: "#duvidas" },
  // C1 (auditoria 22/08): a mesma porta do Hero e do convite — a conversa.
  { label: "Solicitar atendimento", href: "/solicitar-atendimento" },
  { label: "Entrar", href: "/login" },
] as const;

export function PublicFooter() {
  return (
    <footer className="bg-[var(--color-brand-primary)]">
      {/* Fase 6 (Origem Emocional) — a última voz da Landing ecoa a
          primeira ("nunca sozinho", acento dourado no H1 da Chegada) em
          vez de repetir "sem pressa" literalmente. Curta, não acionável,
          sem nenhuma reivindicação factual a verificar — puramente
          emocional, claramente subordinada ao CTA que já apareceu antes
          dela. */}
      <SectionReveal className="mx-auto max-w-content px-4 pt-16 lg:px-8">
        <p className="max-w-reading font-serif text-2xl font-medium leading-[1.35] text-[var(--landing-linen)] lg:text-[1.875rem]">
          Você não precisa decidir sozinho.
        </p>
      </SectionReveal>

      <SectionReveal
        delayMs={100}
        className="mx-auto grid w-full max-w-content gap-10 px-4 pb-14 pt-10 lg:grid-cols-[1.3fr_1fr] lg:px-8"
      >
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-brand-primary)]"
          >
            <Image
              src="/brand/logo-aliviar-transparent.png"
              alt="Aliviar — Curadoria Médica Independente"
              width={1254}
              height={1254}
              className="h-20 w-20 lg:h-24 lg:w-24"
            />
          </Link>
          <p className="max-w-reading text-sm text-on-dark-muted">
            Curadoria médica independente — com você em cada etapa da decisão.
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-on-dark-faint">
            Navegação
          </span>
          <ul className="mt-3 space-y-1">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                {/* py-1 (Fase 2 — Hardening, Etapa 4): alvo de toque media
                    16px de altura antes deste ajuste, abaixo do mínimo de
                    24px (WCAG 2.2, 2.5.8) — só padding, nenhuma mudança de
                    tamanho de fonte ou aparência visual do texto.
                    space-y-2 (8px) do <ul> reduzido para space-y-1 (4px)
                    para compensar a altura adicionada por link, mantendo o
                    bloco de navegação com a mesma altura total de antes. */}
                <Link
                  href={link.href}
                  className="link-underline inline-block py-1 text-sm text-on-dark-muted transition-colors duration-base ease-standard hover:text-[var(--landing-linen)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-brand-primary)]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </SectionReveal>

      <div className="border-t border-on-dark-line">
        <p className="mx-auto max-w-content px-4 py-4 text-xs text-on-dark-faint lg:px-8">
          © {new Date().getFullYear()} Aliviar. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
