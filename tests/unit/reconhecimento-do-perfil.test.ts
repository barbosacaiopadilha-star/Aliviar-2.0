import { describe, expect, it } from "vitest";

import {
  ACKNOWLEDGEMENT_SENTENCES,
  acknowledgementOf,
  isProfileAcknowledged,
} from "@/modules/curadoria/reconhecimento-do-perfil";

describe("Reconhecimento do Perfil pela paciente", () => {
  it("o armazenamento legado vira o conceito novo, e só aqui", () => {
    expect(acknowledgementOf("VALIDATED")).toBe("RECONHECIDO");
    expect(acknowledgementOf("DRAFT")).toBe("PENDENTE");
    expect(acknowledgementOf("SUPERSEDED")).toBe("NAO_APLICAVEL");
  });

  it("Perfil que não existe ainda está pendente, não quebrado", () => {
    expect(acknowledgementOf(null)).toBe("PENDENTE");
    expect(acknowledgementOf(undefined)).toBe("PENDENTE");
    expect(isProfileAcknowledged(null)).toBe(false);
  });

  it("Perfil substituído não é cobrado da paciente como pendência", () => {
    // Cobrar reconhecimento de um Perfil que saiu de cena seria pedir a ela
    // que confirmasse algo que já não vale.
    expect(isProfileAcknowledged("SUPERSEDED")).toBe(false);
    expect(acknowledgementOf("SUPERSEDED")).not.toBe("PENDENTE");
  });

  it("nenhuma frase fala em validar critérios ou validar o Método", () => {
    for (const frase of Object.values(ACKNOWLEDGEMENT_SENTENCES)) {
      expect(frase, frase).not.toMatch(/validar|validad|critério/i);
    }
  });

  it("a frase do reconhecimento diz exatamente o que a paciente confirmou", () => {
    expect(ACKNOWLEDGEMENT_SENTENCES.RECONHECIDO).toContain("Consulta Inicial");
    expect(ACKNOWLEDGEMENT_SENTENCES.RECONHECIDO).toContain("confirmou");
  });
});
