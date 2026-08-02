"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { BarraCompatibilidade } from "@/components/paciente/caminhos/barra-compatibilidade";
import { PATIENT_DIMENSIONS } from "@/modules/paciente/experiencia";
import type { PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";

/**
 * Comparação — uma dimensão por vez, nunca uma tabela.
 *
 * Tabela com cinco linhas e três colunas convida a varrer o conjunto
 * procurando quem ganha. Aqui a pessoa olha uma dimensão de cada vez, com os
 * caminhos lado a lado dentro dela: a pergunta deixa de ser "qual é o
 * melhor?" e passa a ser "o que muda entre eles nisto que me importa?".
 *
 * Sem posição, sem numeração, sem destaque de vencedor. A ordem das colunas é
 * a mesma do Relatório — apresentação, nunca colocação.
 */
export function ComparacaoCaminhos({ options }: { options: PatientCuradoriaOption[] }) {
  const semMovimento = useReducedMotion();
  const [dimensaoAtiva, setDimensaoAtiva] = useState(0);

  if (options.length < 2) return null;

  const dimensao = PATIENT_DIMENSIONS[dimensaoAtiva]!;

  return (
    <section aria-labelledby="comparacao-titulo" className="patient-card p-6 lg:p-8">
      <h2 id="comparacao-titulo" className="patient-section-title">
        Comparar caminhos
      </h2>
      <p className="patient-body mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
        Um aspecto de cada vez, para você olhar com calma o que muda entre eles — nisto que
        importa para você.
      </p>

      {/* Seletor de dimensão: semanticamente continua `tablist` (um painel
          por dimensão, navegável por teclado), mas sem a aparência de abas —
          tab como elemento visual é banido (Sistema Visual §12). A dimensão
          ativa se marca por um fio sob a palavra, nunca por preenchimento. */}
      <div role="tablist" aria-label="Aspectos" className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        {PATIENT_DIMENSIONS.map((entrada, index) => (
          <button
            key={entrada.criterion}
            role="tab"
            type="button"
            aria-selected={index === dimensaoAtiva}
            aria-controls="comparacao-painel"
            id={`comparacao-aba-${entrada.criterion}`}
            onClick={() => setDimensaoAtiva(index)}
            className={
              index === dimensaoAtiva
                ? "inline-flex min-h-11 items-center border-b-2 border-[var(--patient-acento)] text-sm font-medium text-[var(--patient-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                : "inline-flex min-h-11 items-center border-b-2 border-transparent text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--patient-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            }
          >
            {entrada.label}
          </button>
        ))}
      </div>

      <motion.div
        id="comparacao-painel"
        role="tabpanel"
        aria-labelledby={`comparacao-aba-${dimensao.criterion}`}
        key={dimensao.criterion}
        initial={semMovimento ? false : { opacity: 0, y: 8 }}
        animate={semMovimento ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: semMovimento ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="mt-6 space-y-4"
      >
        <h3 className="font-serif text-lg text-[var(--patient-ink)]">{dimensao.label}</h3>

        {options.map((option) => {
          const entrada = option.dimensions.find((d) => d.criterion === dimensao.criterion);
          if (!entrada) return null;
          return (
            <div key={option.id} className="border-t border-[var(--color-border)] pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm font-medium text-[var(--patient-ink)]">{option.professionalName}</p>
              <div className="mt-2">
                <BarraCompatibilidade dimension={entrada} compact />
              </div>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
