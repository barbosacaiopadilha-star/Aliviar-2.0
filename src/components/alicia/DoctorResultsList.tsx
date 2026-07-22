import Link from "next/link";

import { getProfileHook } from "@/alicia/lib/profile-narrative";
import type { EmptyStateSuggestion } from "@/alicia/lib/discovery-summary";
import type { Doctor, DoctorFilters } from "@/alicia/types";
import { clearFilterChip } from "@/alicia/lib/discovery-summary";

export function DoctorResultsList({
  doctors,
  selectedId,
  onHighlight,
  emptyState,
  filters,
  onChangeFilters,
}: {
  doctors: Doctor[];
  selectedId: string | null;
  onHighlight?: (doctor: Doctor | null) => void;
  emptyState?: EmptyStateSuggestion;
  filters?: DoctorFilters;
  onChangeFilters?: (filters: DoctorFilters) => void;
}) {
  if (doctors.length === 0) {
    const canRemove =
      emptyState?.removeKey && filters && onChangeFilters
        ? () => onChangeFilters(clearFilterChip(filters, emptyState.removeKey!))
        : undefined;

    return (
      <div className="card space-y-4 p-5">
        <div>
          <p className="font-medium text-ink">Nenhum resultado com essa combinação</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {emptyState?.message ??
              "Não encontramos ninguém com esses critérios. Tente outra cidade, especialidade ou remova algum filtro."}
          </p>
        </div>
        {canRemove && (
          <button type="button" className="btn-secondary text-xs" onClick={canRemove}>
            Ampliar busca
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card divide-y divide-line">
      {doctors.map((doctor) => {
        const isHighlighted = doctor.id === selectedId;

        return (
          <Link
            key={doctor.id}
            href={`/alicia/medicos/${doctor.id}`}
            className={`block px-4 py-4 transition hover:bg-paper ${
              isHighlighted ? "bg-coral-soft/30" : ""
            }`}
            onMouseEnter={() => onHighlight?.(doctor)}
            onMouseLeave={() => onHighlight?.(null)}
            onFocus={() => onHighlight?.(doctor)}
            onBlur={() => onHighlight?.(null)}
          >
            <p className="font-medium text-ink">{doctor.name}</p>
            <p className="mt-0.5 text-sm text-coral">{doctor.specialty}</p>
            <p className="mt-1 text-xs text-ink-soft">
              {doctor.location.city}, {doctor.location.state}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
              {getProfileHook(doctor)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
