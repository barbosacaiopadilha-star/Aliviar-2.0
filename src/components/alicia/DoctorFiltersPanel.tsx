"use client";

import { useState } from "react";

import { applyDiscoveryQuery } from "@/alicia/lib/discovery-search";
import type { DoctorFilters, FilterOptions } from "@/alicia/types";

const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

type DoctorFiltersPanelProps = {
  filters: DoctorFilters;
  options: FilterOptions;
  onChange: (filters: DoctorFilters) => void;
  onReset: () => void;
};

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select
        className="field-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Qualquer</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function hasAdvancedFilters(filters: DoctorFilters): boolean {
  return Boolean(
    filters.university ||
      filters.residency ||
      filters.fellowship ||
      filters.institution ||
      filters.practiceArea,
  );
}

export function DoctorFiltersPanel({
  filters,
  options,
  onChange,
  onReset,
}: DoctorFiltersPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedFilters(filters));
  const [searchDraft, setSearchDraft] = useState(filters.search);

  const update = (partial: Partial<DoctorFilters>) => {
    onChange({ ...filters, ...partial });
  };

  const submitSearch = () => {
    onChange(applyDiscoveryQuery(filters, searchDraft, options));
    setSearchDraft("");
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">Refinar busca</h2>
          <p className="mt-1 text-xs text-ink-soft">Escolha o que importa para você.</p>
        </div>
        <button type="button" className="btn-secondary shrink-0 text-xs" onClick={onReset}>
          Limpar
        </button>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="field-label">Buscar</span>
          <div className="flex gap-2">
            <input
              type="search"
              className="field-input"
              placeholder="Nome, área, cidade ou instituição"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSearch();
                }
              }}
            />
            <button type="button" className="btn-secondary shrink-0 text-xs" onClick={submitSearch}>
              Buscar
            </button>
          </div>
        </label>

        <div className="space-y-4 border-t border-line pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Filtros</p>

          <SelectField
            label="Especialidade"
            value={filters.specialty}
            options={options.specialties}
            onChange={(specialty) => update({ specialty })}
          />

          <SelectField
            label="Cidade"
            value={filters.city}
            options={options.cities}
            onChange={(city) => update({ city })}
          />

          <label className="block">
            <span className="field-label">Distância</span>
            <select
              className="field-input"
              value={filters.radiusKm ?? ""}
              onChange={(event) =>
                update({
                  radiusKm: event.target.value ? Number(event.target.value) : null,
                })
              }
            >
              <option value="">Sem limite</option>
              {RADIUS_OPTIONS.map((radius) => (
                <option key={radius} value={radius}>
                  Até {radius} km
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className="w-full rounded-lg border border-line px-3 py-2 text-left text-sm font-medium text-ink-soft transition hover:bg-paper hover:text-ink"
          onClick={() => setShowAdvanced((open) => !open)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "Ocultar formação e atuação" : "Formação e atuação"}
        </button>

        {showAdvanced && (
          <div className="space-y-4 border-t border-line pt-4">
            <SelectField
              label="Graduação"
              value={filters.university}
              options={options.universities}
              onChange={(university) => update({ university })}
            />

            <SelectField
              label="Residência"
              value={filters.residency}
              options={options.residencies}
              onChange={(residency) => update({ residency })}
            />

            <SelectField
              label="Treinamento complementar"
              value={filters.fellowship}
              options={options.fellowships}
              onChange={(fellowship) => update({ fellowship })}
            />

            <SelectField
              label="Instituição"
              value={filters.institution}
              options={options.institutions}
              onChange={(institution) => update({ institution })}
            />

            <SelectField
              label="Área de atuação"
              value={filters.practiceArea}
              options={options.practiceAreas}
              onChange={(practiceArea) => update({ practiceArea })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
