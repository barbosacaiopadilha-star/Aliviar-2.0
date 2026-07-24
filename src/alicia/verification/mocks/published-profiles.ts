import type { VerificationProfile } from "../types";
import { VerificationScheduler } from "../scheduler";

const now = "2026-07-22T10:00:00.000Z";
const scheduler = new VerificationScheduler();

function profile(
  input: Omit<VerificationProfile, "nextVerificationAt" | "neverVerified"> & {
    neverVerified?: boolean;
    nextVerificationAt?: string;
  },
): VerificationProfile {
  return {
    ...input,
    neverVerified: input.neverVerified ?? input.lastVerifiedAt === null,
    nextVerificationAt:
      input.nextVerificationAt ??
      scheduler.computeNextVerificationAt(input.verificationFrequency, new Date(now)),
  };
}

export const mockPublishedProfiles: VerificationProfile[] = [
  profile({
    profileId: "prof-stable-001",
    candidateId: "cand-stable-001",
    lastVerifiedAt: "2026-07-15T10:00:00.000Z",
    verificationFrequency: "WEEKLY",
    nextVerificationAt: "2026-07-10T10:00:00.000Z",
    sourceChanged: false,
    newEvidenceAvailable: false,
    recentlyPublished: false,
    snapshot: {
      profileId: "prof-stable-001",
      candidateId: "cand-stable-001",
      doctorName: "Dr. Ricardo Almeida",
      crm: "CRM-ES 45210",
      rqe: "RQE 9999",
      institutions: ["ICOT"],
      residency: ["Ortopedia — ICOT"],
      specialty: "Ortopedia",
      city: "Vitória",
      state: "ES",
      sources: ["cfm", "crm-estadual"],
      status: "active",
      publishedAt: "2026-06-01T10:00:00.000Z",
      version: 1,
    },
  }),
  profile({
    profileId: "prof-minor-002",
    candidateId: "cand-minor-002",
    lastVerifiedAt: "2026-07-01T10:00:00.000Z",
    verificationFrequency: "DAILY",
    nextVerificationAt: "2026-07-20T10:00:00.000Z",
    sourceChanged: true,
    newEvidenceAvailable: false,
    recentlyPublished: false,
    snapshot: {
      profileId: "prof-minor-002",
      candidateId: "cand-minor-002",
      doctorName: "Dra. Camila Rocha",
      crm: "CRM-ES 29887",
      rqe: "RQE 8888",
      institutions: ["ICOT"],
      residency: ["Ortopedia — ICOT"],
      specialty: "Ortopedia",
      city: "Vila Velha",
      state: "ES",
      sources: ["hospital"],
      status: "active",
      publishedAt: "2026-05-15T10:00:00.000Z",
      version: 1,
    },
  }),
  profile({
    profileId: "prof-material-003",
    candidateId: "cand-material-003",
    lastVerifiedAt: null,
    verificationFrequency: "WEEKLY",
    neverVerified: true,
    sourceChanged: false,
    newEvidenceAvailable: true,
    recentlyPublished: true,
    snapshot: {
      profileId: "prof-material-003",
      candidateId: "cand-material-003",
      doctorName: "Dr. Lucas Ferreira",
      crm: "CRM-ES 33445",
      rqe: "RQE 6666",
      institutions: ["EMESCAM"],
      residency: [],
      specialty: "Ortopedia",
      city: "Vitória",
      state: "ES",
      sources: ["universidade"],
      status: "active",
      publishedAt: "2026-07-20T10:00:00.000Z",
      version: 1,
    },
  }),
  profile({
    profileId: "prof-conflict-004",
    candidateId: "cand-conflict-004",
    lastVerifiedAt: "2026-07-10T10:00:00.000Z",
    verificationFrequency: "MONTHLY",
    nextVerificationAt: "2026-07-01T10:00:00.000Z",
    sourceChanged: true,
    newEvidenceAvailable: true,
    recentlyPublished: false,
    snapshot: {
      profileId: "prof-conflict-004",
      candidateId: "cand-conflict-004",
      doctorName: "Dr. André Souza",
      crm: "CRM-ES 41200",
      rqe: "RQE 7777",
      institutions: ["Clínica Exemplo"],
      residency: ["Ortopedia — Hospital X"],
      specialty: "Ortopedia",
      city: "Vitória",
      state: "ES",
      sources: ["sociedade-medica"],
      status: "active",
      publishedAt: "2026-04-01T10:00:00.000Z",
      version: 1,
    },
  }),
];

export type MockCurrentSnapshotOverride = Partial<import("../types").PublishedProfileSnapshot>;

export const mockCurrentSnapshots: Record<string, MockCurrentSnapshotOverride> = {
  "prof-stable-001": {},
  "prof-minor-002": { city: "Vitória" },
  "prof-material-003": {
    specialty: "Traumatologia",
    institutions: ["EMESCAM", "ICOT"],
    residency: ["Traumatologia — ICOT"],
    sources: ["universidade", "hospital"],
  },
  "prof-conflict-004": {
    crm: "CRM-ES 99999",
    status: "inactive",
  },
};
