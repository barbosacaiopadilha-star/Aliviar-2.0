import { describe, expect, it } from "vitest";

import { isDemoPortalPath, shouldBlockDemoPortals } from "@/modules/auth/demo-portals";

// A trava dos Portais de demonstração em produção. Existe porque a Landing
// publicada leva visitantes reais, e um visitante que abrisse a Jornada veria
// a história de uma paciente de demonstração como se fosse a dele.

describe("quais rotas são Portais de demonstração", () => {
  it("reconhece os dois Portais e suas subrotas", () => {
    expect(isDemoPortalPath("/portal-curador")).toBe(true);
    expect(isDemoPortalPath("/portal-curador/casos/caso-2038/curadoria_tecnica")).toBe(true);
    expect(isDemoPortalPath("/portal-paciente")).toBe(true);
    expect(isDemoPortalPath("/portal-paciente/prioridades")).toBe(true);
  });

  it("nunca alcança a Landing, o produto real ou a autenticação", () => {
    for (const path of ["/", "/login", "/sua-historia", "/paciente", "/curador", "/admin"]) {
      expect(isDemoPortalPath(path), `${path} não é Portal de demonstração`).toBe(false);
    }
  });
});

describe("onde a trava vale", () => {
  it("bloqueia apenas em produção", () => {
    expect(shouldBlockDemoPortals("production")).toBe(true);
  });

  it("libera em preview — é onde a experiência é avaliada", () => {
    expect(shouldBlockDemoPortals("preview")).toBe(false);
  });

  it("libera em desenvolvimento e quando a variável não existe (execução local)", () => {
    expect(shouldBlockDemoPortals("development")).toBe(false);
    expect(shouldBlockDemoPortals(undefined)).toBe(false);
    expect(shouldBlockDemoPortals("")).toBe(false);
  });

  it("compara de forma estrita — nenhuma variação libera ou bloqueia por engano", () => {
    expect(shouldBlockDemoPortals("PRODUCTION")).toBe(false);
    expect(shouldBlockDemoPortals(" production")).toBe(false);
  });
});
