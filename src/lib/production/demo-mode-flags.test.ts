import { describe, expect, it, afterEach, vi } from "vitest";

import {
  DEMO_MODE_FLAGS,
  DemoRuntimeDisabledError,
  assertDemoRuntimeAllowed,
  isDemoModeEnabled,
  isPatientDemoMode,
  listDemoModeStates,
} from "./demo-mode-flags";

describe("demo-mode-flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("desabilita todos os modos demo em production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALIVIAR_PATIENT_DEMO_MODE", "true");
    vi.stubEnv("ALIVIAR_CURATOR_DEMO_MODE", "true");
    vi.stubEnv("ALIVIAR_REPORT_DEMO_MODE", "true");

    expect(isPatientDemoMode()).toBe(false);
    expect(isDemoModeEnabled(DEMO_MODE_FLAGS.CURATOR_DEMO_MODE)).toBe(false);
    expect(isDemoModeEnabled(DEMO_MODE_FLAGS.REPORT_DEMO_MODE)).toBe(false);
  });

  it("habilita modo demo apenas fora de production com env explícita", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALIVIAR_PATIENT_DEMO_MODE", "true");
    vi.stubEnv("ALIVIAR_CURATOR_DEMO_MODE", "0");
    vi.stubEnv("ALIVIAR_REPORT_DEMO_MODE", "yes");

    expect(isPatientDemoMode()).toBe(true);
    expect(isDemoModeEnabled(DEMO_MODE_FLAGS.CURATOR_DEMO_MODE)).toBe(false);
    expect(isDemoModeEnabled(DEMO_MODE_FLAGS.REPORT_DEMO_MODE)).toBe(true);
    expect(listDemoModeStates()).toHaveLength(3);
  });

  it("assertDemoRuntimeAllowed lança erro quando desabilitado", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertDemoRuntimeAllowed(DEMO_MODE_FLAGS.PATIENT_DEMO_MODE)).toThrow(
      DemoRuntimeDisabledError,
    );
  });
});
