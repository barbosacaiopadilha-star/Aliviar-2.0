import { describe, expect, it } from "vitest";

import { getDoctorById, listDoctors } from "@/alicia/catalog";
import { UNCONFIRMED_INSTITUTION } from "@/alicia/lib/profile-narrative";
import { catalogSeed } from "@/alicia/infrastructure/seed/catalog.seed";

const EXPECTED_DOCTOR_IDS = catalogSeed.doctors.map((doctor) => doctor.id);
const EXPECTED_ORTOPEDIA_COUNT = catalogSeed.doctors.filter(
  (doctor) => doctor.specialty === "Ortopedia",
).length;
const EXPECTED_NEUROCIRURGIA_COUNT = catalogSeed.doctors.filter(
  (doctor) => doctor.specialty === "Neurocirurgia",
).length;

describe("catalog public api", () => {
  it("lists the Espírito Santo catalog", () => {
    const doctors = listDoctors();
    expect(doctors).toHaveLength(catalogSeed.doctors.length);
    expect(doctors.map((doctor) => doctor.id)).toEqual(EXPECTED_DOCTOR_IDS);
  });

  it("covers ortopedia and neurocirurgia in Espírito Santo", () => {
    const doctors = listDoctors();
    const specialties = new Set(doctors.map((doctor) => doctor.specialty));

    expect(specialties).toEqual(new Set(["Ortopedia", "Neurocirurgia"]));
    expect(doctors.every((doctor) => doctor.location.state === "ES")).toBe(true);
    expect(doctors.filter((doctor) => doctor.specialty === "Ortopedia")).toHaveLength(
      EXPECTED_ORTOPEDIA_COUNT,
    );
    expect(doctors.filter((doctor) => doctor.specialty === "Neurocirurgia")).toHaveLength(
      EXPECTED_NEUROCIRURGIA_COUNT,
    );
  });

  it("preserves verified formation for joao-donatelli", () => {
    const doctor = getDoctorById("joao-donatelli");

    expect(doctor).toBeDefined();
    expect(doctor?.name).toBe("Dr. João Donatelli");
    expect(doctor?.specialty).toBe("Ortopedia");
    expect(doctor?.location.city).toBe("Vitória");
    expect(doctor?.graduation.institution).toContain("EMESCAM");
    expect(doctor?.graduation.verified).toBe(true);
    expect(doctor?.residency).toHaveLength(1);
    expect(doctor?.fellowships).toHaveLength(1);
    expect(doctor?.transparency.sources.length).toBeGreaterThanOrEqual(3);
  });

  it("marks unconfirmed formation explicitly for partial profiles", () => {
    const doctor = getDoctorById("andre-faria-teixeira");

    expect(doctor?.graduation.verified).toBe(false);
    expect(doctor?.graduation.institution).toBe(UNCONFIRMED_INSTITUTION);
    expect(doctor?.transparency.unverifiedFields).toContain("Graduação");
    expect(doctor?.transparency.unverifiedFields).toContain("Graduação");
  });

  it("returns undefined for unknown doctor", () => {
    expect(getDoctorById("inexistente")).toBeUndefined();
  });
});
