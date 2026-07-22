import { describe, expect, it } from "vitest";

import { listDoctors } from "@/alicia/catalog";
import { UNCONFIRMED_INSTITUTION } from "@/alicia/lib/profile-narrative";
import { EMPTY_FILTERS } from "@/alicia/types";

import { filterDoctors, filterDoctorsByBounds, getFilterOptions } from "./filter-doctors";

describe("filter doctors", () => {
  const doctors = listDoctors();

  it("excludes unconfirmed institutions from filter options", () => {
    const options = getFilterOptions(doctors);

    expect(options.universities).not.toContain(UNCONFIRMED_INSTITUTION);
    expect(options.residencies).not.toContain(UNCONFIRMED_INSTITUTION);
    expect(options.fellowships).not.toContain(UNCONFIRMED_INSTITUTION);
  });

  it("filters by practice area", () => {
    const area = doctors.flatMap((doctor) => doctor.practiceAreas)[0];
    const filtered = filterDoctors(doctors, { ...EMPTY_FILTERS, practiceArea: area });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((doctor) => doctor.practiceAreas.includes(area))).toBe(true);
  });

  it("filters doctors inside map bounds", () => {
    const sample = doctors[0];
    const bounds = {
      north: sample.location.lat + 0.5,
      south: sample.location.lat - 0.5,
      east: sample.location.lng + 0.5,
      west: sample.location.lng - 0.5,
    };

    const filtered = filterDoctorsByBounds(doctors, bounds);

    expect(filtered.some((doctor) => doctor.id === sample.id)).toBe(true);
  });
});
