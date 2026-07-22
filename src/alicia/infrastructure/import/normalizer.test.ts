import { describe, expect, it } from "vitest";

import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";
import { normalizeCatalogImportPayload } from "@/alicia/infrastructure/import/normalizer";

const sample: DoctorImportRecord = {
  id: "ana-silva",
  name: "Dra. Ana Silva",
  specialty: "Dermatologia",
  location: { lat: -19.9, lng: -43.9, city: "Belo Horizonte", state: "MG" },
  mainInstitution: "Hospital BH",
  whoTheyAre: "Dermatologista clínica.",
  trajectory: "Formou-se na UFMG.",
  graduation: {
    institution: "UFMG",
    program: "Medicina",
    period: "2008–2013",
    verified: true,
  },
  residency: [
    {
      institution: "Hospital BH",
      program: "Dermatologia",
      period: "2014–2017",
      verified: false,
    },
  ],
  fellowships: [],
  practiceAreas: ["Psoríase"],
  institutions: [{ name: "Hospital BH", role: "Dermatologista", city: "Belo Horizonte" }],
  scientificProductionPlaceholder: "Em breve",
  transparency: {
    lastUpdated: "2026-02-01",
    sources: [
      { name: "CRM-MG", type: "Conselho regional" },
      { name: "Lattes", type: "Currículo acadêmico" },
    ],
    unverifiedFields: ["Publicações"],
  },
};

describe("catalog normalizer", () => {
  it("creates normalized entities with verifications", () => {
    const snapshot = normalizeCatalogImportPayload({ doctors: [sample] });

    expect(snapshot.doctors).toHaveLength(1);
    expect(snapshot.specialties.size).toBe(1);
    expect(snapshot.institutions.size).toBeGreaterThan(0);
    expect(snapshot.verifications.size).toBeGreaterThan(0);
    expect(snapshot.sources.size).toBe(2);
  });

  it("marks unverified education as pending", () => {
    const snapshot = normalizeCatalogImportPayload({ doctors: [sample] });
    const doctor = snapshot.doctors[0];
    const residency = snapshot.residencies.get(doctor.residencyIds[0]);
    const verification = snapshot.verifications.get(residency!.verificationId);

    expect(verification?.status).toBe("pending");
    expect(verification?.confidence).toBe("medium");
  });
});
