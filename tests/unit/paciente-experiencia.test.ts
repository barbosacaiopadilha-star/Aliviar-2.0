import { describe, expect, it } from "vitest";

import {
  buildPerfilView,
  importanceLabel,
  mensagemPrincipal,
  PATIENT_FORBIDDEN_TERMS,
  STAGE_MESSAGES,
  violatesPatientVocabulary,
} from "@/modules/paciente/experiencia";
import { JORNADA_STAGES } from "@/modules/curadoria/jornada";

const PESOS_COMPLETOS = {
  FORMACAO: 30,
  EXPERIENCIA: 50,
  HISTORICO: 20,
  ACESSO: 30,
  CONTINUIDADE_DO_CUIDADO: 50,
  MODELO_DE_ATENDIMENTO: 20,
} as const;

describe("Importância — palavra, nunca cálculo", () => {
  it("o peso vira palavra e o número não atravessa", () => {
    expect(importanceLabel(50)).toBe("Muito importante");
    expect(importanceLabel(40)).toBe("Muito importante");
    expect(importanceLabel(30)).toBe("Importante");
    expect(importanceLabel(20)).toBe("Importante");
    expect(importanceLabel(10)).toBe("Considerado");
    expect(importanceLabel(0)).toBeNull();
  });

  it("o Perfil projetado não contém nenhum peso numérico", () => {
    const view = buildPerfilView(PESOS_COMPLETOS, true);
    const texto = JSON.stringify([view.tecnicas, view.modeloDeCuidado, view.headline]);
    for (const peso of ["20", "30", "50"]) {
      expect(texto, `peso numérico vazou: ${peso}`).not.toContain(peso);
    }
  });
});

describe("Construção do Perfil", () => {
  it("vazio: 0%, com a frase de começo de conversa", () => {
    const view = buildPerfilView({}, false);
    expect(view.progress).toBe(0);
    expect(view.headline).toContain("nasce da conversa");
    expect(view.tecnicas.every((item) => item.importance === null)).toBe(true);
  });

  it("em construção: progresso parcial e a frase de construção conjunta", () => {
    const view = buildPerfilView({ FORMACAO: 30, EXPERIENCIA: 50 }, false);
    expect(view.progress).toBe(29); // 2 de 7 passos
    expect(view.headline).toBe("Seu perfil está sendo construído junto com o Curador.");
  });

  it("completo sem validação não chega a 100 — falta o reconhecimento da pessoa", () => {
    const view = buildPerfilView(PESOS_COMPLETOS, false);
    expect(view.progress).toBe(86);
    expect(view.validated).toBe(false);
  });

  it("validado fecha em 100 e a frase muda de dono", () => {
    const view = buildPerfilView(PESOS_COMPLETOS, true);
    expect(view.progress).toBe(100);
    expect(view.headline).toContain("Este Perfil é seu");
  });

  it("os dois grupos falam o vocabulário oficial", () => {
    const view = buildPerfilView(PESOS_COMPLETOS, true);
    expect(view.tecnicas.map((item) => item.label)).toEqual([
      "Formação Profissional",
      "Experiência Profissional",
      "Histórico Profissional",
    ]);
    expect(view.modeloDeCuidado.map((item) => item.label)).toEqual([
      "Acesso",
      "Continuidade do Cuidado",
      "Modelo de Atendimento",
    ]);
  });
});

describe("Mensagem principal — uma por etapa, sempre sobre a história", () => {
  it("toda etapa da jornada tem mensagem", () => {
    for (const stage of JORNADA_STAGES) {
      expect(mensagemPrincipal(stage)).toBeTruthy();
    }
  });

  it("as frases-chave da experiência estão nas etapas certas", () => {
    expect(mensagemPrincipal("CURADORIA")).toBe(
      "Nossa equipe está comparando profissionais que respondam às prioridades que você definiu.",
    );
    expect(mensagemPrincipal("DOSSIE")).toContain("Sua Curadoria está pronta");
    expect(mensagemPrincipal("ESCOLHA")).toContain("decidir qual caminho faz mais sentido para você");
    expect(mensagemPrincipal("ACOMPANHAMENTO")).toBe("O Concierge assumiu o acompanhamento do seu caso.");
  });

  it("nenhuma mensagem viola o vocabulário do paciente", () => {
    for (const message of Object.values(STAGE_MESSAGES)) {
      expect(violatesPatientVocabulary(message), message).toBeNull();
    }
  });
});

describe("A fronteira de vocabulário", () => {
  it("pega nota, ranking, cobertura e mecanismo", () => {
    expect(violatesPatientVocabulary("Este caminho teve a maior nota")).toBe("nota");
    expect(violatesPatientVocabulary("ranking dos profissionais")).toBe("ranking");
    expect(violatesPatientVocabulary("Avaliação construída sobre 80 dos 100 pontos possíveis.")).toBe(
      "pontos possíveis",
    );
    expect(violatesPatientVocabulary("o motor comparou")).toBe("motor");
  });

  it("deixa passar a linguagem da experiência", () => {
    expect(violatesPatientVocabulary("Atende plenamente ao que você declarou como prioridade.")).toBeNull();
    expect(violatesPatientVocabulary("Ainda precisamos confirmar uma informação.")).toBeNull();
  });

  it("o Perfil inteiro passa pela própria fronteira", () => {
    const view = buildPerfilView(PESOS_COMPLETOS, true);
    expect(violatesPatientVocabulary(JSON.stringify(view))).toBeNull();
  });

  it("a lista cobre os termos que os dois cruzamentos usam internamente", () => {
    expect(PATIENT_FORBIDDEN_TERMS).toContain("coveredWeight");
    expect(PATIENT_FORBIDDEN_TERMS).toContain("internalScore");
  });
});
