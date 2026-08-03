import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// FRENTE D2 (FUN-01/SEG-05): este contrato estático certificava o defeito —
// segredo exigido "só em produção" (`NODE_ENV === "production"`). O contrato
// novo: segredo obrigatório em TODO ambiente (sem ele, 503 sempre),
// comparação em tempo constante e erro interno sem vazamento de mensagem
// crua. O comportamento fim-a-fim é exercitado em
// tests/integration/crm-leads-endpoint.integration.test.ts.
describe("crm leads API route (static contract)", () => {
  const source = readFileSync(
    resolve(process.cwd(), "src/app/api/crm/leads/route.ts"),
    "utf8",
  );

  it("usa service role apenas no servidor", () => {
    expect(source).toContain("createAdminSupabaseClient");
    expect(source).not.toContain("NEXT_PUBLIC_");
  });

  it("exige o segredo em todo ambiente — nenhuma condição por NODE_ENV/VERCEL_ENV", () => {
    expect(source).toContain("CRM_SITE_LEAD_SECRET");
    expect(source).not.toContain("NODE_ENV");
    expect(source).not.toContain("VERCEL_ENV");
  });

  it("compara o segredo em tempo constante", () => {
    expect(source).toContain("timingSafeEqual");
  });

  it("nunca devolve a mensagem crua do erro interno — registra e responde com referência", () => {
    expect(source).toContain("registrarErro");
    expect(source).not.toContain("error.message");
  });
});
