import { canonicalizeCityName } from "@/alicia/lib/city-standardization";

import { DEFAULT_CRM_UF, SCOPED_SPECIALTIES } from "./constants";

const SPECIALTY_ALIASES: Record<string, string> = {
  ortopedia: "Ortopedia",
  "ortopedia e traumatologia": "Ortopedia",
  neurocirurgia: "Neurocirurgia",
  "cirurgia neurologica": "Neurocirurgia",
};

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeName(value: string): string {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return trimmed;
  }

  const withoutPrefix = trimmed.replace(/^(dr\.?|dra\.?)\s+/i, "");
  const titled = withoutPrefix
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  const prefix = /^dra\.?/i.test(trimmed) ? "Dra." : /^dr\.?/i.test(trimmed) ? "Dr." : "";
  return prefix ? `${prefix} ${titled}` : titled;
}

export function normalizeUf(value: string): string {
  return normalizeWhitespace(value).toUpperCase().slice(0, 2) || DEFAULT_CRM_UF;
}

export function normalizeCrm(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.length <= 3) {
    return digits;
  }
  return `${digits.slice(0, -3)}.${digits.slice(-3)}`;
}

export function normalizeSpecialty(value: string): string {
  const key = stripAccents(normalizeWhitespace(value)).toLowerCase();
  if (SPECIALTY_ALIASES[key]) {
    return SPECIALTY_ALIASES[key]!;
  }

  const scoped = [...SCOPED_SPECIALTIES].find(
    (specialty) => stripAccents(specialty).toLowerCase() === key,
  );
  return scoped ?? normalizeWhitespace(value);
}

export function normalizeCity(value: string): string {
  return canonicalizeCityName(normalizeWhitespace(value));
}

export function normalizeUrl(value: string | undefined): string {
  if (!value?.trim()) {
    return "";
  }

  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function normalizePhone(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) {
    return undefined;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return digits;
}

export function extractCrmParts(crm: string | undefined, crmUf: string | undefined): {
  crm: string;
  crmUf: string;
} {
  if (!crm?.trim()) {
    return { crm: "", crmUf: normalizeUf(crmUf ?? DEFAULT_CRM_UF) };
  }

  const ufMatch = crm.match(/CRM[-\s]?([A-Z]{2})/i);
  const digits = normalizeCrm(crm);
  const uf = normalizeUf(ufMatch?.[1] ?? crmUf ?? DEFAULT_CRM_UF);

  return { crm: digits, crmUf: uf };
}
