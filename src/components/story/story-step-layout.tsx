"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { SectionContainer } from "@/components/ui/section-container";
import { SectionReveal } from "@/components/ui/section-reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

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
                      ? "w-3 bg-brand-gold/40"
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

        <div className="mt-10">{children}</div>

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
                  className="sm:w-auto"
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
