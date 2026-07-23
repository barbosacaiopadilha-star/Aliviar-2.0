import { describe, expect, it } from "vitest";

import {
  authorize,
  authorizePatientOwnership,
  authorizeStageAdvance,
} from "./authorization";
import { KERNEL_PERMISSION_MATRIX, STAGE_ADVANCE_ROLES } from "./permissions";

describe("kernel RBAC", () => {
  it("define permiss├Áes para todos os pap├®is do sprint", () => {
    for (const role of ["PATIENT", "CURATOR", "OPERATION", "MANAGER", "ADMIN", "AUDITOR"] as const) {
      const hasRead = KERNEL_PERMISSION_MATRIX["journey.read"].includes(role);
      expect(hasRead).toBe(true);
    }
  });

  it("AUDITOR n├úo cria jornada nem compromissos", () => {
    expect(authorize({ id: "a1", role: "AUDITOR" }, "journey.create").ok).toBe(false);
    expect(authorize({ id: "a1", role: "AUDITOR" }, "journey.commitments.create").ok).toBe(false);
    expect(authorize({ id: "a1", role: "AUDITOR" }, "journey.timeline.read").ok).toBe(true);
  });

  it("PATIENT s├│ acessa pr├│pria jornada", () => {
    const ok = authorizePatientOwnership(
      { id: "p1", role: "PATIENT", patientId: "patient-1" },
      "patient-1",
    );
    const denied = authorizePatientOwnership(
      { id: "p1", role: "PATIENT", patientId: "patient-1" },
      "patient-2",
    );

    expect(ok.ok).toBe(true);
    expect(denied.ok).toBe(false);
  });

  it("CURATOR avan├ºa CURADORIA mas n├úo ESCOLHA", () => {
    expect(
      authorizeStageAdvance({ id: "c1", role: "CURATOR" }, "CURADORIA", "p-1").ok,
    ).toBe(true);
    expect(
      authorizeStageAdvance({ id: "c1", role: "CURATOR" }, "ESCOLHA", "p-1").ok,
    ).toBe(false);
  });

  it("PATIENT avan├ºa CADASTRO e ESCOLHA", () => {
    expect(
      authorizeStageAdvance(
        { id: "p1", role: "PATIENT", patientId: "patient-1" },
        "CADASTRO",
        "patient-1",
      ).ok,
    ).toBe(true);
    expect(
      authorizeStageAdvance(
        { id: "p1", role: "PATIENT", patientId: "patient-1" },
        "ESCOLHA",
        "patient-1",
      ).ok,
    ).toBe(true);
  });

  it("cada etapa operacional tem pap├®is de avan├ºo definidos", () => {
    for (const stage of Object.keys(STAGE_ADVANCE_ROLES)) {
      expect(STAGE_ADVANCE_ROLES[stage as keyof typeof STAGE_ADVANCE_ROLES]).toBeDefined();
    }
    expect(STAGE_ADVANCE_ROLES.ENCERRADO).toHaveLength(0);
  });
});
