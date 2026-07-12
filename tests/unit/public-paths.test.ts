import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/modules/auth/public-paths";

describe("isPublicPath", () => {
  it("trata a home e as rotas de auth como públicas", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/recuperar-senha")).toBe(true);
    expect(isPublicPath("/nova-senha")).toBe(true);
  });

  it("trata o callback (com querystring de path, sem querystring de fato) como público", () => {
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("trata só a raiz explicativa de 'Sua História' como pública — as etapas do wizard exigem sessão (ADR-018)", () => {
    expect(isPublicPath("/sua-historia")).toBe(true);
    expect(isPublicPath("/sua-historia/para-quem")).toBe(false);
    expect(isPublicPath("/sua-historia/revisao")).toBe(false);
  });

  it("trata robots.txt e sitemap.xml como públicos (buscadores nunca autenticam)", () => {
    expect(isPublicPath("/robots.txt")).toBe(true);
    expect(isPublicPath("/sitemap.xml")).toBe(true);
  });

  it("trata qualquer outra rota como protegida por padrão", () => {
    expect(isPublicPath("/qualquer-coisa")).toBe(false);
    expect(isPublicPath("/painel-interno")).toBe(false);
  });
});
