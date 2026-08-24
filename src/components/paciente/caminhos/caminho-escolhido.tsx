"use client";

import Link from "next/link";

import { CartaCaminho } from "@/components/paciente/caminhos/carta-caminho";
import type { PatientCuradoriaOption } from "@/modules/curadoria/patient-curadoria";

/**
 * O CAMINHO ESCOLHIDO — a entrega inteira num objeto só.
 *
 * Decisão do Fundador (23/08): depois que ela escolhe, a entrega estava
 * espalhada em quatro lugares — a carta dele no meio das outras duas, a
 * decisão registrada, o painel de contato e o PDF num link discreto. No
 * momento em que ela mais precisa de tudo junto (a caminho da consulta),
 * precisava caçar.
 *
 * Aqui a carta escolhida vira o documento: nome, formação verificada,
 * como ele responde ao que ela disse importar, o que encontra, do que
 * abre mão, as perguntas para levar — tudo aberto, sem clique — e no pé,
 * o que fazer com isso (levar em PDF).
 *
 * O que ele NÃO faz: elogiar a escolha, dizer que ela acertou, comparar
 * com os outros dois. Fato e preparo, nunca aplauso — a decisão é dela e
 * já foi tomada; a casa agora serve.
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
     e o React acusa hidratação inconsistente (achado de 23/08). A data que
     importa aqui é a do Brasil, onde a decisão aconteceu. */
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
      {/* CORTE DE 23/08 ("se der, reduz ou corta texto"): o cabeçalho dizia o
          nome do profissional — que a carta repete logo abaixo, maior — e um
          parágrafo explicando o que a carta é, coisa que ela mostra sozinha.
          Sobra o selo como título e uma linha com a data. De quebra, sai o
          único texto que estourava a tela estreita: um nome longo no h2 do
          cabeçalho não quebra como o da carta. */}
      <div className="max-w-[40rem] space-y-2">
        <h2 id="caminho-escolhido-titulo" className="patient-escolhido-selo">
          Seu caminho
        </h2>
        {dia ? (
          <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
            Escolhido por você em {dia}.
          </p>
        ) : null}
      </div>

      {/* A carta inteira, aberta e sem os gestos de escolha: não há mais o
          que abrir, comparar ou decidir. É leitura. */}
      <div className="patient-escolhido-carta mt-6">
        <CartaCaminho
          option={option}
          aberta
          jaConhecida={false}
          onAbrir={() => {}}
          onFechar={() => {}}
          semGestos
        />
      </div>

      <p className="mt-6">
        <Link
          href="/paciente/curadoria/imprimir"
          className="text-sm font-medium text-[var(--patient-acento)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Levar em PDF
        </Link>
      </p>
    </section>
  );
}
