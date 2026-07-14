import Image from "next/image";

import { SectionReveal } from "@/components/landing/section-reveal";
import { VideoSection } from "@/components/landing/video-section";

type ReceptionSectionProps = {
  photoSrc?: string;
  videoSrc?: string;
  videoPoster?: string;
};

// Ambiente 1 da jornada — cor como protagonista (azul e sálvia da própria
// logo, mais assertivos que na versão anterior), a foto de recepção como
// textura secundária por baixo do gradiente. O vídeo é uma "janela" que
// acompanha a rolagem (position: sticky) enquanto o wrapper ainda tem
// altura sobrando — nunca remontado, então o som nunca reinicia — e se
// solta naturalmente quando a ConnectionZone começa. Em mobile, sem
// sticky: a tela não tem espaço sobrando para o efeito funcionar bem.
export function ReceptionSection({ photoSrc, videoSrc, videoPoster }: ReceptionSectionProps) {
  return (
    <section className="relative min-h-[100svh] px-4 pb-16 pt-24 lg:min-h-[190svh] lg:px-8 lg:pt-32">
      <div
        aria-hidden="true"
        className="animate-gradient-drift absolute inset-0 bg-[linear-gradient(135deg,_var(--color-brand-primary)_0%,_var(--color-brand-primary-deep)_45%,_var(--color-brand-sage)_100%)] bg-[length:200%_200%]"
      />
      {photoSrc && (
        <Image
          src={photoSrc}
          alt=""
          fill
          priority
          className="object-cover opacity-[0.18] mix-blend-overlay"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-primary-deep/60 via-transparent to-transparent"
      />

      <div className="relative mx-auto max-w-content">
        <SectionReveal className="mx-auto max-w-reading text-center lg:text-left">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-brand-sage-light">
            Curadoria médica independente
          </span>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-surface lg:text-4xl">
            Uma escolha de cuidado, nunca sozinho.
          </h1>
          <p className="mt-3 text-lg text-surface/85">Você não precisa saber por onde começar.</p>
        </SectionReveal>

        {/* Espaçador com altura própria — dá espaço de rolagem para a janela
            do vídeo "acompanhar" o scroll (position: sticky precisa que o
            contêiner pai seja mais alto que o elemento fixo). Só desktop. */}
        <div className="mt-16 lg:min-h-[130svh]">
          <div className="lg:sticky lg:top-24">
            <VideoSection variant="window" src={videoSrc} poster={videoPoster} />
          </div>
        </div>
      </div>
    </section>
  );
}
