import { describe, expect, it } from "vitest";

import { assertSupabaseCredential } from "@/lib/supabase/env-validation";

describe("preflight das credenciais Supabase", () => {
  it("recusa o valor mascarado antes de chegar ao cliente HTTP", () => {
    expect(() =>
      assertSupabaseCredential("SUPABASE_SERVICE_ROLE_KEY", "••••"),
    ).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY está inválida.*valor real, sem máscara/,
    );
  });

  it("recusa espaços e outros caracteres que não cabem no cabeçalho", () => {
    expect(() =>
      assertSupabaseCredential("NEXT_PUBLIC_SUPABASE_ANON_KEY", " chave-real "),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY está inválida/);
  });

  it("aceita JWT e chaves publicáveis ASCII", () => {
    expect(() =>
      assertSupabaseCredential("anon", "eyJhbGciOiJIUzI1NiJ9.abc_123-def"),
    ).not.toThrow();
    expect(() =>
      assertSupabaseCredential("anon", "sb_publishable_abc123"),
    ).not.toThrow();
  });
});
