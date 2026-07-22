import { describe, expect, it } from "vitest";

import { listDoctors } from "@/alicia/catalog";
import { getFilterOptions } from "@/alicia/lib/filter-doctors";
import { EMPTY_FILTERS } from "@/alicia/types";

import { applyDiscoveryQuery, parseDiscoveryQuery } from "./discovery-search";

describe("discovery search", () => {
  const options = getFilterOptions(listDoctors());

  it("detects specialty from Neuro alias", () => {
    const result = parseDiscoveryQuery("Neuro", options);

    expect(result.structured.specialty).toBe("Neurocirurgia");
    expect(result.detectedTypes).toContain("especialidade");
  });

  it("detects city from Vitória", () => {
    const result = parseDiscoveryQuery("Vitória", options);

    expect(result.structured.city).toBe("Vitória");
    expect(result.detectedTypes).toContain("cidade");
  });

  it("detects practice area from Joelho", () => {
    const result = parseDiscoveryQuery("Joelho", options);

    expect(result.structured.practiceArea).toBe("Cirurgia do joelho");
    expect(result.detectedTypes).toContain("área de atuação");
  });

  it("detects institution from HC alias", () => {
    const result = parseDiscoveryQuery("HC", options);

    expect(result.structured.institution ?? result.structured.residency).toBeTruthy();
    expect(result.detectedTypes.some((type) => type.includes("instituição") || type.includes("residência"))).toBe(
      true,
    );
  });

  it("detects graduation from USP when present in catalog", () => {
    const usp = options.universities.find((item) => item.includes("USP"));
    if (!usp) {
      return;
    }

    const result = parseDiscoveryQuery("USP", options);
    expect(result.structured.university).toBe(usp);
  });

  it("falls back to free text when term is unknown", () => {
    const result = parseDiscoveryQuery("xyz-termo-inexistente", options);

    expect(result.freeText).toBe("xyz-termo-inexistente");
    expect(result.detectedTypes).toContain("texto livre");
  });

  it("merges structured filters without dropping existing ones", () => {
    const next = applyDiscoveryQuery(
      { ...EMPTY_FILTERS, city: "Vitória" },
      "Neuro",
      options,
    );

    expect(next.city).toBe("Vitória");
    expect(next.specialty).toBe("Neurocirurgia");
  });
});
