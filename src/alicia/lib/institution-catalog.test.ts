import { describe, expect, it } from "vitest";

import { lookupInstitution } from "./institution-catalog";

describe("institution catalog", () => {
  it("returns metadata for known institutions", () => {
    const entry = lookupInstitution("Hospital Bento Ferreira");

    expect(entry).toMatchObject({
      city: "Vitória",
      state: "ES",
      type: "Hospital",
    });
  });

  it("returns null for unknown institutions", () => {
    expect(lookupInstitution("Instituição Inexistente")).toBeNull();
  });
});
