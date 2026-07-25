"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { registerAcolhimentoAction } from "@/modules/curadoria/actions";

/**
 * Tela de trabalho da Fase 1 — Acolhimento.
 *
 * @metodo Engine §4 — o Motor reconhece e explica; quem declara é o Curador
 * @metodo Experience §5 — UX3: nunca esconder o próximo passo
 *
 * Por que existe: achado do Fundador em produção (2026-07-24) — a tela da
 * fase explicava os dois itens em aberto, mas não oferecia como resolvê-los
 * nem como prosseguir. O Curador lia "falta revisar o contexto" e não tinha
 * onde declarar que revisou.
 *
 * O que esta tela NUNCA faz: marcar revisão sozinha. Cada declaração é um ato
 * do Curador — o Motor só reconhece o que uma pessoa afirmou.
 */
export function AcolhimentoWorkspace({
  caseId,
  contextReviewed,
  documentsReviewed,
  nextPhaseHref,
}: {
  caseId: string;
  contextReviewed: boolean;
  documentsReviewed: boolean;
  nextPhaseHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [context, setContext] = useState(contextReviewed);
  const [documents, setDocuments] = useState(documentsReviewed);

  const done = contextReviewed && documentsReviewed;
  const dirty = context !== contextReviewed || documents !== documentsReviewed;

  function salvar() {
    if (pending) return;
    setErro(null);
    startTransition(async () => {
      const result = await registerAcolhimentoAction({
        caseId,
        contextReviewed: context,
        documentsReviewed: documents,
      });
      if (result.success) router.refresh();
      else setErro(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar o Acolhimento</CardTitle>
        <CardDescription>
          Marque o que você já fez. O registro é seu — o sistema nunca marca por você.
        </CardDescription>
      </CardHeader>

      {erro ? (
        <p role="alert" className="mb-3 rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
          {erro}
        </p>
      ) : null}

      <div className="space-y-3">
        <Checkbox
          label="Revisei o que já se sabe sobre o paciente"
          checked={context}
          disabled={contextReviewed || pending}
          onChange={(event) => setContext(event.target.checked)}
        />
        <Checkbox
          label="Revisei os documentos disponíveis"
          checked={documents}
          disabled={documentsReviewed || pending}
          onChange={(event) => setDocuments(event.target.checked)}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {!done ? (
          <Button type="button" onClick={salvar} disabled={pending || !dirty} isLoading={pending}>
            {pending ? "Registrando…" : "Registrar revisão"}
          </Button>
        ) : null}

        {done ? (
          <Link
            href={nextPhaseHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Prosseguir para a História
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className="text-xs text-ink-muted">
            A História abre quando as duas revisões estiverem registradas.
          </p>
        )}
      </div>
    </Card>
  );
}
