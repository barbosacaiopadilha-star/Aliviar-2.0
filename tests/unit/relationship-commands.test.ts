import { describe, expect, it } from "vitest";

import {
  closePlanned,
  createRelationship,
  registerInterruption,
  registerReopening,
} from "@/modules/relationship/commands";
import { RelationshipError } from "@/modules/relationship/errors";
import type { RelationshipRecord } from "@/modules/relationship/types";

// [CORRIGIDO — Fase 6.1] pauseRelationship/resumeRelationship removidos —
// PAUSADO não é estado oficial (docs/architecture/DOMAIN_RELATIONSHIP.md,
// Fase 4.1). closePlanned/registerInterruption agora transicionam para o
// único estado terminal ENCERRADO (nunca ENCERRADO_PLANEJADO/
// ENCERRADO_POR_INTERRUPCAO) — a distinção de motivo permanece só no
// eventType, nunca no status.

const CONNECTION_ID = "connection-1";
const CASE_ID = "case-1";
const PATIENT_ID = "patient-1";
const PROFESSIONAL_ID = "professional-1";
const OTHER_PATIENT_ID = "patient-2";
const TEAM_MEMBER_ID = "team-1";
const NOW = "2026-07-15T10:00:00.000Z";
const LATER = "2026-07-15T11:00:00.000Z";

function buildRecord(
  overrides: Partial<RelationshipRecord> = {},
): RelationshipRecord {
  return {
    id: "relationship-1",
    connectionId: CONNECTION_ID,
    caseId: CASE_ID,
    patientProfileId: PATIENT_ID,
    professionalProfileId: PROFESSIONAL_ID,
    status: "ATIVO",
    startedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("createRelationship", () => {
  it("cria o registro em ATIVO com o evento RELACIONAMENTO_INICIADO, com autor sistema", () => {
    const result = createRelationship({
      connectionId: CONNECTION_ID,
      caseId: CASE_ID,
      patientProfileId: PATIENT_ID,
      professionalProfileId: PROFESSIONAL_ID,
      author: { kind: "sistema", actorId: PATIENT_ID },
      occurredAt: NOW,
      recordedAt: NOW,
    });

    expect(result.record.status).toBe("ATIVO");
    expect(result.record.connectionId).toBe(CONNECTION_ID);
    expect(result.record.caseId).toBe(CASE_ID);
    expect(result.record.patientProfileId).toBe(PATIENT_ID);
    expect(result.record.professionalProfileId).toBe(PROFESSIONAL_ID);
    expect(result.record.startedAt).toBe(NOW);
    expect(result.event.eventType).toBe("RELACIONAMENTO_INICIADO");
    expect(result.event.actorId).toBe(PATIENT_ID);
  });

  it("rejeita autor que não seja 'sistema' (INVALID_AUTHOR)", () => {
    expect(() =>
      createRelationship({
        connectionId: CONNECTION_ID,
        caseId: CASE_ID,
        patientProfileId: PATIENT_ID,
        professionalProfileId: PROFESSIONAL_ID,
        author: { kind: "paciente", patientProfileId: PATIENT_ID },
        occurredAt: NOW,
        recordedAt: NOW,
      }),
    ).toThrow(RelationshipError);

    try {
      createRelationship({
        connectionId: CONNECTION_ID,
        caseId: CASE_ID,
        patientProfileId: PATIENT_ID,
        professionalProfileId: PROFESSIONAL_ID,
        author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
        occurredAt: NOW,
        recordedAt: NOW,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect(error).toBeInstanceOf(RelationshipError);
      expect((error as RelationshipError).code).toBe("INVALID_AUTHOR");
    }
  });
});

describe("closePlanned", () => {
  it("transiciona ATIVO -> ENCERRADO quando o autor é o próprio paciente", () => {
    const record = buildRecord({ status: "ATIVO" });
    const result = closePlanned(record, {
      author: { kind: "paciente", patientProfileId: PATIENT_ID },
      occurredAt: NOW,
      recordedAt: NOW,
    });

    expect(result.record.status).toBe("ENCERRADO");
    expect(result.event.eventType).toBe("ENCERRAMENTO_PLANEJADO_DECLARADO");
  });

  it("rejeita autor equipe — encerramento planejado é exclusivo do paciente (INVALID_AUTHOR)", () => {
    const record = buildRecord({ status: "ATIVO" });
    expect(() =>
      closePlanned(record, {
        author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
        occurredAt: NOW,
        recordedAt: NOW,
      }),
    ).toThrow(RelationshipError);
  });

  it("rejeita encerrar um Relationship já terminal (RELATIONSHIP_NOT_ACTIVE)", () => {
    const record = buildRecord({ status: "ENCERRADO" });
    try {
      closePlanned(record, {
        author: { kind: "paciente", patientProfileId: PATIENT_ID },
        occurredAt: NOW,
        recordedAt: NOW,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect((error as RelationshipError).code).toBe("RELATIONSHIP_NOT_ACTIVE");
    }
  });

  it("rejeita repetir o encerramento (INVALID_TRANSITION/RELATIONSHIP_NOT_ACTIVE) — idempotência", () => {
    const record = buildRecord({ status: "ATIVO" });
    const closed = closePlanned(record, {
      author: { kind: "paciente", patientProfileId: PATIENT_ID },
      occurredAt: NOW,
      recordedAt: NOW,
    });

    try {
      closePlanned(closed.record, {
        author: { kind: "paciente", patientProfileId: PATIENT_ID },
        occurredAt: LATER,
        recordedAt: LATER,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect(error).toBeInstanceOf(RelationshipError);
      expect((error as RelationshipError).code).toBe("RELATIONSHIP_NOT_ACTIVE");
    }
  });
});

describe("registerInterruption", () => {
  it("paciente pode declarar interrupção, sem observação obrigatória", () => {
    const record = buildRecord({ status: "ATIVO" });
    const result = registerInterruption(record, {
      author: { kind: "paciente", patientProfileId: PATIENT_ID },
      observation: null,
      occurredAt: NOW,
      recordedAt: NOW,
    });

    expect(result.record.status).toBe("ENCERRADO");
    expect(result.event.eventType).toBe("INTERRUPCAO_DECLARADA");
    expect(result.event.actorId).toBe(PATIENT_ID);
    expect(result.event.payload).toEqual({});
  });

  it("equipe pode declarar interrupção, mas exige observação (INVALID_TERMINATION se ausente)", () => {
    const record = buildRecord({ status: "ATIVO" });

    try {
      registerInterruption(record, {
        author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
        observation: null,
        occurredAt: NOW,
        recordedAt: NOW,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect(error).toBeInstanceOf(RelationshipError);
      expect((error as RelationshipError).code).toBe("INVALID_TERMINATION");
    }

    const result = registerInterruption(record, {
      author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
      observation: "Paciente inalcançável após 3 tentativas de contato.",
      occurredAt: NOW,
      recordedAt: NOW,
    });
    expect(result.record.status).toBe("ENCERRADO");
    expect(result.event.actorId).toBe(TEAM_MEMBER_ID);
    expect(result.event.payload).toEqual({
      observation: "Paciente inalcançável após 3 tentativas de contato.",
    });
  });

  it("rejeita autor que não seja o paciente dono nem a equipe (INVALID_AUTHOR)", () => {
    const record = buildRecord({ status: "ATIVO" });
    expect(() =>
      registerInterruption(record, {
        author: { kind: "paciente", patientProfileId: OTHER_PATIENT_ID },
        observation: null,
        occurredAt: NOW,
        recordedAt: NOW,
      }),
    ).toThrow(RelationshipError);
  });

  it("rejeita interromper um Relationship já terminal (RELATIONSHIP_NOT_ACTIVE)", () => {
    const record = buildRecord({ status: "ENCERRADO" });
    try {
      registerInterruption(record, {
        author: { kind: "paciente", patientProfileId: PATIENT_ID },
        observation: null,
        occurredAt: NOW,
        recordedAt: NOW,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect((error as RelationshipError).code).toBe("RELATIONSHIP_NOT_ACTIVE");
    }
  });
});

describe("registerReopening", () => {
  it("equipe registra reabertura contra um Relationship terminal, sem alterar seu status", () => {
    const record = buildRecord({ status: "ENCERRADO" });
    const result = registerReopening(record, {
      author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
      reference: { newCaseId: "case-2" },
      occurredAt: NOW,
      recordedAt: NOW,
    });

    expect(result.event.eventType).toBe("REABERTURA_OBSERVADA");
    expect(result.event.actorId).toBe(TEAM_MEMBER_ID);
    expect(result.event.payload).toEqual({ newCaseId: "case-2" });
    // Nunca retorna um `record` — a reabertura nunca altera o status.
    expect("record" in result).toBe(false);
  });

  it("pode ser registrada múltiplas vezes contra o mesmo Relationship terminal", () => {
    const record = buildRecord({ status: "ENCERRADO" });
    const first = registerReopening(record, {
      author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
      reference: { newCaseId: "case-2" },
      occurredAt: NOW,
      recordedAt: NOW,
    });
    const second = registerReopening(record, {
      author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
      reference: { newCaseId: "case-3" },
      occurredAt: LATER,
      recordedAt: LATER,
    });

    expect(first.event.payload).toEqual({ newCaseId: "case-2" });
    expect(second.event.payload).toEqual({ newCaseId: "case-3" });
  });

  it("rejeita autor paciente — reabertura é exclusiva da equipe (INVALID_AUTHOR)", () => {
    const record = buildRecord({ status: "ENCERRADO" });
    expect(() =>
      registerReopening(record, {
        author: { kind: "paciente", patientProfileId: PATIENT_ID },
        reference: { newCaseId: "case-2" },
        occurredAt: NOW,
        recordedAt: NOW,
      }),
    ).toThrow(RelationshipError);
  });

  it("rejeita registrar contra um Relationship não-terminal (INVALID_REOPEN)", () => {
    const record = buildRecord({ status: "ATIVO" });
    try {
      registerReopening(record, {
        author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
        reference: { newCaseId: "case-2" },
        occurredAt: NOW,
        recordedAt: NOW,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect(error).toBeInstanceOf(RelationshipError);
      expect((error as RelationshipError).code).toBe("INVALID_REOPEN");
    }
  });

  it("rejeita referência de novo Caso vazia (INVALID_REOPEN)", () => {
    const record = buildRecord({ status: "ENCERRADO" });
    try {
      registerReopening(record, {
        author: { kind: "equipe", teamMemberId: TEAM_MEMBER_ID },
        reference: { newCaseId: "" },
        occurredAt: NOW,
        recordedAt: NOW,
      });
      expect.fail("deveria ter lançado");
    } catch (error) {
      expect((error as RelationshipError).code).toBe("INVALID_REOPEN");
    }
  });
});

describe("invariantes transversais", () => {
  it("nenhum comando altera professionalProfileId, connectionId ou caseId", () => {
    const record = buildRecord({ status: "ATIVO" });

    const closed = closePlanned(record, {
      author: { kind: "paciente", patientProfileId: PATIENT_ID },
      occurredAt: NOW,
      recordedAt: NOW,
    });
    expect(closed.record.professionalProfileId).toBe(PROFESSIONAL_ID);
    expect(closed.record.connectionId).toBe(CONNECTION_ID);
    expect(closed.record.caseId).toBe(CASE_ID);
  });

  it("nenhum comando produz ExperienceSignal, hipótese ou julgamento de compatibilidade (nenhum desses conceitos existe nos resultados)", () => {
    const record = buildRecord({ status: "ATIVO" });
    const result = closePlanned(record, {
      author: { kind: "paciente", patientProfileId: PATIENT_ID },
      occurredAt: NOW,
      recordedAt: NOW,
    });

    expect(result).not.toHaveProperty("experienceSignal");
    expect(result).not.toHaveProperty("hypothesis");
    expect(result).not.toHaveProperty("compatibility");
  });

  it("PAUSADO não existe como estado atingível por nenhum comando", () => {
    const record = buildRecord({ status: "ATIVO" });
    const closed = closePlanned(record, {
      author: { kind: "paciente", patientProfileId: PATIENT_ID },
      occurredAt: NOW,
      recordedAt: NOW,
    });
    const interrupted = registerInterruption(buildRecord({ status: "ATIVO" }), {
      author: { kind: "paciente", patientProfileId: PATIENT_ID },
      observation: null,
      occurredAt: NOW,
      recordedAt: NOW,
    });

    expect(closed.record.status).not.toBe("PAUSADO");
    expect(interrupted.record.status).not.toBe("PAUSADO");
  });
});
