import { describe, expect, it } from "vitest";

import { DOMAIN_COLLECTIONS } from "./collections";

describe("domain snapshot collections", () => {
  it("define coleções para todos os agregados persistidos", () => {
    expect(DOMAIN_COLLECTIONS.CURATION_REPORTS).toBe("curation_reports");
    expect(DOMAIN_COLLECTIONS.REPORT_DELIVERIES).toBe("report_deliveries");
    expect(DOMAIN_COLLECTIONS.HANDOFFS).toBe("handoffs");
  });
});
