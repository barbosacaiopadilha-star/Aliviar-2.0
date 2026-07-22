import type { DataSource, Doctor, EducationEntry } from "@/alicia/types";

import {
  type InstitutionKind,
  inferInstitutionType,
  lookupInstitution,
} from "./institution-catalog";

export const UNCONFIRMED_INSTITUTION = "__PENDING_VERIFICATION__";
export const UNCONFIRMED_INSTITUTION_LABEL = "Estamos verificando esta informação.";
export const CONFIRMED_LABEL = "Confirmado";
export const VERIFYING_LABEL = "Estamos verificando";

const LEGACY_UNCONFIRMED_VALUES = new Set([
  UNCONFIRMED_INSTITUTION,
  "Ainda não confirmado",
]);

export type PresentedInstitution = {
  name: string;
  city: string | null;
  state: string | null;
  type: InstitutionKind;
  description: string | null;
};

export type TodayTimelineDetails = {
  locationLabel: string;
  practiceAreas: PracticeAreaItem[];
  institutions: PresentedInstitution[];
};

export type ProfileTimelineEntry = {
  key: string;
  yearLabel: string;
  event: string;
  explanation: string;
  institution: PresentedInstitution | null;
  confirmation: "confirmed" | "pending";
  confirmationLabel: string;
  todayDetails?: TodayTimelineDetails;
};

export type PracticeAreaItem = {
  name: string;
  explanation: string;
};

export type TrajectoryStat = {
  label: string;
  value: string;
};

export type MedicalTermDefinition = {
  term: string;
  definition: string;
};

export const MEDICAL_TERM_DEFINITIONS: MedicalTermDefinition[] = [
  {
    term: "Residência",
    definition: "O período oficial de especialização médica realizado após a graduação.",
  },
  {
    term: "Treinamento complementar",
    definition: "Especialização adicional em uma área específica, após a residência.",
  },
  {
    term: "RQE",
    definition: "Registro oficial da especialidade.",
  },
  {
    term: "CRM",
    definition: "Registro profissional do médico.",
  },
];

const PRACTICE_AREA_EXPLANATIONS: Record<string, string> = {
  "Cirurgia do quadril":
    "Tratamento de problemas e lesões do quadril, com abordagem cirúrgica quando indicada.",
  "Ortopedia e traumatologia":
    "Cuidado de lesões e doenças dos ossos, articulações e músculos.",
  Artroplastia: "Substituição de articulações desgastadas ou lesionadas por próteses.",
  "Cirurgia do ombro":
    "Tratamento cirúrgico e não cirúrgico de lesões e doenças do ombro.",
  "Cirurgia do cotovelo":
    "Tratamento de lesões e doenças que afetam o cotovelo e a mobilidade do braço.",
  "Ortopedia esportiva":
    "Prevenção e tratamento de lesões musculoesqueléticas relacionadas à prática esportiva.",
  "Pé e tornozelo": "Cuidado de lesões, deformidades e doenças dos pés e tornozelos.",
  "Trauma do pé": "Tratamento de fraturas e lesões traumáticas dos pés.",
  Artroscopia: "Procedimentos com instrumentos finos para diagnosticar e tratar articulações.",
  "Consulta ortopédica": "Avaliação clínica de queixas ortopédicas e definição de conduta.",
  "Cirurgia do joelho":
    "Tratamento de lesões e doenças do joelho, incluindo procedimentos cirúrgicos quando necessário.",
  Ortopedia: "Avaliação e tratamento de problemas do sistema musculoesquelético.",
  "Procedimentos minimamente invasivos":
    "Cirurgias com incisões menores, quando essa abordagem é indicada.",
  "Neurocirurgia oncológica":
    "Tratamento cirúrgico de tumores que afetam o sistema nervoso.",
  "Base de crânio": "Cirurgias na região da base do crânio, próxima ao cérebro e estruturas vitais.",
  "Neurocirurgia vascular":
    "Tratamento de aneurismas, malformações e outras doenças dos vasos do cérebro.",
  Hidrocefalia: "Tratamento do acúmulo de líquido dentro do cérebro.",
  Neurocirurgia: "Tratamento cirúrgico de doenças do cérebro, medula e nervos.",
  Dor: "Abordagem de quadros de dor relacionados ao sistema nervoso.",
  "Neurocirurgia pediátrica":
    "Tratamento cirúrgico de doenças neurológicas em crianças e adolescentes.",
};

const SOURCE_TRUST_LABELS: Record<string, string> = {
  "Registro profissional": "Registro público",
  "Título de especialista": "Título de especialista",
  "Registro de qualificação de especialista": "Registro de especialista",
  Instituição: "Fonte institucional",
  "Sociedade médica": "Sociedade médica",
  "Diretório profissional": "Diretório profissional",
};

const STEP_EXPLANATIONS = {
  graduation: "Primeira etapa da formação médica, necessária para exercer a profissão.",
  residency:
    "Período oficial de especialização médica realizado após a graduação.",
  fellowship: "Treinamento complementar em uma área específica da medicina.",
  today: "Onde atua atualmente e em quais áreas acompanha pacientes.",
};

export function getProfileHook(doctor: Doctor): string {
  const match = doctor.whoTheyAre.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : doctor.whoTheyAre;
}

export function getProfileIntro(doctor: Doctor): string {
  if (doctor.trajectory.trim().length > doctor.whoTheyAre.trim().length + 20) {
    return doctor.trajectory;
  }

  return doctor.whoTheyAre;
}

export type TrustOverview = {
  who: string;
  education: string;
  specialization: string;
  practice: string;
  pending: string | null;
};

function formatEducationSummary(doctor: Doctor): string {
  if (isUnconfirmedEducation(doctor.graduation)) {
    return "A graduação ainda está em verificação.";
  }

  const graduation = doctor.graduation.institution;
  const residency = doctor.residency.find((entry) => !isUnconfirmedEducation(entry));
  const fellowship = doctor.fellowships.find((entry) => !isUnconfirmedEducation(entry));

  const parts = [`Formado em ${graduation}`];
  if (residency) {
    parts.push(`com residência em ${residency.program}`);
  }
  if (fellowship) {
    parts.push(`e treinamento complementar em ${fellowship.program}`);
  }

  return `${parts.join(", ")}.`;
}

function formatSpecializationSummary(doctor: Doctor): string {
  const verifiedResidencies = doctor.residency.filter((entry) => !isUnconfirmedEducation(entry));
  const verifiedFellowships = doctor.fellowships.filter((entry) => !isUnconfirmedEducation(entry));

  if (verifiedResidencies.length === 0 && verifiedFellowships.length === 0) {
    return "A especialização ainda está em verificação.";
  }

  const parts = verifiedResidencies.map((entry) => entry.program);
  verifiedFellowships.forEach((entry) => parts.push(entry.program));

  return `Especialização em ${parts.join(", ")}.`;
}

function formatPracticeSummary(doctor: Doctor): string {
  const institutions = doctor.institutions.length
    ? doctor.institutions.map((item) => item.name).join(", ")
    : doctor.mainInstitution;

  const areas =
    doctor.practiceAreas.length > 0
      ? ` Atua em ${doctor.practiceAreas.slice(0, 3).join(", ")}.`
      : "";

  return `Atende em ${doctor.location.city}, ${doctor.location.state}, com vínculo em ${institutions}.${areas}`;
}

export function buildTrustOverview(doctor: Doctor): TrustOverview {
  return {
    who: doctor.whoTheyAre,
    education: formatEducationSummary(doctor),
    specialization: formatSpecializationSummary(doctor),
    practice: formatPracticeSummary(doctor),
    pending: formatUnverifiedFields(doctor.transparency.unverifiedFields),
  };
}

export function isUnconfirmedInstitution(value: string): boolean {
  return LEGACY_UNCONFIRMED_VALUES.has(value);
}

function isUnconfirmedEducation(entry: EducationEntry): boolean {
  return !entry.verified;
}

function hasInstitutionName(entry: EducationEntry): boolean {
  return !isUnconfirmedInstitution(entry.institution);
}

function extractYear(period?: string): string | null {
  if (!period) {
    return null;
  }

  const match = period.match(/\d{4}/);
  return match ? match[0] : null;
}

function confirmationLabel(confirmed: boolean): string {
  return confirmed ? CONFIRMED_LABEL : VERIFYING_LABEL;
}

export function presentInstitution(
  name: string,
  fallbackCity?: string,
  fallbackState?: string,
): PresentedInstitution | null {
  if (isUnconfirmedInstitution(name)) {
    return null;
  }

  const catalog = lookupInstitution(name);

  return {
    name,
    city: catalog?.city ?? fallbackCity ?? null,
    state: catalog?.state ?? fallbackState ?? null,
    type: catalog?.type ?? inferInstitutionType(name),
    description: catalog?.description ?? null,
  };
}

function buildEducationTimelineEntry(
  key: string,
  event: string,
  explanation: string,
  entry: EducationEntry,
): ProfileTimelineEntry {
  const pending = isUnconfirmedEducation(entry);

  return {
    key,
    yearLabel: pending ? "—" : (extractYear(entry.period) ?? "—"),
    event,
    explanation,
    institution: hasInstitutionName(entry) ? presentInstitution(entry.institution) : null,
    confirmation: pending ? "pending" : "confirmed",
    confirmationLabel: confirmationLabel(!pending),
  };
}

function hasStrongPracticeEvidence(doctor: Doctor): boolean {
  return doctor.transparency.sources.some((source) => {
    const label = getSourceTrustLabel(source);
    return label === "Registro público" || label === "Fonte institucional";
  });
}

function buildTodayEntry(doctor: Doctor): ProfileTimelineEntry {
  const practiceAreas = buildPracticeAreaItems(doctor);
  const institutions = doctor.institutions.map((affiliation) =>
    presentInstitution(affiliation.name, affiliation.city, doctor.location.state),
  ).filter((item): item is PresentedInstitution => item !== null);

  const practiceConfirmed = hasStrongPracticeEvidence(doctor);

  if (institutions.length === 0) {
    const fallback = presentInstitution(
      doctor.mainInstitution,
      doctor.location.city,
      doctor.location.state,
    );

    return {
      key: "today",
      yearLabel: "Hoje",
      event: "Atuação atual",
      explanation: STEP_EXPLANATIONS.today,
      institution: fallback,
      confirmation: practiceConfirmed ? "confirmed" : "pending",
      confirmationLabel: confirmationLabel(practiceConfirmed),
      todayDetails: {
        locationLabel: `${doctor.location.city}, ${doctor.location.state}`,
        practiceAreas,
        institutions: fallback ? [fallback] : [],
      },
    };
  }

  return {
    key: "today",
    yearLabel: "Hoje",
    event: "Atuação atual",
    explanation: STEP_EXPLANATIONS.today,
    institution: institutions[0] ?? null,
    confirmation: practiceConfirmed ? "confirmed" : "pending",
    confirmationLabel: confirmationLabel(practiceConfirmed),
    todayDetails: {
      locationLabel: `${doctor.location.city}, ${doctor.location.state}`,
      practiceAreas,
      institutions,
    },
  };
}

export function buildProfileTimeline(doctor: Doctor): ProfileTimelineEntry[] {
  const entries: ProfileTimelineEntry[] = [
    buildEducationTimelineEntry(
      "graduation",
      "Graduação em Medicina",
      STEP_EXPLANATIONS.graduation,
      doctor.graduation,
    ),
  ];

  doctor.residency.forEach((entry, index) => {
    entries.push(
      buildEducationTimelineEntry(
        `residency-${index}`,
        `Residência em ${entry.program}`,
        STEP_EXPLANATIONS.residency,
        entry,
      ),
    );
  });

  doctor.fellowships.forEach((entry, index) => {
    entries.push(
      buildEducationTimelineEntry(
        `fellowship-${index}`,
        `Treinamento complementar em ${entry.program}`,
        STEP_EXPLANATIONS.fellowship,
        entry,
      ),
    );
  });

  entries.push(buildTodayEntry(doctor));

  return entries;
}

export function buildPracticeAreaItems(doctor: Doctor): PracticeAreaItem[] {
  return doctor.practiceAreas.map((area) => ({
    name: area,
    explanation: PRACTICE_AREA_EXPLANATIONS[area] ?? area,
  }));
}

function countUniqueInstitutions(doctor: Doctor): number {
  const names = new Set<string>();

  if (!isUnconfirmedEducation(doctor.graduation)) {
    names.add(doctor.graduation.institution);
  }

  doctor.residency.forEach((entry) => {
    if (!isUnconfirmedEducation(entry)) {
      names.add(entry.institution);
    }
  });

  doctor.fellowships.forEach((entry) => {
    if (!isUnconfirmedEducation(entry)) {
      names.add(entry.institution);
    }
  });

  doctor.institutions.forEach((affiliation) => names.add(affiliation.name));

  return names.size;
}

export function buildTrajectoryStats(doctor: Doctor): TrajectoryStat[] {
  const graduationValue = isUnconfirmedEducation(doctor.graduation) ? "—" : "1";
  const verifiedResidencies = doctor.residency.filter((entry) => !isUnconfirmedEducation(entry));
  const verifiedFellowships = doctor.fellowships.filter((entry) => !isUnconfirmedEducation(entry));

  return [
    { label: "Graduação", value: graduationValue },
    { label: "Residências confirmadas", value: String(verifiedResidencies.length) },
    {
      label: "Treinamentos complementares",
      value: String(verifiedFellowships.length),
    },
    { label: "Instituições", value: String(countUniqueInstitutions(doctor)) },
    { label: "Áreas de atuação", value: String(doctor.practiceAreas.length) },
    { label: "Fontes consultadas", value: String(doctor.transparency.sourceCount) },
  ];
}

export function getSourceTrustLabel(source: DataSource): string {
  return SOURCE_TRUST_LABELS[source.type] ?? "Fonte pública";
}

export function formatSourceCount(count: number): string {
  return count === 1 ? "1 fonte consultada" : `${count} fontes consultadas`;
}

export function formatUnverifiedFields(fields: string[]): string | null {
  if (fields.length === 0) {
    return null;
  }

  return `Estamos verificando: ${fields.join(", ")}.`;
}

export function formatUpdatedAt(date: string): string {
  const [year, month, day] = date.split("-");
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${Number(day)} de ${months[Number(month) - 1]} de ${year}`;
}
