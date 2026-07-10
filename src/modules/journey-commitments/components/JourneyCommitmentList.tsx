import type { JourneyCommitmentWithAssignee } from "@/modules/journey-commitments/types/commitment";
import { sortCommitments } from "@/modules/journey-commitments/types/commitment";
import { JourneyCommitmentItem } from "@/modules/journey-commitments/components/JourneyCommitmentItem";

export function JourneyCommitmentList({
  commitments,
  journeyId,
}: {
  commitments: JourneyCommitmentWithAssignee[];
  journeyId: string;
}) {
  const sorted = sortCommitments(commitments);

  if (sorted.length === 0) {
    return (
      <div className="card p-6 text-sm text-ink-soft">
        Nenhum compromisso registrado para esta Jornada.
      </div>
    );
  }

  const open = sorted.filter((c) => c.status === "PENDING" || c.status === "IN_PROGRESS");
  const closed = sorted.filter((c) => c.status === "COMPLETED" || c.status === "CANCELLED");

  return (
    <div className="space-y-4">
      {open.length > 0 && (
        <div className="space-y-3">
          {open.map((commitment) => (
            <JourneyCommitmentItem
              key={commitment.id}
              commitment={commitment}
              journeyId={journeyId}
            />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
            Concluídos e cancelados ({closed.length})
          </summary>
          <div className="mt-3 space-y-3">
            {closed.map((commitment) => (
              <JourneyCommitmentItem
                key={commitment.id}
                commitment={commitment}
                journeyId={journeyId}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
