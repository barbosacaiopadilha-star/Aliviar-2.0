export type MockRawRecord = {
  nome: string;
  crm?: string;
  crm_uf?: string;
  especialidade: string;
  cidade: string;
  estado: string;
  url?: string;
  telefone?: string;
  confidence?: number;
};

export const CRM_ESTADUAL_MOCK: MockRawRecord[] = [
  {
    nome: "Dr. Ricardo Almeida",
    crm: "45210",
    crm_uf: "ES",
    especialidade: "Ortopedia e Traumatologia",
    cidade: "Vitória",
    estado: "ES",
    url: "https://crm.es.gov.br/mock/ricardo-almeida",
    confidence: 0.88,
  },
  {
    nome: "Dr. Paulo Mendes",
    crm: "51332",
    crm_uf: "ES",
    especialidade: "Ortopedia",
    cidade: "Cariacica",
    estado: "ES",
    url: "https://crm.es.gov.br/mock/paulo-mendes",
    confidence: 0.86,
  },
];

export const CFM_MOCK: MockRawRecord[] = [
  {
    nome: "Dr. Ricardo Almeida",
    crm: "45210",
    crm_uf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vitoria",
    estado: "ES",
    url: "https://portal.cfm.org.br/mock/ricardo-almeida",
    confidence: 0.92,
  },
  {
    nome: "Dra. Fernanda Lopes",
    crm: "38901",
    crm_uf: "ES",
    especialidade: "Neurocirurgia",
    cidade: "Serra",
    estado: "ES",
    url: "https://portal.cfm.org.br/mock/fernanda-lopes",
    confidence: 0.9,
  },
];

export const HOSPITAL_MOCK: MockRawRecord[] = [
  {
    nome: "Dra. Camila Rocha",
    crm: "29887",
    crm_uf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vila Velha",
    estado: "ES",
    url: "https://icot.org.br/corpo-clinico/camila-rocha",
    telefone: "27999990001",
    confidence: 0.84,
  },
];

export const UNIVERSIDADE_MOCK: MockRawRecord[] = [
  {
    nome: "Dr. Lucas Ferreira",
    crm: "33445",
    crm_uf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vitória",
    estado: "ES",
    url: "https://emescam.edu.br/docentes/lucas-ferreira",
    confidence: 0.8,
  },
];

export const SOCIEDADE_MEDICA_MOCK: MockRawRecord[] = [
  {
    nome: "Dr. André Souza",
    crm: "41200",
    crm_uf: "ES",
    especialidade: "Ortopedia",
    cidade: "Vitória",
    estado: "ES",
    url: "https://sbot.org.br/mock/andre-souza",
    confidence: 0.82,
  },
];

export const SITE_INSTITUCIONAL_MOCK: MockRawRecord[] = [
  {
    nome: "Dra. Helena Martins",
    crm: "36780",
    crm_uf: "ES",
    especialidade: "Ortopedia Pediátrica",
    cidade: "Serra",
    estado: "ES",
    url: "https://clinicaexemplo.com.br/equipe/helena-martins",
    telefone: "27988887777",
    confidence: 0.78,
  },
];
