"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import {
  buildDiscoveryInsights,
  buildDiscoverySummary,
  buildEmptyStateSuggestion,
  detectViewportLabel,
  getActiveFilterChips,
} from "@/alicia/lib/discovery-summary";
import { filterDoctors, filterDoctorsByBounds, getFilterOptions } from "@/alicia/lib/filter-doctors";
import type { MapBounds } from "@/alicia/lib/geo";
import { useIsClient } from "@/alicia/lib/use-is-client";
import { listDoctors } from "@/alicia/catalog";
import { EMPTY_FILTERS, type Doctor } from "@/alicia/types";
import { ActiveFilterChips } from "@/components/alicia/ActiveFilterChips";
import { DiscoveryInsightsPanel } from "@/components/alicia/DiscoveryInsightsPanel";
import { DiscoverySummary } from "@/components/alicia/DiscoverySummary";
import { DoctorFiltersPanel } from "@/components/alicia/DoctorFiltersPanel";
import { DoctorPreviewCard } from "@/components/alicia/DoctorPreviewCard";
import { DoctorResultsList } from "@/components/alicia/DoctorResultsList";
import { MapSkeleton } from "@/components/alicia/Skeletons";

const DoctorMap = dynamic(
  () => import("@/components/alicia/DoctorMap").then((module) => module.DoctorMap),
  { ssr: false },
);

export function MapExperience() {
  const mounted = useIsClient();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [previewDoctor, setPreviewDoctor] = useState<Doctor | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);

  const doctors = useMemo(() => listDoctors(), []);
  const filterOptions = useMemo(() => getFilterOptions(doctors), [doctors]);

  const filteredDoctors = useMemo(
    () => filterDoctors(doctors, filters),
    [doctors, filters],
  );

  const visibleDoctors = useMemo(() => {
    if (!hasUserMovedMap || !mapBounds) {
      return filteredDoctors;
    }

    return filterDoctorsByBounds(filteredDoctors, mapBounds);
  }, [filteredDoctors, hasUserMovedMap, mapBounds]);

  const viewportLabel = useMemo(() => {
    if (!hasUserMovedMap || !mapBounds) {
      return null;
    }

    return detectViewportLabel(mapBounds, filteredDoctors);
  }, [filteredDoctors, hasUserMovedMap, mapBounds]);

  const summary = useMemo(
    () => buildDiscoverySummary(visibleDoctors.length, filters, viewportLabel),
    [filters, viewportLabel, visibleDoctors.length],
  );

  const insights = useMemo(() => buildDiscoveryInsights(visibleDoctors), [visibleDoctors]);
  const activeChips = useMemo(() => getActiveFilterChips(filters), [filters]);
  const emptyState = useMemo(
    () => buildEmptyStateSuggestion(filters, doctors.length),
    [doctors.length, filters],
  );

  const handlePinSelect = (doctor: Doctor) => {
    setPreviewDoctor(doctor);
    setHighlightedId(doctor.id);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setPreviewDoctor(null);
    setHighlightedId(null);
    setMapBounds(null);
    setHasUserMovedMap(false);
  };

  const handleFiltersChange = (nextFilters: typeof filters) => {
    setFilters(nextFilters);
    setPreviewDoctor(null);
  };

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setHasUserMovedMap(true);
    setMapBounds(bounds);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Encontre médicos no Espírito Santo
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Filtre por especialidade, cidade ou formação. Toque em um ponto no mapa para um resumo
          rápido — ou abra o perfil completo na lista.
        </p>
      </div>

      <DiscoverySummary summary={summary} />

      {activeChips.length > 0 && (
        <ActiveFilterChips chips={activeChips} filters={filters} onChange={handleFiltersChange} />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <div className="order-2 space-y-4 lg:order-1">
          <DoctorFiltersPanel
            filters={filters}
            options={filterOptions}
            onChange={handleFiltersChange}
            onReset={handleReset}
          />
          <DiscoveryInsightsPanel insights={insights} />
          <DoctorResultsList
            doctors={visibleDoctors}
            selectedId={highlightedId}
            onHighlight={(doctor) => setHighlightedId(doctor?.id ?? null)}
            emptyState={emptyState}
            filters={filters}
            onChangeFilters={handleFiltersChange}
          />
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="card overflow-hidden p-1">
            {mounted ? (
              <DoctorMap
                doctors={visibleDoctors}
                selectedId={highlightedId ?? previewDoctor?.id ?? null}
                onSelect={handlePinSelect}
                onBoundsChange={handleBoundsChange}
              />
            ) : (
              <MapSkeleton />
            )}
          </div>
          <p className="pointer-events-none absolute left-4 top-4 z-[500] rounded-full bg-paper-raised/95 px-3 py-1 text-xs font-medium text-ink shadow-sm">
            {visibleDoctors.length === 1
              ? "1 médico nesta busca"
              : `${visibleDoctors.length} médicos nesta busca`}
            {hasUserMovedMap ? " · região visível" : ""}
          </p>
          {previewDoctor && (
            <DoctorPreviewCard
              doctor={previewDoctor}
              onClose={() => setPreviewDoctor(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
