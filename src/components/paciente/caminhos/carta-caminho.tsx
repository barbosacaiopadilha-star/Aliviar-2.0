"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { BarraCompatibilidade } from "@/components/paciente/caminhos/barra-compatibilidade";
import { Retrato } from "@/components/paciente/caminhos/retrato";
import { FormacaoAcademicaBloco } from "@/components/patient/formacao-academica-bloco";
import { cn } from "@/components/ui/cn";
import type { PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";

/**
 * A carta de um caminho.
 *
 * Não é o card de um catálogo: é um caminho preparado para este caso. Por
 * isso a carta abre no lugar — cresce, o resto do ambiente recua, e ela
 * continua pertencendo à mesma página. Modal seria uma janela sobre outra
 * coisa; aqui a pessoa não sai de onde está.
 *
 * A ordem interna obedece ao Progressive Disclosure: resumo → como responde
 * ao Perfil → o que encontramos → o que merece atenção → perguntas →
 * leitura completa. Nada do que a Curadoria descobriu fica escondido; tudo
 * espera a vez.
 *
 * O que ela nunca faz: numerar, ordenar por preferência, marcar uma como
 * destaque, ou tratar "ainda precisamos confirmar" como defeito.
 */
export function CartaCaminho({
  option,
  aberta,
  jaConhecida,
  onAbrir,
  onFechar,
  selecionadaParaComparar,
  onAlternarComparacao,
}: {
  option: PatientCuradoriaOption;
  aberta: boolean;
  /** Memória de navegação: a pessoa já abriu esta carta antes. */
  jaConhecida: boolean;
  onAbrir: () => void;
  onFechar: () => void;
  selecionadaParaComparar: boolean;
  onAlternarComparacao: () => void;
}) {
  const semMovimento = useReducedMotion();

  return (
    <motion.article
      layout={!semMovimento}
      transition={semMovimento ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "patient-carta",
        aberta && "patient-carta--aberta",
        jaConhecida && !aberta && "patient-carta--conhecida",
      )}
      aria-labelledby={`carta-${option.id}-nome`}
    >
      <div className="flex items-start gap-4">
        <Retrato nome={option.professionalName} />

        <div className="min-w-0 flex-1">
          <h3
            id={`carta-${option.id}-nome`}
            className="font-serif text-xl font-medium leading-snug text-[var(--patient-ink)] lg:text-2xl"
          >
            {option.professionalName}
          </h3>

          {/* Nunca inventado: é a frase que o Curador escreveu no Relatório
              sobre por que este caminho está aqui — voz humana, serifa (R3). */}
          <p className="mt-2 max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]">
            {option.justification}
          </p>

          {jaConhecida && !aberta ? (
            <p className="mt-3 text-xs font-medium text-[var(--color-brand-sage)]">
              Você já conheceu este caminho.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={aberta ? onFechar : onAbrir}
          aria-expanded={aberta}
          aria-controls={`carta-${option.id}-detalhe`}
          className="inline-flex min-h-11 items-center rounded-full bg-[var(--patient-acento)] px-5 text-sm font-medium text-[var(--patient-linen)] shadow-md transition-all duration-300 ease-standard hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {aberta ? "Recolher" : "Conhecer este caminho"}
        </button>

        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-4 text-sm text-[var(--patient-ink)] transition-colors hover:bg-white focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2">
          <input
            type="checkbox"
            checked={selecionadaParaComparar}
            onChange={onAlternarComparacao}
            className="size-4 accent-[var(--patient-acento)]"
          />
          Comparar
        </label>
      </div>

      <AnimatePresence initial={false}>
        {aberta ? (
          <motion.div
            id={`carta-${option.id}-detalhe`}
            key="detalhe"
            initial={semMovimento ? false : { opacity: 0, height: 0 }}
            animate={semMovimento ? {} : { opacity: 1, height: "auto" }}
            exit={semMovimento ? {} : { opacity: 0, height: 0 }}
            transition={{ duration: semMovimento ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-6 space-y-6 border-t border-[var(--color-border)] pt-6">
              <section aria-label="Como este caminho responde ao seu Perfil">
                <h4 className="patient-section-title">Como responde ao seu Perfil</h4>
                <div className="mt-3 space-y-2.5">
                  {option.dimensions.map((dimension) => (
                    <BarraCompatibilidade key={dimension.criterion} dimension={dimension} />
                  ))}
                </div>
              </section>

              {/* Formação confirmada pela equipe — fato, não mérito: aparece
                  depois do Perfil e sem qualquer elemento comparável entre
                  cartas. Vazia, a seção simplesmente não existe; ilegível, ela
                  diz que está indisponível (F-2) em vez de fingir ausência. */}
              <FormacaoAcademicaBloco
                formacao={option.formacao}
                indisponivel={option.formacaoIndisponivel}
              />

              {/* ADR-065 — a leitura relacional, já validada pelo Curador na
                  emissão. Cada frase carrega o que ELA pediu e o que o
                  profissional DECLARA — nunca uma conclusão de qualidade, e
                  nenhuma carta se compara às outras. `null` = Relatório sem a
                  seção (anterior à ADR); ausência é ausência. */}
              {option.relationalReading ? (
                <section aria-label="Como esse caminho conversa com a forma como você quer ser cuidada">
                  <h4 className="patient-section-title">
                    Como esse caminho conversa com a forma como você quer ser cuidada
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {option.relationalReading.split("\n").filter((linha) => linha.trim()).map((frase) => (
                      <li
                        key={frase}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {frase}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* O que o Curador encontrou, em frases com ar — nunca em
                  chips: nada repetido, contável ou empilhável representa
                  qualidade (R5), e frases não se somam num relance. */}
              {option.favorablePoints.length > 0 ? (
                <section aria-label="O que você encontra neste caminho">
                  <h4 className="patient-section-title">O que você encontra neste caminho</h4>
                  <ul className="mt-3 space-y-2">
                    {option.favorablePoints.map((ponto) => (
                      <li
                        key={ponto}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {/* A outra metade da frase de prontidão: o custo, com o MESMO
                  tratamento do ganho — sem marca lateral, sem cor, sem a
                  palavra "atenção" (A_MESA §5 a proíbe: severidade visual é
                  hierarquia). Assimetria de entusiasmo é indução. */}
              {option.attentionPoints.length > 0 ? (
                <section aria-label="Do que você abre mão neste caminho">
                  <h4 className="patient-section-title">Do que você abre mão neste caminho</h4>
                  <ul className="mt-3 space-y-2">
                    {option.attentionPoints.map((ponto) => (
                      <li
                        key={ponto}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {option.suggestedQuestions.length > 0 ? (
                <section aria-label="Perguntas para a próxima conversa">
                  <h4 className="patient-section-title">Perguntas que podem ajudar na próxima conversa</h4>
                  <ul className="mt-3 space-y-2">
                    {option.suggestedQuestions.map((pergunta) => (
                      <li
                        key={pergunta}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {pergunta}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {option.relationToWeights ? (
                <section aria-label="A leitura completa">
                  <h4 className="patient-section-title">A leitura completa</h4>
                  <p className="mt-3 max-w-prose font-serif text-sm leading-[1.65] text-[var(--patient-ink)]">
                    {option.relationToWeights}
                  </p>
                </section>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
