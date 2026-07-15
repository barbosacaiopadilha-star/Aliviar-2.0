import { describe, expect, it } from "vitest";

import {
  allowedNextConnectionStatuses,
  isTerminalConnectionStatus,
  isValidConnectionTransition,
} from "@/modules/connection/state-machine";
import { CONNECTION_STATUSES } from "@/modules/connection/types";

describe("connection state machine (Connection MVP, Fase 2)", () => {
  it("permite a sequência feliz completa, com CONTATO_INICIADO", () => {
    expect(
      isValidConnectionTransition("DECISAO_REGISTRADA", "CONTATO_INICIADO"),
    ).toBe(true);
    expect(
      isValidConnectionTransition(
        "CONTATO_INICIADO",
        "PRIMEIRO_ATENDIMENTO_REALIZADO",
      ),
    ).toBe(true);
  });

  it("permite confirmar atendimento direto de DECISAO_REGISTRADA, sem passar por CONTATO_INICIADO", () => {
    expect(
      isValidConnectionTransition(
        "DECISAO_REGISTRADA",
        "PRIMEIRO_ATENDIMENTO_REALIZADO",
      ),
    ).toBe(true);
  });

  it("permite encerrar sem relacionamento a partir dos dois estados não-terminais", () => {
    expect(
      isValidConnectionTransition(
        "DECISAO_REGISTRADA",
        "ENCERRADO_SEM_RELACIONAMENTO",
      ),
    ).toBe(true);
    expect(
      isValidConnectionTransition(
        "CONTATO_INICIADO",
        "ENCERRADO_SEM_RELACIONAMENTO",
      ),
    ).toBe(true);
  });

  it("rejeita qualquer transição a partir de um estado terminal", () => {
    for (const terminal of [
      "PRIMEIRO_ATENDIMENTO_REALIZADO",
      "ENCERRADO_SEM_RELACIONAMENTO",
    ] as const) {
      for (const status of CONNECTION_STATUSES) {
        expect(isValidConnectionTransition(terminal, status)).toBe(false);
      }
    }
  });

  it("rejeita transição 'para trás' (CONTATO_INICIADO -> DECISAO_REGISTRADA)", () => {
    expect(
      isValidConnectionTransition("CONTATO_INICIADO", "DECISAO_REGISTRADA"),
    ).toBe(false);
  });

  it("identifica corretamente os dois estados terminais", () => {
    expect(isTerminalConnectionStatus("PRIMEIRO_ATENDIMENTO_REALIZADO")).toBe(
      true,
    );
    expect(isTerminalConnectionStatus("ENCERRADO_SEM_RELACIONAMENTO")).toBe(
      true,
    );
    expect(isTerminalConnectionStatus("DECISAO_REGISTRADA")).toBe(false);
    expect(isTerminalConnectionStatus("CONTATO_INICIADO")).toBe(false);
  });

  it("allowedNextConnectionStatuses nunca inclui o próprio estado", () => {
    for (const status of CONNECTION_STATUSES) {
      expect(allowedNextConnectionStatuses(status)).not.toContain(status);
    }
  });

  it("allowedNextConnectionStatuses dos estados terminais é sempre vazio", () => {
    expect(
      allowedNextConnectionStatuses("PRIMEIRO_ATENDIMENTO_REALIZADO"),
    ).toEqual([]);
    expect(
      allowedNextConnectionStatuses("ENCERRADO_SEM_RELACIONAMENTO"),
    ).toEqual([]);
  });
});
