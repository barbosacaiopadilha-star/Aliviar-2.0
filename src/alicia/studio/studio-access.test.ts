import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALICIA_STUDIO_PATH_PREFIX,
  isAliciaStudioEnabled,
  isAliciaStudioPath,
} from "@/alicia/studio/studio-access";

describe("isAliciaStudioPath", () => {
  it("reconhece rotas do Studio", () => {
    expect(isAliciaStudioPath(ALICIA_STUDIO_PATH_PREFIX)).toBe(true);
    expect(isAliciaStudioPath("/alicia/studio/inbox")).toBe(true);
    expect(isAliciaStudioPath("/alicia/studio/candidatos/abc")).toBe(true);
  });

  it("não confunde com rotas públicas da AliCIA", () => {
    expect(isAliciaStudioPath("/alicia")).toBe(false);
    expect(isAliciaStudioPath("/alicia/mapa")).toBe(false);
  });
});

describe("isAliciaStudioEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("habilita em desenvolvimento", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isAliciaStudioEnabled()).toBe(true);
  });

  it("desabilita em produção", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isAliciaStudioEnabled()).toBe(false);
  });
});
