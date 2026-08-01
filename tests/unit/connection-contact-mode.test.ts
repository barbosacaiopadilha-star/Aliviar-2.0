import { describe, expect, it } from "vitest";

import { defineContactMode } from "@/modules/connection/commands";
import { ConnectionError } from "@/modules/connection/errors";
import { isContactMode, type ConnectionRecord } from "@/modules/connection/types";

/**
 * Incremento 1 da Continuidade Pós-Decisão — o comando puro.
 *
 * O que estes testes pinam não é comportamento de tela: são as três
 * propriedades que o documento de decisões técnicas exige do modo de contato
 * — não é transição, é exclusivo da paciente, e só existe enquanto nenhum
 * efeito foi produzido.
 */

const PATIENT = "patient-1";
const OUTRA = "patient-2";
const T0 = "2026-08-01T10:00:00.000Z";

function record(overrides: Partial<ConnectionRecord> = {}): ConnectionRecord {
  return {
    id: "connection-1",
    caseId: "case-1",
    anchor: { source: "ACE_LEGADO", finalDeliveryId: "delivery-1" },
    patientProfileId: PATIENT,
    professionalProfileId: "professional-1",
    status: "DECISAO_REGISTRADA",
    contactMode: null,
    decidedAt: T0,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

const input = {
  requestedByPatientProfileId: PATIENT,
  contactMode: "CONTATO_DIRETO_ACOMPANHADO" as const,
  actorId: PATIENT,
  occurredAt: T0,
  recordedAt: T0,
};

describe("defineContactMode", () => {
  it("define o primeiro modo e produz o evento correspondente", () => {
    const result = defineContactMode(record(), input);

    expect(result).not.toBeNull();
    expect(result!.record.contactMode).toBe("CONTATO_DIRETO_ACOMPANHADO");
    expect(result!.event.eventType).toBe("MODO_CONTATO_DEFINIDO");
    expect(result!.event.payload).toEqual({
      previousMode: null,
      contactMode: "CONTATO_DIRETO_ACOMPANHADO",
    });
  });

  it("NÃO altera o status — definir o modo nunca foi uma transição", () => {
    const result = defineContactMode(record(), input);
    expect(result!.record.status).toBe("DECISAO_REGISTRADA");
  });

  it("é idempotente: repetir o mesmo modo não produz evento", () => {
    const atual = record({ contactMode: "CONTATO_DIRETO_ACOMPANHADO" });
    expect(defineContactMode(atual, input)).toBeNull();
  });

  it("permite mudança legítima e preserva o modo anterior no evento", () => {
    const atual = record({ contactMode: "APROXIMACAO_INTERMEDIADA" });
    const result = defineContactMode(atual, input);

    expect(result!.record.contactMode).toBe("CONTATO_DIRETO_ACOMPANHADO");
    expect(result!.event.payload).toEqual({
      previousMode: "APROXIMACAO_INTERMEDIADA",
      contactMode: "CONTATO_DIRETO_ACOMPANHADO",
    });
  });

  it("recusa quem não é a paciente proprietária", () => {
    expect(() =>
      defineContactMode(record(), {
        ...input,
        requestedByPatientProfileId: OUTRA,
      }),
    ).toThrowError(ConnectionError);

    try {
      defineContactMode(record(), {
        ...input,
        requestedByPatientProfileId: OUTRA,
      });
    } catch (error) {
      expect((error as ConnectionError).code).toBe("NOT_OWNER");
    }
  });

  it.each([
    "CONTATO_INICIADO",
    "PRIMEIRO_ATENDIMENTO_REALIZADO",
    "ENCERRADO_SEM_RELACIONAMENTO",
  ] as const)(
    "recusa definir o modo depois de produzido efeito (%s)",
    (status) => {
      try {
        defineContactMode(record({ status }), input);
        throw new Error("deveria ter recusado");
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectionError);
        expect((error as ConnectionError).code).toBe("CONTACT_MODE_NOT_ALLOWED");
      }
    },
  );
});

describe("isContactMode — nenhum modo é inferido", () => {
  it("aceita apenas os dois valores canônicos", () => {
    expect(isContactMode("CONTATO_DIRETO_ACOMPANHADO")).toBe(true);
    expect(isContactMode("APROXIMACAO_INTERMEDIADA")).toBe(true);
  });

  it("null, vazio e desconhecido nunca viram um modo", () => {
    expect(isContactMode(null)).toBe(false);
    expect(isContactMode(undefined)).toBe(false);
    expect(isContactMode("")).toBe(false);
    expect(isContactMode("DIRETO")).toBe(false);
    expect(isContactMode("contato_direto_acompanhado")).toBe(false);
  });
});
