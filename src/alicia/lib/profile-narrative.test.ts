import { describe, expect, it } from "vitest";

import { getDoctorById } from "@/alicia/catalog";
import type { Doctor } from "@/alicia/types";

import {
  CONFIRMED_LABEL,
  UNCONFIRMED_INSTITUTION,
  UNCONFIRMED_INSTITUTION_LABEL,
  VERIFYING_LABEL,
  buildPracticeAreaItems,
  buildProfileTimeline,
  buildTrajectoryStats,
  buildTrustOverview,
  formatSourceCount,
  formatUnverifiedFields,
  getProfileIntro,
  getSourceTrustLabel,
  presentInstitution,
} from "./profile-narrative";

function createDoctor(overrides: Partial<Doctor> = {}): Doctor {
  return {
    id: "sample",
    name: "Dr. Sample",
    specialty: "Ortopedia",
    location: { lat: 0, lng: 0, city: "Vitória", state: "ES" },
    mainInstitution: "Hospital",
    whoTheyAre: "Sample.",
    trajectory: "Sample trajectory.",
    graduation: {
      institution: UNCONFIRMED_INSTITUTION,
      program: "Medicina",
      verified: false,
    },
    residency: [],
    fellowships: [],
    practiceAreas: [],
    institutions: [],
    scientificProductionPlaceholder: "Placeholder.",
    transparency: {
      lastUpdated: "2026-07-22",
      sourceCount: 1,
      sources: [],
      unverifiedFields: ["Graduação"],
    },
    ...overrides,
  };
}

describe("profile narrative", () => {
  it("builds a pending graduation timeline entry with human language", () => {
    const timeline = buildProfileTimeline(createDoctor());

    expect(timeline[0]).toMatchObject({
      yearLabel: "—",
      event: "Graduação em Medicina",
      institution: null,
      confirmation: "pending",
      confirmationLabel: VERIFYING_LABEL,
    });
    expect(timeline[0]?.explanation).toBeTruthy();
  });

  it("builds a confirmed timeline with year, institution and today details", () => {
    const timeline = buildProfileTimeline(
      createDoctor({
        graduation: {
          institution: "Universidade Federal do Espírito Santo (UFES)",
          program: "Medicina",
          period: "2003",
          verified: true,
        },
        residency: [
          {
            institution: "Hospital Municipal Miguel Couto (HMMC)",
            program: "Ortopedia e Traumatologia",
            period: "2006",
            verified: true,
          },
        ],
        practiceAreas: ["Cirurgia do ombro"],
        institutions: [
          { name: "Hospital Bento Ferreira", role: "Ortopedista", city: "Vitória" },
        ],
        transparency: {
          lastUpdated: "2026-07-22",
          sourceCount: 2,
          sources: [
            { name: "CRM-ES", type: "Registro profissional" },
            { name: "Site", type: "Instituição" },
          ],
          unverifiedFields: [],
        },
      }),
    );

    expect(timeline[0]?.yearLabel).toBe("2003");
    expect(timeline[0]?.institution?.name).toContain("UFES");
    expect(timeline[0]?.confirmationLabel).toBe(CONFIRMED_LABEL);
    expect(timeline[1]?.event).toBe("Residência em Ortopedia e Traumatologia");
    expect(timeline.at(-1)?.yearLabel).toBe("Hoje");
    expect(timeline.at(-1)?.todayDetails?.practiceAreas).toHaveLength(1);
    expect(timeline.at(-1)?.todayDetails?.institutions).toHaveLength(1);
  });

  it("builds trajectory stats without scores", () => {
    const stats = buildTrajectoryStats(
      createDoctor({
        residency: [{ institution: "HMMC", program: "Ortopedia", verified: true }],
        fellowships: [{ institution: "INTO", program: "Quadril", verified: true }],
        practiceAreas: ["Cirurgia do quadril", "Artroplastia"],
        institutions: [{ name: "ICOT", role: "Ortopedista", city: "Vitória" }],
        transparency: {
          lastUpdated: "2026-07-22",
          sourceCount: 2,
          sources: [
            { name: "CRM", type: "Registro profissional" },
            { name: "Catálogo", type: "Diretório profissional" },
          ],
          unverifiedFields: [],
        },
      }),
    );

    expect(stats).toEqual([
      { label: "Graduação", value: "—" },
      { label: "Residências confirmadas", value: "1" },
      { label: "Treinamentos complementares", value: "1" },
      { label: "Instituições", value: "3" },
      { label: "Áreas de atuação", value: "2" },
      { label: "Fontes consultadas", value: "2" },
    ]);
  });

  it("presents institution metadata from catalog", () => {
    const institution = presentInstitution("Universidade Federal do Espírito Santo (UFES)");

    expect(institution).toMatchObject({
      city: "Vitória",
      state: "ES",
      type: "Universidade",
    });
    expect(institution?.description).toBeTruthy();
  });

  it("never exposes pending sentinel to users", () => {
    expect(presentInstitution(UNCONFIRMED_INSTITUTION)).toBeNull();
    expect(UNCONFIRMED_INSTITUTION_LABEL).toBe("Estamos verificando esta informação.");
  });

  it("explains practice areas in plain language", () => {
    const items = buildPracticeAreaItems(
      createDoctor({
        practiceAreas: ["Cirurgia do ombro"],
      }),
    );

    expect(items[0]?.explanation).toContain("ombro");
  });

  it("formats source count and trust labels", () => {
    expect(formatSourceCount(1)).toBe("1 fonte consultada");
    expect(formatSourceCount(3)).toBe("3 fontes consultadas");
    expect(getSourceTrustLabel({ name: "CRM", type: "Registro profissional" })).toBe(
      "Registro público",
    );
    expect(getSourceTrustLabel({ name: "Catálogo", type: "Diretório profissional" })).toBe(
      "Diretório profissional",
    );
  });

  it("formats unverified fields consistently", () => {
    expect(formatUnverifiedFields(["Graduação", "Residência"])).toBe(
      "Estamos verificando: Graduação, Residência.",
    );
  });

  it("builds a rich trajectory for a verified catalog doctor", () => {
    const doctor = getDoctorById("charles-takasaki");

    expect(doctor).toBeDefined();
    const timeline = buildProfileTimeline(doctor!);
    expect(timeline[0]?.yearLabel).toBe("2003");
    expect(timeline.at(-1)?.todayDetails?.institutions.length).toBeGreaterThan(0);
  });

  it("builds trust overview answers for patients", () => {
    const overview = buildTrustOverview(createDoctor());

    expect(overview.who).toBeTruthy();
    expect(overview.education).toContain("verificação");
    expect(overview.pending).toContain("Graduação");
  });

  it("prefers trajectory for profile intro when richer", () => {
    const intro = getProfileIntro(
      createDoctor({
        whoTheyAre: "Resumo curto.",
        trajectory:
          "Trajetória mais longa com detalhes de formação em várias instituições do Espírito Santo e de outros estados.",
      }),
    );

    expect(intro).toContain("Trajetória mais longa");
  });
});
