import { describe, expect, it } from "vitest";

import {
  academicFellowshipConnector,
  academicGraduationConnector,
  academicResidencyConnector,
  createAcademicMockConnector,
} from "@/alicia/connectors/adapters/academic";
import { ACADEMIC_GRADUATION_MOCK } from "@/alicia/connectors/adapters/academic/mock-data";
import { validateNormalizedRecord } from "@/alicia/connectors/validation-layer";

describe("Academic Evidence Connectors", () => {
  it("graduation adapter produz campos acadêmicos canônicos", async () => {
    const auth = await academicGraduationConnector.authenticate();
    expect(auth.success).toBe(true);

    const fetch = await academicGraduationConnector.fetch();
    expect(fetch.success).toBe(true);
    expect(fetch.data.length).toBeGreaterThanOrEqual(6);

    const normalized = academicGraduationConnector.normalize(fetch.data[0]!);
    expect(normalized[0]!.academicEvidence?.[0]).toMatchObject({
      kind: "graduation",
      institution: expect.any(String),
      degree: "Medicina",
      endYear: expect.any(String),
      source: expect.stringContaining("http"),
      confidence: expect.any(Number),
    });
    expect(validateNormalizedRecord(normalized[0]!).valid).toBe(true);
  });

  it("residency adapter produz institution e program", async () => {
    const fetch = await academicResidencyConnector.fetch();
    const normalized = academicResidencyConnector.normalize(fetch.data[0]!);

    expect(normalized[0]!.academicEvidence?.[0]).toMatchObject({
      kind: "residency",
      institution: expect.any(String),
      program: expect.any(String),
    });
  });

  it("fellowship adapter produz institution e program", async () => {
    const fetch = await academicFellowshipConnector.fetch();
    const normalized = academicFellowshipConnector.normalize(fetch.data[0]!);

    expect(normalized[0]!.academicEvidence?.[0]).toMatchObject({
      kind: "fellowship",
      institution: expect.any(String),
      program: expect.stringContaining("Fellowship"),
    });
  });

  it("suporta falha controlada para integração real futura", async () => {
    const failing = createAcademicMockConnector({
      id: "academic-fail",
      name: "Academic Fail",
      priority: 99,
      kind: "graduation",
      sourceType: "academic-graduation",
      health: "OFFLINE",
      records: ACADEMIC_GRADUATION_MOCK,
      shouldFail: true,
    });

    const fetch = await failing.fetch();
    expect(fetch.success).toBe(false);
  });
});
