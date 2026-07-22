import { describe, expect, it } from "vitest";

import { landingJsonLd, landingPageMetadata } from "./seo";

describe("landing seo", () => {
  it("expõe metadata essencial para publicação", () => {
    expect(landingPageMetadata.title).toBe("Aliviar");
    expect(landingPageMetadata.description).toContain("sozinho");
    expect(landingPageMetadata.openGraph?.title).toBe("Aliviar");
    expect(landingPageMetadata.robots).toEqual({ index: true, follow: true });
  });

  it("inclui JSON-LD de organização sem linguagem comercial", () => {
    const text = JSON.stringify(landingJsonLd).toLowerCase();
    expect(landingJsonLd["@type"]).toBe("Organization");
    expect(text).not.toContain("cadastr");
    expect(text).not.toContain("compre");
  });
});
