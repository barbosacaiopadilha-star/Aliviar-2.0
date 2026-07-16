import { describe, expect, it } from "vitest";

import {
  allowedNextRelationshipStatuses,
  canClose,
  canRegisterInterruption,
  canRegisterReopening,
  isTerminalRelationshipStatus,
  isValidRelationshipTransition,
} from "@/modules/relationship/state-machine";
import { RELATIONSHIP_STATUSES } from "@/modules/relationship/types";

// [CORRIGIDO — Fase 6.1] A máquina de estados foi simplificada de 4 para
// 2 estados (ATIVO/ENCERRADO), conforme docs/architecture/DOMAIN_RELATIONSHIP.md
// (Veredito A, Fase 4.1). PAUSADO e os dois estados terminais
// (ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO) foram removidos — a
// versão anterior deste arquivo testava um modelo construído sobre uma
// teoria anterior ao fechamento da Fase 4.1.
describe("relationship state machine (docs/architecture/DOMAIN_RELATIONSHIP.md, Veredito A)", () => {
  it("permite ATIVO -> ENCERRADO", () => {
    expect(isValidRelationshipTransition("ATIVO", "ENCERRADO")).toBe(true);
  });

  it("rejeita qualquer transição a partir do estado terminal ENCERRADO", () => {
    for (const status of RELATIONSHIP_STATUSES) {
      expect(isValidRelationshipTransition("ENCERRADO", status)).toBe(false);
    }
  });

  it("rejeita repetir o mesmo estado (ATIVO -> ATIVO, ENCERRADO -> ENCERRADO)", () => {
    expect(isValidRelationshipTransition("ATIVO", "ATIVO")).toBe(false);
    expect(isValidRelationshipTransition("ENCERRADO", "ENCERRADO")).toBe(false);
  });

  it("identifica corretamente o único estado terminal", () => {
    expect(isTerminalRelationshipStatus("ENCERRADO")).toBe(true);
    expect(isTerminalRelationshipStatus("ATIVO")).toBe(false);
  });

  it("allowedNextRelationshipStatuses nunca inclui o próprio estado", () => {
    for (const status of RELATIONSHIP_STATUSES) {
      expect(allowedNextRelationshipStatuses(status)).not.toContain(status);
    }
  });

  it("allowedNextRelationshipStatuses do estado terminal é sempre vazio", () => {
    expect(allowedNextRelationshipStatuses("ENCERRADO")).toEqual([]);
  });

  it("canClose só é verdadeiro em ATIVO, nunca no estado terminal", () => {
    expect(canClose("ATIVO")).toBe(true);
    expect(canClose("ENCERRADO")).toBe(false);
  });

  it("canRegisterInterruption só é verdadeiro em ATIVO, nunca no estado terminal", () => {
    expect(canRegisterInterruption("ATIVO")).toBe(true);
    expect(canRegisterInterruption("ENCERRADO")).toBe(false);
  });

  it("canRegisterReopening só é verdadeiro no estado terminal — nunca em ATIVO", () => {
    expect(canRegisterReopening("ENCERRADO")).toBe(true);
    expect(canRegisterReopening("ATIVO")).toBe(false);
  });

  it("nenhum estado além de ATIVO/ENCERRADO existe no vocabulário oficial", () => {
    expect(RELATIONSHIP_STATUSES).toEqual(["ATIVO", "ENCERRADO"]);
  });
});
