import { describe, expect, it } from "vitest";

import {
  ACKNOWLEDGE_ACTION_LABEL,
  ACKNOWLEDGE_CONFIRMATION,
  DECISION_MESSAGES,
  decideAcknowledgement,
} from "@/modules/curadoria/reconhecimento-do-perfil";

describe("Reconhecimento pelo Mapa de Prioridades — ADR-042", () => {
  it("Mapa completo permite o reconhecimento", () => {
    expect(decideAcknowledgement("DRAFT", 0)).toBe("PODE_RECONHECER");
  });

  it("Mapa incompleto recusa, e a mensagem não culpa a paciente", () => {
    expect(decideAcknowledgement("DRAFT", 1)).toBe("MAPA_INCOMPLETO");
    expect(decideAcknowledgement("DRAFT", 26)).toBe("MAPA_INCOMPLETO");

    const mensagem = DECISION_MESSAGES.MAPA_INCOMPLETO;
    expect(mensagem).toContain("ainda está sendo construído");
    // O que falta é trabalho da Curadoria, não erro dela.
    expect(mensagem).not.toMatch(/você não|inválido|erro/i);
  });

  it("a decisão é idempotente — reconhecer de novo não é falha", () => {
    expect(decideAcknowledgement("VALIDATED", 0)).toBe("JA_RECONHECIDO");
    // Mesmo com o Mapa em qualquer estado: já feito é já feito.
    expect(decideAcknowledgement("VALIDATED", 9)).toBe("JA_RECONHECIDO");
  });

  it("Perfil substituído não gera pendência nem aceita reconhecimento", () => {
    expect(decideAcknowledgement("SUPERSEDED", 0)).toBe("PERFIL_SUBSTITUIDO");
    expect(decideAcknowledgement("SUPERSEDED", 5)).toBe("PERFIL_SUBSTITUIDO");
    expect(decideAcknowledgement("SUPERSEDED", 0)).not.toBe("PODE_RECONHECER");
    expect(decideAcknowledgement("SUPERSEDED", 5)).not.toBe("MAPA_INCOMPLETO");
  });

  it("Perfil inexistente ainda não é reconhecível, e não quebra", () => {
    expect(decideAcknowledgement(null, 0)).toBe("PODE_RECONHECER");
    expect(decideAcknowledgement(undefined, 3)).toBe("MAPA_INCOMPLETO");
  });

  it("a soma de pontos não participa da decisão", () => {
    // A função inteira recebe DOIS argumentos: estado e pendências do Mapa.
    // Não há por onde um peso entrar.
    expect(decideAcknowledgement.length).toBe(2);
    const fonte = decideAcknowledgement.toString();
    expect(fonte).not.toMatch(/100|weight|peso|priority_weights|cruzamento/i);
  });

  it("o rótulo nomeia o que ela confirma, e não fala em validar", () => {
    expect(ACKNOWLEDGE_ACTION_LABEL).toBe(
      "Confirmar que este Perfil representa minhas prioridades",
    );
    expect(ACKNOWLEDGE_ACTION_LABEL).not.toMatch(/validar|critério|método/i);
  });

  it("a confirmação diz o que vai acontecer, não 'tem certeza?'", () => {
    // Invariante 28: Perfil reconhecido é imutável. A tela avisa ANTES.
    expect(ACKNOWLEDGE_CONFIRMATION).toContain("não muda mais");
    expect(ACKNOWLEDGE_CONFIRMATION).toContain("construir um novo");
    expect(ACKNOWLEDGE_CONFIRMATION).not.toMatch(/tem certeza/i);
  });
});
