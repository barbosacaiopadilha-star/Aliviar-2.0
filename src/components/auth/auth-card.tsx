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
 * A CENA É A ENTRADA — o terraço ao entardecer, gerado pelo Fundador para
 * esta tela, em corte próprio para o computador e outro para o celular. É a
 * primeira cena ESCURA da casa, e é ela que torna o cartão possível: texto
 * claro sobre vidro só é legível quando o que está atrás é escuro. Sobre as
 * quatro cenas diurnas o mesmo cartão sumiria — foi o que a medição desta
 * sessão mostrou três vezes, e é a razão de a Landing não receber este
 * tratamento sem antes trocar as fotografias.
 *
 * O véu por cima da cena é LEVE. Ele não fabrica noite (a fotografia já a
 * traz): assenta o contraste onde a luz quente estoura, e nada mais.
 *
 * O vidro é `blur(26px)`, irmão do `blur(30px)` dos cartões da Landing —
 * uma casa, um material.
 */
export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="landing-editorial relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <CenaResponsiva cena="entrada" prioridade posicaoMobile="center 45%" />

      {/* O VÉU, agora LEVE. Quando esta tela nasceu, horas atrás, a única cena
          disponível era a recepção — clara — e o véu precisava de 58% a 72%
          para o texto claro sobreviver. A cena da entrada já é um entardecer:
          ela traz a penumbra pronta, e o véu volta ao papel que devia ter
          desde o começo — assentar o contraste onde a luz quente estoura,
          não fabricar noite.
          Quente, e não neutro: cinza sobre fotografia mata a cor e a cena
          vira chumbo. Um pouco mais forte embaixo, onde o cartão pousa. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--landing-forest-deep)_22%,transparent)_0%,color-mix(in_srgb,var(--landing-forest-deep)_38%,transparent)_100%)]"
      />

      {/* Calor ambiente da PortalExperience — continuidade de iluminação na
          entrada do produto (ADR-031). Decorativo, atrás do cartão. */}
      <div aria-hidden="true" className="ambient-warmth pointer-events-none absolute inset-0" />

      <div className="animate-fade-up relative w-full max-w-md">
        {/* O VIDRO ESCURECEU (02/09, `SIM-89`). Era creme a 11% sobre a foto —
            vidro CLARO carregando texto CLARO, e o que segurava o contraste
            era a penumbra do entardecer, que varia de canto a canto da cena.
            Medido: "Voltar ao site" a 3,47:1 e o botão "Solicitar atendimento"
            a 4,10:1, contra o mínimo de 4,5:1 para 14px — e essas são médias
            da caixa, então nos pixels mais claros era pior.
            Agora o vidro tinge de verde-profundo, a mesma cor do véu: o cartão
            passa a fabricar o próprio fundo em vez de depender de onde a foto
            estava escura. A borda continua clara, que é o que mantém a peça
            lendo como vidro e não como caixa. */}
        <div className="auth-vidro rounded-[2rem] border border-[color-mix(in_srgb,var(--color-bg-canvas)_42%,transparent)] bg-[color-mix(in_srgb,var(--landing-forest-deep)_46%,transparent)] p-7 shadow-[0_22px_70px_rgba(0,0,0,0.32)] backdrop-blur-[26px] sm:p-9">
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
              className="mx-auto h-24 w-auto brightness-0 invert"
            />

            {/* Azul CLARO, como na maquete — não branco puro. O branco chapado sobre
                vidro lê como aviso de sistema; o azul da casa, clareado, mantém a
                marca falando mesmo no título. */}
            <h1 className="font-serif text-[1.75rem] font-normal leading-tight text-[color-mix(in_srgb,var(--color-bg-canvas)_66%,var(--color-brand-primary))]">
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
