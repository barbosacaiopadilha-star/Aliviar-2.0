import Image from "next/image";

import { LinkButton } from "@/components/landing/link-button";
import { VideoSection } from "@/components/landing/video-section";

type HeroProps = {
  photoSrc?: string;
  videoSrc?: string;
  videoPoster?: string;
};

// Hero foto full-bleed: título serifado em branco à esquerda sobre a
// fotografia real do ambiente Aliviar, vídeo institucional como um cartão
// flutuante sobre a própria foto (nunca position:fixed — faz parte da
// composição do hero, não a acompanha pela rolagem). Gradiente navy→sage
// (tokens da marca) garante contraste do texto em qualquer ponto da foto.
export function Hero({ photoSrc, videoSrc, videoPoster }: HeroProps) {
  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden bg-brand-primary-deep px-4 pb-16 pt-28 lg:px-8 lg:pt-32">
      {photoSrc && (
        <Image src={photoSrc} alt="" fill priority className="object-cover" sizes="100vw" />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(115deg,_var(--color-brand-primary-deep)_0%,_color-mix(in_srgb,_var(--color-brand-primary-deep)_78%,_transparent)_38%,_color-mix(in_srgb,_var(--color-brand-primary)_35%,_transparent)_68%,_transparent_100%)]"
      />

      <div className="relative mx-auto grid w-full max-w-content items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div className="max-w-reading text-center lg:text-left">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-brand-sage-light">
            <span aria-hidden="true" className="h-px w-8 bg-brand-gold/70" />
            Curadoria médica independente
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.08] text-surface lg:text-5xl">
            Uma escolha de cuidado, nunca sozinho.
          </h1>
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
