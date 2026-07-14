import Image from "next/image";
import Link from "next/link";

// Multi-coluna (Landing V2) — nenhum canal de contato inventado (sem
// telefone/e-mail/endereço fictício): só navegação interna já existente
// no site. Logo oficial em public/brand/logo-aliviar-transparent.png
// (fundo removido, ver public-header.tsx). Fundo navy escuro (não mais
// branco) — fecha a Landing no mesmo tom do Hero/CTA final, reduzindo o
// branco geral da página.
const FOOTER_LINKS = [
  { label: "Início", href: "/" },
  { label: "Dúvidas frequentes", href: "#duvidas" },
  { label: "Contar minha história", href: "/sua-historia" },
  { label: "Entrar", href: "/login" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t-2 border-brand-gold/60 bg-brand-primary-deep">
      <div className="mx-auto max-w-content px-4 pt-16 lg:px-8">
        <p className="max-w-reading font-serif text-2xl font-medium leading-snug text-surface lg:text-3xl">
          Uma decisão tão importante merece companhia, do início ao fim.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-content gap-10 px-4 pb-14 pt-10 lg:grid-cols-[1.3fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-deep"
          >
            <Image
              src="/brand/logo-aliviar-transparent.png"
              alt="Aliviar — Curadoria Médica Independente"
              width={1254}
              height={1254}
              className="h-20 w-20 lg:h-24 lg:w-24"
            />
          </Link>
          <p className="max-w-reading text-sm text-surface/70">
            Curadoria médica independente, com acompanhamento humano em cada etapa — do primeiro
            contato à conversa que importa.
          </p>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-sage-light">
            Navegação
          </span>
          <ul className="mt-3 space-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-underline text-sm text-surface/85 transition-colors duration-fast ease-standard hover:text-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-surface/10">
        <p className="mx-auto max-w-content px-4 py-4 text-xs text-surface/60 lg:px-8">
          © {new Date().getFullYear()} Aliviar. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
