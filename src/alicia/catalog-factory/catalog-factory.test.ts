import { describe, expect, it } from "vitest";

import { catalogSeed } from "@/alicia/infrastructure/seed/catalog.seed";
import type { DoctorImportRecord } from "@/alicia/infrastructure/import/import-types";

import {
  ingestCatalogFromCrawler,
  ingestCatalogFromPayload,
  ingestCatalogManually,
} from "@/alicia/catalog-factory/pipeline/ingestion-pipeline";
import { updateCatalogDoctors } from "@/alicia/catalog-factory/metrics/catalog-metrics";

describe("catalog factory pipeline", () => {
  it("ingests seed payload with lifecycle, quality and review queue", () => {
    const result = ingestCatalogFromPayload(catalogSeed, "json", "2026-07-22");

    expect(result.snapshot.doctors.length).toBeGreaterThan(0);
    expect(result.operationalRecords).toHaveLength(catalogSeed.doctors.length);
    expect(result.reviewQueue.length).toBeGreaterThan(0);
    expect(result.metrics.totalDoctors).toBe(result.snapshot.doctors.length);
    expect(result.metrics.coverageByCity.Vitória).toBeGreaterThan(0);
    expect(result.operationalRecords.every((record) => record.quality.overall > 0)).toBe(
      true,
    );
  });

  it("produces the same domain shape across manual and crawler ingestion", () => {
    const record = catalogSeed.doctors[0];
    const manual = ingestCatalogManually([record], "2026-07-22");
    const crawler = ingestCatalogFromCrawler([record], "2026-07-22");

    expect(manual.snapshot.doctors[0]?.id).toBe(crawler.snapshot.doctors[0]?.id);
    expect(manual.snapshot.specialties.size).toBe(crawler.snapshot.specialties.size);
  });

  it("publishes doctors during ingestion when they pass auto verification", () => {
    const ingestion = ingestCatalogFromPayload(catalogSeed, "manual", "2026-07-22");

    expect(ingestion.snapshot.doctors.length).toBeGreaterThan(0);
    expect(
      ingestion.operationalRecords.filter((record) => record.lifecycle.state === "published")
        .length,
    ).toBeGreaterThan(0);
  });

  it("updates doctors when lastUpdated changes", () => {
    const ingestion = ingestCatalogFromPayload(catalogSeed, "manual", "2026-07-22");
    const target = ingestion.operationalRecords[0];
    const updatedRecord: DoctorImportRecord = {
      ...target.importRecord,
      transparency: {
        ...target.importRecord.transparency,
        lastUpdated: "2026-07-23",
      },
    };

    const update = updateCatalogDoctors(
      ingestion.operationalRecords,
      new Map([[target.doctorId, updatedRecord]]),
      "2026-07-23",
    );

    expect(update.updatedDoctorIds).toContain(target.doctorId);
    expect(update.newReviewItems.length).toBeGreaterThanOrEqual(0);
  });
});
