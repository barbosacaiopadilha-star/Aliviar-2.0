import { FinalActions } from "@/components/landing/final-actions";
import { GoldenThread } from "@/components/landing/golden-thread";
import { SectionContainer } from "@/components/landing/section-container";
import { SectionEyebrow } from "@/components/landing/section-eyebrow";
import { SectionReveal } from "@/components/landing/section-reveal";

export function FinalCtaSection() {
  return (
    // Presença Residual (Fase 2): o gradiente ganhou um primeiro trecho
    // (0%→10%) que parte do mesmo marfim da Biblioteca antes de assumir o
    // sage/petróleo já existente — mesma técnica de emenda cromática já
    // usada em todas as outras fronteiras de seção da Landing, aplicada
    // aqui pela primeira vez. Os estágios 55%/100% originais permanecem
    // intactos.
    <SectionContainer className="relative overflow-hidden bg-[linear-gradient(160deg,_var(--color-bg-canvas)_0%,_color-mix(in_srgb,_var(--color-brand-sage)_75%,_var(--color-ink))_10%,_color-mix(in_srgb,_var(--color-brand-sage)_70%,_var(--color-ink))_55%,_var(--color-brand-primary-deep)_100%)]">
      {/* Presença Residual (Fase 2): fecha o abraço, mesma curva de
          WhyTrust — ponto de entrada realinhado para x=180 (antes 340),
          continuando exatamente onde o Fio da Biblioteca termina (mesmo
          x=180), e ancoragem à esquerda em 18% (antes centralizada) para
          compartilhar a mesma referência horizontal do Portal e da
          Biblioteca — as três instâncias permanecem independentes, só a
          posição e o ponto de entrada foram combinados. */}
      <GoldenThread
        d="M180 0 C -20 84, -20 294, 140 392 C 220 441, 180 504, 60 560"
        className="left-[18%] top-0 h-full w-40 opacity-70 lg:w-64"
        viewBox="0 0 400 560"
      />
      <SectionReveal className="relative mx-auto flex max-w-reading flex-col items-center gap-8 text-center">
        <SectionEyebrow tone="dark">Quando estiver pronto</SectionEyebrow>
        <h2 className="font-serif text-3xl font-semibold leading-snug text-surface lg:text-4xl">
          Estamos aqui — sem pressa e sem urgência artificial.
        </h2>
        <FinalActions />
      </SectionReveal>
    </SectionContainer>
  );
}
