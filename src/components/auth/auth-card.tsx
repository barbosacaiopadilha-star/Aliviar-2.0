import "@/app/landing-editorial.css";

import Image from "next/image";
import type { ReactNode } from "react";

import { CenaResponsiva } from "@/components/landing/editorial/cena-responsiva";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    /* A ENTRADA GANHA A CENA — 27/08.
       A ADR-031 autorizou "continuidade visual entre PortalExperience →
       Login → Sua História", e o que chegou aqui foi só o `ambient-warmth`:
       dois gradientes a 10% e 12%, invisíveis na prática. Quem atravessava
       quatro ambientes fotográficos batia numa sala branca na porta.
       Agora a porta é a MESMA Recepção da Landing — mesmo componente
       (`CenaResponsiva`), mesmo arquivo de imagem, mesma decisão de
       enquadramento. A ADR-031 é explícita sobre o método: editar o que
       existe, "nunca criando segunda Landing, navegação, Design System ou
       componente paralelo" — por isso nada aqui é cópia.
       O `landing-editorial` vem junto porque é onde `.landing-cena` vive; ele
       traz também o linho e o grão de papel da casa, que É a continuidade
       pedida. */
    <div className="landing-editorial relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <CenaResponsiva cena="recepcao" prioridade posicaoMobile="center 22%" />

      {/* O VÉU DA ENTRADA. A cena fica presente e recuada — quem chega precisa
          ler um formulário, não admirar uma fotografia. Sem isto a foto
          disputaria com os campos, e a lição do `SIM-61` vale aqui também:
          nada de texto sobre imagem crua. O cartão em si é opaco, então a
          legibilidade do formulário não depende deste véu — ele serve ao
          sossego, não ao contraste. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--color-bg-canvas)_72%,transparent)]"
      />

      {/* Calor ambiente da PortalExperience — continuidade de iluminação
          na entrada do produto (ADR-031). Decorativo, atrás do cartão. */}
      <div
        aria-hidden="true"
        className="ambient-warmth pointer-events-none absolute inset-0"
      />
      <div className="animate-fade-up relative w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <header className="space-y-3 text-center">
          {/* A entrada do produto exibia só o nome em texto — a marca chegava
              à Landing e sumia na porta de quem entra. Mesma logo e mesmo alt
              do header público (`public-header.tsx`): a identidade não muda
              entre o site e o acesso. */}
          {/* Mesmo símbolo do cabeçalho público (23/08): quando o logotipo
              isolado entrou no site, esta tela ficou com a versão anterior
              da marca — duas identidades no mesmo produto, exatamente o
              que o comentário acima promete que não acontece. */}
          <Image
            src="/brand/aliviar-simbolo.png"
            alt="Aliviar — Curadoria Médica Independente"
            width={256}
            height={266}
            priority
            className="mx-auto h-12 w-auto"
          />
          <p className="font-serif text-sm font-medium tracking-wide text-brand-primary">
            Aliviar Curadoria Médica
          </p>
          <h1 className="font-serif text-3xl font-semibold text-ink">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </header>
        {children}
        {footer ? (
          <footer className="border-t border-border pt-4 text-center text-sm">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
