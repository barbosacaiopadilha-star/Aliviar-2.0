"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { filterDoctors, getFilterOptions } from "@/alicia/lib/filter-doctors";
import { MOCK_DOCTORS } from "@/alicia/mocks/doctors";
import { EMPTY_FILTERS, type Doctor } from "@/alicia/types";
import { DoctorFiltersPanel } from "@/components/alicia/DoctorFiltersPanel";
import { DoctorPreviewCard } from "@/components/alicia/DoctorPreviewCard";
import { DoctorResultsList } from "@/components/alicia/DoctorResultsList";
import { MapSkeleton } from "@/components/alicia/Skeletons";

const DoctorMap = dynamic(
  () => import("@/components/alicia/DoctorMap").then((module) => module.DoctorMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

export function MapExperience() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const filterOptions = useMemo(() => getFilterOptions(MOCK_DOCTORS), []);
  const filteredDoctors = useMemo(
    () => filterDoctors(MOCK_DOCTORS, filters),
    [filters],
  );

  const handleSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Mapa de médicos</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Explore a formação e a trajetória de médicos no Brasil. Clique em um pin para ver um
          preview ou use os filtros para refinar sua busca.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <DoctorFiltersPanel
            filters={filters}
            options={filterOptions}
            resultCount={filteredDoctors.length}
            onChange={setFilters}
            onReset={() => {
              setFilters(EMPTY_FILTERS);
              setSelectedDoctor(null);
            }}
          />
          <DoctorResultsList
            doctors={filteredDoctors}
            selectedId={selectedDoctor?.id ?? null}
            onSelect={handleSelect}
          />
        </div>

        <div className="relative">
          <div className="card overflow-hidden p-1">
            <DoctorMap
              doctors={filteredDoctors}
              selectedId={selectedDoctor?.id ?? null}
              onSelect={handleSelect}
            />
          </div>
          {selectedDoctor && (
            <DoctorPreviewCard
              doctor={selectedDoctor}
              onClose={() => setSelectedDoctor(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
