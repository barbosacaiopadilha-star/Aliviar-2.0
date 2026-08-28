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

/**
 * A PORTA DE ENTRADA — vidro sobre a cena.
 *
 * Refeita em 27/08 a partir da maquete do Fundador: o cartão deixa de ser
 * papel branco opaco e passa a ser **vidro fosco**, com a cena atravessando.
 * A ADR-031 já autorizava a continuidade visual entre Portal, Login e Sua
 * História; o que chegava aqui era só um gradiente invisível.
 *
 * POR QUE O VÉU ESCURO, e é a decisão que sustenta todo o resto. A maquete
 * tem texto CLARO, e texto claro só é legível sobre fundo escuro. A cena de
 * entardecer que ela usa ainda não existe no repositório; a que temos é a
 * recepção, clara. O véu quente resolve os dois momentos: dá o clima de
 * entardecer sobre qualquer fotografia hoje, e quando a cena escura chegar
 * ele só precisa diminuir. Sem ele, esta tela nasceria ilegível — que é o
 * `SIM-61` de novo, e nesta sessão ele já custou caro uma vez.
 *
 * O vidro é `blur(30px)`, o mesmo dos cartões da Landing depois de 27/08 —
 * uma casa, um material.
 */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="landing-editorial relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <CenaResponsiva cena="recepcao" prioridade posicaoMobile="center 30%" />

      {/* O VÉU DA NOITE. Quente, não neutro: cinza sobre fotografia mata a cor
          e a cena vira chumbo. O gradiente escurece mais embaixo, onde o
          cartão pousa, e alivia em cima — a luz continua vindo de algum
          lugar, que é o que separa penumbra de apagão. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--landing-forest-deep)_58%,transparent)_0%,color-mix(in_srgb,var(--landing-forest-deep)_72%,transparent)_100%)]"
      />

      {/* Calor ambiente da PortalExperience — continuidade de iluminação na
          entrada do produto (ADR-031). Decorativo, atrás do cartão. */}
      <div aria-hidden="true" className="ambient-warmth pointer-events-none absolute inset-0" />

      <div className="animate-fade-up relative w-full max-w-md">
        <div className="auth-vidro rounded-[1.75rem] border border-[color-mix(in_srgb,var(--color-bg-canvas)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-bg-canvas)_14%,transparent)] p-7 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-[30px] sm:p-9">
          <header className="space-y-3 text-center">
            {/* A marca INTEIRA, em silhueta clara: aqui ela é a assinatura da
                casa, não um detalhe de acabamento como no cabeçalho. O
                arquivo é bicolor e empastaria sobre o vidro escuro. */}
            <Image
              src="/brand/aliviar-logo.png"
              alt="Aliviar — Curadoria Médica Independente"
              width={640}
              height={606}
              priority
              className="mx-auto h-20 w-auto brightness-0 invert"
            />

            <h1 className="font-serif text-[1.75rem] font-normal leading-tight text-[var(--color-on-dark)]">
              {title}
            </h1>

            {description ? (
              <p className="text-sm leading-relaxed text-[var(--color-on-dark-muted)]">
                {description}
              </p>
            ) : null}
          </header>

          <div className="mt-7">{children}</div>

          {footer ? <footer className="mt-6 text-center text-sm">{footer}</footer> : null}
        </div>
      </div>
    </div>
  );
}
