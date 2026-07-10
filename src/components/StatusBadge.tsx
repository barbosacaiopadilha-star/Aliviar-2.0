import type { PatientStatus, JourneyStatus, JourneyPriority } from "@/lib/types/database";
import { PATIENT_STATUS_LABELS, JOURNEY_STATUS_LABELS } from "@/lib/types/database";

const patientStyles: Record<PatientStatus, string> = {
  ACTIVE: "bg-sage-soft text-sage",
  INACTIVE: "bg-coral-soft text-coral",
};

const journeyStyles: Record<JourneyStatus, string> = {
  NEW: "bg-coral-soft text-coral",
  ACTIVE: "bg-sage-soft text-sage",
  WAITING: "bg-[#F3E6C6] text-[#C7952E]",
  FINISHED: "bg-[#E8E8E8] text-[#666]",
  CANCELLED: "bg-[#F5DCD6] text-[#B84C3C]",
};

export function StatusBadge({
  status,
  kind,
}: {
  status: PatientStatus | JourneyStatus;
  kind: "patient" | "journey";
}) {
  const label =
    kind === "patient"
      ? PATIENT_STATUS_LABELS[status as PatientStatus]
      : JOURNEY_STATUS_LABELS[status as JourneyStatus];
  const style =
    kind === "patient"
      ? patientStyles[status as PatientStatus]
      : journeyStyles[status as JourneyStatus];

  return <span className={`badge ${style}`}>{label}</span>;
}

export function PriorityBadge({ priority }: { priority: JourneyPriority }) {
  const styles: Record<JourneyPriority, string> = {
    LOW: "bg-[#E8E8E8] text-[#666]",
    NORMAL: "bg-sage-soft text-sage",
    HIGH: "bg-[#F3E6C6] text-[#C7952E]",
    URGENT: "bg-[#F5DCD6] text-[#B84C3C]",
  };

  const labels: Record<JourneyPriority, string> = {
    LOW: "Baixa",
    NORMAL: "Normal",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  return <span className={`badge ${styles[priority]}`}>{labels[priority]}</span>;
}
