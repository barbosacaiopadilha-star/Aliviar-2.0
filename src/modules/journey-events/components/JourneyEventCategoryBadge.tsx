import type { JourneyEventCategory } from "@/modules/journey-events/types/journey-event";
import { JOURNEY_EVENT_CATEGORY_LABELS } from "@/modules/journey-events/types/journey-event";

const categoryStyles: Record<JourneyEventCategory, string> = {
  JOURNEY: "bg-coral-soft text-coral",
  CONTACT: "bg-sage-soft text-sage",
  CONSULTATION: "bg-[#E1E9F5] text-[#3D5A8C]",
  EXAM: "bg-[#F3E6C6] text-[#C7952E]",
  DOCUMENT: "bg-[#E8E8E8] text-[#666]",
  DECISION: "bg-[#F4DFD6] text-[#D8664A]",
  OPERATIONAL: "bg-[#E1E9DD] text-[#6E8B6F]",
  OBSERVATION: "bg-[#F5F0E8] text-[#6B5F52]",
};

export function JourneyEventCategoryBadge({ category }: { category: JourneyEventCategory }) {
  return (
    <span className={`badge ${categoryStyles[category]}`}>
      {JOURNEY_EVENT_CATEGORY_LABELS[category]}
    </span>
  );
}
