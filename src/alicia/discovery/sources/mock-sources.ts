import type { DiscoverySource } from "../ports/discovery-source";
import type { RawDiscoveryRecord } from "../types";

function createMockSource(input: {
  id: string;
  name: string;
  priority: number;
  health: "ONLINE" | "DEGRADED" | "OFFLINE" | "UNKNOWN";
  records: RawDiscoveryRecord[];
  shouldFail?: boolean;
}): DiscoverySource {
  return {
    id: input.id,
    name: input.name,
    priority: input.priority,
    discover() {
      if (input.shouldFail) {
        return { records: [], error: `Fonte ${input.name} indisponível (mock).` };
      }
      return { records: input.records.map((record) => ({ ...record })) };
    },
    health() {
      return input.health;
    },
  };
}

const CFM_RECORDS: RawDiscoveryRecord[] = [
  {
    nome: "Dr. Ricardo Almeida",
    crm: "CRM-ES 45.210",
    especialidade: "Ortopedia",
    cidade: "Vitoria",
    estado: "ES",
    urlOrigem: "https://portal.cfm.org.br/mock/ricardo-almeida",
    confidence: 0.92,
  },
  {
    nome: "Dra. Fernanda Lopes",
    crm: "CRM-ES 38.901",
    especialidade: "Neurocirurgia",
    cidade: "Serra",
    estado: "ES",
    urlOrigem: "https://portal.cfm.org.br/mock/fernanda-lopes",
    confidence: 0.9,
  },
];

const CRM_ESTADUAL_RECORDS: RawDiscoveryRecord[] = [
  {
    nome: "Dr. Ricardo Almeida",
    crm: "CRM ES 45210",
    especialidade: "Ortopedia e Traumatologia",
    cidade: "Vitória",
    estado: "ES",
    urlOrigem: "https://crm.es.gov.br/mock/ricardo-almeida",
    confidence: 0.88,
  },
  {
    nome: "Dr. Paulo Mendes",
    crm: "CRM-ES 51.332",
    especialidade: "Ortopedia",
    cidade: "Cariacica",
    estado: "ES",
    urlOrigem: "https://crm.es.gov.br/mock/paulo-mendes",
    confidence: 0.86,
  },
];

const HOSPITAL_RECORDS: RawDiscoveryRecord[] = [
  {
    nome: "Dra. Camila Rocha",
    crm: "CRM-ES 29.887",
    especialidade: "Ortopedia",
    cidade: "Vila Velha",
    estado: "ES",
    urlOrigem: "https://icot.org.br/corpo-clinico/camila-rocha",
    telefone: "27999990001",
    confidence: 0.84,
  },
  {
    nome: "Dr. Ricardo Almeida",
    crm: "45210",
    crmUf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vitória",
    estado: "ES",
    urlOrigem: "https://hospitalmeridional.com.br/equipe/ricardo-almeida",
    confidence: 0.8,
  },
];

const UNIVERSIDADE_RECORDS: RawDiscoveryRecord[] = [
  {
    nome: "Dr. Gustavo Neri",
    crm: "CRM-ES 33.441",
    especialidade: "Neurocirurgia",
    cidade: "Vitória",
    estado: "ES",
    urlOrigem: "https://emescam.edu.br/docentes/gustavo-neri",
    confidence: 0.79,
  },
];

const SOCIEDADE_RECORDS: RawDiscoveryRecord[] = [
  {
    nome: "Dra. Helena Duarte",
    crm: "CRM-ES 40.118",
    especialidade: "Ortopedia",
    cidade: "Linhares",
    estado: "ES",
    urlOrigem: "https://sbot.org.br/mock/helena-duarte",
    confidence: 0.77,
  },
];

const SITE_INSTITUCIONAL_RECORDS: RawDiscoveryRecord[] = [
  {
    nome: "Dr. Paulo Mendes",
    crm: "CRM ES 51332",
    especialidade: "Ortopedia",
    cidade: "Cariácica",
    estado: "ES",
    urlOrigem: "https://clinicaortoes.com.br/equipe/paulo-mendes",
    telefone: "2732221100",
    confidence: 0.75,
  },
  {
    nome: "Dr. Ignorado Externo",
    crm: "CRM-SP 99.999",
    especialidade: "Dermatologia",
    cidade: "São Paulo",
    estado: "SP",
    urlOrigem: "https://example.com/derm",
    confidence: 0.3,
  },
];

export const cfmDiscoverySource = createMockSource({
  id: "cfm",
  name: "CFM",
  priority: 1,
  health: "ONLINE",
  records: CFM_RECORDS,
});

export const crmEstadualDiscoverySource = createMockSource({
  id: "crm-estadual",
  name: "CRM Estadual",
  priority: 2,
  health: "ONLINE",
  records: CRM_ESTADUAL_RECORDS,
});

export const hospitalDiscoverySource = createMockSource({
  id: "hospital",
  name: "Hospital",
  priority: 3,
  health: "DEGRADED",
  records: HOSPITAL_RECORDS,
});

export const universidadeDiscoverySource = createMockSource({
  id: "universidade",
  name: "Universidade",
  priority: 4,
  health: "ONLINE",
  records: UNIVERSIDADE_RECORDS,
});

export const sociedadeMedicaDiscoverySource = createMockSource({
  id: "sociedade-medica",
  name: "Sociedade Médica",
  priority: 5,
  health: "ONLINE",
  records: SOCIEDADE_RECORDS,
});

export const siteInstitucionalDiscoverySource = createMockSource({
  id: "site-institucional",
  name: "Site Institucional",
  priority: 6,
  health: "UNKNOWN",
  records: SITE_INSTITUCIONAL_RECORDS,
});

export const defaultDiscoverySources: DiscoverySource[] = [
  cfmDiscoverySource,
  crmEstadualDiscoverySource,
  hospitalDiscoverySource,
  universidadeDiscoverySource,
  sociedadeMedicaDiscoverySource,
  siteInstitucionalDiscoverySource,
].sort((left, right) => left.priority - right.priority);

export function createFailingDiscoverySource(): DiscoverySource {
  return createMockSource({
    id: "offline-source",
    name: "Fonte Offline",
    priority: 99,
    health: "OFFLINE",
    records: [],
    shouldFail: true,
  });
}
