"use client";

import { useState, useTransition } from "react";

// Após rodar a action, recarregamos a página inteira (window.location.reload)
// em vez de atualizar estado local — o resultado da execução (artefatos,
// Shortlist, novo status do caso) vem de várias fontes no Server Component
// pai; um reload garante que tudo fique consistente sem duplicar essa
// lógica de busca no cliente.

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { runAceExecutionAction } from "@/modules/concierge/actions";
import { ACE_EXECUTION_STATUS_LABELS, type AceExecution } from "@/modules/concierge/types";

type AceExecutionPanelProps = {
  caseId: string;
  initialExecution: AceExecution | null;
  canRun: boolean;
};

const BADGE_VARIANT: Record<AceExecution["status"], "default" | "sage" | "gold"> = {
  PENDING: "default",
  RUNNING: "gold",
  BLOCKED: "default",
  FAILED: "default",
  COMPLETED: "sage",
  CANCELLED: "default",
};

export function AceExecutionPanel({ caseId, initialExecution, canRun }: AceExecutionPanelProps) {
  const execution = initialExecution;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const buttonLabel =
    execution?.status === "FAILED" || execution?.status === "BLOCKED"
      ? "Retomar execução"
      : "Iniciar execução do ACE";

  const alreadyCompleted = execution?.status === "COMPLETED";
  const alreadyRunning = execution?.status === "RUNNING";

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const result = await runAceExecutionAction(caseId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // O servidor já revalidou a rota — um refresh simples da página
      // (via reload do App Router) traria o estado mais recente; como
      // isso é uma ação pontual do curador, basta recarregar a seção.
      window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      <Alert variant="info">
        Esta é uma análise interna do ACE e ainda não representa uma curadoria validada.
      </Alert>

      {execution ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-muted">Status da execução:</span>
            <Badge variant={BADGE_VARIANT[execution.status]}>{ACE_EXECUTION_STATUS_LABELS[execution.status]}</Badge>
            {execution.currentProtocol ? (
              <span className="text-sm text-ink-muted">— última etapa: {execution.currentProtocol}</span>
            ) : null}
          </div>
          <p className="text-xs text-ink-muted">
            Iniciada por {execution.startedByName} em {new Date(execution.startedAt).toLocaleString("pt-BR")}
          </p>
          {execution.failureMessage ? (
            <Alert variant={execution.status === "BLOCKED" ? "warning" : "error"}>
              {execution.failureMessage}
            </Alert>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">Nenhuma execução do ACE foi iniciada para este caso ainda.</p>
      )}

      {canRun && !alreadyCompleted && !alreadyRunning ? (
        <Button type="button" variant="secondary" className="w-full sm:w-auto" isLoading={isPending} onClick={handleRun}>
          {buttonLabel}
        </Button>
      ) : null}

      {error ? <FormMessage variant="error">{error}</FormMessage> : null}
    </div>
  );
}
