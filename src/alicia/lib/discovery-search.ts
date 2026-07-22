import type { DoctorFilters, FilterOptions } from "@/alicia/types";

export type DiscoveryQueryResolution = {
  structured: Partial<DoctorFilters>;
  freeText: string;
  detectedTypes: string[];
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function findByNormalized(options: string[], query: string): string | null {
  const normalizedQuery = normalize(query);
  return options.find((option) => normalize(option).includes(normalizedQuery)) ?? null;
}

function findBestPracticeArea(options: string[], query: string): string | null {
  const normalizedQuery = normalize(query);
  const exact = options.find((option) => normalize(option) === normalizedQuery);
  if (exact) {
    return exact;
  }

  return (
    options.find((option) => normalize(option).includes(normalizedQuery)) ??
    options.find((option) => normalizedQuery.includes(normalize(option).split(" ")[0] ?? "")) ??
    null
  );
}

const SPECIALTY_ALIASES: Record<string, string> = {
  ortopedia: "Ortopedia",
  ortoped: "Ortopedia",
  orto: "Ortopedia",
  neuro: "Neurocirurgia",
  neurocirurgia: "Neurocirurgia",
  neurocirurgiao: "Neurocirurgia",
};

const INSTITUTION_ALIASES: Record<string, string[]> = {
  hc: ["Hospital Estadual Central (HEC)", "HEC"],
  hec: ["Hospital Estadual Central (HEC)"],
  hmmc: ["Hospital Municipal Miguel Couto (HMMC)", "HMMC"],
  into: ["Instituto Nacional de Traumatologia e Ortopedia (INTO)", "INTO"],
  inest: ["Instituto Neurológico do Espírito Santo (INEST)", "INEST"],
  icot: ["Instituto Capixaba de Ortopedia e Traumatologia (ICOT)", "ICOT"],
  ufes: ["Universidade Federal do Espírito Santo (UFES)", "UFES"],
  emescam: ["Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)", "EMESCAM"],
  iamspe: ["Hospital do Servidor Público Estadual de São Paulo (IAMSPE)", "IAMSPE"],
  bento: ["Hospital Bento Ferreira"],
};

function resolveInstitutionAlias(query: string, options: FilterOptions): string | null {
  const aliasTargets = INSTITUTION_ALIASES[normalize(query)];
  if (!aliasTargets) {
    return null;
  }

  for (const target of aliasTargets) {
    const match = options.institutions.find((institution) =>
      normalize(institution).includes(normalize(target)),
    );
    if (match) {
      return match;
    }

    const university = options.universities.find((institution) =>
      normalize(institution).includes(normalize(target)),
    );
    if (university) {
      return university;
    }
  }

  return null;
}

export function parseDiscoveryQuery(
  query: string,
  options: FilterOptions,
): DiscoveryQueryResolution {
  const trimmed = query.trim();
  if (!trimmed) {
    return { structured: {}, freeText: "", detectedTypes: [] };
  }

  const normalized = normalize(trimmed);
  const structured: Partial<DoctorFilters> = {};
  const detectedTypes: string[] = [];

  const specialty = SPECIALTY_ALIASES[normalized];
  if (specialty && options.specialties.includes(specialty)) {
    structured.specialty = specialty;
    detectedTypes.push("especialidade");
    return { structured, freeText: "", detectedTypes };
  }

  const city = findByNormalized(options.cities, trimmed);
  if (city) {
    structured.city = city;
    detectedTypes.push("cidade");
    return { structured, freeText: "", detectedTypes };
  }

  const practiceArea = findBestPracticeArea(options.practiceAreas, trimmed);
  if (practiceArea) {
    structured.practiceArea = practiceArea;
    detectedTypes.push("área de atuação");
    return { structured, freeText: "", detectedTypes };
  }

  const university = findByNormalized(options.universities, trimmed);
  if (university) {
    structured.university = university;
    detectedTypes.push("graduação");
    return { structured, freeText: "", detectedTypes };
  }

  const residency = findByNormalized(options.residencies, trimmed);
  if (residency) {
    structured.residency = residency;
    detectedTypes.push("residência");
    return { structured, freeText: "", detectedTypes };
  }

  const fellowship = findByNormalized(options.fellowships, trimmed);
  if (fellowship) {
    structured.fellowship = fellowship;
    detectedTypes.push("fellowship");
    return { structured, freeText: "", detectedTypes };
  }

  const institution =
    resolveInstitutionAlias(trimmed, options) ?? findByNormalized(options.institutions, trimmed);
  if (institution) {
    if (options.universities.includes(institution)) {
      structured.university = institution;
      detectedTypes.push("graduação");
    } else if (options.residencies.includes(institution)) {
      structured.residency = institution;
      detectedTypes.push("residência");
    } else if (options.fellowships.includes(institution)) {
      structured.fellowship = institution;
      detectedTypes.push("fellowship");
    } else {
      structured.institution = institution;
      detectedTypes.push("instituição");
    }
    return { structured, freeText: "", detectedTypes };
  }

  return { structured: {}, freeText: trimmed, detectedTypes: ["texto livre"] };
}

export function applyDiscoveryQuery(
  filters: DoctorFilters,
  query: string,
  options: FilterOptions,
): DoctorFilters {
  const resolution = parseDiscoveryQuery(query, options);

  return {
    ...filters,
    ...resolution.structured,
    search: resolution.freeText,
  };
}
