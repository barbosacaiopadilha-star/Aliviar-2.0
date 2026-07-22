import type { ActiveFilterChip } from "@/alicia/lib/discovery-summary";
import type { DoctorFilters } from "@/alicia/types";
import { clearFilterChip } from "@/alicia/lib/discovery-summary";

export function ActiveFilterChips({
  chips,
  filters,
  onChange,
}: {
  chips: ActiveFilterChip[];
  onChange: (filters: DoctorFilters) => void;
  filters: DoctorFilters;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper-raised"
          onClick={() => onChange(clearFilterChip(filters, chip.key))}
        >
          <span>{chip.label}</span>
          <span aria-hidden className="text-ink-soft">
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
