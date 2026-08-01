import { describe, expect, it } from "vitest";

import {
  closeWithoutRelationship,
  confirmFirstAppointment,
  correctChoice,
  createConnection,
  registerContactIntent,
  type EligibilityContext,
} from "@/modules/connection/commands";
import { ConnectionError } from "@/modules/connection/errors";
import type { ConnectionRecord } from "@/modules/connection/types";

const PATIENT_ID = "patient-1";
const OTHER_PATIENT_ID = "patient-2";
const CASE_ID = "case-1";
const DELIVERY_ID = "delivery-1";
const PROFESSIONAL_A = "professional-a";
const PROFESSIONAL_B = "professional-b";
const PROFESSIONAL_OUTSIDER = "professional-outsider";
const ACTOR_ID = PATIENT_ID;

const eligibility: EligibilityContext = {
  eligibleProfessionalProfileIds: [
    PROFESSIONAL_A,
    PROFESSIONAL_B,
    "professional-c",
  ],
};

const T0 = "2026-07-15T10:00:00.000Z";
const T1 = "2026-07-15T11:00:00.000Z";

function baseRecord(
  overrides: Partial<ConnectionRecord> = {},
): ConnectionRecord {
  return {
    id: "connection-1",
    caseId: CASE_ID,
    anchor: { source: "ACE_LEGADO" as const, finalDeliveryId: DELIVERY_ID },
    patientProfileId: PATIENT_ID,
    professionalProfileId: PROFESSIONAL_A,
    status: "DECISAO_REGISTRADA",
    contactMode: null,
    decidedAt: T0,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

describe("createConnection", () => {
  it("registra a decisão com o profissional elegível", () => {
    const result = createConnection(
      {
        caseId: CASE_ID,
        anchor: { source: "ACE_LEGADO" as const, finalDeliveryId: DELIVERY_ID },
        patientProfileId: PATIENT_ID,
        professionalProfileId: PROFESSIONAL_A,
        actorId: ACTOR_ID,
        occurredAt: T0,
        recordedAt: T0,
      },
      eligibility,
    );

    expect(result.record.status).toBe("DECISAO_REGISTRADA");
    expect(result.record.professionalProfileId).toBe(PROFESSIONAL_A);
    expect(result.event.eventType).toBe("DECISAO_REGISTRADA");
    expect(result.event.occurredAt).toBe(T0);
  });

  it("rejeita profissional que não pertence à FinalCuradoria (evidência: erro específico, nunca string solta)", () => {
    expect(() =>
      createConnection(
        {
          caseId: CASE_ID,
          anchor: { source: "ACE_LEGADO" as const, finalDeliveryId: DELIVERY_ID },
          patientProfileId: PATIENT_ID,
          professionalProfileId: PROFESSIONAL_OUTSIDER,
          actorId: ACTOR_ID,
          occurredAt: T0,
          recordedAt: T0,
        },
        eligibility,
      ),
    ).toThrow(ConnectionError);

    try {
      createConnection(
        {
          caseId: CASE_ID,
          anchor: { source: "ACE_LEGADO" as const, finalDeliveryId: DELIVERY_ID },
          patientProfileId: PATIENT_ID,
          professionalProfileId: PROFESSIONAL_OUTSIDER,
          actorId: ACTOR_ID,
          occurredAt: T0,
          recordedAt: T0,
        },
        eligibility,
      );
    } catch (error) {
      expect((error as ConnectionError).code).toBe(
        "PROFESSIONAL_NOT_IN_DELIVERY",
      );
    }
  });
});

describe("correctChoice", () => {
  it("corrige a escolha enquanto em DECISAO_REGISTRADA", () => {
    const record = baseRecord();
    const result = correctChoice(
      record,
      {
        requestedByPatientProfileId: PATIENT_ID,
        newProfessionalProfileId: PROFESSIONAL_B,
        actorId: ACTOR_ID,
        occurredAt: T1,
        recordedAt: T1,
      },
      eligibility,
    );

    expect(result.record.professionalProfileId).toBe(PROFESSIONAL_B);
    expect(result.record.status).toBe("DECISAO_REGISTRADA");
    expect(result.event.eventType).toBe("CORRECAO_ESCOLHA");
  });

  it("rejeita correção fora de DECISAO_REGISTRADA (Fase 2, consequência da Decisão 1)", () => {
    const record = baseRecord({ status: "CONTATO_INICIADO" });

    expect(() =>
      correctChoice(
        record,
        {
          requestedByPatientProfileId: PATIENT_ID,
          newProfessionalProfileId: PROFESSIONAL_B,
          actorId: ACTOR_ID,
          occurredAt: T1,
          recordedAt: T1,
        },
        eligibility,
      ),
    ).toThrow(ConnectionError);
  });

  it("rejeita correção de quem não é o paciente proprietário", () => {
    const record = baseRecord();

    try {
      correctChoice(
        record,
        {
          requestedByPatientProfileId: OTHER_PATIENT_ID,
          newProfessionalProfileId: PROFESSIONAL_B,
          actorId: OTHER_PATIENT_ID,
          occurredAt: T1,
          recordedAt: T1,
        },
        eligibility,
      );
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("NOT_OWNER");
    }
  });

  it("rejeita correção para profissional fora da FinalCuradoria", () => {
    const record = baseRecord();

    try {
      correctChoice(
        record,
        {
          requestedByPatientProfileId: PATIENT_ID,
          newProfessionalProfileId: PROFESSIONAL_OUTSIDER,
          actorId: ACTOR_ID,
          occurredAt: T1,
          recordedAt: T1,
        },
        eligibility,
      );
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe(
        "PROFESSIONAL_NOT_IN_DELIVERY",
      );
    }
  });
});

describe("registerContactIntent", () => {
  it("transiciona de DECISAO_REGISTRADA para CONTATO_INICIADO", () => {
    const record = baseRecord();
    const result = registerContactIntent(record, {
      requestedByPatientProfileId: PATIENT_ID,
      actorId: ACTOR_ID,
      occurredAt: T1,
      recordedAt: T1,
    });

    expect(result.record.status).toBe("CONTATO_INICIADO");
    expect(result.event.eventType).toBe("CONTATO_INICIADO");
  });

  it("é idempotente na rejeição: chamar duas vezes falha explicitamente na segunda", () => {
    const record = baseRecord();
    const first = registerContactIntent(record, {
      requestedByPatientProfileId: PATIENT_ID,
      actorId: ACTOR_ID,
      occurredAt: T1,
      recordedAt: T1,
    });

    try {
      registerContactIntent(first.record, {
        requestedByPatientProfileId: PATIENT_ID,
        actorId: ACTOR_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("INVALID_TRANSITION");
    }
  });

  it("rejeita a partir de um estado terminal", () => {
    const record = baseRecord({ status: "ENCERRADO_SEM_RELACIONAMENTO" });

    try {
      registerContactIntent(record, {
        requestedByPatientProfileId: PATIENT_ID,
        actorId: ACTOR_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("TERMINAL_STATE");
    }
  });

  it("rejeita de quem não é o paciente proprietário", () => {
    const record = baseRecord();

    try {
      registerContactIntent(record, {
        requestedByPatientProfileId: OTHER_PATIENT_ID,
        actorId: OTHER_PATIENT_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("NOT_OWNER");
    }
  });
});

describe("confirmFirstAppointment", () => {
  it("confirma a partir de DECISAO_REGISTRADA (sem exigir CONTATO_INICIADO)", () => {
    const record = baseRecord();
    const result = confirmFirstAppointment(record, {
      requestedByPatientProfileId: PATIENT_ID,
      actorId: ACTOR_ID,
      occurredAt: T1,
      recordedAt: T1,
    });

    expect(result.record.status).toBe("PRIMEIRO_ATENDIMENTO_REALIZADO");
  });

  it("confirma a partir de CONTATO_INICIADO", () => {
    const record = baseRecord({ status: "CONTATO_INICIADO" });
    const result = confirmFirstAppointment(record, {
      requestedByPatientProfileId: PATIENT_ID,
      actorId: ACTOR_ID,
      occurredAt: T1,
      recordedAt: T1,
    });

    expect(result.record.status).toBe("PRIMEIRO_ATENDIMENTO_REALIZADO");
  });

  it("rejeita confirmar duas vezes (estado já terminal)", () => {
    const record = baseRecord({ status: "PRIMEIRO_ATENDIMENTO_REALIZADO" });

    try {
      confirmFirstAppointment(record, {
        requestedByPatientProfileId: PATIENT_ID,
        actorId: ACTOR_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("TERMINAL_STATE");
    }
  });

  it("rejeita confirmar um Connection já encerrado sem relacionamento", () => {
    const record = baseRecord({ status: "ENCERRADO_SEM_RELACIONAMENTO" });

    try {
      confirmFirstAppointment(record, {
        requestedByPatientProfileId: PATIENT_ID,
        actorId: ACTOR_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("TERMINAL_STATE");
    }
  });

  it("rejeita de quem não é o paciente proprietário", () => {
    const record = baseRecord();

    try {
      confirmFirstAppointment(record, {
        requestedByPatientProfileId: OTHER_PATIENT_ID,
        actorId: OTHER_PATIENT_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("NOT_OWNER");
    }
  });
});

describe("closeWithoutRelationship", () => {
  it("encerra a partir de DECISAO_REGISTRADA", () => {
    const record = baseRecord();
    const result = closeWithoutRelationship(record, {
      requestedByPatientProfileId: PATIENT_ID,
      actorId: ACTOR_ID,
      occurredAt: T1,
      recordedAt: T1,
    });

    expect(result.record.status).toBe("ENCERRADO_SEM_RELACIONAMENTO");
    expect(result.event.payload).toEqual({});
  });

  it("encerra a partir de CONTATO_INICIADO, preservando o motivo no payload quando informado", () => {
    const record = baseRecord({ status: "CONTATO_INICIADO" });
    const result = closeWithoutRelationship(record, {
      requestedByPatientProfileId: PATIENT_ID,
      actorId: ACTOR_ID,
      occurredAt: T1,
      recordedAt: T1,
      reason: "Prefiro tentar outro caminho.",
    });

    expect(result.record.status).toBe("ENCERRADO_SEM_RELACIONAMENTO");
    expect(result.event.payload).toEqual({
      reason: "Prefiro tentar outro caminho.",
    });
  });

  it("rejeita encerrar um Connection já terminal", () => {
    const record = baseRecord({ status: "PRIMEIRO_ATENDIMENTO_REALIZADO" });

    try {
      closeWithoutRelationship(record, {
        requestedByPatientProfileId: PATIENT_ID,
        actorId: ACTOR_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("TERMINAL_STATE");
    }
  });

  it("rejeita de quem não é o paciente proprietário", () => {
    const record = baseRecord();

    try {
      closeWithoutRelationship(record, {
        requestedByPatientProfileId: OTHER_PATIENT_ID,
        actorId: OTHER_PATIENT_ID,
        occurredAt: T1,
        recordedAt: T1,
      });
      expect.unreachable();
    } catch (error) {
      expect((error as ConnectionError).code).toBe("NOT_OWNER");
    }
  });
});
