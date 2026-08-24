"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { BarraCompatibilidade } from "@/components/paciente/caminhos/barra-compatibilidade";
import { Dobra } from "@/components/paciente/experiencia/dobra";
import { Retrato } from "@/components/paciente/caminhos/retrato";
import { FormacaoAcademicaBloco } from "@/components/patient/formacao-academica-bloco";
import { cn } from "@/components/ui/cn";
import type { PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";
import { dimensoesConhecidas, fraseDoQueNaoSabemos } from "@/modules/paciente/experiencia";
import {
  SELO_FORMACAO_VERIFICADA,
  linhasPublicas,
  ordenarParaApresentacao,
  resumoDaFormacao,
  temSeloDeVerificacao,
} from "@/modules/profiles/formacao-academica";

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
  semGestos = false,
  cabecalho,
  rodape,
}: {
  option: PatientCuradoriaOption;
  aberta: boolean;
  /** Memória de navegação: a pessoa já abriu esta carta antes. */
  jaConhecida: boolean;
  onAbrir: () => void;
  onFechar: () => void;
  /**
   * No caminho JÁ ESCOLHIDO não há o que abrir ou decidir: os gestos somem
   * e a carta vira leitura (23/08). O conteúdo é o mesmo — nenhuma
   * informação muda por causa da escolha.
   */
  semGestos?: boolean;
  /**
   * 24/08 ("tudo é card ou está dentro de card"): com a cena em força total
   * atrás da casa, o selo "Seu caminho" e o "Levar em PDF" — que flutuavam
   * sobre a fotografia — entram NA carta. Só o escolhido os usa.
   */
  cabecalho?: React.ReactNode;
  rodape?: React.ReactNode;
}) {
  const semMovimento = useReducedMotion();
  const conhecidas = dimensoesConhecidas(option.dimensions);
  const faltando = fraseDoQueNaoSabemos(option.dimensions);

  return (
    <motion.article
      layout={!semMovimento}
      transition={semMovimento ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "patient-carta patient-veu",
        aberta && "patient-carta--aberta",
        jaConhecida && !aberta && "patient-carta--conhecida",
      )}
      aria-labelledby={`carta-${option.id}-nome`}
      /* AVISO CONHECIDO (dev-only): a hidratação seletiva chega aqui DEPOIS
         de o VidroDinamico (no shell) já ter escrito `--veu-solidez`, e o
         React loga a diferença de `style`. Sem efeito para a paciente — o
         loop reescreve a cada quadro — e `suppressHydrationWarning` não cala
         o log agrupado do React 19 para style (tentado e revertido em 23/08). */
    >
      {cabecalho ? <div className="mb-5">{cabecalho}</div> : null}

      <div className="flex items-start gap-4">
        <Retrato nome={option.professionalName} />

        <div className="min-w-0 flex-1">
          {/* `break-words`: um nome pode trazer token longo sem espaço —
              sobrenome composto, registro profissional, identificador de
              cadastro. Sem isso a palavra não quebra, empurra a coluna e
              desalinha as três cartas entre si; e a pessoa lê "desarrumado"
              como "descuidado" no momento em que mais precisa confiar. */}
          <h3
            id={`carta-${option.id}-nome`}
            className="break-words font-serif text-xl font-medium leading-snug text-[var(--patient-ink)] lg:text-2xl"
          >
            {option.professionalName}
          </h3>

          {/* Nunca inventado: é a frase que o Curador escreveu no Relatório
              sobre por que este caminho está aqui — voz humana, serifa (R3). */}
          <p className="mt-2 max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]">
            {option.justification}
          </p>

          {/* ADR-077 — a formação verificada aparece ANTES de abrir a carta:
              fato compacto na ordem da trajetória, mesmo tratamento nas três
              cartas, nada comparável. Só no estado fechado (aberta, a carta
              tem o bloco completo com instituição e período) e só quando há
              formação confirmada — ausência nunca vira linha. */}
          {!aberta && resumoDaFormacao(option.formacao) ? (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
              <span className="font-medium text-[var(--patient-ink)]">
                {SELO_FORMACAO_VERIFICADA}:
              </span>{" "}
              {resumoDaFormacao(option.formacao)}
            </p>
          ) : null}

          {jaConhecida && !aberta ? (
            <p className="mt-3 text-xs font-medium text-[var(--color-brand-sage)]">
              Você já conheceu este caminho.
            </p>
          ) : null}
        </div>
      </div>

      <div className={cn("mt-5 flex flex-wrap items-center gap-3", semGestos && "hidden")}>
        <button
          type="button"
          onClick={aberta ? onFechar : onAbrir}
          aria-expanded={aberta}
          aria-controls={`carta-${option.id}-detalhe`}
          className="inline-flex min-h-11 items-center rounded-full bg-[var(--patient-acento)] px-5 text-sm font-medium text-[var(--patient-linen)] shadow-md transition-all duration-300 ease-standard hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          {aberta ? "Recolher" : "Conhecer este caminho"}
        </button>
        {/* CORTE DE 23/08 · o checkbox "Comparar" morava aqui. A comparação
            deixou de ser ferramenta com gesto: o painel abaixo da Mesa já
            mostra os três, uma dimensão por vez, sem seleção. */}
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
            {/* Decisão do Fundador (22/08, 2º risco): o estado e a PROVA
                andam juntos — os fatos da formação aninham logo abaixo da
                linha "Formação" do Perfil, com o selo. As outras dimensões
                seguem só com o estado (a prova delas é a leitura relacional,
                abaixo). A carta volta a UMA coluna. */}
            <div className="mt-6 space-y-6 border-t border-[var(--color-border)] pt-6">
              {/* Só o que se SABE vira linha. As dimensões ainda não
                  confirmadas saem daqui e viram uma frase única no fim — três
                  cartas × cinco ausências davam quinze repetições da mesma
                  frase, e a página virava um inventário de vazios. Quando nada
                  foi confirmado, a seção inteira não existe: cabeçalho sobre
                  lista vazia é promessa não cumprida. */}
              {conhecidas.length > 0 ? (
                /* A única dobra que nasce aberta: é a resposta ao que ELA
                   declarou importar — o coração da entrega. */
                <Dobra
                  titulo="Como responde ao seu Perfil"
                  rotulo="Como este caminho responde ao seu Perfil"
                  abertaInicial
                >
                  <div className="space-y-2.5">
                    {conhecidas.map((dimension) => (
                      <div key={dimension.criterion}>
                        <BarraCompatibilidade dimension={dimension} />
                        {dimension.criterion === "FORMACAO" &&
                        (option.formacao?.length ?? 0) > 0 ? (
                          <div className="mb-2 mt-2 space-y-1.5 border-l-2 border-[var(--color-border)] pl-4">
                            {temSeloDeVerificacao(option.formacao) ? (
                              <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--patient-ink)]">
                                {SELO_FORMACAO_VERIFICADA}
                              </span>
                            ) : null}
                            {/* 23/08 · fato em UMA linha, não em parágrafo:
                                título e, na mesma respiração, instituição,
                                lugar e período separados por " · ". Quatro
                                linhas por item viravam um currículo; uma
                                linha por item é uma trajetória. */}
                            {ordenarParaApresentacao([...(option.formacao ?? [])]).map((entrada, indice) => (
                              <p
                                key={`${entrada.kind}-${entrada.title}-${indice}`}
                                className="text-sm leading-relaxed text-[var(--color-ink-muted)]"
                              >
                                <span className="font-serif text-[var(--patient-ink)]">
                                  {entrada.title}
                                </span>
                                {linhasPublicas(entrada).length > 0
                                  ? ` — ${linhasPublicas(entrada).join(" · ")}`
                                  : null}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </Dobra>
              ) : null}

              {/* Os casos que o aninhamento não cobre continuam honestos: a
                  leitura indisponível declara-se, e formação confirmada SEM a
                  dimensão declarada pelo Curador aparece como bloco próprio. */}
              {/* `formacao` pode não vir (Relatório anterior à Formação
                  Acadêmica v1, ou fixture sem o campo): ausência é ausência,
                  nunca quebra de página. O defeito era latente — só aparecia
                  com a carta ABERTA, e ficou visível quando o caminho
                  escolhido passou a nascer aberto (23/08). */}
              {option.formacaoIndisponivel ||
              ((option.formacao?.length ?? 0) > 0 &&
                !conhecidas.some((d) => d.criterion === "FORMACAO")) ? (
                <FormacaoAcademicaBloco
                  formacao={
                    conhecidas.some((d) => d.criterion === "FORMACAO") ? [] : (option.formacao ?? [])
                  }
                  indisponivel={option.formacaoIndisponivel}
                />
              ) : null}

              {/* ADR-065 — a leitura relacional, já validada pelo Curador na
                  emissão. Cada frase carrega o que ELA pediu e o que o
                  profissional DECLARA — nunca uma conclusão de qualidade, e
                  nenhuma carta se compara às outras. `null` = Relatório sem a
                  seção (anterior à ADR); ausência é ausência. */}
              {option.relationalReading ? (
                <Dobra
                  titulo="No jeito como você quer ser cuidada"
                  rotulo="No jeito como você quer ser cuidada"
                >
                  <ul className="space-y-2">
                    {option.relationalReading.split("\n").filter((linha) => linha.trim()).map((frase, indice) => (
                      <li
                        key={`${indice}-${frase}`}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {frase}
                      </li>
                    ))}
                  </ul>
                </Dobra>
              ) : null}

              {/* O que o Curador encontrou, em frases com ar — nunca em
                  chips: nada repetido, contável ou empilhável representa
                  qualidade (R5), e frases não se somam num relance. */}
              {option.favorablePoints.length > 0 ? (
                <Dobra titulo="O que você encontra" rotulo="O que você encontra">
                  <ul className="space-y-2">
                    {option.favorablePoints.map((ponto, indice) => (
                      <li
                        key={`${indice}-${ponto}`}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </Dobra>
              ) : null}

              {/* A outra metade da frase de prontidão: o custo, com o MESMO
                  tratamento do ganho — sem marca lateral, sem cor, sem a
                  palavra "atenção" (A_MESA §5 a proíbe: severidade visual é
                  hierarquia). Assimetria de entusiasmo é indução. */}
              {option.attentionPoints.length > 0 ? (
                <Dobra titulo="Do que você abre mão" rotulo="Do que você abre mão">
                  <ul className="space-y-2">
                    {option.attentionPoints.map((ponto, indice) => (
                      <li
                        key={`${indice}-${ponto}`}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {ponto}
                      </li>
                    ))}
                  </ul>
                </Dobra>
              ) : null}

              {option.suggestedQuestions.length > 0 ? (
                <Dobra
                  titulo="Para perguntar na consulta"
                  rotulo="Perguntas para a próxima conversa"
                >
                  <ul className="space-y-2">
                    {option.suggestedQuestions.map((pergunta, indice) => (
                      <li
                        key={`${indice}-${pergunta}`}
                        className="max-w-prose font-serif text-sm leading-relaxed text-[var(--patient-ink)]"
                      >
                        {pergunta}
                      </li>
                    ))}
                  </ul>
                </Dobra>
              ) : null}

              {option.relationToWeights ? (
                <Dobra titulo="A leitura completa" rotulo="A leitura completa">
                  <p className="max-w-prose font-serif text-sm leading-[1.65] text-[var(--patient-ink)]">
                    {option.relationToWeights}
                  </p>
                </Dobra>
              ) : null}

              {/* A ausência, dita uma vez e por último — depois de tudo que se
                  sabe, nunca antes. Sem cor de alerta e sem marca lateral:
                  falta de informação não é demérito do profissional, e a
                  frase termina na saída (falar com a Curadora), não na falta. */}
              {faltando ? (
                <Dobra titulo="O que ainda não sabemos" rotulo="O que ainda não sabemos">
                  <p className="max-w-prose font-serif text-sm leading-relaxed text-[var(--color-ink-muted)]">
                    {faltando}
                  </p>
                </Dobra>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {rodape ? <div className="mt-6">{rodape}</div> : null}
    </motion.article>
  );
}
