import catalogSeed from "@/alicia/infrastructure/seed/catalog.seed.json";
import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import { createCandidate } from "./studio-store";
import type { ChecklistItemState, StudioCandidate, StudioSource, StudioState } from "./types";

function extractRegistration(sources: DoctorImportRecord["transparency"]["sources"], pattern: RegExp): string {
  for (const source of sources) {
    const match = source.name.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return "";
}

function mapCatalogSources(
  sources: DoctorImportRecord["transparency"]["sources"],
  responsible: string,
): StudioSource[] {
  return sources.map((source, index) => ({
    id: `seed-src-${index}`,
    name: source.name,
    type: source.type,
    url: source.url,
    consultedAt: "2026-07-22",
    responsible,
  }));
}

function publishedChecklistStates(): Partial<Record<string, ChecklistItemState>> {
  const states: Partial<Record<string, ChecklistItemState>> = {};
  for (const item of [
    "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
    "B1", "B2", "B5", "B6",
    "C1", "C2", "C3",
    "D1", "D2", "D3", "D4",
    "E1", "E2", "E3", "E4", "E5",
    "F1", "F2", "F4", "F5", "F6",
    "G1",
  ]) {
    states[item] = "concluido";
  }
  states.B3 = "pendente";
  states.B4 = "pendente";
  states.B7 = "concluido";
  states.F3 = "bloqueado";
  states.G2 = "pendente";
  states.G3 = "pendente";
  return states;
}

function candidateFromCatalog(
  doctor: DoctorImportRecord,
  caseNumber: number,
  nivel: "A" | "B",
  status: "publicado" | "revisao" = "publicado",
): StudioCandidate {
  const crm = extractRegistration(doctor.transparency.sources, /CRM-ES\s[\d.]+/i);
  const rqe = extractRegistration(doctor.transparency.sources, /RQE\s[\d.]+/i);
  const createdAt = "2026-07-15T10:00:00.000Z";
  const publishedAt = status === "publicado" ? "2026-07-20T14:30:00.000Z" : undefined;

  return createCandidate({
    id: doctor.id,
    caseId: `ALC-ES-2026-${String(caseNumber).padStart(5, "0")}`,
    name: doctor.name,
    crm,
    rqe,
    city: doctor.location.city,
    specialty: doctor.specialty,
    status,
    nivel,
    sources: mapCatalogSources(doctor.transparency.sources, "Operador Sênior"),
    pendencies: doctor.transparency.unverifiedFields,
    checklistStates: publishedChecklistStates(),
    createdAt,
    publishedAt,
    actor: "Operador Sênior",
  });
}

export function createInitialStudioState(): StudioState {
  const publishedSamples = catalogSeed.doctors.slice(0, 3);
  const nivelA = publishedSamples[0];
  const nivelB1 = publishedSamples[1];
  const nivelB2 = publishedSamples[2];

  const candidates: StudioCandidate[] = [
    candidateFromCatalog(nivelA!, 1, "A", "publicado"),
    candidateFromCatalog(nivelB1!, 2, "B", "publicado"),
    candidateFromCatalog(nivelB2!, 3, "B", "revisao"),

    createCandidate({
      id: "lead-viana-ortopedia",
      caseId: "ALC-ES-2026-00004",
      name: "Dr. Candidato Viana (lead)",
      city: "Viana",
      specialty: "Ortopedia",
      status: "novo",
      pendencies: ["CRM não consultado", "Especialidade não confirmada"],
      actor: "Operador Ingestão",
    }),

    createCandidate({
      id: "lead-guarapari-triagem",
      caseId: "ALC-ES-2026-00005",
      name: "Dra. Ana Costa (triagem)",
      crm: "CRM-ES 18.200",
      city: "Guarapari",
      specialty: "Neurocirurgia",
      status: "triagem",
      checklistStates: {
        A1: "concluido",
        A2: "em_andamento",
        A3: "pendente",
      },
      sources: [
        {
          id: "src-triagem-1",
          name: "Doctoralia — pista inicial",
          type: "Diretório (nível 6)",
          url: "https://www.doctoralia.com.br/",
          consultedAt: "2026-07-21",
          responsible: "Operador Ingestão",
        },
      ],
      pendencies: ["Aguardando confirmação institucional"],
      actor: "Operador Ingestão",
    }),

    createCandidate({
      id: "lead-linhares-coleta",
      caseId: "ALC-ES-2026-00006",
      name: "Dr. Ricardo Mendes (coleta)",
      crm: "CRM-ES 12.450",
      rqe: "RQE 11.200",
      city: "Linhares",
      specialty: "Ortopedia",
      status: "coleta",
      checklistStates: {
        A1: "concluido",
        A2: "concluido",
        A3: "concluido",
        A4: "concluido",
        A5: "concluido",
        A6: "concluido",
        A7: "concluido",
        A8: "concluido",
        B1: "em_andamento",
        B2: "pendente",
      },
      sources: [
        {
          id: "src-coleta-1",
          name: "CRM-ES 12.450",
          type: "Registro profissional",
          consultedAt: "2026-07-22",
          responsible: "Operador Ingestão",
        },
        {
          id: "src-coleta-2",
          name: "Hospital Geral de Linhares",
          type: "Instituição",
          url: "https://saude.es.gov.br/",
          consultedAt: "2026-07-22",
          responsible: "Operador Ingestão",
        },
      ],
      pendencies: ["Graduação", "Residência"],
      actor: "Operador Ingestão",
    }),

    createCandidate({
      id: "lead-colatina-verificacao",
      caseId: "ALC-ES-2026-00007",
      name: "Dr. Pedro Almeida (verificação)",
      crm: "CRM-ES 9.880",
      rqe: "RQE 8.100",
      city: "Colatina",
      specialty: "Neurocirurgia",
      status: "verificacao",
      nivel: "B",
      checklistStates: {
        A1: "concluido",
        A2: "concluido",
        A3: "concluido",
        A4: "concluido",
        A5: "concluido",
        A6: "concluido",
        A7: "concluido",
        A8: "concluido",
        B1: "concluido",
        B5: "concluido",
        B6: "concluido",
        C1: "concluido",
        C2: "concluido",
        C3: "concluido",
        D1: "em_andamento",
      },
      sources: [
        {
          id: "src-verif-1",
          name: "CRM-ES 9.880",
          type: "Registro profissional",
          consultedAt: "2026-07-22",
          responsible: "Revisor Catálogo",
        },
        {
          id: "src-verif-2",
          name: "Hospital São José — Colatina",
          type: "Instituição",
          consultedAt: "2026-07-22",
          responsible: "Revisor Catálogo",
        },
      ],
      pendencies: ["Residência", "Produção científica"],
      actor: "Revisor Catálogo",
    }),

    createCandidate({
      id: "lead-aracruz-arquivado",
      caseId: "ALC-ES-2026-00008",
      name: "Dr. Homônimo Irresolúvel",
      city: "Aracruz",
      specialty: "Ortopedia",
      status: "arquivado",
      checklistStates: {
        A1: "concluido",
        A2: "concluido",
        A8: "bloqueado",
      },
      pendencies: ["D05 — Homônimo irresolúvel"],
      actor: "Revisor Catálogo",
    }),
  ];

  return {
    candidates,
    defaultActor: "Operador AliCIA",
  };
}

export const STUDIO_STORAGE_KEY = "alicia-studio-state-v1";
