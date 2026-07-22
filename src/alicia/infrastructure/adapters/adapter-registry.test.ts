import { describe, expect, it } from "vitest";

import { getAdapterLabel } from "@/alicia/infrastructure/adapters/adapter-registry";

describe("adapter registry", () => {
  it("returns labels for supported adapters", () => {
    expect(getAdapterLabel("mock")).toBe("Mock Adapter");
    expect(getAdapterLabel("supabase")).toBe("Supabase Adapter");
  });
});
