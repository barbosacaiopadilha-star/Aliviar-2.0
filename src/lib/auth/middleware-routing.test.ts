import { describe, expect, it } from "vitest";
import {
  buildLoginRedirectUrl,
  isProtectedPath,
  resolveMiddlewareRouting,
  wouldCauseRedirectLoop,
} from "@/lib/auth/middleware-routing";

describe("isProtectedPath", () => {
  it("protege workspace, patients e journeys", () => {
    expect(isProtectedPath("/workspace")).toBe(true);
    expect(isProtectedPath("/patients/new")).toBe(true);
    expect(isProtectedPath("/journeys/abc")).toBe(true);
    expect(isProtectedPath("/curador")).toBe(true);
    expect(isProtectedPath("/curador/casos/abc")).toBe(true);
  });

  it("não protege login e assets", () => {
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/auth/forgot-password")).toBe(false);
  });
});

describe("resolveMiddlewareRouting", () => {
  it("redireciona /workspace sem sessão para login", () => {
    const decision = resolveMiddlewareRouting({
      pathname: "/workspace",
      hasUser: false,
      searchParams: new URLSearchParams(),
    });
    expect(decision).toEqual({ action: "redirect_login", redirectPath: "/workspace" });
  });

  it("permite /workspace com sessão", () => {
    const decision = resolveMiddlewareRouting({
      pathname: "/workspace",
      hasUser: true,
      searchParams: new URLSearchParams(),
    });
    expect(decision).toEqual({ action: "continue" });
  });

  it("não redireciona /login com sessão (evita loop)", () => {
    const decision = resolveMiddlewareRouting({
      pathname: "/login",
      hasUser: true,
      searchParams: new URLSearchParams("error=no_active_profile"),
    });
    expect(decision).toEqual({ action: "continue" });
  });

  it("permite /login sem sessão", () => {
    const decision = resolveMiddlewareRouting({
      pathname: "/login",
      hasUser: false,
      searchParams: new URLSearchParams(),
    });
    expect(decision).toEqual({ action: "continue" });
  });

  it("redireciona /portal sem sessão para portal entrar", () => {
    const decision = resolveMiddlewareRouting({
      pathname: "/portal",
      hasUser: false,
      searchParams: new URLSearchParams(),
    });
    expect(decision).toEqual({ action: "redirect_portal_login", redirectPath: "/portal" });
  });

  it("permite /portal/entrar sem sessão", () => {
    const decision = resolveMiddlewareRouting({
      pathname: "/portal/entrar",
      hasUser: false,
      searchParams: new URLSearchParams(),
    });
    expect(decision).toEqual({ action: "continue" });
  });
});

describe("buildLoginRedirectUrl", () => {
  it("preserva rota protegida original", () => {
    expect(buildLoginRedirectUrl("http://localhost:3000", "/workspace")).toBe(
      "/login?redirect=%2Fworkspace",
    );
  });
});

describe("wouldCauseRedirectLoop", () => {
  it("detecta redirecionamento para a mesma rota", () => {
    expect(wouldCauseRedirectLoop("/login", "/login")).toBe(true);
    expect(wouldCauseRedirectLoop("/login?error=x", "/login")).toBe(true);
    expect(wouldCauseRedirectLoop("/workspace", "/login")).toBe(false);
  });
});

describe("fluxo anti-loop login/workspace", () => {
  it("/login?error=no_active_profile nunca dispara redirect automático no middleware", () => {
    const withError = resolveMiddlewareRouting({
      pathname: "/login",
      hasUser: true,
      searchParams: new URLSearchParams("error=no_active_profile"),
    });
    const withoutUser = resolveMiddlewareRouting({
      pathname: "/workspace",
      hasUser: false,
      searchParams: new URLSearchParams(),
    });

    expect(withError.action).toBe("continue");
    expect(withoutUser.action).toBe("redirect_login");
  });
});
