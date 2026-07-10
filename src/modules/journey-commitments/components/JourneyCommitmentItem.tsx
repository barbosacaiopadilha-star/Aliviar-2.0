"use client";

import { useTransition } from "react";
import type { JourneyCommitmentWithAssignee } from "@/modules/journey-commitments/types/commitment";
import type { CommitmentStatus } from "@/modules/journey-commitments/types/commitment";
import {
  formatCommitmentDate,
  formatCommitmentDateTime,
  isOverdue,
  OPEN_COMMITMENT_STATUSES,
} from "@/modules/journey-commitments/types/commitment";
import { CommitmentStatusBadge } from "@/modules/journey-commitments/components/CommitmentStatusBadge";
import { updateCommitmentStatusAction } from "@/modules/journey-commitments/actions/commitments";

export function JourneyCommitmentItem({
  commitment,
  journeyId,
}: {
  commitment: JourneyCommitmentWithAssignee;
  journeyId: string;
}) {
  const [pending, startTransition] = useTransition();
  const overdue = isOverdue(commitment);
  const isOpen = OPEN_COMMITMENT_STATUSES.includes(commitment.status);

  function handleStatusChange(newStatus: CommitmentStatus) {
    startTransition(async () => {
      await updateCommitmentStatusAction(journeyId, commitment.id, newStatus);
    });
  }

  return (
    <article
      className={`card p-4 ${overdue ? "border-l-4 border-l-[#B84C3C]" : ""} ${
        commitment.status === "CANCELLED" ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-ink">{commitment.title}</h3>
            {overdue && (
              <span className="badge bg-[#F5DCD6] text-[#B84C3C]">Vencido</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
            <CommitmentStatusBadge status={commitment.status} />
            <span>Responsável: {commitment.assignee?.full_name ?? "—"}</span>
            <span>Prazo: {formatCommitmentDate(commitment.due_date)}</span>
          </div>
          {commitment.status === "COMPLETED" && commitment.completed_at && (
            <p className="text-xs text-ink-soft">
              Concluído em {formatCommitmentDateTime(commitment.completed_at)}
            </p>
          )}
          {commitment.status === "CANCELLED" && commitment.cancelled_at && (
            <p className="text-xs text-ink-soft">
              Cancelado em {formatCommitmentDateTime(commitment.cancelled_at)}
            </p>
          )}
        </div>

        {isOpen && (
          <div className="flex flex-wrap gap-2">
            {commitment.status === "PENDING" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => handleStatusChange("IN_PROGRESS")}
                className="btn-secondary text-xs"
              >
                Iniciar
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => handleStatusChange("COMPLETED")}
              className="btn-primary text-xs"
            >
              Concluir
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => handleStatusChange("CANCELLED")}
              className="btn-secondary text-xs text-[#B84C3C]"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
