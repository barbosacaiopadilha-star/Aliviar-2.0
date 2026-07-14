import Image from "next/image";

import { LinkButton } from "@/components/landing/link-button";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { VideoSection } from "@/components/landing/video-section";

type HeroProps = {
  photoSrc?: string;
  videoSrc?: string;
  videoPoster?: string;
};

// Hero foto full-bleed: título serifado em branco à esquerda sobre a
// fotografia real do ambiente Aliviar (com um zoom lento e contínuo —
// profundidade cinematográfica discreta), vídeo institucional como um
// cartão flutuante sobre a própria foto (nunca position:fixed — faz
// parte da composição do hero, não a acompanha pela rolagem). Verde
// (sage) é a cor predominante do hero — base e gradiente inteiros em
// tons de sage, navy removido (era a cor dominante antes, invertido a
// pedido). Traço dourado mais grosso na base marca a transição para a
// próxima seção.
export function Hero({ photoSrc, videoSrc, videoPoster }: HeroProps) {
  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden bg-[color-mix(in_srgb,_var(--color-brand-sage)_70%,_var(--color-ink))] px-4 pb-16 pt-28 lg:px-8 lg:pt-32">
      {photoSrc && (
        <Image
          src={photoSrc}
          alt=""
          fill
          priority
          className="animate-slow-zoom object-cover"
          sizes="100vw"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(120deg,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_0%,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_42%,_color-mix(in_srgb,_var(--color-brand-sage)_60%,_transparent)_70%,_color-mix(in_srgb,_var(--color-brand-sage)_40%,_transparent)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,_transparent_0%,_var(--color-brand-gold)_50%,_transparent_100%)]"
      />

      <div className="relative mx-auto grid w-full max-w-content items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div className="max-w-reading text-center lg:text-left">
          <SectionEyebrow tone="dark" align="left">
            Curadoria médica independente
          </SectionEyebrow>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] text-surface lg:text-5xl">
            Uma escolha de cuidado, <span className="text-brand-gold">nunca sozinho</span>.
          </h1>
          <div aria-hidden="true" className="gold-divider mx-auto mt-5 lg:mx-0" />
          <p className="mt-5 text-lg text-surface/85">
            Você conta sua história no seu tempo. Alguém da nossa equipe organiza um caminho
            claro, com critério — e caminha ao seu lado até a conversa que importa.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <LinkButton href="/sua-historia" variant="primary">
              Contar minha história
            </LinkButton>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
          <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
        </div>
      </div>
    </section>
  );
}
