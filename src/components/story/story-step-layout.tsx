"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

import { SectionContainer } from "@/components/landing/section-container";
import { Button } from "@/components/ui/button";

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
}: StoryStepLayoutProps) {
  const router = useRouter();
  const progress = Math.round((step / totalSteps) * 100);
  const hasFooter = Boolean(backHref || nextHref || actionSlot);

  return (
    <SectionContainer className="pt-12 lg:pt-16">
      <div className="mx-auto max-w-reading">
        <p className="text-sm font-medium text-ink-muted">
          Passo {step} de {totalSteps}
        </p>
        <div
          aria-hidden="true"
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
        >
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-base ease-standard"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h1 className="mt-6 font-serif text-2xl font-semibold text-ink lg:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-base text-ink-muted">{description}</p> : null}

        <div className="mt-8">{children}</div>

        {hasFooter ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
