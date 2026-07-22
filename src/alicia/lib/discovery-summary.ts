import type { Doctor, DoctorFilters } from "@/alicia/types";

import type { MapBounds } from "./geo";

export type ActiveFilterChip = {
  key: keyof DoctorFilters | "radiusKm";
  label: string;
  value: string | number;
};

export type DiscoveryInsightItem = {
  label: string;
  count: number;
};

export type DiscoveryInsights = {
  specialties: DiscoveryInsightItem[];
  cities: DiscoveryInsightItem[];
  institutions: DiscoveryInsightItem[];
};

export type EmptyStateSuggestion = {
  message: string;
  removeKey?: keyof DoctorFilters | "radiusKm";
};

function countBy<T>(items: T[], getKey: (item: T) => string): DiscoveryInsightItem[] {
  const counter = new Map<string, number>();

  items.forEach((item) => {
    const key = getKey(item);
    counter.set(key, (counter.get(key) ?? 0) + 1);
  });

  return [...counter.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "pt-BR"));
}

export function buildDiscoveryInsights(doctors: Doctor[]): DiscoveryInsights {
  const institutions = doctors.flatMap((doctor) => [
    doctor.mainInstitution,
    ...doctor.institutions.map((item) => item.name),
  ]);

  return {
    specialties: countBy(doctors, (doctor) => doctor.specialty),
    cities: countBy(doctors, (doctor) => doctor.location.city),
    institutions: countBy(institutions, (institution) => institution).slice(0, 6),
  };
}

export function getActiveFilterChips(filters: DoctorFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.specialty) {
    chips.push({ key: "specialty", label: filters.specialty, value: filters.specialty });
  }
  if (filters.city) {
    chips.push({ key: "city", label: filters.city, value: filters.city });
  }
  if (filters.radiusKm) {
    chips.push({
      key: "radiusKm",
      label: `Raio ${filters.radiusKm} km`,
      value: filters.radiusKm,
    });
  }
  if (filters.university) {
    chips.push({ key: "university", label: filters.university, value: filters.university });
  }
  if (filters.residency) {
    chips.push({ key: "residency", label: filters.residency, value: filters.residency });
  }
  if (filters.fellowship) {
    chips.push({ key: "fellowship", label: filters.fellowship, value: filters.fellowship });
  }
  if (filters.institution) {
    chips.push({ key: "institution", label: filters.institution, value: filters.institution });
  }
  if (filters.practiceArea) {
    chips.push({ key: "practiceArea", label: filters.practiceArea, value: filters.practiceArea });
  }
  if (filters.search) {
    chips.push({ key: "search", label: `"${filters.search}"`, value: filters.search });
  }

  return chips;
}

export function clearFilterChip(
  filters: DoctorFilters,
  key: ActiveFilterChip["key"],
): DoctorFilters {
  if (key === "radiusKm") {
    return { ...filters, radiusKm: null };
  }

  return { ...filters, [key]: "" };
}

function specialtyPhrase(count: number, specialty?: string): string {
  if (specialty === "Ortopedia") {
    return count === 1 ? "1 ortopedista" : `${count} ortopedistas`;
  }
  if (specialty === "Neurocirurgia") {
    return count === 1 ? "1 neurocirurgião" : `${count} neurocirurgiões`;
  }

  return count === 1 ? "1 médico" : `${count} médicos`;
}

function locationPhrase(filters: DoctorFilters, viewportLabel?: string | null): string {
  if (viewportLabel) {
    return `na área visível do mapa (${viewportLabel})`;
  }
  if (filters.city) {
    return `em ${filters.city}`;
  }
  return "no Espírito Santo";
}

function detailPhrase(filters: DoctorFilters): string | null {
  const details: string[] = [];

  if (filters.residency) {
    details.push(`com residência em ${filters.residency}`);
  }
  if (filters.university) {
    details.push(`formados em ${filters.university}`);
  }
  if (filters.fellowship) {
    details.push(`com fellowship em ${filters.fellowship}`);
  }
  if (filters.institution) {
    details.push(`que atuam em ${filters.institution}`);
  }
  if (filters.practiceArea) {
    details.push(`com atuação em ${filters.practiceArea.toLowerCase()}`);
  }
  if (filters.search) {
    details.push(`que correspondem a "${filters.search}"`);
  }
  if (filters.radiusKm) {
    details.push(`até ${filters.radiusKm} km de ${filters.city || "referência"}`);
  }

  return details.length > 0 ? details.join(", ") : null;
}

export function buildDiscoverySummary(
  count: number,
  filters: DoctorFilters,
  viewportLabel?: string | null,
): string {
  const head = `Você está vendo: ${specialtyPhrase(count, filters.specialty || undefined)} ${locationPhrase(filters, viewportLabel)}`;
  const details = detailPhrase(filters);

  return details ? `${head} ${details}.` : `${head}.`;
}

export function buildEmptyStateSuggestion(
  filters: DoctorFilters,
  totalDoctors: number,
): EmptyStateSuggestion {
  if (totalDoctors === 0) {
    return {
      message: "O catálogo ainda não tem médicos disponíveis nesta região.",
    };
  }

  if (filters.radiusKm) {
    return {
      message: "Nenhum médico aparece nesse raio de distância. Tente ampliar a área ou escolher outra cidade de referência.",
      removeKey: "radiusKm",
    };
  }

  if (filters.practiceArea) {
    return {
      message: `Não encontramos médicos com atuação em "${filters.practiceArea}". Tente outro termo ou remova essa área.`,
      removeKey: "practiceArea",
    };
  }

  if (filters.institution) {
    return {
      message: `Nenhum perfil atua em "${filters.institution}" com os filtros atuais.`,
      removeKey: "institution",
    };
  }

  if (filters.residency) {
    return {
      message: `Nenhum perfil tem residência em "${filters.residency}" com os filtros atuais.`,
      removeKey: "residency",
    };
  }

  if (filters.university) {
    return {
      message: `Nenhum perfil se formou em "${filters.university}" com os filtros atuais.`,
      removeKey: "university",
    };
  }

  if (filters.fellowship) {
    return {
      message: `Nenhum perfil tem fellowship em "${filters.fellowship}" com os filtros atuais.`,
      removeKey: "fellowship",
    };
  }

  if (filters.city) {
    return {
      message: `Não há médicos em ${filters.city} com os filtros atuais. Tente outra cidade da região.`,
      removeKey: "city",
    };
  }

  if (filters.specialty) {
    return {
      message: `Não há perfis de ${filters.specialty} com os filtros atuais.`,
      removeKey: "specialty",
    };
  }

  if (filters.search) {
    return {
      message: `Nada corresponde a "${filters.search}". Tente nome, cidade, especialidade ou instituição.`,
      removeKey: "search",
    };
  }

  return {
    message: "Nenhum médico corresponde a essa combinação. Remova um filtro para ampliar a busca.",
  };
}

export function detectViewportLabel(bounds: MapBounds, doctors: Doctor[]): string | null {
  const visibleCities = new Set(
    doctors
      .filter((doctor) => isDoctorWithinBounds(doctor, bounds))
      .map((doctor) => doctor.location.city),
  );

  if (visibleCities.size === 1) {
    return [...visibleCities][0] ?? null;
  }

  if (visibleCities.size > 1) {
    return "Espírito Santo";
  }

  return null;
}

export function isDoctorWithinBounds(doctor: Doctor, bounds: MapBounds): boolean {
  const { lat, lng } = doctor.location;
  return (
    lat <= bounds.north &&
    lat >= bounds.south &&
    lng <= bounds.east &&
    lng >= bounds.west
  );
}
