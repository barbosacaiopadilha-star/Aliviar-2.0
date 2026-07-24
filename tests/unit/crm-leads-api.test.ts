import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("crm leads API route (static contract)", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/api/crm/leads/route.ts"),
    "utf8",
  );

  it("usa service role apenas no servidor", () => {
    expect(source).toContain("createAdminSupabaseClient");
    expect(source).not.toContain("NEXT_PUBLIC_");
  });

  it("bloqueia produção sem segredo configurado", () => {
    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain("CRM_SITE_LEAD_SECRET");
  });
});
