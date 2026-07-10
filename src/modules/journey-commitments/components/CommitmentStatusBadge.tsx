import type { CommitmentStatus } from "@/modules/journey-commitments/types/commitment";
import { COMMITMENT_STATUS_LABELS } from "@/modules/journey-commitments/types/commitment";

const statusStyles: Record<CommitmentStatus, string> = {
  PENDING: "bg-[#F3E6C6] text-[#C7952E]",
  IN_PROGRESS: "bg-sage-soft text-sage",
  COMPLETED: "bg-[#E1E9F5] text-[#3D5A8C]",
  CANCELLED: "bg-[#E8E8E8] text-[#666]",
};

export function CommitmentStatusBadge({ status }: { status: CommitmentStatus }) {
  return (
    <span className={`badge ${statusStyles[status]}`}>
      {COMMITMENT_STATUS_LABELS[status]}
    </span>
  );
}
