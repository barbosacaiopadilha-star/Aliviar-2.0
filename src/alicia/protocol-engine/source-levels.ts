import { CRM_PATTERN, RQE_PATTERN, TEOT_PATTERN } from "./constants";
import type { Evidence, SourceLevel } from "./types";

const TYPE_LEVEL_MAP: Record<string, SourceLevel> = {
  "Registro profissional": 1,
  "Registro de qualificação de especialista": 1,
  "Título de especialista": 3,
  Instituição: 2,
  "Sociedade médica": 3,
  "Registro público": 4,
  "Publicação científica": 3,
  Diretório: 6,
  "Rede social": 7,
  Outras: 7,
};

/**
 * Classifica o nível de uma fonte por regras explícitas do Protocolo Cap. 6.
 * Sem inferência — apenas mapeamento determinístico por tipo e padrões no nome.
 */
export function classifySourceLevel(name: string, type: string): SourceLevel {
  if (CRM_PATTERN.test(name) || RQE_PATTERN.test(name)) {
    return 1;
  }

  if (TEOT_PATTERN.test(name)) {
    return 3;
  }

  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();

  if (lowerName.includes("lattes") || lowerName.includes("site médico") || lowerName.includes("site oficial")) {
    return 5;
  }

  if (lowerName.includes("cnes")) {
    return 4;
  }

  if (lowerName.includes("doctoralia") || lowerName.includes("cliniguia") || lowerType.includes("diretório")) {
    return 6;
  }

  if (lowerName.includes("sbot") || lowerName.includes("sbn") || lowerName.includes("sociedade brasileira")) {
    return 3;
  }

  if (lowerName.includes("hospital") || lowerName.includes("instituto") || lowerType.includes("instituição")) {
    return 2;
  }

  const normalizedType = type.trim();
  if (normalizedType in TYPE_LEVEL_MAP) {
    return TYPE_LEVEL_MAP[normalizedType]!;
  }

  return 7;
}

export function enrichEvidence(
  input: Omit<Evidence, "level" | "supportsFields"> & {
    level?: SourceLevel;
    supportsFields?: Evidence["supportsFields"];
  },
): Evidence {
  const level = input.level ?? classifySourceLevel(input.name, input.type);
  const supportsFields =
    input.supportsFields ?? inferSupportedFields(input.name, input.type, level);

  return {
    ...input,
    level,
    supportsFields,
  };
}

function inferSupportedFields(
  name: string,
  type: string,
  level: SourceLevel,
): Evidence["supportsFields"] {
  const fromType = FIELD_SUPPORTS_FROM_TYPE(type);
  const fields = new Set<Evidence["supportsFields"][number]>(fromType);

  if (CRM_PATTERN.test(name)) {
    fields.add("crm");
    fields.add("crm_status");
    fields.add("identity");
  }

  if (RQE_PATTERN.test(name)) {
    fields.add("rqe");
    fields.add("specialty");
  }

  if (TEOT_PATTERN.test(name)) {
    fields.add("teot");
    fields.add("specialty");
  }

  if (level <= 2) {
    fields.add("current_practice");
    fields.add("trajectory_milestone");
  }

  if (level <= 3) {
    fields.add("graduation");
    fields.add("residency");
    fields.add("specialty");
  }

  return [...fields];
}

function FIELD_SUPPORTS_FROM_TYPE(type: string): Evidence["supportsFields"] {
  const normalized = type.trim();
  const mapped = {
    "Registro profissional": ["identity", "crm", "crm_status", "specialty", "city"],
    "Registro de qualificação de especialista": ["rqe", "specialty"],
    "Título de especialista": ["teot", "specialty", "trajectory_milestone"],
    Instituição: ["current_practice", "specialty", "city", "trajectory_milestone"],
    "Sociedade médica": ["rqe", "teot", "specialty", "trajectory_milestone"],
    "Registro público": ["current_practice", "city"],
    "Publicação científica": ["graduation", "residency", "trajectory_milestone"],
    Diretório: ["specialty", "current_practice"],
  } as const;

  return [...(mapped[normalized as keyof typeof mapped] ?? [])];
}

export function isHighTrustLevel(level: SourceLevel): boolean {
  return level <= 3;
}

export function isPublishableTrustLevel(level: SourceLevel): boolean {
  return level <= 4;
}
