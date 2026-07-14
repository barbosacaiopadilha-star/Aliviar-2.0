import Image from "next/image";

import { FinalActions } from "@/components/landing/final-actions";
import { SectionReveal } from "@/components/landing/section-reveal";

type FinalSectionProps = {
  photoSrc?: string;
};

// Ambiente 2 — o último corte da jornada. O mais aberto e silencioso de
// todos: uma frase só, muito espaço, os dois botões-porta (nunca CTA de
// venda). Mesmo padrão de fundo do ReceptionSection, sem sticky/JS.
export function FinalSection({ photoSrc }: FinalSectionProps) {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden px-4 py-24 lg:px-8">
      {photoSrc ? (
        <Image src={photoSrc} alt="" fill className="object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,_var(--color-bg-surface)_0%,_var(--color-bg-canvas)_100%)]"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-surface/25" />

      <SectionReveal className="relative mx-auto flex max-w-reading flex-col items-center gap-8 text-center">
        <p className="font-serif text-3xl font-semibold leading-snug text-ink lg:text-4xl">
          Quando estiver pronto, estamos aqui.
        </p>
        <FinalActions />
      </SectionReveal>
    </section>
  );
}
