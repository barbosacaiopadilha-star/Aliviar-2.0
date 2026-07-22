export type InstitutionKind =
  | "Universidade"
  | "Hospital"
  | "Instituto"
  | "Clínica"
  | "Consultório"
  | "Sociedade";

export type InstitutionCatalogEntry = {
  city: string;
  state: string;
  type: InstitutionKind;
  description?: string;
};

export const INSTITUTION_CATALOG: Record<string, InstitutionCatalogEntry> = {
  "Universidade Federal do Espírito Santo (UFES)": {
    city: "Vitória",
    state: "ES",
    type: "Universidade",
    description: "Universidade pública federal sediada no Espírito Santo.",
  },
  "Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)": {
    city: "Vitória",
    state: "ES",
    type: "Universidade",
    description: "Faculdade de Medicina privada em Vitória.",
  },
  "Hospital Municipal Miguel Couto (HMMC)": {
    city: "Rio de Janeiro",
    state: "RJ",
    type: "Hospital",
    description: "Hospital municipal de referência em ortopedia no Rio de Janeiro.",
  },
  "Instituto Nacional de Traumatologia e Ortopedia (INTO)": {
    city: "Rio de Janeiro",
    state: "RJ",
    type: "Instituto",
    description: "Instituto federal de referência em traumatologia e ortopedia.",
  },
  "Hospital do Servidor Público Estadual de São Paulo (IAMSPE)": {
    city: "São Paulo",
    state: "SP",
    type: "Hospital",
    description: "Hospital de referência em ortopedia e traumatologia em São Paulo.",
  },
  "Instituto do Cérebro de Paulo Niemeyer (IFOR)": {
    city: "São Paulo",
    state: "SP",
    type: "Instituto",
    description: "Instituto de referência em neurocirurgia e ortopedia em São Paulo.",
  },
  "Instituto Capixaba de Ortopedia e Traumatologia (ICOT)": {
    city: "Vitória",
    state: "ES",
    type: "Instituto",
    description: "Instituto de ortopedia e traumatologia na Grande Vitória.",
  },
  "Hospital Meridional": {
    city: "Vitória",
    state: "ES",
    type: "Hospital",
    description: "Hospital privado da região metropolitana de Vitória.",
  },
  "Hospital Bento Ferreira": {
    city: "Vitória",
    state: "ES",
    type: "Hospital",
    description: "Hospital público estadual em Vitória.",
  },
  CLIVIT: {
    city: "Vitória",
    state: "ES",
    type: "Clínica",
    description: "Centro médico de diagnóstico e tratamento em Vitória.",
  },
  "Clínica Médica XV de Novembro": {
    city: "Vila Velha",
    state: "ES",
    type: "Clínica",
  },
  "Consultório de Ortopedia e Cirurgia do Joelho": {
    city: "Vitória",
    state: "ES",
    type: "Consultório",
  },
  "Instituto Neurológico do Espírito Santo (INEST)": {
    city: "Serra",
    state: "ES",
    type: "Instituto",
    description: "Instituto de referência em neurocirurgia no Espírito Santo.",
  },
  "Conjunto Hospitalar do Mandaqui": {
    city: "São Paulo",
    state: "SP",
    type: "Hospital",
    description: "Hospital de referência em neurocirurgia em São Paulo.",
  },
  "Harvard Medical School": {
    city: "Boston",
    state: "EUA",
    type: "Universidade",
    description: "Faculdade de Medicina da Universidade Harvard, nos Estados Unidos.",
  },
  "Brigham and Women's Hospital": {
    city: "Boston",
    state: "EUA",
    type: "Hospital",
    description: "Hospital universitário de referência em Boston.",
  },
  "Hospital Estadual Central (HEC)": {
    city: "Vitória",
    state: "ES",
    type: "Hospital",
    description: "Hospital público estadual em Vitória.",
  },
  "Consultório – Santa Lúcia": {
    city: "Vitória",
    state: "ES",
    type: "Consultório",
  },
  "Consultório – Alto Lage": {
    city: "Cariácica",
    state: "ES",
    type: "Consultório",
  },
  "Consultório – Praia do Canto": {
    city: "Vitória",
    state: "ES",
    type: "Consultório",
  },
  "Consultório – Praia da Costa": {
    city: "Vila Velha",
    state: "ES",
    type: "Consultório",
  },
};

export function lookupInstitution(name: string): InstitutionCatalogEntry | null {
  return INSTITUTION_CATALOG[name] ?? null;
}

export function inferInstitutionType(name: string): InstitutionKind {
  const normalized = name.toLowerCase();

  if (normalized.includes("universidade") || normalized.includes("faculdade")) {
    return "Universidade";
  }
  if (normalized.includes("hospital")) {
    return "Hospital";
  }
  if (normalized.includes("instituto")) {
    return "Instituto";
  }
  if (normalized.includes("consultório")) {
    return "Consultório";
  }
  if (normalized.includes("sociedade")) {
    return "Sociedade";
  }

  return "Clínica";
}
