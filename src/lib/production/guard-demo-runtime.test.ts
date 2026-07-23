import { describe, expect, it, vi, afterEach } from "vitest";

import { DEMO_MODE_FLAGS } from "@/lib/production/demo-mode-flags";
import { guardPatientDemoAccess } from "@/lib/production/guard-demo-runtime";

vi.mock("@/lib/auth/resolve-patient-access", () => ({
  resolvePatientAccess: vi.fn(async () => ({ status: "unauthenticated" as const })),
}));

describe("guard-demo-runtime", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("nega acesso público quando demo mode está desabilitado", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALIVIAR_PATIENT_DEMO_MODE", "false");

    const request = new Request("http://localhost/api/v1/me/primeiro-portal");
    const { denied } = await guardPatientDemoAccess(request);

    expect(denied).not.toBeNull();
    expect(denied?.status).toBe(401);
  });

  it("permite demo mode fora de production com flag ativa", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALIVIAR_PATIENT_DEMO_MODE", "true");

    const request = new Request("http://localhost/api/v1/me/primeiro-portal");
    const { denied } = await guardPatientDemoAccess(request);

    expect(denied).toBeNull();
    expect(DEMO_MODE_FLAGS.PATIENT_DEMO_MODE).toBe("PATIENT_DEMO_MODE");
  });
});
