// B-2 (RELEASE BLOCKERS / ADR-064) — a abertura do Relatório é voz do Curador.
//
// A composição é a única prosa que a paciente lê antes das cartas: o Curador
// dizendo por que estes três caminhos, juntos, servem a ela. O rascunho
// assistido preenche esse campo com texto de TRABALHO INTERNO — dirigido ao
// Curador, não a ela — e regenerar sobrescreve o que ele escreveu na Mesa.
//
// Aqui prova-se a guarda pura que a emissão consulta. O acoplamento com o que
// o gerador de fato grava no banco é provado na integração
// (tests/integration/relatorio-assistido.integration.test.ts).

import { describe, expect, it } from "vitest";

import {
  composicaoPendenteDoCurador,
  FRASE_COMPOSICAO_RASCUNHO,
} from "@/modules/curadoria/relatorio-inteligente";

describe("Composição do Relatório — a emissão exige a frase do Curador (B-2)", () => {
  it("emissão bloqueada: a composição ainda é o texto do rascunho assistido", () => {
    expect(composicaoPendenteDoCurador(FRASE_COMPOSICAO_RASCUNHO)).toBe("DO_SISTEMA");
  });

  it("espaço em volta não disfarça o texto do sistema", () => {
    expect(composicaoPendenteDoCurador(`\n  ${FRASE_COMPOSICAO_RASCUNHO}  \n`)).toBe("DO_SISTEMA");
  });

  it("fail-closed: composição ausente ou em branco também impede a emissão", () => {
    expect(composicaoPendenteDoCurador(null)).toBe("AUSENTE");
    expect(composicaoPendenteDoCurador("")).toBe("AUSENTE");
    expect(composicaoPendenteDoCurador("   \n  ")).toBe("AUSENTE");
  });

  it("emissão permitida: o Curador escreveu a frase dele", () => {
    expect(
      composicaoPendenteDoCurador(
        "Três caminhos de coluna com abordagens distintas: cirúrgica, conservadora e " +
          "reabilitadora — a troca entre eles é legível para você.",
      ),
    ).toBeNull();
  });

  it("emissão permitida: o Curador partiu do rascunho e o reescreveu de verdade", () => {
    // Editar o texto do sistema é assumi-lo. O que a guarda recusa é o texto
    // INTACTO — não o Curador que aproveitou a estrutura e escreveu a dele.
    expect(
      composicaoPendenteDoCurador(
        "Três caminhos legítimos, construídos sobre o que você declarou e o que verificamos " +
          "com cada profissional. A ordem é de apresentação, não de preferência.",
      ),
    ).toBeNull();
  });

  it("a frase do rascunho é texto de bastidor — fala com o Curador, nunca com a paciente", () => {
    // Guarda de regressão do vocabulário (ADR-064 §6): se algum dia a frase do
    // gerador deixar de se anunciar como rascunho, este teste cai e obriga a
    // revisar a guarda junto — não é a paciente quem descobre a mudança.
    expect(FRASE_COMPOSICAO_RASCUNHO).toContain("Rascunho assistido");
    expect(FRASE_COMPOSICAO_RASCUNHO).toContain("Revisão do Curador pendente");
  });
});
