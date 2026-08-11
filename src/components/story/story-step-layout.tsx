"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { SectionContainer } from "@/components/ui/section-container";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

/**
 * O campo de resposta narrativa — papel, e do tamanho de uma fala.
 *
 * A5 · o `Textarea` da casa é primitivo compartilhado (Mesa, admin, portal), e
 * mexer nele para melhorar a Recepção mudaria dezenas de telas. Aqui vai só o
 * que "Sua História" precisa, por cima dele:
 *
 * - **papel quente, opaco.** Era `bg-surface`, branco puro, flutuando sobre a
 *   arquitetura — a caixa de sistema que o §17 proíbe. Sólido também é o que
 *   permite manter a atmosfera atrás sem disputar a leitura (§16).
 * - **altura e corpo de texto de resposta aberta.** Sete linhas num campo de
 *   14px trata a história de alguém como observação de cadastro. Quem escreve
 *   aqui está contando o que está vivendo (§10).
 * - **fio discreto no lugar da borda de formulário**, e o foco continua sendo
 *   o do sistema — acessibilidade não é o que estamos repaginando.
 */
export const CAMPO_NARRATIVO =
  "min-h-56 rounded-md border-[color-mix(in_srgb,var(--color-brand-gold)_28%,transparent)] bg-[var(--color-bg-canvas-warm)] px-5 py-4 text-[1.0625rem] leading-relaxed lg:min-h-64";

type StoryStepLayoutProps = {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  children: ReactNode;
  backHref?: string;
  nextHref?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  actionSlot?: ReactNode;
  /** Conteúdo leve abaixo da pergunta (ex.: indicador de autosave) — nunca
   *  parte da navegação em si. */
  footerSlot?: ReactNode;
  /**
   * Marca a ação como um momento-porta da jornada (entrar, entregar) e
   * aplica a soleira dourada — o mesmo gesto da Landing, nunca um novo.
   * Só a capa e a revisão a usam; "Continuar" entre perguntas é passo,
   * não porta (validação 2.4, mudança H).
   */
  nextIsPorta?: boolean;
};

export function StoryStepLayout({
  step,
  totalSteps,
  title,
  description,
  children,
  backHref,
  nextHref,
  nextLabel = "Continuar",
  nextDisabled = false,
  actionSlot,
  footerSlot,
  nextIsPorta = false,
}: StoryStepLayoutProps) {
  const router = useRouter();
  const hasFooter = Boolean(backHref || nextHref || actionSlot);

  return (
    <SectionContainer className="py-16 lg:py-24">
      <div className="mx-auto max-w-reading">
        {/* Sinaliza progresso sem ler como formulário administrativo — traços
            finos em vez do texto "Passo X de Y" (mantido só para leitor de
            tela, via sr-only). */}
        <span className="sr-only">
          Passo {step} de {totalSteps}
        </span>
        <div aria-hidden="true" className="mb-10 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, index) => index + 1).map(
            (mark) => (
              <span
                key={mark}
                className={cn(
                  "h-1 rounded-full transition-[width,background-color] duration-slow ease-standard",
                  mark === step
                    ? "w-8 bg-brand-gold"
                    : mark < step
                      ? "w-3 bg-[color-mix(in_srgb,var(--color-brand-gold)_40%,transparent)]"
                      : "w-3 bg-border",
                )}
              />
            ),
          )}
        </div>

        <SectionReveal>
          <h1 className="font-serif text-3xl font-medium leading-tight text-ink lg:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </SectionReveal>

        {/* A pergunta é fala; o campo é resposta. Entre os dois, ar — sem o
            respiro, pergunta + rótulo + campo agrupam como bloco de
            formulário (validação 2.4, mudança F). */}
        <div className="mt-12 lg:mt-14">{children}</div>

        {footerSlot ? <div className="mt-6">{footerSlot}</div> : null}

        {hasFooter ? (
          <div className="mt-14 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-ink-muted transition-colors duration-fast ease-standard hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                Voltar
              </Link>
            ) : (
              <span />
            )}

            {actionSlot ??
              (nextHref ? (
                <Button
                  type="button"
                  onClick={() => router.push(nextHref)}
                  disabled={nextDisabled}
                  className={cn("sm:w-auto", nextIsPorta && "landing-porta")}
                >
                  {nextLabel}
                </Button>
              ) : null)}
          </div>
        ) : null}
      </div>
    </SectionContainer>
  );
}
