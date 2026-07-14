import Image from "next/image";

import { SectionReveal } from "@/components/landing/section-reveal";

type ReceptionSectionProps = {
  photoSrc?: string;
};

// Ambiente 1 da jornada — um corredor/hall real, luz fria de manhã. Seção
// simples (sem sticky/JS): a foto ocupa a tela cheia, o texto entra por
// cima com um scrim para contraste. O vídeo-anfitrião vem logo depois,
// como seção própria (VideoSection, já existente) — nunca escondido atrás
// deste bloco.
export function ReceptionSection({ photoSrc }: ReceptionSectionProps) {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden px-4 pb-16 lg:items-center lg:px-8">
      {photoSrc ? (
        <Image src={photoSrc} alt="" fill priority className="object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_140%_at_50%_0%,_var(--color-brand-primary)_0%,_var(--color-brand-primary-deep)_55%,_#0a2544_100%)]"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-brand-primary-deep/75 via-brand-primary-deep/25 to-transparent"
      />

      <SectionReveal className="relative mx-auto max-w-reading text-center lg:text-left">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-brand-sage-light">
          Curadoria médica independente
        </span>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-surface lg:text-4xl">
          Uma escolha de cuidado, nunca sozinho.
        </h1>
        <p className="mt-3 text-lg text-surface/85">Você não precisa saber por onde começar.</p>
      </SectionReveal>
    </section>
  );
}
