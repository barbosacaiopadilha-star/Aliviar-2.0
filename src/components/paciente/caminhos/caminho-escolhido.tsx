"use client";

import Link from "next/link";

import { CartaCaminho } from "@/components/paciente/caminhos/carta-caminho";
import type { PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";

/**
 * O CAMINHO ESCOLHIDO — a entrega inteira num objeto só.
 *
 * Decisão do Fundador (23/08): depois que ela escolhe, a entrega vira UM
 * documento — a carta dele, aberta, com tudo que a Curadoria preparou.
 *
 * 24/08 ("tudo é card ou está dentro de card"): com a cena em força total
 * atrás da casa, o selo "Seu caminho", a data e o "Levar em PDF" — que
 * flutuavam sobre a fotografia — entraram NA carta, como cabeçalho e rodapé.
 * Zero texto solto sobre a foto, a gramática exata da landing.
 *
 * O que ele NÃO faz: elogiar a escolha, dizer que ela acertou, comparar
 * com os outros dois. Fato e preparo, nunca aplauso.
 */
export function CaminhoEscolhido({
  option,
  decidedAt,
}: {
  option: PatientCuradoriaOption;
  decidedAt?: string;
}) {
  /* Fuso FIXO de propósito: o servidor renderiza em UTC e o navegador no
     fuso de quem lê — sem fixar, a mesma data sai diferente dos dois lados
     e o React acusa hidratação inconsistente (achado de 23/08). */
  const dia = decidedAt
    ? new Date(decidedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      })
    : null;

  return (
    <section aria-labelledby="caminho-escolhido-titulo" className="patient-escolhido">
      <div className="patient-escolhido-carta">
        <CartaCaminho
          option={option}
          aberta
          jaConhecida={false}
          onAbrir={() => {}}
          onFechar={() => {}}
          semGestos
          cabecalho={
            <div className="space-y-1">
              <h2 id="caminho-escolhido-titulo" className="patient-escolhido-selo">
                Seu caminho
              </h2>
              {dia ? (
                <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  Escolhido por você em {dia}.
                </p>
              ) : null}
            </div>
          }
          rodape={
            <Link
              href="/paciente/curadoria/imprimir"
              className="text-sm font-medium text-[var(--patient-acento)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              Levar em PDF
            </Link>
          }
        />
      </div>
    </section>
  );
}
