"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ACE_EXECUTION_STATUS_LABELS, type AceExecution, type AceExecutionEvent } from "@/modules/concierge/types";

import { AceExecutionTimeline } from "./ace-execution-timeline";

type AceExecutionsHistoryProps = {
  executions: AceExecution[];
  events: AceExecutionEvent[];
  // Quando presente, cada execução ganha um link "Ver detalhes completos"
  // para o dashboard cross-caso (só existe para administrador).
  detailBasePath?: string;
};

const STATUS_BADGE_CLASS: Record<AceExecution["status"], string> = {
  PENDING: "",
  RUNNING: "",
  BLOCKED: "text-error",
  FAILED: "text-error",
  COMPLETED: "",
  CANCELLED: "",
};

// Todas as tentativas de execução do ACE para este Caso (não só a última) —
// cada uma expansível com sua própria timeline. A execução mais recente
// começa aberta; as demais, fechadas (mas nunca escondidas: uma tentativa
// falha ou bloqueada faz parte do histórico auditável, nunca desaparece).
export function AceExecutionsHistory({ executions, events, detailBasePath }: AceExecutionsHistoryProps) {
  const [openExecutionId, setOpenExecutionId] = useState<string | null>(executions[0]?.id ?? null);

  if (executions.length === 0) {
    return (
      <EmptyState
        title="Nenhuma execução do ACE foi iniciada para este caso ainda."
        description="O histórico de tentativas aparece aqui assim que a primeira execução começar."
      />
    );
  }

  const eventsByExecutionId = new Map<string, AceExecutionEvent[]>();
  for (const event of events) {
    const list = eventsByExecutionId.get(event.executionId) ?? [];
    list.push(event);
    eventsByExecutionId.set(event.executionId, list);
  }

  return (
    <ul className="divide-y divide-border">
      {executions.map((execution, index) => {
        const isOpen = openExecutionId === execution.id;
        return (
          <li key={execution.id} className="py-3">
            <button
              type="button"
              onClick={() => setOpenExecutionId(isOpen ? null : execution.id)}
              className="flex w-full flex-wrap items-center gap-2 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Tentativa {executions.length - index}
              </span>
              <Badge className={STATUS_BADGE_CLASS[execution.status]}>
                {ACE_EXECUTION_STATUS_LABELS[execution.status]}
              </Badge>
              {execution.currentProtocol ? (
                <span className="text-xs text-ink-muted">— {execution.currentProtocol}</span>
              ) : null}
              <span className="text-xs text-ink-muted">
                iniciada por {execution.startedByName} em {new Date(execution.startedAt).toLocaleString("pt-BR")}
              </span>
              <span className="ml-auto text-xs text-brand-primary">{isOpen ? "Recolher" : "Expandir"}</span>
            </button>

            {isOpen ? (
              <div className="mt-3 space-y-3 pl-1">
                {execution.failureMessage ? (
                  <p className="text-sm text-error">{execution.failureMessage}</p>
                ) : null}
                <AceExecutionTimeline events={eventsByExecutionId.get(execution.id) ?? []} />
                {detailBasePath ? (
                  <Link
                    href={`${detailBasePath}/${execution.id}`}
                    className="inline-block text-xs font-medium text-brand-primary hover:text-brand-primary-deep"
                  >
                    Ver detalhes completos no dashboard do ACE
                  </Link>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
