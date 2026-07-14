import Image from "next/image";

import { SectionReveal } from "@/components/landing/section-reveal";

type ReceptionSectionProps = {
  photoSrc?: string;
};

// Ambiente 1 da jornada — cor como protagonista (azul e sálvia da própria
// logo), a foto de recepção como textura secundária por baixo do
// gradiente. O vídeo institucional não vive mais aqui: é renderizado por
// PersistentVideo (position: fixed), que observa #reception-video-sentinel
// (logo abaixo do texto) para saber quando encolher para o canto — ver
// src/components/landing/persistent-video.tsx.
export function ReceptionSection({ photoSrc }: ReceptionSectionProps) {
  return (
    <section className="relative min-h-[100svh] px-4 pb-16 pt-24 lg:px-8 lg:pt-32">
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
        className="absolute inset-0 bg-gradient-to-b from-brand-primary-deep/55 via-transparent to-transparent"
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

        <div id="reception-video-sentinel" aria-hidden="true" className="h-px" />
      </div>
    </section>
  );
}
