import type { Metadata } from "next";
import Link from "next/link";

import { AliciaShell } from "@/components/alicia/AliciaShell";

export const metadata: Metadata = {
  title: "AliCIA — Escolha com informação",
  description:
    "Descubra a formação e a trajetória de ortopedistas e neurocirurgiões no Espírito Santo, antes de decidir.",
};

export default function AliciaHomePage() {
  return (
    <AliciaShell compact>
      <div className="relative isolate flex min-h-[68vh] flex-col items-center justify-center text-center">
        <div className="chapter-one__atmosphere" aria-hidden>
          <div className="chapter-one__glow chapter-one__glow--warm" />
          <div className="chapter-one__glow chapter-one__glow--sage" />
        </div>

        <div className="relative z-10 max-w-xl">
          <h1 className="font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Escolha com informação, não com sorte.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-soft md:text-lg">
            Descubra a formação e a trajetória dos médicos antes de decidir.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/alicia/mapa" className="chapter-one__cta">
              Explorar mapa
            </Link>
            <Link href="/alicia/metodologia" className="btn-secondary">
              Como funciona
            </Link>
          </div>
          <p className="mt-6 text-sm text-ink-soft">
            Informações públicas, organizadas para você — sem recomendações nem pressa.
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            Piloto no Espírito Santo — ortopedia e neurocirurgia.
          </p>
        </div>
      </div>
    </AliciaShell>
  );
}
